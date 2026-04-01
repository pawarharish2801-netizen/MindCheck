from pathlib import Path
import os
import environ

# Initialize environ
env = environ.Env()
# Read .env file if it exists
environ.Env.read_env(env_file=os.path.join(Path(__file__).resolve().parent.parent, '.env'))

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = env('SECRET_KEY', default='django-insecure-mindcheck-hackathon-2026-secret-key')

DEBUG = env.bool('DEBUG', default=False)

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['*'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mindcheck_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mindcheck_backend.wsgi.application'

# No Django ORM DB needed — using MongoDB via PyMongo directly
DATABASES = {}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

# ─────────────────────────────────────────
# CORS — Allow React frontend
# ─────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

# ─────────────────────────────────────────
# MongoDB Config
# ─────────────────────────────────────────
MONGO_URI = env('MONGO_URI', default="mongodb+srv://mindcheck:mindcheck123@cluster0.p8dqj5r.mongodb.net/mindcheck?retryWrites=true&w=majority&appName=Cluster0")
MONGO_DB  = env('MONGO_DB', default="mindcheck")

# ─────────────────────────────────────────
# Google AI Studio / Gemini
# ─────────────────────────────────────────
GOOGLE_API_KEY = env('GOOGLE_API_KEY', default=None)
GROQ_API_KEY  = env('GROQ_API_KEY', default=None)

# ─────────────────────────────────────────
# REST Framework
# ─────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ]
}