// src/lib/queries.ts
import { gql } from '@apollo/client';

export const SEARCH_TRANSCRIPTIONS = gql`
  query SearchTranscriptions($title: String, $composer: String, $tag: String, $player: String, $minRating: Float, $visibility: String) {
    transcriptions(title: $title, composer: $composer, tag: $tag, player: $player, minRating: $minRating, visibility: $visibility) {
      id
      title
      composer
      tags {
        id
        name
      }
      player
      visibility
      averageRating
      numRatings
      status
    }
  }
`;

export const GET_TITLE_SUGGESTIONS = gql`
  query GetTitleSuggestions($prefix: String!) {
    getTitleSuggestions(prefix: $prefix)
  }
`;

export const GET_COMPOSER_SUGGESTIONS = gql`
  query GetComposerSuggestions($prefix: String!) {
    getComposerSuggestions(prefix: $prefix)
  }
`;

export const GET_PLAYER_SUGGESTIONS = gql`
  query GetPlayerSuggestions($prefix: String!) {
    getPlayerSuggestions(prefix: $prefix)
  }
`;