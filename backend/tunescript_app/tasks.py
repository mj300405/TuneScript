from celery import shared_task
from django.apps import apps
import time

@shared_task
def process_transcription(transcription_id):
    Transcription = apps.get_model('tunescript_app', 'Transcription')
    transcription = Transcription.objects.get(id=transcription_id)
    # Simulate a long-running task
    time.sleep(10)  # Replace this with actual transcription processing logic
    transcription.status = 'COMPLETED'
    transcription.save()
    return f'Transcription {transcription.id} processed successfully'
