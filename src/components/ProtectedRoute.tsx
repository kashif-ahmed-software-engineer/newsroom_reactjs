import { Navigate } from 'react-router-dom';
import { getUserFromStorage } from '../util/helpers';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  
  const isAuthenticated = !!getUserFromStorage();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;