import React, { useState, useEffect, useCallback } from "react";
import {
  Leaf, TreePine, Trees, Zap, Users, Star, ShoppingBag,
  TrendingUp, Settings, ToggleLeft, ToggleRight, Search,
  RefreshCw, AlertTriangle, Download, Plus, Minus,
  ChevronDown, ChevronUp, Gift, Clock, GitBranch, Ban, CheckCircle2, Hourglass
} from "lucide-react";

const API = process.env.REACT_APP_Backend_Url;

const getAdmin = () => {
  try { return JSON.parse(localStorage.getItem("AdminEcomme")); } catch { return null; }
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getAdmin()?.token}`,
});

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color = "text-blue-600", bgColor = "bg-blue-50" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-black text-gray-800">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon size={18} className={color} />
        </div>
      </div>
    </div>
  );
}

// ─── Module toggle card ────────────────────────────────────────────────────────
function ModuleCard({ name, label, description, module, onToggle, onConfigChange }) {
  const [expanded, setExpanded] = useState(false);
  const isEnabled = module?.enabled ?? false;
  const config = module?.config ?? {};

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isEnabled ? "border-green-200" : "border-gray-100"}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isEnabled ? "bg-green-500" : "bg-gray-300"}`} />
          <div>
            <p className="font-semibold text-gray-800 text-sm">{label}</p>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={() => onToggle(name, !isEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isEnabled ? "bg-green-500" : "bg-gray-200"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isEnabled ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && Object.keys(config).length > 0 && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Configuration</p>
          <div className="space-y-2">
            {Object.entries(config).map(([key, val]) => {
              if (typeof val === "object") return null;
              return (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-40 text-xs text-gray-600 font-medium shrink-0">{key}</label>
                  <input
                    type={typeof val === "number" ? "number" : "text"}
                    defaultValue={val}
                    onBlur={(e) => {
                      const newVal = typeof val === "number" ? parseFloat(e.target.value) : e.target.value;
                      onConfigChange(name, key, newVal);
                    }}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function GamificationAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [walletSearch, setWalletSearch] = useState("");
  const [walletResult, setWalletResult] = useState(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustMsg, setAdjustMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Referral tab state
  const [refStats, setRefStats] = useState(null);
  const [refTopReferrers, setRefTopReferrers] = useState([]);
  const [refPending, setRefPending] = useState([]);
  const [refTree, setRefTree] = useState([]);
  const [refTreeUserId, setRefTreeUserId] = useState("");
  const [refLoading, setRefLoading] = useState(false);
  const [blacklistMsg, setBlacklistMsg] = useState(null);
  const [retryUserId, setRetryUserId] = useState("");
  const [retryOrderId, setRetryOrderId] = useState("");
  const [retryMsg, setRetryMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, statsRes, txRes] = await Promise.all([
        fetch(`${API}/api/gamification/admin/config`, { headers: authHeaders() }),
        fetch(`${API}/api/gamification/admin/stats`, { headers: authHeaders() }),
        fetch(`${API}/api/gamification/admin/transactions?limit=30`, { headers: authHeaders() }),
      ]);
      const [cfgData, statsData, txData] = await Promise.all([cfgRes.json(), statsRes.json(), txRes.json()]);
      if (cfgData.success) setConfig(cfgData.config);
      if (statsData.success) setStats(statsData.stats);
      if (txData.success) { setTransactions(txData.transactions); setTxTotal(txData.total); }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReferralStats = useCallback(async () => {
    setRefLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        fetch(`${API}/api/gamification/admin/referral/stats`, { headers: authHeaders() }),
        fetch(`${API}/api/gamification/admin/referral/pending`, { headers: authHeaders() }),
      ]);
      const [statsData, pendingData] = await Promise.all([statsRes.json(), pendingRes.json()]);
      if (statsData.success) { setRefStats(statsData.stats); setRefTopReferrers(statsData.topReferrers || []); }
      if (pendingData.success) setRefPending(pendingData.pending || []);
    } catch (e) { console.error(e); }
    finally { setRefLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (activeTab === "referral") loadReferralStats(); }, [activeTab, loadReferralStats]);

  const toggleSystem = async (enabled) => {
    setSaving(true);
    await fetch(`${API}/api/gamification/admin/config/toggle`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ enabled }),
    });
    setSaving(false);
    load();
  };

  const toggleModule = async (moduleName, enabled) => {
    await fetch(`${API}/api/gamification/admin/config/module/${moduleName}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ enabled }),
    });
    load();
  };

  const updateModuleConfig = async (moduleName, key, value) => {
    await fetch(`${API}/api/gamification/admin/config/module/${moduleName}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ config: { [key]: value } }),
    });
  };

  const searchWallet = async () => {
    if (!walletSearch.trim()) return;
    const res = await fetch(`${API}/api/gamification/admin/wallet/${walletSearch.trim()}`, { headers: authHeaders() });
    const data = await res.json();
    setWalletResult(data.success ? data.wallet : null);
  };

  const loadReferralTree = async () => {
    if (!refTreeUserId.trim()) return;
    setRefLoading(true);
    try {
      const res = await fetch(`${API}/api/gamification/admin/referral/tree/${refTreeUserId.trim()}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setRefTree(data.tree || []);
    } catch (e) { console.error(e); }
    finally { setRefLoading(false); }
  };

  const toggleBlacklist = async (userId, currentBlacklisted) => {
    await fetch(`${API}/api/gamification/admin/blacklist-referral`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ userId, blacklisted: !currentBlacklisted }),
    });
    setBlacklistMsg(!currentBlacklisted ? `Utilisateur ${userId.slice(-6)} blacklisté` : `Blacklist levée pour ${userId.slice(-6)}`);
    setTimeout(() => setBlacklistMsg(null), 3000);
    loadReferralStats();
  };

  const retryReferral = async () => {
    if (!retryUserId.trim() || !retryOrderId.trim()) return;
    const res = await fetch(`${API}/api/gamification/admin/referral/retry`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ userId: retryUserId.trim(), orderId: retryOrderId.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      const r = data.result;
      setRetryMsg(r.success ? `✅ Parrain +${r.parrainPoints} BP, Filleul +${r.filleulPoints} BP` : `⚠️ Ignoré: ${r.skipped || r.error}`);
    } else {
      setRetryMsg(`❌ Erreur: ${data.message}`);
    }
    setTimeout(() => setRetryMsg(null), 5000);
    loadReferralStats();
  };

  const exportCSV = () => {
    if (!transactions.length) return;
    const headers = ["Date", "UserId", "Type", "Delta (BP)", "Motif"];
    const rows = transactions.map((t) => [
      new Date(t.createdAt).toLocaleString("fr-FR"),
      t.userId,
      TRANSACTION_LABELS[t.type] || t.type,
      t.delta,
      t.reason || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_bp_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const adjustPoints = async () => {
    if (!walletSearch.trim() || !adjustDelta || !adjustReason) return;
    const res = await fetch(`${API}/api/gamification/admin/adjust`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ userId: walletSearch.trim(), delta: parseInt(adjustDelta), reason: adjustReason }),
    });
    const data = await res.json();
    setAdjustMsg(data.success ? "Ajustement effectué ✓" : data.message);
    if (data.success) { setAdjustDelta(""); setAdjustReason(""); searchWallet(); }
    setTimeout(() => setAdjustMsg(null), 3000);
  };

  const MODULES = [
    { name: "POINTS_PURCHASE", label: "Points Achat", description: "Points sur commandes livrées" },
    { name: "DAILY_CHECKIN", label: "Check-in Quotidien", description: "1 BP par jour, bonus série" },
    { name: "REVIEW_POINTS", label: "Avis Produits", description: "Points pour avis texte/photo" },
    { name: "FIRST_ORDER_BONUS", label: "Bonus Première Commande", description: "50 BP à la 1ère commande" },
    { name: "EVENT_POINTS", label: "Événements Spéciaux", description: "Multiplicateurs ponctuels" },
    { name: "REFERRAL", label: "Parrainage", description: "Récompenses parrain + filleul" },
    { name: "REFERRAL_ANTIABUSE", label: "Anti-abus Parrainage", description: "Détection fraude parrainage" },
    { name: "LEVELS", label: "Niveaux Baobab", description: "Graine → Arbre → Grand Baobab" },
  ];

  const TRANSACTION_LABELS = {
    PURCHASE: "Achat", CHECKIN: "Check-in", CHECKIN_STREAK: "Bonus série",
    REVIEW: "Avis", FIRST_ORDER: "1ère commande", EVENT: "Événement",
    REFERRAL_PARRAIN: "Parrainage (parrain)", REFERRAL_FILLEUL: "Parrainage (filleul)",
    REDEMPTION: "Utilisation", EXPIRY: "Expiration",
    ADMIN_CREDIT: "Crédit admin", ADMIN_DEBIT: "Débit admin", CANCELLATION: "Annulation",
    REFUND: "Restitution commande annulée",
  };

  // ── Events state ──
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventForm, setEventForm] = useState({ name: "", description: "", multiplier: 2, startDate: "", endDate: "", applicableTypes: [], isActive: true });
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventMsg, setEventMsg] = useState(null);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await fetch(`${API}/api/gamification/admin/events`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } catch (e) { console.error(e); }
    finally { setEventsLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === "events") loadEvents(); }, [activeTab, loadEvents]);

  const saveEvent = async () => {
    try {
      const isEdit = !!editingEvent;
      const url = isEdit ? `${API}/api/gamification/admin/events/${editingEvent._id}` : `${API}/api/gamification/admin/events`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(eventForm) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setEventMsg(isEdit ? "Événement mis à jour ✓" : "Événement créé ✓");
      setEventFormOpen(false);
      setEditingEvent(null);
      setEventForm({ name: "", description: "", multiplier: 2, startDate: "", endDate: "", applicableTypes: [], isActive: true });
      loadEvents();
    } catch (e) { setEventMsg(`Erreur: ${e.message}`); }
    setTimeout(() => setEventMsg(null), 3000);
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Supprimer cet événement ?")) return;
    const res = await fetch(`${API}/api/gamification/admin/events/${id}`, { method: "DELETE", headers: authHeaders() });
    const data = await res.json();
    if (data.success) { setEventMsg("Événement supprimé"); loadEvents(); }
    setTimeout(() => setEventMsg(null), 3000);
  };

  const toggleEventActive = async (evt) => {
    await fetch(`${API}/api/gamification/admin/events/${evt._id}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ isActive: !evt.isActive }),
    });
    loadEvents();
  };

  const startEditEvent = (evt) => {
    setEditingEvent(evt);
    setEventForm({
      name: evt.name,
      description: evt.description || "",
      multiplier: evt.multiplier,
      startDate: evt.startDate ? evt.startDate.slice(0, 16) : "",
      endDate: evt.endDate ? evt.endDate.slice(0, 16) : "",
      applicableTypes: evt.applicableTypes || [],
      isActive: evt.isActive,
    });
    setEventFormOpen(true);
  };

  const TYPE_OPTIONS = [
    { value: "PURCHASE", label: "Achats" },
    { value: "CHECKIN", label: "Check-in" },
    { value: "REVIEW", label: "Avis" },
    { value: "FIRST_ORDER", label: "1ère commande" },
  ];

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "modules", label: "Modules", icon: Settings },
    { id: "wallets", label: "Wallets", icon: Gift },
    { id: "transactions", label: "Transactions", icon: Clock },
    { id: "events", label: "Événements", icon: Zap },
    { id: "referral", label: "Parrainage", icon: GitBranch },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Trees size={24} className="text-[#30A08B]" /> Baobab Points
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Système de fidélité & gamification</p>
        </div>
        <div className="flex items-center gap-3">
          {config && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Système</span>
              <button
                onClick={() => toggleSystem(!config.enabled)}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.enabled ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.enabled ? "translate-x-6" : ""}`} />
              </button>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {config.enabled ? "Actif" : "Inactif"}
              </span>
            </div>
          )}
          <button onClick={load} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1.5 mb-6 w-fit shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === id ? "bg-[#30A08B] text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Dashboard tab ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="BP distribués" value={stats.totalPointsDistributed?.toLocaleString("fr-FR")} sub={`Coût: ${(stats.costFcfa || 0).toLocaleString("fr-FR")} FCFA`} icon={TrendingUp} color="text-green-600" bgColor="bg-green-50" />
                <StatCard label="BP utilisés" value={stats.totalPointsRedeemed?.toLocaleString("fr-FR")} sub={`Économies: ${(stats.savingsGrantedFcfa || 0).toLocaleString("fr-FR")} FCFA`} icon={ShoppingBag} color="text-orange-500" bgColor="bg-orange-50" />
                <StatCard label="BP en circulation" value={stats.pointsInCirculation?.toLocaleString("fr-FR")} sub={`Valeur: ${(stats.potentialLiabilityFcfa || 0).toLocaleString("fr-FR")} FCFA`} icon={Zap} color="text-blue-600" bgColor="bg-blue-50" />
                <StatCard label="Wallets actifs" value={stats.activeWallets?.toLocaleString("fr-FR")} icon={Users} color="text-purple-600" bgColor="bg-purple-50" />
              </div>

              {/* Top referrers */}
              {stats.topReferrers?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                    <Users size={15} className="text-[#30A08B]" />
                    <h3 className="font-bold text-gray-800">Top Parrains du mois</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {stats.topReferrers.map((r, i) => (
                      <div key={r.userId} className="flex items-center gap-3 px-5 py-3">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white ${i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-400" : "bg-orange-300"}`}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono text-gray-600 truncate">{r.userId}</div>
                          <div className="text-xs text-gray-400">Code: {r.referralCode}</div>
                        </div>
                        <div className="text-sm font-black text-[#30A08B]">{r.totalValidatedReferrals} parrainages</div>
                        <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.level === "Grand Baobab" ? "bg-amber-100 text-amber-700" : r.level === "Arbre" ? "bg-teal-100 text-teal-700" : "bg-green-100 text-green-700"}`}>{r.level}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ── Modules tab ── */}
      {activeTab === "modules" && (
        <div className="space-y-4">
          {/* Redemption settings */}
          {config?.redemption && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Settings size={15} className="text-[#30A08B]" /> Paramètres de remboursement</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: "maxPercentPerOrder", label: "Max % par commande", suffix: "%" },
                  { key: "maxPercentReferralPoints", label: "Max % points parrainage", suffix: "%" },
                  { key: "pointsToFcfaRate", label: "Taux FCFA/BP", suffix: "FCFA" },
                ].map(({ key, label, suffix }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={config.redemption[key]}
                        onBlur={async (e) => {
                          await fetch(`${API}/api/gamification/admin/config/redemption`, {
                            method: "PATCH", headers: authHeaders(),
                            body: JSON.stringify({ [key]: parseFloat(e.target.value) }),
                          });
                        }}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30"
                      />
                      <span className="text-xs text-gray-400 shrink-0">{suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODULES.map(({ name, label, description }) => (
              <ModuleCard
                key={name}
                name={name}
                label={label}
                description={description}
                module={config?.modules?.[name]}
                onToggle={toggleModule}
                onConfigChange={updateModuleConfig}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Wallets tab ── */}
      {activeTab === "wallets" && (
        <div className="space-y-5">
          {/* Search */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">Rechercher un wallet utilisateur</h3>
            <div className="flex gap-3 mb-4">
              <input
                value={walletSearch}
                onChange={(e) => setWalletSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchWallet()}
                placeholder="User ID..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30"
              />
              <button onClick={searchWallet} className="px-5 py-2.5 bg-[#30A08B] text-white rounded-xl text-sm font-semibold hover:bg-[#27897a] transition-colors flex items-center gap-2">
                <Search size={14} /> Rechercher
              </button>
            </div>

            {walletResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Solde", value: `${walletResult.balance} BP`, color: "text-green-600" },
                    { label: "Niveau", value: walletResult.level, color: "text-teal-600" },
                    { label: "Série", value: `${walletResult.checkinStreak} j`, color: "text-blue-600" },
                    { label: "Parrainages", value: walletResult.totalValidatedReferrals, color: "text-purple-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className={`text-xl font-black ${color}`}>{value}</div>
                      <div className="text-xs text-gray-500">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Manual adjustment */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Ajustement manuel</p>
                  <div className="flex gap-3 flex-wrap">
                    <input
                      type="number"
                      value={adjustDelta}
                      onChange={(e) => setAdjustDelta(e.target.value)}
                      placeholder="Delta BP (+/-)"
                      className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30"
                    />
                    <input
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Motif (obligatoire)"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30"
                    />
                    <button
                      onClick={adjustPoints}
                      disabled={!adjustDelta || !adjustReason}
                      className="px-4 py-2 bg-[#30A08B] text-white rounded-xl text-sm font-semibold hover:bg-[#27897a] disabled:opacity-40 transition-colors"
                    >
                      Appliquer
                    </button>
                  </div>
                  {adjustMsg && (
                    <p className={`text-xs mt-2 font-semibold ${adjustMsg.includes("✓") ? "text-green-600" : "text-red-500"}`}>
                      {adjustMsg}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Referral tab ── */}
      {activeTab === "referral" && (
        <div className="space-y-5">
          {blacklistMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl font-semibold">
              {blacklistMsg}
            </div>
          )}

          {/* KPI cards */}
          {refStats && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Parrains actifs" value={refStats.totalReferrers} icon={Users} color="text-teal-600" bgColor="bg-teal-50" />
              <StatCard label="Filleuls en attente" value={refStats.pendingFilleuls} icon={Hourglass} color="text-amber-500" bgColor="bg-amber-50" />
              <StatCard label="Blacklistés" value={refStats.blacklisted} icon={Ban} color="text-red-500" bgColor="bg-red-50" />
            </div>
          )}

          {/* Top referrers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Users size={15} className="text-[#30A08B]" />
              <h3 className="font-bold text-gray-800">Top Parrains</h3>
            </div>
            {refLoading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Chargement…</div>
            ) : refTopReferrers.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Aucun parrain pour l'instant</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {refTopReferrers.map((r, i) => (
                  <div key={r.userId} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white ${i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-400" : "bg-orange-300"}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-gray-600 truncate">{r.userId}</div>
                      <div className="text-xs text-gray-400">Code : <span className="font-bold text-[#30A08B]">{r.referralCode}</span></div>
                    </div>
                    <div className="text-sm font-black text-[#30A08B] shrink-0">{r.totalValidatedReferrals} validés</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${r.level === "Grand Baobab" ? "bg-amber-100 text-amber-700" : r.level === "Arbre" ? "bg-teal-100 text-teal-700" : "bg-green-100 text-green-700"}`}>{r.level}</div>
                    <button
                      onClick={() => toggleBlacklist(r.userId, r.referralBlacklisted)}
                      title={r.referralBlacklisted ? "Lever le blacklist" : "Blacklister"}
                      className={`p-1.5 rounded-lg transition-colors ${r.referralBlacklisted ? "bg-red-100 text-red-500 hover:bg-red-200" : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"}`}
                    >
                      <Ban size={13} />
                    </button>
                    <button
                      onClick={() => { setRefTreeUserId(r.userId); loadReferralTree(); }}
                      title="Voir l'arbre"
                      className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-teal-100 hover:text-teal-600 transition-colors"
                    >
                      <GitBranch size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referral tree lookup */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><GitBranch size={14} className="text-[#30A08B]" /> Arbre de parrainage</h3>
            <div className="flex gap-3 mb-4">
              <input
                value={refTreeUserId}
                onChange={(e) => setRefTreeUserId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadReferralTree()}
                placeholder="User ID du parrain..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30"
              />
              <button onClick={loadReferralTree} className="px-5 py-2.5 bg-[#30A08B] text-white rounded-xl text-sm font-semibold hover:bg-[#27897a] transition-colors flex items-center gap-2">
                <Search size={14} /> Voir
              </button>
            </div>
            {refTree.length > 0 && (
              <div className="divide-y divide-gray-50">
                {refTree.map((child) => (
                  <div key={child.userId} className="flex items-center gap-3 py-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${child.validated ? "bg-green-500" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-gray-600">{child.userId}</div>
                      <div className="text-xs text-gray-400">Code: {child.referralCode} · {new Date(child.createdAt).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${child.validated ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {child.validated ? "✓ Validé" : "En attente"}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {refTree.length === 0 && refTreeUserId && !refLoading && (
              <p className="text-sm text-gray-400 text-center py-4">Aucun filleul trouvé pour cet utilisateur</p>
            )}
          </div>

          {/* Pending referrals */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hourglass size={15} className="text-amber-500" />
                <h3 className="font-bold text-gray-800">Filleuls en attente de validation ({refPending.length})</h3>
              </div>
              <button onClick={loadReferralStats} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                <RefreshCw size={13} className={refLoading ? "animate-spin" : ""} />
              </button>
            </div>
            {refPending.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Aucun filleul en attente</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {refPending.map((w) => (
                  <div key={w.userId} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Hourglass size={14} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-gray-700 truncate">{w.userId}</div>
                      <div className="text-xs text-gray-400">Parrainé par : <span className="font-semibold text-gray-600">{w.referredBy}</span></div>
                      <div className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold shrink-0">
                      En attente
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual referral retry */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-orange-50 flex items-center gap-2">
              <RefreshCw size={15} className="text-orange-500" />
              <h3 className="font-bold text-gray-800">Relancer un parrainage manuellement</h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-500">Utilisez ceci si un filleul a déjà livré sa commande mais les points n'ont pas été crédités (ex: bug ou module désactivé à ce moment-là).</p>
              {retryMsg && (
                <div className={`p-2.5 rounded-xl text-sm font-semibold ${retryMsg.startsWith("❌") ? "bg-red-50 text-red-700" : retryMsg.startsWith("⚠️") ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                  {retryMsg}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">User ID du filleul</label>
                  <input
                    value={retryUserId}
                    onChange={(e) => setRetryUserId(e.target.value)}
                    placeholder="ObjectId du filleul..."
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Order ID (commande livrée)</label>
                  <input
                    value={retryOrderId}
                    onChange={(e) => setRetryOrderId(e.target.value)}
                    placeholder="ObjectId de la commande..."
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              <button
                onClick={retryReferral}
                disabled={!retryUserId.trim() || !retryOrderId.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                <RefreshCw size={14} /> Relancer le parrainage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transactions tab ── */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={15} className="text-[#30A08B]" /> Toutes les transactions ({txTotal})</h3>
            <button
              onClick={exportCSV}
              disabled={!transactions.length}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#30A08B] text-white rounded-xl text-xs font-semibold hover:bg-[#27897a] disabled:opacity-40 transition-colors"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.map((txn) => {
              const isCredit = txn.delta > 0;
              return (
                <div key={txn._id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-green-50" : "bg-red-50"}`}>
                    {isCredit ? <TrendingUp size={15} className="text-green-600" /> : <ShoppingBag size={15} className="text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800">{TRANSACTION_LABELS[txn.type] || txn.type}</div>
                    <div className="text-xs text-gray-400 font-mono truncate">{txn.userId}</div>
                    <div className="text-xs text-gray-400">{new Date(txn.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div className={`text-base font-black shrink-0 ${isCredit ? "text-green-600" : "text-red-500"}`}>
                    {isCredit ? "+" : ""}{txn.delta} BP
                  </div>
                </div>
              );
            })}
          </div>
          {transactions.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">Aucune transaction</div>
          )}
        </div>
      )}

      {/* ── Events tab ── */}
      {activeTab === "events" && (
        <div className="space-y-5">
          {eventMsg && (
            <div className={`p-3 rounded-xl text-sm font-semibold ${eventMsg.startsWith("Erreur") ? "bg-red-50 border border-red-200 text-red-600" : "bg-green-50 border border-green-200 text-green-700"}`}>
              {eventMsg}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> Événements Spéciaux</h2>
              <p className="text-xs text-gray-400 mt-0.5">Multipliez les BP sur une période donnée</p>
            </div>
            <button
              onClick={() => { setEditingEvent(null); setEventForm({ name: "", description: "", multiplier: 2, startDate: "", endDate: "", applicableTypes: [], isActive: true }); setEventFormOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#30A08B] text-white rounded-xl text-sm font-semibold hover:bg-[#27897a] transition-colors"
            >
              <Plus size={14} /> Nouvel événement
            </button>
          </div>

          {/* Form modal */}
          {eventFormOpen && (
            <div className="bg-white rounded-2xl border border-[#30A08B]/30 shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-gray-800">{editingEvent ? "Modifier l'événement" : "Créer un événement"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Nom *</label>
                  <input value={eventForm.name} onChange={e => setEventForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex : Double BP Week-end" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Multiplicateur *</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="10" step="0.5" value={eventForm.multiplier}
                      onChange={e => setEventForm(f => ({ ...f, multiplier: parseFloat(e.target.value) }))}
                      className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30" />
                    <span className="text-sm text-gray-500">× les BP normaux</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Début *</label>
                  <input type="datetime-local" value={eventForm.startDate} onChange={e => setEventForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Fin *</label>
                  <input type="datetime-local" value={eventForm.endDate} onChange={e => setEventForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                  <input value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description visible aux utilisateurs (optionnel)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#30A08B]/30" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-2">Types concernés <span className="font-normal text-gray-400">(vide = tous)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_OPTIONS.map(({ value, label }) => {
                      const checked = eventForm.applicableTypes.includes(value);
                      return (
                        <button key={value} type="button"
                          onClick={() => setEventForm(f => ({
                            ...f,
                            applicableTypes: checked ? f.applicableTypes.filter(t => t !== value) : [...f.applicableTypes, value]
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${checked ? "bg-[#30A08B] text-white border-[#30A08B]" : "bg-white text-gray-600 border-gray-200 hover:border-[#30A08B]"}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveEvent} disabled={!eventForm.name || !eventForm.startDate || !eventForm.endDate}
                  className="px-5 py-2 bg-[#30A08B] text-white rounded-xl text-sm font-semibold hover:bg-[#27897a] disabled:opacity-40 transition-colors">
                  {editingEvent ? "Enregistrer" : "Créer"}
                </button>
                <button onClick={() => { setEventFormOpen(false); setEditingEvent(null); }}
                  className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Events list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {eventsLoading ? (
              <div className="py-10 text-center text-gray-400 text-sm animate-pulse">Chargement…</div>
            ) : events.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Aucun événement créé</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {events.map((evt) => {
                  const now = new Date();
                  const start = new Date(evt.startDate);
                  const end = new Date(evt.endDate);
                  const isRunning = evt.isActive && now >= start && now <= end;
                  const isPlanned = evt.isActive && now < start;
                  const isExpired = now > end;
                  const statusLabel = isRunning ? "En cours" : isPlanned ? "Planifié" : isExpired ? "Expiré" : "Inactif";
                  const statusCls = isRunning ? "bg-green-100 text-green-700" : isPlanned ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500";
                  return (
                    <div key={evt._id} className="flex items-center gap-4 px-5 py-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isRunning ? "bg-amber-50" : "bg-gray-50"}`}>
                        <Zap size={18} className={isRunning ? "text-amber-500" : "text-gray-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 text-sm">{evt.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusCls}`}>{statusLabel}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-black">×{evt.multiplier} BP</span>
                        </div>
                        {evt.description && <p className="text-xs text-gray-400 mt-0.5">{evt.description}</p>}
                        <div className="text-xs text-gray-400 mt-0.5">
                          {start.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} → {end.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {evt.applicableTypes?.length > 0 && <span className="ml-2 text-gray-300">· {evt.applicableTypes.map(t => TYPE_OPTIONS.find(o => o.value === t)?.label || t).join(", ")}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleEventActive(evt)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${evt.isActive ? "bg-green-500" : "bg-gray-200"}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${evt.isActive ? "translate-x-5" : ""}`} />
                        </button>
                        <button onClick={() => startEditEvent(evt)} className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                          <Settings size={13} />
                        </button>
                        <button onClick={() => deleteEvent(evt._id)} className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors">
                          <Minus size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
