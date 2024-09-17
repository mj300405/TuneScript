import pytest
from django.contrib.auth import get_user_model
from graphene.test import Client
from graphql_relay import to_global_id

from tunescript_app.schema import schema

from .factories import (
    FavoriteFactory,
    ProfileFactory,
    RatingFactory,
    TagFactory,
    TranscriptionFactory,
    UserFactory,
    UserPlayHistoryFactory,
)

User = get_user_model()


class CustomContext(dict):
    def __init__(self, user=None):
        self.user = user


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
class TestQueries:
    def execute_query(self, client, query, variables=None):
        context = CustomContext(user=client.user)
        return client.execute(query, variables=variables, context=context)

    def test_users_query(self, graphql_client):
        UserFactory.create_batch(3)
        query = """
        query {
            users {
                id
                username
                email
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert len(response["data"]["users"]) == 4  # 3 created + 1 from fixture

    def test_profiles_query(self, graphql_client, profile):
        # Create 2 additional profiles (3 in total including the one from the fixture)
        ProfileFactory.create_batch(2)
        query = """
        query {
            profiles {
                id
                bio
                public
                isPremium
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert len(response["data"]["profiles"]) == 3  # 2 created + 1 from user fixture

    def test_transcriptions_query(self, graphql_client, user):
        TranscriptionFactory.create_batch(5, public=True)
        TranscriptionFactory.create_batch(2, public=False, user=user)
        query = """
        query {
            transcriptions {
                id
                title
                composer
                genre
                player
                public
                avgRating
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert len(response["data"]["transcriptions"]) == 7

    def test_transcription_query(self, graphql_client):
        transcription = TranscriptionFactory(public=True)
        query = """
        query($id: ID!) {
            transcription(id: $id) {
                id
                title
                composer
                genre
                player
                public
                avgRating
            }
        }
        """
        variables = {"id": to_global_id("TranscriptionType", transcription.id)}
        response = self.execute_query(graphql_client, query, variables)
        assert "errors" not in response
        assert response["data"]["transcription"]["title"] == transcription.title

    def test_tags_query(self, graphql_client):
        TagFactory.create_batch(5)
        query = """
        query {
            tags {
                id
                name
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert len(response["data"]["tags"]) == 5

    def test_search_transcriptions_query(self, graphql_client):
        TranscriptionFactory(title="Jazz Piano", composer="John Doe", public=True)
        TranscriptionFactory(
            title="Classical Guitar", composer="Jane Smith", public=True
        )
        query = """
        query($title: String, $composer: String, $isPublic: Boolean) {
            searchTranscriptions(title: $title, composer: $composer, isPublic: $isPublic) {
                id
                title
                composer
                public
            }
        }
        """
        variables = {"title": "Jazz", "composer": "John", "isPublic": True}
        response = self.execute_query(graphql_client, query, variables)
        assert "errors" not in response
        assert len(response["data"]["searchTranscriptions"]) == 1
        assert response["data"]["searchTranscriptions"][0]["title"] == "Jazz Piano"

    def test_me_query(self, graphql_client, user):
        query = """
        query {
            me {
                id
                username
                email
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert response["data"]["me"]["username"] == user.username

    def test_profile_query(self, graphql_client, profile):
        query = """
        query {
            profile {
                id
                bio
                public
                isPremium
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert response["data"]["profile"]["id"] == str(profile.id)

    def test_my_transcriptions_query(self, graphql_client, user):
        TranscriptionFactory.create_batch(3, user=user)
        query = """
        query {
            myTranscriptions {
                id
                title
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert len(response["data"]["myTranscriptions"]) == 3

    def test_highest_rated_transcriptions_query(self, graphql_client):
        transcriptions = TranscriptionFactory.create_batch(7, public=True)
        for transcription in transcriptions:
            RatingFactory.create_batch(3, transcription=transcription)
            transcription.recalculate_rating()
        query = """
        query {
            highestRatedTranscriptions {
                id
                title
                avgRating
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert len(response["data"]["highestRatedTranscriptions"]) == 5

    def test_recent_transcriptions_query(self, graphql_client):
        TranscriptionFactory.create_batch(7, public=True)
        query = """
        query {
            recentTranscriptions {
                id
                title
                createdAt
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert len(response["data"]["recentTranscriptions"]) == 5

    def test_recommended_transcriptions_query(self, graphql_client, user):
        # Create public transcriptions with different genres
        jazz_transcriptions = TranscriptionFactory.create_batch(
            3, public=True, genre="Jazz"
        )
        classical_transcriptions = TranscriptionFactory.create_batch(
            3, public=True, genre="Classical"
        )
        rock_transcriptions = TranscriptionFactory.create_batch(
            3, public=True, genre="Rock"
        )

        # Create user play history with Jazz genre
        UserPlayHistoryFactory(user=user, transcription=jazz_transcriptions[0])
        UserPlayHistoryFactory(user=user, transcription=jazz_transcriptions[1])

        query = """
        query {
            recommendedTranscriptions {
                id
                title
                genre
            }
        }
        """
        response = self.execute_query(graphql_client, query)

        print("Response:", response)  # Debug print

        if "errors" in response:
            assert False, f"GraphQL query returned errors: {response['errors']}"

        recommended = response["data"]["recommendedTranscriptions"]

        assert len(recommended) > 0, "No recommended transcriptions returned"

        # Check if at least one of the recommended transcriptions has the genre "Jazz"
        assert any(
            t["genre"] == "Jazz" for t in recommended
        ), "No Jazz transcriptions in recommendations"

    def test_user_statistics_query(self, graphql_client, user):
        transcriptions = TranscriptionFactory.create_batch(3, user=user)
        for transcription in transcriptions:
            RatingFactory.create_batch(2, transcription=transcription)
            transcription.recalculate_rating()
        UserPlayHistoryFactory.create_batch(5, user=user)
        query = """
        query {
            userStatistics {
                totalTranscriptions
                averageRating
                totalPlayTime
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert response["data"]["userStatistics"]["totalTranscriptions"] == 3
        assert "averageRating" in response["data"]["userStatistics"]
        assert "totalPlayTime" in response["data"]["userStatistics"]

    def test_transcription_with_rating_query(self, graphql_client, user):
        transcription = TranscriptionFactory(public=True)
        RatingFactory(transcription=transcription, user=user, rating=4)
        query = """
        query($id: Int!) {
            transcriptionWithRating(id: $id) {
                id
                title
                userRating
            }
        }
        """
        variables = {"id": transcription.id}
        response = self.execute_query(graphql_client, query, variables)
        assert "errors" not in response
        assert response["data"]["transcriptionWithRating"]["userRating"] == 4

    def test_transcription_by_share_token_query(self, graphql_client):
        transcription = TranscriptionFactory(public=True)
        share_token = transcription.generate_share_token()
        query = """
        query($token: UUID!) {
            transcriptionByShareToken(token: $token) {
                id
                title
            }
        }
        """
        variables = {"token": str(share_token)}
        response = self.execute_query(graphql_client, query, variables)
        assert "errors" not in response
        assert response["data"]["transcriptionByShareToken"]["id"] == to_global_id(
            "TranscriptionType", transcription.id
        )

    def test_user_favorites_query(self, graphql_client, user):
        favorite_transcriptions = TranscriptionFactory.create_batch(3)
        for transcription in favorite_transcriptions:
            FavoriteFactory(user=user, transcription=transcription)

        TranscriptionFactory.create_batch(2)  # Non-favorite transcriptions

        query = """
        query {
            userFavorites {
                id
                title
            }
        }
        """
        response = self.execute_query(graphql_client, query)
        assert "errors" not in response
        assert len(response["data"]["userFavorites"]) == 3
        favorite_ids = [
            to_global_id("TranscriptionType", t.id) for t in favorite_transcriptions
        ]
        returned_ids = [t["id"] for t in response["data"]["userFavorites"]]
        assert set(returned_ids) == set(favorite_ids)
