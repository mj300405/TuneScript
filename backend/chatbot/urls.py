# backend/chatbot/urls.py

from django.urls import path

from . import views

urlpatterns = [
    path("query/", views.chatbot_query, name="chatbot_query"),
    path("history/", views.get_conversation_history, name="conversation_history"),
]
