# tunescript_app/admin.py
from django.contrib import admin
from .models import Profile, AudioFile, Transcription, MIDIFile, SheetMusic, Favorite

admin.site.register(Profile)
admin.site.register(AudioFile)
admin.site.register(Transcription)
admin.site.register(MIDIFile)
admin.site.register(SheetMusic)
admin.site.register(Favorite)
