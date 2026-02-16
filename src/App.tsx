import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Placeholder components
const Dashboard = () => (
  <div className="p-4">
    <h1>Dashboard</h1>
    <p>Welcome to BeneDicti</p>
    <nav>
      <ul>
        <li><Link to="/dict/1">My First Dictionary</Link></li>
        <li><Link to="/play/flashcards/1">Play Flashcards</Link></li>
      </ul>
    </nav>
  </div>
);

const Auth = () => <div><h1>Login / Signup</h1></div>;
const Dictionary = () => <div><h1>Dictionary View</h1></div>;
const Game = () => <div><h1>Game Mode</h1></div>;
const Profile = () => <div><h1>User Profile</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <Link to="/">BeneDicti</Link>
          <Link to="/profile">Profile</Link>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dict/:id" element={<Dictionary />} />
            <Route path="/play/:mode/:dictId" element={<Game />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
