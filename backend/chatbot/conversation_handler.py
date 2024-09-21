# backend/chatbot/conversation_handler.py

from typing import Dict, List
from .rag import rag_system

class Message:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

    def to_dict(self):
        return {"role": self.role, "content": self.content}

class Conversation:
    def __init__(self):
        self.messages: List[Message] = []

class ConversationHandler:
    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}

    def handle_message(self, user_id: str, message: str) -> str:
        if user_id not in self.conversations:
            self.conversations[user_id] = Conversation()

        conversation = self.conversations[user_id]
        conversation.messages.append(Message(role="user", content=message))

        if rag_system is None:
            response = "I'm sorry, but I'm currently unavailable due to a system initialization error. Please try again later or contact support."
        else:
            response = rag_system.query(message)

        conversation.messages.append(Message(role="assistant", content=response))
        return response

    def get_conversation_history(self, user_id: str) -> List[Dict[str, str]]:
        if user_id in self.conversations:
            return [msg.to_dict() for msg in self.conversations[user_id].messages]
        return []

conversation_handler = ConversationHandler()