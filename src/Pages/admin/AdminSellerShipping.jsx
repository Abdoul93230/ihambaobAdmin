import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Truck, Search, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Copy, ChevronDown, ChevronUp, MapPin, CheckCircle, XCircle,
  Star, Package, Calculator, X, Save, Loader2, Store,
} from "lucide-react";
import { adminShippingApi } from "@/services/api";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);

// ── Sélecteur de seller ────────────────────────────────────────────────────────
function SellerSelector({ onSelect, selected }) {
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BackendUrl}/getSellers`)
      .then((r) => setSellers(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sellers.filter((s) =>
    (s.name || s.storeName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Store className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-gray-800">Sélectionner un vendeur</h2>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-1">
          {filtered.map((s) => (
            <button
              key={s._id}
              onClick={() => onSelect(s)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                selected?._id === s._id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                selected?._id === s._id ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
              }`}>
                {(s.name || s.storeName || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{s.name || s.storeName || s._id}</p>
                {s.email && (
                  <p className={`text-xs truncate ${selected?._id === s._id ? "text-blue-100" : "text-gray-400"}`}>
                    {s.email}
                  </p>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">Aucun vendeur trouvé</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Formulaire de politique ───────────────────────────────────────────────────
function PolicyForm({ sellerId, policy, onSave, onCancel }) {
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zoneSearch, setZoneSearch] = useState("");
  const [form, setForm] = useState({
    zoneId: policy?.zoneId?._id || "",
    fixedCost: policy?.fixedCost ?? 0,
    costPerKg: policy?.costPerKg ?? 0,
    isDefault: policy?.isDefault ?? false,
    isActive: policy?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const fetchZones = useCallback(async (q) => {
    setZonesLoading(true);
    try {
      const r = await adminShippingApi.getAvailableZones(sellerId, { search: q, limit: 40 });
      setZones(r.data || []);
    } catch {
      setZones([]);
    } finally {
      setZonesLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    if (!policy) fetchZones("");
  }, [policy, fetchZones]);

  useEffect(() => {
    const t = setTimeout(() => fetchZones(zoneSearch), 300);
    return () => clearTimeout(t);
  }, [zoneSearch, fetchZones]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!policy && !form.zoneId) { setErr("Veuillez sélectionner une zone"); return; }
    setSaving(true);
    try {
      if (policy) {
        await adminShippingApi.updatePolicy(sellerId, policy._id, {
          fixedCost: Number(form.fixedCost),
          costPerKg: Number(form.costPerKg),
          isDefault: form.isDefault,
          isActive: form.isActive,
        });
      } else {
        await adminShippingApi.setPolicy(sellerId, {
          zoneId: form.zoneId,
          fixedCost: Number(form.fixedCost),
          costPerKg: Number(form.costPerKg),
          isDefault: form.isDefault,
          isActive: form.isActive,
        });
      }
      onSave();
    } catch (e) {
      setErr(e.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const estimatedCost = Number(form.fixedCost) + Number(form.costPerKg) * 5;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            {policy ? "Modifier la politique" : "Nouvelle politique"}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!policy && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Zone *</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une zone..."
                  value={zoneSearch}
                  onChange={(e) => setZoneSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto">
                {zonesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                ) : zones.length === 0 ? (
                  <p className="text-center text-gray-400 py-4 text-xs">Aucune zone disponible</p>
                ) : (
                  zones.map((z) => (
                    <button
                      key={z._id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, zoneId: z._id }))}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                        form.zoneId === z._id ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{z.fullPath || z.name}</span>
                      <span className="ml-auto text-[10px] text-gray-400 shrink-0">{z.type}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Coût fixe (FCFA)</label>
              <input
                type="number"
                min={0}
                value={form.fixedCost}
                onChange={(e) => setForm((f) => ({ ...f, fixedCost: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Coût/kg (FCFA)</label>
              <input
                type="number"
                min={0}
                value={form.costPerKg}
                onChange={(e) => setForm((f) => ({ ...f, costPerKg: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>
          </div>

          {(Number(form.fixedCost) > 0 || Number(form.costPerKg) > 0) && (
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 shrink-0" />
              Estimation pour 5kg : <strong>{fmt(estimatedCost)} FCFA</strong>
            </div>
          )}

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Politique par défaut</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Panneau des politiques d'un seller ────────────────────────────────────────
function SellerPoliciesPanel({ seller }) {
  const [policies, setPolicies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editPolicy, setEditPolicy] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [polRes, statRes] = await Promise.all([
        adminShippingApi.getPolicies(seller._id, { includeInactive: true }),
        adminShippingApi.getStats(seller._id),
      ]);
      setPolicies(polRes.data?.zonePolicies || []);
      setStats(statRes.data);
    } catch {
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [seller._id]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (policy) => {
    try {
      await adminShippingApi.togglePolicy(seller._id, policy._id, !policy.isActive);
      load();
    } catch (e) {
      alert(e.message || "Erreur");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminShippingApi.deletePolicy(seller._id, deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (e) {
      alert(e.message || "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditPolicy(null);
    load();
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Livraison — {seller.name || seller.storeName}
            </h2>
            {seller.email && <p className="text-xs text-gray-400 mt-0.5">{seller.email}</p>}
          </div>
          <button
            onClick={() => { setEditPolicy(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nouvelle zone
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.totalPolicies, color: "bg-blue-50 text-blue-700" },
              { label: "Actives", value: stats.activePolicies, color: "bg-green-50 text-green-700" },
              { label: "Défaut", value: stats.hasDefaultPolicy ? "Oui" : "Non", color: stats.hasDefaultPolicy ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700" },
              { label: "Pays", value: stats.coverageByType?.country || 0, color: "bg-purple-50 text-purple-700" },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl px-3 py-2.5 text-center`}>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Policies list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune politique configurée</p>
            <p className="text-gray-400 text-sm mt-1">Ajoutez une zone de livraison pour ce vendeur</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {policies.map((p) => {
              const zoneName = p.zoneId?.fullPath || p.zoneId?.name || "Zone inconnue";
              const isOpen = expanded === p._id;
              return (
                <div key={p._id}>
                  <div className="flex items-center gap-3 px-5 py-4">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${p.isActive ? "bg-green-500" : "bg-gray-300"}`} />

                    {/* Zone info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800 truncate">{zoneName}</p>
                        {p.isDefault && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-full">
                            <Star className="w-2.5 h-2.5" /> Défaut
                          </span>
                        )}
                        {p.zoneId?.type && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">
                            {p.zoneId.type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmt(p.fixedCost)} FCFA fixe · {fmt(p.costPerKg)} FCFA/kg
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggle(p)}
                        title={p.isActive ? "Désactiver" : "Activer"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          p.isActive
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {p.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => { setEditPolicy(p); setShowForm(true); }}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpanded(isOpen ? null : p._id)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-4 bg-gray-50 grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Coût fixe</p>
                        <p className="font-semibold text-gray-800">{fmt(p.fixedCost)} FCFA</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Coût par kg</p>
                        <p className="font-semibold text-gray-800">{fmt(p.costPerKg)} FCFA</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Statut</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${p.isActive ? "text-green-700" : "text-gray-500"}`}>
                          {p.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Est. 5 kg</p>
                        <p className="font-semibold text-gray-800">{fmt(p.fixedCost + p.costPerKg * 5)} FCFA</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <PolicyForm
          sellerId={seller._id}
          policy={editPolicy}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditPolicy(null); }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-semibold text-gray-800 mb-2">Supprimer la politique</h3>
            <p className="text-sm text-gray-600 mb-5">
              Supprimer la politique pour <strong>{deleteTarget.zoneId?.fullPath || deleteTarget.zoneId?.name}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminSellerShipping() {
  const [selectedSeller, setSelectedSeller] = useState(null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          Gestion Expédition Vendeurs
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configurez les tarifs de livraison pour chaque vendeur
        </p>
      </div>

      <div className="flex gap-5 items-start">
        <div className="w-72 shrink-0">
          <SellerSelector onSelect={setSelectedSeller} selected={selectedSeller} />
        </div>

        {selectedSeller ? (
          <SellerPoliciesPanel seller={selectedSeller} key={selectedSeller._id} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <Truck className="w-14 h-14 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Sélectionnez un vendeur</p>
            <p className="text-gray-400 text-sm mt-1">
              Choisissez un vendeur dans la liste pour gérer ses zones de livraison
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
