from django.db import models
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from .tasks import process_transcription

User = get_user_model()

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    preferences = models.JSONField(default=dict, blank=True)
    public = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    premium_start_date = models.DateTimeField(null=True, blank=True)
    premium_end_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return str(self.user)

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

class AudioFile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    audio_file = models.FileField(upload_to='audio_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Transcription(models.Model):
    audio_file = models.ForeignKey(AudioFile, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    genre = models.CharField(max_length=100, blank=True)
    title = models.CharField(max_length=200)
    composer = models.CharField(max_length=200, blank=True)
    player = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=[('PENDING', 'Pending'), ('COMPLETED', 'Completed')], default='PENDING')
    public = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0)
    num_ratings = models.IntegerField(default=0)

    def __str__(self):
        return f"Transcription for {self.audio_file.title}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.status == 'PENDING':
            process_transcription.delay(self.id)

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    transcription = models.ForeignKey(Transcription, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"User {self.user}'s favorite {self.transcription.title}"

class MIDIFile(models.Model):
    transcription = models.ForeignKey(Transcription, on_delete=models.CASCADE)
    midi_file = models.FileField(upload_to='midi_files/')
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"MIDI for {self.transcription.audio_file.title}"

class SheetMusic(models.Model):
    transcription = models.ForeignKey(Transcription, on_delete=models.CASCADE)
    pdf_file = models.FileField(upload_to='pdf_files/')
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sheet Music for {self.transcription.audio_file.title}"

class Tag(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class TranscriptionTag(models.Model):
    transcription = models.ForeignKey(Transcription, related_name='transcription_tags', on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, related_name='transcription_tags', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('transcription', 'tag')

class Rating(models.Model):
    transcription = models.ForeignKey(Transcription, related_name='ratings', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('transcription', 'user')
