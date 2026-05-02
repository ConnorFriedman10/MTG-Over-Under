import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  return (
    <div className="App">
      <h1>MTG Over/Under</h1>
      
    </div>
  );
}

export default App;
