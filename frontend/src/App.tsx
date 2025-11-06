import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import Playground from './pages/Playground';
import ToolsEditor from './pages/ToolsEditor';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="nav">
      <Link
        to="/"
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        Playground
      </Link>
      <Link
        to="/tools"
        className={`nav-link ${location.pathname === '/tools' ? 'active' : ''}`}
      >
        Tools Editor
      </Link>
    </nav>
  );
}

function Layout() {
  return (
    <div className="app">
      <div className="header-container">
        <h1>AI Agent Playground</h1>
        <Navigation />
      </div>
      <Routes>
        <Route path="/" element={<Playground />} />
        <Route path="/tools" element={<ToolsEditor />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
