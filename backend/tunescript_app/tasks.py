# tunescript_app/tasks.py

from celery import shared_task
from piano_transcription_inference import PianoTranscription, sample_rate, load_audio
from .models import Transcription, MIDIFile, SheetMusic
from .utils import convert_midi_to_pdf
import tempfile
import os

@shared_task
def process_transcription(transcription_id):
    try:
        transcription = Transcription.objects.get(pk=transcription_id)
        audio_file = transcription.audio_file

        # Load audio
        audio, _ = load_audio(audio_file.audio_file.path, sr=sample_rate, mono=True)
        transcriptor = PianoTranscription(device='cpu')

        # Generate MIDI file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mid") as tmp_midi:
            midi_path = tmp_midi.name
            transcriptor.transcribe(audio=audio, midi_path=midi_path)

        # Save MIDI file to model
        with open(midi_path, 'rb') as midi_file:
            midi_instance = MIDIFile(transcription=transcription)
            midi_instance.midi_file.save(f"{transcription.title}.mid", midi_file)

        # Generate PDF from MIDI
        pdf_path = os.path.splitext(midi_path)[0] + '.pdf'
        with open(midi_path, 'rb') as midi_file:
            midi_data = midi_file.read()
        convert_midi_to_pdf(midi_data, pdf_path)

        # Save PDF file to model
        with open(pdf_path, 'rb') as pdf_file:
            sheet_music_instance = SheetMusic(transcription=transcription)
            sheet_music_instance.pdf_file.save(f"{transcription.title}.pdf", pdf_file)

        # Update transcription status
        transcription.status = 'COMPLETED'
        transcription.save()

        # Clean up temporary files
        os.remove(midi_path)
        os.remove(pdf_path)

    except Exception as e:
        transcription.status = 'FAILED'
        transcription.error_message = str(e)
        transcription.save()
        raise e
