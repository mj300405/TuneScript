# backend/chatbot/conversation_handler.py

import asyncio
from typing import Dict, List

from pydantic import BaseModel

from .rag import rag_system


class Message(BaseModel):
    role: str
    content: str


class Conversation(BaseModel):
    messages: List[Message] = []


class ConversationHandler:
    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}

    async def handle_message(self, user_id: str, message: str) -> str:
        if user_id not in self.conversations:
            self.conversations[user_id] = Conversation()

        conversation = self.conversations[user_id]
        conversation.messages.append(Message(role="user", content=message))

        response = rag_system.query(message)

        conversation.messages.append(Message(role="assistant", content=response))
        return response

    def get_conversation_history(self, user_id: str) -> List[Dict[str, str]]:
        if user_id in self.conversations:
            return [msg.dict() for msg in self.conversations[user_id].messages]
        return []


conversation_handler = ConversationHandler()
