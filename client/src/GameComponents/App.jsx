import { useState, useEffect, useRef } from 'react'
import './App.css'
import EndGamePopup from './EndGamePopup.jsx'
import { isTopScore as checkIsTopScore, submitScore } from '../leaderboard.js'
import heroLogo from '../assets/finaloverunderlogo.png'

const PRICE_REVEAL_DURATION_MS = 900;
const PRICE_REVEAL_PAUSE_MS = 500;

//add future card pool selection
function App() {
  const [card1, setCard1] = useState(null);
  const [card2, setCard2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(localStorage.getItem('maxScore') || 0);
  const [revealedPrice, setRevealedPrice] = useState('???');
  const [isOpen, setIsOpen] = useState(false);
  const [isTopScoreQualified, setIsTopScoreQualified] = useState(false);
  const cardCacheRef = useRef(null);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const formatPrice = (price) => Number(price).toFixed(2);

  useEffect(() => {
    loadInitialCards();
  }, []);

  const fetchRandomCard = async () => {
    if (!cardCacheRef.current) {
      const res = await fetch('/cards.json');
      if (!res.ok) throw new Error('Failed to load card data');
      cardCacheRef.current = await res.json();
    }
    const cards = cardCacheRef.current;
    return cards[Math.floor(Math.random() * cards.length)];
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
      const [firstCard, initialSecond] = await Promise.all([
        fetchRandomCard(),
        fetchRandomCard()
      ]);

      let secondCard = initialSecond;
      while (Math.abs(firstCard.price - secondCard.price) < 0.03) {
        secondCard = await fetchRandomCard();
      }

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
    if (loading || !card1 || !card2 || isOpen) {
      return;
    }

    setLoading(true);

    try {
      const clickedPrice = Number(clickedCard.price);
      const otherPrice = Number(otherCard.price);
      const pickedCorrectly = clickedPrice >= otherPrice;
      const nextCardPromise = pickedCorrectly ? fetchRandomCard() : null;

      await revealPrice(card2.price);
      await delay(PRICE_REVEAL_PAUSE_MS);

      if (pickedCorrectly) {
        let nextCard = await nextCardPromise;
        while (Math.abs(nextCard.price - card2.price) < 0.03) {
          nextCard = await fetchRandomCard();
        }
        setScore((currentScore) => currentScore + 1);
        setCard1(card2);
        setCard2(nextCard);
        setRevealedPrice('???');
      } else {
        if (score > maxScore) {
          localStorage.setItem('maxScore', score);
          setMaxScore(score);
        }
        const qualified = await checkIsTopScore(score).catch(() => false);
        setFinalScore(score);
        setIsTopScoreQualified(qualified);
        setScore(0);
        setIsOpen(true);
      }

      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setIsOpen(false);
    loadInitialCards();
  };

  const handleSubmitScore = async (name, score, avatarUrl) => {
    await submitScore(name, score, avatarUrl);
  };

  return (
    <div className="app-root">
      <div className="app-header">
        <div className="app-logo-panel">
          <div className="app-logo-inner">
            <img src={heroLogo} alt="MTG Over/Under" className="app-logo-img" />
          </div>
        </div>
        <div className="app-score-panel">
          <span className="app-score-current">Score: {score}</span>
          <span className="app-score-best">Best: {maxScore}</span>
        </div>
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
            <p className="card-price-left">$ {formatPrice(card1.price)}</p>
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
            <p className="card-price-right">$ {revealedPrice}</p>
          </div>
        )}

        <EndGamePopup
          isOpen={isOpen}
          title="Game Over"
          finalScore={finalScore}
          isTopScore={isTopScoreQualified}
          onSubmitScore={handleSubmitScore}
          onRestart={handleRestart}
        />
      </div>
    </div>
  );
}

export default App;
