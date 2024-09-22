from flask import Flask, request, jsonify
import logging
import time
import traceback
from .rag import rag, logger
import json
import threading
import uuid

app = Flask(__name__)

tasks = {}

@app.route('/query', methods=['POST'])
def query():
    data = request.json
    question = data.get('question')
    
    if not question:
        return jsonify({"error": "No question provided"}), 400
    
    task_id = str(uuid.uuid4())
    
    def process_question():
        try:
            start_time = time.time()
            answer = rag.answer_question(question)
            end_time = time.time()
            processing_time = end_time - start_time
            logger.info(f"Query processed in {processing_time:.2f} seconds")
            tasks[task_id] = {
                'status': 'completed',
                'answer': answer,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error processing question: {str(e)}")
            logger.error(traceback.format_exc())
            tasks[task_id] = {
                'status': 'error',
                'error': str(e)
            }

    threading.Thread(target=process_question).start()
    
    return jsonify({"task_id": task_id})

@app.route('/status/<task_id>', methods=['GET'])
def get_status(task_id):
    task = tasks.get(task_id)
    if not task:
        return jsonify({"status": "not_found"}), 404
    
    if task['status'] == 'completed':
        # Remove the task from memory after it's been retrieved
        task_copy = task.copy()
        del tasks[task_id]
        return jsonify(task_copy)
    
    return jsonify({"status": task['status']})

if __name__ == '__main__':
    logger.info("Starting Flask server...")
    app.run(host='0.0.0.0', port=5000)