// src/lib/queries.ts
import { gql } from '@apollo/client';

export const SEARCH_TRANSCRIPTIONS = gql`
  query SearchTranscriptions($title: String, $composer: String, $genre: String, $player: String, $minRating: Float, $visibility: String) {
  transcriptions(title: $title, composer: $composer, genre: $genre, player: $player, minRating: $minRating, visibility: $visibility) {
    id
    title
    composer
    genre
    player
    visibility
    averageRating
    numRatings
    status
  }
}
`;
