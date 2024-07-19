# backend/tunescript_app/types.py

import graphene
from graphene_django.types import DjangoObjectType
from .models import Profile, AudioFile, Transcription, Favorite, MIDIFile, SheetMusic, Tag, TranscriptionTag, Rating
from django.contrib.auth import get_user_model
from graphene import String
from django.conf import settings
from django.templatetags.static import static

class UserType(DjangoObjectType):
    class Meta:
        model = get_user_model()

class ProfileType(DjangoObjectType):
    class Meta:
        model = Profile
        fields = ('id', 'user', 'bio', 'preferences', 'public', 'is_premium', 'premium_start_date', 'premium_end_date')

    is_premium = graphene.Boolean()
    premium_start_date = graphene.DateTime()
    premium_end_date = graphene.DateTime()
    profile_picture = graphene.String()

    def resolve_is_premium(self, info):
        return self.is_premium

    def resolve_premium_start_date(self, info):
        return self.premium_start_date

    def resolve_premium_end_date(self, info):
        return self.premium_end_date
    
    def resolve_profile_picture(self, info):
        if self.profile_picture and hasattr(self.profile_picture, 'url'):
            return self.profile_picture.url
        return static('images/default_profile_picture.png')
    
class AudioFileType(DjangoObjectType):
    class Meta:
        model = AudioFile

    audio_file = graphene.String()

    def resolve_audio_file(self, info):
        if self.audio_file:
            return self.audio_file.name  # This returns the relative path
        return None

class FavoriteType(DjangoObjectType):
    class Meta:
        model = Favorite

class MIDIFileType(DjangoObjectType):
    class Meta:
        model = MIDIFile
    
    download_url = String()

    def resolve_download_url(self, info):
        if self.midi_file:
            return f"{settings.BASE_URL}{self.midi_file.url}"
        return None

class SheetMusicType(DjangoObjectType):
    class Meta:
        model = SheetMusic
    
    download_url = String()

    def resolve_download_url(self, info):
        if self.pdf_file:
            return f"{settings.BASE_URL}{self.pdf_file.url}"
        return None

class TranscriptionType(DjangoObjectType):
    class Meta:
        model = Transcription

    visibility = String()
    midi_file = graphene.Field(MIDIFileType)
    sheet_music = graphene.Field(SheetMusicType)

    def resolve_visibility(self, info):
        return "public" if self.public else "private"

    def resolve_midi_file(self, info):
        return self.midifile_set.first()

    def resolve_sheet_music(self, info):
        return self.sheetmusic_set.first()

class TagType(DjangoObjectType):
    class Meta:
        model = Tag

class TranscriptionTagType(DjangoObjectType):
    class Meta:
        model = TranscriptionTag

class RatingType(DjangoObjectType):
    class Meta:
        model = Rating

class TranscriptionWithPlayCountType(DjangoObjectType):
    class Meta:
        model = Transcription

    play_count = graphene.Int()

class UserStatisticsType(graphene.ObjectType):
    total_transcriptions = graphene.Int()
    average_rating = graphene.Float()
    total_play_time = graphene.Int()