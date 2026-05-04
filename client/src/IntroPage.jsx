import { Routes, Route, useNavigate } from 'react-router-dom';
import App from './GameComponents/App.jsx';

function IntroPage() {
    const navigate = useNavigate();

    return (
        <Routes>
            <Route path="/" element={
                <div className="intro-page">
                    <h1 className="text-4xl font-bold mb-6">Welcome to MTG Over/Under!</h1>
                    <button onClick={() => navigate('/game')} >
                        Start Playing
                    </button>
                </div>
            } />
            <Route path="/game" element={<App />} />
        </Routes>
    );
}

export default IntroPage;