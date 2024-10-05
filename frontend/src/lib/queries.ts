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