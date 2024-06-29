declare module 'apollo-upload-client' {
    import { ApolloLink } from '@apollo/client/core';
    export function createUploadLink(options?: any): ApolloLink;
  }