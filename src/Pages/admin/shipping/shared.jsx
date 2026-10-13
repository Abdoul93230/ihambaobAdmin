import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Search, X } from "lucide-react";

/** Vocabulaire du moteur de livraison (identique au backend : services/shipping/constants.js) */
export const RELATIONS = [
  { key: "sameDistrict", label: "Même quartier", hint: "Boutique et client dans le même quartier" },
  { key: "sameCity", label: "Même ville", hint: "Même ville ou commune, quartier différent" },
  { key: "sameRegion", label: "Même région", hint: "Même région, ville différente" },
  { key: "otherRegion", label: "Autre région", hint: "Région différente, même pays" },
  { key: "international", label: "International", hint: "Hors du pays" },
];
export const LOCAL_RELATIONS = RELATIONS.slice(0, 3);
export const RELATION_LABEL = Object.fromEntries(RELATIONS.map((r) => [r.key, r.label]));

export const SIZE_CLASSES = [
  { key: "small", label: "Petit", hint: "≈ 0,5 kg · bijoux, vêtements, téléphones" },
  { key: "medium", label: "Moyen", hint: "≈ 2 kg · chaussures, petit électroménager" },
  { key: "large", label: "Grand", hint: "≈ 8 kg · TV, micro-ondes, gros cartons" },
  { key: "xl", label: "Très volumineux", hint: "Sur devis · meubles, frigos" },
];

export const DEST_MODES = [
  { key: "unavailable", label: "Non desservie" },
  { key: "fixed", label: "Prix fixe" },
  { key: "surcharge", label: "Supplément" },
];

export const REASON_LABEL = {
  QUOTE_REQUIRED: "Sur devis : le support contacte le client",
  ZONE_UNAVAILABLE: "Zone non desservie",
  INTERNATIONAL_UNAVAILABLE: "International non disponible",
  TOO_HEAVY: "Colis trop lourd",
  DESTINATION_UNKNOWN: "Destination inconnue",
};

const nf = new Intl.NumberFormat("fr-FR");
export const money = (n) => `${nf.format(Math.round(Number(n) || 0))} F`;
export const errMsg = (e) => e?.message || "Une erreur est survenue";
export const BRAND = "#30A08B";

export function delayText(d = {}) {
  if (d.sameDay) return "Le jour même";
  const a = Number(d.minDays) || 0;
  const b = Number(d.maxDays) || a;
  if (!a && !b) return "—";
  return a === b ? `${a} jour${a > 1 ? "s" : ""}` : `${a} à ${b} jours`;
}

// ─── Petits éléments d'interface ─────────────────────────────────────────────

export function Card({ className = "", children }) {
  return <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>{children}</div>;
}

export function SectionTitle({ icon: Icon, title, hint, right }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          {Icon ? <Icon className="w-4 h-4 text-[#30A08B]" /> : null}
          {title}
        </h3>
        {hint ? <p className="text-xs text-gray-500 mt-0.5">{hint}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Pill({ tone = "gray", children, className = "" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-600",
    brand: "bg-[#30A08B]/10 text-[#1f7a69]",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    sand: "bg-[#B2905F]/15 text-[#7d6238]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Btn({ variant = "primary", size = "md", icon: Icon, loading, className = "", children, ...props }) {
  const variants = {
    primary: "bg-[#30A08B] text-white hover:bg-[#278a77] disabled:bg-[#30A08B]/50",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50",
    ghost: "text-gray-600 hover:bg-gray-100 disabled:opacity-50",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50",
  };
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm" };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} /> : null}
      {children}
    </button>
  );
}

const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#30A08B] focus:ring-2 focus:ring-[#30A08B]/15 disabled:bg-gray-50";
export const inputClass = inputCls;

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span> : null}
      {children}
      {hint ? <span className="block text-[11px] text-gray-400 mt-1">{hint}</span> : null}
    </label>
  );
}

/** Champ montant en francs CFA (entier ≥ 0) */
export function MoneyInput({ value, onChange, disabled, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="number"
        min={0}
        step={50}
        inputMode="numeric"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Math.max(0, Math.round(Number(e.target.value))))}
        className={`${inputCls} pr-8 text-right tabular-nums`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">F</span>
    </div>
  );
}

export function NumberInput({ value, onChange, min = 0, max, step = 1, suffix, disabled, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value === "") return onChange(min);
          let v = Number(e.target.value);
          if (Number.isNaN(v)) return;
          if (max !== undefined) v = Math.min(max, v);
          onChange(Math.max(min, v));
        }}
        className={`${inputCls} ${suffix ? "pr-10" : ""} text-right tabular-nums`}
      />
      {suffix ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suffix}</span> : null}
    </div>
  );
}

export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 disabled:opacity-50"
    >
      <span className={`relative inline-block w-9 h-5 rounded-full transition-colors ${checked ? "bg-[#30A08B]" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
      {label ? <span className="text-sm text-gray-700">{label}</span> : null}
    </button>
  );
}

export function Modal({ open, onClose, title, subtitle, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onMouseDown={onClose}>
      <div
        className={`bg-white w-full ${wide ? "sm:max-w-5xl" : "sm:max-w-lg"} rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-800">{title}</h2>
            {subtitle ? <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer ? <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, title, hint, action }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon ? <Icon className="w-10 h-10 text-gray-300 mx-auto mb-3" /> : null}
      <p className="text-gray-600 font-medium">{title}</p>
      {hint ? <p className="text-gray-400 text-sm mt-1">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

// ─── Sélecteur de zone (recherche dans tout l'arbre) ─────────────────────────

const TYPE_LABEL = { country: "Pays", region: "Région", city: "Ville", district: "Quartier" };
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * @param zones   liste complète (GET /shipping-v3/zones)
 * @param types   restreint les types sélectionnables (ex. ["region"])
 * @param multiple sélection multiple : value = tableau d'identifiants
 */
export function ZonePicker({ zones = [], value, onChange, types, placeholder = "Choisir une zone…", multiple = false, allowClear = true, disabled }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  const byId = useMemo(() => new Map(zones.map((z) => [String(z._id), z])), [zones]);
  const selected = multiple ? (value || []).map(String) : value ? [String(value)] : [];

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const options = useMemo(() => {
    const nq = norm(q);
    return zones
      .filter((z) => !types || types.includes(z.type))
      .filter((z) => !nq || norm([z.fullPath || z.name, ...(z.aliases || [])].join(" ")).includes(nq))
      .slice(0, 80);
  }, [zones, types, q]);

  const pick = (id) => {
    if (multiple) {
      onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
    } else {
      onChange(id);
      setOpen(false);
      setQ("");
    }
  };

  const label = (id) => byId.get(id)?.fullPath || byId.get(id)?.name || "Zone inconnue";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls} flex items-center gap-2 text-left min-h-[38px]`}
      >
        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="flex-1 min-w-0 flex flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="text-gray-400 truncate">{placeholder}</span>
          ) : multiple ? (
            selected.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 bg-gray-100 rounded-md px-1.5 py-0.5 text-xs">
                {byId.get(id)?.name || "?"}
                <X className="w-3 h-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); pick(id); }} />
              </span>
            ))
          ) : (
            <span className="truncate">{label(selected[0])}</span>
          )}
        </span>
        {!multiple && allowClear && selected.length ? (
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); onChange(null); }} />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open ? (
        <div className="absolute z-40 mt-1 w-full min-w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (ex. Plateau, Maradi)…" className="flex-1 text-sm outline-none" />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {zones.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Chargement des zones…</p>
            ) : options.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400">Aucune zone trouvée</p>
            ) : (
              options.map((z) => {
                const id = String(z._id);
                const on = selected.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => pick(id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${on ? "bg-[#30A08B]/5" : ""}`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-gray-800">{z.name}</span>
                      <span className="block truncate text-[11px] text-gray-400">{z.fullPath}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">{TYPE_LABEL[z.type] || z.type}</span>
                    {on ? <Check className="w-4 h-4 text-[#30A08B]" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
