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
  const [revealedPrice, setRevealedPrice] = useState('???');

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const formatPrice = (price) => Number(price).toFixed(2);

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

  useEffect(() => {
    loadInitialCards();
  }, []);

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
    <div className="App min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <h1 className="mb-2 text-5xl font-bold tracking-tight">MTG Over/Under</h1>
      <h3 className="mb-10 text-2xl font-semibold text-emerald-300">Score: {score}</h3>

      {error && <p className="mb-6 text-lg text-red-400">{error}</p>}

      <div className="flex flex-col justify-center gap-8 lg:flex-row">
        {card1 && (
          <div className="mx-auto w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
            <h3 className="mb-4 text-3xl font-bold text-slate-50">{card1.name}</h3>
            <button
              className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => cardHandler(card1, card2)}
              disabled={loading}
            >
              {card1.image && <img src={card1.image} alt={card1.name} className="mx-auto max-h-[420px] w-full object-contain" />}
            </button>
            <p className="mt-4 text-lg text-slate-300">Set: {card1.set}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">Price: {formatPrice(card1.price)}</p>
          </div>
        )}

        {card2 && (
          <div className="mx-auto w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
            <h3 className="mb-4 text-3xl font-bold text-slate-50">{card2.name}</h3>
            <button
              className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 transition hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => cardHandler(card2, card1)}
              disabled={loading}
            >
              {card2.image && <img src={card2.image} alt={card2.name} className="mx-auto max-h-[420px] w-full object-contain" />}
            </button>
            <p className="mt-4 text-lg text-slate-300">Set: {card2.set}</p>
            <p className="mt-2 text-3xl font-bold text-amber-300 tabular-nums">Price: {revealedPrice}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
