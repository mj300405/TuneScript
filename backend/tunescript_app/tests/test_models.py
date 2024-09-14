import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from .factories import (
    UserFactory, ProfileFactory, AudioFileFactory, TranscriptionFactory,
    RatingFactory, FavoriteFactory, MIDIFileFactory, SheetMusicFactory,
    TagFactory, TranscriptionTagFactory, UserPlayHistoryFactory
)
from tunescript_app.models import Rating

@pytest.mark.django_db
class TestUserModel:
    def test_user_creation(self):
        user = UserFactory()
        assert user.username
        assert user.email
        assert user.check_password('password')
        assert user.email_confirmed

    def test_user_str(self):
        user = UserFactory(username='testuser')
        assert str(user) == 'testuser'

@pytest.mark.django_db
class TestProfileModel:
    def test_profile_creation(self):
        profile = ProfileFactory()
        assert profile.user
        assert profile.bio
        assert isinstance(profile.public, bool)
        assert not profile.is_premium

    def test_activate_premium(self):
        profile = ProfileFactory()
        profile.activate_premium()
        assert profile.is_premium
        assert profile.premium_start_date
        assert profile.premium_end_date
        assert profile.premium_end_date > profile.premium_start_date

    def test_deactivate_premium(self):
        profile = ProfileFactory(is_premium=True, premium_start_date=timezone.now(), premium_end_date=timezone.now() + timedelta(days=30))
        profile.deactivate_premium()
        assert not profile.is_premium
        assert not profile.premium_start_date
        assert not profile.premium_end_date

    def test_get_profile_picture_url(self):
        profile = ProfileFactory()
        assert 'default_profile_picture.png' in profile.get_profile_picture_url()

@pytest.mark.django_db
class TestAudioFileModel:
    def test_audio_file_creation(self):
        audio_file = AudioFileFactory()
        assert audio_file.user
        assert audio_file.title
        assert audio_file.audio_file
        assert audio_file.uploaded_at

    def test_audio_file_str(self):
        audio_file = AudioFileFactory(title='Test Audio')
        assert str(audio_file) == 'Test Audio'

@pytest.mark.django_db
class TestTranscriptionModel:
    def test_transcription_creation(self):
        transcription = TranscriptionFactory()
        assert transcription.audio_file
        assert transcription.user
        assert transcription.title
        assert transcription.status in ['PENDING', 'COMPLETED', 'FAILED']

    def test_update_rating(self):
        transcription = TranscriptionFactory()
        transcription.update_rating(4)
        assert transcription.num_ratings == 1
        assert transcription.avg_rating == 4

    def test_update_rating_on_change(self):
        transcription = TranscriptionFactory(num_ratings=1, avg_rating=3)
        transcription.update_rating_on_change(3, 5)
        assert transcription.num_ratings == 1
        assert transcription.avg_rating == 5

    def test_recalculate_rating(self):
        transcription = TranscriptionFactory()
        RatingFactory.create_batch(3, transcription=transcription)
        transcription.recalculate_rating()
        assert transcription.num_ratings == 3
        assert 1 <= transcription.avg_rating <= 5

    def test_generate_share_token(self):
        transcription = TranscriptionFactory()
        token = transcription.generate_share_token()
        assert token
        assert transcription.share_token == token

@pytest.mark.django_db
class TestRatingModel:
    def test_rating_creation(self):
        rating = RatingFactory()
        assert rating.user
        assert rating.transcription
        assert 1 <= rating.rating <= 5
        assert rating.created_at
        assert rating.updated_at

    def test_rating_update(self):
        rating = RatingFactory(rating=3)
        old_updated_at = rating.updated_at
        rating.rating = 4
        rating.save()
        assert rating.rating == 4
        assert rating.updated_at > old_updated_at

    def test_rating_constraints(self):
        transcription = TranscriptionFactory()
        user = UserFactory()

        with pytest.raises(ValidationError):
            rating = Rating(user=user, transcription=transcription, rating=0)
            rating.full_clean()

        with pytest.raises(ValidationError):
            rating = Rating(user=user, transcription=transcription, rating=6)
            rating.full_clean()

@pytest.mark.django_db
class TestFavoriteModel:
    def test_favorite_creation(self):
        favorite = FavoriteFactory()
        assert favorite.user
        assert favorite.transcription
        assert favorite.created_at

    def test_favorite_str(self):
        favorite = FavoriteFactory()
        expected_str = f"User {favorite.user}'s favorite {favorite.transcription.title}"
        assert str(favorite) == expected_str

@pytest.mark.django_db
class TestMIDIFileModel:
    def test_midi_file_creation(self):
        midi_file = MIDIFileFactory()
        assert midi_file.transcription
        assert midi_file.midi_file
        assert midi_file.generated_at

    def test_midi_file_str(self):
        midi_file = MIDIFileFactory()
        expected_str = f"MIDI for {midi_file.transcription.audio_file.title}"
        assert str(midi_file) == expected_str

@pytest.mark.django_db
class TestSheetMusicModel:
    def test_sheet_music_creation(self):
        sheet_music = SheetMusicFactory()
        assert sheet_music.transcription
        assert sheet_music.pdf_file
        assert sheet_music.generated_at

    def test_sheet_music_str(self):
        sheet_music = SheetMusicFactory()
        expected_str = f"Sheet Music for {sheet_music.transcription.audio_file.title}"
        assert str(sheet_music) == expected_str

@pytest.mark.django_db
class TestTagModel:
    def test_tag_creation(self):
        tag = TagFactory()
        assert tag.name

    def test_tag_str(self):
        tag = TagFactory(name='Jazz')
        assert str(tag) == 'Jazz'

@pytest.mark.django_db
class TestTranscriptionTagModel:
    def test_transcription_tag_creation(self):
        transcription_tag = TranscriptionTagFactory()
        assert transcription_tag.transcription
        assert transcription_tag.tag

@pytest.mark.django_db
class TestUserPlayHistoryModel:
    def test_user_play_history_creation(self):
        play_history = UserPlayHistoryFactory()
        assert play_history.user
        assert play_history.transcription
        assert play_history.play_time >= 0
        assert play_history.last_played
        assert play_history.play_count >= 0

    def test_user_play_history_str(self):
        play_history = UserPlayHistoryFactory()
        expected_str = f"{play_history.user.username} - {play_history.transcription.title}"
        assert str(play_history) == expected_str