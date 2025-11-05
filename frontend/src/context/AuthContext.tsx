import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/auth';
// const API_URL = 'https://inteltrace-bnam.onrender.com/api/auth'; // <-- UPDATED (Added /api/auth)

interface User {
  _id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('intelTraceToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          // This now correctly calls /api/auth/me
          const { data } = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(data);
        } catch (error) {
          console.error('Token validation failed', error);
          localStorage.removeItem('intelTraceToken');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    validateToken();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('intelTraceToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('intelTraceToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};