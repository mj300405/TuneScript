import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files import File
from django.conf import settings
from tunescript_app.models import Profile, AudioFile, Transcription, Tag, Rating, Favorite, UserPlayHistory, MIDIFile, SheetMusic
from django.utils import timezone
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create or get the admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            email='michal-jagoda@o2.pl',
            defaults={'is_superuser': True, 'is_staff': True}
        )
        if created:
            admin_user.set_password('admin')
            admin_user.email_confirmed = True  # Automatically confirm email
            admin_user.save()
            Profile.objects.get_or_create(user=admin_user)
            self.stdout.write(self.style.SUCCESS('Created admin user with confirmed email'))
        else:
            self.stdout.write('Admin user already exists')

        # Check if the database is already populated (excluding the admin user)
        if User.objects.exclude(username='admin').exists():
            self.stdout.write('Database already contains data, skipping further seeding.')
            return

        # Create additional users
        users = [admin_user]
        for i in range(4):  # Create 4 more users in addition to admin
            user = User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@example.com',
                password='password'
            )
            user.email_confirmed = True  # Automatically confirm email
            user.save()
            Profile.objects.create(user=user)
            users.append(user)

        self.stdout.write(self.style.SUCCESS(f'Created {len(users)} users in total with confirmed emails'))

        # Create tags
        tags = ['Classical', 'Jazz', 'Rock', 'Pop', 'Electronic', 'Blues', 'Country', 'Hip Hop', 'R&B', 'Folk']
        for tag_name in tags:
            Tag.objects.create(name=tag_name)

        self.stdout.write(self.style.SUCCESS(f'Created tags: {", ".join(tags)}'))

        # Create transcription
        transcription_data = {
            'title': 'Bach Composition',
            'composer': 'Johann Sebastian Bach',
            'genre': 'Classical',
            'player': 'Unknown',
            'audio_file': 'audio_files/cut_bach.mp3',
            'midi_file': 'midi_files/Bach.mid',
            'pdf_file': 'pdf_files/Bach.pdf',
        }

        user = random.choice(users)
        
        audio_path = os.path.join(settings.MEDIA_ROOT, transcription_data['audio_file'])
        with open(audio_path, 'rb') as audio_file:
            audio_instance = AudioFile.objects.create(
                user=user,
                title=transcription_data['title'],
                audio_file=File(audio_file, name=os.path.basename(audio_path))
            )

        transcription = Transcription.objects.create(
            audio_file=audio_instance,
            user=user,
            title=transcription_data['title'],
            composer=transcription_data['composer'],
            genre=transcription_data['genre'],
            player=transcription_data['player'],
            public=random.choice([True, False]),
            status='COMPLETED'
        )

        # Create MIDI and Sheet Music files
        midi_path = os.path.join(settings.MEDIA_ROOT, transcription_data['midi_file'])
        with open(midi_path, 'rb') as midi_file:
            MIDIFile.objects.create(
                transcription=transcription,
                midi_file=File(midi_file, name=os.path.basename(midi_path))
            )

        pdf_path = os.path.join(settings.MEDIA_ROOT, transcription_data['pdf_file'])
        with open(pdf_path, 'rb') as pdf_file:
            SheetMusic.objects.create(
                transcription=transcription,
                pdf_file=File(pdf_file, name=os.path.basename(pdf_path))
            )

        # Add ratings (one per user)
        for user in users:
            Rating.objects.create(
                user=user,
                transcription=transcription,
                rating=random.randint(1, 5),
            )

        # Add favorites (ensure no duplicates)
        for user in random.sample(users, min(3, len(users))):
            Favorite.objects.get_or_create(
                user=user,
                transcription=transcription
            )

        # Add play history (ensure no duplicates)
        for user in users:
            UserPlayHistory.objects.get_or_create(
                user=user,
                transcription=transcription,
                defaults={
                    'play_time': random.randint(30, 300),
                    'play_count': random.randint(1, 10)
                }
            )

        self.stdout.write(self.style.SUCCESS(f'Created transcription: {transcription.title}'))

        # Activate premium for some users, including admin
        admin_user.profile.activate_premium()
        self.stdout.write(self.style.SUCCESS(f'Activated premium for admin user'))

        for user in random.sample(users[1:], 1):  # Activate for one more user besides admin
            user.profile.activate_premium()
            self.stdout.write(self.style.SUCCESS(f'Activated premium for user: {user.username}'))

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))