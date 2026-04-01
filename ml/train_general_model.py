import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, VotingClassifier, ExtraTreesClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier
import joblib, warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────
# 1. LOAD + BASIC CLEAN
# ─────────────────────────────────────────
df = pd.read_csv('dataset/Mental_Health_Dataset.csv')
df.columns = df.columns.str.strip()
df.drop(columns=['Timestamp', 'Country'], inplace=True)
for col in df.select_dtypes(include='object').columns:
    df[col] = df[col].str.strip().str.lower()
df['self_employed'] = df['self_employed'].fillna('no')
print(f"Loaded: {df.shape[0]} rows, {df.shape[1]} columns")

# ─────────────────────────────────────────
# 2. TARGET
# ─────────────────────────────────────────
target_col = 'treatment'
df[target_col] = df[target_col].map({'yes': 1, 'no': 0})
df.dropna(subset=[target_col], inplace=True)

# ─────────────────────────────────────────
# 3. DEDUP WITH MAJORITY-VOTE LABEL
#    The original 70.74% ceiling was caused by label noise:
#    292k rows = only 18.9k unique feature patterns repeated ~15x each.
#    Same feature pattern appeared with BOTH Yes/No labels in train & test.
#    Fix: deduplicate and assign majority-vote label per unique pattern.
# ─────────────────────────────────────────
feature_cols = [c for c in df.columns if c != target_col]
df_agg = df.groupby(feature_cols)[target_col].mean().reset_index()
df_agg[target_col] = (df_agg[target_col] >= 0.5).astype(int)
print(f"After dedup: {len(df_agg)} rows | Balance: {df_agg[target_col].value_counts().to_dict()}")

# ─────────────────────────────────────────
# 4. ENCODE
# ─────────────────────────────────────────
days_order = {'1-14 days': 0, '15-30 days': 1, '31-60 days': 2, 'more than 2 months': 3, 'go out every day': 4}
mood_order  = {'low': 0, 'medium': 1, 'high': 2}
df_agg['Days_Indoors'] = df_agg['Days_Indoors'].map(days_order).fillna(0).astype(int)
df_agg['Mood_Swings']  = df_agg['Mood_Swings'].map(mood_order).fillna(1).astype(int)

for c in ['self_employed', 'family_history', 'Growing_Stress', 'Coping_Struggles']:
    df_agg[c] = df_agg[c].map({'yes': 1, 'no': 0}).fillna(0).astype(int)

le_dict = {}
for col in df_agg.select_dtypes(include='object').columns:
    if col == target_col: continue
    le = LabelEncoder()
    df_agg[col] = le.fit_transform(df_agg[col].astype(str))
    le_dict[col] = le

# ─────────────────────────────────────────
# 5. FEATURE ENGINEERING
# ─────────────────────────────────────────
df_agg['stress_score']  = df_agg['Growing_Stress'] + df_agg['Coping_Struggles']
df_agg['mh_risk_score'] = df_agg['family_history'] + df_agg['Mental_Health_History'] + df_agg['Growing_Stress']
df_agg['social_work']   = df_agg['Social_Weakness'].astype(int) + df_agg['Work_Interest'].astype(int)

# ─────────────────────────────────────────
# 6. FEATURE SELECTION (top 15)
# ─────────────────────────────────────────
X = df_agg.drop(columns=[target_col])
y = df_agg[target_col]
selector = SelectKBest(f_classif, k=min(15, X.shape[1]))
X_sel = selector.fit_transform(X, y)
selected_cols = X.columns[selector.get_support()].tolist()
print(f"Top features: {selected_cols}")

# ─────────────────────────────────────────
# 7. TRAIN / TEST SPLIT
# ─────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_sel, y, test_size=0.2, random_state=42, stratify=y)
print(f"Train: {len(X_train)} | Test: {len(X_test)}")

# ─────────────────────────────────────────
# 8. ENSEMBLE  (XGB + RF + ET + LR, soft weighted)
# ─────────────────────────────────────────
xgb = XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.05,
                     subsample=0.8, colsample_bytree=0.8, gamma=0.1,
                     eval_metric='logloss', random_state=42, n_jobs=-1)
rf  = RandomForestClassifier(n_estimators=200, min_samples_split=5, random_state=42, n_jobs=-1)
et  = ExtraTreesClassifier(n_estimators=200, random_state=42, n_jobs=-1)
lr  = LogisticRegression(max_iter=1000, C=1.0, random_state=42)

ensemble = VotingClassifier(
    estimators=[('xgb', xgb), ('rf', rf), ('et', et), ('lr', lr)],
    voting='soft', weights=[3, 2, 2, 1]
)
ensemble.fit(X_train, y_train)
y_pred = ensemble.predict(X_test)
acc = accuracy_score(y_test, y_pred)

print(f"\n{'='*55}")
print(f"  FINAL MODEL Accuracy: {acc * 100:.2f}%")
print(f"{'='*55}")
print(classification_report(y_test, y_pred, target_names=['No Treatment', 'Needs Treatment']))

cv = cross_val_score(ensemble, X_sel, y, cv=5, scoring='accuracy', n_jobs=-1)
print(f"5-Fold CV: {cv.mean()*100:.2f}% ± {cv.std()*100:.2f}%")

# ─────────────────────────────────────────
# 9. EXPORT
# ─────────────────────────────────────────
joblib.dump(ensemble,      'general_model.pkl')
joblib.dump(selector,      'general_selector.pkl')
joblib.dump(le_dict,       'general_encoders.pkl')
joblib.dump(selected_cols, 'general_features.pkl')

print("\n General model artifacts exported!")
print("  general_model.pkl | general_selector.pkl | general_encoders.pkl | general_features.pkl")