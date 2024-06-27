# backend/tunescript_app/schema.py

import graphene
from .types import UserType, ProfileType, AudioFileType, TranscriptionType, FavoriteType, MIDIFileType, SheetMusicType, TagType, TranscriptionTagType, RatingType
from .mutations import Mutation  # Import the Mutation class from mutations.py
from django.contrib.auth import get_user_model
from .models import Profile, AudioFile, Transcription, Favorite, MIDIFile, SheetMusic, Tag, TranscriptionTag, Rating

class Query(graphene.ObjectType):
    users = graphene.List(UserType)
    profiles = graphene.List(ProfileType)
    transcriptions = graphene.List(TranscriptionType, is_public=graphene.Boolean())
    transcription = graphene.Field(TranscriptionType, id=graphene.Int())
    tags = graphene.List(TagType)
    search_transcriptions = graphene.List(TranscriptionType, title=graphene.String(), composer=graphene.String(), is_public=graphene.Boolean())

    def resolve_users(self, info, **kwargs):
        return get_user_model().objects.all()

    def resolve_profiles(self, info, **kwargs):
        return Profile.objects.all()

    def resolve_transcriptions(self, info, is_public=None, **kwargs):
        if is_public is None:
            return Transcription.objects.all()
        return Transcription.objects.filter(public=is_public)

    def resolve_transcription(self, info, id):
        return Transcription.objects.get(pk=id)

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

schema = graphene.Schema(query=Query, mutation=Mutation)
