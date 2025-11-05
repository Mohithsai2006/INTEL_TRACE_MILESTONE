import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = 'http://localhost:5001/api/auth';
// const API_URL = 'https://inteltrace-bnam.onrender.com/api/auth'; // <-- UPDATED

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post(`${API_URL}/register`, { username, email, password });
      login(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md p-8 space-y-6 bg-card border border-border rounded-lg shadow-elevated">
        <h1 className="text-3xl font-display font-bold text-center text-primary">
          Register Clearance
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="font-mono text-xs text-primary">USERNAME</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1"
            />
          </div>
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
            [REGISTER_AND_LOGIN]
          </Button>
        </form>
         <p className="text-center text-sm text-muted-foreground">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;