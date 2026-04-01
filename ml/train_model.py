import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, VotingClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.metrics import classification_report, accuracy_score
import joblib
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────
# 1. LOAD DATASET
# ─────────────────────────────────────────
df = pd.read_csv('dataset/survey.csv')
print(f" Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")

# ─────────────────────────────────────────
# 2. DROP USELESS COLUMNS
# ─────────────────────────────────────────
df.drop(columns=['Timestamp', 'comments', 'state', 'Country'], inplace=True)

df['self_employed'].fillna('No', inplace=True)
df['work_interfere'].fillna('Sometimes', inplace=True)
df.dropna(inplace=True)

# ─────────────────────────────────────────
# 3. STANDARDIZE STRINGS
# ─────────────────────────────────────────
for col in df.select_dtypes(include='object').columns:
    df[col] = df[col].astype(str).str.strip().str.lower()

print(f" After cleaning: {df.shape[0]} rows")

# ─────────────────────────────────────────
# 5. ENCODE ALL CATEGORICAL COLUMNS
# ─────────────────────────────────────────
le_dict = {}
for col in df.select_dtypes(include='object').columns:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    le_dict[col] = le

# ─────────────────────────────────────────
# 6. FEATURE SELECTION
# ─────────────────────────────────────────
X = df.drop(columns=['treatment'])
y = df['treatment']

selector = SelectKBest(f_classif, k=15)
X_selected = selector.fit_transform(X, y)
selected_cols = X.columns[selector.get_support()].tolist()
print(f"Top 15 features selected: {selected_cols}")

# ─────────────────────────────────────────
# 7. TRAIN / TEST SPLIT
# ─────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_selected, y, test_size=0.2, random_state=42
)

# ─────────────────────────────────────────
# 8. ENSEMBLE MODEL (Voting Classifier)
# ─────────────────────────────────────────
rf  = RandomForestClassifier(n_estimators=100, random_state=42)
gb  = GradientBoostingClassifier(n_estimators=100, random_state=42)
lr  = LogisticRegression(max_iter=1000, random_state=42)

ensemble = VotingClassifier(
    estimators=[('rf', rf), ('gb', gb), ('lr', lr)],
    voting='soft'
)

ensemble.fit(X_train, y_train)
y_pred = ensemble.predict(X_test)

# ─────────────────────────────────────────
# 9. EVALUATION
# ─────────────────────────────────────────
acc = accuracy_score(y_test, y_pred)
print(f"\n Model Accuracy: {acc * 100:.2f}%")
print("\n Classification Report:")
print(classification_report(y_test, y_pred, target_names=['No Treatment', 'Needs Treatment']))

# ─────────────────────────────────────────
# 10. RISK TIER FUNCTION
# ─────────────────────────────────────────
def get_risk_tier(probability):
    if probability >= 0.75:
        return "High Risk", "Please consult a licensed mental health professional immediately."
    elif probability >= 0.45:
        return "Moderate Risk", "Consider speaking with a counselor or therapist soon."
    else:
        return "Low Risk", "Maintain healthy habits and monitor your mental wellness regularly."

# ─────────────────────────────────────────
# 11. EXPORT MODEL + ARTIFACTS
# ─────────────────────────────────────────
joblib.dump(ensemble,      'mindcheck_model.pkl')
joblib.dump(selector,      'mindcheck_selector.pkl')
joblib.dump(le_dict,       'mindcheck_encoders.pkl')
joblib.dump(selected_cols, 'mindcheck_features.pkl')

print("\n Model exported: mindcheck_model.pkl")
print(" Selector exported: mindcheck_selector.pkl")
print(" Encoders exported: mindcheck_encoders.pkl")
print(" Features exported: mindcheck_features.pkl")
print("\n MindCheck ML Pipeline Ready!")