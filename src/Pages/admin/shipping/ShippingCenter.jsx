import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Calculator, Gift, Layers, Loader2, MapPin, RefreshCw, Store, Truck } from "lucide-react";
import { shippingV3Api } from "@/services/api";
import TemplatesTab from "./TemplatesTab";
import SellersTab from "./SellersTab";
import CampaignsTab from "./CampaignsTab";
import SimulatorTab from "./SimulatorTab";
import ZonesTab from "./ZonesTab";
import { Btn, errMsg } from "./shared";

const TABS = [
  { key: "templates", label: "Modèles", icon: Layers },
  { key: "sellers", label: "Boutiques", icon: Store },
  { key: "campaigns", label: "Livraison offerte", icon: Gift },
  { key: "simulator", label: "Simulateur", icon: Calculator },
  { key: "zones", label: "Zones", icon: MapPin },
];

/** Centre de livraison : tarifs, lieux d'expédition des boutiques, livraison offerte */
export default function ShippingCenter() {
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return TABS.some((x) => x.key === t) ? t : "templates";
  });
  const [zones, setZones] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simPreset, setSimPreset] = useState(null);
  const location = useLocation();

  // Lien du menu « Zones » (…?tab=zones) alors que la page est déjà ouverte
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("tab");
    if (TABS.some((x) => x.key === t)) setTab(t);
  }, [location.search]);

  const loadAll = useCallback(async () => {
    const [t, s, c] = await Promise.all([shippingV3Api.getTemplates(), shippingV3Api.getSellers(), shippingV3Api.getCampaigns()]);
    setTemplates(t?.data || []);
    setSellers(s?.data || []);
    setCampaigns(c?.data || []);
  }, []);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await loadAll();
      } catch (e) {
        if (alive) toast.error(errMsg(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    shippingV3Api.getZones().then((r) => alive && setZones(r?.data || [])).catch((e) => alive && toast.error(`Zones : ${errMsg(e)}`));
    return () => { alive = false; };
  }, [loadAll]);

  const reloadZones = useCallback(async () => {
    try {
      const r = await shippingV3Api.getZones();
      setZones(r?.data || []);
      await loadAll();
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, [loadAll]);

  const go = (key) => {
    setTab(key);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    window.history.replaceState(null, "", url);
  };

  const def = templates.find((t) => t.isDefault);
  const toLocate = sellers.filter((s) => !s.origin || s.origin.source === "country-fallback").length;
  const now = Date.now();
  const liveCampaigns = campaigns.filter((c) => c.isActive && (!c.startsAt || new Date(c.startsAt) <= now) && (!c.endsAt || new Date(c.endsAt) >= now));
  const stats = [
    { label: "Modèle par défaut", value: def?.name || "—", tone: "bg-[#30A08B]/10 text-[#1f7a69]" },
    { label: "Boutiques", value: sellers.length, tone: "bg-gray-50 text-gray-700" },
    { label: "Lieu à préciser", value: toLocate, tone: toLocate ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700" },
    { label: "Livraison offerte", value: liveCampaigns.length ? liveCampaigns.map((c) => c.name).join(", ") : "Aucune en cours", tone: liveCampaigns.length ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500" },
  ];

  return (
    <div className="flex-1 min-w-0 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
              <Truck className="w-5 h-5 text-[#30A08B]" />
              Centre de livraison
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Frais calculés selon la distance boutique → client, le poids et vos campagnes. Les changements s’appliquent en moins d’une minute.</p>
          </div>
          <Btn variant="secondary" size="sm" icon={RefreshCw} onClick={reload} loading={refreshing}>Actualiser</Btn>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`${s.tone} rounded-xl px-3 py-2.5 min-w-0`}>
              <p className="text-base font-bold truncate" title={String(s.value)}>{loading ? "…" : s.value}</p>
              <p className="text-xs mt-0.5 font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 -mb-5 -mx-5 px-5 border-t border-gray-100 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.key}
              onClick={() => go(t.key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? "border-[#30A08B] text-[#1f7a69]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : tab === "templates" ? (
        <TemplatesTab templates={templates} sellers={sellers} zones={zones} reload={reload} />
      ) : tab === "sellers" ? (
        <SellersTab sellers={sellers} templates={templates} zones={zones} reload={reload} onSimulate={(s) => { setSimPreset({ ...s }); go("simulator"); }} />
      ) : tab === "campaigns" ? (
        <CampaignsTab campaigns={campaigns} zones={zones} sellers={sellers} reload={reload} />
      ) : tab === "zones" ? (
        <ZonesTab onZonesChanged={reloadZones} />
      ) : (
        <SimulatorTab sellers={sellers} templates={templates} zones={zones} preset={simPreset} />
      )}
    </div>
  );
}
