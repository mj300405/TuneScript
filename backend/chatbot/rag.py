# backend/chatbot/rag.py

import logging
import os
import traceback
from functools import lru_cache
from typing import Dict, List

from langchain.document_loaders import TextLoader
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from transformers import AutoModelForQuestionAnswering, AutoTokenizer, pipeline

# Set up logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize embeddings
embeddings = HuggingFaceEmbeddings()

def load_and_process_documents(file_names: List[str]) -> List[Dict]:
    documents = []
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    for file_name in file_names:
        file_path = os.path.join(data_dir, file_name)
        if os.path.exists(file_path):
            logger.info(f"Loading file: {file_path}")
            loader = TextLoader(file_path)
            documents.extend(loader.load())
        else:
            logger.warning(f"File not found: {file_path}")

    logger.info(f"Loaded {len(documents)} documents")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    split_docs = text_splitter.split_documents(documents)
    logger.info(f"Split into {len(split_docs)} chunks")
    return split_docs

def initialize_vector_store(documents: List[Dict]) -> Chroma:
    logger.info(f"Initializing vector store with {len(documents)} documents...")
    try:
        store = Chroma.from_documents(documents, embeddings)
        logger.info("Vector store initialized successfully.")
        return store
    except Exception as e:
        logger.error(f"Error initializing vector store: {str(e)}")
        logger.error(traceback.format_exc())
        raise

class RAG:
    def __init__(self, file_paths: List[str]):
        logger.info("Initializing RAG system...")
        self.documents = load_and_process_documents(file_paths)
        self.vectorstore = initialize_vector_store(self.documents)
        self.qa_pipeline = None

    @lru_cache(maxsize=100)
    def get_cached_answer(self, question: str) -> str:
        return self.get_answer(question)

    def get_answer(self, question: str) -> str:
        try:
            if self.qa_pipeline is None:
                # Load local model and tokenizer
                model_name = "distilbert-base-uncased-distilled-squad"  # You can replace this with another model if needed
                tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
                model = AutoModelForQuestionAnswering.from_pretrained(model_name, local_files_only=True)

                # Initialize Hugging Face pipeline locally
                self.qa_pipeline = pipeline("question-answering", model=model, tokenizer=tokenizer)

            logger.info(f"Processing question: {question}")
            
            # Retrieve relevant documents from the vector store
            relevant_docs = self.vectorstore.similarity_search(question, k=1)  # Retrieve top 1 most relevant document
            
            if relevant_docs:
                context = relevant_docs[0].page_content  # Get the content of the most relevant document
            else:
                context = "No relevant context found."
            
            # Run the question-answering model
            response = self.qa_pipeline(question=question, context=context)
            logger.info(f"Answer generated successfully: {response['answer']}")
            return response['answer']
            
        except Exception as e:
            logger.error(f"Error in get_answer: {str(e)}")
            logger.error(traceback.format_exc())
            return "I'm sorry, I encountered an error while processing your question. Please try again."


    def query(self, question: str) -> str:
        return self.get_cached_answer(question)

    def update_knowledge(self, new_file_paths: List[str]):
        logger.info(f"Updating knowledge with {len(new_file_paths)} new files...")
        new_documents = load_and_process_documents(new_file_paths)
        self.documents.extend(new_documents)
        self.vectorstore = initialize_vector_store(self.documents)
        logger.info("Knowledge update completed.")

class MockRAG:
    def get_answer(self, question: str) -> str:
        logger.warning("MockRAG is being used. The main RAG system is unavailable.")
        return "I'm sorry, but I'm currently unavailable due to resource constraints. Please try again later or contact support."

    def query(self, question: str) -> str:
        return self.get_answer(question)

    def update_knowledge(self, new_file_paths: List[str]):
        logger.warning("MockRAG does not support knowledge updates.")
        pass

# Initialize the RAG system
file_names = ["app_guide.txt", "faq.txt", "feature_descriptions.txt"]

try:
    logger.info("Attempting to initialize RAG system...")
    rag_system = RAG(file_names)
    logger.info("RAG system initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing RAG system: {str(e)}")
    logger.error("Traceback:")
    logger.error(traceback.format_exc())
    logger.warning("Falling back to MockRAG.")
    rag_system = MockRAG()

# Export the rag_system for use in other modules
__all__ = ["rag_system"]
