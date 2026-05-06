const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const SCRYFALL_QUERY = '-t:basic usd>0.2 game:paper finish:nonfoil';
const POOL_SIZE = 20;
const SCRYFALL_INTERVAL_MS = 500; // max 2 Scryfall calls/sec

const cardPool = [];
let refillScheduled = false;

const fetchCardFromScryfall = async () => {
  const response = await fetch(`https://api.scryfall.com/cards/random?q=${encodeURIComponent(SCRYFALL_QUERY)}`, {
    headers: { 'User-Agent': 'MTG-Over-Under/1.0', 'Accept': 'application/json' }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.details || 'Scryfall error');
  const price = data.prices?.usd;
  if (!price || Number(price) <= 0) throw new Error('Card has no valid USD price');
  return {
    id: data.id,
    name: data.name,
    set: data.set_name,
    image: data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal,
    artist: data.artist,
    scryfallUri: data.scryfall_uri,
    price
  };
};

// Refills the pool one card at a time, 500ms apart, so we never burst Scryfall
const scheduleRefill = () => {
  if (refillScheduled || cardPool.length >= POOL_SIZE) return;
  refillScheduled = true;
  setTimeout(async () => {
    refillScheduled = false;
    if (cardPool.length < POOL_SIZE) {
      try {
        const card = await fetchCardFromScryfall();
        cardPool.push(card);
      } catch (_) {}
      scheduleRefill();
    }
  }, SCRYFALL_INTERVAL_MS);
};

scheduleRefill();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (req, res) => res.send('API is up'));

app.get('/api/cards/random', async (req, res) => {
  try {
    if (cardPool.length > 0) {
      const card = cardPool.shift();
      scheduleRefill();
      return res.json(card);
    }

    // Pool empty — fetch directly but kick off background refill
    const card = await fetchCardFromScryfall();
    scheduleRefill();
    return res.json(card);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch a card, please try again.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
