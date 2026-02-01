import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  // Check auth logic (e.g. cookie check or context)
  // For simplicity, we'll assume a 'isAuthenticated' flag in localStorage or cookie
  // But plan says "Must NOT do: Store password in localStorage". Session cookie is best.
  // Since we can't easily check httpOnly cookie from JS, we usually hit an API /me or rely on 401 interceptors.
  // For this scaffold, we'll implement a basic context or just allow for now and handle 401s globally.
  
  // Real implementation: use AuthContext
  const isAuthenticated = true; // Placeholder

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
