const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const SCRYFALL_QUERY = '-t:basic usd>0.2 game:paper finish:nonfoil';
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


const fetchSpecificCardArt = async (q) => {
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

  return {
    image: data.image_uris?.normal || data.card_faces?.[0]?.image_uris?.normal
  };
};

const refillPool = () => {
  const needed = POOL_SIZE - cardPool.length;
  for (let i = 0; i < needed; i++) {
    setTimeout(() => {
      fetchCardFromScryfall()
        .then(card => cardPool.push(card))
        .catch(() => {});
    }, i * 150);
  }
};

refillPool();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

app.use('/api/', rateLimit({ windowMs: 60_000, max: 30 }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.get('/', (req, res) => {
  res.send('API is up');
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

app.listen(PORT, () => {
  console.log("server is running in port");
});