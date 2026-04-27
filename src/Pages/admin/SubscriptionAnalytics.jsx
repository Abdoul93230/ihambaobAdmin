import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign, Clock, AlertTriangle,
  CheckCircle, RefreshCw, Eye, Settings, Download, Calendar,
  Package, Crown, Star, Shield, Zap, FileText, Phone, Mail,
  Filter, Search, Activity, Bell, ChevronRight, ChevronDown,
  ExternalLink, Copy, MessageSquare, Pause, Play, Ban,
  Edit, Trash2, ArrowUpRight, User, Building, X
} from 'lucide-react';

const SubscriptionAnalytics = () => {
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    performance: {},
    alerts: {},
    recentActivity: []
  });
  const [sellersData, setSellersData] = useState({
    sellers: [],
    pagination: {}
  });
  const [selectedTab, setSelectedTab] = useState('overview');
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    planType: 'all',
    billingCycle: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
  const baseURL = process.env.REACT_APP_Backend_Url;

  useEffect(() => {
    fetchDashboardData();
    fetchSellersData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${baseURL}/api/adminSeller/universal-dashboard`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setDashboardData(data.data || {});
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  const fetchSellersData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        limit: 20
      });

      const response = await fetch(`${baseURL}/api/adminSeller/sellers-with-status?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setSellersData(data.data || { sellers: [], pagination: {} });
    } catch (error) {
      console.error('Erreur chargement vendeurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action, sellerId, additionalData = {}) => {
    setActionLoading(prev => ({ ...prev, [sellerId]: action }));
    
    try {
      let endpoint = '';
      let method = 'POST';
      let body = { sellerId, ...additionalData };

      switch (action) {
        case 'activate':
          endpoint = `/api/adminSeller/force-activate/${sellerId}`;
          break;
        case 'suspend':
          endpoint = `/api/adminSeller/suspend-account/${sellerId}`;
          break;
        case 'extend-grace':
          endpoint = `/api/adminSeller/extend-grace-period/${sellerId}`;
          body = { sellerId, hours: 24 };
          break;
        case 'verify-payment':
          endpoint = `/api/adminSeller/verify-payment/${additionalData.requestId}`;
          break;
        case 'reject-payment':
          endpoint = `/api/adminSeller/reject-payment/${additionalData.requestId}`;
          body = { sellerId, reason: additionalData.reason || 'Paiement invalide' };
          break;
        default:
          throw new Error('Action non reconnue');
      }

      const response = await fetch(`${baseURL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Action effectuée avec succès!');
        fetchSellersData();
        fetchDashboardData();
      } else {
        alert(result.message || 'Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Erreur action:', error);
      alert('Erreur lors de l\'action');
    } finally {
      setActionLoading(prev => ({ ...prev, [sellerId]: null }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      trial: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      grace_period: 'bg-orange-100 text-orange-800 border-orange-200',
      suspended: 'bg-red-100 text-red-800 border-red-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      trial: <Star className="w-4 h-4" />,
      active: <CheckCircle className="w-4 h-4" />,
      grace_period: <Clock className="w-4 h-4" />,
      suspended: <Ban className="w-4 h-4" />,
      expired: <AlertTriangle className="w-4 h-4" />
    };
    return icons[status] || <AlertTriangle className="w-4 h-4" />;
  };

  // Composant MetricCard
  const MetricCard = ({ title, value, icon, color, subtitle, trend }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    };

    return (
      <div className={`p-6 rounded-xl border-2 ${colorClasses[color]} transition-all hover:shadow-lg hover:scale-105`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg bg-white/70`}>
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm font-medium opacity-90">{title}</div>
        {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
      </div>
    );
  };

  // Composant SellerCard
  const SellerCard = ({ seller }) => {
    const loading = actionLoading[seller._id];
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              {seller.storeName?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{seller.storeName}</h3>
              <p className="text-sm text-gray-600">{seller.storeType}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(seller.accountStatus)}`}>
            <div className="flex items-center gap-1">
              {getStatusIcon(seller.accountStatus)}
              {seller.accountStatus}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            Plan: {seller.currentPlan?.planType || 'Aucun'}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            Expire: {seller.subscriptionEnd ? new Date(seller.subscriptionEnd).toLocaleDateString('fr-FR') : 'N/A'}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            {seller.email}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleQuickAction('activate', seller._id)}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
          >
            {loading === 'activate' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Play className="w-4 h-4" />
                Activer
              </>
            )}
          </button>
          <button
            onClick={() => setSelectedSeller(seller)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Détails
          </button>
        </div>
      </div>
    );
  };

  // Composant filtres avancés
  const AdvancedFilters = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filtres Avancés</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="trial">Essai gratuit</option>
            <option value="active">Actif</option>
            <option value="grace_period">Période de grâce</option>
            <option value="suspended">Suspendu</option>
            <option value="expired">Expiré</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
          <select
            value={filters.planType}
            onChange={(e) => setFilters(prev => ({ ...prev, planType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les plans</option>
            <option value="Starter">Starter</option>
            <option value="Pro">Pro</option>
            <option value="Business">Business</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Facturation</label>
          <select
            value={filters.billingCycle}
            onChange={(e) => setFilters(prev => ({ ...prev, billingCycle: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les cycles</option>
            <option value="monthly">Mensuel</option>
            <option value="annual">Annuel</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Nom, email, téléphone..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header amélioré */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Dashboard Admin - Abonnements
            </h1>
            <p className="text-gray-600 text-lg">
              Gestion avancée des abonnements et surveillance en temps réel
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Activity className="w-4 h-4" />
                Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                Système opérationnel
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Actions Rapides
            </button>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Actions rapides */}
        {showQuickActions && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Actions Rapides</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all flex flex-col items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium">Valider Paiements</span>
              </button>
              <button className="p-4 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all flex flex-col items-center gap-2">
                <Clock className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-medium">Étendre Grâce</span>
              </button>
              <button className="p-4 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all flex flex-col items-center gap-2">
                <Mail className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium">Envoyer Rappels</span>
              </button>
              <button className="p-4 bg-white rounded-lg border border-purple-200 hover:shadow-md transition-all flex flex-col items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium">Rapport Complet</span>
              </button>
            </div>
          </div>
        )}

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            title="Essais Gratuits"
            value={dashboardData.overview?.trialAccounts || 0}
            icon={<Star className="w-6 h-6" />}
            color="blue"
            subtitle="comptes en essai"
            trend="+12%"
          />
          <MetricCard
            title="Actifs Payants"
            value={dashboardData.overview?.activeSubscriptions || 0}
            icon={<Crown className="w-6 h-6" />}
            color="green"
            subtitle="abonnements payés"
            trend="+8%"
          />
          <MetricCard
            title="Période de Grâce"
            value={dashboardData.overview?.gracePeriodAccounts || 0}
            icon={<Clock className="w-6 h-6" />}
            color="orange"
            subtitle="comptes à risque"
          />
          <MetricCard
            title="Suspendus"
            value={dashboardData.overview?.suspendedAccounts || 0}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
            subtitle="nécessitent action"
          />
          <MetricCard
            title="File d'Attente"
            value={dashboardData.overview?.queuedSubscriptions || 0}
            icon={<Package className="w-6 h-6" />}
            color="purple"
            subtitle="abonnements prêts"
          />
          <MetricCard
            title="Revenus/Mois"
            value={`${(dashboardData.overview?.monthlyRevenue || 0).toLocaleString()} F`}
            icon={<DollarSign className="w-6 h-6" />}
            color="emerald"
            subtitle="récurrents"
            trend="+15%"
          />
        </div>

        {/* Alertes critiques */}
        {(dashboardData.alerts?.criticalActions > 0 || dashboardData.alerts?.pendingVerifications > 0) && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-xl font-bold text-red-900">Actions Critiques Requises</h3>
                <p className="text-red-700">Des vendeurs nécessitent votre attention immédiate</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  <span className="font-semibold">Comptes à Risque</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{dashboardData.alerts?.criticalActions}</div>
                <p className="text-sm text-gray-600">Période de grâce ou suspendus</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold">Paiements à Vérifier</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{dashboardData.alerts?.pendingVerifications}</div>
                <p className="text-sm text-gray-600">En attente de validation</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <AdvancedFilters />

        {/* Liste des vendeurs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Vendeurs et Abonnements</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {sellersData.sellers?.length || 0} vendeurs
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellersData.sellers?.map((seller) => (
                  <SellerCard key={seller._id} seller={seller} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal détails vendeur */}
        {selectedSeller && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Détails du Vendeur</h3>
                  <button
                    onClick={() => setSelectedSeller(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {selectedSeller.storeName?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{selectedSeller.storeName}</h4>
                      <p className="text-gray-600">{selectedSeller.storeType}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedSeller.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Téléphone</label>
                      <p className="text-gray-900">{selectedSeller.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Statut</label>
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedSeller.accountStatus)}`}>
                        {selectedSeller.accountStatus}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Plan Actuel</label>
                      <p className="text-gray-900">{selectedSeller.currentPlan?.planType || 'Aucun'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleQuickAction('activate', selectedSeller._id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => handleQuickAction('suspend', selectedSeller._id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Suspendre
                    </button>
                    <button
                      onClick={() => handleQuickAction('extend-grace', selectedSeller._id)}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Étendre Grâce
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionAnalytics;
