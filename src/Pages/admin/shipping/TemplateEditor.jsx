import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Ban, Clock, Layers, MapPin, Plus, Route, Scale, Trash2 } from "lucide-react";
import { shippingV3Api } from "@/services/api";
import {
  Btn, DEST_MODES, Field, LOCAL_RELATIONS, Modal, MoneyInput, NumberInput, RELATIONS, RELATION_LABEL,
  SectionTitle, SIZE_CLASSES, Toggle, ZonePicker, errMsg, inputClass, money,
} from "./shared";

const EMPTY_RELATION = { baseFee: 0, available: true, delay: { sameDay: false, minDays: 1, maxDays: 2 } };

/** Copie éditable d'un modèle (valeurs manquantes complétées) */
function toDraft(t = {}) {
  const relations = {};
  for (const r of RELATIONS) {
    const src = t.relations?.[r.key] || {};
    relations[r.key] = {
      baseFee: Number(src.baseFee) || 0,
      available: r.key === "international" ? src.available === true : src.available !== false,
      delay: { ...EMPTY_RELATION.delay, ...(src.delay || {}) },
    };
  }
  const id = (v) => (v && typeof v === "object" ? String(v._id) : v ? String(v) : null);
  return {
    name: t.name || "",
    description: t.description || "",
    isActive: t.isActive !== false,
    relations,
    areaRates: (t.areaRates || []).map((a) => ({ ...a, zoneId: id(a.zoneId) })),
    regionRoutes: (t.regionRoutes || []).map((r) => ({ bidirectional: true, ...r, fromZoneId: id(r.fromZoneId), toZoneId: id(r.toZoneId) })),
    destinationRules: (t.destinationRules || []).map((d) => ({ note: "", ...d, zoneId: id(d.zoneId) })),
    includedWeightKg: t.includedWeightKg ?? 1,
    extraPerKgByClass: { small: 150, medium: 200, large: 500, ...(t.extraPerKgByClass || {}) },
    sameDayCutoff: t.sameDayCutoff || "18:30",
    maxWeightKg: t.maxWeightKg ?? 0,
    codAllowed: t.codAllowed !== false,
  };
}

function validate(d) {
  if (!d.name.trim()) return "Donnez un nom au modèle.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.sameDayCutoff)) return "Heure limite au format HH:MM (ex. 18:30).";
  for (const r of RELATIONS) {
    const { delay } = d.relations[r.key];
    if (!delay.sameDay && Number(delay.maxDays) < Number(delay.minDays)) return `${r.label} : le délai maximum doit être ≥ au minimum.`;
  }
  if (d.areaRates.some((a) => !a.zoneId)) return "Tarifs locaux : choisissez une zone pour chaque ligne.";
  const areaKeys = d.areaRates.map((a) => `${a.zoneId}|${a.relation}`);
  if (new Set(areaKeys).size !== areaKeys.length) return "Tarifs locaux : une même zone apparaît deux fois pour la même relation.";
  if (d.regionRoutes.some((r) => !r.fromZoneId || !r.toZoneId)) return "Trajets : choisissez les deux régions de chaque ligne.";
  if (d.regionRoutes.some((r) => r.fromZoneId === r.toZoneId)) return "Trajets : départ et arrivée doivent être différents.";
  if (d.regionRoutes.some((r) => Number(r.maxDays) < Number(r.minDays))) return "Trajets : le délai maximum doit être ≥ au minimum.";
  if (d.destinationRules.some((r) => !r.zoneId)) return "Règles de destination : choisissez une zone pour chaque ligne.";
  const ruleZones = d.destinationRules.map((r) => r.zoneId);
  if (new Set(ruleZones).size !== ruleZones.length) return "Règles de destination : une zone ne peut avoir qu’une règle.";
  return null;
}

function RowRemove({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label="Supprimer la ligne">
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

/**
 * Édition complète d'un modèle de livraison.
 * template = null → création ; seed = valeurs de départ (copie du modèle par défaut)
 */
export default function TemplateEditor({ open, template, seed, zones, onClose, onSaved }) {
  const [d, setD] = useState(() => toDraft(template || seed));
  const [saving, setSaving] = useState(false);
  const regions = useMemo(() => zones.filter((z) => z.type === "region"), [zones]);
  const isNew = !template?._id;

  const set = (patch) => setD((prev) => ({ ...prev, ...patch }));
  const setRel = (key, patch) => setD((prev) => ({ ...prev, relations: { ...prev.relations, [key]: { ...prev.relations[key], ...patch } } }));
  const setDelay = (key, patch) => setD((prev) => ({
    ...prev,
    relations: { ...prev.relations, [key]: { ...prev.relations[key], delay: { ...prev.relations[key].delay, ...patch } } },
  }));
  const setRow = (list, i, patch) => setD((prev) => ({ ...prev, [list]: prev[list].map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const addRow = (list, row) => setD((prev) => ({ ...prev, [list]: [...prev[list], row] }));
  const delRow = (list, i) => setD((prev) => ({ ...prev, [list]: prev[list].filter((_, j) => j !== i) }));

  const save = async () => {
    const problem = validate(d);
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      const payload = { ...d, name: d.name.trim(), description: d.description.trim() };
      const res = isNew ? await shippingV3Api.createTemplate(payload) : await shippingV3Api.updateTemplate(template._id, payload);
      toast.success(isNew ? "Modèle créé" : "Modèle enregistré");
      onSaved?.(res?.data);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      wide
      title={isNew ? "Nouveau modèle de livraison" : `Modifier « ${template.name} »`}
      subtitle={template?.kind === "custom" ? "Modèle personnalisé : ne s’applique qu’à cette boutique." : "Les changements s’appliquent immédiatement à toutes les boutiques qui utilisent ce modèle."}
      footer={(
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Annuler</Btn>
          <Btn onClick={save} loading={saving}>{isNew ? "Créer le modèle" : "Enregistrer"}</Btn>
        </>
      )}
    >
      <div className="space-y-6">
        {/* Général */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Nom du modèle" className="sm:col-span-1">
            <input className={inputClass} value={d.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} placeholder="Ex. Standard Niger" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <input className={inputClass} value={d.description} maxLength={500} onChange={(e) => set({ description: e.target.value })} placeholder="À quoi sert ce modèle ?" />
          </Field>
          {!template?.isDefault ? (
            <div className="sm:col-span-3">
              <Toggle checked={d.isActive} onChange={(v) => set({ isActive: v })} label={d.isActive ? "Modèle actif" : "Modèle désactivé (les boutiques retombent sur le modèle par défaut)"} />
            </div>
          ) : null}
        </div>

        {/* Grille par relation */}
        <section>
          <SectionTitle icon={Layers} title="Tarif de base selon la distance" hint="Distance entre le lieu d’expédition de la boutique et l’adresse du client. Le 1er kilo est inclus." />
          <div className="border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Relation</th>
                  <th className="text-left font-medium px-3 py-2 w-24">Desservi</th>
                  <th className="text-left font-medium px-3 py-2 w-36">Tarif de base</th>
                  <th className="text-left font-medium px-3 py-2">Délai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {RELATIONS.map((r) => {
                  const rel = d.relations[r.key];
                  return (
                    <tr key={r.key} className={rel.available ? "" : "bg-gray-50/60"}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-800">{r.label}</p>
                        <p className="text-[11px] text-gray-400">{r.hint}</p>
                      </td>
                      <td className="px-3 py-2.5"><Toggle checked={rel.available} onChange={(v) => setRel(r.key, { available: v })} /></td>
                      <td className="px-3 py-2.5"><MoneyInput value={rel.baseFee} disabled={!rel.available} onChange={(v) => setRel(r.key, { baseFee: v })} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                            <input type="checkbox" className="accent-[#30A08B]" checked={!!rel.delay.sameDay} disabled={!rel.available} onChange={(e) => setDelay(r.key, { sameDay: e.target.checked })} />
                            Le jour même
                          </label>
                          {!rel.delay.sameDay ? (
                            <div className="flex items-center gap-1.5">
                              <NumberInput className="w-20" value={rel.delay.minDays} max={60} suffix="j" disabled={!rel.available} onChange={(v) => setDelay(r.key, { minDays: v })} />
                              <span className="text-xs text-gray-400">à</span>
                              <NumberInput className="w-20" value={rel.delay.maxDays} max={60} suffix="j" disabled={!rel.available} onChange={(v) => setDelay(r.key, { maxDays: v })} />
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Poids & options */}
        <section>
          <SectionTitle icon={Scale} title="Poids, heure limite et options" hint="Au-delà du poids inclus, chaque kilo entamé est facturé au tarif de la classe la plus lourde du colis." />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Poids inclus"><NumberInput value={d.includedWeightKg} step={0.5} max={100} suffix="kg" onChange={(v) => set({ includedWeightKg: v })} /></Field>
            {SIZE_CLASSES.filter((c) => c.key !== "xl").map((c) => (
              <Field key={c.key} label={`Kilo sup. · ${c.label}`} hint={c.hint}>
                <MoneyInput value={d.extraPerKgByClass[c.key]} onChange={(v) => set({ extraPerKgByClass: { ...d.extraPerKgByClass, [c.key]: v } })} />
              </Field>
            ))}
            <Field label="Heure limite « jour même »" hint="Après cette heure (Niamey), livraison le lendemain">
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="time" className={`${inputClass} pl-9`} value={d.sameDayCutoff} onChange={(e) => set({ sameDayCutoff: e.target.value })} />
              </div>
            </Field>
            <Field label="Poids maximum" hint="0 = pas de limite ; au-delà : sur devis">
              <NumberInput value={d.maxWeightKg} step={1} suffix="kg" onChange={(v) => set({ maxWeightKg: v })} />
            </Field>
            <div className="flex items-center">
              <Toggle checked={d.codAllowed} onChange={(v) => set({ codAllowed: v })} label="Paiement à la livraison autorisé" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Les produits « Très volumineux » sont toujours sur devis : le support contacte le client.</p>
        </section>

        {/* Tarifs locaux */}
        <section>
          <SectionTitle
            icon={MapPin}
            title="Tarifs locaux par zone"
            hint="Remplace le tarif de base dans une zone précise. Ex. même quartier à Niamey = 1 000 F (500 F ailleurs)."
            right={<Btn size="sm" variant="secondary" icon={Plus} onClick={() => addRow("areaRates", { zoneId: null, relation: "sameDistrict", baseFee: 0 })}>Ajouter</Btn>}
          />
          {d.areaRates.length === 0 ? <p className="text-xs text-gray-400">Aucun tarif local : la grille ci-dessus s’applique partout.</p> : (
            <div className="space-y-2">
              {d.areaRates.map((a, i) => (
                <div key={a._id || `new-${i}`} className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_9rem_auto] gap-2 items-center">
                  <ZonePicker zones={zones} value={a.zoneId} types={["country", "region", "city", "district"]} onChange={(v) => setRow("areaRates", i, { zoneId: v })} placeholder="Zone (ex. Niamey)" />
                  <select className={`${inputClass} hidden sm:block`} value={a.relation} onChange={(e) => setRow("areaRates", i, { relation: e.target.value })}>
                    {LOCAL_RELATIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                  <MoneyInput className="hidden sm:block" value={a.baseFee} onChange={(v) => setRow("areaRates", i, { baseFee: v })} />
                  <RowRemove onClick={() => delRow("areaRates", i)} />
                  <div className="col-span-2 grid grid-cols-2 gap-2 sm:hidden">
                    <select className={inputClass} value={a.relation} onChange={(e) => setRow("areaRates", i, { relation: e.target.value })}>
                      {LOCAL_RELATIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                    <MoneyInput value={a.baseFee} onChange={(v) => setRow("areaRates", i, { baseFee: v })} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Trajets entre régions */}
        <section>
          <SectionTitle
            icon={Route}
            title="Trajets entre régions"
            hint={`Sans trajet renseigné, « Autre région » = ${money(d.relations.otherRegion.baseFee)} · ${d.relations.otherRegion.delay.sameDay ? "jour même" : `${d.relations.otherRegion.delay.minDays} à ${d.relations.otherRegion.delay.maxDays} j`}.`}
            right={<Btn size="sm" variant="secondary" icon={Plus} onClick={() => addRow("regionRoutes", { fromZoneId: null, toZoneId: null, baseFee: d.relations.otherRegion.baseFee, minDays: 1, maxDays: 2, bidirectional: true })}>Ajouter un trajet</Btn>}
          />
          {d.regionRoutes.length === 0 ? <p className="text-xs text-gray-400">Aucun trajet spécifique pour l’instant.</p> : (
            <div className="space-y-3">
              {d.regionRoutes.map((r, i) => (
                <div key={r._id || `new-${i}`} className="rounded-xl border border-gray-200 p-3 grid sm:grid-cols-[1fr_1fr_9rem_auto] gap-2 items-center">
                  <ZonePicker zones={regions} value={r.fromZoneId} allowClear={false} onChange={(v) => setRow("regionRoutes", i, { fromZoneId: v })} placeholder="Région de départ" />
                  <ZonePicker zones={regions} value={r.toZoneId} allowClear={false} onChange={(v) => setRow("regionRoutes", i, { toZoneId: v })} placeholder="Région d’arrivée" />
                  <MoneyInput value={r.baseFee} onChange={(v) => setRow("regionRoutes", i, { baseFee: v })} />
                  <RowRemove onClick={() => delRow("regionRoutes", i)} />
                  <div className="sm:col-span-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Délai</span>
                      <NumberInput className="w-20" value={r.minDays} max={60} suffix="j" onChange={(v) => setRow("regionRoutes", i, { minDays: v })} />
                      <span className="text-xs text-gray-400">à</span>
                      <NumberInput className="w-20" value={r.maxDays} max={60} suffix="j" onChange={(v) => setRow("regionRoutes", i, { maxDays: v })} />
                    </div>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                      <input type="checkbox" className="accent-[#30A08B]" checked={r.bidirectional !== false} onChange={(e) => setRow("regionRoutes", i, { bidirectional: e.target.checked })} />
                      Même tarif dans les deux sens
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Règles de destination */}
        <section>
          <SectionTitle
            icon={Ban}
            title="Règles par zone de destination"
            hint="Zone non desservie, prix fixe ou supplément (ex. zone difficile d’accès). S’applique aussi à toutes les sous-zones."
            right={<Btn size="sm" variant="secondary" icon={Plus} onClick={() => addRow("destinationRules", { zoneId: null, mode: "surcharge", amount: 0, note: "" })}>Ajouter une règle</Btn>}
          />
          {d.destinationRules.length === 0 ? <p className="text-xs text-gray-400">Aucune règle : toutes les zones sont desservies au tarif normal.</p> : (
            <div className="space-y-2">
              {d.destinationRules.map((r, i) => (
                <div key={r._id || `new-${i}`} className="grid sm:grid-cols-[2fr_9rem_9rem_1.5fr_auto] gap-2 items-center rounded-xl sm:rounded-none border sm:border-0 border-gray-200 p-2 sm:p-0">
                  <ZonePicker zones={zones} value={r.zoneId} onChange={(v) => setRow("destinationRules", i, { zoneId: v })} placeholder="Zone de destination" />
                  <select className={inputClass} value={r.mode} onChange={(e) => setRow("destinationRules", i, { mode: e.target.value })}>
                    {DEST_MODES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                  {r.mode === "unavailable" ? <span className="text-xs text-gray-400 px-1">—</span> : <MoneyInput value={r.amount} onChange={(v) => setRow("destinationRules", i, { amount: v })} />}
                  <input className={inputClass} value={r.note} maxLength={120} onChange={(e) => setRow("destinationRules", i, { note: e.target.value })} placeholder="Note (affichée dans le détail)" />
                  <RowRemove onClick={() => delRow("destinationRules", i)} />
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
          Priorité de calcul : zone non desservie → prix fixe de destination → tarif local → trajet entre régions → grille « {RELATION_LABEL.otherRegion} » / distance → supplément → kilos supplémentaires → livraison offerte.
        </p>
      </div>
    </Modal>
  );
}
