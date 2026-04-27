import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
  isSeller: false,
  isClient: false,
  loading: false,
  error: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const BackendUrl = process.env.REACT_APP_Backend_Url;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration d'axios pour inclure automatiquement le token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Vérification de l'authentification au chargement
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Vérifier d'abord l'ancien format (AdminEcomme)
      const storedAdmin = localStorage.getItem('AdminEcomme');
      let storedToken = null;
      let storedUser = null;
      
      if (storedAdmin) {
        const adminData = JSON.parse(storedAdmin);
        storedToken = adminData.token;
        storedUser = adminData.user || adminData;
      } else {
        // Fallback vers le nouveau format
        storedToken = localStorage.getItem('AdminAuthToken');
        const userString = localStorage.getItem('AdminAuthUser');
        storedUser = userString ? JSON.parse(userString) : null;
      }
      
      if (storedToken && storedUser) {
        // Vérifier si le token est toujours valide
        try {
          const response = await axios.get(`${BackendUrl}/verifyAdmin`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            withCredentials: true,
          });
          
          if (response.status === 200) {
            setToken(storedToken);
            setUser(storedUser);
          } else {
            // Token invalide, nettoyer le localStorage
            logout();
          }
        } catch (error) {
          console.log('Token validation failed:', error);
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Erreur lors de la vérification de l\'authentification');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${BackendUrl}/AdminLogin`,
        { email, password },
        {
          withCredentials: true,
          credentials: 'include',
        }
      );

      if (response.status === 200 && response.data) {
        // Adapter au format existant de votre localStorage
        const userData = response.data.user || response.data;
        const authToken = response.data.token;
        
        setUser(userData);
        setToken(authToken);
        
        // Sauvegarder dans le même format que votre code existant
        localStorage.setItem('AdminEcomme', JSON.stringify(response.data));
        
        // Aussi sauvegarder dans le nouveau format pour compatibilité
        localStorage.setItem('AdminAuthToken', authToken);
        localStorage.setItem('AdminAuthUser', JSON.stringify(userData));
        
        return { success: true, message: response.data.message || 'Connexion réussie' };
      }
      
      return { success: false, message: 'Erreur de connexion' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Optionnel : appeler l'API de déconnexion
      if (token) {
        await axios.post(`${BackendUrl}/logout`, {}, {
          withCredentials: true,
        }).catch(() => {
          // Ignorer les erreurs de déconnexion côté serveur
        });
      }
    } catch (error) {
      console.log('Logout API call failed:', error);
    } finally {
      // Nettoyer l'état local dans tous les cas
      setUser(null);
      setToken(null);
      setError(null);
      localStorage.removeItem('AdminAuthToken');
      localStorage.removeItem('AdminAuthUser');
      localStorage.removeItem('AdminEcomme'); // Nettoyer aussi l'ancien storage
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const contextValue = {
    user,
    token,
    login,
    logout,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin' || user?.type === 'admin',
    isSeller: user?.role === 'seller' || user?.type === 'seller',
    isClient: user?.role === 'client' || user?.type === 'client',
    setError, // Pour permettre de nettoyer les erreurs
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};