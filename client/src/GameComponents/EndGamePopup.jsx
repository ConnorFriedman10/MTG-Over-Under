function EndGamePopup({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      {/* Modal box — stop clicks from bubbling to backdrop */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: "8px",
          padding: "24px", minWidth: "300px", maxWidth: "500px",
        }}
      >
        <h2>{title}</h2>
        <div>{children}</div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default EndGamePopup;