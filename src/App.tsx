import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Games from './pages/Games';
import Dictionaries from './pages/Dictionaries';
import DictionaryDetail from './pages/DictionaryDetail';
import Flashcards from './pages/Flashcards';
import NBack from './pages/NBack';
import MatchPairs from './pages/MatchPairs';
import Profile from './pages/Profile';
import PasswordReset from './pages/PasswordReset';
import MigrationManager from './components/MigrationManager';
import SoundToggle from './components/SoundToggle';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <MigrationManager />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dictionaries" element={<Dictionaries />} />
            <Route path="/dict/:id" element={<DictionaryDetail />} />
            <Route path="/play" element={<Navigate to="/games" replace />} />
            <Route path="/games" element={<Games />} />
            <Route path="/play/flashcards/:dictId" element={<Flashcards />} />
            <Route path="/play/nback/:dictId" element={<NBack />} />
            <Route path="/play/match-pairs/:dictId" element={<MatchPairs />} />
            <Route path="/play/:mode/:dictId" element={<div><h1>Other Game Mode</h1></div>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            {/* Handle Firebase internal paths (auth callbacks, etc.) */}
            <Route path="/__/*" element={null} />
          </Route>
        </Routes>
        <SoundToggle />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

