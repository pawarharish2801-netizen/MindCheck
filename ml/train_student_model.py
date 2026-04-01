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
df = pd.read_csv('dataset/Student_Depression_Dataset.csv')
print(f" Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")

# ─────────────────────────────────────────
# 2. DROP LOW-SIGNAL COLUMNS
# ─────────────────────────────────────────
drop_cols = ['id', 'ID', 'City', 'Degree']
df.drop(columns=[c for c in drop_cols if c in df.columns], inplace=True)

# Only keep Students if mixed
if 'Profession' in df.columns:
    df = df[df['Profession'].str.lower().str.strip() == 'student']
    df.drop(columns=['Profession'], inplace=True)

# ─────────────────────────────────────────
# 3. CLEAN & STANDARDIZE
# ─────────────────────────────────────────
df.dropna(inplace=True)
df.columns = df.columns.str.strip()

for col in df.select_dtypes(include='object').columns:
    df[col] = df[col].str.strip().str.lower()

print(f" After cleaning: {df.shape[0]} rows")

# ─────────────────────────────────────────
# 4. TARGET VARIABLE
# ─────────────────────────────────────────
target_col = 'Depression'
if df[target_col].dtype == object:
    df[target_col] = df[target_col].map({'yes': 1, 'no': 0, '1': 1, '0': 0})
df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
df.dropna(subset=[target_col], inplace=True)
df[target_col] = df[target_col].astype(int)

print(f" Target distribution:\n{df[target_col].value_counts()}")

# ─────────────────────────────────────────
# 6. ENCODE ALL CATEGORICALS (including Sleep Duration & Dietary Habits)
# ─────────────────────────────────────────
le_dict = {}
for col in df.select_dtypes(include='object').columns:
    if col == target_col:
        continue
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    le_dict[col] = le

# ─────────────────────────────────────────
# 7. FEATURE SELECTION (top 12)
# ─────────────────────────────────────────
X = df.drop(columns=[target_col])
y = df[target_col]

selector = SelectKBest(f_classif, k=min(12, X.shape[1]))
X_selected = selector.fit_transform(X, y)
selected_cols = X.columns[selector.get_support()].tolist()
print(f" Top features: {selected_cols}")

# ─────────────────────────────────────────
# 8. TRAIN / TEST SPLIT
# ─────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_selected, y, test_size=0.2, random_state=42, stratify=y
)
print(f" Train: {len(X_train)} | Test: {len(X_test)}")

# ─────────────────────────────────────────
# 9. VOTING ENSEMBLE
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
# 10. EVALUATION
# ─────────────────────────────────────────
acc = accuracy_score(y_test, y_pred)
print(f"\n{'='*50}")
print(f"  STUDENT MODEL Accuracy: {acc * 100:.2f}%")
print(f"{'='*50}")
print(classification_report(y_test, y_pred, target_names=['No Depression', 'Depression']))

# ─────────────────────────────────────────
# 11. EXPORT
# ─────────────────────────────────────────
joblib.dump(ensemble,      'student_model.pkl')
joblib.dump(selector,      'student_selector.pkl')
joblib.dump(le_dict,       'student_encoders.pkl')
joblib.dump(selected_cols, 'student_features.pkl')

print("\n Student model artifacts exported!")
print("  student_model.pkl | student_selector.pkl | student_encoders.pkl | student_features.pkl")
