# tunescript_app/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Avg
from .models import Rating, Transcription

@receiver(post_save, sender=Rating)
def update_transcription_rating(sender, instance, **kwargs):
    transcription = instance.transcription
    transcription.recalculate_rating()  # Use the method we've already defined