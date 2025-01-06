import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { user_id, question } = req.body;

    try {
      const response = await fetch('http://rag:5000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id, question }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from RAG service');
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error querying RAG system:', error);
      res.status(500).json({ error: 'Failed to get response from RAG system' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}