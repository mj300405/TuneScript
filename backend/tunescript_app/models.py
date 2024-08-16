# backend/tunescript_app/models.py

from django.db import models, transaction
from datetime import datetime, timedelta
from django.templatetags.static import static
from django.contrib.auth.models import AbstractUser
from django.db.models import Avg, F
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    email_confirmed = models.BooleanField(default=False)
    
    # Add related_name to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='tunescript_user_set',
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='tunescript_user_set',
        related_query_name='user',
    )

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

    def get_profile_picture_url(self):
        if self.profile_picture and hasattr(self.profile_picture, 'url'):
            return self.profile_picture.url
        return static('images/default_profile_picture.png')

class AudioFile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    audio_file = models.FileField(upload_to='audio_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Transcription(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    audio_file = models.ForeignKey('AudioFile', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    genre = models.CharField(max_length=100, blank=True)
    title = models.CharField(max_length=200)
    composer = models.CharField(max_length=200, blank=True)
    player = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    public = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0)
    num_ratings = models.IntegerField(default=0)
    avg_rating = models.FloatField(default=0.0)

    def __str__(self):
        return f"Transcription for {self.audio_file.title}"

    def update_rating(self, new_rating):
        with transaction.atomic():
            self.num_ratings = F('num_ratings') + 1
            self.avg_rating = (F('avg_rating') * F('num_ratings') + new_rating) / (F('num_ratings') + 1)
            self.save()
            self.refresh_from_db()

    def update_rating_on_change(self, old_rating, new_rating):
        with transaction.atomic():
            self.avg_rating = (F('avg_rating') * F('num_ratings') - old_rating + new_rating) / F('num_ratings')
            self.save()
            self.refresh_from_db()

    def recalculate_rating(self):
        with transaction.atomic():
            ratings = self.rating_set.all()
            self.num_ratings = ratings.count()
            self.avg_rating = ratings.aggregate(Avg('rating'))['rating__avg'] or 0.0
            self.save()

class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    transcription = models.ForeignKey(Transcription, on_delete=models.CASCADE, related_name='rating_set')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'transcription')
        indexes = [
            models.Index(fields=['user', 'transcription']),
            models.Index(fields=['rating']),
        ]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not is_new:
            old_rating = Rating.objects.get(pk=self.pk).rating
        
        super().save(*args, **kwargs)
        
        if is_new:
            self.transcription.update_rating(self.rating)
        else:
            self.transcription.update_rating_on_change(old_rating, self.rating)

    def delete(self, *args, **kwargs):
        transcription = self.transcription
        super().delete(*args, **kwargs)
        transcription.recalculate_rating()

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


class UserPlayHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    transcription = models.ForeignKey(Transcription, on_delete=models.CASCADE)
    play_time = models.PositiveIntegerField(default=0)  # in seconds
    last_played = models.DateTimeField(auto_now=True)
    play_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'transcription')

    def __str__(self):
        return f"{self.user.username} - {self.transcription.title}"