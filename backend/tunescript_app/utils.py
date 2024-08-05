import subprocess
import tempfile
import os

from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

def convert_midi_to_pdf(midi_data, pdf_file_path):
    musescore_executable = "/usr/bin/musescore"

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mid") as tmp_midi:
        midi_file_path = tmp_midi.name
        tmp_midi.write(midi_data)
        tmp_midi.flush()

    xvfb_command = "xvfb-run -a"
    musescore_command = f"{musescore_executable} {midi_file_path} -o {pdf_file_path}"
    full_command = f"{xvfb_command} {musescore_command}"

    try:
        process = subprocess.run(full_command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print("MuseScore output:", process.stdout.decode())
        print("MuseScore errors:", process.stderr.decode())
        print(f"PDF successfully generated at: {pdf_file_path}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to convert MIDI to PDF: {e.stdout.decode()} {e.stderr.decode()}")
        raise
    finally:
        os.unlink(midi_file_path)


def send_confirmation_email(user):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    confirmation_url = f"{settings.EMAIL_URL}/confirm-email/{uid}/{token}"
    
    send_mail(
        "Please confirm your email address",
        f"Click the link below to confirm your email address:\n\n{confirmation_url}",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )