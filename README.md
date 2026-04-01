# MindCheck
**🌸 Adaptive Mental Health Triage powered by Groq Llama-3.3**

**Empowering Mental Wellness through Context-Aware ML and Real-Time AI Empathy.**

MindCheck is an advanced mental health screening platform designed to bridge the gap between initial distress and professional care. It uses a dual-engine architecture: an **Ensemble Machine Learning** triage system for objective risk assessment and a **Location-Aware Groq AI** for immediate, empathetic support.

---

## 🌟 Key Features

### 1. Adaptive ML Triage Engine
- **Ensemble Intelligence**: A voting classifier combining Random Forest, Gradient Boosting, and Logistic Regression for clinical-grade precision (84.5% Peak Accuracy).
- **Contextual Pipelines**: Dynamically switches between **Student**, **Corporate**, and **General** assessment models based on your life stage.
- **Privacy First**: All diagnostic data is processed anonymously for evaluation.

### 2. Location-Aware AI (Llama-3.3) 🛰️
- **Extreme Speed**: Powered by **Groq LPUs**, providing near-instant word-by-word streaming responses.
- **Spatial Empathy**: The AI detects your city and country via IP-based geolocation to provide localized greetings and cultural context.
- **Regional Safety**: If a crisis is detected, the AI prioritizes providing emergency resources and hotlines specific to your detected country.

### 3. Premium Glassmorphic UI ✨
- **Fluid UX**: A state-of-the-art interface featuring glassmorphic blur, modern typography (Google Fonts), and smooth CSS animations.
- **Markdown Support**: AI responses are beautifully rendered using Markdown for clarity and impact.
- **History Management**: Secure persistence in MongoDB Atlas with a "Clear Conversation" control for user privacy.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Firebase Auth, Axios, React-Markdown |
| **Backend** | Django, Django REST Framework (DRF) |
| **AI Brain** | Groq Llama-3.1-70b-versatile, OpenAI-SDK |
| **Databases** | MongoDB Atlas (Sessions), Firebase (Auth) |
| **ML Core** | Scikit-Learn, Joblib, Numpy |

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- [Groq API Key](https://console.groq.com/)
- [MongoDB Atlas URI](https://www.mongodb.com/products/platform/atlas-database)
- Firebase Project Config

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 8013
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡️ Security & Configuration

Create a `.env` file in the `backend/` directory:
```env
GROQ_API_KEY=your_groq_key
MONGO_URI=your_mongodb_uri
MONGO_DB=mindcheck
```

Create a `firebase.js` in `frontend/src/` with your Firebase config.
