import json
import time

from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from graphql_relay import from_global_id

from .models import Transcription


@require_GET
@csrf_exempt
def sse_stream(request, transcription_id):
    def event_stream():
        while True:
            try:
                # Convert global ID to database ID
                _, db_id = from_global_id(transcription_id)
                transcription = Transcription.objects.get(pk=db_id)
                midi_file = transcription.midifile_set.first()
                sheet_music = transcription.sheetmusic_set.first()

                data = {
                    "transcription_id": transcription_id,  # Use the global ID
                    "status": transcription.status,
                    "message": getattr(transcription, "error_message", "") or "",
                    "title": transcription.title,
                    "audio_file_name": (
                        transcription.audio_file.audio_file.name
                        if transcription.audio_file
                        else ""
                    ),
                    "midi_file_url": (
                        f"{settings.BASE_URL}{midi_file.midi_file.url}"
                        if midi_file
                        else None
                    ),
                    "sheet_music_url": (
                        f"{settings.BASE_URL}{sheet_music.pdf_file.url}"
                        if sheet_music
                        else None
                    ),
                }
                yield f"data: {json.dumps(data)}\n\n"

                if transcription.status in ["COMPLETED", "FAILED"]:
                    break

                time.sleep(5)  # Check every 5 seconds
            except Transcription.DoesNotExist:
                yield f"data: {json.dumps({'error': 'Transcription not found'})}\n\n"
                break

    response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response
