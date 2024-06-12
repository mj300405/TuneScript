# backend/tunescript_app/schema.py

import graphene
from graphene_django.types import DjangoObjectType
from .models import Profile, AudioFile, Transcription, Favorite, MIDIFile, SheetMusic, Tag, TranscriptionTag, Rating
from django.contrib.auth.models import User
from .tasks import process_transcription

class UserType(DjangoObjectType):
    class Meta:
        model = User

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

class Query(graphene.ObjectType):
    users = graphene.List(UserType)
    profiles = graphene.List(ProfileType)
    transcriptions = graphene.List(TranscriptionType, is_public=graphene.Boolean())
    transcription = graphene.Field(TranscriptionType, id=graphene.Int())
    tags = graphene.List(TagType)

    def resolve_users(self, info, **kwargs):
        return User.objects.all()

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

class CreateTranscription(graphene.Mutation):
    transcription = graphene.Field(TranscriptionType)

    class Arguments:
        audio_file_id = graphene.Int(required=True)
        title = graphene.String(required=True)
        description = graphene.String()
        genre = graphene.String()
        composer = graphene.String()
        player = graphene.String()
        is_public = graphene.Boolean(default_value=True)

    def mutate(self, info, audio_file_id, title, description=None, genre=None, composer=None, player=None, is_public=True):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not logged in!")

        audio_file = AudioFile.objects.get(id=audio_file_id)
        transcription = Transcription(
            audio_file=audio_file,
            user=user,
            title=title,
            description=description,
            genre=genre,
            composer=composer,
            player=player,
            public=is_public,
        )
        transcription.save()

        # Trigger the Celery task
        process_transcription.delay(transcription.id)

        return CreateTranscription(transcription=transcription)

class Mutation(graphene.ObjectType):
    create_transcription = CreateTranscription.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)
