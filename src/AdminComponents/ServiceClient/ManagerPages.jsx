import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Store, MessageSquare, Package, Check, X, Search, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { staffApi, errMsg, fcfa } from "./staffApi";

const STATUS = {
  Attente: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  Published: { label: "Publié", cls: "bg-green-50 text-green-700 border-green-200" },
  Refuser: { label: "Refusé", cls: "bg-red-50 text-red-700 border-red-200" },
  UnPublished: { label: "Dépublié", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

function Pager({ page, pages, setPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 py-4 text-sm">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-lg border disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
      <span className="text-gray-600">Page {page} / {pages}</span>
      <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="p-1.5 rounded-lg border disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
}

// ─── Mes boutiques ─────────────────────────────────────────────────────────────
export function MesBoutiques() {
  const [rows, setRows] = useState(null);
  useEffect(() => { staffApi.sellers().then(setRows).catch(() => setRows([])); }, []);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes boutiques</h1>
        <p className="text-sm text-gray-500">Les boutiques dont vous gérez la relation client et la modération.</p>
      </div>
      {rows === null ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-sm text-gray-500">Aucune boutique ne vous est encore affectée. Contactez l'administrateur.</div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                {s.logo ? <img src={s.logo} alt="" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><Store className="w-5 h-5 text-gray-400" /></div>}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.city || "—"} {!s.active ? "· inactive" : ""}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link to="/Admin/ServiceClient" className={`rounded-xl px-3 py-2.5 ${s.openConversations ? "bg-orange-50" : "bg-gray-50"}`}>
                  <p className="flex items-center gap-1.5 text-lg font-bold text-gray-900"><MessageSquare className="w-4 h-4 text-gray-400" />{s.openConversations}</p>
                  <p className="text-[11px] text-gray-500">client(s) à répondre</p>
                </Link>
                <Link to={`/Admin/ModerationProduits?seller=${s.id}`} className={`rounded-xl px-3 py-2.5 ${s.pendingProducts ? "bg-amber-50" : "bg-gray-50"}`}>
                  <p className="flex items-center gap-1.5 text-lg font-bold text-gray-900"><Package className="w-4 h-4 text-gray-400" />{s.pendingProducts}</p>
                  <p className="text-[11px] text-gray-500">produit(s) à modérer</p>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modération des produits ───────────────────────────────────────────────────
function ProductRow({ p, onDone }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [img, setImg] = useState(0);
  const act = async (published) => {
    setBusy(true);
    try {
      const r = await staffApi.moderate(p.id, { published, comments: comment });
      onDone({ ...p, status: r.status, comments: r.comments });
      setRefusing(false);
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const st = STATUS[p.status] || STATUS.Attente;
  return (
    <div className="bg-white rounded-2xl border p-4 flex flex-col sm:flex-row gap-4">
      <div className="sm:w-40 shrink-0">
        {p.images.length ? <img src={p.images[img]} alt="" className="w-full aspect-square rounded-xl object-cover bg-gray-50" /> : <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}
        {p.images.length > 1 ? (
          <div className="flex gap-1 mt-1.5">{p.images.map((u, i) => <img key={u} src={u} alt="" onClick={() => setImg(i)} className={`w-9 h-9 rounded-md object-cover cursor-pointer ${i === img ? "ring-2 ring-teal-500" : ""}`} />)}</div>
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{p.name}</p>
            <p className="text-xs text-teal-700">{p.seller.name}</p>
          </div>
          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
        </div>
        <p className="text-sm mt-1">
          <span className="font-bold text-gray-900">{fcfa(p.promoPrice > 0 && p.promoPrice < p.price ? p.promoPrice : p.price)}</span>
          {p.promoPrice > 0 && p.promoPrice < p.price ? <span className="text-xs text-gray-400 line-through ml-2">{fcfa(p.price)}</span> : null}
          <span className="text-xs text-gray-500 ml-3">Stock : {p.stock ?? "—"}</span>
        </p>
        {p.description ? <p className="text-xs text-gray-600 mt-2 line-clamp-3">{String(p.description).replace(/<[^>]+>/g, " ")}</p> : null}
        {p.comments && p.comments !== "Aucun commentaire" ? <p className="text-xs text-gray-500 mt-2 italic">Dernier commentaire : {p.comments}</p> : null}
        {refusing ? (
          <div className="mt-3 space-y-2">
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Motif du refus (visible par le vendeur) : photos floues, prix incohérent…" className="w-full text-sm border rounded-lg px-3 py-2" />
            <div className="flex gap-2">
              <button onClick={() => setRefusing(false)} className="px-3 py-1.5 text-xs rounded-lg border">Annuler</button>
              <button disabled={busy || !comment.trim()} onClick={() => act("Refuser")} className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white font-semibold disabled:opacity-40">Confirmer le refus</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-3">
            {p.status !== "Published" ? (
              <button disabled={busy} onClick={() => act("Published")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white font-semibold disabled:opacity-40"><Check className="w-3.5 h-3.5" /> Publier</button>
            ) : (
              <button disabled={busy} onClick={() => act("UnPublished")} className="px-3 py-1.5 text-xs rounded-lg border font-medium">Dépublier</button>
            )}
            {p.status !== "Refuser" ? <button disabled={busy} onClick={() => setRefusing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 font-medium"><X className="w-3.5 h-3.5" /> Refuser</button> : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModerationProduits() {
  const initialSeller = new URLSearchParams(window.location.search).get("seller") || "";
  const [sellers, setSellers] = useState([]);
  const [sellerId, setSellerId] = useState(initialSeller);
  const [status, setStatus] = useState("Attente");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => { staffApi.sellers().then(setSellers).catch(() => {}); }, []);
  const load = useCallback(async () => {
    setData(null);
    try {
      setData(await staffApi.products({ sellerId: sellerId || undefined, status: status || undefined, search: search.trim() || undefined, page, limit: 20 }));
    } catch {
      setData({ data: [], total: 0 });
    }
  }, [sellerId, status, search, page]);
  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t); }, [load, search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Modération des produits</h1>
        <p className="text-sm text-gray-500">Vérifiez photos, prix et description avant publication. Un refus doit toujours expliquer quoi corriger.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={sellerId} onChange={(e) => { setSellerId(e.target.value); setPage(1); }} className="text-sm border rounded-lg px-3 py-2 bg-white">
          <option value="">Toutes mes boutiques</option>
          {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}{s.pendingProducts ? ` (${s.pendingProducts})` : ""}</option>)}
        </select>
        <div className="flex gap-1">
          {[["Attente", "En attente"], ["Published", "Publiés"], ["Refuser", "Refusés"], ["", "Tous"]].map(([k, l]) => (
            <button key={k} onClick={() => { setStatus(k); setPage(1); }} className={`text-xs px-3 py-2 rounded-lg font-medium ${status === k ? "bg-gray-900 text-white" : "bg-white border text-gray-600"}`}>{l}</button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Nom du produit" className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg" />
        </div>
      </div>
      {data === null ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : data.data.length === 0 ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-sm text-gray-500">{status === "Attente" ? "✅ Aucun produit en attente de modération." : "Aucun produit."}</div>
      ) : (
        <>
          <p className="text-xs text-gray-500">{data.total} produit(s)</p>
          <div className="space-y-3">
            {data.data.map((p) => <ProductRow key={p.id} p={p} onDone={(u) => setData((d) => ({ ...d, data: d.data.map((x) => (x.id === u.id ? u : x)) }))} />)}
          </div>
          <Pager page={page} pages={Math.ceil(data.total / 20)} setPage={setPage} />
        </>
      )}
    </div>
  );
}

// ─── Commandes (lecture) ───────────────────────────────────────────────────────
export function ManagerOrders() {
  const [sellers, setSellers] = useState([]);
  const [sellerId, setSellerId] = useState("");
  const [reference, setReference] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  useEffect(() => { staffApi.sellers().then(setSellers).catch(() => {}); }, []);
  useEffect(() => {
    setData(null);
    const t = setTimeout(() => staffApi.orders({ sellerId: sellerId || undefined, reference: reference.trim() || undefined, page, limit: 30 })
      .then(setData).catch(() => setData({ data: [], total: 0 })), reference ? 400 : 0);
    return () => clearTimeout(t);
  }, [sellerId, reference, page]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Commandes de mes boutiques</h1>
        <p className="text-sm text-gray-500">Pour répondre aux clients sur le suivi de leurs commandes.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={sellerId} onChange={(e) => { setSellerId(e.target.value); setPage(1); }} className="text-sm border rounded-lg px-3 py-2 bg-white">
          <option value="">Toutes mes boutiques</option>
          {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input value={reference} onChange={(e) => { setReference(e.target.value); setPage(1); }} placeholder="Référence exacte" className="text-sm border rounded-lg px-3 py-2" />
      </div>
      {data === null ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr><th className="text-left px-4 py-2.5">Référence</th><th className="text-left px-4 py-2.5">Client</th><th className="text-left px-4 py-2.5">Boutique</th><th className="text-right px-4 py-2.5">Total</th><th className="text-left px-4 py-2.5">État</th><th className="text-left px-4 py-2.5">Paiement</th><th className="text-left px-4 py-2.5">Date</th></tr>
            </thead>
            <tbody className="divide-y">
              {data.data.length === 0 ? <tr><td colSpan={7} className="text-center text-gray-500 py-8">Aucune commande.</td></tr> : data.data.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{o.reference}</td>
                  <td className="px-4 py-2.5">{o.client}</td>
                  <td className="px-4 py-2.5 text-teal-700">{o.stores.join(", ")}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{fcfa(o.total)}</td>
                  <td className="px-4 py-2.5">{o.status}</td>
                  <td className="px-4 py-2.5">{o.payment}</td>
                  <td className="px-4 py-2.5 text-gray-500">{o.date ? new Date(o.date).toLocaleDateString("fr-FR") : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={page} pages={Math.ceil(data.total / 30)} setPage={setPage} />
        </div>
      )}
    </div>
  );
}
