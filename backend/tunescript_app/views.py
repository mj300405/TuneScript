from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json
from .models import Transcription
from django.views.decorators.http import require_GET
import time
from django.conf import settings

@method_decorator(csrf_exempt, name='dispatch')
class WebhookView(View):
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            transcription_id = data.get('transcription_id')
            status = data.get('status')
            message = data.get('message')
            
            if transcription_id and status:
                transcription = Transcription.objects.get(id=transcription_id)
                transcription.status = status
                transcription.save()

            return JsonResponse({'status': 'success', 'message': message})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@require_GET
@csrf_exempt
def sse_stream(request, transcription_id):
    def event_stream():
        while True:
            try:
                transcription = Transcription.objects.get(pk=transcription_id)
                midi_file = transcription.midifile_set.first()
                sheet_music = transcription.sheetmusic_set.first()
                
                data = {
                    'transcription_id': transcription.id,
                    'status': transcription.status,
                    'message': getattr(transcription, 'error_message', '') or '',
                    'title': transcription.title,
                    'audio_file_name': transcription.audio_file.audio_file.name if transcription.audio_file else '',
                    'midi_file_url': f"{settings.BASE_URL}{midi_file.midi_file.url}" if midi_file else None,
                    'sheet_music_url': f"{settings.BASE_URL}{sheet_music.pdf_file.url}" if sheet_music else None,
                }
                yield f"data: {json.dumps(data)}\n\n"
                
                if transcription.status in ['COMPLETED', 'FAILED']:
                    break
                
                time.sleep(5)  # Check every 5 seconds
            except Transcription.DoesNotExist:
                yield f"data: {json.dumps({'error': 'Transcription not found'})}\n\n"
                break

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response