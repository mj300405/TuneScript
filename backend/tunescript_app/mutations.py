# tunescript_app/mutations.py
import graphene
from graphene_file_upload.scalars import Upload
from django.core.files.storage import default_storage
from .tasks import process_transcription

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

class Mutation(graphene.ObjectType):
    transcribe_audio = TranscribeAudio.Field()
