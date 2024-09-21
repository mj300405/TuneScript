# backend/chatbot/rag.py

import logging
from typing import List

# Set up logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

class SimpleRAG:
    def __init__(self, file_paths: List[str]):
        logger.info("Initializing SimpleRAG system...")
        self.file_paths = file_paths

    def get_answer(self, question: str) -> str:
        logger.info(f"Received question: {question}")
        return (
            "I'm sorry, but I'm currently operating in a limited capacity. "
            "The full question-answering system is temporarily unavailable. "
            "Please check back later or contact support for assistance."
        )

    def query(self, question: str) -> str:
        return self.get_answer(question)

    def update_knowledge(self, new_file_paths: List[str]):
        logger.info(f"Simulating knowledge update with {len(new_file_paths)} new files...")
        self.file_paths.extend(new_file_paths)
        logger.info("Simulated knowledge update completed.")

# Initialize the SimpleRAG system
file_names = ["app_guide.txt", "faq.txt", "feature_descriptions.txt"]

try:
    logger.info("Initializing SimpleRAG system...")
    rag_system = SimpleRAG(file_names)
    logger.info("SimpleRAG system initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing SimpleRAG system: {str(e)}")
    rag_system = None

# Export the rag_system for use in other modules
__all__ = ["rag_system"]