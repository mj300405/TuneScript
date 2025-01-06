import os
from typing import List, Dict
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from rank_bm25 import BM25Okapi
import logging
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAG:
    def __init__(self, data_dir: str):
        self.device = 'cpu'
        logger.info("Initializing RAG system...")
        
        logger.info("Loading sentence transformer model...")
        self.encoder = SentenceTransformer('paraphrase-MiniLM-L3-v2', device=self.device)
        
        logger.info("Loading TinyLlama model and tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained("TinyLlama/TinyLlama-1.1B-Chat-v1.0")
        self.model = AutoModelForCausalLM.from_pretrained(
            "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True
        ).to(self.device)
        self.model.eval()
        
        logger.info("Loading and preprocessing documents...")
        self.documents = self.load_and_preprocess_documents(data_dir)
        
        logger.info("Encoding documents...")
        self.document_embeddings = self.encode_documents()
        
        logger.info("Initializing TF-IDF vectorizer...")
        self.tfidf_vectorizer = TfidfVectorizer()
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform([doc['content'] for doc in self.documents])
        
        logger.info("Initializing BM25...")
        self.bm25 = BM25Okapi([doc['content'].split() for doc in self.documents])
        
        logger.info("RAG system initialized successfully.")

    def load_and_preprocess_documents(self, data_dir: str) -> List[Dict[str, str]]:
        documents = []
        for filename in os.listdir(data_dir):
            if filename.endswith('.txt'):
                with open(os.path.join(data_dir, filename), 'r', encoding='utf-8') as f:
                    content = f.read()
                    documents.append({
                        'id': filename,
                        'content': content[:1000]
                    })
        return documents

    def encode_documents(self) -> np.ndarray:
        return self.encoder.encode([doc['content'] for doc in self.documents])

    def get_relevant_documents(self, query: str, k: int = 2) -> List[Dict[str, str]]:
        query_embedding = self.encoder.encode([query])
        
        semantic_scores = np.dot(query_embedding, self.document_embeddings.T)[0]
        semantic_top_k = semantic_scores.argsort()[-k:][::-1]
        
        bm25_scores = self.bm25.get_scores(query.split())
        bm25_top_k = bm25_scores.argsort()[-k:][::-1]
        
        combined_indices = list(set(semantic_top_k) | set(bm25_top_k))
        return [self.documents[i] for i in combined_indices]

    def answer_question(self, question: str) -> str:
        relevant_docs = self.get_relevant_documents(question, k=3)
        context = "\n\n".join([doc['content'] for doc in relevant_docs])

        prompt = f"Answer the following question based on the provided context.\n\nContext:\n{context}\n\nQuestion:\n{question}\n\nAnswer:"

        inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024).to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=150,
                num_return_sequences=1,
                do_sample=True,
                temperature=0.7,
                top_p=0.95,
            )

        full_response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Extract and clean the response
        answer = self.clean_response(full_response, prompt)

        logger.info(f"Clean response: {answer}")

        return answer

    def clean_response(self, response: str, prompt: str) -> str:
        # Remove the prompt from the response
        answer = response[len(prompt):].strip()

        # Remove any leading 'Answer:' if present
        if answer.lower().startswith('answer:'):
            answer = answer[7:].strip()

        return answer

# Initialize the RAG system
try:
    logger.info("Starting RAG system initialization...")
    rag = RAG(data_dir='/app/data')
    logger.info("RAG system initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize RAG system: {str(e)}")
    raise