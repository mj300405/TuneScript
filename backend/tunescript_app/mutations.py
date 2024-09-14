import logging

import graphene
import graphql_jwt
from django.contrib.auth import get_user_model, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import (InMemoryUploadedFile,
                                            SimpleUploadedFile)
from django.core.mail import send_mail
from django.db import IntegrityError, models, transaction
from django.db.models import Avg, F
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from graphene_file_upload.scalars import Upload
from graphql_jwt import JSONWebTokenMutation
from graphql_jwt.decorators import login_required
from graphql_relay import from_global_id

from .models import (AudioFile, Favorite, Profile, Rating, Transcription,
                     UserPlayHistory)
from .tasks import download_youtube_audio, process_transcription
from .types import (AudioFileType, FavoriteType, ProfileType, RatingType,
                    TranscriptionType, UserType)
from .utils import send_confirmation_email, send_password_reset_email
from django.conf import settings

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
        valid_types = ["audio/mpeg", "audio/wav", "audio/mp3"]
        if file.content_type not in valid_types:
            raise Exception(
                f"Invalid file type. Only MP3 and WAV files are allowed. Received: {file.content_type}"
            )

        # Create the AudioFile instance
        audio_file_instance = AudioFile(user=user, title=title)
        audio_file_instance.audio_file.save(file.name, file)
        audio_file_instance.save()

        logger.info(f"File saved: {audio_file_instance.audio_file.path}")

        return UploadAudioFile(audio_file=audio_file_instance)


class CreateTranscription(graphene.Mutation):
    class Arguments:
        audio_file_id = graphene.Int()
        youtube_url = graphene.String()
        title = graphene.String(required=True)
        genre = graphene.String()
        composer = graphene.String()
        player = graphene.String()
        is_public = graphene.Boolean(required=True)

    transcription = graphene.Field(TranscriptionType)

    @login_required
    def mutate(
        self,
        info,
        title,
        genre=None,
        composer=None,
        player=None,
        is_public=False,
        audio_file_id=None,
        youtube_url=None,
    ):
        user = info.context.user

        if audio_file_id and youtube_url:
            raise Exception(
                "Please provide either an audio file ID or a YouTube URL, not both."
            )

        if not audio_file_id and not youtube_url:
            raise Exception("Please provide either an audio file ID or a YouTube URL.")

        if audio_file_id:
            try:
                audio_file = AudioFile.objects.get(id=audio_file_id)
            except AudioFile.DoesNotExist:
                raise Exception("Audio file not found")
        else:
            # Handle YouTube URL
            audio_file = AudioFile.objects.create(
                user=user,
                title=f"YouTube Audio: {title}",
                audio_file=None,  # We'll update this later
            )

        transcription = Transcription.objects.create(
            audio_file=audio_file,
            user=user,
            title=title,
            genre=genre or "",
            composer=composer or "",
            player=player or "",
            public=is_public,
            status="PENDING",
        )

        if youtube_url:
            # For YouTube URLs, we'll download the audio first
            from .tasks import download_youtube_audio

            download_youtube_audio.delay(youtube_url, audio_file.id, transcription.id)
        else:
            # For uploaded files, we can start the transcription process immediately
            from .tasks import process_transcription

            process_transcription.delay(transcription.id)

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
                "Password Reset",
                f"Your token is {token}",
                "from@example.com",
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

    def mutate(
        self,
        info,
        id,
        title=None,
        genre=None,
        composer=None,
        player=None,
        is_public=None,
    ):
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

    rating = graphene.Field("tunescript_app.types.RatingType")
    transcription = graphene.Field("tunescript_app.types.TranscriptionType")

    @login_required
    def mutate(self, info, transcription_id, rating_value):
        user = info.context.user
        if not user.is_authenticated:
            raise Exception("You must be logged in to rate a transcription.")

        _, decoded_id = from_global_id(transcription_id)
        transcription = Transcription.objects.get(pk=decoded_id)

        rating, created = Rating.objects.update_or_create(
            transcription=transcription,
            user=user,
            defaults={"rating": rating_value},
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
        favorite, created = Favorite.objects.get_or_create(
            transcription=transcription, user=user
        )

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
            user = get_user_model().objects.create_user(
                username=username, password=password, email=email
            )
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
    def mutate(
        self, info, bio=None, public=None, preferences=None, profile_picture=None
    ):
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


class PasswordReset(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, email):
        User = get_user_model()
        user = User.objects.filter(email=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = (
                f"{info.context.META['HTTP_ORIGIN']}/reset-password/{uid}/{token}"
            )
            send_password_reset_email(user.email, reset_url)
            return PasswordReset(success=True, message="Password reset email sent")
        return PasswordReset(success=False, message="Email not found")


class PasswordChange(graphene.Mutation):
    class Arguments:
        uid = graphene.String(required=True)
        token = graphene.String(required=True)
        new_password = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, uid, token, new_password):
        User = get_user_model()
        try:
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
            return PasswordChange(success=False, message="Invalid reset link")

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return PasswordChange(success=True, message="Password successfully changed")
        else:
            return PasswordChange(
                success=False, message="Invalid or expired reset link"
            )


class UpdatePassword(graphene.Mutation):
    class Arguments:
        current_password = graphene.String(required=True)
        new_password = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @login_required
    def mutate(self, info, current_password, new_password):
        user = info.context.user
        if user.check_password(current_password):
            user.set_password(new_password)
            user.save()
            return UpdatePassword(success=True, message="Password successfully updated")
        else:
            return UpdatePassword(
                success=False, message="Current password is incorrect"
            )


class DeleteTranscription(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Not logged in!")

        try:
            _, local_id = from_global_id(id)
            transcription = Transcription.objects.get(pk=local_id, user=user)
            transcription.delete()
            return DeleteTranscription(success=True)
        except Exception as e:
            return DeleteTranscription(success=False, message=str(e))

class ShareTranscription(graphene.Mutation):
    class Arguments:
        transcription_id = graphene.ID(required=True)

    share_url = graphene.String()

    @login_required
    def mutate(self, info, transcription_id):
        user = info.context.user
        
        # Decode the global ID
        _, decoded_id = from_global_id(transcription_id)
        
        try:
            transcription = Transcription.objects.get(pk=decoded_id)
        except Transcription.DoesNotExist:
            raise Exception("Transcription not found")

        if transcription.user != user:
            raise Exception("You don't have permission to share this transcription")

        share_token = transcription.generate_share_token()
        share_url = f"http://localhost:3000/transcription/{share_token}"
        return ShareTranscription(share_url=share_url)


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
    logout = Logout.Field()
    confirm_email = ConfirmEmail.Field()
    password_reset = PasswordReset.Field()
    password_change = PasswordChange.Field()
    update_password = UpdatePassword.Field()
    delete_transcription = DeleteTranscription.Field()
    share_transcription = ShareTranscription.Field()
