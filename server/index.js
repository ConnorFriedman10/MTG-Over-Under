const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const MIN_PRICE = 0.20;

let cardCatalog = [];
let catalogReady = false;

const mapCard = (data) => ({
  id: data.id,
  name: data.name,
  set: data.set_name,
  image: data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal,
  artist: data.artist,
  scryfallUri: data.scryfall_uri,
  price: data.prices?.usd
});

const loadCatalog = async () => {
  try {
    // Fetch the bulk data index to get the current download URL
    const indexRes = await fetch('https://api.scryfall.com/bulk-data/default-cards', {
      headers: { 'User-Agent': 'MTG-Over-Under/1.0', 'Accept': 'application/json' }
    });
    const { download_uri } = await indexRes.json();

    const dataRes = await fetch(download_uri, {
      headers: { 'User-Agent': 'MTG-Over-Under/1.0' }
    });
    const cards = await dataRes.json();

    cardCatalog = cards.filter(c =>
      c.games?.includes('paper') &&
      c.finishes?.includes('nonfoil') &&
      !c.type_line?.includes('Basic') &&
      Number(c.prices?.usd) > MIN_PRICE &&
      (c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal)
    ).map(mapCard);

    catalogReady = true;
    console.log(`Catalog loaded: ${cardCatalog.length} cards`);

    // Refresh daily
    setTimeout(loadCatalog, 24 * 60 * 60 * 1000);
  } catch (err) {
    console.error('Failed to load catalog, retrying in 60s:', err.message);
    setTimeout(loadCatalog, 60_000);
  }
};

loadCatalog();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (req, res) => {
  res.send('API is up');
});

app.get('/api/cards/random', (req, res) => {
  if (!catalogReady) {
    return res.status(503).json({ error: 'Server is still loading, please try again in a moment.' });
  }
  const card = cardCatalog[Math.floor(Math.random() * cardCatalog.length)];
  res.json(card);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
