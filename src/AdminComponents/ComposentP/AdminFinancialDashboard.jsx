import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
  Settings,
  AlertCircle,
  Info,
  Trash2,
  Edit,
  Plus,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import FinancialManagementPage from '../FinancialManagementPage/FinancialManagementPage';

const AdminFinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [retraits, setRetraits] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRetrait, setSelectedRetrait] = useState(null);
  const [showRetraitModal, setShowRetraitModal] = useState(false);
  const [filters, setFilters] = useState({
    statut: '',
    periode: 30,
    sellerId: '',
    methodeRetrait: '',
    dateStart: '',
    dateEnd: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
  const baseURL = process.env.REACT_APP_Backend_Url;

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/adminf/finances/dashboard?periode=${filters.periode}`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    }
    setLoading(false);
  };

  const fetchRetraits = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.statut && { statut: filters.statut }),
        ...(filters.sellerId && { sellerId: filters.sellerId }),
        ...(filters.methodeRetrait && { methodeRetrait: filters.methodeRetrait }),
        ...(filters.dateStart && { dateStart: filters.dateStart }),
        ...(filters.dateEnd && { dateEnd: filters.dateEnd })
      });
      
      const response = await fetch(`${baseURL}/adminf/finances/retraits?${params}`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRetraits(data.data.retraits);
        setPagination(prev => ({
          ...prev,
          page: data.data.pagination.page,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des retraits:', error);
    }
    setLoading(false);
  };

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/adminf/finances/sellers-stats`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSellers(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sellers:', error);
    }
    setLoading(false);
  };

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/adminf/finances/audit`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuditData(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'audit:', error);
    }
    setLoading(false);
  };

  const updateRetraitStatus = async (retraitId, statut, commentaire = '') => {
    try {
      const response = await fetch(`${baseURL}/adminf/finances/retraits/${retraitId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut, commentaire })
      });
      
      if (response.ok) {
        fetchRetraits(pagination.page);
        fetchDashboardData(); // Mettre à jour les stats
        alert(`Demande ${statut.toLowerCase()} avec succès`);
        setShowRetraitModal(false);
        setSelectedRetrait(null);
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const executeMaintenanceTask = async (task) => {
    try {
      const response = await fetch(`${baseURL}/adminf/finances/maintenance/${task}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Tâche ${task} exécutée avec succès: ${data.message}`);
        fetchDashboardData();
      }
    } catch (error) {
      console.error(`Erreur lors de l'exécution de ${task}:`, error);
      alert(`Erreur lors de l'exécution de ${task}`);
    }
  };

  const recalculateSellerBalance = async (sellerId) => {
    try {
      const response = await fetch(`${baseURL}/adminf/finances/recalculate-balances/${sellerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Soldes recalculés avec succès');
        fetchSellers();
      }
    } catch (error) {
      console.error('Erreur lors du recalcul:', error);
      alert('Erreur lors du recalcul');
    }
  };

  useEffect(() => {
    switch (activeTab) {
      case 'dashboard':
        fetchDashboardData();
        break;
      case 'retraits':
        fetchRetraits();
        break;
      case 'sellers':
        fetchSellers();
        break;
      case 'audit':
        fetchAuditData();
        break;
    }
  }, [activeTab, filters]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue", trend = null }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
              {Math.abs(trend)}% vs période précédente
            </div>
          )}
        </div>
        <Icon className={`w-8 h-8 text-${color}-500`} />
      </div>
    </div>
  );

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status) => {
    const badges = {
      'EN_ATTENTE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'APPROUVE': 'bg-green-100 text-green-800 border-green-200',
      'REJETE': 'bg-red-100 text-red-800 border-red-200',
      'TRAITE': 'bg-blue-100 text-blue-800 border-blue-200',
      'ANNULE': 'bg-gray-100 text-gray-800 border-gray-200',
      'EXPIRE': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'EN_ATTENTE': <Clock className="w-4 h-4" />,
      'APPROUVE': <CheckCircle className="w-4 h-4" />,
      'REJETE': <XCircle className="w-4 h-4" />,
      'TRAITE': <CheckCircle className="w-4 h-4" />,
      'ANNULE': <XCircle className="w-4 h-4" />,
      'EXPIRE': <AlertTriangle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const RetraitModal = ({ retrait, onClose, onUpdate }) => {
    const [commentaire, setCommentaire] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    if (!retrait) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Détails de la demande de retrait</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Référence</label>
                <p className="mt-1 text-sm text-gray-900">{retrait.reference}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Seller ID</label>
                <p className="mt-1 text-sm text-gray-900">{retrait.sellerId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Montant demandé</label>
                <p className="mt-1 text-sm font-bold text-gray-900">{formatMoney(retrait.montantDemande)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Montant net</label>
                <p className="mt-1 text-sm font-bold text-green-600">{formatMoney(retrait.montantAccorde)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frais</label>
                <p className="mt-1 text-sm text-red-600">{formatMoney(retrait.fraisRetrait)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Méthode</label>
                <p className="mt-1 text-sm text-gray-900">{retrait.methodeRetrait}</p>
              </div>
            </div>

            {/* Détails de retrait */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Détails de retrait</label>
              <div className="bg-gray-50 p-4 rounded-lg">
                {retrait.detailsRetrait?.numeroTelephone && (
                  <p><strong>Téléphone:</strong> {retrait.detailsRetrait.numeroTelephone}</p>
                )}
                {retrait.detailsRetrait?.operateur && (
                  <p><strong>Opérateur:</strong> {retrait.detailsRetrait.operateur}</p>
                )}
                {retrait.detailsRetrait?.nomBeneficiaire && (
                  <p><strong>Bénéficiaire:</strong> {retrait.detailsRetrait.nomBeneficiaire}</p>
                )}
                {retrait.detailsRetrait?.numeroCompte && (
                  <p><strong>Compte:</strong> {retrait.detailsRetrait.numeroCompte}</p>
                )}
                {retrait.detailsRetrait?.banque && (
                  <p><strong>Banque:</strong> {retrait.detailsRetrait.banque}</p>
                )}
                {retrait.detailsRetrait?.nomTitulaire && (
                  <p><strong>Titulaire:</strong> {retrait.detailsRetrait.nomTitulaire}</p>
                )}
              </div>
            </div>

            {/* Informations du seller */}
            {retrait.sellerInfo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Informations du seller</label>
                <div className="bg-blue-50 p-4 rounded-lg grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Solde total</p>
                    <p className="font-bold">{formatMoney(retrait.sellerInfo.soldeTotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Solde disponible</p>
                    <p className="font-bold text-green-600">{formatMoney(retrait.sellerInfo.soldeDisponible)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Solde bloqué</p>
                    <p className="font-bold text-orange-600">{formatMoney(retrait.sellerInfo.soldeBloqueTemporairement)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Historique */}
            {retrait.historiqueStatut && retrait.historiqueStatut.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Historique</label>
                <div className="space-y-2">
                  {retrait.historiqueStatut.map((hist, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                      <p><strong>{hist.ancienStatut}</strong> → <strong>{hist.nouveauStatut}</strong></p>
                      <p className="text-gray-600">{formatDate(hist.date)} par {hist.adminId}</p>
                      {hist.commentaire && <p className="text-blue-600">💬 {hist.commentaire}</p>}
                    </div>
                      
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {retrait.statut === 'EN_ATTENTE' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir une action</option>
                    <option value="APPROUVE">Approuver</option>
                    <option value="REJETE">Rejeter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder={selectedStatus === 'REJETE' ? 'Raison du rejet (obligatoire)' : 'Commentaire (optionnel)'}
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedStatus) {
                        alert('Veuillez choisir une action');
                        return;
                      }
                      if (selectedStatus === 'REJETE' && !commentaire.trim()) {
                        alert('Un commentaire est obligatoire pour un rejet');
                        return;
                      }
                      onUpdate(retrait._id, selectedStatus, commentaire);
                    }}
                    disabled={!selectedStatus}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            )}

            {retrait.statut === 'APPROUVE' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marquer comme traité</label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Commentaire sur le traitement (optionnel)"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => onUpdate(retrait._id, 'TRAITE', commentaire || 'Paiement effectué')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Marquer comme traité
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-4 flex-wrap">
          <select 
            value={filters.periode}
            onChange={(e) => setFilters({...filters, periode: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>3 derniers mois</option>
            <option value={365}>12 derniers mois</option>
          </select>
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => executeMaintenanceTask('deblocage')}
              className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm"
            >
              Débloquer fonds
            </button>
            <button
              onClick={() => executeMaintenanceTask('nettoyage')}
              className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 text-sm"
            >
              Nettoyage
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      {dashboardData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Ventes Totales"
              value={formatMoney(dashboardData.ventesTotales.total)}
              subtitle={`${dashboardData.ventesTotales.count} commandes`}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Commissions"
              value={formatMoney(dashboardData.commissionsTotal)}
              subtitle="Revenus plateforme"
              icon={CreditCard}
              color="purple"
            />
            <StatCard
              title="Retraits en Attente"
              value={dashboardData.retraitsEnAttente}
              subtitle={formatMoney(dashboardData.argentBloqueRetraits)}
              icon={Clock}
              color="yellow"
            />
            <StatCard
              title="Sellers Actifs"
              value={dashboardData.sellersActifs}
              subtitle={`${dashboardData.commandesEnCours} commandes en cours`}
              icon={Users}
              color="blue"
            />
          </div>

          {/* Alertes importantes */}
          {(dashboardData.retraitsEnAttente > 10 || dashboardData.argentBloqueRetraits > 1000000) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">⚠️ Attention requise</h4>
                  <p className="text-sm text-red-700 mt-1">
                    {dashboardData.retraitsEnAttente > 10 && `${dashboardData.retraitsEnAttente} demandes de retrait en attente. `}
                    {dashboardData.argentBloqueRetraits > 1000000 && `${formatMoney(dashboardData.argentBloqueRetraits)} bloqués pour les retraits.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Répartition des retraits */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Répartition des Retraits</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {dashboardData.retraitsParStatut.map((item) => (
                <div key={item._id} className="text-center">
                  <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm border ${getStatusBadge(item._id)}`}>
                    {getStatusIcon(item._id)}
                    <span>{item._id}</span>
                  </div>
                  <p className="font-semibold mt-2">{item.count}</p>
                  <p className="text-sm text-gray-600">{formatMoney(item.montant)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions récentes */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Transactions Récentes</h3>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Voir l'audit complet
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.transactionsRecentes.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.sellerId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {transaction.type === 'CREDIT_COMMANDE' ? (
                            <ArrowDownRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm text-gray-500">{transaction.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={transaction.type === 'CREDIT_COMMANDE' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'CREDIT_COMMANDE' ? '+' : '-'}{formatMoney(Math.abs(transaction.montantNet))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={transaction.type === 'CREDIT_COMMANDE' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'CREDIT_COMMANDE' ? '+' : '-'}{formatMoney(Math.abs(transaction.commission))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(transaction.statut)}`}>
                          {getStatusIcon(transaction.statut)}
                          <span>{transaction.statut}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.dateTransaction)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderRetraits = () => (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <select 
            value={filters.statut}
            onChange={(e) => setFilters({...filters, statut: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="APPROUVE">Approuvé</option>
            <option value="REJETE">Rejeté</option>
            <option value="TRAITE">Traité</option>
            <option value="ANNULE">Annulé</option>
            <option value="EXPIRE">Expiré</option>
          </select>

          <select 
            value={filters.methodeRetrait}
            onChange={(e) => setFilters({...filters, methodeRetrait: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Toutes les méthodes</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="VIREMENT_BANCAIRE">Virement Bancaire</option>
            <option value="ESPECES">Espèces</option>
          </select>

          <input
            type="text"
            placeholder="Seller ID"
            value={filters.sellerId}
            onChange={(e) => setFilters({...filters, sellerId: e.target.value})}
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="date"
            value={filters.dateStart}
            onChange={(e) => setFilters({...filters, dateStart: e.target.value})}
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => setFilters({...filters, dateEnd: e.target.value})}
            className="border rounded-lg px-3 py-2"
          />

          <button 
            onClick={() => fetchRetraits(1)}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Filtrer
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setFilters({
              statut: '',
              periode: 30,
              sellerId: '',
              methodeRetrait: '',
              dateStart: '',
              dateEnd: ''
            })}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Réinitialiser les filtres
          </button>
          <div className="text-sm text-gray-600">
            {pagination.total} résultat(s) trouvé(s)
          </div>
        </div>
      </div>

      {/* Liste des retraits */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {retraits.map((retrait) => (
                <tr key={retrait._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {retrait.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <p className="font-medium">{retrait.sellerId}</p>
                      {retrait.sellerInfo && (
                        <p className="text-xs text-gray-400">
                          Solde: {formatMoney(retrait.sellerInfo.soldeDisponible)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <p className="font-bold">{formatMoney(retrait.montantDemande)}</p>
                      <p className="text-xs text-green-600">Net: {formatMoney(retrait.montantAccorde)}</p>
                      <p className="text-xs text-red-600">Frais: {formatMoney(retrait.fraisRetrait)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <p>{retrait.methodeRetrait}</p>
                      {retrait.detailsRetrait?.numeroTelephone && (
                        <p className="text-xs">{retrait.detailsRetrait.numeroTelephone}</p>
                      )}
                      {retrait.detailsRetrait?.numeroCompte && (
                        <p className="text-xs">{retrait.detailsRetrait.numeroCompte}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <p>{formatDate(retrait.datedemande)}</p>
                      {retrait.dateTraitement && (
                        <p className="text-xs text-blue-600">Traité: {formatDate(retrait.dateTraitement)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(retrait.statut)}`}>
                      {getStatusIcon(retrait.statut)}
                      <span>{retrait.statut}</span>
                    </span>
                    {retrait.commentaireAdmin && (
                      <p className="text-xs text-gray-500 mt-1">💬 {retrait.commentaireAdmin}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRetrait(retrait);
                          setShowRetraitModal(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      
                      {retrait.statut === 'EN_ATTENTE' && (
                        <>
                          <button
                            onClick={() => {
                              if (window.confirm('Approuver cette demande de retrait ?')) {
                                const commentaire = prompt('Commentaire (optionnel):');
                                updateRetraitStatus(retrait._id, 'APPROUVE', commentaire || '');
                              }
                            }}
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Rejeter cette demande de retrait ?')) {
                                const commentaire = prompt('Raison du rejet:');
                                if (commentaire) {
                                  updateRetraitStatus(retrait._id, 'REJETE', commentaire);
                                }
                              }
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      
                      {retrait.statut === 'APPROUVE' && (
                        <button
                          onClick={() => {
                            if (window.confirm('Marquer comme traité (paiement effectué) ?')) {
                              updateRetraitStatus(retrait._id, 'TRAITE', 'Paiement effectué');
                            }
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          Traité
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchRetraits(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => fetchRetraits(Math.min(pagination.pages, pagination.page + 1))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> sur{' '}
                  <span className="font-medium">{pagination.total}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => fetchRetraits(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  
                  {/* Pages */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => fetchRetraits(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => fetchRetraits(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSellers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Statistiques des Sellers</h3>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble des performances financières</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solde Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solde Disponible</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solde Bloqué</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retraits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière Activité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sellers.map((seller) => (
                <tr key={seller.sellerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {seller.sellerId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-bold">{formatMoney(seller.soldeTotal)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    <span className="font-bold">{formatMoney(seller.soldeDisponible)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                    <div>
                      <p className="font-bold">{formatMoney(seller.soldeBloqueTemporairement)}</p>
                      {seller.soldeReserveRetrait > 0 && (
                        <p className="text-xs text-red-600">Réservé: {formatMoney(seller.soldeReserveRetrait)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {seller.nombreTransactions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <p>{seller.nombreRetraits}</p>
                      {seller.retraitsEnAttente > 0 && (
                        <p className="text-xs text-yellow-600">{seller.retraitsEnAttente} en attente</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {seller.derniereActivite ? formatDate(seller.derniereActivite) : 'Aucune'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        if (window.confirm(`Recalculer les soldes pour ${seller.sellerId} ?`)) {
                          recalculateSellerBalance(seller.sellerId);
                        }
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                    >
                      Recalculer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-6">
      {auditData && (
        <>
          {/* Statistiques d'audit */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Portefeuilles"
              value={auditData.statistiques.totalPortefeuilles}
              subtitle="Total des comptes"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Anomalies Détectées"
              value={auditData.statistiques.anomaliesDetectees}
              subtitle="Incohérences de soldes"
              icon={AlertTriangle}
              color="red"
            />
            <StatCard
              title="Transactions Orphelines"
              value={auditData.statistiques.transactionsOrphelines}
              subtitle="Sans commande associée"
              icon={FileText}
              color="orange"
            />
            <StatCard
              title="Commandes Sans Transaction"
              value={auditData.statistiques.commandesSansTransaction}
              subtitle="Livrées mais non payées"
              icon={ShoppingBag}
              color="yellow"
            />
          </div>

          {/* Anomalies de soldes */}
          {auditData.anomaliesSoldes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-red-600">🚨 Anomalies de Soldes Détectées</h3>
                <p className="text-sm text-gray-500 mt-1">Incohérences entre les soldes enregistrés et calculés</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Seller ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Solde Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Solde Disponible</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Solde Bloqué</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditData.anomaliesSoldes.map((anomalie) => (
                      <tr key={anomalie.sellerId} className="hover:bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {anomalie.sellerId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <p className="text-gray-900">Enregistré: {formatMoney(anomalie.soldeEnregistre.total)}</p>
                            <p className="text-blue-600">Calculé: {formatMoney(anomalie.soldeCalcule.total)}</p>
                            <p className={`text-xs ${anomalie.differences.total > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Diff: {formatMoney(anomalie.differences.total)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <p className="text-gray-900">Enregistré: {formatMoney(anomalie.soldeEnregistre.disponible)}</p>
                            <p className="text-blue-600">Calculé: {formatMoney(anomalie.soldeCalcule.disponible)}</p>
                            <p className={`text-xs ${anomalie.differences.disponible > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Diff: {formatMoney(anomalie.differences.disponible)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <p className="text-gray-900">Enregistré: {formatMoney(anomalie.soldeEnregistre.bloque)}</p>
                            <p className="text-blue-600">Calculé: {formatMoney(anomalie.soldeCalcule.bloque)}</p>
                            <p className={`text-xs ${anomalie.differences.bloque > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Diff: {formatMoney(anomalie.differences.bloque)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              if (window.confirm(`Corriger les soldes pour ${anomalie.sellerId} ?`)) {
                                recalculateSellerBalance(anomalie.sellerId);
                              }
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                          >
                            Corriger
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transactions orphelines */}
          {auditData.transactionsSansCommande.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-orange-600">⚠️ Transactions Orphelines</h3>
                <p className="text-sm text-gray-500 mt-1">Transactions sans commande associée</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Référence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditData.transactionsSansCommande.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-orange-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.sellerId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMoney(transaction.montantNet)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.dateTransaction)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(transaction.statut)}`}>
                            {transaction.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Commandes sans transaction */}
          {auditData.commandesSansTransaction.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-yellow-600">⚠️ Commandes Sans Transaction</h3>
                <p className="text-sm text-gray-500 mt-1">Commandes livrées mais sans transaction financière</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-yellow-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Référence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Prix</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditData.commandesSansTransaction.map((commande) => (
                      <tr key={commande._id} className="hover:bg-yellow-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {commande.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMoney(commande.prix)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(commande.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {commande.etatTraitement}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tout va bien */}
          {auditData.statistiques.anomaliesDetectees === 0 && 
           auditData.statistiques.transactionsOrphelines === 0 && 
           auditData.statistiques.commandesSansTransaction === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">✅ Système Financier Sain</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Aucune anomalie détectée. Tous les soldes sont cohérents et toutes les transactions sont correctement associées.
                  </p>
                </div>
              </div>
            </div>
                     )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Administration Financière</h1>
            <div className="text-sm text-gray-600">
              Connecté en tant que: <span className="font-medium">{admin.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
              { id: 'retraits', name: 'Retraits', icon: CreditCard },
              { id: 'sellers', name: 'Sellers', icon: Users },
              { id: 'commandes', name: 'Commandes', icon: ShoppingBag },
              { id: 'audit', name: 'Audit', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'retraits' && renderRetraits()}
            {activeTab === 'sellers' && renderSellers()}
            {activeTab === 'commandes' && <FinancialManagementPage />}
            {activeTab === 'audit' && renderAudit()}
          </>
        )}

        {/* Modal de détail de retrait */}
        {showRetraitModal && (
          <RetraitModal
            retrait={selectedRetrait}
            onClose={() => {
              setShowRetraitModal(false);
              setSelectedRetrait(null);
            }}
            onUpdate={updateRetraitStatus}
          />
        )}
      </div>
    </div>
  );
};

export default AdminFinancialDashboard;