# tunescript_app/admin.py
from django.contrib import admin

from .models import (AudioFile, Favorite, MIDIFile, Profile, SheetMusic,
                     Transcription)

admin.site.register(Profile)
admin.site.register(AudioFile)
admin.site.register(Transcription)
admin.site.register(MIDIFile)
admin.site.register(SheetMusic)
admin.site.register(Favorite)
