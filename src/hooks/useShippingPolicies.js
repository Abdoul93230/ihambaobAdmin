import { useQuery, useMutation, useQueryClient } from 'react-query'
import { sellerShippingApi, publicShippingApi } from '../services/api'

// Hook pour obtenir les politiques du vendeur
export const useShippingPolicies = (params = {}) => {
  return useQuery({
    queryKey: ['shipping-policies', params],
    queryFn: () => sellerShippingApi.getPolicies(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook pour obtenir les statistiques des politiques
export const useShippingPolicyStats = () => {
  return useQuery({
    queryKey: ['shipping-policy-stats'],
    queryFn: sellerShippingApi.getStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook pour obtenir les zones disponibles pour configuration
export const useAvailableZones = (search = '', limit = 50) => {
  const params = { 
    search: search.trim(),
    limit 
  }
  
  return useQuery({
    queryKey: ['available-zones', params],
    queryFn: () => sellerShippingApi.getAvailableZones(params),
    enabled: true, // Toujours actif
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutations pour les politiques d'expédition
export const useCreateShippingPolicy = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sellerShippingApi.setPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries(['shipping-policies'])
      queryClient.invalidateQueries(['shipping-policy-stats'])
      queryClient.invalidateQueries(['available-zones'])
    }
  })
}

export const useUpdateShippingPolicy = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ policyId, data }) => sellerShippingApi.updatePolicy(policyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shipping-policies'])
      queryClient.invalidateQueries(['shipping-policy-stats'])
    }
  })
}

export const useDeleteShippingPolicy = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sellerShippingApi.deletePolicy,
    onSuccess: () => {
      queryClient.invalidateQueries(['shipping-policies'])
      queryClient.invalidateQueries(['shipping-policy-stats'])
      queryClient.invalidateQueries(['available-zones'])
    }
  })
}

export const useToggleShippingPolicy = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ policyId, isActive }) => sellerShippingApi.togglePolicy(policyId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(['shipping-policies'])
      queryClient.invalidateQueries(['shipping-policy-stats'])
    }
  })
}

export const useDuplicateShippingPolicy = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ policyId, targetZoneId }) => sellerShippingApi.duplicatePolicy(policyId, targetZoneId),
    onSuccess: () => {
      queryClient.invalidateQueries(['shipping-policies'])
      queryClient.invalidateQueries(['shipping-policy-stats'])
      queryClient.invalidateQueries(['available-zones'])
    }
  })
}

// Hook pour calculer les frais d'expédition
export const useCalculateShipping = () => {
  return useMutation({
    mutationFn: (data) => {
      // Déterminer quelle API utiliser selon le contexte
      if (data.sellerId) {
        return publicShippingApi.calculateShipping(data)
      } else {
        return sellerShippingApi.calculateShipping(data)
      }
    }
  })
}

// Hook pour calculer les frais multi-vendeur
export const useCalculateMultiVendorShipping = () => {
  return useMutation({
    mutationFn: publicShippingApi.calculateMultiVendor
  })
}