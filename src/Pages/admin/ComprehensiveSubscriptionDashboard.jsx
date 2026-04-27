import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign, Clock, AlertTriangle,
  CheckCircle, RefreshCw, Eye, Settings, Download, Calendar,
  Package, Crown, Star, Shield, Zap, FileText, Phone, Mail,
  Filter, Search, Activity, Bell, ChevronRight, ChevronDown,
  ExternalLink, Copy, MessageSquare, Pause, Play, Ban,
  Edit, Trash2, ArrowUpRight, User, Building, Plus, Send,
  CreditCard, XCircle, Loader, MapPin, ChevronUp
} from 'lucide-react';

const ComprehensiveSubscriptionDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    performance: {},
    alerts: {},
    recentActivity: []
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    planType: 'all',
    billingCycle: 'all',
    dateRange: '30'
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState({ open: false, url: '' });
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
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const [showManualAdvanced, setShowManualAdvanced] = useState(false);

  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
  const baseURL = process.env.REACT_APP_Backend_Url;

  const planPricing = {
    Starter: { monthly: 2500, annual: 27000 },
    Pro: { monthly: 4500, annual: 48600 },
    Business: { monthly: 9000, annual: 97200 }
  };

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchSubscriptions(),
        fetchPendingRequests(),
        fetchSellers()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Erreur dashboard:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${baseURL}/api/adminSeller/subscriptions?${params}`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setSubscriptions(data?.data?.subscriptions || []);
    } catch (error) {
      console.error('Erreur abonnements:', error);
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
      console.error('Erreur demandes:', error);
    }
  };

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
      console.error('Erreur vendeurs:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) {
      alert('Aucun élément sélectionné');
      return;
    }

    const confirmMessage = {
      'verify': `Voulez-vous valider ${selectedItems.length} paiements ?`,
      'reject': `Voulez-vous rejeter ${selectedItems.length} paiements ?`,
      'activate': `Voulez-vous activer ${selectedItems.length} abonnements ?`,
      'suspend': `Voulez-vous suspendre ${selectedItems.length} comptes ?`,
    };

    if (!window.confirm(confirmMessage[action])) return;

    setActionLoading(prev => ({ ...prev, bulk: action }));

    try {
      const endpoint = {
        'verify': '/api/adminSeller/bulk-verify-payments',
        'reject': '/api/adminSeller/bulk-reject-payments',
        'activate': '/api/adminSeller/bulk-activate',
        'suspend': '/api/adminSeller/bulk-suspend'
      };

      const response = await fetch(`${baseURL}${endpoint[action]}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: selectedItems,
          adminId: admin._id
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`${result.data?.processed || selectedItems.length} éléments traités avec succès!`);
        setSelectedItems([]);
        fetchAllData();
      } else {
        alert(result.message || 'Erreur lors du traitement');
      }
    } catch (error) {
      console.error('Erreur action en lot:', error);
      alert('Erreur lors du traitement en lot');
    } finally {
      setActionLoading(prev => ({ ...prev, bulk: null }));
    }
  };

  const handleSingleAction = async (action, id, isApproved, verificationNotes) => {
    setActionLoading(prev => ({ ...prev, [id]: action }));

    try {
      let endpoint = '';
      let method = 'PUT';
      // let body = { isApproved: isApproved, adminId: admin._id, ...verificationNotes: verificationNotes };
      let body = {
        isApproved: isApproved,
        adminId: admin._id,
        verificationNotes: verificationNotes
      };


      switch (action) {
        case 'verify-payment':
          endpoint = `/api/adminSeller/verify-payment/${id}`;
          break;
        case 'reject-payment':
          endpoint = `/api/adminSeller/verify-payment/${id}`;
          // body.reason = additionalData.reason || 'Paiement non conforme';
          break;
        case 'activate':
          endpoint = `/api/adminSeller/force-activate/${id}`;
          break;
        case 'suspend':
          endpoint = `/api/adminSeller/suspend-account/${id}`;
          break;
        case 'extend-grace':
          endpoint = `/api/adminSeller/extend-grace-period/${id}`;
          body.hours = 48;
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
        fetchAllData();
      } else {
        alert(result.message || 'Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Erreur action:', error);
      alert('Erreur lors de l\'action');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      trial: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      grace_period: 'bg-orange-100 text-orange-800 border-orange-200',
      suspended: 'bg-red-100 text-red-800 border-red-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
      pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      payment_submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      payment_verified: 'bg-green-100 text-green-800 border-green-200',
      activated: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      trial: <Star className="w-4 h-4" />,
      active: <CheckCircle className="w-4 h-4" />,
      grace_period: <Clock className="w-4 h-4" />,
      suspended: <Ban className="w-4 h-4" />,
      expired: <AlertTriangle className="w-4 h-4" />,
      pending_payment: <Clock className="w-4 h-4" />,
      payment_submitted: <FileText className="w-4 h-4" />,
      payment_verified: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <AlertTriangle className="w-4 h-4" />;
  };

  const getReceiptUrl = (request) => {
    return (
      request?.paymentDetails?.receiptFile ||
      request?.paymentDetails?.receiptUrl ||
      request?.submittedProof?.receiptUrl ||
      ''
    );
  };

  const isImageFile = (url) => /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url || '');

  const filteredManualSellers = sellers.filter((seller) =>
    seller.storeName?.toLowerCase().includes(manualSearchTerm.toLowerCase()) ||
    seller.email?.toLowerCase().includes(manualSearchTerm.toLowerCase()) ||
    seller.phone?.includes(manualSearchTerm)
  );

  const calculateManualPrice = () => {
    const basePrice = planPricing[renewalData.planType]?.[renewalData.billingCycle] || 0;
    return basePrice;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Code copie dans le presse-papiers!');
  };

  const createManualRenewal = async () => {
    if (!selectedSeller) {
      alert('Veuillez selectionner un vendeur');
      return;
    }

    setManualLoading(true);
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
          duration: 1,
          adminId: admin._id,
          adminNote: renewalData.notes
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setGeneratedCode(data.data);
        alert('Renouvellement cree avec succes!');

        setRenewalData({
          planType: 'Starter',
          billingCycle: 'monthly',
          duration: 1,
          notes: '',
          sendNotification: true,
          immediateActivation: true
        });
        setSelectedSeller(null);
        fetchAllData();
      } else {
        alert(data.message || 'Erreur lors de la creation');
      }
    } catch (error) {
      console.error('Erreur creation renouvellement:', error);
      alert('Erreur lors de la creation du renouvellement');
    } finally {
      setManualLoading(false);
    }
  };

  // Composant MetricCard
  const MetricCard = ({ title, value, icon, color, subtitle, trend, onClick }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
      green: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
      orange: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
      red: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
      purple: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
    };

    return (
      <div
        onClick={onClick}
        className={`p-6 rounded-xl border-2 ${colorClasses[color]} transition-all hover:shadow-lg hover:scale-105 cursor-pointer`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-white/70">
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </div>
          )}
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm font-medium opacity-90">{title}</div>
        {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
      </div>
    );
  };

  // Composant de filtres avancés
  const AdvancedFilters = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filtres</h3>
        {Object.values(filters).some(v => v !== 'all' && v !== '') && (
          <button
            onClick={() => setFilters({ status: 'all', search: '', planType: 'all', billingCycle: 'all', dateRange: '30' })}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            <option value="trial">Essai</option>
            <option value="active">Actif</option>
            <option value="grace_period">Grâce</option>
            <option value="suspended">Suspendu</option>
            <option value="pending_payment">En attente</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
          <select
            value={filters.planType}
            onChange={(e) => setFilters(prev => ({ ...prev, planType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            <option value="monthly">Mensuel</option>
            <option value="annual">Annuel</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">7 jours</option>
            <option value="30">30 jours</option>
            <option value="90">90 jours</option>
            <option value="365">1 an</option>
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
              placeholder="Nom, email..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Composant de navigation par onglets
  const TabNavigation = () => {
    const tabs = [
      { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'pending', label: 'En attente', icon: <Clock className="w-4 h-4" />, badge: pendingRequests.length },
      { id: 'reactivation', label: 'Reactivation', icon: <RefreshCw className="w-4 h-4" /> },
      { id: 'active', label: 'Actifs', icon: <CheckCircle className="w-4 h-4" /> },
      { id: 'suspended', label: 'Suspendus', icon: <Ban className="w-4 h-4" /> },
      { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> }
    ];

    return (
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 px-6 py-4 text-center font-medium transition-colors relative ${activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                {tab.icon}
                <span className="truncate">{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Centre de Gestion des Abonnements
            </h1>
            <p className="text-gray-600 text-lg">
              Dashboard complet pour la gestion des abonnements et vendeurs
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
            {selectedItems.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('verify')}
                  disabled={actionLoading.bulk}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Valider ({selectedItems.length})
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={actionLoading.bulk}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeter
                </button>
              </div>
            )}
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
            trend="+12%"
            onClick={() => setActiveTab('overview')}
          />
          <MetricCard
            title="Actifs Payants"
            value={dashboardData.overview?.activeSubscriptions || 0}
            icon={<Crown className="w-6 h-6" />}
            color="green"
            subtitle="abonnements payés"
            trend="+8%"
            onClick={() => setActiveTab('active')}
          />
          <MetricCard
            title="Période de Grâce"
            value={dashboardData.overview?.gracePeriodAccounts || 0}
            icon={<Clock className="w-6 h-6" />}
            color="orange"
            subtitle="comptes à risque"
            onClick={() => setActiveTab('suspended')}
          />
          <MetricCard
            title="En Attente"
            value={pendingRequests.length}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
            subtitle="nécessitent action"
            onClick={() => setActiveTab('pending')}
          />
          <MetricCard
            title="Suspendus"
            value={dashboardData.overview?.suspendedAccounts || 0}
            icon={<Ban className="w-6 h-6" />}
            color="purple"
            subtitle="comptes bloqués"
            onClick={() => setActiveTab('suspended')}
          />
          <MetricCard
            title="Revenus/Mois"
            value={`${(dashboardData.overview?.monthlyRevenue || 0).toLocaleString()} F`}
            icon={<DollarSign className="w-6 h-6" />}
            color="emerald"
            subtitle="récurrents"
            trend="+15%"
            onClick={() => setActiveTab('analytics')}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Expirations Prochaines</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{dashboardData.alerts?.expiringCount || 0}</div>
                <p className="text-sm text-gray-600">Dans les 7 prochains jours</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation par onglets */}
        <TabNavigation />

        {/* Filtres */}
        <AdvancedFilters />

        {/* Contenu selon l'onglet actif */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-lg text-gray-600">Chargement des données...</span>
              </div>
            ) : (
              <div>
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Vue d'ensemble du système</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Contenu vue d'ensemble */}
                      <div className="text-center py-12">
                        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">Statistiques détaillées à venir</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'pending' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Demandes en Attente</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {pendingRequests.length} demandes
                      </div>
                    </div>
                    {pendingRequests.length > 0 ? (
                      <div className="space-y-4">
                        {pendingRequests.map((request) => (
                          <div key={request._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start gap-4">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(request._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedItems(prev => [...prev, request._id]);
                                    } else {
                                      setSelectedItems(prev => prev.filter(id => id !== request._id));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                />
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                  {request.storeId?.storeName?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 text-lg">{request.storeId?.storeName}</h4>
                                  <p className="text-sm text-gray-600">{request.storeId?.email}</p>
                                  <p className="text-sm text-gray-500">Tél: {request.storeId?.phone}</p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                                  {request.status}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {request._id.slice(-8)}
                                </div>
                              </div>
                            </div>

                            {/* Informations du plan */}
                            <div className="bg-blue-50 rounded-lg p-4 mb-4">
                              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="text-blue-600">📦</span> Plan demandé
                              </h5>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Type:</span>
                                  <span className="ml-2 font-medium text-gray-900">{request.requestedPlan?.planType}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Cycle:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {request.requestedPlan?.billingCycle === 'annual' ? 'Annuel' : 'Mensuel'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Détails du paiement */}
                            <div className="bg-green-50 rounded-lg p-4 mb-4">
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="text-green-600">💳</span> Détails du paiement
                              </h5>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Montant:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {request.paymentDetails?.amount?.toLocaleString()} FCFA
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Méthode:</span>
                                  <span className="ml-2 font-medium text-gray-900 uppercase">
                                    {request.paymentDetails?.method}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Code transfert:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {request.paymentDetails?.transferCode? request.paymentDetails?.transferCode : request.submittedProof?.transferCode }
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Téléphone envoyeur:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {request.paymentDetails?.senderPhone? request.paymentDetails?.senderPhone : request.submittedProof?.senderPhone }
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Téléphone destinataire:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {request.paymentDetails?.recipientPhone? request.paymentDetails?.recipientPhone : request.submittedProof?.recipientPhone }
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Soumis le:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {request.paymentDetails?.submittedAt
                                      ? new Date(request.paymentDetails.submittedAt).toLocaleString('fr-FR')
                                      : (request.submittedProof?.submittedAt
                                        ? new Date(request.submittedProof.submittedAt).toLocaleString('fr-FR')
                                        : 'N/A')}
                                  </span>
                                </div>
                              </div>

                              {(() => {
                                const receiptUrl = getReceiptUrl(request);
                                if (!receiptUrl) {
                                  return (
                                    <div className="mt-4 p-3 rounded-lg border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
                                      Aucun reçu joint pour cette demande.
                                    </div>
                                  );
                                }

                                return (
                                  <div className="mt-4 p-3 rounded-lg border border-green-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="text-sm text-gray-700">
                                      <span className="font-medium">Recu joint:</span>{' '}
                                      {isImageFile(receiptUrl) ? 'Image' : 'PDF ou document'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setReceiptPreview({ open: true, url: receiptUrl })}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                                      >
                                        <Eye className="w-4 h-4" />
                                        Voir le recu
                                      </button>
                                      <button
                                        onClick={() => window.open(receiptUrl, '_blank', 'noopener,noreferrer')}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-2"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Ouvrir
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Dates importantes */}
                            <div className="bg-purple-50 rounded-lg p-4 mb-4">
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="text-purple-600">📅</span> Dates importantes
                              </h5>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Date de demande:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {new Date(request.requestDate).toLocaleString('fr-FR')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Date limite paiement:</span>
                                  <span className="ml-2 font-medium text-red-600">
                                    {new Date(request.paymentDetails?.paymentDeadline).toLocaleString('fr-FR')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Activation estimée:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {new Date(request.estimatedActivationDate).toLocaleString('fr-FR')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Dernière mise à jour:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {new Date(request.updatedAt).toLocaleString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => handleSingleAction('verify-payment', request._id, true)}
                                disabled={actionLoading[request._id]}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {actionLoading[request._id] === 'verify-payment' ? (
                                  <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>Traitement...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>✓</span>
                                    <span>Valider le paiement</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Raison du rejet:');
                                  if (reason) handleSingleAction('reject-payment', request._id, false, reason);
                                }}
                                disabled={actionLoading[request._id]}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <span>✕</span>
                                <span>Rejeter</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                        <p className="text-gray-600">Aucune demande en attente</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reactivation' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Selection du vendeur</h3>
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={manualSearchTerm}
                            onChange={(e) => setManualSearchTerm(e.target.value)}
                            placeholder="Nom, email ou telephone"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                          {filteredManualSellers.length > 0 ? (
                            filteredManualSellers.map((seller) => {
                              const isSelected = selectedSeller?._id === seller._id;
                              return (
                                <button
                                  key={seller._id}
                                  onClick={() => setSelectedSeller(seller)}
                                  className={`w-full text-left p-3 rounded-lg border transition ${isSelected
                                    ? 'border-blue-400 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                                >
                                  <p className="font-semibold text-gray-900 truncate">{seller.storeName || 'Sans nom'}</p>
                                  <p className="text-xs text-gray-600 truncate">{seller.email || 'Email indisponible'}</p>
                                  <p className="text-xs text-gray-500 truncate">{seller.phone || 'Telephone indisponible'}</p>
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-sm text-gray-500">Aucun vendeur trouve</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Creation d'un code de reactivation</h3>

                        {selectedSeller ? (
                          <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                  {selectedSeller.storeName?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{selectedSeller.storeName}</h4>
                                  <p className="text-sm text-gray-600">{selectedSeller.email}</p>
                                  <p className="text-sm text-gray-600">{selectedSeller.phone}</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type de Plan</label>
                                <select
                                  value={renewalData.planType}
                                  onChange={(e) => setRenewalData((prev) => ({ ...prev, planType: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="Starter">Starter</option>
                                  <option value="Pro">Pro</option>
                                  <option value="Business">Business</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cycle de Facturation</label>
                                <select
                                  value={renewalData.billingCycle}
                                  onChange={(e) => setRenewalData((prev) => ({ ...prev, billingCycle: e.target.value, duration: 1 }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="monthly">Mensuel</option>
                                  <option value="annual">Annuel</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duree appliquee</label>
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium">
                                  {renewalData.billingCycle === 'monthly' ? '1 mois' : '1 an'}
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Prix Total</label>
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-bold text-green-600">
                                  {calculateManualPrice().toLocaleString()} FCFA
                                </div>
                              </div>
                            </div>

                            <div>
                              <button
                                onClick={() => setShowManualAdvanced(!showManualAdvanced)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {showManualAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                Options Avancees
                              </button>

                              {showManualAdvanced && (
                                <div className="mt-4 space-y-3">
                                  <label className="flex items-center gap-3 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={renewalData.sendNotification}
                                      onChange={(e) => setRenewalData((prev) => ({ ...prev, sendNotification: e.target.checked }))}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    Envoyer une notification au vendeur
                                  </label>
                                  <label className="flex items-center gap-3 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={renewalData.immediateActivation}
                                      onChange={(e) => setRenewalData((prev) => ({ ...prev, immediateActivation: e.target.checked }))}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    Activation immediate (sans paiement)
                                  </label>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Notes Administratives</label>
                              <textarea
                                value={renewalData.notes}
                                onChange={(e) => setRenewalData((prev) => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                                placeholder="Notes ou commentaires pour ce renouvellement..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <button
                              onClick={createManualRenewal}
                              disabled={manualLoading}
                              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                            >
                              {manualLoading ? (
                                <>
                                  <Loader className="w-5 h-5 animate-spin" />
                                  Creation en cours...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-5 h-5" />
                                  Creer le Renouvellement
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Selectionnez un vendeur pour demarrer une reactivation.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Autres onglets... */}
                {activeTab !== 'overview' && activeTab !== 'pending' && activeTab !== 'reactivation' && (
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Contenu en développement pour l'onglet {activeTab}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {receiptPreview.open && receiptPreview.url && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Apercu du recu</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(receiptPreview.url, '_blank', 'noopener,noreferrer')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir dans un onglet
                </button>
                <button
                  onClick={() => setReceiptPreview({ open: false, url: '' })}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Fermer
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[78vh] overflow-auto bg-gray-50">
              {isImageFile(receiptPreview.url) ? (
                <img
                  src={receiptPreview.url}
                  alt="Recu de paiement"
                  className="max-w-full h-auto mx-auto rounded-lg border border-gray-200"
                />
              ) : (
                <iframe
                  title="Recu PDF"
                  src={receiptPreview.url}
                  className="w-full h-[70vh] rounded-lg border border-gray-200 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {generatedCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Renouvellement Cree</h3>
              <p className="text-gray-600">Le code de reactivation est pret.</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-lg font-bold text-blue-600 break-all">{generatedCode.reactivationCode}</span>
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
      )}
    </div>
  );
};

export default ComprehensiveSubscriptionDashboard;
