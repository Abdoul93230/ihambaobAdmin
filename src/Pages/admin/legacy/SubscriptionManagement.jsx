import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Mail,
  Clock,
  CreditCard,
  Users,
  TrendingUp,
  Package,
  Zap,
  Shield,
  PhoneCall,
  Download,
  RefreshCw,
  BarChart3,
  DollarSign,
  Settings,
  Bell,
  Star,
  Tag,
  Truck,
  MessageCircle,
  Loader
} from 'lucide-react';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    plan: 'all',
    search: '',
    expiring: false
  });
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [showStats, setShowStats] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  
  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
  const baseURL = process.env.REACT_APP_Backend_Url;

  useEffect(() => {
    fetchSubscriptions();
  }, [filters]);

  // Statistiques calculées dynamiquement
  const stats = React.useMemo(() => {
    if (!subscriptions.length) return { total: 0, active: 0, expiring: 0, expired: 0, monthlyRevenue: 0 };
    
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'active').length;
    const expiring = subscriptions.filter(s => {
      const daysUntilExpiry = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;
    const expired = subscriptions.filter(s => s.status === 'expired').length;
    const suspended = subscriptions.filter(s => s.status === 'suspended').length;
    const monthlyRevenue = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.price?.monthly || 0), 0);

    return { total, active, expiring, expired, suspended, monthlyRevenue };
  }, [subscriptions]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== false) {
          params.append(key, value);
        }
      });

      const response = await fetch(`${baseURL}/api/adminSeller/subscriptions?${params}`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log({data});
      setSubscriptions(data?.data?.subscriptions || []);
    } catch (error) {
      console.error('Erreur lors du chargement des abonnements:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (subscriptionId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [subscriptionId]: 'status' }));
    try {
      const response = await fetch(`${baseURL}/api/adminSeller/subscriptions/${subscriptionId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${admin.token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchSubscriptions();
      } else {
        console.error('Erreur lors de la modification du statut');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [subscriptionId]: null }));
    }
  };

  const sendRenewalReminder = async (subscriptionId) => {
    setActionLoading(prev => ({ ...prev, [subscriptionId]: 'reminder' }));
    try {
      const response = await fetch(`${baseURL}/api/adminSeller/subscriptions/${subscriptionId}/remind`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${admin.token}`, 
          'Content-Type': 'application/json' 
        },
      });

      if (response.ok) {
        alert('Rappel envoyé avec succès');
      } else {
        alert('Erreur lors de l\'envoi du rappel');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      alert('Erreur lors de l\'envoi du rappel');
    } finally {
      setActionLoading(prev => ({ ...prev, [subscriptionId]: null }));
    }
  };

  const exportData = async () => {
    try {
      const csvContent = generateCSV(subscriptions);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `abonnements-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const generateCSV = (data) => {
    const headers = ['Boutique', 'Propriétaire', 'Email', 'Plan', 'Statut', 'Prix Mensuel', 'Commission', 'Date Début', 'Date Fin'];
    const rows = data.map(sub => [
      sub.storeName,
      sub.ownerName,
      sub.ownerEmail,
      sub.planType,
      sub.status,
      sub.price?.monthly || '',
      sub.commission,
      new Date(sub.startDate).toLocaleDateString('fr-FR'),
      new Date(sub.endDate).toLocaleDateString('fr-FR')
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'suspended':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'Starter':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Pro':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Business':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `${price.monthly?.toLocaleString()} FCFA/mois`;
  };

  // Filtrage côté client pour une meilleure réactivité
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.storeName.toLowerCase().includes(filters.search.toLowerCase()) ||
                         sub.ownerEmail.toLowerCase().includes(filters.search.toLowerCase()) ||
                         sub.ownerName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || sub.status === filters.status;
    const matchesPlan = filters.plan === 'all' || sub.planType === filters.plan;
    
    let matchesExpiring = true;
    if (filters.expiring) {
      const daysUntilExpiry = Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      matchesExpiring = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }
    
    return matchesSearch && matchesStatus && matchesPlan && matchesExpiring;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestion des Abonnements</h1>
            <p className="text-gray-600">Surveillez et gérez tous les abonnements de la plateforme</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportData}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button 
              onClick={fetchSubscriptions}
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <StatCard
              title="Total"
              value={stats.total}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Actifs"
              value={stats.active}
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              title="Expirent bientôt"
              value={stats.expiring}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="orange"
            />
            <StatCard
              title="Expirés"
              value={stats.expired}
              icon={<XCircle className="w-6 h-6" />}
              color="red"
            />
            <StatCard
              title="Suspendus"
              value={stats.suspended}
              icon={<Shield className="w-6 h-6" />}
              color="gray"
            />
            <StatCard
              title="Revenus mensuels"
              value={`${stats.monthlyRevenue.toLocaleString()} FCFA`}
              icon={<DollarSign className="w-6 h-6" />}
              color="purple"
            />
          </div>
        )}

        {/* Filtres et contrôles */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-teal-100 text-teal-700 border border-teal-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Tableau
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-teal-100 text-teal-700 border border-teal-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4 inline mr-1" />
                Cartes
              </button>
            </div>
            
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showStats ? 'Masquer stats' : 'Afficher stats'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-colors"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            {/* Filtre par statut */}
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-colors"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="expiring">Expire bientôt</option>
              <option value="expired">Expiré</option>
              <option value="suspended">Suspendu</option>
            </select>

            {/* Filtre par plan */}
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-colors"
              value={filters.plan}
              onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
            >
              <option value="all">Tous les plans</option>
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Business">Business</option>
            </select>

            {/* Bouton filtres avancés */}
            <button 
              className={`px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                filters.expiring 
                  ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
              onClick={() => setFilters({ ...filters, expiring: !filters.expiring })}
            >
              <AlertTriangle className="w-4 h-4" />
              Expirants ({stats.expiring})
            </button>
          </div>
        </div>

        {/* Affichage des abonnements */}
        {viewMode === 'table' ? (
          <SubscriptionTable 
            subscriptions={filteredSubscriptions}
            onViewDetails={setSelectedSub}
            onStatusChange={handleStatusChange}
            onSendReminder={sendRenewalReminder}
            getPlanColor={getPlanColor}
            getStatusIcon={getStatusIcon}
            formatPrice={formatPrice}
            loading={loading}
            actionLoading={actionLoading}
          />
        ) : (
          <SubscriptionCards 
            subscriptions={filteredSubscriptions}
            onViewDetails={setSelectedSub}
            onStatusChange={handleStatusChange}
            onSendReminder={sendRenewalReminder}
            getPlanColor={getPlanColor}
            getStatusIcon={getStatusIcon}
            formatPrice={formatPrice}
            actionLoading={actionLoading}
          />
        )}

        {/* Modal de détails */}
        {selectedSub && (
          <SubscriptionDetailsModal 
            subscription={selectedSub}
            onClose={() => setSelectedSub(null)}
            onStatusChange={handleStatusChange}
            onSendReminder={sendRenewalReminder}
            actionLoading={actionLoading}
          />
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const SubscriptionTable = ({ 
  subscriptions, 
  onViewDetails, 
  onStatusChange, 
  onSendReminder, 
  getPlanColor, 
  getStatusIcon, 
  formatPrice, 
  loading,
  actionLoading
}) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Boutique & Propriétaire
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Plan & Prix
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Période
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Fonctionnalités
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Chargement des abonnements...
              </td>
            </tr>
          ) : subscriptions.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-1">Aucun abonnement trouvé</p>
                <p className="text-sm">Modifiez vos filtres pour voir plus de résultats</p>
              </td>
            </tr>
          ) : (
            subscriptions.map((subscription) => (
              <SubscriptionRow 
                key={subscription._id}
                subscription={subscription}
                onViewDetails={onViewDetails}
                onStatusChange={onStatusChange}
                onSendReminder={onSendReminder}
                getPlanColor={getPlanColor}
                getStatusIcon={getStatusIcon}
                formatPrice={formatPrice}
                actionLoading={actionLoading}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const SubscriptionRow = ({ 
  subscription, 
  onViewDetails, 
  onStatusChange, 
  onSendReminder, 
  getPlanColor, 
  getStatusIcon, 
  formatPrice,
  actionLoading
}) => {
  const daysUntilExpiry = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpiring = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isLoading = actionLoading[subscription._id];
  
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
            {subscription.storeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{subscription.storeName}</div>
            <div className="text-sm text-gray-500">{subscription.ownerName}</div>
            <div className="text-xs text-gray-400">{subscription.ownerEmail}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPlanColor(subscription.planType)}`}>
            {subscription.planType}
          </span>
          <span className="text-sm font-medium text-gray-900">{formatPrice(subscription.price)}</span>
          <span className="text-xs text-gray-500">Commission: {subscription.commission}%</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(subscription.status)}
          <span className="text-sm font-medium text-gray-900 capitalize">{subscription.status}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
          </div>
          <div className={`flex items-center gap-1 ${daysUntilExpiry < 7 && daysUntilExpiry > 0 ? 'text-red-600' : ''}`}>
            <Clock className="w-3 h-3" />
            {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
            {isExpiring && (
              <span className="ml-1 px-1 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">
                {daysUntilExpiry}j restants
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          <FeatureBadge 
            active={subscription.features?.productManagement?.maxProducts > 5} 
            text={`${subscription.features?.productManagement?.maxProducts || 0} produits`}
          />
          <FeatureBadge 
            active={subscription.features?.paymentOptions?.mobileMoney} 
            text="Mobile Money"
          />
          <FeatureBadge 
            active={subscription.features?.marketing?.emailMarketing} 
            text="Email Marketing"
          />
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onViewDetails(subscription)}
            className="text-teal-600 hover:text-teal-900 p-1 hover:bg-teal-50 rounded transition-colors"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isExpiring && (
            <button
              onClick={() => onSendReminder(subscription._id)}
              disabled={isLoading === 'reminder'}
              className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
              title="Envoyer un rappel"
            >
              {isLoading === 'reminder' ? <Loader className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            </button>
          )}
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-teal-500 disabled:opacity-50"
            value={subscription.status}
            onChange={(e) => onStatusChange(subscription._id, e.target.value)}
            disabled={isLoading === 'status'}
          >
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="expired">Expiré</option>
          </select>
        </div>
      </td>
    </tr>
  );
};

const FeatureBadge = ({ active, text }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
    active 
      ? 'bg-green-100 text-green-800 border border-green-200' 
      : 'bg-gray-100 text-gray-600 border border-gray-200'
  }`}>
    {active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
    {text}
  </span>
);

const SubscriptionCards = ({ 
  subscriptions, 
  onViewDetails, 
  onStatusChange, 
  onSendReminder, 
  getPlanColor, 
  getStatusIcon, 
  formatPrice,
  actionLoading
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {subscriptions.length === 0 ? (
      <div className="col-span-full text-center py-12">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-1 text-gray-600">Aucun abonnement trouvé</p>
        <p className="text-sm text-gray-500">Modifiez vos filtres pour voir plus de résultats</p>
      </div>
    ) : (
      subscriptions.map((subscription) => (
        <SubscriptionCard 
          key={subscription._id}
          subscription={subscription}
          onViewDetails={onViewDetails}
          onStatusChange={onStatusChange}
          onSendReminder={onSendReminder}
          getPlanColor={getPlanColor}
          getStatusIcon={getStatusIcon}
          formatPrice={formatPrice}
          actionLoading={actionLoading}
        />
      ))
    )}
  </div>
);

const SubscriptionCard = ({ 
  subscription, 
  onViewDetails, 
  onStatusChange, 
  onSendReminder, 
  getPlanColor, 
  getStatusIcon, 
  formatPrice,
  actionLoading
}) => {
  const daysUntilExpiry = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpiring = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isLoading = actionLoading[subscription._id];
  
  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200 hover:border-teal-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {subscription.storeName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{subscription.storeName}</h3>
              <p className="text-sm text-gray-600">{subscription.ownerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(subscription.status)}
          </div>
        </div>

        {/* Plan et Prix */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPlanColor(subscription.planType)}`}>
              {subscription.planType}
            </span>
            <span className="text-sm font-medium text-gray-900">{formatPrice(subscription.price)}</span>
          </div>
          <div className="text-xs text-gray-500">
            Commission: {subscription.commission}% • Support: {subscription.features?.support?.responseTime || 'N/A'}h
          </div>
        </div>

        {/* Dates */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Période:</span>
            <span className="font-medium">
              {new Date(subscription.startDate).toLocaleDateString('fr-FR')} - {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
            </span>
          </div>
          {isExpiring && (
            <div className="mt-2 text-center">
              <span className={`px-2 py-1 rounded text-xs ${
                daysUntilExpiry < 7 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
              }`}>
                Expire dans {daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Fonctionnalités clés */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Fonctionnalités</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <Package className="w-3 h-3 text-gray-400" />
              <span>{subscription.features?.productManagement?.maxProducts || 0} produits max</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 text-gray-400" />
              <span>{subscription.features?.productManagement?.maxCategories || 0} catégories</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-3 h-3 text-gray-400" />
              <span>
                {[
                  subscription.features?.paymentOptions?.mobileMoney && 'Mobile Money',
                  subscription.features?.paymentOptions?.cardPayment && 'Carte',
                  subscription.features?.paymentOptions?.manualPayment && 'Manuel'
                ].filter(Boolean).join(', ') || 'Aucun'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(subscription)}
            className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Voir détails
          </button>
          {isExpiring && (
            <button 
              onClick={() => onSendReminder(subscription._id)}
              disabled={isLoading === 'reminder'}
              className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              title="Envoyer rappel"
            >
              {isLoading === 'reminder' ? <Loader className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            </button>
          )}
          <select
            className="px-2 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs disabled:opacity-50"
            value={subscription.status}
            onChange={(e) => onStatusChange(subscription._id, e.target.value)}
            disabled={isLoading === 'status'}
          >
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="expired">Expiré</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const SubscriptionDetailsModal = ({ 
  subscription, 
  onClose, 
  onStatusChange, 
  onSendReminder,
  actionLoading
}) => {
  const daysUntilExpiry = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isLoading = actionLoading[subscription._id];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Détails de l'abonnement</h3>
            <p className="text-gray-600">{subscription.storeName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            {/* Informations générales */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                Informations générales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nom de la boutique</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{subscription.storeName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Propriétaire</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{subscription.ownerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{subscription.ownerEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de création</label>
                  <p className="mt-1 text-gray-900">{new Date(subscription.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </section>

            {/* Plan et tarification */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                Plan et tarification
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">Plan actuel</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{subscription.planType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prix mensuel</label>
                  <p className="mt-1 text-lg font-semibold text-teal-600">
                    {subscription.price?.monthly?.toLocaleString() || 'N/A'} FCFA
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prix annuel</label>
                  <p className="mt-1 text-lg font-semibold text-purple-600">
                    {subscription.price?.annual?.toLocaleString() || 'N/A'} FCFA
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Commission</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{subscription.commission}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Période</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(subscription.startDate).toLocaleDateString('fr-FR')} - {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                  </p>
                  {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                    <p className={`text-xs mt-1 ${daysUntilExpiry <= 7 ? 'text-red-600' : 'text-orange-600'}`}>
                      Expire dans {daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Statut</label>
                  <div className="mt-1 flex items-center gap-2">
                    {subscription.status === 'active' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {subscription.status === 'expired' && <XCircle className="w-5 h-5 text-red-500" />}
                    {subscription.status === 'suspended' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                    <span className="text-lg font-semibold text-gray-900 capitalize">{subscription.status}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Gestion des produits */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                Gestion des produits
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-teal-600">{subscription.features?.productManagement?.maxProducts || 0}</div>
                  <div className="text-sm text-gray-600">Produits max</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-teal-600">{subscription.features?.productManagement?.maxCategories || 0}</div>
                  <div className="text-sm text-gray-600">Catégories max</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-teal-600">{subscription.features?.productManagement?.maxVariants || 0}</div>
                  <div className="text-sm text-gray-600">Variantes max</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className={`text-2xl font-bold ${subscription.features?.productManagement?.catalogImport ? 'text-green-600' : 'text-red-600'}`}>
                    {subscription.features?.productManagement?.catalogImport ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600">Import catalogue</div>
                </div>
              </div>
            </section>

            {/* Options de paiement */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                Options de paiement
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  {subscription.features?.paymentOptions?.mobileMoney ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <span className="font-medium">Mobile Money</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  {subscription.features?.paymentOptions?.cardPayment ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <span className="font-medium">Paiement carte</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  {subscription.features?.paymentOptions?.manualPayment ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <span className="font-medium">Paiement manuel</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  {subscription.features?.paymentOptions?.customPayment ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <span className="font-medium">Paiement personnalisé</span>
                </div>
              </div>
            </section>

            {/* Marketing et visibilité */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                Marketing et visibilité
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="font-medium">Email Marketing</span>
                    {subscription.features?.marketing?.emailMarketing ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="font-medium">Récupération panier abandonné</span>
                    {subscription.features?.marketing?.abandonedCartRecovery ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Coupons actifs max</span>
                      <span className="text-lg font-bold text-teal-600">
                        {subscription.features?.marketing?.maxActiveCoupons || 0}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Visibilité marketplace</span>
                      <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium capitalize">
                        {subscription.features?.marketing?.marketplaceVisibility || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Support */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-teal-600" />
                Support et accompagnement
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <Clock className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{subscription.features?.support?.responseTime || 'N/A'}h</div>
                  <div className="text-sm text-gray-600">Temps de réponse</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <Star className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900 capitalize">{subscription.features?.support?.onboarding || 'Standard'}</div>
                  <div className="text-sm text-gray-600">Type d'onboarding</div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <PhoneCall className="w-6 h-6 text-teal-600 mb-2" />
                  <div className="font-medium text-gray-900 mb-1">Canaux de support</div>
                  <div className="space-y-1">
                    {(subscription.features?.support?.channels || []).map((channel, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600 capitalize">{channel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                Actions rapides
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <select
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-teal-300 text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
                  value={subscription.status}
                  onChange={(e) => onStatusChange(subscription._id, e.target.value)}
                  disabled={isLoading === 'status'}
                >
                  <option value="active">Actif</option>
                  <option value="suspended">Suspendu</option>
                  <option value="expired">Expiré</option>
                </select>
                
                <button 
                  onClick={() => onSendReminder(subscription._id)}
                  disabled={isLoading === 'reminder'}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isLoading === 'reminder' ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Envoyer rappel
                </button>
                
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <CreditCard className="w-4 h-4" />
                  Historique paiements
                </button>
                
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  Statistiques
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;