import React, { useEffect, useState } from "react";
import axios from "axios";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Rocket } from "lucide-react";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const STEP_LABELS = {
  product_view: "A vu un article",
  add_to_cart: "A ajouté au panier",
  begin_checkout: "A commencé la commande",
  payment_start: "A ouvert le paiement en ligne",
  purchase: "A commandé",
};
const PLATFORMS = [
  { key: "android", label: "App Android" },
  { key: "ios", label: "App iPhone" },
  { key: "web", label: "Site" },
];
const F = (n) => `${Math.round(Number(n) || 0).toLocaleString("fr-FR")} F`;
const N = (n) => (Number(n) || 0).toLocaleString("fr-FR");

function Kpi({ label, value, hint }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-gray-500 mt-1">{hint}</p> : null}
    </div>
  );
}

/** Tunnel d'une plateforme : barres proportionnelles au 1er palier, avec le taux de passage */
function Funnel({ label, data }) {
  const first = data?.steps?.[0]?.visitors || 0;
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <span className="text-xs text-gray-500">{N(data?.opens)} ouvertures</span>
      </div>
      {!first ? (
        <p className="text-sm text-gray-500">Pas encore de données sur cette période.</p>
      ) : (
        <div className="space-y-2">
          {data.steps.map((s, i) => {
            const prev = i ? data.steps[i - 1].visitors : s.visitors;
            const pct = first ? (s.visitors / first) * 100 : 0;
            return (
              <div key={s.name}>
                <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                  <span>{STEP_LABELS[s.name]}</span>
                  <span className="tabular-nums">
                    {N(s.visitors)}
                    {i > 0 && prev ? <span className="text-gray-400"> · {Math.round((s.visitors / prev) * 100)} %</span> : null}
                  </span>
                </div>
                <div className="h-2.5 rounded bg-gray-100 overflow-hidden">
                  <div className="h-full rounded bg-teal-600" style={{ width: `${Math.max(pct, s.visitors ? 2 : 0)}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-gray-500 pt-1">
            Conversion : <b className="text-gray-800">{data.conversion} %</b> des visiteurs d'un article commandent
            {data.averageOrder ? <> · panier moyen {F(data.averageOrder)}</> : null}
          </p>
        </div>
      )}
    </div>
  );
}

/** Croissance : tunnel d'achat (app + site), commandes réelles, réachat, sources */
export default function Croissance() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    axios
      .get(`${BackendUrl}/api/events/funnel`, { params: { days } })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || "Chargement impossible"));
  }, [days]);

  const o = data?.orders;
  const rep = data?.repeat30;

  return (
    <div className="p-4 md:p-6 max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Rocket className="w-6 h-6 text-teal-600" /> Croissance</h1>
          <p className="text-sm text-gray-500 mt-1">Ce que font les clients, de la fiche produit à la commande. Mesuré depuis la mise à jour de l'app et du site.</p>
        </div>
        <div className="flex rounded-lg border bg-white overflow-hidden text-sm">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 ${days === d ? "bg-teal-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}>
              {d} jours
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!data && !error ? <p className="text-sm text-gray-500">Chargement…</p> : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Commandes" value={N(o.count)} hint={`${N(o.clients)} clients différents`} />
            <Kpi label="Chiffre d'affaires" value={F(o.revenue)} hint="Hors annulées et commandes non payées" />
            <Kpi label="Panier moyen" value={F(o.averageOrder)} />
            <Kpi
              label="Réachat à 30 jours"
              value={rep.rate === null ? "—" : `${rep.rate} %`}
              hint={rep.cohort ? `${N(rep.repeaters)} sur ${N(rep.cohort)} nouveaux clients ont recommandé` : "Il faut des clients dont la 1re commande a plus de 30 jours"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {PLATFORMS.map((p) => <Funnel key={p.key} label={p.label} data={data.funnel[p.key]} />)}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Visiteurs par jour</h3>
            {data.daily.length ? (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={data.daily} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="#eef0f2" vertical={false} />
                    <XAxis dataKey="day" tickFormatter={(d) => d.slice(5).split("-").reverse().join("/")} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="app_open" name="Ouvertures de l'app" stroke="#B2905F" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="product_view" name="Ont vu un article" stroke="#30A08B" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="add_to_cart" name="Ont ajouté au panier" stroke="#B17236" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="purchase" name="Ont commandé" stroke="#1f2937" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Pas encore de données : elles arrivent avec la nouvelle version de l'app et du site.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-1">D'où viennent les visiteurs</h3>
            <p className="text-xs text-gray-500 mb-3">Liens de parrainage (?ref=…) et liens de campagne (?utm_source=…)</p>
            {data.sources.length ? (
              <table className="w-full text-sm">
                <tbody>
                  {data.sources.map((s) => (
                    <tr key={s.source} className="border-t">
                      <td className="py-2 text-gray-800">{s.source}</td>
                      <td className="py-2 text-right tabular-nums text-gray-600">{N(s.visitors)} visiteurs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">Aucun visiteur arrivé par un lien suivi sur cette période.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
