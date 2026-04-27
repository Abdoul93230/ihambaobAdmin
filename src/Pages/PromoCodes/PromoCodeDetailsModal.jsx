import React from 'react';
import { X, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PromoCodeDetailsModal({ show, onClose, data, loading }) {
  if (!show) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' })
      .format(val || 0)
      .replace('F CFA', 'CFA');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-white border-b flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              Détails du Code Promo : 
              {loading ? (
                <span className="ml-3 h-6 w-32 bg-gray-200 animate-pulse rounded"></span>
              ) : (
                <span className="ml-3 text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 uppercase tracking-wider">
                  {data?.code}
                </span>
              )}
            </h2>
            {!loading && data && (
              <p className="text-sm text-gray-500 mt-1">
                {data.description || "Aucune description"} 
                <span className="mx-2">•</span> 
                Valeur: <span className="font-semibold text-gray-700">{data.type === 'percentage' ? `${data.value}%` : `${data.value} CFA`}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Chargement des analyses...</p>
            </div>
          ) : !data ? (
            <div className="text-center text-gray-500 my-12">Aucune donnée disponible.</div>
          ) : (
            <div className="space-y-6">
              
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Utilisations</p>
                    <p className="text-2xl font-bold text-gray-800">{data.stats.totalUses}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4"><Users className="w-6 h-6 text-purple-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Clients Uniques</p>
                    <p className="text-2xl font-bold text-gray-800">{data.stats.uniqueUsersCount}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center">
                  <div className="bg-red-100 p-3 rounded-lg mr-4"><DollarSign className="w-6 h-6 text-red-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Réductions Accordées</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(data.stats.totalDiscountGiven)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center">
                  <div className="bg-emerald-100 p-3 rounded-lg mr-4"><Activity className="w-6 h-6 text-emerald-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">C.A. Associé</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(data.stats.totalRevenueGenerated)}</p>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Évolution des utilisations</h3>
                {data.stats.chartData && data.stats.chartData.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{fontSize: 12}} minTickGap={20} />
                        <YAxis tick={{fontSize: 12}} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value, name) => [value, name === 'count' ? 'Utilisations' : name]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area type="monotone" dataKey="count" stroke="#2563eb" fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                    Aucune donnée d'utilisation suffisante pour générer un graphique.
                  </div>
                )}
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">Historique d'Utilisation Exhaustif</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 border-b">
                        <th className="p-4 font-semibold">Date & Heure</th>
                        <th className="p-4 font-semibold">Utilisateur</th>
                        <th className="p-4 font-semibold">Commande Réf.</th>
                        <th className="p-4 font-semibold text-right">Montant Initial</th>
                        <th className="p-4 font-semibold text-right text-red-500">Réduction</th>
                        <th className="p-4 font-semibold text-right text-green-600">Payé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!data.usageHistory || data.usageHistory.length === 0) ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-500">Aucun historique d'utilisation pour le moment.</td>
                        </tr>
                      ) : (
                        data.usageHistory.map((usage, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-4 whitespace-nowrap text-gray-600">{formatDate(usage.usedAt)}</td>
                            <td className="p-4">
                              {usage.user ? (
                                <div>
                                  <p className="font-medium text-gray-800">{usage.user.name}</p>
                                  <p className="text-xs text-gray-500">{usage.user.email || usage.user.phone || 'N/A'}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs italic">Utilisateur inconnu ou supprimé</span>
                              )}
                            </td>
                            <td className="p-4">
                              {usage.order ? (
                                <div>
                                  <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
                                    {usage.order.reference || 'REF-???'}
                                  </span>
                                  <div className="text-[10px] uppercase mt-1 tracking-wider text-blue-600">
                                    {usage.order.status}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs italic">Commande introuvable</span>
                              )}
                            </td>
                            <td className="p-4 text-right text-gray-500">{formatCurrency(usage.orderAmount + (usage.discountAmount || 0))}</td>
                            <td className="p-4 text-right text-red-500 font-medium">-{formatCurrency(usage.discountAmount)}</td>
                            <td className="p-4 text-right text-green-700 font-bold">{formatCurrency(usage.orderAmount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
