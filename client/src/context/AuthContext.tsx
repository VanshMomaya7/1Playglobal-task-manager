import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { api } from '../api/tasks';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'tm_jwt';

// Ensure Axios natively pairs cookies with all API requests globally
axios.defaults.withCredentials = true;
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const AUTH_BYPASS =
  import.meta.env.VITE_AUTH_BYPASS === 'true' || import.meta.env.VITE_AUTH_BYPASS === '1';

/** OAuth redirect includes #session=… so Chrome can auth without a cross-site cookie. */
function applyBearerFromHashAndStorage() {
  const hash = window.location.hash;
  if (hash.startsWith('#session=')) {
    const raw = hash.slice('#session='.length);
    try {
      const token = decodeURIComponent(raw);
      sessionStorage.setItem(SESSION_STORAGE_KEY, token);
    } catch {
      /* ignore malformed fragment */
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    const hdr = `Bearer ${stored}`;
    axios.defaults.headers.common['Authorization'] = hdr;
    api.defaults.headers.common['Authorization'] = hdr;
  }
}

function clearBearerSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  delete axios.defaults.headers.common['Authorization'];
  delete api.defaults.headers.common['Authorization'];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyBearerFromHashAndStorage();

    const fetchSession = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/auth/me`);
        setUser(data);
      } catch {
        if (AUTH_BYPASS) {
          // UI-only fallback if API is not configured for bypass (tasks may still 401)
          setUser({
            id: import.meta.env.VITE_AUTH_BYPASS_USER_ID || 'dev-bypass',
            email: import.meta.env.VITE_AUTH_BYPASS_EMAIL || 'test@local',
            name: 'Test user',
            avatarUrl: '',
          });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  const logout = async () => {
    try {
      await axios.get(`${API_BASE}/auth/logout`);
      clearBearerSession();
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
