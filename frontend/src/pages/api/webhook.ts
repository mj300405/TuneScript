// pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

let transcriptionStatus: { [key: number]: any } = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    console.error('Unauthorized access attempt');
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.method === 'POST') {
    const data = req.body;
    console.log('Received raw body:', data);
    const { transcription_id, status, message, title, audio_file_name, midi_file_url, sheet_music_url } = data;
    console.log('Parsed body:', data);
    transcriptionStatus[transcription_id] = { status, message, title, audio_file_name, midi_file_url, sheet_music_url };

    // Use window.postMessage to send data to the frontend
    if (typeof window !== 'undefined') {
      window.postMessage(data, '*');
    }

    res.status(200).json({ message: 'Status updated' });
  } else if (req.method === 'GET') {
    const { id } = req.query;
    if (id && typeof id === 'string') {
      const status = transcriptionStatus[parseInt(id, 10)];
      if (status) {
        res.status(200).json(status);
      } else {
        res.status(404).json({ message: 'Status not found' });
      }
    } else {
      res.status(400).json({ message: 'Invalid transcription ID' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
