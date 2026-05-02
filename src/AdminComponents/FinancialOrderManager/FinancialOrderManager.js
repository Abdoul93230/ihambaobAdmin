import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select2";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Wallet,
  TrendingUp,
  RefreshCw,
  Lock,
  Store,
} from "lucide-react";
import axios from "axios";
import SUBSCRIPTION_CONFIG from "../../config/subscriptionConfig";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const ETAT_TRAITEMENT_OPTIONS = [
  { value: "traitement", label: "Traitement", financial: "none" },
  { value: "reçu par le livreur", label: "Reçu par le livreur", financial: "create_transactions" },
  { value: "en cours de livraison", label: "En cours de livraison", financial: "create_transactions" },
  { value: "livraison reçu", label: "Livraison reçu", financial: "confirm_transactions" },
  { value: "Traité", label: "Traité", financial: "confirm_transactions" },
];

const STATUS_LIVRAISON_OPTIONS = [
  { value: "en cours", label: "En cours", financial: "none" },
  { value: "en route", label: "En route", financial: "none" },
  { value: "livré", label: "Livré", financial: "confirm_transactions" },
  { value: "annulé", label: "Annulé", financial: "cancel_refund" },
];

const FinancialOrderManager = ({ order, onOrderUpdate, allProducts = [] }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const [lastFinancialAction, setLastFinancialAction] = useState(null);

  useEffect(() => {
    if (order) calculateFinancialSummary();
  }, [order, allProducts]);

  const getSellerInfo = async (sellerId) => {
    if (!sellerId) return { rate: SUBSCRIPTION_CONFIG.DEFAULT_COMMISSION, planName: "Starter", storeName: "Boutique" };
    try {
      const res = await axios.get(`${BackendUrl}/seller-info/${sellerId}`);
      const data = res.data?.data || res.data;
      const storeName = data?.storeName || "Boutique";

      // subscriptionId est populé directement (objet PricingPlan complet)
      const plan = data?.subscriptionId && typeof data.subscriptionId === "object"
        ? data.subscriptionId
        : null;

      // Accepter tout plan sauf expiré ou annulé (pending_activation = plan payé non encore activé)
      if (plan && plan.status !== "expired" && plan.status !== "cancelled") {
        const planType = plan.planType || "Starter";
        // Toujours lire le taux depuis SUBSCRIPTION_CONFIG — source de vérité, jamais depuis la DB
        return { rate: SUBSCRIPTION_CONFIG.getPlanCommission(planType), planName: planType, storeName };
      }

      // Fallback : champ subscription (nom du plan) ou Starter
      const planName = data?.subscription || "Starter";
      return { rate: SUBSCRIPTION_CONFIG.getPlanCommission(planName), planName, storeName };
    } catch (_) {
      return { rate: SUBSCRIPTION_CONFIG.DEFAULT_COMMISSION, planName: "Starter", storeName: "Boutique" };
    }
  };

  const calculateFinancialSummary = async () => {
    if (!order) return;

    // Source de vérité : transactions existantes
    const transactions = order.transactionInfo || order.transactions || [];
    if (transactions.length > 0) {
      let totalCommission = 0;
      let totalNet = 0;
      const bySellerMap = {};

      transactions.forEach((t) => {
        if (t.type === "CREDIT_COMMANDE" || !t.type) {
          totalCommission += t.commission || 0;
          totalNet += t.montantNet || 0;
          if (t.sellerId) {
            if (!bySellerMap[t.sellerId]) {
              bySellerMap[t.sellerId] = { storeName: t.sellerId, montantBrut: 0, commission: 0, montantNet: 0, taux: t.tauxCommission || 0, planName: "" };
            }
            bySellerMap[t.sellerId].montantBrut += t.montant || 0;
            bySellerMap[t.sellerId].commission += t.commission || 0;
            bySellerMap[t.sellerId].montantNet += t.montantNet || 0;
            bySellerMap[t.sellerId].taux = t.tauxCommission || bySellerMap[t.sellerId].taux;
          }
        }
      });

      // Enrichir avec les noms de boutiques
      const bySeller = await Promise.all(
        Object.entries(bySellerMap).map(async ([sid, data]) => {
          const info = await getSellerInfo(sid);
          return { ...data, storeName: info.storeName, planName: info.planName };
        })
      );

      setFinancialSummary({ totalCommission, totalNet, bySeller, source: "transaction" });
      return;
    }

    // Fallback : estimation depuis les snapshots produits dans order.prod
    if (!order.prod?.length && !allProducts.length) return;

    const bySellerRaw = {};
    order.nbrProduits?.forEach((item) => {
      const produitId = typeof item.produit === "object" ? item.produit?._id : item.produit;
      const product =
        order.prod?.find((p) => String(p._id) === String(produitId)) ||
        allProducts.find((p) => p._id === produitId || p._id === item.produit?._id);
      if (!product) return;

      const sellerId =
        typeof product.Clefournisseur === "object"
          ? String(product.Clefournisseur._id || product.Clefournisseur)
          : String(product.Clefournisseur || "unknown");
      const storeName =
        product.Clefournisseur?.storeName || product.Clefournisseur?.name || "Boutique";
      const unitPrice = parseFloat(product.prixPromo) > 0 ? parseFloat(product.prixPromo) : parseFloat(product.prix) || 0;
      const montant = unitPrice * (parseInt(item.quantite) || 0);

      if (!bySellerRaw[sellerId]) bySellerRaw[sellerId] = { sellerId, storeName, montantBrut: 0 };
      bySellerRaw[sellerId].montantBrut += montant;
      if (product.Clefournisseur?.storeName || product.Clefournisseur?.name) {
        bySellerRaw[sellerId].storeName = storeName;
      }
    });

    // Récupérer taux réel de chaque seller
    const bySeller = await Promise.all(
      Object.values(bySellerRaw).map(async (s) => {
        const info = await getSellerInfo(s.sellerId);
        const commission = Math.round((s.montantBrut * info.rate) / 100);
        return {
          storeName: info.storeName || s.storeName,
          planName: info.planName,
          montantBrut: s.montantBrut,
          commission,
          montantNet: s.montantBrut - commission,
          taux: info.rate,
        };
      })
    );

    const totalCommission = bySeller.reduce((s, v) => s + v.commission, 0);
    const totalNet = bySeller.reduce((s, v) => s + v.montantNet, 0);

    setFinancialSummary({ totalCommission, totalNet, bySeller, source: "estimate" });
  };

  const getFinancialStatus = () => {
    if (!order) return { status: "unknown", message: "Données manquantes", icon: AlertTriangle, color: "gray" };
    const { etatTraitement, statusLivraison } = order;

    if (statusLivraison === "annulé" || etatTraitement === "Annulée" || etatTraitement === "annulé") {
      return { status: "cancelled", message: "Transactions annulées et remboursées", icon: AlertTriangle, color: "red" };
    }
    if (statusLivraison === "livré" || etatTraitement === "livraison reçu" || etatTraitement === "Traité") {
      return { status: "confirmed", message: "Transactions confirmées — argent disponible dans 3–7 jours", icon: CheckCircle, color: "green" };
    }
    if (etatTraitement === "reçu par le livreur" || etatTraitement === "en cours de livraison") {
      return { status: "pending", message: "Transactions créées — argent en attente dans le portefeuille vendeur", icon: Clock, color: "yellow" };
    }
    return { status: "none", message: "Aucune transaction créée — en attente de prise en charge", icon: Lock, color: "gray" };
  };

  const handleStatusUpdate = async (type, newValue) => {
    const currentOption =
      type === "etat"
        ? ETAT_TRAITEMENT_OPTIONS.find((o) => o.value === newValue)
        : STATUS_LIVRAISON_OPTIONS.find((o) => o.value === newValue);

    if (currentOption?.financial !== "none") {
      setShowConfirmation({ type, newValue, financialAction: currentOption.financial, option: currentOption });
    } else {
      await executeStatusUpdate(type, newValue);
    }
  };

  const executeStatusUpdate = async (type, newValue) => {
    if (!order?._id) return;
    setIsUpdating(true);
    try {
      const endpoint =
        type === "etat"
          ? `${BackendUrl}/command/updateEtatTraitement/${order._id}`
          : `${BackendUrl}/command/updateStatusLivraison/${order._id}`;
      const payload = type === "etat" ? { nouvelEtat: newValue } : { nouveauStatus: newValue };

      await axios.put(endpoint, payload);

      if (onOrderUpdate) {
        const orderRes = await axios.get(`${BackendUrl}/getCommandesById/${order._id}`);
        onOrderUpdate(orderRes.data.commande);
      }

      const option =
        type === "etat"
          ? ETAT_TRAITEMENT_OPTIONS.find((o) => o.value === newValue)
          : STATUS_LIVRAISON_OPTIONS.find((o) => o.value === newValue);

      if (option?.financial !== "none") {
        setLastFinancialAction({ action: option.financial, timestamp: new Date(), status: newValue });
      }
    } catch (error) {
      console.error("❌ Erreur mise à jour statut:", error);
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setIsUpdating(false);
      setShowConfirmation(null);
    }
  };

  const getFinancialActionDescription = (action) => {
    switch (action) {
      case "create_transactions": return "Créer les transactions dans le portefeuille des vendeurs (statut EN_ATTENTE)";
      case "confirm_transactions": return "Confirmer les transactions — l'argent sera disponible après le délai de sécurité";
      case "cancel_refund": return "Annuler les transactions, rembourser les portefeuilles et restaurer le stock";
      default: return "Aucune action financière";
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(price || 0);

  const financialStatus = getFinancialStatus();
  const StatusIcon = financialStatus.icon;

  const colorClass = {
    green:  { bg: "bg-green-50 border-green-200",  text: "text-green-700",  icon: "text-green-600"  },
    yellow: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: "text-yellow-600" },
    red:    { bg: "bg-red-50 border-red-200",       text: "text-red-700",    icon: "text-red-600"    },
    gray:   { bg: "bg-gray-50 border-gray-200",     text: "text-gray-700",   icon: "text-gray-600"   },
  }[financialStatus.color] || {};

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Gestion Financière de la Commande
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* État financier actuel */}
        <div className={`p-4 rounded-lg border-2 ${colorClass.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`h-5 w-5 ${colorClass.icon}`} />
            <span className="font-medium">État Financier Actuel</span>
          </div>
          <p className={`text-sm ${colorClass.text}`}>{financialStatus.message}</p>
        </div>

        {/* Résumé financier */}
        {financialSummary && (
          <div className="space-y-3">
            {financialSummary.source === "estimate" && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Estimation indicative — les montants réels seront calculés à la prise en charge
              </div>
            )}

            {/* Totaux globaux */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Commission iHambaobab</span>
                </div>
                <div className="text-lg font-bold text-blue-900">{formatPrice(financialSummary.totalCommission)}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-800">Net Vendeurs</span>
                </div>
                <div className="text-lg font-bold text-green-900">{formatPrice(financialSummary.totalNet)}</div>
                <div className="text-xs text-green-600">{financialSummary.bySeller.length} vendeur(s)</div>
              </div>
            </div>

            {/* Ventilation par vendeur */}
            {financialSummary.bySeller.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Répartition par vendeur</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {financialSummary.bySeller.map((seller, i) => (
                    <div key={i} className="px-3 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-800">{seller.storeName}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            seller.planName === "Business" ? "bg-purple-100 text-purple-700" :
                            seller.planName === "Pro"      ? "bg-blue-100 text-blue-700" :
                                                            "bg-gray-100 text-gray-600"
                          }`}>{seller.planName || "Starter"}</span>
                        </div>
                        <span className="text-xs text-gray-500">{seller.taux}% commission</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-50 rounded px-2 py-1.5 text-center">
                          <div className="text-gray-500 mb-0.5">Ventes brutes</div>
                          <div className="font-semibold text-gray-800">{formatPrice(seller.montantBrut)}</div>
                        </div>
                        <div className="bg-red-50 rounded px-2 py-1.5 text-center">
                          <div className="text-red-500 mb-0.5">Commission</div>
                          <div className="font-semibold text-red-700">−{formatPrice(seller.commission)}</div>
                        </div>
                        <div className="bg-green-50 rounded px-2 py-1.5 text-center">
                          <div className="text-green-600 mb-0.5">Net vendeur</div>
                          <div className="font-bold text-green-800">{formatPrice(seller.montantNet)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contrôles de statut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">État de Traitement</label>
            <Select value={order?.etatTraitement} onValueChange={(v) => handleStatusUpdate("etat", v)} disabled={isUpdating}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un état" />
              </SelectTrigger>
              <SelectContent>
                {ETAT_TRAITEMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.label}
                      {option.financial !== "none" && (
                        <Badge variant="outline" className="text-xs">💰 Action financière</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Statut de Livraison</label>
            <Select value={order?.statusLivraison} onValueChange={(v) => handleStatusUpdate("livraison", v)} disabled={isUpdating}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_LIVRAISON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.label}
                      {option.financial !== "none" && (
                        <Badge variant="outline" className="text-xs">💰 Action financière</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dernière action financière */}
        {lastFinancialAction && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Dernière Action Financière</span>
            </div>
            <p className="text-sm text-blue-700">{getFinancialActionDescription(lastFinancialAction.action)}</p>
            <p className="text-xs text-blue-500 mt-1">{new Date(lastFinancialAction.timestamp).toLocaleString("fr-FR")}</p>
          </div>
        )}

        {/* Modal de confirmation */}
        {showConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold mb-3">Confirmer l'Action Financière</h3>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 mb-1">
                  <strong>Changement :</strong> {showConfirmation.option.label}
                </p>
                <p className="text-sm text-yellow-700">
                  <strong>Action :</strong> {getFinancialActionDescription(showConfirmation.financialAction)}
                </p>
              </div>
              {financialSummary && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <strong>Impact :</strong> {formatPrice(financialSummary.totalNet)} net pour {financialSummary.bySeller.length} vendeur(s)
                  {financialSummary.bySeller.map((s, i) => (
                    <div key={i} className="mt-1 text-xs text-blue-700 flex justify-between">
                      <span>{s.storeName} ({s.planName}, {s.taux}%)</span>
                      <span>{formatPrice(s.montantNet)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowConfirmation(null)} disabled={isUpdating}>
                  Annuler
                </Button>
                <Button
                  onClick={() => executeStatusUpdate(showConfirmation.type, showConfirmation.newValue)}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdating ? "Mise à jour..." : "Confirmer"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default FinancialOrderManager;
