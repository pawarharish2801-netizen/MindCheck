from django.urls import path
from . import views

urlpatterns = [
    path('predict/',  views.predict,       name='predict'),
    path('history/',  views.get_history,   name='history'),
    path('health/',   views.health_check,  name='health'),
]
