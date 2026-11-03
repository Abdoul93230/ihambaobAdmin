import React, { useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, CheckCircle2, Clock, Store, Truck } from "lucide-react";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const TYPE_LABEL = {
  created: "Commande passée",
  paid: "Paiement confirmé",
  payment_failed: "Paiement non abouti",
  expired: "Annulée automatiquement (paiement non reçu)",
  accepted: "Acceptée par la boutique",
  picked_up: "Colis remis au livreur",
  in_delivery: "En cours de livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  processing: "En préparation",
  reactivated: "Commande rétablie (paiement tardif)",
  status: "Changement d'état",
};
const WHO = { client: "Client", seller: "Boutique", admin: "Équipe", courier: "Livreur", system: "Automatique", ipay: "iPay" };
const when = (d) => new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Journal d'une commande (qui a fait quoi, quand) + état des remises. Les codes ne sont jamais affichés. */
export default function OrderJournal({ orderId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    axios.get(`${BackendUrl}/api/courier/admin/orders/${orderId}/trace`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || "Journal indisponible"));
  }, [orderId]);

  if (error) return <p className="text-sm text-gray-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-5 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Traçabilité</h3>

      {data.needsReview ? (
        <div className="flex gap-2 p-3 rounded bg-orange-50 border border-orange-200 text-sm text-orange-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {data.reviewReason}
        </div>
      ) : null}

      {data.cancel ? (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-800">
          <strong>Annulée :</strong> {data.cancel.label} · par {data.cancel.by}{data.cancel.note ? ` — ${data.cancel.note}` : ""}
        </div>
      ) : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Remises</p>
        <ul className="space-y-1.5 text-sm">
          {data.handover.stores.map((s) => (
            <li key={s.storeId} className="flex items-center gap-2">
              <Store className="w-4 h-4 text-gray-400" />
              <span className="flex-1">{s.storeName || "Boutique"}</span>
              {s.pickedUpAt ? (
                <span className="text-emerald-700">Retiré {when(s.pickedUpAt)} · {s.courier?.name} ({s.courier?.phone})</span>
              ) : (
                <span className="text-gray-500">En attente du livreur{s.attempts ? ` · ${s.attempts} code(s) faux` : ""}</span>
              )}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400" />
            <span className="flex-1">Client</span>
            {data.handover.deliveredAt ? (
              <span className="text-emerald-700">Livré {when(data.handover.deliveredAt)} · {data.handover.deliveredBy?.name} · code client vérifié</span>
            ) : (
              <span className="text-gray-500">Pas encore livré{data.handover.deliveryAttempts ? ` · ${data.handover.deliveryAttempts} code(s) faux` : ""}</span>
            )}
          </li>
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Journal</p>
        {data.history.length ? (
          <ol className="relative border-l border-gray-200 ml-2 space-y-3">
            {data.history.map((e, i) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-[7px] mt-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-teal-500" />
                <p className="text-sm text-gray-900 flex items-center gap-1.5">
                  {e.type === "delivered" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : null}
                  {TYPE_LABEL[e.type] || e.type}
                </p>
                <p className="text-xs text-gray-500">
                  <Clock className="w-3 h-3 inline -mt-0.5 mr-1" />
                  {when(e.at)} · {WHO[e.by?.kind] || ""}{e.by?.name && e.by.kind !== "client" ? ` ${e.by.name}` : ""}{e.by?.phone ? ` (${e.by.phone})` : ""}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gray-500">Aucun événement (commande passée avant la mise en place du journal).</p>
        )}
      </div>
    </div>
  );
}
