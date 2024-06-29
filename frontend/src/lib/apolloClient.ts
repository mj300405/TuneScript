// src/lib/apolloClient.ts
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';
import { setContext } from '@apollo/client/link/context';

// Create an upload link
const uploadLink = createUploadLink({
  uri: 'http://localhost:8000/graphql/', // Note the trailing slash
});

// Set up the auth link to include JWT token in headers
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      Authorization: token ? `JWT ${token}` : "",
    }
  };
});

// Combine the auth link and upload link
const client = new ApolloClient({
  link: authLink.concat(uploadLink),
  cache: new InMemoryCache(),
});

export default client;
