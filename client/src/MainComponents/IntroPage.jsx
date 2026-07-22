import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import App from '../GameComponents/App.jsx';
import { getTopScores } from '../leaderboard.js';
import overUnderLogo from '../assets/finaloverunderlogo.png';
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
  const [priceDifference, setPriceDifference] = useState('0');

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
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-4 md:p-8 flex-1 text-left">

      {/* LEFT — paper taped to the wall */}
      <aside className="scoreboard-panel w-full md:w-64 md:shrink-0 flex flex-col pt-10 px-4 pb-6 order-last md:order-first">
        <h2 className="leaderboard-title">Top 50 Scores!</h2>
        <div className="leaderboard-scroll flex-1 overflow-y-auto mt-1">
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
      </aside>

      <main className="flex-1 flex flex-col items-center justify-start gap-4 md:gap-6 pt-4 pb-8 order-first md:order-none">

        {/* Logo + MTG badge */}
        <div className="flex items-end">
          <div className="logo-box w-52 md:w-64 shrink-0">
            <div className="logo-box-inner">
              <img src={overUnderLogo} alt="Over/Under logo" />
            </div>
          </div>
          <div className="mtg-badge-box w-36 md:w-44 shrink-0 flex items-center justify-center">
            <span className="mtg-text">MTG</span>
          </div>
        </div>

        <button
          onClick={() => {
            const parsed = Number(priceDifference);
            navigate('/game', { state: { priceDifference: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 } });
          }}
          className="start-btn"
        >
          Start Playing
        </button>

        {/* Info panels */}
        <div className="flex flex-col gap-2 w-full max-w-xl md:w-auto md:max-w-none" style={{width: 'fit-content'}}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="info-box w-full sm:w-72 min-h-36 p-4">
              <h3 className="info-title">How To Play MTG Over Under!</h3>
              <p className="info-body">Guess which of the two cards is more expensive, guess right and continue, guess wrong and you lose!</p>
            </div>
            <div className="info-box price-diff-box w-full sm:w-52 min-h-36 p-4">
              <h3 className="info-title">Min Price Difference</h3>
              <p className="info-body">Set the minimum price gap (in $) between the two cards. Note: price diffs above 0 won't appear on the leaderboard</p>
              <label className="price-diff-label">
                $
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceDifference}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setPriceDifference(val);
                    }
                  }}
                  className="price-diff-input"
                />
              </label>
            </div>
          </div>
          <div className="info-box fan-content-notice p-1 px-3 w-full">
            <p className="info-body">Over Under MTG is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.</p>
          </div>
        </div>

      </main>

      <a
        href="https://ko-fi.com/mtgoverunderdev"
        target="_blank"
        rel="noopener noreferrer"
        className="kofi-flyer"
      >
        <span className="kofi-flyer-label">support me on Ko-Fi!</span>
        <span className="kofi-flyer-cta">☕ Ko-fi</span>
      </a>

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
