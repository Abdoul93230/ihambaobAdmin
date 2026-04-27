
import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign, Clock, AlertTriangle,
  CheckCircle, RefreshCw, Eye, Settings, Download, Calendar,
  Package, Crown, Star, Shield, Zap, FileText, Phone, Mail,
  Filter, Search, Activity, Bell, ChevronRight, ChevronDown,
  ExternalLink, Copy, MessageSquare, Pause, Play, Ban
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
      console.log(admin.token);
      
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

  const forceActivateNext = async (sellerId) => {
    await handleQuickAction('activate', sellerId);
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
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Universel</h1>
            <p className="text-gray-600 text-lg">Gestion complète des abonnements et files d'attente</p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={fetchDashboardData}
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

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            title="Essais Gratuits"
            value={dashboardData.overview?.trialAccounts || 0}
            icon={<Star className="w-6 h-6" />}
            color="blue"
            subtitle="comptes en essai"
          />
          <MetricCard
            title="Actifs Payants"
            value={dashboardData.overview?.activeSubscriptions || 0}
            icon={<Crown className="w-6 h-6" />}
            color="green"
            subtitle="abonnements payés"
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

        {/* Navigation par onglets */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                { id: 'sellers', label: 'Gestion Vendeurs', icon: Users },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
                { id: 'settings', label: 'Configuration', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setSelectedTab(tab.id)}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="p-6">
            {selectedTab === 'overview' && (
              <OverviewTab dashboardData={dashboardData} />
            )}
            
            {selectedTab === 'sellers' && (
              <SellersTab 
                sellersData={sellersData}
                filters={filters}
                setFilters={setFilters}
                onForceActivate={forceActivateNext}
                loading={loading}
              />
            )}
            
            {selectedTab === 'performance' && (
              <PerformanceTab dashboardData={dashboardData} />
            )}
            
            {selectedTab === 'settings' && (
              <SettingsTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant MetricCard
const MetricCard = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

// Onglet Vue d'ensemble
const OverviewTab = ({ dashboardData }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-gray-900">Aperçu Global du Système</h3>
    
    {/* Graphiques et métriques détaillées */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
        <h4 className="font-bold text-gray-900 mb-4">Distribution des États</h4>
        {/* Graphique de distribution */}
        <div className="space-y-3">
          {[
            { label: 'Essais gratuits', value: dashboardData.overview?.trialAccounts, color: 'bg-blue-500' },
            { label: 'Actifs payants', value: dashboardData.overview?.activeSubscriptions, color: 'bg-green-500' },
            { label: 'Période de grâce', value: dashboardData.overview?.gracePeriodAccounts, color: 'bg-orange-500' },
            { label: 'Suspendus', value: dashboardData.overview?.suspendedAccounts, color: 'bg-red-500' }
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className="font-semibold">{item.value || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <h4 className="font-bold text-gray-900 mb-4">Performance Système</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Taux de conversion (Essai → Payant)</span>
            <span className="font-bold text-green-600">{dashboardData.performance?.conversionRate || '0'}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Automatisation réussies</span>
            <span className="font-bold text-blue-600">95%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Temps moyen de traitement</span>
            <span className="font-bold text-purple-600">2.3h</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Onglet Gestion Vendeurs
const SellersTab = ({ sellersData, filters, setFilters, onForceActivate, loading }) => (
  <div className="space-y-6">
    {/* Filtres */}
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <h3 className="text-xl font-bold text-gray-900">Gestion des Vendeurs</h3>
      
      <div className="flex gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-teal-500"
        >
          <option value="all">Tous les états</option>
          <option value="trial">Essai gratuit</option>
          <option value="active">Actifs</option>
          <option value="grace_period">Période de grâce</option>
          <option value="suspended">Suspendus</option>
        </select>
        
        <input
          type="text"
          placeholder="Rechercher..."
          className="border border-gray-300 rounded-lg px-3 py-2 focus:border-teal-500"
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
        />
      </div>
    </div>

    {/* Liste des vendeurs */}
    {loading ? (
      <div className="text-center py-12">
        <RefreshCw className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-gray-600">Chargement des vendeurs...</p>
      </div>
    ) : (
      <div className="space-y-4">
        {sellersData.sellers.map(seller => (
          <SellerCard 
            key={seller._id}
            seller={seller}
            onForceActivate={onForceActivate}
          />
        ))}
        
        {sellersData.sellers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun vendeur trouvé</p>
          </div>
        )}
      </div>
    )}

    {/* Pagination */}
    {sellersData.pagination?.pages > 1 && (
      <div className="flex justify-center gap-2">
        {[...Array(sellersData.pagination.pages)].map((_, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-lg ${
              filters.page === index + 1
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setFilters({...filters, page: index + 1})}
          >
            {index + 1}
          </button>
        ))}
      </div>
    )}
  </div>
);

// Carte vendeur avec statut complet
const SellerCard = ({ seller, onForceActivate }) => {
  const getStatusBadge = (status) => {
    const badges = {
      trial: { color: 'bg-blue-100 text-blue-800', label: '🆓 Essai Gratuit' },
      active: { color: 'bg-green-100 text-green-800', label: '✅ Actif' },
      grace_period: { color: 'bg-orange-100 text-orange-800', label: '⏳ Période de Grâce' },
      suspended: { color: 'bg-red-100 text-red-800', label: '🚫 Suspendu' }
    };
    return badges[status] || { color: 'bg-gray-100 text-gray-800', label: 'Inconnu' };
  };

  const statusBadge = getStatusBadge(seller.accountStatus);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
            {seller.seller?.storeName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{seller.seller?.storeName}</h3>
            <p className="text-gray-600">{seller.seller?.name}</p>
            <p className="text-sm text-gray-500">{seller.seller?.email}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color} mb-2`}>
            {statusBadge.label}
          </div>
          {seller.activeSubscription && (
            <div className="text-sm text-gray-600">
              Plan {seller.activeSubscription.planType}
            </div>
          )}
        </div>
      </div>

      {/* Informations d'abonnement */}
      {seller.activeSubscription && (
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="text-xs text-gray-600">Début</label>
            <p className="font-medium text-sm">{new Date(seller.activeSubscription.startDate).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600">Fin</label>
            <p className="font-medium text-sm">{new Date(seller.activeSubscription.endDate).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600">Commission</label>
            <p className="font-medium text-sm">{seller.activeSubscription.commission}%</p>
          </div>
        </div>
      )}

      {/* File d'attente */}
      {seller.queuedSubscriptions?.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">File d'attente</span>
          </div>
          <p className="text-sm text-indigo-800">
            {seller.queuedSubscriptions.length} abonnement(s) programmé(s)
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          Détails
        </button>
        
        {seller.accountStatus === 'grace_period' && (
          <button
            onClick={() => onForceActivate(seller.storeId)}
            className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium flex items-center gap-1"
          >
            <Zap className="w-4 h-4" />
            Activer Suivant
          </button>
        )}
        
        {seller.accountStatus === 'suspended' && (
          <button
            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center gap-1"
          >
            <Phone className="w-4 h-4" />
            Créer Code
          </button>
        )}
      </div>
    </div>
  );
};

// Onglets Performance et Settings (versions simplifiées)
const PerformanceTab = ({ dashboardData }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-gray-900">Analyse de Performance</h3>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <h4 className="font-bold text-green-900 mb-4">Automatisation</h4>
        <div className="text-3xl font-bold text-green-600">98.5%</div>
        <p className="text-sm text-green-700">Taux de succès automatique</p>
      </div>
      {/* Autres métriques de performance */}
    </div>
  </div>
);

const SettingsTab = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-gray-900">Configuration Système</h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-4">Paramètres d'Automatisation</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Période de grâce</span>
            <span className="font-semibold">48 heures</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Délai de paiement</span>
            <span className="font-semibold">24 heures</span>
          </div>
        </div>
      </div>
      {/* Autres paramètres */}
    </div>
  </div>
);

export default SubscriptionAnalytics;