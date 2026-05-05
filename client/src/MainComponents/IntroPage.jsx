import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import App from '../GameComponents/App.jsx';
import { getTopScores } from '../leaderboard.js';
import './IntroPage.css';

const MANA_PIPS = [
  'https://svgs.scryfall.io/card-symbols/W.svg',
  'https://svgs.scryfall.io/card-symbols/U.svg',
  'https://svgs.scryfall.io/card-symbols/B.svg',
  'https://svgs.scryfall.io/card-symbols/R.svg',
  'https://svgs.scryfall.io/card-symbols/G.svg',
];

const fallbackAvatar = (id) => MANA_PIPS[id.charCodeAt(0) % MANA_PIPS.length];

function HomePage() {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [scoresError, setScoresError] = useState('');
  
  useEffect(() => {
    getTopScores()
      .then(setScores)
      .catch((err) => {
        console.error('Failed to load leaderboard:', err);
        setScoresError('Could not load scores right now.');
      })
      .finally(() => setLoadingScores(false));
  }, []);

  return (
    <div className="intro-page">
      <h1 className="text-4xl font-bold mb-6">Welcome to MTG Over/Under!</h1>
      <button onClick={() => navigate('/game')}>
        Start Playing
      </button>

      <div className="leaderboard">
        <h2 className="leaderboard-title">Top 50 Scores</h2>
        {loadingScores ? (
          <p className="leaderboard-status">Loading scores...</p>
        ) : scoresError ? (
          <p className="leaderboard-status">{scoresError}</p>
        ) : scores.length === 0 ? (
          <p className="leaderboard-status">No scores yet. Be the first!</p>
        ) : (
          <ol className="leaderboard-list">
            {scores.map((entry, i) => (
              <li key={entry.id} className={`leaderboard-row ${i < 3 ? 'leaderboard-row--top' : ''}`}>
                <img src={entry.avatarUrl || fallbackAvatar(entry.id)} alt={`${entry.name}'s avatar`} className="leaderboard-avatar" />
                <span className="leaderboard-rank">#{i + 1}</span>
                <span className="leaderboard-name">{entry.name}</span>
                <span className="leaderboard-score">{entry.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function IntroPage() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game" element={<App />} />
    </Routes>
  );
}

export default IntroPage;
