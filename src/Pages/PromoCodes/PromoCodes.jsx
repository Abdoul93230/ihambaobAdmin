import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash, Check, X, Search, Ticket, Activity, Edit, Eye } from "lucide-react";
import { handleAlert, handleAlertwar } from "../../App";
import { useAuth } from "../../contexts/AuthContext";
import PromoCodeDetailsModal from "./PromoCodeDetailsModal";

const BackendUrl = process.env.REACT_APP_Backend_Url;

export default function PromoCodes() {
  const { user } = useAuth(); // Admin user
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ activeCodes: 0, totalCodes: 0, totalUsage: 0 });

  // Mode Edition
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Vue Detaillee
  const [showDetails, setShowDetails] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form State
  const initialFormState = {
    code: "",
    description: "",
    type: "percentage",
    value: "",
    maxDiscount: "",
    minOrderAmount: "",
    maxUsage: "",
    maxUsagePerUser: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("AdminEcomme"))?.token;
      
      const res = await axios.get(`${BackendUrl}/api/promocodes/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPromoCodes(res.data.data);
      
      const statsRes = await axios.get(`${BackendUrl}/api/promocodes/admin/stats/global`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data.data);
      
    } catch (err) {
      console.error(err);
      handleAlertwar("Erreur lors de la récupération des codes promo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenEditModal = (codeItem) => {
    setIsEditing(true);
    setEditingId(codeItem._id);
    setFormData({
      code: codeItem.code || "",
      description: codeItem.description || "",
      type: codeItem.type || "percentage",
      value: codeItem.value || "",
      maxDiscount: codeItem.maxDiscount || "",
      minOrderAmount: codeItem.minOrderAmount || "",
      maxUsage: codeItem.maxUsage || "",
      maxUsagePerUser: codeItem.maxUsagePerUser || "1",
      startDate: codeItem.startDate ? new Date(codeItem.startDate).toISOString().split("T")[0] : "",
      endDate: codeItem.endDate ? new Date(codeItem.endDate).toISOString().split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleOpenDetails = async (id) => {
    setShowDetails(true);
    setDetailsLoading(true);
    setDetailsData(null);
    try {
      const token = JSON.parse(localStorage.getItem("AdminEcomme"))?.token;
      const res = await axios.get(`${BackendUrl}/api/promocodes/admin/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetailsData(res.data.data);
    } catch (err) {
      console.error(err);
      handleAlertwar("Erreur lors de la récupération des détails statitiques.");
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.value || !formData.endDate) {
      handleAlertwar("Veuillez remplir le code, la valeur et la date de fin.");
      return;
    }

    setSubmitting(true);
    try {
      const token = JSON.parse(localStorage.getItem("AdminEcomme"))?.token;
      
      const payload = { ...formData };
      if (!payload.maxDiscount) delete payload.maxDiscount;
      if (!payload.minOrderAmount) delete payload.minOrderAmount;
      if (!payload.maxUsage) delete payload.maxUsage;
      
      if (isEditing) {
        // Mode Mise à jour
        await axios.put(`${BackendUrl}/api/promocodes/admin/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        handleAlert("Code promo mis à jour avec succès");
      } else {
        // Mode Création
        await axios.post(`${BackendUrl}/api/promocodes/admin`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        handleAlert("Code promo créé avec succès");
      }
      
      setShowModal(false);
      fetchPromoCodes();
      setFormData(initialFormState);
    } catch (err) {
      handleAlertwar(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const token = JSON.parse(localStorage.getItem("AdminEcomme"))?.token;
      await axios.patch(`${BackendUrl}/api/promocodes/admin/${id}/toggle`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleAlert(currentStatus ? "Code promo désactivé" : "Code promo réactivé avec succès");
      fetchPromoCodes();
    } catch (err) {
      handleAlertwar("Erreur lors du changement de statut");
    }
  };

  const deletePromoCode = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce code promo ? Cette action est irréversible et supprimera l'historique lié à ce code.")) return;
    try {
      const token = JSON.parse(localStorage.getItem("AdminEcomme"))?.token;
      await axios.delete(`${BackendUrl}/api/promocodes/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      handleAlert("Code promo supprimé avec succès !");
      fetchPromoCodes();
    } catch (err) {
      handleAlertwar("Erreur lors de la suppression");
    }
  };

  const filteredCodes = promoCodes.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Ticket className="w-8 h-8 mr-3 text-blue-600" />
            Gestion des Codes Promo
          </h1>
          <p className="text-gray-500 mt-1">Créez, modifiez et analysez vos campagnes promotionnelles</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Créer un Code Promo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center">
          <div className="bg-blue-100 p-3 rounded-lg mr-4">
            <Ticket className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total des codes</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalCodes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center">
          <div className="bg-green-100 p-3 rounded-lg mr-4">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Codes Actifs</p>
            <p className="text-2xl font-bold text-gray-800">{stats.activeCodes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center">
          <div className="bg-purple-100 p-3 rounded-lg mr-4">
            <Check className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Utilisations Toltales</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalUsage}</p>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="relative w-64 md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 min-w-5 h-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par code ou description..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="p-4 font-semibold">Code & Info</th>
                <th className="p-4 font-semibold">Réduction</th>
                <th className="p-4 font-semibold text-center">Utilisations</th>
                <th className="p-4 font-semibold">Validité</th>
                <th className="p-4 font-semibold text-center">Statut (Clic pour Modifier)</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                      Chargement des données...
                    </div>
                  </td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    Aucun code promo trouvé avec vos filtres.
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => {
                  const isExpired = new Date(code.endDate) < new Date();
                  
                  return (
                    <tr key={code._id} className={`border-b hover:bg-gray-50 transition-colors ${!code.isActive || isExpired ? 'bg-gray-50 opacity-70' : ''}`}>
                      <td className="p-4">
                        <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 tracking-wider">
                          {code.code}
                        </span>
                        {code.description && (
                          <div className="text-xs text-gray-500 mt-2 truncate w-48" title={code.description}>
                            {code.description}
                          </div>
                        )}
                        {code.metadata?.isWelcomeCode && (
                          <span className="inline-block mt-1 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                            Code de Bienvenue
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-700">
                        <span className="font-medium">
                          {code.type === "percentage" ? `${code.value}%` : `${code.value} CFA`}
                        </span>
                        {code.type === "percentage" && code.maxDiscount && (
                          <div className="text-xs text-gray-500 mt-1">
                            Plafond: {code.maxDiscount} CFA
                          </div>
                        )}
                        {code.minOrderAmount > 0 && (
                          <div className="text-xs text-blue-500 mt-0.5">
                            Min: {code.minOrderAmount} CFA
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex bg-gray-200 rounded-full h-2 w-24 overflow-hidden relative mx-auto mt-2">
                          <div 
                            className={`absolute top-0 left-0 h-full ${code.currentUsage >= code.maxUsage && code.maxUsage ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: code.maxUsage ? `${(code.currentUsage / code.maxUsage) * 100}%` : '50%' }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 mt-1 block">
                          {code.currentUsage} / {code.maxUsage ? code.maxUsage : "Illimité"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-700">
                          {new Date(code.startDate).toLocaleDateString()}
                        </div>
                        {code.endDate && (
                          <div className={`text-xs mt-1 font-medium ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                            au {new Date(code.endDate).toLocaleDateString()} {isExpired && "(Expiré)"}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleStatus(code._id, code.isActive)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-105 ${
                            code.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                          }`}
                        >
                          {code.isActive ? "🟢 En Ligne" : "⚫ Désactivé"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleOpenDetails(code._id)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                            title="Voir les détails et statistiques"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(code)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            title="Modifier ce code"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deletePromoCode(code._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Supprimer définitivement"
                          >
                            <Trash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création & Édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                {isEditing ? (
                  <><Edit className="w-6 h-6 mr-2 text-blue-600" /> Modifier le Code Promo</>
                ) : (
                  <><Ticket className="w-6 h-6 mr-2 text-blue-600" /> Nouveau Code Promo</>
                )}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code Promo *</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold text-lg tracking-wider bg-gray-50 focus:bg-white transition-colors"
                    placeholder="EX: ETE2026"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})}
                    disabled={isEditing} // Empêcher la modif du nom de code si voulu
                  />
                  {isEditing && <p className="text-xs text-gray-400 mt-1">Le texte du code ne peut pas être modifié une fois créé.</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Campagne soldes d'été sur tout le magasin"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de Réduction *</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value, maxDiscount: ""})}
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant Fixe (CFA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur de réduction *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700"
                    placeholder={formData.type === 'percentage' ? "Ex: 20" : "Ex: 5000"}
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                  />
                </div>

                {formData.type === 'percentage' && (
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <label className="block text-sm font-medium text-blue-800 mb-1">Plafond de réduction (CFA)</label>
                    <p className="text-xs text-blue-600 mb-2">Plafonne la réduction maximale (ex: -20% dans la limite de 10.000 CFA)</p>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Laisser vide pour ne pas plafonner"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Check className="w-5 h-5 mr-2 text-green-500" />
                  Conditions d'utilisation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant Min. de Commande (CFA)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0 = utilisable sans minimum d'achat"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quota Global</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nb max total (vide = illimité)"
                      value={formData.maxUsage}
                      onChange={(e) => setFormData({...formData, maxUsage: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quota / Client *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.maxUsagePerUser}
                      title="Combien de fois un MÊME client peut utiliser ce code ?"
                      onChange={(e) => setFormData({...formData, maxUsagePerUser: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-500" />
                  Période de Validité
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 flex justify-end space-x-4 sticky bottom-0 bg-white/95 pb-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none shadow-md flex items-center transition-colors ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {submitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Enregistrement...</>
                  ) : (
                    isEditing ? "Mettre à jour" : "Créer le Code"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale des détails statistiques */}
      <PromoCodeDetailsModal 
        show={showDetails} 
        onClose={() => setShowDetails(false)} 
        data={detailsData} 
        loading={detailsLoading} 
      />

    </div>
  );
}
