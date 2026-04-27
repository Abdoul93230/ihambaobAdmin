import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminZonesApi, publicShippingApi } from '../services/api'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Hook pour obtenir les zones (admin)
export const useZones = (params = {}) => {
  const { isAdmin } = useAuth()
  
  return useQuery({
    queryKey: ['zones', params],
    queryFn: async () => {
      const response = isAdmin 
        ? await adminZonesApi.getZones(params) 
        : await publicShippingApi.getZones(params)
      
      // Normaliser la structure de réponse
      if (response?.data) {
        // Si la réponse a une structure avec pagination
        if (response.data.zones && response.data.pagination) {
          return {
            data: response.data.zones,
            pagination: response.data.pagination
          }
        }
        // Si la réponse est directement un tableau
        else if (Array.isArray(response.data)) {
          return {
            data: response.data,
            pagination: null
          }
        }
        // Si la réponse a déjà la bonne structure
        else if (response.data.data && response.data.pagination) {
          return response.data
        }
        // Fallback
        else {
          return {
            data: response.data,
            pagination: null
          }
        }
      }
      
      // Fallback pour réponse vide
      return {
        data: [],
        pagination: null
      }
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook pour obtenir les statistiques des zones (admin uniquement)
export const useZoneStats = () => {
  const { isAdmin } = useAuth()
  
  return useQuery({
    queryKey: ['zone-stats'],
    queryFn: async () => {
      const response = await adminZonesApi.getStats()
      return response?.data || response
    },
    enabled: isAdmin,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook pour obtenir la hiérarchie des zones avec pagination optionnelle
export const useZoneHierarchy = (params = {}) => {
  const { isAdmin } = useAuth()
  
  return useQuery({
    queryKey: ['zone-hierarchy', params],
    queryFn: async () => {
      const response = isAdmin 
        ? await adminZonesApi.getHierarchy(params) 
        : await publicShippingApi.getHierarchy(params)
      
      // Normaliser la structure de réponse pour la hiérarchie
      if (response?.data) {
        if (Array.isArray(response.data)) {
          return {
            data: response.data,
            pagination: null
          }
        } else if (response.data.data) {
          return response.data
        }
      }
      
      return {
        data: response?.data || [],
        pagination: null
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook pour rechercher des zones
export const useZoneSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const { isAdmin } = useAuth()

  const searchZones = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = isAdmin 
        ? await adminZonesApi.searchZones(query)
        : await publicShippingApi.searchZones(query)
      
      // Normaliser les résultats de recherche
      const results = response?.data || response || []
      setSearchResults(Array.isArray(results) ? results : [])
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchZones,
    isSearching
  }
}

// Hook pour obtenir une zone par ID
export const useZone = (zoneId) => {
  const { isAdmin } = useAuth()
  
  return useQuery({
    queryKey: ['zone', zoneId],
    queryFn: async () => {
      const response = isAdmin 
        ? await adminZonesApi.getZoneById(zoneId) 
        : await publicShippingApi.getZoneById(zoneId)
      
      return response?.data || response
    },
    enabled: !!zoneId,
  })
}

// Hook pour obtenir les enfants d'une zone
export const useZoneChildren = (parentId, includeInactive = false) => {
  const { isAdmin } = useAuth()
  
  return useQuery({
    queryKey: ['zone-children', parentId, includeInactive],
    queryFn: async () => {
      const response = isAdmin 
        ? await adminZonesApi.getZoneChildren(parentId, includeInactive)
        : await publicShippingApi.getZoneChildren(parentId)
      
      return response?.data || response || []
    },
    enabled: !!parentId && parentId !== '',
  })
}

// Mutations pour les opérations CRUD (admin uniquement)
export const useCreateZone = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: adminZonesApi.createZone,
    onSuccess: () => {
      queryClient.invalidateQueries(['zones'])
      queryClient.invalidateQueries(['zone-hierarchy'])
      queryClient.invalidateQueries(['zone-stats'])
    }
  })
}

export const useUpdateZone = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => adminZonesApi.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['zones'])
      queryClient.invalidateQueries(['zone-hierarchy'])
      queryClient.invalidateQueries(['zone'])
    }
  })
}

export const useDeleteZone = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: adminZonesApi.deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries(['zones'])
      queryClient.invalidateQueries(['zone-hierarchy'])
      queryClient.invalidateQueries(['zone-stats'])
    }
  })
}

// Hook pour l'import de zones
export const useImportZones = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: adminZonesApi.importZones,
    onSuccess: () => {
      queryClient.invalidateQueries(['zones'])
      queryClient.invalidateQueries(['zone-hierarchy'])
      queryClient.invalidateQueries(['zone-stats'])
    }
  })
}

export const useValidateImport = () => {
  return useMutation({
    mutationFn: adminZonesApi.validateImport
  })
}