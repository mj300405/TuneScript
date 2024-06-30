# tunescript_app/schema.py

import graphene
from .types import UserType, ProfileType, AudioFileType, TranscriptionType, FavoriteType, MIDIFileType, SheetMusicType, TagType, TranscriptionTagType, RatingType
from .mutations import Mutation  # Import the Mutation class from mutations.py
from django.contrib.auth import get_user_model
from .models import Profile, AudioFile, Transcription, Favorite, MIDIFile, SheetMusic, Tag, TranscriptionTag, Rating
from django.db import models
from django.conf import settings

class Query(graphene.ObjectType):
    users = graphene.List(UserType)
    profiles = graphene.List(ProfileType)
    transcriptions = graphene.List(TranscriptionType, title=graphene.String(), composer=graphene.String(), visibility=graphene.String())
    transcription = graphene.Field(TranscriptionType, id=graphene.Int())
    tags = graphene.List(TagType)
    search_transcriptions = graphene.List(TranscriptionType, title=graphene.String(), composer=graphene.String(), is_public=graphene.Boolean())
    me = graphene.Field(UserType)
    transcription_status = graphene.String(id=graphene.Int(required=True))
    download_midi = graphene.String(transcription_id=graphene.Int(required=True))
    download_sheet_music = graphene.String(transcription_id=graphene.Int(required=True))

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

    def resolve_transcriptions(self, info, title=None, composer=None, visibility=None, **kwargs):
        user = info.context.user
        qs = Transcription.objects.all()
        if title:
            qs = qs.filter(title__icontains=title)
        if composer:
            qs = qs.filter(composer__icontains=composer)
        if visibility:
            if visibility.lower() == 'public':
                qs = qs.filter(public=True)
            elif visibility.lower() == 'private':
                qs = qs.filter(public=False, user=user)
        else:
            if user.is_anonymous:
                qs = qs.filter(public=True)
            else:
                qs = qs.filter(models.Q(public=True) | models.Q(user=user))
        return qs

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

    def resolve_me(self, info):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not logged in!")
        return user

schema = graphene.Schema(query=Query, mutation=Mutation)
