# utils.py
import subprocess
import tempfile
import os

def convert_midi_to_pdf(midi_data, pdf_file_path):
    musescore_executable = "/usr/bin/musescore"

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mid") as tmp_midi:
        midi_file_path = tmp_midi.name
        tmp_midi.write(midi_data)
        tmp_midi.flush()

    command = [musescore_executable, midi_file_path, '-o', pdf_file_path]
    try:
        process = subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print("MuseScore output:", process.stdout.decode())
        print("MuseScore errors:", process.stderr.decode())
        print(f"PDF successfully generated at: {pdf_file_path}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to convert MIDI to PDF: {e.stdout.decode()} {e.stderr.decode()}")
    finally:
        os.unlink(midi_file_path)
