from celery import shared_task
from .models import Transcription, AudioFile
import time

@shared_task
def process_transcription(transcription_id):
    transcription = Transcription.objects.get(id=transcription_id)
    # Simulate a long-running task
    time.sleep(10)  # Replace this with actual transcription processing logic
    transcription.status = 'COMPLETED'
    transcription.save()
    return f'Transcription {transcription.id} processed successfully'
