// config/apiEndpoints.js
export const API_ENDPOINTS = {
  // Base URL
  BASE_URL: process.env.REACT_APP_Backend_Url,

  // Authentification
  AUTH: {
    LOGIN: '/AdminLogin',
    LOGOUT: '/logout',
    VERIFY: '/verifyAdmin',
    REFRESH: '/refresh-token',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },

  // Produits
  PRODUCTS: {
    LIST: '/ProductsAdmin',
    PUBLIC_LIST: '/products',
    BY_ID: (id) => `/product/${id}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
    UPDATE_STATUS: (id) => `/products/${id}/status`,
    SEARCH: '/products/search',
    BY_CATEGORY: (categoryId) => `/products/category/${categoryId}`,
    BY_TYPE: (typeId) => `/products/type/${typeId}`,
    FEATURED: '/products/featured',
    BULK_UPDATE: '/products/bulk-update',
    BULK_DELETE: '/products/bulk-delete',
    EXPORT: '/products/export',
    IMPORT: '/products/import',
  },

  // Catégories
  CATEGORIES: {
    LIST: '/getAllCategories',
    BY_ID: (id) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
    WITH_PRODUCTS: '/categories/with-products',
  },

  // Types
  TYPES: {
    LIST: '/getAllType',
    BY_ID: (id) => `/types/${id}`,
    CREATE: '/types',
    UPDATE: (id) => `/types/${id}`,
    DELETE: (id) => `/types/${id}`,
  },

  // Commandes
  ORDERS: {
    LIST: '/orders',
    BY_ID: (id) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE: (id) => `/orders/${id}`,
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    DELETE: (id) => `/orders/${id}`,
    BY_USER: (userId) => `/orders/user/${userId}`,
    STATS: '/orders/stats',
    EXPORT: '/orders/export',
  },

  // Utilisateurs
  USERS: {
    LIST: '/users',
    BY_ID: (id) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    DEACTIVATE: (id) => `/users/${id}/deactivate`,
    ACTIVATE: (id) => `/users/${id}/activate`,
  },

  // Vendeurs
  SELLERS: {
    LIST: '/sellers',
    BY_ID: (id) => `/sellers/${id}`,
    APPROVE: (id) => `/sellers/${id}/approve`,
    REJECT: (id) => `/sellers/${id}/reject`,
    STATS: (id) => `/sellers/${id}/stats`,
  },

  // Clients
  CLIENTS: {
    LIST: '/clients',
    BY_ID: (id) => `/clients/${id}`,
    ORDERS: (id) => `/clients/${id}/orders`,
    STATS: (id) => `/clients/${id}/stats`,
  },

  // Upload / Médias
  UPLOAD: {
    SINGLE: '/upload',
    MULTIPLE: '/upload/multiple',
    DELETE: (filename) => `/upload/${filename}`,
    GALLERY: '/upload/gallery',
  },

  // Dashboard / Statistiques
  DASHBOARD: {
    STATS: '/dashboard/stats',
    SALES: '/dashboard/sales',
    REVENUE: '/dashboard/revenue',
    TOP_PRODUCTS: '/dashboard/top-products',
    RECENT_ORDERS: '/dashboard/recent-orders',
    USER_ACTIVITY: '/dashboard/user-activity',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    BY_ID: (id) => `/notifications/${id}`,
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id) => `/notifications/${id}`,
    SETTINGS: '/notifications/settings',
  },

  // Paramètres
  SETTINGS: {
    GENERAL: '/settings/general',
    APPEARANCE: '/settings/appearance',
    EMAIL: '/settings/email',
    SECURITY: '/settings/security',
    BACKUP: '/settings/backup',
    RESTORE: '/settings/restore',
  },

  // Messages / Support
  MESSAGES: {
    LIST: '/messages',
    BY_ID: (id) => `/messages/${id}`,
    SEND: '/messages/send',
    REPLY: (id) => `/messages/${id}/reply`,
    MARK_READ: (id) => `/messages/${id}/read`,
    DELETE: (id) => `/messages/${id}`,
  },

  // Rapports
  REPORTS: {
    SALES: '/reports/sales',
    PRODUCTS: '/reports/products',
    USERS: '/reports/users',
    INVENTORY: '/reports/inventory',
    EXPORT: (type) => `/reports/${type}/export`,
  },

  // Logs / Audit
  LOGS: {
    ACTIVITY: '/logs/activity',
    ERRORS: '/logs/errors',
    SYSTEM: '/logs/system',
    EXPORT: '/logs/export',
  },
};

// Configuration des timeouts par type d'endpoint
export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30 secondes
  UPLOAD: 120000, // 2 minutes
  EXPORT: 180000, // 3 minutes
  REPORTS: 300000, // 5 minutes
};

// Configuration des retry par type d'erreur
export const RETRY_CONFIG = {
  DEFAULT: { maxRetries: 3, delay: 1000 },
  NETWORK_ERROR: { maxRetries: 5, delay: 2000 },
  SERVER_ERROR: { maxRetries: 2, delay: 3000 },
  NO_RETRY: { maxRetries: 0, delay: 0 },
};

// Messages d'erreur personnalisés
export const ERROR_MESSAGES = {
  NETWORK: 'Problème de connexion réseau. Vérifiez votre connexion internet.',
  UNAUTHORIZED: 'Session expirée. Veuillez vous reconnecter.',
  FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
  NOT_FOUND: 'La ressource demandée est introuvable.',
  VALIDATION: 'Les données fournies ne sont pas valides.',
  SERVER_ERROR: 'Erreur interne du serveur. Veuillez réessayer plus tard.',
  TIMEOUT: 'La requête a pris trop de temps. Veuillez réessayer.',
  UNKNOWN: 'Une erreur inattendue s\'est produite.',
};

// Configuration des headers par défaut
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

// Configuration CORS
export const CORS_CONFIG = {
  withCredentials: true,
  credentials: 'include',
};