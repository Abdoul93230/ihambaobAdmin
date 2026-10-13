import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, Calculator, Check, Pencil, Search, Sparkles, Store, X } from "lucide-react";
import { shippingV3Api } from "@/services/api";
import TemplateEditor from "./TemplateEditor";
import { Btn, Card, Empty, Field, Modal, Pill, ZonePicker, errMsg, inputClass } from "./shared";

const ORIGIN_SOURCE = {
  configured: { tone: "green", label: "Défini" },
  inferred: { tone: "blue", label: "Déduit du profil" },
  "country-fallback": { tone: "red", label: "À préciser" },
};

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "todo", label: "Lieu à préciser" },
  { key: "inferred", label: "Lieu déduit" },
  { key: "custom", label: "Modèle spécifique" },
];

/** Panneau d'édition d'une boutique : lieu d'expédition + modèle */
function SellerDialog({ seller, zones, templates, onClose, onSaved, onCustomize, onSimulate }) {
  const [originZoneId, setOriginZoneId] = useState(seller.origin?.source === "configured" ? String(seller.origin.zoneId) : null);
  const [templateId, setTemplateId] = useState(seller.template?.inherited ? "" : String(seller.template?._id || ""));
  const [saving, setSaving] = useState(false);
  const choices = templates.filter((t) => t.isActive && (t.kind === "platform" || String(t.ownerSellerId) === String(seller._id)));
  const def = templates.find((t) => t.isDefault);

  const save = async () => {
    setSaving(true);
    try {
      await shippingV3Api.updateSeller(seller._id, { shippingOriginZoneId: originZoneId || null, shippingTemplateId: templateId || null });
      toast.success("Boutique mise à jour");
      onSaved();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={seller.storeName}
      subtitle={seller.profileLocation ? `Adresse déclarée : ${seller.profileLocation}` : "Aucune adresse déclarée dans le profil"}
      footer={(
        <>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn icon={Check} onClick={save} loading={saving}>Enregistrer</Btn>
        </>
      )}
    >
      <div className="space-y-4">
        <Field
          label="Lieu d’expédition (d’où partent les colis)"
          hint={originZoneId ? "Choisissez le niveau le plus précis possible : quartier si connu." : `Sans choix, le lieu est déduit du profil : ${seller.origin?.label || "inconnu"}.`}
        >
          <ZonePicker zones={zones} value={originZoneId} onChange={setOriginZoneId} placeholder="Déduire automatiquement du profil" />
        </Field>

        <Field label="Modèle de livraison">
          <select className={inputClass} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Modèle par défaut{def ? ` (${def.name})` : ""}</option>
            {choices.filter((t) => !t.isDefault).map((t) => (
              <option key={t._id} value={t._id}>{t.name}{t.kind === "custom" ? " — personnalisé" : ""}</option>
            ))}
          </select>
        </Field>

        <div className="rounded-xl bg-gray-50 p-3 flex flex-wrap gap-2 items-center justify-between">
          <p className="text-xs text-gray-600 max-w-xs">
            Besoin de tarifs propres à cette boutique ? Créez une copie modifiable du modèle actuel, réservée à elle.
          </p>
          <div className="flex gap-2">
            <Btn size="sm" variant="secondary" icon={Calculator} onClick={onSimulate}>Simuler</Btn>
            {seller.template?.kind !== "custom" ? <Btn size="sm" variant="secondary" icon={Sparkles} onClick={onCustomize}>Personnaliser</Btn> : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function SellersTab({ sellers, templates, zones, reload, onSimulate }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(() => new Set());
  const [editing, setEditing] = useState(null);
  const [customEditor, setCustomEditor] = useState(null);
  const [bulk, setBulk] = useState(null); // { originZoneId, templateId }
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => ({
    all: sellers.length,
    todo: sellers.filter((s) => !s.origin || s.origin.source === "country-fallback").length,
    inferred: sellers.filter((s) => s.origin?.source === "inferred").length,
    custom: sellers.filter((s) => s.template && !s.template.inherited).length,
  }), [sellers]);

  const list = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return sellers.filter((s) => {
      if (nq && !`${s.storeName} ${s.profileLocation} ${s.origin?.label || ""}`.toLowerCase().includes(nq)) return false;
      if (filter === "todo") return !s.origin || s.origin.source === "country-fallback";
      if (filter === "inferred") return s.origin?.source === "inferred";
      if (filter === "custom") return s.template && !s.template.inherited;
      return true;
    });
  }, [sellers, q, filter]);

  const allChecked = list.length > 0 && list.every((s) => selected.has(String(s._id)));
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(list.map((s) => String(s._id))));

  const customize = async (seller) => {
    const current = templates.find((t) => String(t._id) === String(seller.template?._id)) || templates.find((t) => t.isDefault);
    if (!current) return toast.error("Aucun modèle de base disponible.");
    setBusy(true);
    try {
      const res = await shippingV3Api.duplicateTemplate(current._id, { ownerSellerId: seller._id, name: `${seller.storeName} — personnalisé` });
      toast.success("Modèle personnalisé créé et attribué à la boutique");
      setEditing(null);
      await reload();
      if (res?.data) setCustomEditor(res.data);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const applyBulk = async () => {
    const payload = { sellerIds: [...selected] };
    if (bulk.originZoneId !== undefined) payload.shippingOriginZoneId = bulk.originZoneId;
    if (bulk.templateId !== undefined) payload.shippingTemplateId = bulk.templateId || null;
    if (Object.keys(payload).length === 1) return toast.info("Choisissez au moins une modification.");
    setBusy(true);
    try {
      const res = await shippingV3Api.bulkUpdateSellers(payload);
      toast.success(`${res?.data?.updated ?? selected.size} boutique(s) mise(s) à jour`);
      setBulk(null);
      setSelected(new Set());
      await reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const platformTemplates = templates.filter((t) => t.isActive && t.kind === "platform");

  return (
    <div className="space-y-4">
      {counts.todo > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>{counts.todo} boutique{counts.todo > 1 ? "s" : ""}</strong> sans lieu d’expédition précis : elles sont tarifées comme « Autre région ».
            Précisez leur ville ou quartier pour des frais justes.
          </p>
        </div>
      ) : null}

      <Card>
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputClass} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une boutique, une ville…" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === f.key ? "bg-[#30A08B] text-white border-[#30A08B]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
              >
                {f.label} <span className="opacity-70">{counts[f.key]}</span>
              </button>
            ))}
          </div>
        </div>

        {selected.size > 0 ? (
          <div className="px-4 py-2.5 bg-[#30A08B]/5 border-b border-[#30A08B]/20 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">{selected.size} sélectionnée{selected.size > 1 ? "s" : ""}</span>
            <Btn size="sm" onClick={() => setBulk({})}>Modifier en lot</Btn>
            <Btn size="sm" variant="ghost" icon={X} onClick={() => setSelected(new Set())}>Désélectionner</Btn>
          </div>
        ) : null}

        {list.length === 0 ? (
          <Empty icon={Store} title="Aucune boutique" hint={q || filter !== "all" ? "Modifiez la recherche ou le filtre." : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 w-10"><input type="checkbox" className="accent-[#30A08B]" checked={allChecked} onChange={toggleAll} aria-label="Tout sélectionner" /></th>
                  <th className="text-left font-medium px-3 py-2">Boutique</th>
                  <th className="text-left font-medium px-3 py-2">Lieu d’expédition</th>
                  <th className="text-left font-medium px-3 py-2">Modèle</th>
                  <th className="px-3 py-2 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((s) => {
                  const id = String(s._id);
                  const src = ORIGIN_SOURCE[s.origin?.source] || ORIGIN_SOURCE["country-fallback"];
                  return (
                    <tr key={id} className={`hover:bg-gray-50/70 ${selected.has(id) ? "bg-[#30A08B]/5" : ""}`}>
                      <td className="px-4 py-3"><input type="checkbox" className="accent-[#30A08B]" checked={selected.has(id)} onChange={() => toggle(id)} aria-label={`Sélectionner ${s.storeName}`} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          {s.logo ? <img src={s.logo} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" /> : <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Store className="w-4 h-4 text-gray-400" /></div>}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-[220px]">{s.storeName || "Sans nom"}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[220px]">{s.profileLocation || "Adresse non renseignée"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-gray-700 truncate max-w-[260px]">{s.origin?.label || "Inconnu"}</p>
                        <Pill tone={src.tone} className="mt-1">{src.label}</Pill>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-gray-700 truncate max-w-[200px]">{s.template?.name || "—"}</p>
                        <Pill tone={s.template?.inherited ? "gray" : s.template?.kind === "custom" ? "sand" : "brand"} className="mt-1">
                          {s.template?.inherited ? "Par défaut" : s.template?.kind === "custom" ? "Personnalisé" : "Attribué"}
                        </Pill>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Btn size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(s)}>Régler</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing ? (
        <SellerDialog
          seller={editing}
          zones={zones}
          templates={templates}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await reload(); }}
          onCustomize={() => !busy && customize(editing)}
          onSimulate={() => { const s = editing; setEditing(null); onSimulate(s); }}
        />
      ) : null}

      {customEditor ? (
        <TemplateEditor
          open
          template={customEditor}
          zones={zones}
          onClose={() => setCustomEditor(null)}
          onSaved={async () => { setCustomEditor(null); await reload(); }}
        />
      ) : null}

      <Modal
        open={!!bulk}
        onClose={() => setBulk(null)}
        title={`Modifier ${selected.size} boutique${selected.size > 1 ? "s" : ""}`}
        subtitle="Seuls les champs cochés sont modifiés."
        footer={(
          <>
            <Btn variant="secondary" onClick={() => setBulk(null)}>Annuler</Btn>
            <Btn icon={Check} onClick={applyBulk} loading={busy}>Appliquer</Btn>
          </>
        )}
      >
        {bulk ? (
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <input type="checkbox" className="accent-[#30A08B]" checked={bulk.originZoneId !== undefined} onChange={(e) => setBulk({ ...bulk, originZoneId: e.target.checked ? null : undefined })} />
                Lieu d’expédition
              </label>
              {bulk.originZoneId !== undefined ? (
                <ZonePicker zones={zones} value={bulk.originZoneId} onChange={(v) => setBulk({ ...bulk, originZoneId: v })} placeholder="Vide = déduire du profil de chaque boutique" />
              ) : null}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <input type="checkbox" className="accent-[#30A08B]" checked={bulk.templateId !== undefined} onChange={(e) => setBulk({ ...bulk, templateId: e.target.checked ? "" : undefined })} />
                Modèle de livraison
              </label>
              {bulk.templateId !== undefined ? (
                <select className={inputClass} value={bulk.templateId} onChange={(e) => setBulk({ ...bulk, templateId: e.target.value })}>
                  <option value="">Modèle par défaut</option>
                  {platformTemplates.filter((t) => !t.isDefault).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
