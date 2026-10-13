import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Check, Loader2, Package, Search } from "lucide-react";
import { shippingV3Api } from "@/services/api";
import { Btn, Card, Empty, Pill, SIZE_CLASSES, errMsg, inputClass } from "./shared";

const ICON = { small: "👕", medium: "👟", large: "📺", xl: "🛋️" };

/**
 * Tailles des produits par type : combien en ont une, et attribution en masse
 * (ex. tous les « Réfrigérateurs » → Très volumineux). Les vendeurs peuvent ensuite ajuster.
 */
export default function ProductsSizeTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [size, setSize] = useState("small");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await shippingV3Api.getSizeOverview();
      setRows(r?.data || []);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => rows.reduce((t, r) => ({
    total: t.total + r.total, missing: t.missing + r.missing, noWeight: t.noWeight + r.noWeight, xl: t.xl + r.bySize.xl,
  }), { total: 0, missing: 0, noWeight: 0, xl: 0 }), [rows]);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter((r) => (showDone || r.missing > 0) && (!n || `${r.categoryName} ${r.typeName}`.toLowerCase().includes(n)));
  }, [rows, q, showDone]);

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allOn = list.length > 0 && list.every((r) => selected.has(r.typeId));
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(list.map((r) => r.typeId).filter(Boolean)));
  const affected = list.filter((r) => selected.has(r.typeId)).reduce((s, r) => s + (onlyMissing ? r.missing : r.total), 0);

  const apply = async () => {
    if (!selected.size) return toast.info("Cochez au moins un type de produit.");
    setBusy(true);
    try {
      const r = await shippingV3Api.bulkSetSize({ typeIds: [...selected], sizeClass: size, onlyMissing });
      toast.success(`${r?.data?.updated ?? 0} produit(s) mis à jour`);
      setSelected(new Set());
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Produits", totals.total, "text-gray-800"],
          ["Sans taille", totals.missing, totals.missing ? "text-amber-700" : "text-green-700"],
          ["Sans poids", totals.noWeight, totals.noWeight ? "text-amber-700" : "text-green-700"],
          ["Sur devis (très volumineux)", totals.xl, "text-gray-800"],
        ].map(([label, value, tone]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl px-3 py-2.5">
            <p className={`text-lg font-bold ${tone}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500 max-w-3xl">
        Un produit sans taille ni poids est compté comme « Petit, 0,5 kg ». Attribuez une taille par type de produit
        (ex. Réfrigérateurs → Très volumineux) ; les vendeurs peuvent ensuite l’ajuster produit par produit.
      </p>

      <Card>
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputClass} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une catégorie ou un type…" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" className="accent-[#30A08B]" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
            Afficher aussi les types complets
          </label>
        </div>

        {selected.size > 0 ? (
          <div className="px-4 py-3 bg-[#30A08B]/5 border-b border-[#30A08B]/20 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{selected.size} type(s) · {affected} produit(s)</span>
            <div className="flex gap-1">
              {SIZE_CLASSES.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setSize(c.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${size === c.key ? "bg-[#30A08B] text-white border-[#30A08B]" : "bg-white text-gray-600 border-gray-200"}`}
                >
                  {ICON[c.key]} {c.label}
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
              <input type="checkbox" className="accent-[#30A08B]" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
              Seulement les produits sans taille
            </label>
            <Btn size="sm" icon={Check} onClick={apply} loading={busy} className="ml-auto">Appliquer</Btn>
          </div>
        ) : null}

        {list.length === 0 ? (
          <Empty icon={Package} title={rows.length ? "Tous les produits ont une taille" : "Aucun produit"} hint={rows.length ? "Cochez « Afficher aussi les types complets » pour tout revoir." : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 w-10"><input type="checkbox" className="accent-[#30A08B]" checked={allOn} onChange={toggleAll} aria-label="Tout sélectionner" /></th>
                  <th className="text-left font-medium px-3 py-2">Catégorie › Type</th>
                  <th className="text-right font-medium px-3 py-2">Produits</th>
                  <th className="text-left font-medium px-3 py-2">Tailles</th>
                  <th className="text-right font-medium px-3 py-2">Sans taille</th>
                  <th className="text-right font-medium px-3 py-2">Sans poids</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((r) => (
                  <tr key={r.typeId || "none"} className={`hover:bg-gray-50/70 ${selected.has(r.typeId) ? "bg-[#30A08B]/5" : ""}`}>
                    <td className="px-4 py-2.5">
                      {r.typeId ? <input type="checkbox" className="accent-[#30A08B]" checked={selected.has(r.typeId)} onChange={() => toggle(r.typeId)} aria-label={r.typeName} /> : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-gray-400">{r.categoryName} › </span>
                      <span className="font-medium text-gray-800">{r.typeName}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.total}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {SIZE_CLASSES.filter((c) => r.bySize[c.key]).map((c) => <Pill key={c.key} tone={c.key === "xl" ? "sand" : "brand"}>{ICON[c.key]} {r.bySize[c.key]}</Pill>)}
                        {!SIZE_CLASSES.some((c) => r.bySize[c.key]) ? <span className="text-xs text-gray-400">—</span> : null}
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${r.missing ? "text-amber-700 font-medium" : "text-gray-400"}`}>{r.missing}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${r.noWeight ? "text-amber-700" : "text-gray-400"}`}>{r.noWeight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
