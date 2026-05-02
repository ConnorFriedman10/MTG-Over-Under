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

app.get('/api/cards/random', async (req, res) => {
  try {
    const url = `https://api.scryfall.com/cards/random`;
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
    const card = {
      id: data.id,
      name: data.name,
      set: data.set_name,
      image: data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal,
      artist: data.artist,
      scryfallUri: data.scryfall_uri
    };

    res.json(card);
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