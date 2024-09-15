import pytest
from graphene.test import Client
from graphql_jwt.testcases import JSONWebTokenTestCase
from django.contrib.auth import get_user_model
from graphql_relay import to_global_id
from tunescript_app.schema import schema
from .factories import (
    UserFactory, ProfileFactory, AudioFileFactory, TranscriptionFactory, FavoriteFactory
)
from tunescript_app.models import Favorite
from graphql_relay import to_global_id, from_global_id

User = get_user_model()

class MockSession(dict):
    def flush(self):
        pass

class CustomContext:
    def __init__(self, user=None):
        self.user = user
        self.session = MockSession()

    def __getattr__(self, name):
        return getattr(self.session, name, None)

@pytest.fixture
def user():
    return UserFactory()

@pytest.fixture
def profile(user):
    return ProfileFactory(user=user)

@pytest.fixture
def graphql_client(user):
    client = Client(schema)
    client.user = user
    return client

@pytest.mark.django_db
class TestMutations:
    def execute_mutation(self, client, mutation, variables=None):
        context = CustomContext(user=client.user)
        return client.execute(mutation, variables=variables, context=context)

    def test_activate_premium_mutation(self, graphql_client, profile):
        mutation = '''
        mutation {
            activatePremium(durationDays: 30) {
                profile {
                    isPremium
                    premiumStartDate
                    premiumEndDate
                }
            }
        }
        '''
        response = self.execute_mutation(graphql_client, mutation)
        assert 'errors' not in response
        assert response['data']['activatePremium']['profile']['isPremium'] is True

    def test_create_transcription_mutation(self, graphql_client, user):
        audio_file = AudioFileFactory(user=user)
        mutation = '''
        mutation($audioFileId: Int!, $title: String!, $isPublic: Boolean!) {
            createTranscription(audioFileId: $audioFileId, title: $title, isPublic: $isPublic) {
                transcription {
                    id
                    title
                    status
                }
            }
        }
        '''
        variables = {
            'audioFileId': audio_file.id,
            'title': 'Test Transcription',
            'isPublic': True
        }
        response = self.execute_mutation(graphql_client, mutation, variables)
        assert 'errors' not in response
        assert response['data']['createTranscription']['transcription']['title'] == 'Test Transcription'
        assert response['data']['createTranscription']['transcription']['status'] == 'PENDING'

    def test_deactivate_premium_mutation(self, graphql_client, profile):
        profile.activate_premium()
        mutation = '''
        mutation {
            deactivatePremium {
                profile {
                    isPremium
                    premiumStartDate
                    premiumEndDate
                }
            }
        }
        '''
        response = self.execute_mutation(graphql_client, mutation)
        assert 'errors' not in response
        assert response['data']['deactivatePremium']['profile']['isPremium'] is False

    def test_logout_mutation(self, graphql_client):
        mutation = '''
        mutation {
            logout {
                success
            }
        }
        '''
        response = self.execute_mutation(graphql_client, mutation)
        assert 'errors' not in response, f"Unexpected errors: {response.get('errors')}"
        assert response['data']['logout']['success'] is True

    def test_rate_transcription_mutation(self, graphql_client, user):
        transcription = TranscriptionFactory()
        mutation = '''
        mutation($transcriptionId: ID!, $ratingValue: Int!) {
            rateTranscription(transcriptionId: $transcriptionId, ratingValue: $ratingValue) {
                rating {
                    rating
                }
                transcription {
                    avgRating
                    numRatings
                }
            }
        }
        '''
        variables = {
            'transcriptionId': to_global_id('TranscriptionType', transcription.id),
            'ratingValue': 4,
        }
        response = self.execute_mutation(graphql_client, mutation, variables)
        assert 'errors' not in response
        assert response['data']['rateTranscription']['rating']['rating'] == 4

    def test_register_mutation(self, graphql_client):
        mutation = '''
        mutation {
            register(username: "newuser", email: "newuser@example.com", password: "password123") {
                user {
                    username
                    email
                }
            }
        }
        '''
        response = self.execute_mutation(graphql_client, mutation)
        assert 'errors' not in response
        assert response['data']['register']['user']['username'] == 'newuser'
        assert response['data']['register']['user']['email'] == 'newuser@example.com'

    def test_share_transcription_mutation(self, graphql_client, user):
        transcription = TranscriptionFactory(user=user)
        mutation = '''
        mutation($transcriptionId: ID!) {
            shareTranscription(transcriptionId: $transcriptionId) {
                shareUrl
            }
        }
        '''
        variables = {'transcriptionId': to_global_id('TranscriptionType', transcription.id)}
        response = self.execute_mutation(graphql_client, mutation, variables)
        assert 'errors' not in response
        assert 'shareUrl' in response['data']['shareTranscription']
        assert 'http://localhost:3000/transcription/' in response['data']['shareTranscription']['shareUrl']

    def test_update_profile_mutation(self, graphql_client, profile):
        mutation = '''
        mutation($bio: String!, $public: Boolean!) {
            updateProfile(bio: $bio, public: $public) {
                profile {
                    bio
                    public
                }
            }
        }
        '''
        variables = {
            'bio': 'New bio',
            'public': True
        }
        response = self.execute_mutation(graphql_client, mutation, variables)
        assert 'errors' not in response
        assert response['data']['updateProfile']['profile']['bio'] == 'New bio'
        assert response['data']['updateProfile']['profile']['public'] is True

    def test_update_transcription_mutation(self, graphql_client, user):
        transcription = TranscriptionFactory(user=user)
        mutation = '''
        mutation($id: Int!, $title: String!, $isPublic: Boolean!) {
            updateTranscription(id: $id, title: $title, isPublic: $isPublic) {
                transcription {
                    title
                    public
                }
            }
        }
        '''
        variables = {
            'id': transcription.id,
            'title': 'Updated Title',
            'isPublic': False
        }
        response = self.execute_mutation(graphql_client, mutation, variables)
        assert 'errors' not in response
        assert response['data']['updateTranscription']['transcription']['title'] == 'Updated Title'
        assert response['data']['updateTranscription']['transcription']['public'] is False

    def test_add_to_favorites_mutation(self, graphql_client, user):
        transcription = TranscriptionFactory()
        mutation = '''
        mutation($transcriptionId: ID!) {
            addToFavorites(transcriptionId: $transcriptionId) {
                favorite {
                    transcription {
                        id
                    }
                    user {
                        username
                    }
                }
            }
        }
        '''
        variables = {'transcriptionId': to_global_id('TranscriptionType', transcription.id)}
        response = self.execute_mutation(graphql_client, mutation, variables)
        assert 'errors' not in response
        assert response['data']['addToFavorites']['favorite']['transcription']['id'] == to_global_id('TranscriptionType', transcription.id)
        assert response['data']['addToFavorites']['favorite']['user']['username'] == user.username

    def test_remove_from_favorites_mutation(self, graphql_client, user):
        favorite = FavoriteFactory(user=user)
        mutation = '''
        mutation($transcriptionId: ID!) {
            removeFromFavorites(transcriptionId: $transcriptionId) {
                success
            }
        }
        '''
        variables = {'transcriptionId': to_global_id('TranscriptionType', favorite.transcription.id)}
        response = self.execute_mutation(graphql_client, mutation, variables)
        assert 'errors' not in response
        assert response['data']['removeFromFavorites']['success'] is True
        assert not Favorite.objects.filter(user=user, transcription=favorite.transcription).exists()