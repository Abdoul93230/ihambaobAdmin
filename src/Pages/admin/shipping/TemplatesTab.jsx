import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Copy, Layers, Pencil, Plus, Star, Store, Trash2 } from "lucide-react";
import { shippingV3Api } from "@/services/api";
import TemplateEditor from "./TemplateEditor";
import { Btn, Card, Empty, Modal, Pill, RELATIONS, delayText, errMsg, money } from "./shared";

function TemplateCard({ t, ownerName, onEdit, onDuplicate, onDefault, onDelete, busy }) {
  const usage = t.isDefault ? "Toutes les boutiques sans modèle attribué" : t.sellerCount ? `${t.sellerCount} boutique${t.sellerCount > 1 ? "s" : ""}` : "Aucune boutique";
  return (
    <Card className={`p-4 flex flex-col ${t.isActive ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-semibold text-gray-800 truncate">{t.name}</h3>
            {t.isDefault ? <Pill tone="amber"><Star className="w-3 h-3" />Par défaut</Pill> : null}
            {t.kind === "custom" ? <Pill tone="sand"><Store className="w-3 h-3" />{ownerName || "Boutique"}</Pill> : null}
            {!t.isActive ? <Pill tone="red">Désactivé</Pill> : null}
          </div>
          {t.description ? <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p> : null}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        {RELATIONS.map((r) => {
          const rel = t.relations?.[r.key] || {};
          const off = r.key === "international" ? rel.available !== true : rel.available === false;
          return (
            <div key={r.key} className="contents">
              <dt className="text-gray-500 truncate">{r.label}</dt>
              <dd className={`text-right tabular-nums ${off ? "text-gray-400" : "text-gray-800 font-medium"}`}>
                {off ? "Non desservi" : `${money(rel.baseFee)} · ${delayText(rel.delay)}`}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-gray-500">
        <Pill>Kilo sup. {money(t.extraPerKgByClass?.small)} / {money(t.extraPerKgByClass?.medium)} / {money(t.extraPerKgByClass?.large)}</Pill>
        <Pill>Limite {t.sameDayCutoff || "18:30"}</Pill>
        {t.areaRates?.length ? <Pill tone="blue">{t.areaRates.length} tarif{t.areaRates.length > 1 ? "s" : ""} local{t.areaRates.length > 1 ? "aux" : ""}</Pill> : null}
        {t.regionRoutes?.length ? <Pill tone="blue">{t.regionRoutes.length} trajet{t.regionRoutes.length > 1 ? "s" : ""}</Pill> : null}
        {t.destinationRules?.length ? <Pill tone="blue">{t.destinationRules.length} règle{t.destinationRules.length > 1 ? "s" : ""}</Pill> : null}
      </div>

      <p className="text-xs text-gray-400 mt-3">Utilisé par : <span className="text-gray-600">{usage}</span></p>

      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
        <Btn size="sm" icon={Pencil} onClick={onEdit}>Modifier</Btn>
        <Btn size="sm" variant="secondary" icon={Copy} onClick={onDuplicate} disabled={busy}>Dupliquer</Btn>
        {!t.isDefault && t.kind === "platform" && t.isActive ? <Btn size="sm" variant="ghost" icon={Star} onClick={onDefault} disabled={busy}>Par défaut</Btn> : null}
        {!t.isDefault ? <Btn size="sm" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50 ml-auto" onClick={onDelete} disabled={busy}>Supprimer</Btn> : null}
      </div>
    </Card>
  );
}

export default function TemplatesTab({ templates, sellers, zones, reload }) {
  const [editing, setEditing] = useState(null); // { template?, seed? }
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const owners = useMemo(() => new Map(sellers.map((s) => [String(s._id), s.storeName])), [sellers]);
  const platform = templates.filter((t) => t.kind !== "custom");
  const custom = templates.filter((t) => t.kind === "custom");
  const def = templates.find((t) => t.isDefault);

  const run = async (fn, ok) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const seedFrom = (t) => {
    if (!t) return {};
    const { _id, code, isDefault, kind, ownerSellerId, sellerCount, createdAt, updatedAt, ...rest } = t;
    return { ...rest, name: "", description: "" };
  };

  const renderGrid = (list) => (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {list.map((t) => (
        <TemplateCard
          key={t._id}
          t={t}
          busy={busy}
          ownerName={owners.get(String(t.ownerSellerId))}
          onEdit={() => setEditing({ template: t })}
          onDuplicate={() => run(() => shippingV3Api.duplicateTemplate(t._id), "Modèle dupliqué")}
          onDefault={() => run(() => shippingV3Api.setDefaultTemplate(t._id), `« ${t.name} » est maintenant le modèle par défaut`)}
          onDelete={() => setConfirm(t)}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 max-w-2xl">
          Un modèle regroupe tous les tarifs. Chaque boutique utilise le modèle par défaut, sauf si vous lui en attribuez un autre
          (onglet Boutiques) ou si vous le personnalisez pour elle.
        </p>
        <Btn icon={Plus} onClick={() => setEditing({ seed: seedFrom(def) })}>Nouveau modèle</Btn>
      </div>

      {platform.length ? renderGrid(platform) : <Card><Empty icon={Layers} title="Aucun modèle" hint="Le modèle « Standard Niger » se crée automatiquement au démarrage du serveur." /></Card>}

      {custom.length ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Modèles personnalisés de boutiques</h3>
          {renderGrid(custom)}
        </div>
      ) : null}

      {editing ? (
        <TemplateEditor
          open
          template={editing.template}
          seed={editing.seed}
          zones={zones}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await reload(); }}
        />
      ) : null}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Supprimer ce modèle ?"
        footer={(
          <>
            <Btn variant="secondary" onClick={() => setConfirm(null)}>Annuler</Btn>
            <Btn
              variant="danger"
              icon={Trash2}
              loading={busy}
              onClick={() => run(async () => { await shippingV3Api.deleteTemplate(confirm._id); setConfirm(null); }, "Modèle supprimé")}
            >
              Supprimer
            </Btn>
          </>
        )}
      >
        <p className="text-sm text-gray-600">
          « {confirm?.name} » sera supprimé. {confirm?.sellerCount ? `Les ${confirm.sellerCount} boutique(s) qui l’utilisent` : "Les boutiques et produits qui l’utilisent"} reviendront
          automatiquement au modèle par défaut{def ? ` (« ${def.name} »)` : ""}.
        </p>
      </Modal>
    </div>
  );
}
