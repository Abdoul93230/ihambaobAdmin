import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { KeyRound, Plus, Power, Truck } from "lucide-react";

const BackendUrl = process.env.REACT_APP_Backend_Url;
const API = `${BackendUrl}/api/courier/admin/couriers`;
const SITE = process.env.REACT_APP_SITE_URL || "https://www.ihambaobab.com";

const when = (d) => (d ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "jamais");

/** Comptes livreurs : ils se connectent sur /livreur avec leur numéro et leur code à 4 chiffres */
export default function Livreurs() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", pin: "" });
  const [saving, setSaving] = useState(false);

  const load = () => axios.get(API).then((r) => setRows(r.data.data)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(API, form);
      toast.success(`Compte créé. Donnez à ${form.name} son numéro et le code ${form.pin}.`);
      setForm({ name: "", phone: "", pin: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Création impossible");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c) => {
    await axios.put(`${API}/${c.id}`, { isActive: !c.isActive }).catch(() => toast.error("Modification impossible"));
    load();
  };

  const resetPin = async (c) => {
    const pin = window.prompt(`Nouveau code à 4 chiffres pour ${c.name}`);
    if (!pin) return;
    try {
      await axios.put(`${API}/${c.id}`, { pin });
      toast.success(`Nouveau code de ${c.name} : ${pin}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Modification impossible");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Truck className="w-6 h-6 text-teal-600" /> Livreurs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Le livreur ouvre <a href={`${SITE}/livreur`} target="_blank" rel="noreferrer" className="text-teal-700 underline">{SITE.replace(/^https?:\/\//, "")}/livreur</a> sur son téléphone,
          se connecte avec son numéro et son code, puis saisit le code de la boutique au retrait et celui du client à la livraison.
        </p>
      </div>

      <form onSubmit={create} className="bg-white rounded-lg shadow p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">Nom</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Moussa Ali" required />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">Téléphone</span>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="+22790123456" required />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">Code (4 chiffres)</span>
          <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })} inputMode="numeric" className="w-full border rounded px-3 py-2 tracking-widest" placeholder="1234" required />
        </label>
        <button disabled={saving} className="h-10 rounded bg-teal-600 text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr><th className="px-4 py-2">Livreur</th><th className="px-4 py-2">Retraits</th><th className="px-4 py-2">Livraisons</th><th className="px-4 py-2">Dernière activité</th><th className="px-4 py-2" /></tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Chargement…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Aucun livreur pour l'instant.</td></tr>
            ) : rows.map((c) => (
              <tr key={c.id} className={`border-t ${c.isActive ? "" : "opacity-50"}`}>
                <td className="px-4 py-3"><p className="font-semibold text-gray-900">{c.name}</p><p className="text-xs text-gray-500">{c.phone}</p></td>
                <td className="px-4 py-3">{c.pickups}</td>
                <td className="px-4 py-3">{c.deliveries}</td>
                <td className="px-4 py-3 text-gray-600">{when(c.lastSeenAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => resetPin(c)} className="p-2 rounded hover:bg-gray-100" title="Nouveau code"><KeyRound className="w-4 h-4" /></button>
                    <button onClick={() => toggle(c)} className="p-2 rounded hover:bg-gray-100" title={c.isActive ? "Désactiver" : "Réactiver"}><Power className={`w-4 h-4 ${c.isActive ? "text-red-500" : "text-emerald-600"}`} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
