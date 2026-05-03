const express = require('express');

const app = express();
const PORT = 3000;
const SCRYFALL_QUERY = '-t:basic usd>0 game:paper';
const POOL_SIZE = 10;

const cardPool = [];

const fetchCardFromScryfall = async () => {
  const response = await fetch(`https://api.scryfall.com/cards/random?q=${encodeURIComponent(SCRYFALL_QUERY)}`, {
    headers: {
      'User-Agent': 'MTG-Over-Under/1.0',
      'Accept': 'application/json'
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.details || 'Scryfall error');
  return {
    id: data.id,
    name: data.name,
    set: data.set_name,
    image: data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal,
    artist: data.artist,
    scryfallUri: data.scryfall_uri,
    price: data.prices.usd
  };
};

const refillPool = () => {
  const needed = POOL_SIZE - cardPool.length;
  for (let i = 0; i < needed; i++) {
    fetchCardFromScryfall()
      .then(card => cardPool.push(card))
      .catch(() => {}); // silently retry on next refill
  }
};

refillPool();

//Route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

//mtg stuff
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  next();
});

app.get('/api/cards/random', async (req, res) => {
  try {
    if (cardPool.length > 0) {
      const card = cardPool.shift();
      refillPool();
      return res.json(card);
    }

    // what happens when the pool is empty
    const card = await fetchCardFromScryfall();
    refillPool();
    return res.json(card);
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