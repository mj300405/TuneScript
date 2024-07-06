# backend/tunescript_app/types.py

import graphene
from graphene_django.types import DjangoObjectType
from .models import Profile, AudioFile, Transcription, Favorite, MIDIFile, SheetMusic, Tag, TranscriptionTag, Rating
from django.contrib.auth import get_user_model
from graphene import String
from django.conf import settings

class UserType(DjangoObjectType):
    class Meta:
        model = get_user_model()

class ProfileType(DjangoObjectType):
    class Meta:
        model = Profile
        fields = ('id', 'user', 'bio', 'profile_picture', 'preferences', 'public', 'is_premium', 'premium_start_date', 'premium_end_date')

    is_premium = graphene.Boolean()
    premium_start_date = graphene.DateTime()
    premium_end_date = graphene.DateTime()

    def resolve_is_premium(self, info):
        return self.is_premium

    def resolve_premium_start_date(self, info):
        return self.premium_start_date

    def resolve_premium_end_date(self, info):
        return self.premium_end_date

class AudioFileType(DjangoObjectType):
    class Meta:
        model = AudioFile



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
