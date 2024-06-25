# backend/tunescript_app/schema.py

import graphene
from graphene_django.types import DjangoObjectType
from .models import Profile, AudioFile, Transcription, Favorite, MIDIFile, SheetMusic, Tag, TranscriptionTag, Rating
from django.contrib.auth import get_user_model
from .tasks import process_transcription
from graphene_file_upload.scalars import Upload
import graphql_jwt
from django.db import IntegrityError, transaction

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

class Query(graphene.ObjectType):
    users = graphene.List(UserType)
    profiles = graphene.List(ProfileType)
    transcriptions = graphene.List(TranscriptionType, is_public=graphene.Boolean())
    transcription = graphene.Field(TranscriptionType, id=graphene.Int())
    tags = graphene.List(TagType)

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

class UploadAudioFile(graphene.Mutation):
    audio_file = graphene.Field(AudioFileType)

    class Arguments:
        title = graphene.String(required=True)
        audio_file = Upload(required=True)

    def mutate(self, info, title, audio_file):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not logged in!")

        audio_file_instance = AudioFile(
            user=user,
            title=title,
            audio_file=audio_file,
        )
        audio_file_instance.save()
        return UploadAudioFile(audio_file=audio_file_instance)

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
            status='PENDING',
        )
        transcription.save()

        # Trigger the Celery task
        process_transcription.delay(transcription.id)

        return CreateTranscription(transcription=transcription)

class Register(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)
        email = graphene.String(required=True)

    @transaction.atomic
    def mutate(self, info, username, password, email):
        try:
            user = get_user_model().objects.create_user(username=username, password=password, email=email)
            Profile.objects.create(user=user)
        except IntegrityError:
            raise Exception("User with this username already exists.")
        
        return Register(user=user)

class Mutation(graphene.ObjectType):
    upload_audio_file = UploadAudioFile.Field()
    create_transcription = CreateTranscription.Field()
    register = Register.Field()
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)
