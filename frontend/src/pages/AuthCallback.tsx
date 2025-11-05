import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Use the login function from your AuthContext to save the token
      login(token);
      // Redirect to the main app page
      navigate('/');
    } else {
      // Handle error: no token found
      console.error('No token provided in callback');
      navigate('/login');
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center">
        <p className="text-lg">Logging you in...</p>
        {/* You can add a loading spinner here */}
      </div>
    </div>
  );
};

export default AuthCallback;