import axios from 'axios'
// Fonction utilitaire pour nettoyer les paramètres
const cleanParams = (params) => {
  const cleaned = {}
  Object.keys(params).forEach(key => {
    const value = params[key]
    // Garder seulement les valeurs non vides et non nulles
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value
    }
  })
  return cleaned
}

// Configuration de base d'Axios
let API_BASE_URL = process.env.REACT_APP_Backend_Url || 'http://localhost:8083'
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = `${API_BASE_URL}/api`
}
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
     // const token = localStorage.getItem('authToken')
    const user = JSON.parse(localStorage.getItem("AdminEcomme"));
    const token = user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // Gestion globale des erreurs
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('AdminAuthToken');
      localStorage.removeItem('AdminAuthUser');
      localStorage.removeItem('AdminEcomme'); // Nettoyer aussi l'ancien storage
      window.location.href = '/'
      return
    }

    // Retourner l'erreur formatée
    const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue'
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      errors: error.response?.data?.errors
    })
  }
)

// Services API pour les zones (Admin)
export const adminZonesApi = {
  // Obtenir toutes les zones avec pagination et filtres
  getZones: (params = {}) => {
    return api.get('/admin/zones', { params: cleanParams(params) })
  },

  // Obtenir statistiques des zones
  getStats: () => {
    return api.get('/admin/zones/stats')
  },

  // Obtenir hiérarchie des zones avec support de pagination
  getHierarchy: (params = {}) => {
    const cleanedParams = cleanParams(params)
    
    // Pour la hiérarchie, nous pouvons utiliser les mêmes paramètres que getZones
    // mais avec une logique différente côté backend si nécessaire
    return api.get('/admin/zones/hierarchy', { params: cleanedParams })
  },

  // Rechercher des zones
  searchZones: (query, limit = 20) => {
    return api.get('/admin/zones/search', { params: { q: query, limit } })
  },

  // Obtenir une zone par ID
  getZoneById: (id) => {
    return api.get(`/admin/zones/${id}`)
  },

  // Obtenir les enfants d'une zone
  getZoneChildren: (id, includeInactive = false) => {
    const params = {}
    if (includeInactive !== false) {
      params.includeInactive = includeInactive
    }
    return api.get(`/admin/zones/${id}/children`, { params })
  },

  // Créer une zone
  createZone: (data) => {
    return api.post('/admin/zones', data)
  },

  // Mettre à jour une zone
  updateZone: (id, data) => {
    return api.put(`/admin/zones/${id}`, data)
  },

  // Supprimer une zone
  deleteZone: (id) => {
    return api.delete(`/admin/zones/${id}`)
  },

  // Importer zones depuis CSV/Excel
  importZones: (formData) => {
    return api.post('/admin/zones/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Valider un fichier avant import
  validateImport: (formData) => {
    return api.post('/admin/zones/validate-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// Services API pour les politiques d'expédition (Seller)
export const sellerShippingApi = {
  // Obtenir les politiques du vendeur
  getPolicies: (params = {}) => {
    return api.get('/seller/shipping-policies', { params: cleanParams(params) })
  },

  // Obtenir statistiques des politiques
  getStats: () => {
    return api.get('/seller/shipping-policies/stats')
  },

  // Créer/modifier politique
  setPolicy: (data) => {
    return api.post('/seller/shipping-policies', data)
  },

  // Modifier une politique
  updatePolicy: (policyId, data) => {
    return api.put(`/seller/shipping-policies/${policyId}`, data)
  },

  // Supprimer une politique
  deletePolicy: (policyId) => {
    return api.delete(`/seller/shipping-policies/${policyId}`)
  },

  // Activer/désactiver politique
  togglePolicy: (policyId, isActive) => {
    return api.patch(`/seller/shipping-policies/${policyId}/toggle`, { isActive })
  },

  // Dupliquer une politique
  duplicatePolicy: (policyId, targetZoneId) => {
    return api.post(`/seller/shipping-policies/${policyId}/duplicate`, { targetZoneId })
  },

  // Obtenir zones disponibles pour configuration
  getAvailableZones: (params = {}) => {
    return api.get('/seller/zones/available', { params: cleanParams(params) })
  },

  // Calculer frais d'expédition (test)
  calculateShipping: (data) => {
    return api.post('/seller/shipping/calculate', data)
  }
}

// Services API publics pour l'expédition (Client)
export const publicShippingApi = {
  // Calculer frais d'expédition
  calculateShipping: (data) => {
    return api.post('/shipping2/calculate', data)
  },

  // Calculer pour plusieurs vendeurs
  calculateMultiVendor: (data) => {
    return api.post('/shipping2/calculate-multi-vendor', data)
  },

  // Obtenir zones pour sélection client - avec normalisation de la réponse
  getZones: (params = {}) => {
    return api.get('/shipping2/zones', { params: cleanParams(params) })
      .then(response => {
        // Normaliser la réponse pour qu'elle ait toujours la même structure
        // console.log({response});
        
        if (response?.data) {
          if (Array.isArray(response.data)) {
            // Si c'est directement un tableau, l'encapsuler
            return {
              data: {
                data: response.data,
                pagination: response.pagination
              }
            }
          } else {
            // Si c'est déjà structuré, le retourner tel quel
            return response
          }
        }
        
        return {
          data: {
            data: [],
            pagination: null
          }
        }
      })
  },

  // Rechercher zones
  searchZones: (query, limit = 20) => {
    return api.get('/shipping2/zones/search', { params: { q: query, limit } })
  },

  // Obtenir hiérarchie des zones avec normalisation
  getHierarchy: (params = {}) => {
    return api.get('/shipping2/zones/hierarchy', { params: cleanParams(params) })
      .then(response => {
        // Normaliser la réponse pour la hiérarchie
        if (response?.data) {
          if (Array.isArray(response.data)) {
            return {
              data: {
                data: response.data,
                pagination: response.pagination
              }
            }
          }
        }
        return response
      })
  },

  // Obtenir enfants d'une zone
  getZoneChildren: (id) => {
    return api.get(`/shipping2/zones/${id}/children`)
  },

  // Obtenir détail d'une zone
  getZoneById: (id) => {
    return api.get(`/shipping2/zones/${id}`)
  }
}

// Services API pour la gestion des politiques d'expédition par seller (Admin)
export const adminShippingApi = {
  getPolicies: (sellerId, params = {}) =>
    api.get(`/admin/seller-shipping/${sellerId}`, { params: cleanParams(params) }),

  getStats: (sellerId) =>
    api.get(`/admin/seller-shipping/${sellerId}/stats`),

  getAvailableZones: (sellerId, params = {}) =>
    api.get(`/admin/seller-shipping/${sellerId}/zones/available`, { params: cleanParams(params) }),

  setPolicy: (sellerId, data) =>
    api.post(`/admin/seller-shipping/${sellerId}`, data),

  updatePolicy: (sellerId, policyId, data) =>
    api.put(`/admin/seller-shipping/${sellerId}/${policyId}`, data),

  deletePolicy: (sellerId, policyId) =>
    api.delete(`/admin/seller-shipping/${sellerId}/${policyId}`),

  togglePolicy: (sellerId, policyId, isActive) =>
    api.patch(`/admin/seller-shipping/${sellerId}/${policyId}/toggle`, { isActive }),

  duplicatePolicy: (sellerId, policyId, targetZoneId) =>
    api.post(`/admin/seller-shipping/${sellerId}/${policyId}/duplicate`, { targetZoneId }),

  calculate: (sellerId, data) =>
    api.post(`/admin/seller-shipping/${sellerId}/calculate`, data),
}

export default api