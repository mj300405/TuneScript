import graphene
from graphene_file_upload.scalars import Upload
from django.core.files.storage import default_storage
from django.contrib.auth import get_user_model, logout
from django.db import IntegrityError, transaction, models
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from .models import AudioFile, Transcription, Favorite, Rating, Profile, UserPlayHistory
from .tasks import process_transcription
from .types import UserType, AudioFileType, TranscriptionType, FavoriteType, RatingType, ProfileType
import graphql_jwt
from graphql_jwt.decorators import login_required
import logging
from django.core.files.uploadedfile import SimpleUploadedFile, InMemoryUploadedFile
from .utils import send_confirmation_email
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from graphql_jwt import JSONWebTokenMutation
from django.db.models import F, Avg
from graphql_relay import from_global_id

logger = logging.getLogger(__name__)

class TranscribeAudio(graphene.Mutation):
    class Arguments:
        file = Upload(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, file, **kwargs):
        # Save the uploaded file
        file_path = default_storage.save(file.name, file)
        
        # Trigger the transcription process
        process_transcription.delay(file_path)

        return TranscribeAudio(success=True, message="Transcription started")

class UploadAudioFile(graphene.Mutation):
    class Arguments:
        file = Upload(required=True)
        title = graphene.String(required=True)

    audio_file = graphene.Field(AudioFileType)

    def mutate(self, info, file, title):
        user = info.context.user

        if user.is_anonymous:
            raise Exception("Not logged in!")

        # Check if file is an instance of uploaded file classes
        if not isinstance(file, (InMemoryUploadedFile, SimpleUploadedFile)):
            raise Exception(f"Invalid file type. Received: {type(file).__name__}")

        logger.info(f"Received file with content type: {file.content_type}")
        logger.info(f"Received file name: {file.name}")

        # Validate file type
        valid_types = ['audio/mpeg', 'audio/wav', 'audio/mp3']
        if file.content_type not in valid_types:
            raise Exception(f"Invalid file type. Only MP3 and WAV files are allowed. Received: {file.content_type}")

        # Create the AudioFile instance
        audio_file_instance = AudioFile(
            user=user,
            title=title
        )
        audio_file_instance.audio_file.save(file.name, file)
        audio_file_instance.save()

        logger.info(f"File saved: {audio_file_instance.audio_file.path}")

        return UploadAudioFile(audio_file=audio_file_instance)

class CreateTranscription(graphene.Mutation):
    class Arguments:
        audio_file_id = graphene.Int(required=True)
        title = graphene.String(required=True)
        genre = graphene.String()
        composer = graphene.String()
        player = graphene.String()
        is_public = graphene.Boolean(required=True)

    transcription = graphene.Field(TranscriptionType)

    def mutate(self, info, audio_file_id, title, genre=None, composer=None, player=None, is_public=False):
        user = info.context.user

        if user.is_anonymous:
            raise Exception("Not logged in!")

        try:
            audio_file = AudioFile.objects.get(id=audio_file_id)
        except AudioFile.DoesNotExist:
            raise Exception("Audio file not found")

        transcription = Transcription(
            audio_file=audio_file,
            user=user,
            title=title,
            genre=genre or "",
            composer=composer or "",
            player=player or "",
            public=is_public
        )
        transcription.save()

        return CreateTranscription(transcription=transcription)
class PasswordReset(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, email):
        user = get_user_model().objects.filter(email=email).first()
        if user:
            token = default_token_generator.make_token(user)
            send_mail(
                'Password Reset',
                f'Your token is {token}',
                'from@example.com',
                [email],
            )
            return PasswordReset(success=True, message="Password reset email sent")
        return PasswordReset(success=False, message="Email not found")

class UpdateTranscription(graphene.Mutation):
    transcription = graphene.Field(TranscriptionType)

    class Arguments:
        id = graphene.Int(required=True)
        title = graphene.String()
        genre = graphene.String()
        composer = graphene.String()
        player = graphene.String()
        is_public = graphene.Boolean()

    def mutate(self, info, id, title=None, genre=None, composer=None, player=None, is_public=None):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not logged in!")

        transcription = Transcription.objects.get(pk=id, user=user)
        if title:
            transcription.title = title
        if genre:
            transcription.genre = genre
        if composer:
            transcription.composer = composer
        if player:
            transcription.player = player
        if is_public is not None:
            transcription.public = is_public
        transcription.save()

        return UpdateTranscription(transcription=transcription)

class DeleteTranscription(graphene.Mutation):
    success = graphene.Boolean()

    class Arguments:
        id = graphene.Int(required=True)

    def mutate(self, info, id):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not logged in!")

        transcription = Transcription.objects.get(pk=id, user=user)
        transcription.delete()

        return DeleteTranscription(success=True)

class RateTranscription(graphene.Mutation):
    class Arguments:
        transcription_id = graphene.ID(required=True)
        rating_value = graphene.Int(required=True)
        comment = graphene.String()

    rating = graphene.Field('tunescript_app.types.RatingType')
    transcription = graphene.Field('tunescript_app.types.TranscriptionType')

    @login_required
    def mutate(self, info, transcription_id, rating_value, comment=None):
        user = info.context.user
        if not user.is_authenticated:
            raise Exception("You must be logged in to rate a transcription.")

        _, decoded_id = from_global_id(transcription_id)
        transcription = Transcription.objects.get(pk=decoded_id)

        rating, created = Rating.objects.update_or_create(
            transcription=transcription,
            user=user,
            defaults={'rating': rating_value, 'comment': comment}
        )

        return RateTranscription(rating=rating, transcription=transcription)

class BookmarkTranscription(graphene.Mutation):
    favorite = graphene.Field(FavoriteType)

    class Arguments:
        transcription_id = graphene.Int(required=True)

    def mutate(self, info, transcription_id):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not logged in!")

        transcription = Transcription.objects.get(pk=transcription_id)
        favorite, created = Favorite.objects.get_or_create(transcription=transcription, user=user)

        return BookmarkTranscription(favorite=favorite)

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
            send_confirmation_email(user)
        except IntegrityError:
            raise Exception("User with this username already exists.")
        
        return Register(user=user)
    
class ActivatePremium(graphene.Mutation):
    class Arguments:
        duration_days = graphene.Int(default_value=30)

    profile = graphene.Field(ProfileType)

    @login_required
    def mutate(self, info, duration_days):
        user = info.context.user
        profile = Profile.objects.get(user=user)
        profile.activate_premium(duration_days)
        return ActivatePremium(profile=profile)

class DeactivatePremium(graphene.Mutation):
    profile = graphene.Field(ProfileType)

    @login_required
    def mutate(self, info):
        user = info.context.user
        profile = Profile.objects.get(user=user)
        profile.deactivate_premium()
        return DeactivatePremium(profile=profile)
    
class UpdateProfile(graphene.Mutation):
    class Arguments:
        bio = graphene.String()
        public = graphene.Boolean()
        preferences = graphene.JSONString()
        profile_picture = Upload(required=False)

    profile = graphene.Field(ProfileType)

    @login_required
    def mutate(self, info, bio=None, public=None, preferences=None, profile_picture=None):
        user = info.context.user
        profile = Profile.objects.get(user=user)

        if bio is not None:
            profile.bio = bio
        if public is not None:
            profile.public = public
        if preferences is not None:
            profile.preferences = preferences
        if profile_picture is not None:
            profile.profile_picture = profile_picture

        profile.save()
        return UpdateProfile(profile=profile)

class UpdatePlayHistory(graphene.Mutation):
    class Arguments:
        transcription_id = graphene.ID(required=True)
        play_time = graphene.Int(required=True)

    success = graphene.Boolean()

    def mutate(self, info, transcription_id, play_time):
        user = info.context.user
        if not user.is_authenticated:
            raise Exception("You must be logged in to update play history.")

        _, decoded_id = from_global_id(transcription_id)
        transcription = Transcription.objects.get(pk=decoded_id)

        play_history, created = UserPlayHistory.objects.get_or_create(
            user=user,
            transcription=transcription
        )
        play_history.play_time += play_time
        play_history.save()

        return UpdatePlayHistory(success=True)
        
    
class Logout(graphene.Mutation):
    class Arguments:
        pass

    success = graphene.Boolean()

    @login_required
    def mutate(self, info):
        logout(info.context)
        return Logout(success=True)
    
class ConfirmEmail(graphene.Mutation):
    class Arguments:
        uid = graphene.String(required=True)
        token = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, uid, token):
        try:
            uid = force_str(urlsafe_base64_decode(uid))
            user = get_user_model().objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.email_confirmed = True
            user.save()
            return ConfirmEmail(success=True)
        return ConfirmEmail(success=False)

class ObtainJSONWebToken(JSONWebTokenMutation):
    user = graphene.Field(UserType)

    @classmethod
    def resolve(cls, root, info, **kwargs):
        return cls(user=info.context.user)

class Mutation(graphene.ObjectType):
    transcribe_audio = TranscribeAudio.Field()
    upload_audio_file = UploadAudioFile.Field()
    create_transcription = CreateTranscription.Field()
    register = Register.Field()
    password_reset = PasswordReset.Field()
    update_transcription = UpdateTranscription.Field()
    delete_transcription = DeleteTranscription.Field()
    rate_transcription = RateTranscription.Field()
    bookmark_transcription = BookmarkTranscription.Field()
    token_auth = ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    activate_premium = ActivatePremium.Field()
    deactivate_premium = DeactivatePremium.Field()
    update_profile = UpdateProfile.Field()
    update_play_history = UpdatePlayHistory.Field()
    logout = Logout.Field()
    confirm_email = ConfirmEmail.Field()