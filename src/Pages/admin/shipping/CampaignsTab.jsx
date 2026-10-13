import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CalendarDays, Gift, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { shippingV3Api } from "@/services/api";
import { Btn, Card, Empty, Field, Modal, MoneyInput, NumberInput, Pill, RELATIONS, RELATION_LABEL, Toggle, ZonePicker, errMsg, inputClass, money } from "./shared";

/** Date ISO ⇄ valeur d'un <input type="datetime-local"> (heure locale du navigateur) */
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null);

function status(c, now = Date.now()) {
  if (!c.isActive) return { tone: "gray", label: "Désactivée" };
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return { tone: "red", label: "Terminée" };
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { tone: "blue", label: "Programmée" };
  return { tone: "green", label: "En cours" };
}

const EMPTY = { name: "", description: "", isActive: true, startsAt: null, endsAt: null, minParcelSubtotal: 0, relations: [], destinationZoneIds: [], sellerIds: [], priority: 0 };

function SellerMultiPicker({ sellers, value, onChange }) {
  const [q, setQ] = useState("");
  const nq = q.trim().toLowerCase();
  const list = sellers.filter((s) => !nq || String(s.storeName).toLowerCase().includes(nq));
  const set = new Set(value.map(String));
  const flip = (id) => onChange(set.has(id) ? value.filter((x) => String(x) !== id) : [...value, id]);
  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une boutique…" className="flex-1 text-sm outline-none" />
        {value.length ? <button type="button" className="text-xs text-[#30A08B] font-medium" onClick={() => onChange([])}>Toutes</button> : null}
      </div>
      <div className="max-h-40 overflow-y-auto py-1">
        {list.map((s) => {
          const id = String(s._id);
          return (
            <label key={id} className="flex items-center gap-2 px-3 py-1 text-sm hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" className="accent-[#30A08B]" checked={set.has(id)} onChange={() => flip(id)} />
              <span className="truncate">{s.storeName}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CampaignDialog({ campaign, zones, sellers, onClose, onSaved }) {
  const [c, setC] = useState(() => ({ ...EMPTY, ...(campaign || {}), destinationZoneIds: (campaign?.destinationZoneIds || []).map(String), sellerIds: (campaign?.sellerIds || []).map(String) }));
  const [saving, setSaving] = useState(false);
  const set = (patch) => setC((prev) => ({ ...prev, ...patch }));
  const isNew = !campaign?._id;

  const save = async () => {
    if (!c.name.trim()) return toast.error("Donnez un nom à la campagne.");
    if (c.startsAt && c.endsAt && new Date(c.endsAt) <= new Date(c.startsAt)) return toast.error("La date de fin doit être après la date de début.");
    setSaving(true);
    try {
      const payload = {
        name: c.name.trim(), description: (c.description || "").trim(), isActive: c.isActive, startsAt: c.startsAt, endsAt: c.endsAt,
        minParcelSubtotal: c.minParcelSubtotal, relations: c.relations, destinationZoneIds: c.destinationZoneIds, sellerIds: c.sellerIds, priority: c.priority,
      };
      if (isNew) await shippingV3Api.createCampaign(payload); else await shippingV3Api.updateCampaign(campaign._id, payload);
      toast.success(isNew ? "Campagne créée" : "Campagne enregistrée");
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
      onClose={saving ? undefined : onClose}
      title={isNew ? "Nouvelle campagne de livraison offerte" : `Modifier « ${campaign.name} »`}
      subtitle="Les frais offerts sont pris en charge par la plateforme, colis par colis (une boutique = un colis)."
      footer={(
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Annuler</Btn>
          <Btn onClick={save} loading={saving}>{isNew ? "Créer" : "Enregistrer"}</Btn>
        </>
      )}
    >
      <div className="space-y-4">
        <Field label="Nom (visible par les clients)">
          <input className={inputClass} value={c.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} placeholder="Ex. Livraison offerte — lancement" />
        </Field>
        <Field label="Description interne">
          <input className={inputClass} value={c.description} maxLength={300} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début" hint="Vide = immédiatement">
            <input type="datetime-local" className={inputClass} value={toLocalInput(c.startsAt)} onChange={(e) => set({ startsAt: fromLocalInput(e.target.value) })} />
          </Field>
          <Field label="Fin" hint="Vide = sans limite">
            <input type="datetime-local" className={inputClass} value={toLocalInput(c.endsAt)} onChange={(e) => set({ endsAt: fromLocalInput(e.target.value) })} />
          </Field>
          <Field label="Montant d’articles minimum par boutique" hint="0 = dès le premier article">
            <MoneyInput value={c.minParcelSubtotal} onChange={(v) => set({ minParcelSubtotal: v })} />
          </Field>
          <Field label="Priorité" hint="Si plusieurs campagnes s’appliquent, la plus haute gagne">
            <NumberInput value={c.priority} min={-100} max={100} onChange={(v) => set({ priority: Math.round(v) })} />
          </Field>
        </div>

        <Field label="Distances concernées" hint="Aucune case cochée = toutes les livraisons nationales (jamais l’international)">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {RELATIONS.filter((r) => r.key !== "international").map((r) => {
              const on = c.relations.includes(r.key);
              return (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => set({ relations: on ? c.relations.filter((x) => x !== r.key) : [...c.relations, r.key] })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${on ? "bg-[#30A08B] text-white border-[#30A08B]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Zones de destination" hint="Vide = partout. Une zone inclut toutes ses sous-zones (ex. Niamey).">
          <ZonePicker zones={zones} multiple value={c.destinationZoneIds} onChange={(v) => set({ destinationZoneIds: v })} placeholder="Partout" />
        </Field>

        <div>
          <span className="block text-xs font-medium text-gray-600 mb-1">Boutiques {c.sellerIds.length ? `(${c.sellerIds.length})` : "(toutes)"}</span>
          <SellerMultiPicker sellers={sellers} value={c.sellerIds} onChange={(v) => set({ sellerIds: v })} />
        </div>

        <Toggle checked={c.isActive} onChange={(v) => set({ isActive: v })} label={c.isActive ? "Campagne activée" : "Campagne désactivée"} />
      </div>
    </Modal>
  );
}

export default function CampaignsTab({ campaigns, zones, sellers, reload }) {
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const zoneName = useMemo(() => new Map(zones.map((z) => [String(z._id), z.name])), [zones]);
  const sellerName = useMemo(() => new Map(sellers.map((s) => [String(s._id), s.storeName])), [sellers]);

  const quickToggle = async (c) => {
    setBusy(true);
    try {
      await shippingV3Api.updateCampaign(c._id, { isActive: !c.isActive });
      toast.success(c.isActive ? "Campagne désactivée" : "Campagne activée");
      await reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await shippingV3Api.deleteCampaign(confirm._id);
      toast.success("Campagne supprimée");
      setConfirm(null);
      await reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const scope = (ids, names, all) => (ids?.length ? ids.map((id) => names.get(String(id)) || "?").slice(0, 3).join(", ") + (ids.length > 3 ? ` +${ids.length - 3}` : "") : all);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 max-w-2xl">
          La livraison offerte est financée par la plateforme. Le client voit « Livraison offerte » et, s’il en est proche, « Plus que X F pour la livraison offerte ».
          Les colis « sur devis » ne sont jamais offerts automatiquement.
        </p>
        <Btn icon={Plus} onClick={() => setEditing({})}>Nouvelle campagne</Btn>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <Empty
            icon={Gift}
            title="Aucune campagne"
            hint="Pour le lancement : créez « Livraison offerte » sans condition, ou avec un montant minimum."
            action={<Btn icon={Plus} onClick={() => setEditing({ seed: { name: "Livraison offerte — lancement", isActive: true } })}>Créer la campagne de lancement</Btn>}
          />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const st = status(c);
            return (
              <Card key={c._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-semibold text-gray-800 truncate">{c.name}</h3>
                      <Pill tone={st.tone}>{st.label}</Pill>
                      {c.priority ? <Pill>Priorité {c.priority}</Pill> : null}
                    </div>
                    {c.description ? <p className="text-xs text-gray-500 mt-1">{c.description}</p> : null}
                  </div>
                  <Toggle checked={c.isActive} disabled={busy} onChange={() => quickToggle(c)} />
                </div>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-gray-500">Période</dt>
                  <dd className="text-gray-700 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-gray-400" />{fmtDate(c.startsAt) || "Dès maintenant"} → {fmtDate(c.endsAt) || "sans fin"}</dd>
                  <dt className="text-gray-500">Minimum</dt>
                  <dd className="text-gray-700">{c.minParcelSubtotal ? `${money(c.minParcelSubtotal)} d’articles par boutique` : "Aucun"}</dd>
                  <dt className="text-gray-500">Distances</dt>
                  <dd className="text-gray-700">{c.relations?.length ? c.relations.map((r) => RELATION_LABEL[r]).join(", ") : "Toutes (nationales)"}</dd>
                  <dt className="text-gray-500">Zones</dt>
                  <dd className="text-gray-700">{scope(c.destinationZoneIds, zoneName, "Partout")}</dd>
                  <dt className="text-gray-500">Boutiques</dt>
                  <dd className="text-gray-700">{scope(c.sellerIds, sellerName, "Toutes")}</dd>
                </dl>
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1.5">
                  <Btn size="sm" icon={Pencil} onClick={() => setEditing({ campaign: c })}>Modifier</Btn>
                  <Btn size="sm" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50 ml-auto" onClick={() => setConfirm(c)}>Supprimer</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing ? (
        <CampaignDialog
          campaign={editing.campaign || (editing.seed ? { ...EMPTY, ...editing.seed } : null)}
          zones={zones}
          sellers={sellers}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await reload(); }}
        />
      ) : null}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Supprimer cette campagne ?"
        footer={(
          <>
            <Btn variant="secondary" onClick={() => setConfirm(null)}>Annuler</Btn>
            <Btn variant="danger" icon={Trash2} loading={busy} onClick={remove}>Supprimer</Btn>
          </>
        )}
      >
        <p className="text-sm text-gray-600">« {confirm?.name} » sera supprimée. Les commandes déjà passées gardent leurs frais. Pour une pause, désactivez-la plutôt.</p>
      </Modal>
    </div>
  );
}
