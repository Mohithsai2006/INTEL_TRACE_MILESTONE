import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;