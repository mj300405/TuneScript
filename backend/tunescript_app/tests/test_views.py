import json

import pytest
from django.test import Client
from django.urls import reverse
from graphql_relay import to_global_id

from tunescript_app.models import Transcription

from .factories import MIDIFileFactory, SheetMusicFactory, TranscriptionFactory


@pytest.mark.django_db
class TestSSEStream:
    def test_sse_stream_pending(self, client):
        transcription = TranscriptionFactory(status="PENDING")
        global_id = to_global_id("TranscriptionType", transcription.id)
        url = reverse("sse_stream", kwargs={"transcription_id": global_id})

        response = client.get(url)
        assert response.status_code == 200
        assert response["Content-Type"] == "text/event-stream"
        assert response["Cache-Control"] == "no-cache"
        assert response["X-Accel-Buffering"] == "no"

        content = next(response.streaming_content).decode()
        data = json.loads(content.split("data: ")[1])
        assert data["transcription_id"] == global_id
        assert data["status"] == "PENDING"

    def test_sse_stream_completed(self, client):
        transcription = TranscriptionFactory(status="COMPLETED")
        midi_file = MIDIFileFactory(transcription=transcription)
        sheet_music = SheetMusicFactory(transcription=transcription)
        global_id = to_global_id("TranscriptionType", transcription.id)
        url = reverse("sse_stream", kwargs={"transcription_id": global_id})

        response = client.get(url)
        content = next(response.streaming_content).decode()
        data = json.loads(content.split("data: ")[1])

        assert data["status"] == "COMPLETED"
        assert data["midi_file_url"] is not None
        assert data["sheet_music_url"] is not None

    def test_sse_stream_failed(self, client):
        transcription = TranscriptionFactory(status="FAILED")
        global_id = to_global_id("TranscriptionType", transcription.id)
        url = reverse("sse_stream", kwargs={"transcription_id": global_id})

        response = client.get(url)
        content = next(response.streaming_content).decode()
        data = json.loads(content.split("data: ")[1])

        assert data["status"] == "FAILED"
        # We're not checking for the error message here, as it might not be part of the model

    def test_sse_stream_not_found(self, client):
        non_existent_id = to_global_id("TranscriptionType", 999)
        url = reverse("sse_stream", kwargs={"transcription_id": non_existent_id})

        response = client.get(url)
        content = next(response.streaming_content).decode()
        data = json.loads(content.split("data: ")[1])

        assert "error" in data
        assert data["error"] == "Transcription not found"

    @pytest.mark.timeout(10)  # Set a timeout to prevent infinite loops
    def test_sse_stream_stops_on_completion(self, client):
        transcription = TranscriptionFactory(status="PENDING")
        global_id = to_global_id("TranscriptionType", transcription.id)
        url = reverse("sse_stream", kwargs={"transcription_id": global_id})

        response = client.get(url)

        # Simulate the transcription completing
        transcription.status = "COMPLETED"
        transcription.save()

        # Collect all streaming content
        content = b"".join(response.streaming_content)

        # Check that the stream ended
        assert b"COMPLETED" in content
