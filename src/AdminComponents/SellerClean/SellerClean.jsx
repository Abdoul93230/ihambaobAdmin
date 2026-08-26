import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Store,
} from "lucide-react";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function getToken() {
  const adminData = JSON.parse(localStorage.getItem("AdminEcomme") || "{}");
  return adminData?.token || localStorage.getItem("AdminAuthToken");
}

const ITEMS_PER_PAGE = 12;

const LABEL_MAP = {
  seller: "Vendeur",
  cloudinaryImages: "Images Cloudinary",
  store: "Boutique",
  produits: "Produits",
  commentairesProduits: "Commentaires produits",
  likesProduits: "Likes produits",
  portefeuille: "Portefeuille",
  retraits: "Retraits",
  transactions: "Transactions",
  ventesDirectes: "Ventes directes",
  notifications: "Notifications",
  deletedProducts: "Produits supprimés (logs)",
  storeLikes: "Likes boutique",
  shippingPolicies: "Politiques d'expédition",
  avis: "Avis clients",
  banners: "Bannières",
  emailCampaigns: "Campagnes email",
  agents: "Agents POS",
  subscriptions: "Abonnements",
  subscriptionHistory: "Historique abonnements",
  subscriptionQueue: "File d'attente abonnements",
  subscriptionRequests: "Demandes d'abonnement",
};

const STATUS_STYLES = {
  true: "bg-green-100 text-green-800",
  false: "bg-yellow-100 text-yellow-800",
};

const CATEGORY_COLORS = {
  mode: "bg-purple-100 text-purple-800",
  electronique: "bg-blue-100 text-blue-800",
  maison: "bg-green-100 text-green-800",
  beaute: "bg-pink-100 text-pink-800",
  sports: "bg-orange-100 text-orange-800",
  artisanat: "bg-yellow-100 text-yellow-800",
  bijoux: "bg-indigo-100 text-indigo-800",
  alimentation: "bg-red-100 text-red-800",
  livres: "bg-gray-100 text-gray-800",
  services: "bg-teal-100 text-teal-800",
};

export default function SellerClean() {
  // List state
  const [allSellers, setAllSellers] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Selected seller + flow
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showCounts, setShowCounts] = useState(false);
  const [showConfirm1, setShowConfirm1] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isCleaning, setIsCleaning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ─── Load all sellers ──────────────────────────────────────────────────────
  const fetchAllSellers = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await axios.get(`${BackendUrl}/getSellers`);
      setAllSellers(res.data?.data || []);
      setCurrentPage(1);
    } catch {
      setAllSellers([]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSellers();
  }, [fetchAllSellers]);

  // ─── Filter + paginate ─────────────────────────────────────────────────────
  const term = searchTerm.toLowerCase();
  const filtered = allSellers.filter(
    (s) =>
      !term ||
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.storeName?.toLowerCase().includes(term)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const displayed = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // ─── Select seller → load preview ─────────────────────────────────────────
  const loadPreview = async (seller) => {
    if (selectedSeller?._id === seller._id) return;
    setSelectedSeller(seller);
    setPreview(null);
    setShowConfirm1(false);
    setConfirmText("");
    setResult(null);
    setError(null);
    setIsLoadingPreview(true);
    try {
      const res = await axios.get(
        `${BackendUrl}/api/adminSeller/clean-seller-preview/${seller._id}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setPreview(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement de l'aperçu.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // ─── Execute deletion ──────────────────────────────────────────────────────
  const handleClean = async () => {
    if (confirmText !== "SUPPRIMER") return;
    setIsCleaning(true);
    setError(null);
    try {
      const res = await axios.delete(
        `${BackendUrl}/api/adminSeller/clean-seller/${selectedSeller._id}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setResult(res.data);
      // Remove deleted seller from list
      setAllSellers((prev) => prev.filter((s) => s._id !== selectedSeller._id));
      setSelectedSeller(null);
      setPreview(null);
      setShowConfirm1(false);
      setConfirmText("");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setIsCleaning(false);
    }
  };

  const totalToDelete = preview
    ? Object.values(preview.counts).reduce((a, b) => a + b, 0) + 1
    : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Nettoyage vendeur</h1>
            <p className="text-sm text-slate-500">
              Suppression permanente d'un vendeur et de toutes ses données
            </p>
          </div>
        </div>
        <button
          onClick={fetchAllSellers}
          disabled={isLoadingList}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* ── Warning ── */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Action irréversible.</strong> Toutes les données liées au vendeur (boutique,
          produits, transactions, abonnements, images Cloudinary…) seront définitivement supprimées.
        </p>
      </div>

      {/* ── Success result ── */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-green-800">{result.message}</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(result.deletedCounts).map(([key, count]) => (
              <div key={key} className="bg-white rounded-lg px-3 py-2 text-center border border-green-100">
                <p className="text-lg font-bold text-green-700">{count}</p>
                <p className="text-xs text-slate-500 leading-tight">{LABEL_MAP[key] || key}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-3 text-xs text-green-700 underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Filtrer par nom, email ou boutique…"
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="flex items-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3">
          {filtered.length} vendeur{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Main layout: list + panel ── */}
      <div className="flex gap-5 items-start">
        {/* ── Sellers list ── */}
        <div className="flex-1 min-w-0">
          {isLoadingList ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Chargement…</span>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400">
              <User className="w-8 h-8 mb-2" />
              <p className="text-sm">Aucun vendeur trouvé</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendeur</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Boutique</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayed.map((seller) => {
                      const isSelected = selectedSeller?._id === seller._id;
                      return (
                        <tr
                          key={seller._id}
                          onClick={() => loadPreview(seller)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-red-50 border-l-2 border-l-red-400"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {seller.logo ? (
                                <img
                                  src={seller.logo}
                                  alt={seller.name}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-slate-500" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 truncate">
                                  {seller.name} {seller.userName2 || ""}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{seller.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Store className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px]">{seller.storeName || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {seller.category ? (
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${CATEGORY_COLORS[seller.category] || "bg-slate-100 text-slate-700"}`}>
                                {seller.category}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              seller.isvalid ? STATUS_STYLES.true : STATUS_STYLES.false
                            }`}>
                              {seller.isvalid ? "Validé" : "En attente"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); loadPreview(seller); }}
                              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                                isSelected
                                  ? "bg-red-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700"
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {isSelected ? "Sélectionné" : "Nettoyer"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-slate-100">
                {displayed.map((seller) => {
                  const isSelected = selectedSeller?._id === seller._id;
                  return (
                    <div
                      key={seller._id}
                      onClick={() => loadPreview(seller)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? "bg-red-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {seller.logo ? (
                          <img src={seller.logo} alt={seller.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-slate-800 truncate">{seller.name}</p>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                              seller.isvalid ? STATUS_STYLES.true : STATUS_STYLES.false
                            }`}>
                              {seller.isvalid ? "Validé" : "En attente"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate">{seller.email}</p>
                          {seller.storeName && (
                            <p className="text-xs text-blue-600 mt-0.5">{seller.storeName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
                  <p className="text-xs text-slate-500">
                    Page {page} / {totalPages} — {filtered.length} vendeurs
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel: preview + deletion ── */}
        {(selectedSeller || isLoadingPreview) && !result && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white border border-red-200 rounded-xl overflow-hidden sticky top-4">

              {/* Panel header */}
              <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {selectedSeller?.logo ? (
                    <img src={selectedSeller.logo} alt="" className="w-8 h-8 rounded-full object-cover mb-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center mb-1">
                      <User className="w-4 h-4 text-red-600" />
                    </div>
                  )}
                  <p className="font-semibold text-red-800 text-sm truncate">
                    {selectedSeller?.name}
                  </p>
                  <p className="text-xs text-red-500 truncate">{selectedSeller?.email}</p>
                  {selectedSeller?.storeName && (
                    <p className="text-xs text-red-600 mt-0.5 truncate">
                      <Store className="inline w-3 h-3 mr-1" />
                      {selectedSeller.storeName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedSeller(null);
                    setPreview(null);
                    setShowConfirm1(false);
                    setConfirmText("");
                    setError(null);
                  }}
                  className="flex-shrink-0 text-red-300 hover:text-red-600 mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview loading */}
              {isLoadingPreview && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-500">Analyse…</span>
                </div>
              )}

              {/* Preview content */}
              {preview && !isLoadingPreview && (
                <>
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-700">
                        <span className="font-bold text-red-600 text-base">{totalToDelete}</span>{" "}
                        documents à supprimer
                      </p>
                      <button
                        onClick={() => setShowCounts(!showCounts)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Détail
                        {showCounts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {showCounts && (
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        <div className="bg-red-50 rounded-lg px-3 py-2 text-center col-span-2 border border-red-100">
                          <p className="text-sm font-bold text-red-700">1</p>
                          <p className="text-xs text-slate-500">Compte vendeur</p>
                        </div>
                        {Object.entries(preview.counts).map(([key, count]) => (
                          <div
                            key={key}
                            className={`rounded-lg px-2 py-2 text-center border ${
                              count > 0 ? "bg-orange-50 border-orange-100" : "bg-slate-50 border-slate-100 opacity-50"
                            }`}
                          >
                            <p className={`text-sm font-bold ${count > 0 ? "text-orange-700" : "text-slate-400"}`}>
                              {count}
                            </p>
                            <p className="text-xs text-slate-500 leading-tight">{LABEL_MAP[key] || key}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm buttons */}
                  {!showConfirm1 ? (
                    <div className="px-4 py-3">
                      <button
                        onClick={() => setShowConfirm1(true)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer définitivement
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-4 bg-red-50 border-t border-red-100">
                      <p className="text-sm font-semibold text-red-800 mb-1">Confirmation finale</p>
                      <p className="text-xs text-red-700 mb-3">
                        Tapez <strong>SUPPRIMER</strong> pour confirmer.
                      </p>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="SUPPRIMER"
                        className="w-full border-2 border-red-200 focus:border-red-500 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowConfirm1(false); setConfirmText(""); }}
                          className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 text-sm transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleClean}
                          disabled={confirmText !== "SUPPRIMER" || isCleaning}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-2 rounded-lg transition-colors"
                        >
                          {isCleaning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          {isCleaning ? "Suppression…" : "Confirmer"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Error */}
              {error && (
                <div className="mx-4 mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
