import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Wallet,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Phone,
  Building,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const STATUT_LABELS = {
  EN_ATTENTE: { label: "En attente", color: "yellow", icon: Clock },
  APPROUVE: { label: "Approuvé", color: "blue", icon: CheckCircle },
  TRAITE: { label: "Traité", color: "green", icon: CheckCircle },
  REJETE: { label: "Rejeté", color: "red", icon: XCircle },
  ANNULE: { label: "Annulé", color: "gray", icon: XCircle },
  EXPIRE: { label: "Expiré", color: "gray", icon: AlertTriangle },
};

const METHODE_LABELS = {
  MOBILE_MONEY: "Mobile Money",
  VIREMENT_BANCAIRE: "Virement bancaire",
  ESPECES: "Espèces",
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(amount || 0);

const formatDate = (date) =>
  date ? new Date(date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";

const StatutBadge = ({ statut }) => {
  const info = STATUT_LABELS[statut] || { label: statut, color: "gray", icon: AlertTriangle };
  const Icon = info.icon;
  const colors = {
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[info.color]}`}>
      <Icon className="h-3 w-3" />
      {info.label}
    </span>
  );
};

const RetraitManagement = () => {
  const [retraits, setRetraits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statutFilter, setStatutFilter] = useState("EN_ATTENTE");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selected, setSelected] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { retrait, action: 'APPROUVE'|'REJETE'|'TRAITE'|'ANNULE' }
  const [commentaire, setCommentaire] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchRetraits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit: 15 };
      if (statutFilter !== "ALL") params.statut = statutFilter;
      if (searchTerm) params.sellerId = searchTerm;

      const res = await axios.get(`${BackendUrl}/adminf/finances/retraits`, { params });
      setRetraits(res.data.data.retraits || []);
      setPagination(res.data.data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      setError("Erreur lors du chargement des retraits");
    } finally {
      setIsLoading(false);
    }
  }, [page, statutFilter, searchTerm]);

  useEffect(() => {
    fetchRetraits();
  }, [fetchRetraits]);

  const handleAction = async () => {
    if (!actionModal) return;
    setIsSubmitting(true);
    try {
      await axios.put(`${BackendUrl}/adminf/finances/retraits/${actionModal.retrait._id}/status`, {
        statut: actionModal.action,
        commentaire,
      });
      setSuccessMsg(`Retrait ${STATUT_LABELS[actionModal.action]?.label || actionModal.action} avec succès`);
      setActionModal(null);
      setCommentaire("");
      setSelected(null);
      fetchRetraits();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'action");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAction = (retrait, action) => {
    setActionModal({ retrait, action });
    setCommentaire("");
  };

  const actionConfig = {
    APPROUVE: { label: "Approuver", color: "bg-blue-600 hover:bg-blue-700", confirm: "Approuver ce retrait ?" },
    TRAITE: { label: "Marquer traité", color: "bg-green-600 hover:bg-green-700", confirm: "Confirmer que ce retrait a été effectué ?" },
    REJETE: { label: "Rejeter", color: "bg-red-600 hover:bg-red-700", confirm: "Rejeter ce retrait ?" },
    ANNULE: { label: "Annuler", color: "bg-gray-600 hover:bg-gray-700", confirm: "Annuler ce retrait ?" },
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-7 w-7 text-indigo-600" />
          Gestion des Retraits
        </h1>
        <button
          onClick={fetchRetraits}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center bg-white border rounded-xl p-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par ID vendeur..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select
          value={statutFilter}
          onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="ALL">Tous les statuts</option>
          {Object.entries(STATUT_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-500">Chargement...</div>
        ) : retraits.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400">Aucun retrait trouvé</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Référence</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vendeur</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Montant</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Net versé</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Méthode</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Solde dispo.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {retraits.map((r) => (
                <tr
                  key={r._id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${selected?._id === r._id ? "bg-indigo-50" : ""}`}
                  onClick={() => setSelected(selected?._id === r._id ? null : r)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.reference || r._id.slice(-8)}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-32 truncate">{r.sellerId}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(r.montantDemande)}</td>
                  <td className="px-4 py-3 text-right text-green-700">{formatPrice(r.montantAccorde)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      {r.methodeRetrait === "MOBILE_MONEY" ? <Phone className="h-3.5 w-3.5" /> : <Building className="h-3.5 w-3.5" />}
                      {METHODE_LABELS[r.methodeRetrait] || r.methodeRetrait}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.sellerInfo ? (
                      <span className={`font-medium ${r.sellerInfo.soldeDisponible < r.montantDemande ? "text-red-600" : "text-green-700"}`}>
                        {formatPrice(r.sellerInfo.soldeDisponible)}
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatutBadge statut={r.statut} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(r.datedemande)}</td>
                  <td className="px-4 py-3">
                    <Eye className="h-4 w-4 text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
          <span>{pagination.total} retrait(s)</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>Page {page} / {pagination.pages || 1}</span>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Panneau détail + actions */}
      {selected && (
        <div className="bg-white border rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Détail du retrait</h2>
            <StatutBadge statut={selected.statut} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Vendeur ID</p>
              <p className="font-mono text-xs break-all">{selected.sellerId}</p>
            </div>
            <div>
              <p className="text-gray-500">Montant demandé</p>
              <p className="font-semibold text-lg">{formatPrice(selected.montantDemande)}</p>
            </div>
            <div>
              <p className="text-gray-500">Frais retrait</p>
              <p className="text-orange-600">{formatPrice(selected.fraisRetrait)}</p>
            </div>
            <div>
              <p className="text-gray-500">Net à verser</p>
              <p className="font-semibold text-green-700 text-lg">{formatPrice(selected.montantAccorde)}</p>
            </div>
          </div>

          {selected.sellerInfo && (
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Solde disponible</p>
                <p className={`font-semibold ${selected.sellerInfo.soldeDisponible < selected.montantDemande ? "text-red-600" : "text-green-700"}`}>
                  {formatPrice(selected.sellerInfo.soldeDisponible)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Solde total</p>
                <p className="font-semibold">{formatPrice(selected.sellerInfo.soldeTotal)}</p>
              </div>
              <div>
                <p className="text-gray-500">Bloqué temporairement</p>
                <p className="text-gray-600">{formatPrice(selected.sellerInfo.soldeBloqueTemporairement)}</p>
              </div>
            </div>
          )}

          {selected.methodeRetrait === "MOBILE_MONEY" && selected.detailsRetrait && (
            <div className="text-sm bg-blue-50 rounded-lg p-4">
              <p className="font-medium text-blue-800 mb-1">Coordonnées Mobile Money</p>
              <p>Opérateur : <span className="font-semibold">{selected.detailsRetrait.operateur || "—"}</span></p>
              <p>Numéro : <span className="font-semibold">{selected.detailsRetrait.numeroTelephone || selected.detailsRetrait.numero || "—"}</span></p>
              <p>Nom titulaire : <span className="font-semibold">{selected.detailsRetrait.nomTitulaire || selected.detailsRetrait.nom || "—"}</span></p>
            </div>
          )}

          {selected.statut === "APPROUVE" && selected.detailsRetrait && selected.methodeRetrait === "VIREMENT_BANCAIRE" && (
            <div className="text-sm bg-blue-50 rounded-lg p-4">
              <p className="font-medium text-blue-800 mb-1">Coordonnées bancaires</p>
              <p>Banque : <span className="font-semibold">{selected.detailsRetrait.banque || "—"}</span></p>
              <p>IBAN / Compte : <span className="font-semibold">{selected.detailsRetrait.iban || selected.detailsRetrait.numeroCompte || "—"}</span></p>
            </div>
          )}

          {selected.commentaireAdmin && (
            <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="font-medium">Commentaire admin :</span> {selected.commentaireAdmin}
            </div>
          )}

          {/* Boutons d'action */}
          {selected.statut === "EN_ATTENTE" && (
            <div className="flex flex-wrap gap-3">
              {selected.sellerInfo && selected.sellerInfo.soldeDisponible < selected.montantDemande && (
                <div className="w-full flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4" />
                  Solde disponible insuffisant ({formatPrice(selected.sellerInfo.soldeDisponible)} &lt; {formatPrice(selected.montantDemande)})
                </div>
              )}
              <button
                onClick={() => openAction(selected, "APPROUVE")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Approuver
              </button>
              <button
                onClick={() => openAction(selected, "REJETE")}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                Rejeter
              </button>
              <button
                onClick={() => openAction(selected, "ANNULE")}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
              >
                Annuler
              </button>
            </div>
          )}

          {selected.statut === "APPROUVE" && (
            <div className="flex gap-3">
              <button
                onClick={() => openAction(selected, "TRAITE")}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                Marquer comme traité (paiement effectué)
              </button>
              <button
                onClick={() => openAction(selected, "REJETE")}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                Rejeter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmation d'action */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">{actionConfig[actionModal.action]?.confirm}</h3>

            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 space-y-1">
              <p>Référence : <span className="font-mono">{actionModal.retrait.reference || actionModal.retrait._id.slice(-8)}</span></p>
              <p>Montant : <span className="font-semibold">{formatPrice(actionModal.retrait.montantDemande)}</span></p>
              <p>Net vendeur : <span className="font-semibold text-green-700">{formatPrice(actionModal.retrait.montantAccorde)}</span></p>
            </div>

            {(actionModal.action === "REJETE" || actionModal.action === "ANNULE") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Expliquer la raison..."
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            )}

            {actionModal.action === "TRAITE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Référence du virement, etc."
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setActionModal(null); setCommentaire(""); setError(null); }}
                disabled={isSubmitting}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                disabled={isSubmitting || ((actionModal.action === "REJETE" || actionModal.action === "ANNULE") && !commentaire.trim())}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${actionConfig[actionModal.action]?.color} disabled:opacity-50`}
              >
                {isSubmitting ? "En cours..." : actionConfig[actionModal.action]?.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetraitManagement;
