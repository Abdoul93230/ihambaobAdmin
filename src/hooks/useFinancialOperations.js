import { useState, useCallback } from 'react';
import axios from 'axios';

const BackendUrl = process.env.REACT_APP_Backend_Url;

export const useFinancialOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateOrderStatus = useCallback(async (orderId, type, newValue) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = type === 'etat' 
        ? `${BackendUrl}/command/updateEtatTraitement/${orderId}`
        : `${BackendUrl}/command/updateStatusLivraison/${orderId}`;

      const payload = type === 'etat' 
        ? { nouvelEtat: newValue }
        : { nouveauStatus: newValue };

      const response = await axios.put(endpoint, payload);
      
      // Récupérer les données mises à jour
      const orderRes = await axios.get(`${BackendUrl}/getCommandesById/${orderId}`);
      
      return {
        success: true,
        data: orderRes.data.commande,
        message: response.data.message || 'Statut mis à jour avec succès'
      };
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFinancialSummary = useCallback(async (orderId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Vous pouvez créer un endpoint spécialisé pour cela plus tard
      const response = await axios.get(`${BackendUrl}/api/admin/finance/order-summary/${orderId}`);
      return response.data;
    } catch (err) {
      // Pour l'instant, on calcule côté client
      setError('Impossible de récupérer le résumé financier');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerFinancialAction = useCallback(async (orderId, action, data = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let endpoint;
      let payload = { ...data };

      switch (action) {
        case 'create_transactions':
          endpoint = `${BackendUrl}/api/admin/finance/create-transactions/${orderId}`;
          break;
        case 'confirm_transactions':
          endpoint = `${BackendUrl}/api/admin/finance/confirm-transactions/${orderId}`;
          break;
        case 'cancel_refund':
          endpoint = `${BackendUrl}/api/admin/finance/cancel-refund/${orderId}`;
          break;
        default:
          throw new Error('Action financière non reconnue');
      }

      const response = await axios.post(endpoint, payload);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Action financière exécutée avec succès'
      };
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'action financière';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    updateOrderStatus,
    getFinancialSummary,
    triggerFinancialAction,
    clearError: () => setError(null)
  };
};

export default useFinancialOperations;