# backend/chatbot/views.py

import asyncio
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .conversation_handler import conversation_handler


@csrf_exempt
async def chatbot_query(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user_id = data.get("user_id")
        question = data.get("question")

        if not user_id or not question:
            return JsonResponse({"error": "Missing user_id or question"}, status=400)

        answer = await conversation_handler.handle_message(user_id, question)
        return JsonResponse({"answer": answer})

    return JsonResponse({"error": "Invalid request method"}, status=400)


@csrf_exempt
def get_conversation_history(request):
    if request.method == "GET":
        user_id = request.GET.get("user_id")
        if not user_id:
            return JsonResponse({"error": "Missing user_id"}, status=400)

        history = conversation_handler.get_conversation_history(user_id)
        return JsonResponse({"history": history})

    return JsonResponse({"error": "Invalid request method"}, status=400)
