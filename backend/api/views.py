import joblib
import numpy as np
import os
from datetime import datetime
from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from pymongo import MongoClient
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from .chat_utils import get_groq_response

# ─────────────────────────────────────────
# LOAD ML ARTIFACTS
# ─────────────────────────────────────────
BASE = os.path.join(os.path.dirname(__file__), '..', '..', 'ml')

def load_artifacts(prefix):
    try:
        model = joblib.load(os.path.join(BASE, f'{prefix}_model.pkl'))
        encoders = joblib.load(os.path.join(BASE, f'{prefix}_encoders.pkl'))
        features = joblib.load(os.path.join(BASE, f'{prefix}_features.pkl'))
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
try:
    client     = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
    db         = client[settings.MONGO_DB]
    collection = db["assessments"]
    chat_collection = db["chat_sessions_v2"] 
except Exception as e:
    print(f"MongoDB Initial Connection Warning: {e}")
    client = None

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
        if isinstance(val, str): val = val.strip().lower()
        if col in encoders:
            le = encoders[col]
            try: val = le.transform([val])[0]
            except: val = 0
        else:
            try: val = float(val)
            except: val = 0
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

        if assessment_type == 'general':
            def get_val(k): return 1 if str(data.get(k, 'no')).strip().lower() == 'yes' else 0
            data['stress_score']  = get_val('Growing_Stress') + get_val('Coping_Struggles')
            data['mh_risk_score'] = get_val('family_history') + get_val('Mental_Health_History') + get_val('Growing_Stress')
            data['social_work']   = get_val('Social_Weakness') + get_val('Work_Interest')

        X = encode_input(data, features, encoders)
        prob        = model.predict_proba(X)[0][1]
        risk_tier, referral = get_risk_tier(prob)
        risk_score  = round(prob * 100, 2)

        user_email = data.pop('user_email', 'anonymous')
        user_name  = data.pop('user_name', 'anonymous')
        user_uid   = data.pop('user_uid', 'anonymous')

        try:
            record = {
                "user_uid": user_uid, "user_email": user_email, "user_name": user_name,
                "responses": data, "assessment_type": assessment_type,
                "risk_score": risk_score, "risk_tier": risk_tier, "referral": referral,
                "timestamp": datetime.utcnow().isoformat()
            }
            if collection: collection.insert_one(record)
        except Exception as mongo_err:
            print("MongoDB Persistence Error:", mongo_err)

        return Response({
            "risk_score": risk_score, "risk_tier": risk_tier, "referral": referral,
            "assessment_type": assessment_type
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

# ─────────────────────────────────────────
# CHATBOT ENDPOINTS
# ─────────────────────────────────────────
@api_view(['POST'])
def chat_stream(request):
    try:
        data = request.data
        user_uid = data.get('user_uid', 'anonymous')
        message  = data.get('message')
        location = data.get('location', 'Unknown Location')
        if not message: return Response({"error": "Message is required"}, status=400)

        messages = []
        context = f"User Location: {location}. "

        # Robust Database Lookups (Safe Mode)
        try:
            if chat_collection is not None:
                session = chat_collection.find_one({"user_uid": user_uid})
                if session: messages = session.get('messages', [])
            
            if collection is not None:
                latest = collection.find_one({"user_uid": user_uid}, sort=[("timestamp", -1)])
                if latest:
                    context = f"User recently scored {latest['risk_score']}% ({latest['risk_tier']}) in a {latest['assessment_type']} assessment."
        except Exception as mongo_err:
            print("MongoDB Fetch Warning (Streaming without history):", mongo_err)

        # Append user message
        messages.append({"role": "user", "content": message})
        
        def stream_generator():
            full_response = ""
            for chunk in get_groq_response(messages, user_context=context, stream=True):
                full_response += chunk
                yield chunk
            
            # Robust Persistence Fallback
            try:
                if chat_collection is not None:
                    messages.append({"role": "model", "content": full_response})
                    chat_collection.update_one(
                        {"user_uid": user_uid},
                        {"$set": {"messages": messages, "last_updated": datetime.utcnow().isoformat()}},
                        upsert=True
                    )
            except Exception as mongo_err:
                print("MongoDB Save Warning:", mongo_err)

        return StreamingHttpResponse(stream_generator(), content_type='text/plain')

    except Exception as e:
        print(f"Chat Stream Error: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def chat_endpoint(request):
    try:
        data = request.data
        user_uid = data.get('user_uid', 'anonymous')
        message  = data.get('message')
        location = data.get('location', 'Unknown Location')
        if not message: return Response({"error": "Message is required"}, status=400)

        messages = []
        context = f"User Location: {location}. "

        try:
            if chat_collection is not None:
                session = chat_collection.find_one({"user_uid": user_uid})
                if session: messages = session.get('messages', [])
            if collection is not None:
                latest = collection.find_one({"user_uid": user_uid}, sort=[("timestamp", -1)])
                if latest:
                    context = f"User recently scored {latest['risk_score']}% ({latest['risk_tier']}) in a {latest['assessment_type']} assessment."
        except: pass

        messages.append({"role": "user", "content": message})
        ai_response = get_groq_response(messages, user_context=context, stream=False)
        messages.append({"role": "model", "content": ai_response})
        
        try:
            if chat_collection is not None:
                chat_collection.update_one(
                    {"user_uid": user_uid},
                    {"$set": {"messages": messages, "last_updated": datetime.utcnow().isoformat()}},
                    upsert=True
                )
        except: pass
        
        return Response({"response": ai_response, "history": messages}, status=200)

    except Exception as e:
        print(f"Chat Error: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_chat_history(request):
    try:
        user_uid = request.query_params.get('user_uid')
        if not user_uid: return Response({"error": "user_uid is required"}, status=400)
        messages = []
        try:
            if chat_collection is not None:
                session = chat_collection.find_one({"user_uid": user_uid}, {'_id': 0})
                if session: messages = session.get('messages', [])
        except: pass
        return Response(messages, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_history(request):
    try:
        records = []
        try:
            if collection is not None: records = list(collection.find({}, {'_id': 0}).sort("timestamp", -1).limit(10))
        except: pass
        return Response(records, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_user_history(request):
    try:
        user_uid = request.query_params.get('user_uid')
        if not user_uid: return Response({"error": "user_uid is required"}, status=400)
        records = []
        try:
            if collection is not None: records = list(collection.find({"user_uid": user_uid}, {'_id': 0}).sort("timestamp", -1))
        except: pass
        return Response(records, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['DELETE'])
def clear_chat(request):
    try:
        user_uid = request.query_params.get('user_uid')
        if not user_uid: return Response({"error": "user_uid is required"}, status=400)
        
        try:
            if chat_collection is not None:
                chat_collection.delete_one({"user_uid": user_uid})
        except Exception as mongo_err:
            print("MongoDB Clear Error:", mongo_err)
            return Response({"error": "Database error while clearing history"}, status=500)
            
        return Response({"status": "Chat history cleared"}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def health_check(request):
    return Response({"status": "MindCheck Triage API running ✅"}, status=200)
