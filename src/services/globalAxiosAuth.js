import axios from 'axios';

/**
 * SÉCURITÉ — Ajoute le jeton administrateur à toutes les requêtes axios « directes »
 * vers le backend (les écrans qui n'utilisent pas encore services/api.js).
 */
const BACKEND = (process.env.REACT_APP_Backend_Url || '').replace(/\/+$/, '');

axios.interceptors.request.use((config) => {
  const url = config.url || '';
  const hasAuth = config.headers && (config.headers.Authorization || config.headers.authorization);
  if (BACKEND && url.startsWith(BACKEND) && !hasAuth) {
    try {
      const token = JSON.parse(localStorage.getItem('AdminEcomme') || 'null')?.token;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
  }
  return config;
});
