// src/lib/queries.ts
import { gql } from '@apollo/client';

export const SEARCH_TRANSCRIPTIONS = gql`
  query SearchTranscriptions($title: String, $composer: String, $visibility: String) {
    transcriptions(title: $title, composer: $composer, visibility: $visibility) {
      id
      title
      composer
      visibility
      rating
    }
  }
`;
