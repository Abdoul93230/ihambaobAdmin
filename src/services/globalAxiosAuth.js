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

// Même règle pour fetch() (plusieurs écrans l'utilisent directement)
if (typeof window !== 'undefined' && window.fetch && !window.__ihamFetchAuth) {
  window.__ihamFetchAuth = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    try {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (BACKEND && url.startsWith(BACKEND)) {
        const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined) || {});
        if (!headers.has('Authorization')) {
          const token = JSON.parse(localStorage.getItem('AdminEcomme') || 'null')?.token;
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
            return nativeFetch(input, { ...init, headers });
          }
        }
      }
    } catch (_) { /* repli : requête d'origine */ }
    return nativeFetch(input, init);
  };
}
