import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  DollarSign,
  Settings,
  Eye,
  Filter
} from 'lucide-react';

const AdminSeller = () => {
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    expiringSoon: 0,
    monthlyRevenue: 0,
    planDistribution: {},
    recentActivity: []
  });
  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
  const baseURL = process.env.REACT_APP_Backend_Url;

  const [timeFilter, setTimeFilter] = useState('30');

  useEffect(() => {
    fetchDashboardStats();
  }, [timeFilter]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${baseURL}/api/adminSeller/dashboard-stats?days=${timeFilter}`,
        {
          headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
        }
      );
      const data = await response.json();
      // console.log({data:data?.data});
      
      // Vérification de sécurité pour éviter undefined
      if (data?.data && typeof data.data === 'object') {
        setStats(prevStats => ({
          ...prevStats,
          ...data.data
        }));
      }
    } catch (error) {
      console.log({error});
      
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const planColors = {
    Starter: '#B2905F',
    Pro: '#30A08B',
    Business: '#B17236'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord administrateur</h1>
          <p className="text-gray-600 mt-2">Gérez les abonnements et surveillez la performance de la plateforme</p>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Période :</span>
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="365">Cette année</option>
            </select>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Abonnements actifs"
            value={stats?.activeSubscriptions || 0}
            icon={Users}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            title="Revenus mensuels"
            value={`${(stats?.monthlyRevenue || 0).toLocaleString()} FCFA`}
            icon={DollarSign}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Expirent bientôt"
            value={stats?.expiringSoon || 0}
            icon={AlertCircle}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <StatCard
            title="Croissance"
            value="+12.5%"
            icon={TrendingUp}
            color="text-teal-600"
            bgColor="bg-teal-50"
          />
        </div>

        {/* Graphiques et tableaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Distribution des plans */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Répartition par plan</h3>
            <div className="space-y-4">
              {stats?.planDistribution && Object.entries(stats.planDistribution)?.map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: planColors[plan] }}
                    />
                    <span className="font-medium">{plan}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{count}</span>
                    <span className="text-sm text-gray-500 ml-2">boutiques</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
            <div className="space-y-4">
              {stats?.recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="Gérer les abonnements"
              description="Voir et modifier les abonnements actifs"
              icon={CreditCard}
              link="/admin/subscriptions"
            />
            <QuickActionCard
              title="Configurer les plans"
              description="Modifier les prix et fonctionnalités"
              icon={Settings}
              link="/admin/plans"
            />
            <QuickActionCard
              title="Voir les rapports"
              description="Analyses détaillées et exports"
              icon={Eye}
              link="/admin/reports"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ title, description, icon: Icon, link }) => (
  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
    <Icon className="w-8 h-8 text-teal-600 mb-3" />
    <h4 className="font-semibold text-gray-900">{title}</h4>
    <p className="text-sm text-gray-600 mt-1">{description}</p>
  </div>
);

export default AdminSeller;