import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  fallbackPath = '/admin/login' 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Vérification des permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Sauvegarder l'URL actuelle pour rediriger après la connexion
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Vérifier le rôle si requis
  if (requiredRole) {
    const userRole = user?.role || user?.type;
    if (userRole !== requiredRole) {
      return (
        <Navigate 
          to="/admin/unauthorized" 
          state={{ requiredRole, userRole }} 
          replace 
        />
      );
    }
  }

  return children;
};

// Composant pour les routes d'administration
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin" fallbackPath="/admin/login">
    {children}
  </ProtectedRoute>
);

// Composant pour les routes de vendeur
export const SellerRoute = ({ children }) => (
  <ProtectedRoute requiredRole="seller" fallbackPath="/seller/login">
    {children}
  </ProtectedRoute>
);

// Composant pour les routes client
export const ClientRoute = ({ children }) => (
  <ProtectedRoute requiredRole="client" fallbackPath="/client/login">
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;