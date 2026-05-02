import React, { useState, useEffect } from 'react';
import {
  CreditCard, User, Calendar, DollarSign, Clock, Check, X, Copy, 
  AlertTriangle, Loader, Search, Eye, FileText, Phone, Mail,
  Package, Crown, Star, Shield, Zap, ChevronDown, ChevronUp,
  CheckCircle, XCircle, RefreshCw, Bell, Plus, Edit, Trash2,
  Send, Download, Filter, Users, Building, MapPin
} from 'lucide-react';
import SUBSCRIPTION_CONFIG from '../../config/subscriptionConfig';

const AdminManualRenewal = () => {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [renewalData, setRenewalData] = useState({
    planType: 'Starter',
    billingCycle: 'monthly',
    duration: 1,
    notes: '',
    sendNotification: true,
    immediateActivation: true
  });
  const [generatedCode, setGeneratedCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sellers, setSellers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedTab, setSelectedTab] = useState('manual');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bulkSelection, setBulkSelection] = useState([]);

  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
  const baseURL = process.env.REACT_APP_Backend_Url;

  const planPricing = {
    Starter: { monthly: SUBSCRIPTION_CONFIG.PLANS.Starter.pricing.monthly, annual: SUBSCRIPTION_CONFIG.PLANS.Starter.pricing.annual },
    Pro:     { monthly: SUBSCRIPTION_CONFIG.PLANS.Pro.pricing.monthly,     annual: SUBSCRIPTION_CONFIG.PLANS.Pro.pricing.annual },
    Business:{ monthly: SUBSCRIPTION_CONFIG.PLANS.Business.pricing.monthly,annual: SUBSCRIPTION_CONFIG.PLANS.Business.pricing.annual },
  };

  useEffect(() => {
    fetchSellers();
    fetchPendingRequests();
  }, []);

  const fetchSellers = async () => {
    try {
      const response = await fetch(`${baseURL}/getSellers`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setSellers(data?.data || []);
    } catch (error) {
      console.error('Erreur chargement vendeurs:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${baseURL}/api/adminSeller/pending-requests`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setPendingRequests(data.data?.requests || []);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    }
  };

  const createManualRenewal = async () => {
    if (!selectedSeller) {
      alert('Veuillez sélectionner un vendeur');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/adminSeller/create-manual-renewal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: selectedSeller._id,
          ...renewalData,
          adminId: admin._id,
          adminNote: renewalData.notes
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setGeneratedCode(data.data);
        alert('Renouvellement créé avec succès!');
        
        // Réinitialiser le formulaire
        setRenewalData({
          planType: 'Starter',
          billingCycle: 'monthly',
          duration: 1,
          notes: '',
          sendNotification: true,
          immediateActivation: true
        });
        setSelectedSeller(null);
        fetchPendingRequests();
      } else {
        alert(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création renouvellement:', error);
      alert('Erreur lors de la création du renouvellement');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (requestId, action, reason = '') => {
    try {
      const endpoint = action === 'verify' 
        ? `/api/adminSeller/verify-payment/${requestId}`
        : `/api/adminSeller/reject-payment/${requestId}`;

      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, adminId: admin._id })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        alert(`Paiement ${action === 'verify' ? 'vérifié' : 'rejeté'} avec succès!`);
        fetchPendingRequests();
      } else {
        alert(data.message || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation paiement:', error);
      alert('Erreur lors de la validation du paiement');
    }
  };

  const bulkVerifyPayments = async () => {
    if (bulkSelection.length === 0) {
      alert('Aucune demande sélectionnée');
      return;
    }

    const confirmAction = window.confirm(`Voulez-vous vraiment vérifier ${bulkSelection.length} paiements en lot ?`);
    
    if (confirmAction) {
      setLoading(true);
      try {
        const response = await fetch(`${baseURL}/api/adminSeller/bulk-verify-payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${admin.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            requestIds: bulkSelection,
            adminId: admin._id
          })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
          alert(`${data.data.processed} paiements traités avec succès!`);
          setBulkSelection([]);
          fetchPendingRequests();
        } else {
          alert(data.message || 'Erreur lors du traitement en lot');
        }
      } catch (error) {
        console.error('Erreur traitement en lot:', error);
        alert('Erreur lors du traitement en lot');
      } finally {
        setLoading(false);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Code copié dans le presse-papiers!');
  };

  const filteredSellers = sellers.filter(seller =>
    seller.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.phone?.includes(searchTerm)
  );

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      payment_submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      payment_verified: 'bg-green-100 text-green-800 border-green-200',
      activated: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const calculatePrice = () => {
    const basePrice = planPricing[renewalData.planType]?.[renewalData.billingCycle] || 0;
    return basePrice * (renewalData.duration || 1);
  };

  const PendingRequestCard = ({ request }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={bulkSelection.includes(request._id)}
            onChange={(e) => {
              if (e.target.checked) {
                setBulkSelection(prev => [...prev, request._id]);
              } else {
                setBulkSelection(prev => prev.filter(id => id !== request._id));
              }
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            {request.storeDetails?.storeName?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{request.storeDetails?.storeName}</h3>
            <p className="text-sm text-gray-600">{request.storeDetails?.email}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
          {request.status}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-gray-500" />
          <span>Plan: {request.requestedPlan?.planType} ({request.requestedPlan?.billingCycle})</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span>Montant: {request.paymentDetails?.amount?.toLocaleString()} FCFA</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>Demandé: {new Date(request.requestDate).toLocaleDateString('fr-FR')}</span>
        </div>
        {request.paymentDetails?.transferCode && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-500" />
            <span>Code: {request.paymentDetails.transferCode}</span>
            <button
              onClick={() => copyToClipboard(request.paymentDetails.transferCode)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => verifyPayment(request._id, 'verify')}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-1"
        >
          <CheckCircle className="w-4 h-4" />
          Valider
        </button>
        <button
          onClick={() => {
            const reason = prompt('Raison du rejet:');
            if (reason) verifyPayment(request._id, 'reject', reason);
          }}
          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center justify-center gap-1"
        >
          <XCircle className="w-4 h-4" />
          Rejeter
        </button>
        {request.paymentDetails?.receiptFile && (
          <button
            onClick={() => window.open(request.paymentDetails.receiptFile, '_blank')}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Gestion des Abonnements
            </h1>
            <p className="text-gray-600 text-lg">
              Renouvellements manuels et validation des paiements
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={fetchPendingRequests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex">
            <button
              onClick={() => setSelectedTab('manual')}
              className={`flex-1 px-6 py-4 text-center font-medium rounded-tl-xl rounded-tr-xl transition-colors ${
                selectedTab === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Renouvellement Manuel
              </div>
            </button>
            <button
              onClick={() => setSelectedTab('pending')}
              className={`flex-1 px-6 py-4 text-center font-medium rounded-tr-xl transition-colors relative ${
                selectedTab === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" />
                Demandes en Attente
                {pendingRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Onglet Renouvellement Manuel */}
        {selectedTab === 'manual' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sélection du vendeur */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Sélectionner un Vendeur
                </h3>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un vendeur..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredSellers.map((seller) => (
                    <div
                      key={seller._id}
                      onClick={() => setSelectedSeller(seller)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedSeller?._id === seller._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {seller.storeName?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {seller.storeName}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {seller.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Formulaire de renouvellement */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Créer un Renouvellement
                </h3>

                {selectedSeller ? (
                  <div className="space-y-6">
                    {/* Vendeur sélectionné */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {selectedSeller.storeName?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {selectedSeller.storeName}
                          </h4>
                          <p className="text-sm text-gray-600">{selectedSeller.email}</p>
                          <p className="text-sm text-gray-600">{selectedSeller.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Configuration du plan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type de Plan
                        </label>
                        <select
                          value={renewalData.planType}
                          onChange={(e) => setRenewalData(prev => ({ ...prev, planType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Starter">Starter</option>
                          <option value="Pro">Pro</option>
                          <option value="Business">Business</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cycle de Facturation
                        </label>
                        <select
                          value={renewalData.billingCycle}
                          onChange={(e) => setRenewalData(prev => ({ ...prev, billingCycle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="monthly">Mensuel</option>
                          <option value="annual">Annuel</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Durée (en {renewalData.billingCycle === 'monthly' ? 'mois' : 'années'})
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={renewalData.duration}
                          onChange={(e) => setRenewalData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prix Total
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-bold text-green-600">
                          {calculatePrice().toLocaleString()} FCFA
                        </div>
                      </div>
                    </div>

                    {/* Options avancées */}
                    <div>
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Options Avancées
                      </button>

                      {showAdvanced && (
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="sendNotification"
                              checked={renewalData.sendNotification}
                              onChange={(e) => setRenewalData(prev => ({ ...prev, sendNotification: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="sendNotification" className="text-sm text-gray-700">
                              Envoyer une notification au vendeur
                            </label>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="immediateActivation"
                              checked={renewalData.immediateActivation}
                              onChange={(e) => setRenewalData(prev => ({ ...prev, immediateActivation: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="immediateActivation" className="text-sm text-gray-700">
                              Activation immédiate (sans paiement)
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes Administratives
                      </label>
                      <textarea
                        value={renewalData.notes}
                        onChange={(e) => setRenewalData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        placeholder="Notes ou commentaires pour ce renouvellement..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Bouton de création */}
                    <button
                      onClick={createManualRenewal}
                      disabled={loading}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Créer le Renouvellement
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Sélectionnez un vendeur pour créer un renouvellement
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Demandes en Attente */}
        {selectedTab === 'pending' && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    Demandes de Paiement en Attente
                  </h3>
                  <div className="flex items-center gap-3">
                    {bulkSelection.length > 0 && (
                      <button
                        onClick={bulkVerifyPayments}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Valider ({bulkSelection.length})
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {pendingRequests.length} demandes
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {pendingRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingRequests.map((request) => (
                      <PendingRequestCard key={request._id} request={request} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Aucune demande de paiement en attente
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Code Généré */}
        {generatedCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="text-center mb-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Renouvellement Créé !
                  </h3>
                  <p className="text-gray-600">
                    Code de renouvellement généré avec succès
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-blue-600">
                      {generatedCode.reactivationCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedCode.reactivationCode)}
                      className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Expire le: {new Date(generatedCode.expiresAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(generatedCode.reactivationCode)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copier
                  </button>
                  <button
                    onClick={() => setGeneratedCode(null)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManualRenewal;
