const express = require('express');

const app = express();
const PORT = 3000;

//Route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

//mtg stuff
// Optional: allow your Vite dev server origin in development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  next();
});

app.get('/api/cards/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'Missing query param: q' });
    }

    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MTG-Over-Under/1.0',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Return only fields your UI needs
    const cards = (data.data || []).map(card => ({
      id: card.id,
      name: card.name,
      set: card.set_name,
      image: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
      artist: card.artist,
      scryfallUri: card.scryfall_uri
    }));

    res.json({ total: data.total_cards || cards.length, cards });
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching Scryfall.' });
  }
});

app.get('/', (req, res) => {
  res.send('API is up');
});

app.listen(PORT, () => {
  console.log("server is running in port");
});