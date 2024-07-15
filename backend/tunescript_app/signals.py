# tunescript_app/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Avg
from .models import Rating, Transcription

@receiver(post_save, sender=Rating)
def update_transcription_rating(sender, instance, **kwargs):
    transcription = instance.transcription
    avg_rating = transcription.ratings.aggregate(Avg('rating'))['rating__avg']
    transcription.rating = avg_rating or 0
    transcription.num_ratings = transcription.ratings.count()
    transcription.save()