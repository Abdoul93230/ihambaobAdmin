import React, { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Search, X, ShieldCheck, Power, Clock, MessageSquare, Package, ShoppingCart } from "lucide-react";
import { staffApi, errMsg, duration, timeShort } from "./staffApi";

const EMPTY = { name: "", email: "", password: "", phone: "", displayName: "", sellerIds: [], permissions: { messages: true, products: true, orders: true } };

function ManagerForm({ initial, sellers, onClose, onSaved }) {
  const editing = !!initial?.id;
  const [f, setF] = useState(() => (editing
    ? { ...EMPTY, ...initial, password: "", sellerIds: initial.sellers.map((s) => s.id) }
    : EMPTY));
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const filtered = useMemo(() => sellers.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())), [sellers, q]);
  const toggleSeller = (id) => set("sellerIds", f.sellerIds.includes(id) ? f.sellerIds.filter((x) => x !== id) : [...f.sellerIds, id]);

  const save = async () => {
    setSaving(true); setError("");
    try {
      const body = { name: f.name, phone: f.phone, displayName: f.displayName, sellerIds: f.sellerIds, permissions: f.permissions };
      const saved = editing
        ? await staffApi.updateManager(initial.id, { ...body, ...(f.password ? { password: f.password } : {}) })
        : await staffApi.createManager({ ...body, email: f.email, password: f.password });
      onSaved(saved, editing);
    } catch (e) {
      setError(errMsg(e, "Enregistrement impossible."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">{editing ? `Modifier ${initial.name}` : "Nouveau manager"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 overflow-y-auto grid md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-600">Nom complet
              <input value={f.name} onChange={(e) => set("name", e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs font-medium text-gray-600">E-mail de connexion
              <input value={f.email} disabled={editing} onChange={(e) => set("email", e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
            </label>
            <label className="block text-xs font-medium text-gray-600">{editing ? "Nouveau mot de passe (laisser vide pour garder)" : "Mot de passe"}
              <input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              <span className="text-[10px] text-gray-400">8 caractères min., majuscule, minuscule et chiffre</span>
            </label>
            <label className="block text-xs font-medium text-gray-600">Téléphone (interne)
              <input value={f.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs font-medium text-gray-600">Prénom de signature (optionnel)
              <input value={f.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="ex. Aïcha" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              <span className="text-[10px] text-gray-400">Le client verra « Aïcha · équipe [Boutique] ». Vide : la boutique seule.</span>
            </label>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Accès</p>
              {[["messages", "Messagerie clients", MessageSquare], ["products", "Modération des produits", Package], ["orders", "Commandes (lecture)", ShoppingCart]].map(([k, label, Icon]) => (
                <label key={k} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                  <input type="checkbox" checked={f.permissions[k] !== false} onChange={(e) => set("permissions", { ...f.permissions, [k]: e.target.checked })} />
                  <Icon className="w-3.5 h-3.5 text-gray-400" /> {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col min-h-[320px]">
            <p className="text-xs font-medium text-gray-600 mb-1.5">Boutiques gérées · {f.sellerIds.length}</p>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une boutique" className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg" />
            </div>
            <div className="flex-1 overflow-y-auto border rounded-lg divide-y max-h-80">
              {filtered.map((s) => (
                <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={f.sellerIds.includes(s.id)} onChange={() => toggleSeller(s.id)} />
                  {s.logo ? <img src={s.logo} alt="" className="w-6 h-6 rounded-full object-cover" /> : <span className="w-6 h-6 rounded-full bg-gray-100" />}
                  <span className="flex-1 truncate">{s.name}</span>
                  {!s.active ? <span className="text-[10px] text-gray-400">inactive</span> : null}
                </label>
              ))}
            </div>
          </div>
        </div>
        {error ? <p className="px-5 text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-3 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium">Annuler</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le manager"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Managers() {
  const [rows, setRows] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [stats, setStats] = useState([]);
  const [days, setDays] = useState(7);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    staffApi.managers().then(setRows).catch(() => setRows([]));
    staffApi.sellers().then(setSellers).catch(() => {});
  }, []);
  useEffect(() => { staffApi.stats(days).then(setStats).catch(() => {}); }, [days]);

  const statOf = (id) => stats.find((s) => s.managerId === id);
  const unmanaged = sellers.filter((s) => s.active && !(rows || []).some((m) => m.isActive && m.sellers.some((x) => x.id === s.id)));
  const unassignedStat = stats.find((s) => !s.managerId);

  const onSaved = (m, wasEditing) => {
    setRows((x) => (wasEditing ? x.map((y) => (y.id === m.id ? m : y)) : [m, ...x]));
    setEditing(null);
  };
  const toggleActive = async (m) => {
    const u = await staffApi.updateManager(m.id, { isActive: !m.isActive });
    setRows((x) => x.map((y) => (y.id === m.id ? u : y)));
  };
  const remove = async (m) => {
    if (!window.confirm(`Supprimer définitivement ${m.name} ? Ses conversations repasseront « sans responsable ».`)) return;
    await staffApi.deleteManager(m.id);
    setRows((x) => x.filter((y) => y.id !== m.id));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Managers</h1>
          <p className="text-sm text-gray-500">L'équipe qui répond aux clients au nom des boutiques et modère leurs produits.</p>
        </div>
        <button onClick={() => setEditing({})} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
          <Plus className="w-4 h-4" /> Nouveau manager
        </button>
      </div>

      {unmanaged.length ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <strong>{unmanaged.length} boutique{unmanaged.length > 1 ? "s" : ""} sans manager</strong> — leurs messages arrivent « sans responsable » chez les admins :{" "}
          {unmanaged.slice(0, 6).map((s) => s.name).join(", ")}{unmanaged.length > 6 ? "…" : ""}
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Performance sur</span>
        {[1, 7, 30].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`px-2.5 py-1 rounded-full text-xs font-medium ${days === d ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>
            {d === 1 ? "24 h" : `${d} jours`}
          </button>
        ))}
        {unassignedStat ? <span className="text-xs text-orange-600 ml-2">{unassignedStat.conversations} conversation(s) sans responsable</span> : null}
      </div>

      {rows === null ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border p-10 text-center">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-800">Aucun manager pour l'instant</p>
          <p className="text-sm text-gray-500 mt-1">Créez un manager, affectez-lui des boutiques : il se connecte avec son e-mail sur cette même page de connexion.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((m) => {
            const s = statOf(m.id);
            return (
              <div key={m.id} className={`bg-white rounded-2xl border p-4 ${m.isActive ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{m.name} {!m.isActive ? <span className="text-xs text-red-500 font-normal">· désactivé</span> : null}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    {m.displayName ? <p className="text-[11px] text-teal-700">Signe « {m.displayName} »</p> : null}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button title="Modifier" onClick={() => setEditing(m)} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil className="w-4 h-4 text-gray-500" /></button>
                    <button title={m.isActive ? "Désactiver" : "Réactiver"} onClick={() => toggleActive(m)} className="p-1.5 rounded-lg hover:bg-gray-100"><Power className={`w-4 h-4 ${m.isActive ? "text-gray-500" : "text-green-600"}`} /></button>
                    <button title="Supprimer" onClick={() => remove(m)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {m.sellers.length ? m.sellers.slice(0, 6).map((x) => <span key={x.id} className="text-[11px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full">{x.name}</span>) : <span className="text-xs text-orange-600">Aucune boutique</span>}
                  {m.sellers.length > 6 ? <span className="text-[11px] text-gray-500">+{m.sellers.length - 6}</span> : null}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="rounded-lg bg-gray-50 py-2"><p className="text-base font-bold text-gray-900">{s?.conversations || 0}</p><p className="text-[10px] text-gray-500">conversations</p></div>
                  <div className="rounded-lg bg-gray-50 py-2"><p className="text-base font-bold text-gray-900">{duration(s?.avgFirstResponseMs)}</p><p className="text-[10px] text-gray-500">1re réponse moy.</p></div>
                  <div className={`rounded-lg py-2 ${s?.open ? "bg-orange-50" : "bg-gray-50"}`}><p className="text-base font-bold text-gray-900">{s?.open || 0}</p><p className="text-[10px] text-gray-500">à répondre</p></div>
                </div>
                <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-3"><Clock className="w-3 h-3" /> Dernière activité : {m.lastSeenAt ? timeShort(m.lastSeenAt) : "jamais"}</p>
              </div>
            );
          })}
        </div>
      )}

      {editing ? <ManagerForm initial={editing} sellers={sellers} onClose={() => setEditing(null)} onSaved={onSaved} /> : null}
    </div>
  );
}
