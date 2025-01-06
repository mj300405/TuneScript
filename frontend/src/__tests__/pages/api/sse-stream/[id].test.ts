import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../../pages/api/sse-stream/[id]';
import { ReadableStream } from 'web-streams-polyfill';

// Mock fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock ReadableStream
class MockReadableStream {
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array>;

  constructor() {
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller;
      },
    });
    this.reader = stream.getReader();
  }

  pushData(data: string) {
    if (this.controller) {
      this.controller.enqueue(new TextEncoder().encode(data));
    }
  }

  close() {
    if (this.controller) {
      this.controller.close();
    }
  }

  getReader() {
    return this.reader;
  }
}

describe('SSE Stream API Route', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockStream: MockReadableStream;

  beforeEach(() => {
    mockReq = {
      query: { id: 'test-id' },
      on: jest.fn(),
    };
    mockRes = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockStream = new MockReadableStream();
    mockFetch.mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful SSE stream', async () => {
    const handlerPromise = handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Simulate SSE messages
    mockStream.pushData('data: {"status":"PENDING"}\n\n');
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to allow processing
    mockStream.pushData('data: {"status":"COMPLETED"}\n\n');
    mockStream.close();

    await handlerPromise;

    expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    expect(mockRes.write).toHaveBeenCalledTimes(2);
    expect(mockRes.write).toHaveBeenNthCalledWith(1, 'data: {"status":"PENDING"}\n\n');
    expect(mockRes.write).toHaveBeenNthCalledWith(2, 'data: {"status":"COMPLETED"}\n\n');
    expect(mockRes.end).toHaveBeenCalled();
  });

  it('should return 400 for invalid ID', async () => {
    mockReq.query = {};
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid transcription ID' });
  });

  it('should handle fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Fetch error'));
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});