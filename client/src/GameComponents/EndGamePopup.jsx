import { useState, useEffect } from 'react';

function EndGamePopup({ isOpen, title, finalScore, isTopScore, onSubmitScore, onRestart }) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSubmitted(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmitScore(name.trim(), finalScore);
      setSubmitted(true);
    } catch {
      // submission failed silently; user can retry
    } finally {
      setSubmitting(false);
    }
  };

  const showPlayAgain = !isTopScore || submitted;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "gray", borderRadius: "8px",
        padding: "24px", minWidth: "300px", maxWidth: "500px",
        textAlign: "center",
      }}>
        <h2>{title}</h2>
        <p style={{ fontSize: "1.2em" }}>You scored {finalScore}!</p>

        {isTopScore && !submitted && (
          <div>
            <p style={{ fontWeight: "bold" }}>Congratulations! You made the top 50!</p>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              maxLength={20}
              autoFocus
              style={{
                margin: "8px 0", padding: "6px 10px",
                width: "100%", boxSizing: "border-box",
                borderRadius: "4px", border: "1px solid #ccc",
              }}
            />
            <div style={{ marginTop: "8px", display: "flex", gap: "8px", justifyContent: "center" }}>
              <button onClick={handleSubmit} disabled={submitting || !name.trim()}>
                {submitting ? 'Saving...' : 'Submit Score'}
              </button>
              <button onClick={onRestart}>Skip</button>
            </div>
          </div>
        )}

        {isTopScore && submitted && (
          <p>Score saved! Nice work!</p>
        )}

        {showPlayAgain && (
          <button onClick={onRestart} style={{ marginTop: "12px" }}>
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}

export default EndGamePopup;
