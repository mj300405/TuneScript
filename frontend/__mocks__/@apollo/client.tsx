import React from 'react';

export const gql = jest.fn((strings, ...args) => strings.join(''));

export const useQuery = jest.fn().mockReturnValue({
  loading: false,
  error: null,
  data: null,
  refetch: jest.fn(),
});

export const useMutation = jest.fn().mockReturnValue([
  jest.fn(),
  { loading: false, error: null, data: null },
]);

export const useApolloClient = jest.fn().mockReturnValue({
  query: jest.fn(),
  mutate: jest.fn(),
  resetStore: jest.fn(),
});

export const ApolloProvider = ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children);

export const InMemoryCache = jest.fn();

export const ApolloClient = jest.fn().mockReturnValue({
  query: jest.fn(),
  mutate: jest.fn(),
  resetStore: jest.fn(),
});