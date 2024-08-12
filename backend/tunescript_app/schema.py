# tunescript_app/schema.py

import graphene
from .types import UserType, ProfileType, AudioFileType, TranscriptionType, FavoriteType, MIDIFileType, SheetMusicType, TagType, TranscriptionTagType, RatingType, TranscriptionWithPlayCountType, UserStatisticsType
from .mutations import Mutation  # Import the Mutation class from mutations.py
from django.contrib.auth import get_user_model
from .models import Profile, AudioFile, Transcription, Favorite, MIDIFile, SheetMusic, Tag, TranscriptionTag, Rating, UserPlayHistory
from django.db import models
from django.conf import settings
from django.db.models import Q
from django.db.models import Count, Avg, Sum

class Query(graphene.ObjectType):
    users = graphene.List(UserType)
    profiles = graphene.List(ProfileType)
    transcriptions = graphene.List(TranscriptionType, title=graphene.String(), composer=graphene.String(), genre=graphene.String(), player=graphene.String(), min_rating=graphene.Float(), visibility=graphene.String())
    transcription = graphene.Field(TranscriptionType, id=graphene.ID(required=True))
    tags = graphene.List(TagType)
    search_transcriptions = graphene.List(TranscriptionType, title=graphene.String(), composer=graphene.String(), is_public=graphene.Boolean())
    me = graphene.Field(UserType)
    transcription_status = graphene.String(id=graphene.Int(required=True))
    download_midi = graphene.String(transcription_id=graphene.Int(required=True))
    download_sheet_music = graphene.String(transcription_id=graphene.Int(required=True))
    profile = graphene.Field(ProfileType)
    my_transcriptions = graphene.List(TranscriptionType)
    highest_rated_transcriptions = graphene.List(TranscriptionType)
    recent_transcriptions = graphene.List(TranscriptionType)
    user_most_played_transcriptions = graphene.List(TranscriptionWithPlayCountType)
    recommended_transcriptions = graphene.List(TranscriptionType)
    user_statistics = graphene.Field(UserStatisticsType)
    transcription_with_rating = graphene.Field(TranscriptionType, id=graphene.Int(required=True))

    def resolve_transcription_with_rating(self, info, id):
        user = info.context.user
        transcription = Transcription.objects.get(pk=id)
        if user.is_authenticated:
            rating = Rating.objects.filter(transcription=transcription, user=user).first()
            if rating:
                transcription.user_rating = rating.rating
        return transcription

    def resolve_recent_transcriptions(self, info):
        return Transcription.objects.filter(public=True).order_by('-created_at')[:5]

    def resolve_user_most_played_transcriptions(self, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        
        return (Transcription.objects
                .filter(userplayhistory__user=user)
                .annotate(play_count=Count('userplayhistory'))
                .order_by('-play_count')[:5])

    def resolve_recommended_transcriptions(self, info):
        user = info.context.user
        if not user.is_authenticated:
            return Transcription.objects.filter(public=True).order_by('?')[:5]
        
        # Simple recommendation based on user's most played genres
        favorite_genres = (UserPlayHistory.objects
                           .filter(user=user)
                           .values('transcription__genre')
                           .annotate(count=Count('id'))
                           .order_by('-count')
                           .values_list('transcription__genre', flat=True))
        
        if favorite_genres:
            return (Transcription.objects
                    .filter(public=True, genre__in=favorite_genres[:3])
                    .exclude(userplayhistory__user=user)
                    .order_by('?')[:5])
        else:
            return Transcription.objects.filter(public=True).order_by('?')[:5]

    
    def resolve_my_transcriptions(self, info):
        return Transcription.objects.filter(user=info.context.user).order_by('-created_at')

    def resolve_profile(self, info):
        user = info.context.user
        if user.is_anonymous:
            raise Exception('Not logged in!')
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

    def resolve_search_transcriptions(self, info, title=None, composer=None, is_public=None):
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
            raise Exception("Not logged in!")
        return user
    
    def resolve_highest_rated_transcriptions(self, info):
        return Transcription.objects.filter(public=True).annotate(
            avg_rating=Avg('rating_set__rating')
        ).order_by('-avg_rating')[:5]

    def resolve_user_statistics(self, info):
        user = info.context.user
        if not user.is_authenticated:
            return None
        
        total_transcriptions = Transcription.objects.filter(user=user).count()
        average_rating = Transcription.objects.filter(user=user).annotate(
            avg_rating=Avg('rating_set__rating')
        ).aggregate(Avg('avg_rating'))['avg_rating__avg'] or 0
        total_play_time = UserPlayHistory.objects.filter(user=user).aggregate(Sum('play_time'))['play_time__sum'] or 0

        return UserStatisticsType(
            total_transcriptions=total_transcriptions,
            average_rating=average_rating,
            total_play_time=total_play_time
        )

    def resolve_transcriptions(self, info, title=None, composer=None, genre=None, player=None, min_rating=None, visibility=None):
        user = info.context.user
        qs = Transcription.objects.annotate(avg_rating=Avg('rating_set__rating'))

        if title:
            qs = qs.filter(title__icontains=title)
        if composer:
            qs = qs.filter(composer__icontains=composer)
        if genre:
            qs = qs.filter(genre__icontains=genre)
        if player:
            qs = qs.filter(player__icontains=player)
        if min_rating is not None:
            qs = qs.filter(avg_rating__gte=min_rating)
        
        if visibility:
            if visibility.lower() == 'public':
                qs = qs.filter(public=True)
            elif visibility.lower() == 'private' and not user.is_anonymous:
                qs = qs.filter(public=False, user=user)
        else:
            if user.is_anonymous:
                qs = qs.filter(public=True)
            else:
                qs = qs.filter(Q(public=True) | Q(user=user))

        return qs

schema = graphene.Schema(query=Query, mutation=Mutation)
