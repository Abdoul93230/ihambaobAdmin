import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Home, Plus, X } from "lucide-react";
import { shippingV3Api } from "@/services/api";
import { Btn, Card, Pill, errMsg, inputClass } from "./shared";

const CHILD_LABEL = { region: "région", city: "ville", district: "quartier" };

/**
 * Localités saisies par les clients mais absentes de la liste (« Ma localité n’est pas dans la liste »).
 * Les plus demandées en premier ; ajout en un clic au bon endroit de l’arbre.
 */
export default function ZoneRequestsPanel({ onAdded }) {
  const [items, setItems] = useState([]);
  const [names, setNames] = useState({});
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await shippingV3Api.getZoneRequests("pending");
      setItems(r?.data || []);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (it) => {
    setBusy(it._id);
    try {
      await shippingV3Api.addZoneRequest(it._id, { name: (names[it._id] ?? it.name).trim() });
      toast.success(`« ${(names[it._id] ?? it.name).trim()} » ajoutée sous ${it.suggestedParent?.fullPath || "la zone proche"}`);
      await load();
      onAdded?.();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const ignore = async (it) => {
    setBusy(it._id);
    try {
      await shippingV3Api.setZoneRequestStatus(it._id, "ignored");
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  if (!items.length) return null;

  return (
    <Card className="border-[#B17236]/30">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Home className="w-4 h-4 text-[#B17236]" />
        <h3 className="text-sm font-semibold text-gray-800">Localités demandées par les clients</h3>
        <Pill tone="sand">{items.length}</Pill>
        <p className="text-xs text-gray-500 ml-auto hidden md:block">Ces clients ont commandé avec la ville la plus proche. Ajoutez leur localité pour les prochains.</p>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.map((it) => (
          <li key={it._id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <input
                className={`${inputClass} md:max-w-[220px]`}
                value={names[it._id] ?? it.name}
                maxLength={100}
                onChange={(e) => setNames((p) => ({ ...p, [it._id]: e.target.value }))}
                aria-label="Nom de la localité"
              />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">près de {it.nearPath}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  Ajout : {CHILD_LABEL[it.suggestedParent?.childType] || "zone"} sous {it.suggestedParent?.fullPath || "?"}
                </p>
              </div>
            </div>
            <Pill tone={it.count > 2 ? "amber" : "gray"}>{it.count} demande{it.count > 1 ? "s" : ""}</Pill>
            <div className="flex gap-1.5">
              <Btn size="sm" icon={Plus} onClick={() => add(it)} loading={busy === it._id} disabled={!it.suggestedParent}>Ajouter</Btn>
              <Btn size="sm" variant="ghost" icon={X} onClick={() => ignore(it)} disabled={busy === it._id}>Ignorer</Btn>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
