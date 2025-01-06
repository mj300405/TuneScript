import logging

import graphene
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q, Sum

from .models import Profile, Rating, Tag, Transcription, UserPlayHistory
from .mutations import Mutation
from .types import (
    ProfileType,
    TagType,
    TranscriptionType,
    UserStatisticsType,
    UserType,
)
from .utils import get_suggestions

logger = logging.getLogger(__name__)


class Query(graphene.ObjectType):
    users = graphene.List(UserType)
    profiles = graphene.List(ProfileType)
    transcriptions = graphene.List(
        TranscriptionType,
        title=graphene.String(),
        composer=graphene.String(),
        tag=graphene.String(),
        player=graphene.String(),
        min_rating=graphene.Float(),
        visibility=graphene.String(),
    )
    transcription = graphene.Field(TranscriptionType, id=graphene.ID(required=True))
    tags = graphene.List(TagType)
    search_transcriptions = graphene.List(
        TranscriptionType,
        title=graphene.String(),
        composer=graphene.String(),
        is_public=graphene.Boolean(),
    )
    me = graphene.Field(UserType)
    transcription_status = graphene.String(id=graphene.Int(required=True))
    download_midi = graphene.String(transcription_id=graphene.Int(required=True))
    download_sheet_music = graphene.String(transcription_id=graphene.Int(required=True))
    profile = graphene.Field(ProfileType)
    my_transcriptions = graphene.List(TranscriptionType)
    highest_rated_transcriptions = graphene.List(TranscriptionType)
    recent_transcriptions = graphene.List(TranscriptionType)
    recommended_transcriptions = graphene.List(TranscriptionType)
    user_statistics = graphene.Field(UserStatisticsType)
    transcription_with_rating = graphene.Field(
        TranscriptionType, id=graphene.Int(required=True)
    )
    transcription_by_share_token = graphene.Field(
        TranscriptionType, token=graphene.UUID(required=True)
    )
    user_favorites = graphene.List(TranscriptionType)
    all_tags = graphene.List(TagType)
    get_title_suggestions = graphene.List(graphene.String, prefix=graphene.String(required=True))
    get_composer_suggestions = graphene.List(graphene.String, prefix=graphene.String(required=True))
    get_player_suggestions = graphene.List(graphene.String, prefix=graphene.String(required=True))

    def resolve_get_title_suggestions(self, info, prefix):
        return get_suggestions(Transcription, 'title', prefix)

    def resolve_get_composer_suggestions(self, info, prefix):
        return get_suggestions(Transcription, 'composer', prefix)

    def resolve_get_player_suggestions(self, info, prefix):
        return get_suggestions(Transcription, 'player', prefix)

    def resolve_all_tags(self, info):
        return Tag.objects.all()

    def resolve_user_favorites(self, info):
        user = info.context.user
        if user.is_anonymous:
            return []
        return Transcription.objects.filter(favorite__user=user)

    def resolve_transcription_by_share_token(self, info, token):
        try:
            return Transcription.objects.get(share_token=token)
        except Transcription.DoesNotExist:
            return None

    def resolve_transcription_with_rating(self, info, id):
        user = info.context.user
        transcription = Transcription.objects.get(pk=id)
        if user.is_authenticated:
            rating = Rating.objects.filter(
                transcription=transcription, user=user
            ).first()
            if rating:
                transcription.user_rating = rating.rating
        return transcription

    def resolve_recent_transcriptions(self, info):
        return Transcription.objects.filter(public=True).order_by("-created_at")[:5]

    def resolve_user_most_played_transcriptions(self, info):
        user = info.context.user
        if not user.is_authenticated:
            logger.info(
                f"User not authenticated when fetching most played transcriptions"
            )
            return []

        most_played = (
            Transcription.objects.filter(userplayhistory__user=user)
            .annotate(play_count=Count("userplayhistory"))
            .order_by("-play_count")[:5]
        )

        logger.info(
            f"Fetched {len(most_played)} most played transcriptions for user {user.id}"
        )
        for transcription in most_played:
            logger.info(
                f"Transcription {transcription.id}: {transcription.title} - Played {transcription.play_count} times"
            )

        return most_played

    def resolve_recommended_transcriptions(self, info):
        user = info.context.user
        if not user.is_authenticated:
            return Transcription.objects.filter(public=True).order_by("?")[:5]

        # Get the user's favorite tags based on play history
        favorite_tags = (
            UserPlayHistory.objects.filter(user=user)
            .values("transcription__tags")
            .annotate(count=Count("id"))
            .order_by("-count")
            .values_list("transcription__tags__name", flat=True)
        )

        if favorite_tags:
            recommended = (
                Transcription.objects.filter(public=True, tags__name__in=favorite_tags[:3])
                .exclude(userplayhistory__user=user)
                .order_by("?")[:5]
            )
        else:
            recommended = Transcription.objects.filter(public=True).order_by("?")[:5]

        return recommended

    def resolve_my_transcriptions(self, info):
        user = info.context.user
        if user.is_anonymous:
            return Transcription.objects.none()
        return Transcription.objects.filter(user=user).order_by("-created_at")

    def resolve_profile(self, info):
        user = info.context.user
        if user.is_anonymous:
            return None
        return Profile.objects.get(user=user)

    def resolve_download_midi(self, info, transcription_id):
        transcription = Transcription.objects.get(pk=transcription_id)
        midi_file = transcription.midifile_set.first()
        if midi_file and midi_file.midi_file:
            return f"{settings.BASE_URL}{midi_file.midi_file.url}"
        return None

    def resolve_download_sheet_music(self, info, transcription_id):
        transcription = Transcription.objects.get(pk=transcription_id)
        sheet_music = transcription.sheetmusic_set.first()
        if sheet_music and sheet_music.pdf_file:
            return f"{settings.BASE_URL}{sheet_music.pdf_file.url}"
        return None

    def resolve_users(self, info, **kwargs):
        return get_user_model().objects.all()

    def resolve_profiles(self, info, **kwargs):
        return Profile.objects.all()

    def resolve_transcription_status(self, info, id):
        transcription = Transcription.objects.get(pk=id)
        return transcription.status

    def resolve_transcription(self, info, id):
        from graphql_relay import from_global_id

        try:
            _, id = from_global_id(id)
            return Transcription.objects.get(pk=id)
        except (Transcription.DoesNotExist, ValueError, TypeError):
            return None

    def resolve_tags(self, info, **kwargs):
        return Tag.objects.all()

    def resolve_search_transcriptions(
        self, info, title=None, composer=None, is_public=None
    ):
        query = Transcription.objects.all()
        if title:
            query = query.filter(title__icontains=title)
        if composer:
            query = query.filter(composer__icontains=composer)
        if is_public is not None:
            query = query.filter(public=is_public)
        return query

    def resolve_me(self, info):
        user = info.context.user
        if user.is_anonymous:
            return None
        return user

    def resolve_highest_rated_transcriptions(self, info):
        return Transcription.objects.filter(public=True).order_by("-avg_rating")[:5]

    def resolve_user_statistics(self, info):
        user = info.context.user
        if not user.is_authenticated:
            return None

        total_transcriptions = Transcription.objects.filter(user=user).count()
        average_rating = (
            Transcription.objects.filter(user=user).aggregate(Avg("avg_rating"))[
                "avg_rating__avg"
            ]
            or 0
        )
        total_play_time = (
            UserPlayHistory.objects.filter(user=user).aggregate(Sum("play_time"))[
                "play_time__sum"
            ]
            or 0
        )

        return UserStatisticsType(
            total_transcriptions=total_transcriptions,
            average_rating=average_rating,
            total_play_time=total_play_time,
        )

    def resolve_transcriptions(
        self,
        info,
        title=None,
        composer=None,
        tag=None,
        player=None,
        min_rating=None,
        visibility=None,
    ):
        user = info.context.user
        qs = Transcription.objects.all()

        if title:
            qs = qs.filter(title__icontains=title)
        if composer:
            qs = qs.filter(composer__icontains=composer)
        if tag:
            qs = qs.filter(tags__name__icontains=tag)
        if player:
            qs = qs.filter(player__icontains=player)
        if min_rating is not None:
            qs = qs.filter(avg_rating__gte=min_rating)

        if visibility:
            if visibility.lower() == "public":
                qs = qs.filter(public=True)
            elif visibility.lower() == "private" and not user.is_anonymous:
                qs = qs.filter(public=False, user=user)
        else:
            if user.is_anonymous:
                qs = qs.filter(public=True)
            else:
                qs = qs.filter(Q(public=True) | Q(user=user))

        return qs


schema = graphene.Schema(query=Query, mutation=Mutation)