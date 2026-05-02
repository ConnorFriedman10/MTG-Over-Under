import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRandomCard = async () => {
    setLoading(true);
    setError('');
  
    try {
      const res = await fetch('http://localhost:3000/api/cards/random');
      const data = await res.json();
      if (!res.ok) {
        throw new Error('Failed to fetch card');
      }
      setCard(data); // sets the card to the response from the server

    } catch (err) {
      setError(err.message);
      setCard(null);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="App">
      <h1>MTG Over/Under</h1>
      <button onClick={fetchRandomCard} disabled={loading}>
        {loading ? 'Loading...' : 'Get Random Card'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {card && (
        <>
          <h3>{card.name}</h3>
          {card.image && <img src={card.image} alt={card.name} style={{ maxWidth: '300px' }} />}
          <p>Set: {card.set}</p>
          <p>Artist: {card.artist}</p>
        </>
      )}
    </div>
  );
}

export default App;
