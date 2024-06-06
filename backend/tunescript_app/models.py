# models.py
from mongoengine import Document, fields
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta

User = get_user_model()

class Profile(Document):
    user_id = fields.IntField(required=True)
    bio = fields.StringField(blank=True)
    profile_picture = fields.FileField(upload_to='profile_pictures/', blank=True, null=True)
    preferences = fields.DictField(default=dict, blank=True)
    public = fields.BooleanField(default=False)
    is_premium = fields.BooleanField(default=False)
    premium_start_date = fields.DateTimeField(null=True, blank=True)
    premium_end_date = fields.DateTimeField(null=True, blank=True)

    def __str__(self):
        return str(self.user_id)

    def activate_premium(self, duration_days=30):
        self.is_premium = True
        self.premium_start_date = datetime.now()
        self.premium_end_date = self.premium_start_date + timedelta(days=duration_days)
        self.save()

    def deactivate_premium(self):
        self.is_premium = False
        self.premium_start_date = None
        self.premium_end_date = None
        self.save()

class AudioFile(Document):
    user_id = fields.IntField(required=True)
    title = fields.StringField(max_length=200)
    audio_file = fields.FileField(upload_to='audio_files/')
    uploaded_at = fields.DateTimeField(default=datetime.now)

    def __str__(self):
        return self.title

class Transcription(Document):
    audio_file = fields.ReferenceField(AudioFile, required=True)
    genre = fields.StringField(max_length=100, blank=True)
    title = fields.StringField(max_length=200)
    composer = fields.StringField(max_length=200, blank=True)
    player = fields.StringField(max_length=200, blank=True)
    created_at = fields.DateTimeField(default=datetime.now)
    status = fields.StringField(max_length=50, choices=['PENDING', 'COMPLETED'], default='PENDING')
    public = fields.BooleanField(default=False)
    rating = fields.FloatField(default=0.0)
    num_ratings = fields.IntField(default=0)

    def __str__(self):
        return f"Transcription for {self.audio_file.title}"

class Favorite(Document):
    user_id = fields.IntField(required=True)
    transcription = fields.ReferenceField(Transcription, required=True)
    created_at = fields.DateTimeField(default=datetime.now)

    def __str__(self):
        return f"User {self.user_id}'s favorite {self.transcription.title}"

class MIDIFile(Document):
    transcription = fields.ReferenceField(Transcription, required=True)
    midi_file = fields.FileField(upload_to='midi_files/')
    generated_at = fields.DateTimeField(default=datetime.now)

    def __str__(self):
        return f"MIDI for {self.transcription.audio_file.title}"

class SheetMusic(Document):
    transcription = fields.ReferenceField(Transcription, required=True)
    pdf_file = fields.FileField(upload_to='pdf_files/')
    generated_at = fields.DateTimeField(default=datetime.now)

    def __str__(self):
        return f"Sheet Music for {self.transcription.audio_file.title}"
