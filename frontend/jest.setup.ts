import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: '',
    asPath: '',
    push: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn()
    },
    beforePopState: jest.fn(() => null),
    prefetch: jest.fn(() => null)
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor() {
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = () => [];
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver
});

// Canvas mocking
const mockCanvasContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(0),
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({
    width: 0,
  })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
};

Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class MockHTMLCanvasElement {
    getContext(contextType: string) {
      if (contextType === '2d') {
        return mockCanvasContext;
      }
      return null;
    }
    toDataURL() {
      return '';
    }
  },
  writable: true,
});

// Add global Image mock
(global as any).Image = class {
  onload: (() => void) | null = null;
  src: string = '';
  width: number = 0;
  height: number = 0;

  constructor() {
    setTimeout(() => {
      this.width = 100;
      this.height = 100;
      if (this.onload) this.onload();
    });
  }
};

// Mock for react-pdf
jest.mock('react-pdf');

// Mock for Apollo Client
jest.mock('@apollo/client', () => ({
  gql: jest.fn((strings, ...args) => strings.join('')),
  useQuery: jest.fn().mockReturnValue({
    loading: false,
    error: null,
    data: null,
    refetch: jest.fn(),
  }),
  useMutation: jest.fn().mockReturnValue([
    jest.fn(),
    { loading: false, error: null, data: null },
  ]),
  useApolloClient: jest.fn().mockReturnValue({
    query: jest.fn(),
    mutate: jest.fn(),
    resetStore: jest.fn(),
  }),
  ApolloProvider: ({ children }: { children: React.ReactNode }) => children,
  InMemoryCache: jest.fn(),
  ApolloClient: jest.fn().mockReturnValue({
    query: jest.fn(),
    mutate: jest.fn(),
    resetStore: jest.fn(),
  }),
}));