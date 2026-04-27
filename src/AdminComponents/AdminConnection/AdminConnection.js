import React, { useState, useEffect } from "react";
import { ChevronRight, Menu, User, Eye, EyeOff, AlertCircle } from "react-feather";
import { useAuth } from "@/contexts/AuthContext"; // Utilisation du contexte
import "./AdminConnection.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AdminConnection() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  
  // Utilisation du contexte d'authentification
  const { login, loading, error, setError } = useAuth();

  // Charger les données sauvegardées
  useEffect(() => {
    const savedEmail = localStorage.getItem('adminRememberedEmail');
    const savedRememberMe = localStorage.getItem('adminRememberMe') === 'true';
    
    if (savedRememberMe && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Afficher les erreurs via toast
  useEffect(() => {
    if (error) {
      handleAlertWarn(error);
      setError(null);
    }
  }, [error, setError]);

  const handleAlert = (message) => {
    toast.success(`${message}!`, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const handleAlertWarn = (message) => {
    toast.warn(`${message}!`, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const validateForm = () => {
    const errors = {};
    
    // Validation email
    if (!email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Format d'email invalide";
    }
    
    // Validation mot de passe
    if (!password.trim()) {
      errors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConnect = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Utilisation de la fonction login du contexte
      const result = await login(email.trim(), password);
      
      if (result.success) {
        handleAlert(result.message);
        
        // Gérer "Se souvenir de moi"
        if (rememberMe) {
          localStorage.setItem('adminRememberedEmail', email);
          localStorage.setItem('adminRememberMe', 'true');
        } else {
          localStorage.removeItem('adminRememberedEmail');
          localStorage.removeItem('adminRememberMe');
        }
        
        // La redirection se fait automatiquement via le contexte
      } else {
        handleAlertWarn(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      handleAlertWarn("Une erreur inattendue s'est produite");
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') {
      setEmail(value);
    } else if (field === 'password') {
      setPassword(value);
    }
    
    // Nettoyer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConnect(e);
    }
  };

  return (
    <div className="AdminConnection">
      <form onSubmit={handleConnect} noValidate>
        <div className="connection-header">
          <h2>Connexion Administrateur</h2>
          <p>Connectez-vous pour accéder au panneau d'administration</p>
        </div>

        <ul>
          <li className={validationErrors.email ? 'error' : ''}>
            <div className="left">
              <User />
            </div>
            <div className="right">
              <label htmlFor="email">UserName/Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="janedoe123@email.com"
                disabled={loading}
                autoComplete="email"
                required
              />
              {validationErrors.email && (
                <div className="error-message">
                  <AlertCircle size={14} />
                  <span>{validationErrors.email}</span>
                </div>
              )}
            </div>
          </li>

          <li className={validationErrors.password ? 'error' : ''}>
            <div className="left">
              <Menu />
            </div>
            <div className="right">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onKeyPress={handleKeyPress}
                  value={password}
                  type={showPassword ? "text" : "password"}
                  placeholder="*******************"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {validationErrors.password && (
                <div className="error-message">
                  <AlertCircle size={14} />
                  <span>{validationErrors.password}</span>
                </div>
              )}
            </div>
          </li>
        </ul>

        <div className="connection-options">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span>Se souvenir de moi</span>
          </label>
        </div>

        <button 
          type="submit" 
          className={`login-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Connexion en cours...
            </>
          ) : (
            <>
              Log In{" "}
              <span>
                <ChevronRight />
              </span>
            </>
          )}
        </button>

        <p className="connection-footer">
          Don't have an account? Swipe right to <span>create a new account</span>
        </p>

        <ToastContainer />
      </form>
    </div>
  );
}

export default AdminConnection;