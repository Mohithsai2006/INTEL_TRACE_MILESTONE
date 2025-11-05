import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = 'http://localhost:5001/api/auth';
// const API_URL = 'https://inteltrace-bnam.onrender.com/api/auth'; // <-- UPDATED

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post(`${API_URL}/login`, { email, password });
      login(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    // Redirect the user to the backend's Google auth route
    window.location.href = 'http://localhost:5001/api/auth/google';
    // window.location.href = 'https://inteltrace-bnam.onrender.com/api/auth/google'; // <-- UPDATED
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md p-8 space-y-6 bg-card border border-border rounded-lg shadow-elevated">
        <h1 className="text-3xl font-display font-bold text-center text-primary">
          IntelTrace Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="font-mono text-xs text-primary">EMAIL</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password" className="font-mono text-xs text-primary">PASSWORD</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full glow-primary">
            [ACCESS_SYSTEM]
          </Button>
        </form>
        
        {/* --- ADDED THIS SECTION --- */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
          {/* You can add a Google icon here later */}
          Sign in with Google
        </Button>
        {/* --- END OF ADDED SECTION --- */}
        
        <p className="text-center text-sm text-muted-foreground">
          No clearance?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;