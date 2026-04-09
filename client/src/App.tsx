import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Landing from './pages/Landing';
import SearchPalette from './components/SearchPalette';
import Sidebar from './components/Sidebar';

const AUTH_BYPASS =
  import.meta.env.VITE_AUTH_BYPASS === 'true' || import.meta.env.VITE_AUTH_BYPASS === '1';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading session...</div>;
  }
  // Test mode: open /dashboard directly without Google (pair with server AUTH_BYPASS + AUTH_BYPASS_USER_ID)
  if (AUTH_BYPASS) {
    return <>{children}</>;
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function DashboardLayout() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Global Cmd+K Search Binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1 className="header-title" style={{margin: 0, fontSize: 24, paddingLeft: 12}}>Tasks</h1>
          <div className="header-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="search-trigger" onClick={() => setIsSearchOpen(true)}>
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            <button className="theme-toggle btn-icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        <main className="main-content">
          <Home />
        </main>
      </div>

      <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<AuthGuard><DashboardLayout /></AuthGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
