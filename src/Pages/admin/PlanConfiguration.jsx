import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Edit3,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  Settings,
  TrendingUp
} from 'lucide-react';

const PlanConfiguration = () => {
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
  const baseURL = process.env.REACT_APP_Backend_Url;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${baseURL}/api/adminSeller/plan-templates`, {
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Erreur lors du chargement des plans:', error);
    }
  };

  const savePlan = async (planData) => {
    setSaving(true);
    try {
      const method = editingPlan ? 'PUT' : 'POST';
      const url = editingPlan
        ? `${baseURL}/api/adminSeller/plan-templates/${editingPlan.id}`
        : `${baseURL}/api/adminSeller/plan-templates`;

      await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });

      fetchPlans();
      setEditingPlan(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (planId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) return;

    
    try {
      await fetch(`${baseURL}/api/adminSeller/plan-templates/${planId}`, { method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${admin.token}`,
          'Content-Type': 'application/json'
        }
      });
      fetchPlans();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const duplicatePlan = (plan) => {
    const newPlan = { 
      ...plan, 
      name: `${plan.name} (Copie)`,
      id: undefined 
    };
    setEditingPlan(newPlan);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuration des plans</h1>
            <p className="text-gray-600 mt-2">Gérez les plans d'abonnement et leurs fonctionnalités</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" />
            Nouveau plan
          </button>
        </div>

        {/* Liste des plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={setEditingPlan}
              onDelete={deletePlan}
              onDuplicate={duplicatePlan}
            />
          ))}
        </div>

        {/* Formulaire d'édition/création */}
        {(editingPlan || showCreateForm) && (
          <PlanForm
            plan={editingPlan}
            onSave={savePlan}
            onCancel={() => {
              setEditingPlan(null);
              setShowCreateForm(false);
            }}
            saving={saving}
          />
        )}

        {/* Statistiques d'utilisation */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Statistiques d'utilisation des plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{plan.subscriberCount || 0}</div>
                <div className="text-sm text-gray-600">Abonnés {plan.name}</div>
                <div className="text-xs text-teal-600 mt-1">
                  {((plan.subscriberCount || 0) / plans.reduce((acc, p) => acc + (p.subscriberCount || 0), 0) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlanCard = ({ plan, onEdit, onDelete, onDuplicate }) => {
  const getPlanIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'starter': return Users;
      case 'pro': return TrendingUp;
      case 'business': return Settings;
      default: return DollarSign;
    }
  };

  const Icon = getPlanIcon(plan.name);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-semibold">{plan.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(plan)}
              className="p-1 text-gray-400 hover:text-teal-600"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicate(plan)}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(plan.id)}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Prix mensuel</span>
            <span className="font-semibold">{plan.price?.monthly?.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Prix annuel</span>
            <span className="font-semibold">{plan.price?.annual?.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Commission</span>
            <span className="font-semibold">{plan.commission}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Limite produits</span>
            <span className="font-semibold">
              {plan.productLimit === -1 ? 'Illimité' : plan.productLimit}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-700">Fonctionnalités clés :</span>
          </div>
          <div className="space-y-1">
            {plan.features?.paymentOptions?.mobileMoney && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Mobile Money
              </div>
            )}
            {plan.features?.paymentOptions?.cardPayment && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Paiement par carte
              </div>
            )}
            {plan.features?.marketing?.emailMarketing && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Email marketing
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Abonnés actifs</span>
          <span className="font-medium">{plan.subscriberCount || 0}</span>
        </div>
      </div>
    </div>
  );
};

const PlanForm = ({ plan, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState(
    plan || {
      name: '',
      description: '',
      price: { monthly: 0, annual: 0 },
      commission: 0,
      productLimit: 10,
      features: {
        productManagement: {
          maxProducts: 10,
          maxVariants: 3,
          maxCategories: 5,
          catalogImport: false
        },
        paymentOptions: {
          manualPayment: true,
          mobileMoney: true,
          cardPayment: false,
          customPayment: false
        },
        support: {
          responseTime: 48,
          channels: ['email'],
          onboarding: 'standard'
        },
        marketing: {
          marketplaceVisibility: 'standard',
          maxActiveCoupons: 1,
          emailMarketing: false,
          abandonedCartRecovery: false
        }
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateFeature = (category, feature, value) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [category]: {
          ...formData.features[category],
          [feature]: value
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">
            {plan ? 'Modifier le plan' : 'Créer un nouveau plan'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du plan
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Prix et commission */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix mensuel (FCFA)
              </label>
              <input
                type="number"
                value={formData.price.monthly}
                onChange={(e) => setFormData({
                  ...formData,
                  price: { ...formData.price, monthly: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix annuel (FCFA)
              </label>
              <input
                type="number"
                value={formData.price.annual}
                onChange={(e) => setFormData({
                  ...formData,
                  price: { ...formData.price, annual: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission (%)
              </label>
              <input
                type="number"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Fonctionnalités</h4>
            
            {/* Gestion des produits */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Gestion des produits</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Produits maximum</label>
                  <input
                    type="number"
                    value={formData.features.productManagement.maxProducts}
                    onChange={(e) => updateFeature('productManagement', 'maxProducts', parseInt(e.target.value))}
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                    min="-1"
                  />
                  <span className="text-xs text-gray-500">-1 pour illimité</span>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Variantes maximum</label>
                  <input
                    type="number"
                    value={formData.features.productManagement.maxVariants}
                    onChange={(e) => updateFeature('productManagement', 'maxVariants', parseInt(e.target.value))}
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                    min="-1"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.features.productManagement.catalogImport}
                    onChange={(e) => updateFeature('productManagement', 'catalogImport', e.target.checked)}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Import de catalogue</label>
                </div>
              </div>
            </div>

            {/* Options de paiement */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Options de paiement</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(formData.features.paymentOptions).map(([key, value]) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateFeature('paymentOptions', key, e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketing */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Marketing</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Visibilité marketplace</label>
                  <select
                    value={formData.features.marketing.marketplaceVisibility}
                    onChange={(e) => updateFeature('marketing', 'marketplaceVisibility', e.target.value)}
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="prioritaire">Prioritaire</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Coupons actifs max</label>
                  <input
                    type="number"
                    value={formData.features.marketing.maxActiveCoupons}
                    onChange={(e) => updateFeature('marketing', 'maxActiveCoupons', parseInt(e.target.value))}
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                    min="-1"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.features.marketing.emailMarketing}
                      onChange={(e) => updateFeature('marketing', 'emailMarketing', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Email marketing</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.features.marketing.abandonedCartRecovery}
                      onChange={(e) => updateFeature('marketing', 'abandonedCartRecovery', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Relance paniers</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanConfiguration;