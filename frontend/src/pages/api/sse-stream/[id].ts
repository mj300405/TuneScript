import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid transcription ID' });
    return;
  }

  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const response = await fetch(`http://your-django-backend/sse-stream/${id}/`);
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();

    async function read() {
      try {
        const { done, value } = await reader.read();
    
        if (done) {
          res.end();
          return;
        }

        res.write(new TextDecoder().decode(value));
        await read();
      } catch (error) {
        console.error('Error reading stream:', error);
        res.end();
      }
    }

    await read();

    req.on('close', () => {
      reader.cancel();
    });
  } catch (error) {
    console.error('SSE error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}