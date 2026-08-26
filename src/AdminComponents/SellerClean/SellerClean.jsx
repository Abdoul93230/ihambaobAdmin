import React, { useState } from "react";
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
} from "lucide-react";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function getToken() {
  const adminData = JSON.parse(localStorage.getItem("AdminEcomme") || "{}");
  return adminData?.token || localStorage.getItem("AdminAuthToken");
}

const LABEL_MAP = {
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

export default function SellerClean() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showCounts, setShowCounts] = useState(false);

  // Confirmation step 1
  const [showConfirm1, setShowConfirm1] = useState(false);
  // Confirmation step 2
  const [confirmText, setConfirmText] = useState("");
  const [isCleaning, setIsCleaning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const searchSellers = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await axios.get(
        `${BackendUrl}/findSellerByName/${encodeURIComponent(searchTerm.trim())}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = res.data?.data || res.data || [];
      setSearchResults(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError("Erreur lors de la recherche du vendeur.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadPreview = async (seller) => {
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
      setSelectedSeller(null);
      setPreview(null);
      setShowConfirm1(false);
      setConfirmText("");
      setSearchResults([]);
      setSearchTerm("");
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
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
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

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Action irréversible.</strong> Toutes les données liées au vendeur (boutique,
          produits, transactions, abonnements, avis…) seront définitivement supprimées de la base
          de données.
        </p>
      </div>

      {/* Success result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-green-800">{result.message}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(result.deletedCounts).map(([key, count]) => (
              <div key={key} className="bg-white rounded-lg px-3 py-2 text-center border border-green-100">
                <p className="text-lg font-bold text-green-700">{count}</p>
                <p className="text-xs text-slate-500">{LABEL_MAP[key] || key}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Rechercher un vendeur
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchSellers()}
            placeholder="Nom, email ou boutique…"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={searchSellers}
            disabled={isSearching || !searchTerm.trim()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Rechercher
          </button>
        </div>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
          {searchResults.map((seller) => (
            <button
              key={seller._id}
              onClick={() => loadPreview(seller)}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 text-left ${
                selectedSeller?._id === seller._id ? "bg-slate-50" : ""
              }`}
            >
              <div>
                <p className="font-medium text-slate-800 text-sm">
                  {seller.name} {seller.userName2 || ""}
                </p>
                <p className="text-xs text-slate-500">{seller.email}</p>
                {seller.storeName && (
                  <p className="text-xs text-blue-600 mt-0.5">Boutique : {seller.storeName}</p>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono">{seller._id}</span>
            </button>
          ))}
        </div>
      )}

      {/* Preview */}
      {isLoadingPreview && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Chargement de l'aperçu…</span>
        </div>
      )}

      {preview && !result && (
        <div className="bg-white border border-red-200 rounded-xl overflow-hidden mb-4">
          {/* Seller info */}
          <div className="bg-red-50 px-4 py-3 border-b border-red-100">
            <p className="font-semibold text-red-800 text-sm">
              Vendeur sélectionné :{" "}
              <span className="font-bold">
                {preview.seller.name} — {preview.seller.email}
              </span>
            </p>
            {preview.seller.storeName && (
              <p className="text-xs text-red-600 mt-0.5">Boutique : {preview.seller.storeName}</p>
            )}
          </div>

          {/* Summary */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-700">
                <span className="font-bold text-red-600 text-base">{totalToDelete}</span>{" "}
                documents seront supprimés
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
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <div className="bg-red-50 rounded-lg px-3 py-2 text-center col-span-3 border border-red-100">
                  <p className="text-sm font-bold text-red-700">1</p>
                  <p className="text-xs text-slate-500">Compte vendeur</p>
                </div>
                {Object.entries(preview.counts).map(([key, count]) => (
                  <div
                    key={key}
                    className={`rounded-lg px-3 py-2 text-center border ${
                      count > 0
                        ? "bg-orange-50 border-orange-100"
                        : "bg-slate-50 border-slate-100 opacity-50"
                    }`}
                  >
                    <p className={`text-sm font-bold ${count > 0 ? "text-orange-700" : "text-slate-400"}`}>
                      {count}
                    </p>
                    <p className="text-xs text-slate-500">{LABEL_MAP[key] || key}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* First confirm button */}
          {!showConfirm1 ? (
            <div className="px-4 py-3">
              <button
                onClick={() => setShowConfirm1(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer définitivement ce vendeur
              </button>
            </div>
          ) : (
            /* Second confirmation */
            <div className="px-4 py-4 bg-red-50 border-t border-red-100">
              <p className="text-sm font-semibold text-red-800 mb-1">
                Confirmation finale requise
              </p>
              <p className="text-xs text-red-700 mb-3">
                Tapez <strong>SUPPRIMER</strong> pour confirmer la suppression irréversible.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="flex-1 border-2 border-red-200 focus:border-red-500 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                />
                <button
                  onClick={() => {
                    setShowConfirm1(false);
                    setConfirmText("");
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClean}
                  disabled={confirmText !== "SUPPRIMER" || isCleaning}
                  className="flex items-center gap-2 bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
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
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
