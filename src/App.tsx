import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Games from './pages/Games';
import Dictionaries from './pages/Dictionaries';
import './App.css';

// Placeholder components for remaining routes
const Game = () => <div><h1>Game Mode</h1></div>;
const Profile = () => <div><h1>User Profile</h1></div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dictionaries" element={<Dictionaries />} />
            <Route path="/games" element={<Games />} />
            <Route path="/play/:mode/:dictId" element={<Game />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

