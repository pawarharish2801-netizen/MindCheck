from django.urls import path
from . import views

urlpatterns = [
    path('predict/',  views.predict,       name='predict'),
    path('history/',  views.get_history,   name='history'),
    path('health/',   views.health_check,  name='health'),
    # New Endpoints
    path('user-history/', views.get_user_history, name='user_history'),
    path('chat/',         views.chat_endpoint,     name='chat'),
    path('chat-stream/',  views.chat_stream,       name='chat_stream'),
    path('chat-history/', views.get_chat_history,  name='chat_history'),
    path('clear-chat/',   views.clear_chat,        name='clear_chat'),
]






