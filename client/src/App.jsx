import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (e) => {
    //prevents the page from reloading when the form submits
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`http://localhost:3000/api/cards/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || 'Search failed');
      }

      setCards(data.cards || []);
    } catch (err) {
      setError(err.message);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>MTG Over/Under</h1>

      <form onSubmit={search}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards, e.g. lightning bolt"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p>{error}</p>}

      <ul>
        {cards.map((card) => (
          <li key={card.id}>
            <h3>{card.name}</h3>
            {card.image && <img src={card.image} alt={card.name} width="240" />}
            <p>{card.set}</p>
            <p>Artist: {card.artist}</p>
            <a href={card.scryfallUri} target="_blank" rel="noreferrer">View on Scryfall</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
