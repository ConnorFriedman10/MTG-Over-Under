const fs = require('fs');
const path = require('path');

const SCRYFALL_QUERY = '-t:basic usd>0.2 game:paper finish:nonfoil';
const TARGET_PAGES = 6;
const OUTPUT_PATH = path.join(__dirname, '../client/public/cards.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const fetchPage = async (url) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MTG-Over-Under/1.0', 'Accept': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || 'Scryfall error');
  return data;
};

const main = async () => {
  console.log('Fetching cards from Scryfall...');
  const cards = [];
  let url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(SCRYFALL_QUERY)}`;
  let page = 0;

  while (url && page < TARGET_PAGES) {
    console.log(`Fetching page ${page + 1}...`);
    const data = await fetchPage(url);

    for (const card of data.data) {
      const image = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
      if (!image || !card.prices?.usd) continue;
      cards.push({
        id: card.id,
        name: card.name,
        set: card.set_name,
        image,
        artist: card.artist,
        scryfallUri: card.scryfall_uri,
        price: card.prices.usd,
      });
    }

    url = data.has_more ? data.next_page : null;
    page++;
    if (url && page < TARGET_PAGES) await sleep(500);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cards));
  console.log(`Done — ${cards.length} cards saved to ${OUTPUT_PATH}`);
};

main().catch(err => { console.error(err.message); process.exit(1); });
