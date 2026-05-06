import { useState, useEffect, useRef } from 'react';
import './EndGamePopup.css';

const MANA_PIPS = [
  'https://svgs.scryfall.io/card-symbols/W.svg',
  'https://svgs.scryfall.io/card-symbols/U.svg',
  'https://svgs.scryfall.io/card-symbols/B.svg',
  'https://svgs.scryfall.io/card-symbols/R.svg',
  'https://svgs.scryfall.io/card-symbols/G.svg',
];

const randomManaPip = () => MANA_PIPS[Math.floor(Math.random() * MANA_PIPS.length)];

const fetchCardsByName = async (query) => {
  if (!query.trim()) return [];
  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=art&order=name`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MTG-Over-Under/1.0',
      'Accept': 'application/json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.data || []).slice(0, 20).map(card => ({
    id: card.id,
    name: card.name,
    image: card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop,
  })).filter(card => card.image);
};

function EndGamePopup({ isOpen, title, finalScore, isTopScore, onSubmitScore, onRestart }) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [avatarSearch, setAvatarSearch] = useState('');
  const [avatarResults, setAvatarResults] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSubmitted(false);
      setSubmitting(false);
      setAvatarSearch('');
      setAvatarResults([]);
      setSelectedAvatar(null);
      setShowDropdown(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAvatarSearchChange = (e) => {
    const val = e.target.value;
    setAvatarSearch(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setAvatarResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchCardsByName(val);
      setAvatarResults(results);
      setShowDropdown(results.length > 0);
    }, 400);
  };

  const handleSelectAvatar = (card) => {
    setSelectedAvatar(card);
    setShowDropdown(false);
    setAvatarSearch(card.name);
  };

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setNameError('');
    try {
      await onSubmitScore(name.trim(), finalScore, selectedAvatar?.image || randomManaPip());
      setSubmitted(true);
    } catch (err) {
      if (err.message === 'inappropriate_name') {
        setNameError('Please choose an appropriate name.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showPlayAgain = !isTopScore || submitted;

  return (
    <div className="endgame-popup-overlay">
      <div className="endgame-popup-card">
        <h2>{title}</h2>
        <p className="endgame-popup-score">You scored {finalScore}!</p>

        {isTopScore && !submitted && (
          <div className="endgame-popup-form-wrap">
            <p className="endgame-popup-congrats">You made the top 50!</p>

            <div className="endgame-popup-avatar-search-wrap">
              <input
                type="text"
                placeholder="Pick an MTG Score Pic!"
                value={avatarSearch}
                onChange={handleAvatarSearchChange}
                onFocus={() => avatarResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="endgame-popup-input"
              />
              {showDropdown && (
                <div className="endgame-popup-dropdown">
                  {avatarResults.map(card => (
                    <div
                      key={card.id}
                      className="endgame-popup-dropdown-item"
                      onMouseDown={() => handleSelectAvatar(card)}
                    >
                      <img src={card.image} alt={card.name} />
                      <span>{card.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="endgame-popup-avatar-circle-wrap">
              <div className="endgame-popup-avatar-circle">
                {selectedAvatar
                  ? <img src={selectedAvatar.image} alt={selectedAvatar.name} />
                  : <span className="endgame-popup-avatar-placeholder">art pic</span>
                }
              </div>
            </div>

            <input
              type="text"
              placeholder="Enter a name!"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              maxLength={20}
              className="endgame-popup-input endgame-popup-name-input"
            />
            {nameError && <p className="endgame-popup-name-error">{nameError}</p>}

            <div className="endgame-popup-actions">
              <button
                className="endgame-popup-save-btn"
                onClick={handleSubmit}
                disabled={submitting || !name.trim()}
              >
                {submitting ? 'Saving...' : 'Save Score'}
              </button>
              <button className="endgame-popup-skip-btn" onClick={onRestart}>
                Skip Score
              </button>
            </div>
          </div>
        )}

        {isTopScore && submitted && (
          <p>Score saved! Nice work!</p>
        )}

        {showPlayAgain && (
          <button onClick={onRestart} className="endgame-popup-play-again">
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}

export default EndGamePopup;
