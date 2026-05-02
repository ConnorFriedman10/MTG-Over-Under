import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('');
  const [card1, setCard1] = useState(null);
  const [card2, setCard2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);

  const fetchRandomCard = async (cardset) => {
    setLoading(true);
    setError('');
  
    try {
      const res = await fetch('http://localhost:3000/api/cards/random');
      const data = await res.json();
      if (!res.ok) {
        throw new Error('Failed to fetch card');
      }
      cardset(data); // sets the card to the response from the server

    } catch (err) {
      setError(err.message);
      cardset(null);
    } finally {
      setLoading(false);
    }
  }

  //displays a random card before button is pressed, button just jumbles it if needed
  useEffect(() => {
    fetchRandomCard(setCard1);
    fetchRandomCard(setCard2);
  }, []);

  const cardHandler = async (clicked_card, other_card) => {
    setLoading(true);
    if (clicked_card.price < other_card.price) {
      setScore(0);
      fetchRandomCard(setCard1);
      fetchRandomCard(setCard2);
    }
    else if (clicked_card.price >= other_card.price) {
      setScore(score + 1);
      setCard1(card2);
      fetchRandomCard(setCard2);
    }
    setLoading(false);
  }

  return (
    <div className="App">
      <h1>MTG Over/Under</h1>
      <h3>Score: {score}</h3>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
        {card1 && (
          <div>
            <h3>{card1.name}</h3>
            <button onClick={() => cardHandler(card1, card2)} disabled={loading}>
              {card1.image && <img src={card1.image} alt={card1.name} style={{ maxWidth: '300px' }} />}
            </button>
            <p>Set: {card1.set}</p>
            <p>Price: {card1.price}</p>
          </div>
        )}

        {card2 && (
          <div>
            <h3>{card2.name}</h3>
            <button onClick={() => cardHandler(card2, card1)} disabled={loading}>
              {card2.image && <img src={card2.image} alt={card2.name} style={{ maxWidth: '300px' }} />}
            </button>
            <p>Set: {card2.set}</p>
            <p>Price: ???</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
