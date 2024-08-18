# backend/tunescript_app/types.py

import logging

import graphene
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Avg
from django.templatetags.static import static
from graphene import Float, Int, List, String, relay
from graphene_django.types import DjangoObjectType

from .models import (AudioFile, Favorite, MIDIFile, Profile, Rating,
                     SheetMusic, Tag, Transcription, TranscriptionTag,
                     UserPlayHistory)

logger = logging.getLogger(__name__)


class UserType(DjangoObjectType):
    class Meta:
        model = get_user_model()


class ProfileType(DjangoObjectType):
    class Meta:
        model = Profile
        fields = (
            "id",
            "user",
            "bio",
            "preferences",
            "public",
            "is_premium",
            "premium_start_date",
            "premium_end_date",
        )

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
        if self.profile_picture and hasattr(self.profile_picture, "url"):
            return f"{settings.BASE_URL}{self.profile_picture.url}"
        return f"{settings.BASE_URL}{settings.STATIC_URL}images/default_profile_picture.png"


class FavoriteType(DjangoObjectType):
    class Meta:
        model = Favorite


class AudioFileType(DjangoObjectType):
    class Meta:
        model = AudioFile
        interfaces = (relay.Node,)

    audio_file = graphene.String()

    def resolve_audio_file(self, info):
        if self.audio_file:
            return self.audio_file.name
        return None


class MIDIFileType(DjangoObjectType):
    class Meta:
        model = MIDIFile
        interfaces = (relay.Node,)

    download_url = graphene.String()

    def resolve_download_url(self, info):
        if self.midi_file:
            return info.context.build_absolute_uri(self.midi_file.url)
        return None


class SheetMusicType(DjangoObjectType):
    class Meta:
        model = SheetMusic
        interfaces = (relay.Node,)

    download_url = graphene.String()

    def resolve_download_url(self, info):
        if self.pdf_file:
            return info.context.build_absolute_uri(self.pdf_file.url)
        return None


class TagType(DjangoObjectType):
    class Meta:
        model = Tag


class TranscriptionTagType(DjangoObjectType):
    class Meta:
        model = TranscriptionTag


class UserStatisticsType(graphene.ObjectType):
    total_transcriptions = graphene.Int()
    average_rating = graphene.Float()
    total_play_time = graphene.Int()


class TranscriptionType(DjangoObjectType):
    class Meta:
        model = Transcription
        fields = (
            "id",
            "title",
            "composer",
            "genre",
            "player",
            "public",
            "created_at",
            "status",
            "avg_rating",
            "num_ratings",
        )
        interfaces = (relay.Node,)

    visibility = graphene.String()
    user_rating = graphene.Int()
    genre = graphene.String()
    player = graphene.String()
    status = graphene.String()
    midi_file = graphene.Field(MIDIFileType)
    sheet_music = graphene.Field(SheetMusicType)
    audio_file = graphene.Field(AudioFileType)
    num_ratings = graphene.Int()
    rating_set = graphene.List("tunescript_app.types.RatingType")
    is_owner = graphene.Boolean()

    def resolve_is_owner(self, info):
        user = info.context.user
        return user.is_authenticated and self.user == user

    def resolve_visibility(self, info):
        return "public" if self.public else "private"

    def resolve_user_rating(self, info):
        user = info.context.user
        if user.is_authenticated:
            rating = self.rating_set.filter(user=user).first()
            return rating.rating if rating else None
        return None

    def resolve_genre(self, info):
        return self.genre

    def resolve_player(self, info):
        return self.player

    def resolve_status(self, info):
        return self.status

    def resolve_midi_file(self, info):
        return self.midifile_set.first()

    def resolve_sheet_music(self, info):
        return self.sheetmusic_set.first()

    def resolve_audio_file(self, info):
        return self.audio_file

    def resolve_num_ratings(self, info):
        return self.num_ratings

    def resolve_rating_set(self, info):
        return self.rating_set.all()


class RatingType(DjangoObjectType):
    class Meta:
        model = Rating
        fields = ("id", "rating", "comment", "user", "created_at", "transcription")
        interfaces = (graphene.relay.Node,)

    user = graphene.Field("tunescript_app.types.UserType")
    transcription = graphene.Field("tunescript_app.types.TranscriptionType")

    def resolve_user(self, info):
        return self.user

    def resolve_transcription(self, info):
        return self.transcription
