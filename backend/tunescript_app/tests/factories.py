import factory
from django.contrib.auth import get_user_model
from tunescript_app.models import (
    Profile, AudioFile, Transcription, Rating, Favorite,
    MIDIFile, SheetMusic, Tag, TranscriptionTag, UserPlayHistory
)

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    password = factory.PostGenerationMethodCall('set_password', 'password')
    email_confirmed = True

class ProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Profile

    user = factory.SubFactory(UserFactory)
    bio = factory.Faker('paragraph')
    public = factory.Faker('boolean')
    is_premium = False

class AudioFileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AudioFile

    user = factory.SubFactory(UserFactory)
    title = factory.Faker('sentence')
    audio_file = factory.django.FileField(filename='test_audio.mp3')

class TranscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Transcription

    audio_file = factory.SubFactory(AudioFileFactory)
    user = factory.SelfAttribute('audio_file.user')
    genre = factory.Faker('word')
    title = factory.Faker('sentence')
    composer = factory.Faker('name')
    player = factory.Faker('name')
    status = 'COMPLETED'
    public = factory.Faker('boolean')

class RatingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Rating

    user = factory.SubFactory(UserFactory)
    transcription = factory.SubFactory(TranscriptionFactory)
    rating = factory.Faker('random_int', min=1, max=5)

class FavoriteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Favorite

    user = factory.SubFactory(UserFactory)
    transcription = factory.SubFactory(TranscriptionFactory)

class MIDIFileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MIDIFile

    transcription = factory.SubFactory(TranscriptionFactory)
    midi_file = factory.django.FileField(filename='test_midi.mid')

class SheetMusicFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SheetMusic

    transcription = factory.SubFactory(TranscriptionFactory)
    pdf_file = factory.django.FileField(filename='test_sheet.pdf')

class TagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tag

    name = factory.Sequence(lambda n: f"tag{n}")

class TranscriptionTagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TranscriptionTag

    transcription = factory.SubFactory(TranscriptionFactory)
    tag = factory.SubFactory(TagFactory)

class UserPlayHistoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserPlayHistory

    user = factory.SubFactory(UserFactory)
    transcription = factory.SubFactory(TranscriptionFactory)
    play_time = factory.Faker('random_int', min=1, max=3600)
    play_count = factory.Faker('random_int', min=1, max=100)


class FavoriteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Favorite

    user = factory.SubFactory(UserFactory)
    transcription = factory.SubFactory(TranscriptionFactory)