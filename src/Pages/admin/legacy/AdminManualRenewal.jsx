import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  User,
  Calendar,
  DollarSign,
  Clock,
  Check,
  X,
  Copy,
  AlertTriangle,
  Loader,
  Search,
  Eye,
  FileText,
  Phone,
  Mail
} from 'lucide-react';

// Composant principal
const AdminManualRenewal = () => {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [renewalData, setRenewalData] = useState({
    planType: 'Starter',
    billingCycle: 'monthly',
    notes: ''
  });
  const [generatedCode, setGeneratedCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sellers, setSellers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
  const baseURL = process.env.REACT_APP_Backend_Url;

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
    //   console.log({data});
      
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
    if (!selectedSeller) return;

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
          ...renewalData
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setGeneratedCode(data.data);
        alert('Renouvellement créé avec succès!');
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

  const verifyPayment = async (requestId, isApproved, notes = '') => {
    console.log({requestId, isApproved, notes});
    
    try {
      const response = await fetch(`${baseURL}/api/adminSeller/verify-payment/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isApproved,
          verificationNotes: notes
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        fetchPendingRequests(); // Refresh la liste
        alert(isApproved ? 'Paiement approuvé et abonnement activé!' : 'Paiement rejeté');
      }
    } catch (error) {
      console.error('Erreur vérification paiement:', error);
      alert('Erreur lors de la vérification');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code copié dans le presse-papier!');
  };

  const filteredSellers = sellers.filter(seller =>
    seller.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Gestion Manuelle des Abonnements
          </h1>
          <p className="text-gray-600 text-lg">
            Créez des renouvellements et vérifiez les paiements
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section Création de Renouvellement */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-6 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <CreditCard className="w-8 h-8" />
                Créer un Renouvellement
              </h2>
              <p className="text-teal-100 mt-2">
                Générez un code de réactivation pour un vendeur
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Recherche de vendeur */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Rechercher un vendeur
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Nom de boutique, propriétaire ou email..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Liste des vendeurs */}
              {searchTerm && (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredSellers.map(seller => (
                    <div
                      key={seller._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                        selectedSeller?._id === seller._id ? 'bg-teal-50 border-teal-200' : ''
                      }`}
                      onClick={() => setSelectedSeller(seller)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{seller.storeName}</div>
                          <div className="text-sm text-gray-600">{seller.name}</div>
                          <div className="text-xs text-gray-500">{seller.email}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          seller.isvalid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {seller.isvalid ? 'Actif' : 'Bloqué'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vendeur sélectionné */}
              {selectedSeller && (
                <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Vendeur sélectionné</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Boutique:</span>
                      <span className="ml-2 font-medium">{selectedSeller.storeName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Propriétaire:</span>
                      <span className="ml-2 font-medium">{selectedSeller.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedSeller.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Téléphone:</span>
                      <span className="ml-2 font-medium">{selectedSeller.phone}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration du renouvellement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type de plan
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    value={renewalData.planType}
                    onChange={(e) => setRenewalData({...renewalData, planType: e.target.value})}
                  >
                    <option value="Starter">Starter (2,500 FCFA/mois)</option>
                    <option value="Pro">Pro (4,500 FCFA/mois)</option>
                    <option value="Business">Business (9,000 FCFA/mois)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cycle de facturation
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    value={renewalData.billingCycle}
                    onChange={(e) => setRenewalData({...renewalData, billingCycle: e.target.value})}
                  >
                    <option value="monthly">Mensuel</option>
                    <option value="annual">Annuel (10% de réduction)</option>
                  </select>
                </div>
              </div>

              {/* Notes administratives */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes administratives
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100 resize-none"
                  rows="3"
                  placeholder="Raison du renouvellement, contexte..."
                  value={renewalData.notes}
                  onChange={(e) => setRenewalData({...renewalData, notes: e.target.value})}
                />
              </div>

              {/* Bouton de création */}
              <button
                onClick={createManualRenewal}
                disabled={!selectedSeller || loading}
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold rounded-lg hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <CreditCard className="w-6 h-6" />
                )}
                {loading ? 'Création...' : 'Créer le Renouvellement'}
              </button>

              {/* Code généré */}
              {generatedCode && (
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                  <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                    <Check className="w-6 h-6" />
                    Code de Réactivation Généré
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
                    <div className="text-3xl font-mono font-bold text-center text-gray-900 tracking-widest mb-2">
                      {generatedCode.reactivationCode}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => copyCode(generatedCode.reactivationCode)}
                        className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1 mx-auto"
                      >
                        <Copy className="w-4 h-4" />
                        Copier le code
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-green-700">
                    <p><strong>Expire le:</strong> {new Date(generatedCode.expiresAt).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Instructions:</strong> Donnez ce code au vendeur pour qu'il réactive son compte</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section Vérification des Paiements */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="w-8 h-8" />
                Demandes en Attente
              </h2>
              <p className="text-orange-100 mt-2">
                Vérifiez les paiements soumis par les vendeurs
              </p>
            </div>

            <div className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Check className="w-16 h-16 mx-auto text-green-300 mb-4" />
                  <p className="text-lg font-medium text-gray-600">Aucune demande en attente</p>
                  <p className="text-sm text-gray-500">Toutes les demandes ont été traitées</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <PaymentRequestCard
                      key={request._id}
                      request={request}
                      onVerify={verifyPayment}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour les cartes de demande de paiement
const PaymentRequestCard = ({ request, onVerify }) => {
  const [verificationNotes, setVerificationNotes] = useState('');

  return (
    <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-teal-300 transition-colors bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {request.storeId?.storeName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{request.storeId?.storeName}</h3>
            <p className="text-gray-600">{request.storeId?.name}</p>
            <p className="text-sm text-gray-500">{request.storeId?.email}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-teal-600">
            {request.paymentDetails?.amount?.toLocaleString()} FCFA
          </div>
          <div className="text-sm text-gray-500">Plan {request.requestedPlan?.planType}</div>
        </div>
      </div>

      {/* Informations de paiement */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="text-xs font-medium text-gray-600">Méthode</label>
          <p className="font-semibold text-gray-900 capitalize">{request.paymentDetails?.method}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Code transfert</label>
          <p className="font-semibold text-gray-900 font-mono">{request.paymentDetails?.transferCode}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Téléphone expéditeur</label>
          <p className="font-semibold text-gray-900">{request.paymentDetails?.senderPhone}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Date demande</label>
          <p className="font-semibold text-gray-900">{new Date(request.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* Reçu */}
      {request.paymentDetails?.receiptFile && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">Reçu de paiement</label>
          <a
            href={request.paymentDetails.receiptFile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Voir le reçu
          </a>
        </div>
      )}

      {/* Notes de vérification */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Notes de vérification
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none"
          rows="2"
          placeholder="Notes sur la vérification du paiement..."
          value={verificationNotes}
          onChange={(e) => setVerificationNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onVerify(request._id, true, verificationNotes)}
          className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Approuver
        </button>
        <button
          onClick={() => onVerify(request._id, false, verificationNotes)}
          className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Rejeter
        </button>
      </div>
    </div>
  );
};

export default AdminManualRenewal;