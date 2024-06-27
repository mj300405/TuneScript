# backend/tunescript_app/types.py

import graphene
from graphene_django.types import DjangoObjectType
from .models import Profile, AudioFile, Transcription, Favorite, MIDIFile, SheetMusic, Tag, TranscriptionTag, Rating
from django.contrib.auth import get_user_model

class UserType(DjangoObjectType):
    class Meta:
        model = get_user_model()

class ProfileType(DjangoObjectType):
    class Meta:
        model = Profile

class AudioFileType(DjangoObjectType):
    class Meta:
        model = AudioFile

class TranscriptionType(DjangoObjectType):
    class Meta:
        model = Transcription

class FavoriteType(DjangoObjectType):
    class Meta:
        model = Favorite

class MIDIFileType(DjangoObjectType):
    class Meta:
        model = MIDIFile

class SheetMusicType(DjangoObjectType):
    class Meta:
        model = SheetMusic

class TagType(DjangoObjectType):
    class Meta:
        model = Tag

class TranscriptionTagType(DjangoObjectType):
    class Meta:
        model = TranscriptionTag

class RatingType(DjangoObjectType):
    class Meta:
        model = Rating
