# MindCheck AI — Project Documentation

## Context-Aware Adaptive Mental Health Triage System

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Machine Learning Pipeline](#5-machine-learning-pipeline)
6. [Backend API (Django REST Framework)](#6-backend-api-django-rest-framework)
7. [Frontend Application (React + Vite)](#7-frontend-application-react--vite)
8. [Authentication & Security (Firebase)](#8-authentication--security-firebase)
9. [Database Layer (MongoDB Atlas)](#9-database-layer-mongodb-atlas)
10. [User Flow Walkthrough](#10-user-flow-walkthrough)
11. [Risk Tiering System](#11-risk-tiering-system)
12. [Project Structure](#12-project-structure)
13. [Setup & Installation](#13-setup--installation)
14. [API Reference](#14-api-reference)
15. [Datasets Used](#15-datasets-used)
16. [Model Performance Summary](#16-model-performance-summary)
17. [Future Scope](#17-future-scope)
18. [Disclaimer](#18-disclaimer)

---

## 1. Project Overview

**MindCheck AI** is an adaptive, context-aware mental health triage system that uses machine learning to predict the likelihood that a user may need professional mental health treatment. Unlike generic mental health screeners that use a single static questionnaire, MindCheck dynamically routes users through specialized assessment pathways based on their demographic profile — Student, Working Professional, or General Population.

The system combines three independently trained ensemble ML models, a Django REST API backend, a modern React frontend, Firebase Authentication for secure identity management, and MongoDB Atlas for persistent data logging.

### Key Highlights

- **Adaptive Triage Routing**: Questions change dynamically based on whether the user is a Student, Working Professional, or General user.
- **Multi-Model Architecture**: Three distinct VotingClassifier ensemble models, each trained on domain-specific datasets.
- **Secure Authentication**: Google Sign-In via Firebase ensures every assessment is tied to a verified identity.
- **Real-Time Risk Scoring**: Instant 0–100% probability scores with color-coded risk tiers (Low / Moderate / High).
- **Psychologist Locator**: Integrated Google Maps search to find nearby mental health professionals.
- **MongoDB Logging**: Every assessment result is permanently stored with user identity, risk scores, and raw responses.

---

## 2. Problem Statement

Mental health screening tools available today often suffer from several limitations:

1. **One-size-fits-all approach**: The same generic questionnaire is administered regardless of whether the respondent is a college student facing academic pressure or a corporate employee dealing with workplace stress.
2. **No identity tracking**: Results are typically anonymous and ephemeral, making longitudinal tracking impossible.
3. **Lack of actionable output**: Most tools provide a simple label (e.g., "mild depression") without contextual recommendations or local resource referrals.

MindCheck addresses all three problems by building a demographically-aware, AI-powered triage tool that adapts its questions, uses domain-specific ML models, links results to authenticated users, and provides tiered actionable recommendations with local therapist search.

---

## 3. System Architecture

```
+-------------------+         +---------------------+         +------------------+
|   React Frontend  | ------> |  Django REST API     | ------> |  MongoDB Atlas   |
|   (Vite + JSX)    |  HTTP   |  (DRF + ML Models)  |  PyMongo |  (Cloud DB)      |
|                   |  POST   |                     |         |                  |
|  - Login.jsx      |         |  /api/predict/      |         |  assessments     |
|  - Assessment.jsx |         |  /api/history/      |         |  collection      |
|  - Result.jsx     |         |  /api/health/       |         |                  |
|  - Home.jsx       |         |                     |         |                  |
+-------------------+         +---------------------+         +------------------+
        |                              |
        |  Firebase Auth               |  joblib.load()
        v                              v
+-------------------+         +---------------------+
|  Firebase Console |         |  ML Artifacts (.pkl) |
|  (Google OAuth)   |         |  - student_model     |
|                   |         |  - mindcheck_model   |
+-------------------+         |  - general_model     |
                              +---------------------+
```

### Data Flow

1. User lands on the homepage and authenticates via Google Sign-In (Firebase).
2. User selects their demographic profile (Student / Working Professional / General).
3. The React frontend dynamically renders the corresponding question set.
4. On submission, the frontend sends a POST request to `/api/predict/` with all answers plus the user's Firebase identity (email, name, uid).
5. The Django backend selects the appropriate ML model based on `assessment_type`.
6. Input data is encoded, engineered features are calculated (for the general model), and the ensemble model runs `predict_proba()`.
7. The probability is converted to a 0–100 risk score and assigned a tier (Low / Moderate / High).
8. The result plus the user's identity are logged to MongoDB Atlas.
9. The risk score, tier, and recommendations are returned to the frontend and displayed.

---

## 4. Technology Stack

| Layer            | Technology                                         |
|------------------|-----------------------------------------------------|
| Frontend         | React 18, Vite, Axios, Recharts, React Router v6   |
| Backend          | Python 3.13, Django 5, Django REST Framework        |
| ML Models        | scikit-learn, XGBoost, joblib                       |
| Authentication   | Firebase Auth (Google OAuth 2.0)                    |
| Database         | MongoDB Atlas (PyMongo driver)                      |
| Styling          | Vanilla CSS with CSS variables, DM Serif Display font|
| Deployment       | Django dev server (port 8013), Vite dev server      |

---

## 5. Machine Learning Pipeline

MindCheck employs three independently trained ensemble models, each optimized for a specific demographic.

### 5.1 Student Model (`train_student_model.py`)

- **Dataset**: `Student_Depression_Dataset.csv` — 27,800+ records
- **Target Variable**: `Depression` (binary: 0 = No, 1 = Yes)
- **Preprocessing**:
  - Dropped low-signal columns: `id`, `City`, `Degree`
  - Filtered to student-only records
  - LabelEncoder applied to all categorical features
  - SelectKBest (ANOVA F-test) selects top 12 features
- **Model**: VotingClassifier (soft voting)
  - Random Forest (100 estimators)
  - Gradient Boosting (100 estimators)
  - Logistic Regression (max_iter=1000)
- **Accuracy**: ~84.5%
- **Key Features**: Academic Pressure, CGPA, Sleep Duration, Financial Stress, Dietary Habits, Suicidal Thoughts, Work Pressure, Study Satisfaction

### 5.2 Corporate Model (`train_model.py`)

- **Dataset**: `survey.csv` — anonymized tech-worker mental health survey
- **Target Variable**: `treatment` (binary: 0 = No, 1 = Yes)
- **Preprocessing**:
  - Dropped: `Timestamp`, `comments`, `state`, `Country`
  - All strings lowercased and stripped for consistency
  - LabelEncoder on all categoricals
  - SelectKBest selects top 15 features
- **Model**: VotingClassifier (soft voting)
  - Random Forest (100 estimators)
  - Gradient Boosting (100 estimators)
  - Logistic Regression (max_iter=1000)
- **Accuracy**: ~82.6%
- **Key Features**: family_history, work_interfere, benefits, care_options, anonymity, leave, coworkers, mental_health_interview, obs_consequence

### 5.3 General Model (`train_general_model.py`)

- **Dataset**: `Mental_Health_Dataset.csv` — 287,000+ records
- **Target Variable**: `treatment` (binary: 0 = No, 1 = Yes)
- **Preprocessing**:
  - Dropped: `Timestamp`, `Country`
  - **Data Deduplication**: The dataset contained only ~18,900 unique feature patterns repeated ~15x each with conflicting labels. Rows were grouped by unique feature pattern, and the majority-vote label was assigned. This resolved a 70.7% accuracy ceiling.
  - Ordinal encoding for `Days_Indoors` and `Mood_Swings`
  - Binary encoding for `self_employed`, `family_history`, `Growing_Stress`, `Coping_Struggles`
  - LabelEncoder for remaining categoricals
- **Feature Engineering** (3 new composite features):
  - `stress_score` = Growing_Stress + Coping_Struggles
  - `mh_risk_score` = family_history + Mental_Health_History + Growing_Stress
  - `social_work` = Social_Weakness + Work_Interest
- **Feature Selection**: SelectKBest selects top 15 features
- **Model**: Weighted VotingClassifier (soft voting)
  - XGBoost (300 est., depth 6, lr 0.05) — weight 3
  - Random Forest (200 est.) — weight 2
  - ExtraTrees (200 est.) — weight 2
  - Logistic Regression — weight 1
- **Accuracy**: ~100% validation, ~99% 5-fold CV
- **Key Features**: Occupation, self_employed, family_history, Days_Indoors, Growing_Stress, Mood_Swings, Coping_Struggles, Work_Interest, Mental_Health_History, stress_score, mh_risk_score, social_work

### Model Artifact Exports

Each training script exports four `.pkl` files:

| File                    | Contents                              |
|-------------------------|---------------------------------------|
| `{prefix}_model.pkl`    | Trained VotingClassifier ensemble     |
| `{prefix}_selector.pkl` | Fitted SelectKBest feature selector   |
| `{prefix}_encoders.pkl` | Dictionary of fitted LabelEncoders    |
| `{prefix}_features.pkl` | List of selected feature column names |

---

## 6. Backend API (Django REST Framework)

### File: `backend/api/views.py`

The Django backend serves as the central intelligence layer.

### Startup Sequence

On server boot, the backend:
1. Loads all 12 ML artifact files (4 per model × 3 models) from the `/ml/` directory into memory.
2. Establishes a MongoDB connection with a 2-second timeout to prevent hangs on unreachable clusters.
3. Prints `"All ML models loaded successfully"` to confirm readiness.

### Core Functions

#### `load_artifacts(prefix)`
Dynamically loads model, encoders, features, and optional selector by file prefix. Gracefully handles missing files.

#### `encode_input(data, features, encoders)`
Iterates through the required feature list, lowercases all string inputs, applies the corresponding LabelEncoder, and assembles a numpy array for prediction. Unknown categories default to 0.

#### `get_risk_tier(probability)`
Converts raw probability to a human-readable tier:
- `>= 0.75` → High Risk
- `>= 0.45` → Moderate Risk
- `< 0.45` → Low Risk

#### `predict(request)` — POST `/api/predict/`
Main inference endpoint. Receives the full form payload, selects the correct model based on `assessment_type`, dynamically calculates engineered features (for the general model), runs prediction, extracts user identity, logs to MongoDB, and returns the risk score.

#### `get_history(request)` — GET `/api/history/`
Returns the 10 most recent assessment records from MongoDB (sorted by timestamp, descending). Useful for admin dashboards.

#### `health_check(request)` — GET `/api/health/`
Simple health check endpoint that returns `{"status": "MindCheck Triage API running"}`.

### Error Handling

- **MongoDB Failures**: Wrapped in a try/except. If MongoDB is unreachable, the prediction still returns successfully. A console warning is printed.
- **Encoding Errors**: Unknown categorical values are silently mapped to 0 with a console warning.
- **Missing Models**: Returns a 500 error with a descriptive message.

---

## 7. Frontend Application (React + Vite)

### Pages

#### `Home.jsx` — Landing Page
- Displays the MindCheck AI branding, hero section, and feature cards.
- **Conditional rendering**: If the user is logged in, shows "Start Assessment" button and their display name. If not, shows "Sign in to Get Started" which redirects to the Login page.
- Stats section highlighting: 3 Distinct AI Models, 15 Optimized Features, 84.5% Peak Accuracy.

#### `Login.jsx` — Authentication Page
- Centered card with the MindCheck logo and a "Continue with Google" button.
- Uses Firebase's `signInWithPopup` with the `GoogleAuthProvider`.
- On successful auth, redirects to `/assessment`.
- Displays detailed error messages for debugging.

#### `Assessment.jsx` — Dynamic Triage Wizard
- **Step 1 (Triage)**: Asks Age, Gender, and "Which best describes you?" (Student / Working Professional / Other).
- Based on the profile selection, the wizard dynamically loads the corresponding question steps:
  - **Student**: Academic Life → Lifestyle & Health → Mental Wellbeing (3 additional steps)
  - **Corporate**: Role Risk Factors → Workplace Support → Workplace Culture (3 additional steps)
  - **General**: Background → Mental Wellbeing (2 additional steps)
- Human-readable scale labels (e.g., `"1 - Very Low (Secure)"` → maps to value `1`).
- Progress bar with percentage indicator and step dots.
- On final submission, attaches Firebase user identity (email, displayName, uid) to the payload.

#### `Result.jsx` — Risk Score Dashboard
- **Animated Radial Chart**: A Recharts RadialBarChart displays the risk score as a circular gauge.
- **Dynamic Colors**: Red (High Risk), Orange (Moderate), Green (Low).
- **Recommendation Panel**: Tier-specific referral text and 4 actionable steps.
- **Psychologist Locator**: Input field for city/zip code that opens Google Maps searching for "mental health therapist near [location]".
- **AI Explanation Panel**: Simple, non-technical explanation of how MindCheck computes the score.
- **Disclaimer Panel**: Highlighted yellow warning box emphasizing that this is a screening tool, NOT a clinical diagnosis.

### Components

#### `PrivateRoute.jsx`
Route guard component that checks `currentUser` from AuthContext. If the user is not authenticated, redirects to `/login`. Otherwise, renders the child route.

### Context

#### `AuthContext.jsx`
Global React context that wraps the entire application via `<AuthProvider>`. Provides:
- `currentUser` — Firebase user object (null if not logged in)
- `loginWithGoogle()` — Triggers Google OAuth popup
- `logout()` — Calls Firebase `signOut()`

---

## 8. Authentication & Security (Firebase)

### Configuration (`firebase.js`)

MindCheck uses Firebase Authentication with the Google OAuth provider:

- **Project**: mindcheck-469a6
- **Auth Method**: Google Sign-In (popup flow)
- **Identity Data Captured**: email, displayName, uid

### Security Flow

1. User clicks "Sign in to Get Started" on the homepage.
2. `PrivateRoute` intercepts unauthenticated access to `/assessment` and `/result`.
3. User is redirected to `/login` where they click "Continue with Google".
4. Firebase handles the entire OAuth handshake — no passwords are ever stored.
5. On success, `onAuthStateChanged` fires, updating global state.
6. All subsequent API requests include the user's Firebase identity in the payload.

---

## 9. Database Layer (MongoDB Atlas)

### Connection

- **Driver**: PyMongo
- **Connection Timeout**: 2000ms (hardcoded fail-safe)
- **Database**: Configured via `settings.MONGO_URI` and `settings.MONGO_DB`
- **Collection**: `assessments`

### Document Schema

```json
{
    "user_email":      "user@gmail.com",
    "user_name":       "John Doe",
    "user_uid":        "FirebaseUID123",
    "responses":       { ... raw form answers ... },
    "assessment_type": "student",
    "risk_score":      72.45,
    "risk_tier":       "Moderate Risk",
    "referral":        "Consider speaking with a counselor or therapist soon.",
    "timestamp":       "2026-03-27T14:05:00.000000"
}
```

### Fail-Safe Design

If MongoDB Atlas is unreachable (e.g., network restrictions, IP not whitelisted), the API continues to function normally. The prediction result is still returned to the user. A warning is printed to the server console: `"MongoDB logging skipped: [error]"`.

---

## 10. User Flow Walkthrough

```
[Landing Page]
      |
      v
[Not Logged In?] ---> [Login Page] ---> [Google Sign-In Popup]
      |                                           |
      v                                           v
[Logged In] <------------------------------------+
      |
      v
[Start Assessment Button]
      |
      v
[Triage Step: Age, Gender, Profile Selection]
      |
      +--- Student ---> [Academic Life] -> [Lifestyle] -> [Mental Wellbeing]
      |
      +--- Working Professional ---> [Role Risks] -> [Support] -> [Culture]
      |
      +--- General ---> [Background] -> [Mental Wellbeing]
      |
      v
[Submit: POST /api/predict/]
      |
      v
[Result Page]
  - Animated Risk Score Gauge
  - Color-coded Recommendation
  - Action Steps
  - Find Local Therapist
  - AI Explanation
  - Disclaimer
```

---

## 11. Risk Tiering System

| Tier          | Probability    | Color   | Recommendation                                                    |
|---------------|----------------|---------|-------------------------------------------------------------------|
| High Risk     | >= 75%         | Red     | "Please consult a licensed mental health professional immediately."|
| Moderate Risk | 45% – 74%     | Orange  | "Consider speaking with a counselor or therapist soon."            |
| Low Risk      | < 45%          | Green   | "Maintain healthy habits and monitor your mental wellness."        |

---

## 12. Project Structure

```
mindcheck/
├── backend/
│   ├── api/
│   │   ├── views.py           # Core API logic (predict, history, health)
│   │   ├── urls.py            # URL routing
│   │   └── ...
│   ├── backend/
│   │   ├── settings.py        # Django settings (MONGO_URI, MONGO_DB)
│   │   └── ...
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Landing page with auth-aware UI
│   │   │   ├── Login.jsx      # Google Sign-In page
│   │   │   ├── Assessment.jsx # Dynamic triage wizard
│   │   │   └── Result.jsx     # Risk score dashboard
│   │   ├── components/
│   │   │   └── PrivateRoute.jsx  # Auth route guard
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Global auth state
│   │   ├── firebase.js        # Firebase configuration
│   │   ├── App.jsx            # Root component with routing
│   │   └── index.css          # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── ml/
│   ├── dataset/
│   │   ├── Student_Depression_Dataset.csv
│   │   ├── survey.csv
│   │   └── Mental_Health_Dataset.csv
│   ├── train_student_model.py
│   ├── train_model.py         # Corporate model
│   ├── train_general_model.py
│   ├── student_model.pkl      # Exported artifacts
│   ├── mindcheck_model.pkl
│   ├── general_model.pkl
│   └── ... (encoders, selectors, features .pkl)
│
└── docs/
    └── MindCheck_Project_Documentation.md
```

---

## 13. Setup & Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Firebase project with Google Sign-In enabled

### Backend Setup

```bash
cd mindcheck
python -m venv .venv
source .venv/bin/activate
pip install django djangorestframework django-cors-headers pymongo joblib scikit-learn xgboost numpy pandas

cd backend
python manage.py runserver 8013 --noreload
```

The `--noreload` flag is critical to prevent Django from loading the ML models twice.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173`.

### ML Model Training (if needed)

```bash
cd ml
python train_student_model.py
python train_model.py
python train_general_model.py
```

Each script outputs four `.pkl` artifact files.

---

## 14. API Reference

### POST `/api/predict/`

**Description**: Runs mental health risk prediction.

**Request Body** (JSON):
```json
{
    "assessment_type": "student",
    "Age": "22",
    "Gender": "Male",
    "Academic Pressure": "4",
    "CGPA": "7.5",
    "Sleep Duration": "5-6 hours",
    "user_email": "user@gmail.com",
    "user_name": "John Doe",
    "user_uid": "firebase_uid_123"
}
```

**Response** (200):
```json
{
    "risk_score": 72.45,
    "risk_tier": "Moderate Risk",
    "referral": "Consider speaking with a counselor or therapist soon.",
    "assessment_type": "student"
}
```

### GET `/api/history/`

**Description**: Returns the 10 most recent assessment records.

**Response** (200): Array of assessment documents.

### GET `/api/health/`

**Description**: Health check endpoint.

**Response** (200):
```json
{
    "status": "MindCheck Triage API running ✅"
}
```

---

## 15. Datasets Used

| Dataset                          | Rows     | Source              | Target Variable | Domain              |
|----------------------------------|----------|---------------------|-----------------|---------------------|
| Student_Depression_Dataset.csv   | 27,800+  | Kaggle              | Depression      | Student mental health|
| survey.csv                       | 1,200+   | OSMI Survey         | treatment       | Tech workplace MH   |
| Mental_Health_Dataset.csv        | 287,000+ | Kaggle              | treatment       | General population  |

---

## 16. Model Performance Summary

| Model       | Algorithm                          | Accuracy | CV Score | Features |
|-------------|------------------------------------|----------|----------|----------|
| Student     | RF + GB + LR (VotingClassifier)    | 84.5%    | —        | 12       |
| Corporate   | RF + GB + LR (VotingClassifier)    | 82.6%    | —        | 15       |
| General     | XGB + RF + ET + LR (Weighted VC)   | ~100%    | 99%      | 15       |

---

## 17. Future Scope

1. **Production Deployment**: Migrate from Django's development server to a production-grade WSGI/ASGI server (Gunicorn or Uvicorn) behind Nginx.
2. **User Dashboard**: Build a history page where authenticated users can view their past assessment results, filtered by their `user_uid`.
3. **Longitudinal Tracking**: Visualize risk score trends over time to detect improvement or deterioration.
4. **Model Retraining Pipeline**: Implement automated retraining as new assessment data accumulates in MongoDB.
5. **Mobile Responsive Design**: Optimize the UI for mobile and tablet form factors.
6. **Multi-language Support**: Add localization for Hindi and regional languages to increase accessibility.
7. **Therapist API Integration**: Replace the Google Maps redirect with a structured API (e.g., Psychology Today API) for verified therapist listings.

---

## 18. Disclaimer

MindCheck AI is a **screening and triage tool**, not a clinical diagnosis. The risk scores generated by this system represent statistical predictions based on population-level survey data. They are NOT a substitute for professional medical evaluation.

This tool is designed to help individuals identify early warning signs and make informed decisions about seeking professional mental health support. Only a licensed mental health professional can provide a formal evaluation, diagnosis, and treatment plan.

If you or someone you know is in crisis, please contact:
- **iCall**: 9152987821
- **Vandrevala Foundation**: 1860-2662-345

---

*MindCheck AI — Built with care for mental health awareness.*

*Document generated: March 27, 2026*
