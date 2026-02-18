// Lightweight proxy stub for Judge0; replace with real integration.
// Keeps interface consistent while executor work is pending.
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const RAPID_API_KEY = process.env.RAPIDAPI_KEY || '';

app.post('/submissions', async (req, res) => {
  try {
    const resp = await fetch(`${JUDGE0_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(RAPID_API_KEY && { 'X-RapidAPI-Key': RAPID_API_KEY }),
      },
      body: JSON.stringify(req.body),
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Proxy error', detail: String(e) });
  }
});

const PORT = process.env.JUDGE0_PROXY_PORT || 3100;
app.listen(PORT, () => console.log(`Judge0 proxy stub listening on ${PORT}`));
