from celery import shared_task
from piano_transcription_inference import PianoTranscription, sample_rate, load_audio
from .models import Transcription, MIDIFile, SheetMusic
from .utils import convert_midi_to_pdf
import tempfile
import os
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_transcription(transcription_id):
    try:
        transcription = Transcription.objects.get(pk=transcription_id)
        audio_file = transcription.audio_file

        logger.info(f"Transcription object: {transcription}")
        logger.info(f"Audio file object: {audio_file}")
        if audio_file.audio_file:
            file_path = audio_file.audio_file.path
            logger.info(f"Audio file path property: {file_path}")
            logger.info(f"Audio file name: {audio_file.audio_file.name}")
        else:
            logger.error("Audio file path property is None")
            raise OSError("Audio file path property is None")

        file_path = audio_file.audio_file.path
        logger.info(f"Processing audio file at: {file_path}")

        if not os.path.exists(file_path):
            raise OSError(f'File not found: {file_path}')
        
        logger.info(f"File exists: {file_path}")

        audio, _ = load_audio(file_path, sr=sample_rate, mono=True)
        transcriptor = PianoTranscription(device='cpu')

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mid") as tmp_midi:
            midi_path = tmp_midi.name
            transcriptor.transcribe(audio=audio, midi_path=midi_path)
            logger.info(f"MIDI file generated at: {midi_path}")

        with open(midi_path, 'rb') as midi_file:
            midi_instance = MIDIFile(transcription=transcription)
            midi_instance.midi_file.save(f"{transcription.title}.mid", midi_file)

        pdf_path = os.path.splitext(midi_path)[0] + '.pdf'
        with open(midi_path, 'rb') as midi_file:
            midi_data = midi_file.read()
        convert_midi_to_pdf(midi_data, pdf_path)

        with open(pdf_path, 'rb') as pdf_file:
            sheet_music_instance = SheetMusic(transcription=transcription)
            sheet_music_instance.pdf_file.save(f"{transcription.title}.pdf", pdf_file)

        transcription.status = 'COMPLETED'
        transcription.save()

        os.remove(midi_path)
        os.remove(pdf_path)
        logger.info(f"Temporary files cleaned up: {midi_path}, {pdf_path}")

    except Exception as e:
        transcription.status = 'FAILED'
        transcription.error_message = str(e)
        transcription.save()
        logger.error(f"Transcription failed: {str(e)}")
        raise e
