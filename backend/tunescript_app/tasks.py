import logging
import os
import tempfile

import yt_dlp
from celery import shared_task
from django.core.files import File
from piano_transcription_inference import (PianoTranscription, load_audio,
                                           sample_rate)

from .models import AudioFile, MIDIFile, SheetMusic, Transcription
from .utils import convert_midi_to_pdf

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def download_youtube_audio(self, youtube_url, audio_file_id, transcription_id):
    try:
        audio_file = AudioFile.objects.get(id=audio_file_id)

        ydl_opts = {
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
            "outtmpl": "%(title)s.%(ext)s",
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            filename = ydl.prepare_filename(info).replace(".webm", ".mp3")

        with open(filename, "rb") as f:
            audio_file.audio_file.save(os.path.basename(filename), File(f))

        audio_file.save()

        os.remove(filename)

        # Trigger transcription process
        process_transcription.delay(transcription_id)

    except Exception as e:
        logger.error(f"Error downloading YouTube audio: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def process_transcription(self, transcription_id):
    try:
        transcription = Transcription.objects.get(pk=transcription_id)
        audio_file = transcription.audio_file

        logger.info(f"Processing audio file at: {audio_file.audio_file.path}")

        # Load audio
        audio, _ = load_audio(audio_file.audio_file.path, sr=sample_rate, mono=True)
        transcriptor = PianoTranscription(device="cpu")

        # Generate MIDI file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mid") as tmp_midi:
            midi_path = tmp_midi.name
            transcriptor.transcribe(audio=audio, midi_path=midi_path)
            logger.info(f"MIDI file generated at: {midi_path}")

        # Save MIDI file to model
        with open(midi_path, "rb") as midi_file:
            midi_instance = MIDIFile(transcription=transcription)
            midi_instance.midi_file.save(f"{transcription.title}.mid", midi_file)
            os.chmod(midi_instance.midi_file.path, 0o644)  # Set file permissions

        # Generate PDF from MIDI
        pdf_path = os.path.splitext(midi_path)[0] + ".pdf"
        with open(midi_path, "rb") as midi_file:
            midi_data = midi_file.read()
        convert_midi_to_pdf(midi_data, pdf_path)

        # Save PDF file to model
        with open(pdf_path, "rb") as pdf_file:
            sheet_music_instance = SheetMusic(transcription=transcription)
            sheet_music_instance.pdf_file.save(f"{transcription.title}.pdf", pdf_file)
            os.chmod(sheet_music_instance.pdf_file.path, 0o644)  # Set file permissions

        # Update transcription status
        transcription.status = "COMPLETED"
        transcription.save()

        midi_url = midi_instance.midi_file.url if midi_instance else None
        sheet_music_url = (
            sheet_music_instance.pdf_file.url if sheet_music_instance else None
        )

        # Clean up temporary files
        os.remove(midi_path)
        os.remove(pdf_path)
        logger.info(f"Temporary files cleaned up: {midi_path}, {pdf_path}")

    except Exception as e:
        transcription.status = "FAILED"
        logger.error(f"Transcription {transcription_id} failed: {str(e)}")
        transcription.save()

        try:
            self.retry(exc=e, countdown=60)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for transcription {transcription_id}")
        raise e


# Ensure all tasks are imported at the module level
__all__ = ["download_youtube_audio", "process_transcription"]
