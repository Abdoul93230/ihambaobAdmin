import React, { useEffect, useState } from "react";
import { ArrowRight, Calculator, Clock, Gift, Info, Plus, Trash2, XCircle } from "lucide-react";
import { shippingV3Api } from "@/services/api";
import { Btn, Card, Field, MoneyInput, NumberInput, Pill, REASON_LABEL, SIZE_CLASSES, SectionTitle, ZonePicker, errMsg, inputClass, money } from "./shared";

const NEW_ITEM = { sizeClass: "small", quantity: 1, unitPrice: 5000, weightKg: "" };

/** Simule les frais d'un colis : boutique (ou lieu de départ) → zone du client */
export default function SimulatorTab({ sellers, templates, zones, preset }) {
  const [sellerId, setSellerId] = useState(preset?._id ? String(preset._id) : "");
  const [originZoneId, setOriginZoneId] = useState(null);
  const [destinationZoneId, setDestinationZoneId] = useState(null);
  const [templateId, setTemplateId] = useState("");
  const [items, setItems] = useState([{ ...NEW_ITEM }]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preset?._id) setSellerId(String(preset._id));
  }, [preset]);

  const setItem = (i, patch) => setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const run = async () => {
    if (!destinationZoneId) return setError("Choisissez la zone du client.");
    if (!sellerId && !originZoneId) return setError("Choisissez une boutique ou un lieu de départ.");
    setLoading(true);
    setError(null);
    try {
      const res = await shippingV3Api.simulate({
        sellerId: sellerId || undefined,
        originZoneId: originZoneId || undefined,
        destinationZoneId,
        templateId: templateId || undefined,
        items: items.map((it) => ({
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          sizeClass: it.weightKg ? undefined : it.sizeClass,
          weightKg: it.weightKg ? Number(it.weightKg) : undefined,
        })),
      });
      setResult(res?.data || null);
    } catch (e) {
      setError(errMsg(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const seller = sellers.find((s) => String(s._id) === sellerId);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4 items-start">
      <Card className="p-5 space-y-5">
        <SectionTitle icon={Calculator} title="Paramètres" hint="Testez n’importe quel trajet avant de modifier un tarif ou de répondre à un client." />

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Boutique" hint={seller ? `Expédie depuis : ${seller.origin?.label || "inconnu"}` : "Utilise son lieu d’expédition et son modèle"}>
            <select className={inputClass} value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
              <option value="">— Aucune —</option>
              {sellers.map((s) => <option key={s._id} value={s._id}>{s.storeName}</option>)}
            </select>
          </Field>
          <Field label="Ou lieu de départ" hint="Remplace le lieu de la boutique">
            <ZonePicker zones={zones} value={originZoneId} onChange={setOriginZoneId} placeholder="Lieu de la boutique" />
          </Field>
          <Field label="Zone du client">
            <ZonePicker zones={zones} value={destinationZoneId} onChange={setDestinationZoneId} placeholder="Ex. Plateau, Maradi…" />
          </Field>
          <Field label="Modèle" hint="Par défaut : celui de la boutique">
            <select className={inputClass} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">Modèle de la boutique</option>
              {templates.filter((t) => t.isActive).map((t) => <option key={t._id} value={t._id}>{t.name}{t.isDefault ? " (défaut)" : ""}</option>)}
            </select>
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Articles du colis</span>
            <Btn size="sm" variant="ghost" icon={Plus} onClick={() => setItems((p) => [...p, { ...NEW_ITEM }])} disabled={items.length >= 20}>Article</Btn>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-[1.4fr_5rem_8rem_6rem_auto] gap-2 items-center">
                <select className={inputClass} value={it.sizeClass} disabled={!!it.weightKg} onChange={(e) => setItem(i, { sizeClass: e.target.value })}>
                  {SIZE_CLASSES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <NumberInput value={it.quantity} min={1} max={99} suffix="×" onChange={(v) => setItem(i, { quantity: Math.max(1, Math.round(v)) })} />
                <MoneyInput value={it.unitPrice} onChange={(v) => setItem(i, { unitPrice: v })} />
                <input
                  type="number" min={0} step={0.1} placeholder="Poids kg" value={it.weightKg}
                  onChange={(e) => setItem(i, { weightKg: e.target.value })}
                  className={`${inputClass} text-right`} title="Poids exact (facultatif) : remplace la classe"
                />
                <button type="button" disabled={items.length === 1} onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 justify-self-end" aria-label="Retirer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Prix unitaire : sert au seuil de livraison offerte. Poids exact facultatif (sinon : classe).</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Btn icon={Calculator} onClick={run} loading={loading} className="w-full">Calculer</Btn>
      </Card>

      <Card className="p-5">
        {!result ? (
          <div className="text-center py-10 text-gray-400">
            <Calculator className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Le détail du calcul s’affichera ici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
              <span className="font-medium text-gray-800">{result.origin?.label || "Départ inconnu"}</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-800">{result.destination?.label || "?"}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.relationLabel ? <Pill tone="brand">{result.relationLabel}</Pill> : null}
              <Pill>{result.weightKg} kg · {SIZE_CLASSES.find((c) => c.key === result.sizeClass)?.label || result.sizeClass}</Pill>
              {result.template ? <Pill tone="sand">{result.template.name}</Pill> : null}
              {result.originUnknown ? <Pill tone="red">Lieu de la boutique inconnu</Pill> : null}
            </div>

            {result.deliverable ? (
              <>
                <div className="rounded-xl bg-[#30A08B]/5 border border-[#30A08B]/20 p-4">
                  <p className="text-xs text-gray-500">Frais payés par le client</p>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums">{result.free ? "Offerte" : money(result.fee)}</p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#30A08B]" />
                    {result.delay?.label}{result.delay?.cutoff ? ` · commande avant ${result.delay.cutoff} pour le jour même` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Détail</p>
                  <ul className="divide-y divide-gray-100 text-sm">
                    {(result.breakdown || []).map((b, i) => (
                      <li key={i} className="flex justify-between gap-3 py-1.5">
                        <span className="text-gray-600">{b.label}</span>
                        <span className={`tabular-nums font-medium ${b.amount < 0 ? "text-green-600" : "text-gray-800"}`}>{b.amount < 0 ? `−${money(-b.amount)}` : money(b.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {result.free ? (
                  <p className="text-sm text-green-700 flex items-center gap-1.5"><Gift className="w-4 h-4" />{money(result.free.amount)} offerts par la plateforme ({result.free.name})</p>
                ) : null}
                {result.freeHint ? (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5"><Info className="w-4 h-4 text-gray-400" />Plus que {money(result.freeHint.remaining)} d’articles pour « {result.freeHint.name} »</p>
                ) : null}
              </>
            ) : (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                <p className="font-semibold text-red-700 flex items-center gap-2"><XCircle className="w-5 h-5" />{REASON_LABEL[result.reason] || "Non livrable"}</p>
                {result.message ? <p className="text-sm text-red-700/80 mt-1">Message client : « {result.message} »</p> : null}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
