import { useState, useEffect } from 'react'
import './App.css'

const PRICE_REVEAL_DURATION_MS = 900;
const PRICE_REVEAL_PAUSE_MS = 500;

function App() {
  const [card1, setCard1] = useState(null);
  const [card2, setCard2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(localStorage.getItem('maxScore') || 0);
  const [revealedPrice, setRevealedPrice] = useState('???');

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const formatPrice = (price) => Number(price).toFixed(2);

  useEffect(() => {
    loadInitialCards();
  }, []);

  const fetchRandomCard = async () => {
    const res = await fetch('http://localhost:3000/api/cards/random');
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch card');
    }

    return data;
  }

  const revealPrice = (price) => {
    const targetPrice = Number(price);

    if (!Number.isFinite(targetPrice)) {
      setRevealedPrice(String(price));
      return Promise.resolve();
    }

    setRevealedPrice('0.00');

    return new Promise((resolve) => {
      const startTime = performance.now();

      const animate = (timestamp) => {
        const progress = Math.min((timestamp - startTime) / PRICE_REVEAL_DURATION_MS, 1);
        const currentValue = targetPrice * progress;
        setRevealedPrice(currentValue.toFixed(2));

        if (progress < 1) {
          requestAnimationFrame(animate);
          return;
        }

        setRevealedPrice(formatPrice(targetPrice));
        resolve();
      };

      requestAnimationFrame(animate);
    });
  };

  const loadInitialCards = async () => {
    console.log('Loading initial cards...');
    setLoading(true);
    setError('');

    try {
      const [firstCard, secondCard] = await Promise.all([
        fetchRandomCard(),
        fetchRandomCard()
      ]);

      setCard1(firstCard);
      setCard2(secondCard);
      setRevealedPrice('???');
    } catch (err) {
      setError(err.message);
      setCard1(null);
      setCard2(null);
    } finally {
      setLoading(false);
    }
  };

  const cardHandler = async (clickedCard, otherCard) => {
    if (loading || !card1 || !card2) {
      return;
    }

    setLoading(true);

    try {
      const clickedPrice = Number(clickedCard.price);
      const otherPrice = Number(otherCard.price);
      const pickedCorrectly = clickedPrice >= otherPrice;
      const upcomingCardsPromise = pickedCorrectly
        ? Promise.all([fetchRandomCard()])
        : Promise.all([fetchRandomCard(), fetchRandomCard()]);

      await revealPrice(card2.price);
      const upcomingCards = await upcomingCardsPromise;
      await delay(PRICE_REVEAL_PAUSE_MS);

      if (pickedCorrectly) {
        const [nextRightCard] = upcomingCards;
        setScore((currentScore) => currentScore + 1);
        setCard1(card2);
        setCard2(nextRightCard);
      } else {
        const [nextLeftCard, nextRightCard] = upcomingCards;
        setScore(0);
        setCard1(nextLeftCard);
        setCard2(nextRightCard);
        if (score > maxScore) {
          localStorage.setItem('maxScore', Math.max(score, maxScore));
          setMaxScore(score);
        }
      }

      setRevealedPrice('???');
      setError('');
    } catch (err) {
      setError(err.message);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      <h1 className="app-title">MTG Over/Under</h1>
      <div className="score-bar">
        <h3 className="score-current">Score: {score}</h3>
        <h3 className="score-best">Best: {maxScore}</h3>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="card-grid">
        {card1 && (
          <div className="card-panel">
            <h3 className="card-name">{card1.name}</h3>
            <button
              className="card-button-left"
              onClick={() => cardHandler(card1, card2)}
              disabled={loading}
            >
              {card1.image && <img src={card1.image} alt={card1.name} className="card-image" />}
            </button>
            <p className="card-set">Set: {card1.set}</p>
            <p className="card-price-left">Price: {formatPrice(card1.price)}</p>
          </div>
        )}

        {card2 && (
          <div className="card-panel">
            <h3 className="card-name">{card2.name}</h3>
            <button
              className="card-button-right"
              onClick={() => cardHandler(card2, card1)}
              disabled={loading}
            >
              {card2.image && <img src={card2.image} alt={card2.name} className="card-image" />}
            </button>
            <p className="card-set">Set: {card2.set}</p>
            <p className="card-price-right">Price: {revealedPrice}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
