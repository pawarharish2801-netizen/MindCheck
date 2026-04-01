import joblib
import numpy as np
import os
from datetime import datetime
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from pymongo import MongoClient

# ─────────────────────────────────────────
# LOAD ML ARTIFACTS
# ─────────────────────────────────────────
BASE = os.path.join(os.path.dirname(__file__), '..', '..', 'ml')

def load_artifacts(prefix):
    try:
        model = joblib.load(os.path.join(BASE, f'{prefix}_model.pkl'))
        encoders = joblib.load(os.path.join(BASE, f'{prefix}_encoders.pkl'))
        features = joblib.load(os.path.join(BASE, f'{prefix}_features.pkl'))
        # Selector is optional (only corporate uses it currently)
        selector_path = os.path.join(BASE, f'{prefix}_selector.pkl')
        selector = joblib.load(selector_path) if os.path.exists(selector_path) else None
        return model, encoders, features, selector
    except Exception as e:
        print(f"Failed to load {prefix} models: {e}")
        return None, None, None, None

MODELS = {
    'corporate': load_artifacts('mindcheck'),
    'student':   load_artifacts('student'),
    'general':   load_artifacts('general'),
}

print("✅ All ML models loaded successfully")

# ─────────────────────────────────────────
# MONGODB CONNECTION
# ─────────────────────────────────────────
client     = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
db         = client[settings.MONGO_DB]
collection = db["assessments"]

# ─────────────────────────────────────────
# RISK TIER HELPER
# ─────────────────────────────────────────
def get_risk_tier(probability):
    if probability >= 0.75:
        return "High Risk",   "Please consult a licensed mental health professional immediately."
    elif probability >= 0.45:
        return "Moderate Risk", "Consider speaking with a counselor or therapist soon."
    else:
        return "Low Risk",    "Maintain healthy habits and monitor your mental wellness regularly."

# ─────────────────────────────────────────
# ENCODE INPUT
# ─────────────────────────────────────────
def encode_input(data, features, encoders):
    encoded = []
    for col in features:
        val = data.get(col, None)
        # Always lowercase + strip strings to match training data format
        if isinstance(val, str):
            val = val.strip().lower()
        if col in encoders:
            le = encoders[col]
            try:
                val = le.transform([val])[0]
            except Exception as e:
                print(f"Encoding Error ({col}={val}): {e}")
                val = 0
        else:
            try:
                val = float(val)
            except:
                val = 0
        encoded.append(val)
    return np.array(encoded).reshape(1, -1)

# ─────────────────────────────────────────
# PREDICT ENDPOINT
# ─────────────────────────────────────────
@api_view(['POST'])
def predict(request):
    try:
        data = request.data
        assessment_type = data.get('assessment_type', 'corporate') 
        
        if assessment_type not in MODELS:
            return Response({"error": "Invalid assessment type"}, status=400)
            
        model, encoders, features, selector = MODELS[assessment_type]
        if not model:
             return Response({"error": f"Model artifacts for {assessment_type} not found"}, status=500)

        # Encode features (already extracts exact selected_cols)
        X = encode_input(data, features, encoders)
        
        # Predict
        prob        = model.predict_proba(X)[0][1]
        risk_tier, referral = get_risk_tier(prob)
        risk_score  = round(prob * 100, 2)

        # Save to MongoDB
        record = {
            "responses":   data,
            "assessment_type": assessment_type,
            "risk_score":  risk_score,
            "risk_tier":   risk_tier,
            "referral":    referral,
            "timestamp":   datetime.utcnow().isoformat()
        }
        try:
            collection.insert_one(record)
        except Exception as mongo_err:
            print("MongoDB logging skipped:", mongo_err)

        return Response({
            "risk_score": risk_score,
            "risk_tier":  risk_tier,
            "referral":   referral,
            "assessment_type": assessment_type
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

# ─────────────────────────────────────────
# HISTORY ENDPOINT
# ─────────────────────────────────────────
@api_view(['GET'])
def get_history(request):
    try:
        records = list(collection.find({}, {'_id': 0}).sort("timestamp", -1).limit(10))
        return Response(records, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────
@api_view(['GET'])
def health_check(request):
    return Response({"status": "MindCheck Triage API running ✅"}, status=200)
