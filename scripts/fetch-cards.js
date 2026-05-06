const fs = require('fs');
const path = require('path');

const SAMPLE_SIZE = 2000;
const MIN_PRICE = 0.20;
const OUTPUT_PATH = path.join(__dirname, '../client/public/cards.json');

const main = async () => {
  console.log('Fetching Scryfall bulk data index...');
  const indexRes = await fetch('https://api.scryfall.com/bulk-data/oracle-cards', {
    headers: { 'User-Agent': 'MTG-Over-Under/1.0', 'Accept': 'application/json' }
  });
  const { download_uri, size } = await indexRes.json();
  console.log(`Downloading bulk data (~${Math.round(size / 1024 / 1024)}MB)...`);

  const dataRes = await fetch(download_uri, {
    headers: { 'User-Agent': 'MTG-Over-Under/1.0' }
  });
  const allCards = await dataRes.json();
  console.log(`Downloaded ${allCards.length} cards. Filtering...`);

  const eligible = allCards.filter(c =>
    c.games?.includes('paper') &&
    c.finishes?.includes('nonfoil') &&
    !c.type_line?.toLowerCase().includes('basic land') &&
    Number(c.prices?.usd) > MIN_PRICE &&
    (c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal)
  );
  console.log(`${eligible.length} cards match the filter.`);

  // Fisher-Yates shuffle, then take SAMPLE_SIZE
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  const sample = eligible.slice(0, SAMPLE_SIZE);

  const cards = sample.map(c => ({
    id: c.id,
    name: c.name,
    set: c.set_name,
    image: c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal,
    artist: c.artist,
    scryfallUri: c.scryfall_uri,
    price: c.prices.usd,
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cards));
  const letters = [...new Set(cards.map(c => c.name[0].toUpperCase()))].sort().join('');
  console.log(`Done — ${cards.length} cards saved.`);
  console.log(`Letter coverage: ${letters}`);
};

main().catch(err => { console.error(err.message); process.exit(1); });
