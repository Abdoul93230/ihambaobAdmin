import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertTriangle, ChevronDown, ChevronRight, Eye, EyeOff, GitMerge, Link2, Loader2, MapPin, Pencil, Plus, Power, Search,
} from "lucide-react";
import { shippingV3Api } from "@/services/api";
import { Btn, Card, Empty, Field, Modal, Pill, ZonePicker, errMsg, inputClass } from "./shared";

const TYPE = {
  country: { label: "Pays", child: "region", childLabel: "région", tone: "sand" },
  region: { label: "Région", child: "city", childLabel: "ville / commune", tone: "brand" },
  city: { label: "Ville / commune", child: "district", childLabel: "quartier", tone: "blue" },
  district: { label: "Quartier", child: null, tone: "gray" },
};
const PARENT_TYPE = { region: "country", city: "region", district: "city" };
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Saisie des synonymes : texte séparé par des virgules */
function AliasesInput({ value, onChange }) {
  const [text, setText] = useState((value || []).join(", "));
  return (
    <input
      className={inputClass}
      value={text}
      placeholder="Ex. Niamey I, Commune I"
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split(",").map((a) => a.trim()).filter(Boolean));
      }}
    />
  );
}

function GpsInput({ value, onChange }) {
  const set = (k, v) => onChange({ ...(value || {}), [k]: v });
  return (
    <div className="grid grid-cols-2 gap-2">
      <input className={inputClass} type="number" step="0.0001" placeholder="Latitude (ex. 13.5116)" value={value?.lat ?? ""} onChange={(e) => set("lat", e.target.value)} />
      <input className={inputClass} type="number" step="0.0001" placeholder="Longitude (ex. 2.1254)" value={value?.lng ?? ""} onChange={(e) => set("lng", e.target.value)} />
    </div>
  );
}

const gpsPayload = (c) => (c && c.lat !== "" && c.lat != null && c.lng !== "" && c.lng != null ? { lat: Number(c.lat), lng: Number(c.lng) } : null);

/** Création d'une sous-zone */
function CreateDialog({ parent, onClose, onDone }) {
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState([]);
  const [center, setCenter] = useState(null);
  const [saving, setSaving] = useState(false);
  const childType = parent ? TYPE[parent.type].child : "country";

  const save = async () => {
    if (name.trim().length < 2) return toast.error("Saisissez un nom.");
    setSaving(true);
    try {
      await shippingV3Api.createZone({ name, parent: parent?._id || null, aliases, center: gpsPayload(center) });
      toast.success(`« ${name.trim()} » ajouté(e)`);
      onDone();
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
      title={`Ajouter ${parent ? `un(e) ${TYPE[parent.type].childLabel}` : "un pays"}`}
      subtitle={parent ? `Dans : ${parent.fullPath}` : undefined}
      footer={<><Btn variant="secondary" onClick={onClose}>Annuler</Btn><Btn icon={Plus} onClick={save} loading={saving}>Ajouter</Btn></>}
    >
      <div className="space-y-4">
        <Field label="Nom officiel">
          <input autoFocus className={inputClass} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder={childType === "district" ? "Ex. Koira Kano" : "Ex. Tessaoua"} />
        </Field>
        <Field label="Autres noms (facultatif)" hint="Séparés par des virgules. Utilisés par la recherche des clients et la détection du lieu des boutiques.">
          <AliasesInput value={aliases} onChange={setAliases} />
        </Field>
        <Field label="Point GPS approximatif (facultatif)" hint="Centre du quartier ou de la ville. Servira au filtre « Près de chez moi ».">
          <GpsInput value={center} onChange={setCenter} />
        </Field>
      </div>
    </Modal>
  );
}

/** Fiche d'une zone : modifier, déplacer, désactiver, fusionner */
function ZoneDialog({ zone, all, onClose, onDone }) {
  const [name, setName] = useState(zone.name);
  const [aliases, setAliases] = useState(zone.aliases || []);
  const [center, setCenter] = useState(zone.center || null);
  const [parent, setParent] = useState(zone.parent ? String(zone.parent) : null);
  const [mergeTarget, setMergeTarget] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [busy, setBusy] = useState(false);
  const parentType = PARENT_TYPE[zone.type];
  const parentChoices = useMemo(() => all.filter((z) => z.type === parentType && z.isActive && !String(z.fullPath).startsWith(`${zone.fullPath} >`)), [all, parentType, zone.fullPath]);
  const mergeChoices = useMemo(() => all.filter((z) => z.type === zone.type && z.isActive && String(z._id) !== String(zone._id) && !String(z.fullPath).startsWith(`${zone.fullPath} >`)), [all, zone]);

  const act = async (fn, ok) => {
    setBusy(true);
    try {
      const r = await fn();
      toast.success(typeof ok === "function" ? ok(r?.data) : ok);
      onDone();
    } catch (e) {
      if (e?.status === 409 && e?.data?.refs) setBlocked(e.data.refs);
      else toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const save = () => act(
    () => shippingV3Api.updateZone(zone._id, { name, aliases, center: gpsPayload(center), ...(parent !== String(zone.parent || "") && parent ? { parent } : {}) }),
    "Zone enregistrée",
  );
  const deactivate = (force) => act(() => shippingV3Api.setZoneStatus(zone._id, { isActive: false, force }), (d) => `${d?.deactivated || 1} zone(s) désactivée(s)`);
  const activate = (includeChildren) => act(() => shippingV3Api.setZoneStatus(zone._id, { isActive: true, includeChildren }), (d) => `${d?.activated || 1} zone(s) réactivée(s)`);
  const merge = () => act(
    () => shippingV3Api.mergeZone(zone._id, mergeTarget),
    (d) => `Fusion terminée : ${d?.sellers || 0} boutique(s), ${d?.templates || 0} modèle(s), ${d?.campaigns || 0} campagne(s), ${d?.children || 0} sous-zone(s) rattachées`,
  );

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={zone.name}
      subtitle={`${TYPE[zone.type].label} · ${zone.fullPath} · code ${zone.code}`}
      footer={zone.isActive ? <><Btn variant="secondary" onClick={onClose}>Fermer</Btn><Btn onClick={save} loading={busy}>Enregistrer</Btn></> : <Btn variant="secondary" onClick={onClose}>Fermer</Btn>}
    >
      <div className="space-y-5">
        {!zone.isActive ? (
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 flex flex-wrap items-center gap-2 justify-between">
            <p className="text-sm text-gray-600">Zone désactivée : invisible pour les clients et les boutiques.</p>
            <div className="flex gap-2">
              <Btn size="sm" variant="secondary" icon={Power} onClick={() => activate(false)} loading={busy}>Réactiver</Btn>
              {zone.children.total ? <Btn size="sm" variant="secondary" onClick={() => activate(true)} disabled={busy}>Réactiver avec ses sous-zones</Btn> : null}
            </div>
          </div>
        ) : (
          <>
            <Field label="Nom officiel">
              <input className={inputClass} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Autres noms" hint="Séparés par des virgules (graphies, anciens noms, abréviations).">
              <AliasesInput value={aliases} onChange={setAliases} />
            </Field>
            <Field label="Point GPS approximatif">
              <GpsInput value={center} onChange={setCenter} />
            </Field>
            {parentType ? (
              <Field label={`Rattachement (${TYPE[parentType].label.toLowerCase()})`} hint="Déplacer la zone met à jour tout son chemin et celui de ses sous-zones.">
                <ZonePicker zones={parentChoices} value={parent} allowClear={false} onChange={setParent} />
              </Field>
            ) : null}
          </>
        )}

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" />Utilisée par</p>
          {zone.refs.length ? (
            <ul className="text-sm text-gray-700 space-y-1">{zone.refs.map((r, i) => <li key={i} className="flex gap-2"><span className="text-gray-300">•</span>{r}</li>)}</ul>
          ) : <p className="text-sm text-gray-400">Aucune boutique, aucun modèle ni campagne.</p>}
          <p className="text-[11px] text-gray-400 mt-1">Les commandes passées gardent leur adresse, quoi qu’il arrive à la zone.</p>
        </div>

        {zone.isActive ? (
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><GitMerge className="w-4 h-4 text-gray-400" />Fusionner dans une autre zone</p>
              <p className="text-xs text-gray-500 mb-2">Pour un doublon : les boutiques, modèles, campagnes et sous-zones passent sur la zone choisie ; « {zone.name} » devient un autre nom de celle-ci, puis est désactivée.</p>
              <div className="flex gap-2">
                <div className="flex-1"><ZonePicker zones={mergeChoices} value={mergeTarget} onChange={setMergeTarget} placeholder={`Choisir un(e) ${TYPE[zone.type].label.toLowerCase()}…`} /></div>
                <Btn variant="secondary" icon={GitMerge} disabled={!mergeTarget || busy} onClick={merge}>Fusionner</Btn>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">Désactiver masque la zone{zone.children.active ? ` et ses ${zone.children.active} sous-zone(s) actives` : ""}. Rien n’est supprimé.</p>
              <Btn variant="danger" size="sm" icon={Power} onClick={() => deactivate(false)} disabled={busy}>Désactiver</Btn>
            </div>
          </div>
        ) : null}

        {blocked ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 space-y-2">
            <p className="font-medium flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />Encore utilisée :</p>
            <ul className="text-xs space-y-0.5">{blocked.slice(0, 8).map((r, i) => <li key={i}>• {r}</li>)}{blocked.length > 8 ? <li>… +{blocked.length - 8}</li> : null}</ul>
            <p className="text-xs">Le mieux est de fusionner la zone dans une autre. Si vous désactivez quand même, ces boutiques seront tarifées depuis leur profil.</p>
            <Btn size="sm" variant="danger" onClick={() => { setBlocked(null); deactivate(true); }}>Désactiver quand même</Btn>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function TreeNode({ zone, kids, depth, expanded, toggle, onOpen, onAdd }) {
  const children = kids.get(String(zone._id)) || [];
  const open = expanded.has(String(zone._id));
  const t = TYPE[zone.type];
  return (
    <>
      <div className={`group flex items-center gap-2 pr-3 py-1.5 hover:bg-gray-50 ${zone.isActive ? "" : "opacity-50"}`} style={{ paddingLeft: 12 + depth * 20 }}>
        <button type="button" onClick={() => toggle(String(zone._id))} className={`w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 ${children.length ? "" : "invisible"}`} aria-label={open ? "Replier" : "Déplier"}>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <button type="button" onClick={() => onOpen(zone)} className="flex-1 min-w-0 flex items-center gap-2 text-left">
          <span className={`truncate text-sm ${zone.type === "district" ? "text-gray-700" : "font-medium text-gray-800"}`}>{zone.name}</span>
          <Pill tone={t.tone}>{t.label}</Pill>
          {zone.children.active ? <span className="text-[11px] text-gray-400">{zone.children.active}</span> : null}
          {zone.refs.length ? <Pill tone="amber" className="!font-medium"><Link2 className="w-3 h-3" />{zone.refs.length}</Pill> : null}
          {zone.center?.lat != null ? <MapPin className="w-3 h-3 text-[#30A08B]" /> : null}
          {!zone.isActive ? <Pill tone="red">Désactivée</Pill> : null}
          {zone.aliases?.length ? <span className="hidden md:inline text-[11px] text-gray-400 truncate">aussi : {zone.aliases.join(", ")}</span> : null}
        </button>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          {t.child && zone.isActive ? <Btn size="sm" variant="ghost" icon={Plus} onClick={() => onAdd(zone)}>{TYPE[t.child].label.split(" ")[0]}</Btn> : null}
          <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => onOpen(zone)} aria-label="Ouvrir" />
        </div>
      </div>
      {open ? children.map((c) => <TreeNode key={c._id} zone={c} kids={kids} depth={depth + 1} expanded={expanded} toggle={toggle} onOpen={onOpen} onAdd={onAdd} />) : null}
    </>
  );
}

export default function ZonesTab({ onZonesChanged }) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [opened, setOpened] = useState(null);
  const [adding, setAdding] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await shippingV3Api.getAdminZones();
      const data = r?.data || [];
      setAll(data);
      setExpanded((prev) => {
        if (prev.size) return prev;
        // Par défaut : le Niger déplié (ses régions visibles)
        const niger = data.find((z) => z.type === "country" && norm(z.name) === "niger");
        return new Set(niger ? [String(niger._id)] : []);
      });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setOpened(null);
    setAdding(null);
    await load();
    onZonesChanged?.();
  };

  const visible = useMemo(() => all.filter((z) => showInactive || z.isActive), [all, showInactive]);
  const kids = useMemo(() => {
    const m = new Map();
    for (const z of visible) {
      const k = z.parent ? String(z.parent) : "root";
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(z);
    }
    for (const list of m.values()) {
      list.sort((a, b) => (norm(a.name) === "niger" ? -1 : norm(b.name) === "niger" ? 1 : a.name.localeCompare(b.name, "fr")));
    }
    return m;
  }, [visible]);

  const results = useMemo(() => {
    const nq = norm(q.trim());
    if (!nq) return null;
    return visible.filter((z) => norm([z.fullPath, ...(z.aliases || [])].join(" ")).includes(nq)).slice(0, 100);
  }, [visible, q]);

  const stats = useMemo(() => {
    const niger = all.filter((z) => z.isActive && String(z.fullPath).startsWith("Niger"));
    return {
      regions: niger.filter((z) => z.type === "region").length,
      cities: niger.filter((z) => z.type === "city").length,
      districts: niger.filter((z) => z.type === "district").length,
      gps: niger.filter((z) => z.center?.lat != null).length,
      inactive: all.filter((z) => !z.isActive).length,
    };
  }, [all]);

  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const expandAll = () => setExpanded(new Set(visible.filter((z) => z.type !== "district").map((z) => String(z._id))));

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ["Régions", stats.regions], ["Villes / communes", stats.cities], ["Quartiers", stats.districts], ["Avec point GPS", stats.gps], ["Désactivées", stats.inactive],
        ].map(([label, value]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl px-3 py-2.5">
            <p className="text-lg font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">{label}{label !== "Désactivées" ? " · Niger" : ""}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputClass} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une zone ou un autre nom (ex. Gamkalé, Konni)…" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" size="sm" icon={showInactive ? EyeOff : Eye} onClick={() => setShowInactive((v) => !v)}>{showInactive ? "Masquer désactivées" : "Voir désactivées"}</Btn>
            {!results ? <Btn variant="secondary" size="sm" onClick={expandAll}>Tout déplier</Btn> : null}
            {!results ? <Btn variant="secondary" size="sm" onClick={() => setExpanded(new Set())}>Tout replier</Btn> : null}
          </div>
        </div>

        {results ? (
          results.length === 0 ? <Empty icon={MapPin} title="Aucune zone trouvée" hint="Ajoutez-la depuis l’arbre (survolez la zone parente → Ajouter)." /> : (
            <ul className="divide-y divide-gray-100">
              {results.map((z) => (
                <li key={z._id}>
                  <button type="button" onClick={() => setOpened(z)} className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 ${z.isActive ? "" : "opacity-50"}`}>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-gray-800 truncate">{z.name}</span>
                      <span className="block text-[11px] text-gray-400 truncate">{z.fullPath}{z.aliases?.length ? ` · aussi : ${z.aliases.join(", ")}` : ""}</span>
                    </span>
                    <Pill tone={TYPE[z.type].tone}>{TYPE[z.type].label}</Pill>
                    {z.refs.length ? <Pill tone="amber"><Link2 className="w-3 h-3" />{z.refs.length}</Pill> : null}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="py-2">
            {(kids.get("root") || []).map((z) => (
              <TreeNode key={z._id} zone={z} kids={kids} depth={0} expanded={expanded} toggle={toggle} onOpen={setOpened} onAdd={setAdding} />
            ))}
          </div>
        )}
        <p className="px-4 py-3 border-t border-gray-100 text-[11px] text-gray-400">
          Cliquez une zone pour la modifier, la déplacer, la fusionner ou la désactiver. Survolez-la pour ajouter une sous-zone. Rien n’est jamais supprimé : l’historique des commandes est préservé.
        </p>
      </Card>

      {opened ? <ZoneDialog zone={all.find((z) => String(z._id) === String(opened._id)) || opened} all={all} onClose={() => setOpened(null)} onDone={refresh} /> : null}
      {adding ? <CreateDialog parent={adding} onClose={() => setAdding(null)} onDone={refresh} /> : null}
    </div>
  );
}
