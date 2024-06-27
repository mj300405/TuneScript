# tests.py
import pytest
from django.contrib.auth import get_user_model
from graphene_django.utils.testing import graphql_query
from tunescript_app.models import AudioFile, Transcription

User = get_user_model()

@pytest.mark.django_db
def test_register_user(client):
    query = '''
        mutation {
            register(username: "testuser", password: "password123", email: "testuser@example.com") {
                user {
                    id
                    username
                    email
                }
            }
        }
    '''
    response = graphql_query(query, client=client)
    content = response.json()
    assert 'errors' not in content
    assert content['data']['register']['user']['username'] == 'testuser'

@pytest.mark.django_db
def test_login_user(client):
    User.objects.create_user(username="testuser", password="password123", email="testuser@example.com")
    query = '''
        mutation {
            tokenAuth(username: "testuser", password: "password123") {
                token
            }
        }
    '''
    response = graphql_query(query, client=client)
    content = response.json()
    assert 'errors' not in content
    assert 'token' in content['data']['tokenAuth']

@pytest.mark.django_db
def test_upload_audio_file(client):
    user = User.objects.create_user(username="testuser", password="password123", email="testuser@example.com")
    client.login(username="testuser", password="password123")
    query = '''
        mutation($file: Upload!, $title: String!) {
            uploadAudioFile(audioFile: $file, title: $title) {
                audioFile {
                    id
                    title
                    audioFile
                }
            }
        }
    '''
    with open('path/to/test/audio/file.mp3', 'rb') as audio_file:
        response = graphql_query(
            query,
            variables={'file': audio_file, 'title': "Test Audio"},
            client=client
        )
    content = response.json()
    assert 'errors' not in content
    assert content['data']['uploadAudioFile']['audioFile']['title'] == "Test Audio"

@pytest.mark.django_db
def test_create_transcription(client):
    user = User.objects.create_user(username="testuser", password="password123", email="testuser@example.com")
    client.login(username="testuser", password="password123")
    audio_file = AudioFile.objects.create(user=user, title="Test Audio", audio_file="path/to/audio/file.mp3")
    query = '''
        mutation {
            createTranscription(audioFileId: 1, title: "Test Transcription") {
                transcription {
                    id
                    title
                    status
                }
            }
        }
    '''
    response = graphql_query(query, client=client)
    content = response.json()
    assert 'errors' not in content
    assert content['data']['createTranscription']['transcription']['title'] == "Test Transcription"

@pytest.mark.django_db
def test_password_reset(client):
    User.objects.create_user(username="testuser", password="password123", email="testuser@example.com")
    query = '''
        mutation {
            passwordReset(email: "testuser@example.com") {
                success
                message
            }
        }
    '''
    response = graphql_query(query, client=client)
    content = response.json()
    assert 'errors' not in content
    assert content['data']['passwordReset']['success'] is True

@pytest.mark.django_db
def test_update_transcription(client):
    user = User.objects.create_user(username="testuser", password="password123", email="testuser@example.com")
    client.login(username="testuser", password="password123")
    audio_file = AudioFile.objects.create(user=user, title="Test Audio", audio_file="path/to/audio/file.mp3")
    transcription = Transcription.objects.create(audio_file=audio_file, user=user, title="Test Transcription", status="PENDING")
    query = '''
        mutation {
            updateTranscription(id: 1, title: "Updated Title") {
                transcription {
                    id
                    title
                }
            }
        }
    '''
    response = graphql_query(query, client=client)
    content = response.json()
    assert 'errors' not in content
    assert content['data']['updateTranscription']['transcription']['title'] == "Updated Title"

@pytest.mark.django_db
def test_delete_transcription(client):
    user = User.objects.create_user(username="testuser", password="password123", email="testuser@example.com")
    client.login(username="testuser", password="password123")
    audio_file = AudioFile.objects.create(user=user, title="Test Audio", audio_file="path/to/audio/file.mp3")
    transcription = Transcription.objects.create(audio_file=audio_file, user=user, title="Test Transcription", status="PENDING")
    query = '''
        mutation {
            deleteTranscription(id: 1) {
                success
            }
        }
    '''
    response = graphql_query(query, client=client)
    content = response.json()
    assert 'errors' not in content
    assert content['data']['deleteTranscription']['success'] is True

@pytest.mark.django_db
def test_rate_transcription(client):
    user = User.objects.create_user(username="testuser", password="password123", email="testuser@example.com")
    client.login(username="testuser", password="password123")
    audio_file = AudioFile.objects.create(user=user, title="Test Audio", audio_file="path/to/audio/file.mp3")
    transcription = Transcription.objects.create(audio_file=audio_file, user=user, title="Test Transcription", status="COMPLETED")
    query = '''
        mutation {
            rateTranscription(transcriptionId: 1, ratingValue: 5, comment: "Great!") {
                rating {
                    id
                    rating
                    comment
                }
            }
        }
    '''
    response = graphql_query(query, client=client)
    content = response.json()
    assert 'errors' not in content
    assert content['data']['rateTranscription']['rating']['rating'] == 5
    assert content['data']['rateTranscription']['rating']['comment'] == "Great!"

@pytest.mark.django_db
def test_bookmark_transcription(client):
    user = User.objects.create_user(username="testuser", password="password123", email="testuser@example.com")
    client.login(username="testuser", password="password123")
    audio_file = AudioFile.objects.create(user=user, title="Test Audio", audio_file="path/to/audio/file.mp3")
    transcription = Transcription.objects.create(audio_file=audio_file, user=user, title="Test Transcription", status="COMPLETED")
    query = '''
        mutation {
            bookmarkTranscription(transcriptionId: 1) {
                favorite {
                    id
                    transcription {
                        id
                        title
                    }
                }
            }
        }
    '''
    response = graphql_query(query, client=client)
    content = response.json()
    assert 'errors' not in content
    assert content['data']['bookmarkTranscription']['favorite']['transcription']['title'] == "Test Transcription"
