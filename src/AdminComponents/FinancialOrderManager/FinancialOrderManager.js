import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import axios from "axios";
import SUBSCRIPTION_CONFIG from "../../config/subscriptionConfig";

const BackendUrl = process.env.REACT_APP_Backend_Url;

// Pipeline linéaire — source de vérité du processus commande
const PIPELINE = [
  {
    value: "traitement",
    label: "En traitement",
    sublabel: "Commande reçue, en attente de prise en charge",
    icon: Clock,
    financialOnEnter: "none",
    color: "yellow",
  },
  {
    value: "reçu par le livreur",
    label: "Remis au livreur",
    sublabel: "Le livreur a pris en charge la commande",
    icon: Package,
    financialOnEnter: "create_transactions",
    color: "blue",
  },
  {
    value: "en cours de livraison",
    label: "En livraison",
    sublabel: "La commande est en route vers le client",
    icon: Truck,
    financialOnEnter: "none",
    color: "purple",
  },
  {
    value: "livré",
    label: "Livré",
    sublabel: "Commande livrée — transactions confirmées",
    icon: CheckCircle,
    financialOnEnter: "confirm_transactions",
    color: "green",
  },
];

// États hors-pipeline
const TERMINAL_STATES = ["livré", "livraison reçu", "Traité"];
const CANCELLED_STATES = ["annulé", "Annulée", "annulée"];

const getFinancialActionDescription = (action) => {
  switch (action) {
    case "create_transactions":
      return "Créer les transactions vendeur (argent mis EN_ATTENTE dans les portefeuilles)";
    case "confirm_transactions":
      return "Confirmer les transactions — l'argent sera disponible après le délai de sécurité (3–7 jours)";
    case "cancel_refund":
      return "Annuler les transactions, rembourser les portefeuilles et restaurer le stock";
    default:
      return "Aucune action financière";
  }
};

const FinancialOrderManager = ({ order, onOrderUpdate, allProducts = [] }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const [lastFinancialAction, setLastFinancialAction] = useState(null);

  useEffect(() => {
    if (order) calculateFinancialSummary();
  }, [order, allProducts]);

  // ── Détection état courant ────────────────────────────────────────
  const currentEtat = order?.etatTraitement || "traitement";
  const isCancelled = CANCELLED_STATES.includes(currentEtat);
  const isTerminated = TERMINAL_STATES.includes(currentEtat);

  const currentPipelineIndex = PIPELINE.findIndex((s) => s.value === currentEtat);
  const nextStep = !isCancelled && !isTerminated && currentPipelineIndex < PIPELINE.length - 1
    ? PIPELINE[currentPipelineIndex + 1]
    : null;

  // ── Helpers ──────────────────────────────────────────────────────
  const getSellerInfo = async (sellerId) => {
    if (!sellerId) return { rate: SUBSCRIPTION_CONFIG.DEFAULT_COMMISSION, planName: "Starter", storeName: "Boutique" };
    try {
      const res = await axios.get(`${BackendUrl}/seller-info/${sellerId}`);
      const data = res.data?.data || res.data;
      const storeName = data?.storeName || "Boutique";
      const plan = data?.subscriptionId && typeof data.subscriptionId === "object" ? data.subscriptionId : null;
      if (plan && plan.status !== "expired" && plan.status !== "cancelled") {
        const planType = plan.planType || "Starter";
        return { rate: SUBSCRIPTION_CONFIG.getPlanCommission(planType), planName: planType, storeName };
      }
      const planName = data?.subscription || "Starter";
      return { rate: SUBSCRIPTION_CONFIG.getPlanCommission(planName), planName, storeName };
    } catch (_) {
      return { rate: SUBSCRIPTION_CONFIG.DEFAULT_COMMISSION, planName: "Starter", storeName: "Boutique" };
    }
  };

  const calculateFinancialSummary = async () => {
    if (!order) return;
    const transactions = order.transactionInfo || order.transactions || [];
    if (transactions.length > 0) {
      let totalCommission = 0, totalNet = 0;
      const bySellerMap = {};
      transactions.forEach((t) => {
        if (t.type === "CREDIT_COMMANDE" || !t.type) {
          totalCommission += t.commission || 0;
          totalNet += t.montantNet || 0;
          if (t.sellerId) {
            if (!bySellerMap[t.sellerId]) bySellerMap[t.sellerId] = { storeName: t.sellerId, montantBrut: 0, commission: 0, montantNet: 0, taux: t.tauxCommission || 0, planName: "" };
            bySellerMap[t.sellerId].montantBrut += t.montant || 0;
            bySellerMap[t.sellerId].commission += t.commission || 0;
            bySellerMap[t.sellerId].montantNet += t.montantNet || 0;
            bySellerMap[t.sellerId].taux = t.tauxCommission || bySellerMap[t.sellerId].taux;
          }
        }
      });
      const bySeller = await Promise.all(
        Object.entries(bySellerMap).map(async ([sid, data]) => {
          const info = await getSellerInfo(sid);
          return { ...data, storeName: info.storeName, planName: info.planName };
        })
      );
      setFinancialSummary({ totalCommission, totalNet, bySeller, source: "transaction" });
      return;
    }

    if (!order.prod?.length && !allProducts.length) return;
    const bySellerRaw = {};
    order.nbrProduits?.forEach((item) => {
      const produitId = typeof item.produit === "object" ? item.produit?._id : item.produit;
      const product =
        order.prod?.find((p) => String(p._id) === String(produitId)) ||
        allProducts.find((p) => p._id === produitId || p._id === item.produit?._id);
      if (!product) return;
      const sellerId = typeof product.Clefournisseur === "object"
        ? String(product.Clefournisseur._id || product.Clefournisseur)
        : String(product.Clefournisseur || "unknown");
      const storeName = product.Clefournisseur?.storeName || product.Clefournisseur?.name || "Boutique";
      const unitPrice = parseFloat(product.prixPromo) > 0 ? parseFloat(product.prixPromo) : parseFloat(product.prix) || 0;
      const montant = unitPrice * (parseInt(item.quantite) || 0);
      if (!bySellerRaw[sellerId]) bySellerRaw[sellerId] = { sellerId, storeName, montantBrut: 0 };
      bySellerRaw[sellerId].montantBrut += montant;
      if (product.Clefournisseur?.storeName || product.Clefournisseur?.name) bySellerRaw[sellerId].storeName = storeName;
    });
    const bySeller = await Promise.all(
      Object.values(bySellerRaw).map(async (s) => {
        const info = await getSellerInfo(s.sellerId);
        const commission = Math.round((s.montantBrut * info.rate) / 100);
        return { storeName: info.storeName || s.storeName, planName: info.planName, montantBrut: s.montantBrut, commission, montantNet: s.montantBrut - commission, taux: info.rate };
      })
    );
    const totalCommission = bySeller.reduce((s, v) => s + v.commission, 0);
    const totalNet = bySeller.reduce((s, v) => s + v.montantNet, 0);
    setFinancialSummary({ totalCommission, totalNet, bySeller, source: "estimate" });
  };

  const getFinancialStatus = () => {
    if (!order) return { status: "unknown", message: "Données manquantes", icon: AlertTriangle, color: "gray" };
    const { etatTraitement, statusLivraison } = order;
    if (CANCELLED_STATES.includes(statusLivraison) || CANCELLED_STATES.includes(etatTraitement))
      return { status: "cancelled", message: "Transactions annulées et remboursées", icon: AlertTriangle, color: "red" };
    if (statusLivraison === "livré" || TERMINAL_STATES.includes(etatTraitement))
      return { status: "confirmed", message: "Transactions confirmées — argent disponible dans 3–7 jours", icon: CheckCircle, color: "green" };
    if (etatTraitement === "reçu par le livreur" || etatTraitement === "en cours de livraison")
      return { status: "pending", message: "Transactions créées — argent en attente dans le portefeuille vendeur", icon: Clock, color: "yellow" };
    return { status: "none", message: "Aucune transaction créée — en attente de prise en charge", icon: Lock, color: "gray" };
  };

  // ── Mise à jour statut ────────────────────────────────────────────
  const handleStatusUpdate = async (newValue) => {
    const nextPipelineStep = PIPELINE.find((s) => s.value === newValue);
    const financialAction = newValue === "annulé" ? "cancel_refund" : (nextPipelineStep?.financialOnEnter || "none");

    if (financialAction !== "none") {
      setShowConfirmation({ newValue, financialAction, label: nextPipelineStep?.label || newValue });
    } else {
      await executeStatusUpdate(newValue);
    }
  };

  const executeStatusUpdate = async (newValue) => {
    if (!order?._id) return;
    setIsUpdating(true);
    try {
      await axios.put(`${BackendUrl}/command/updateEtatTraitement/${order._id}`, { nouvelEtat: newValue });
      if (onOrderUpdate) {
        const orderRes = await axios.get(`${BackendUrl}/getCommandesById/${order._id}`);
        onOrderUpdate(orderRes.data.commande);
      }
      const financialAction = newValue === "annulé" ? "cancel_refund"
        : PIPELINE.find((s) => s.value === newValue)?.financialOnEnter || "none";
      if (financialAction !== "none")
        setLastFinancialAction({ action: financialAction, timestamp: new Date(), label: newValue });
    } catch (error) {
      console.error("❌ Erreur mise à jour statut:", error);
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setIsUpdating(false);
      setShowConfirmation(null);
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
          Gestion de la commande
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ── Stepper pipeline ─────────────────────────────────── */}
        {!isCancelled ? (
          <div className="space-y-4">
            {/* Étapes */}
            <div className="flex items-center">
              {PIPELINE.map((step, i) => {
                const StepIcon = step.icon;
                const isDone = isTerminated
                  ? true
                  : currentPipelineIndex > i;
                const isCurrent = !isTerminated && currentPipelineIndex === i;
                return (
                  <React.Fragment key={step.value}>
                    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        isDone   ? "bg-green-500 border-green-500 text-white" :
                        isCurrent? "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200" :
                                   "bg-white border-gray-200 text-gray-300"
                      }`}>
                        {isDone
                          ? <CheckCircle className="h-4 w-4" />
                          : <StepIcon className="h-4 w-4" />
                        }
                      </div>
                      <span className={`text-xs text-center leading-tight px-1 truncate w-full ${
                        isCurrent ? "font-semibold text-blue-700" :
                        isDone    ? "text-green-700 font-medium" :
                                    "text-gray-400"
                      }`}>
                        {step.label}
                      </span>
                      {step.financialOnEnter !== "none" && !isDone && !isCurrent && (
                        <span className="text-xs text-amber-500">💰</span>
                      )}
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div className={`h-0.5 flex-shrink-0 w-6 sm:w-8 mb-5 transition-all ${
                        i < currentPipelineIndex || isTerminated ? "bg-green-400" : "bg-gray-200"
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* État courant */}
            {!isTerminated && currentPipelineIndex >= 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-800">
                <span className="font-semibold">{PIPELINE[currentPipelineIndex]?.label}</span>
                {" — "}
                <span className="text-blue-600">{PIPELINE[currentPipelineIndex]?.sublabel}</span>
              </div>
            )}
            {isTerminated && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <span className="font-semibold">Commande terminée</span>
                {" — "}
                <span className="text-green-600">{PIPELINE[3].sublabel}</span>
              </div>
            )}

            {/* Boutons d'action */}
            {!isTerminated && (
              <div className="flex gap-3">
                {nextStep && (
                  <Button
                    onClick={() => handleStatusUpdate(nextStep.value)}
                    disabled={isUpdating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <nextStep.icon className="h-4 w-4" />}
                    <span>{isUpdating ? "Mise à jour..." : nextStep.label}</span>
                    {nextStep.financialOnEnter !== "none" && (
                      <Badge variant="outline" className="text-xs border-white/40 text-white/90 bg-white/10">💰</Badge>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => handleStatusUpdate("annulé")}
                  disabled={isUpdating}
                  variant="destructive"
                  className="flex items-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Annuler</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* État annulé */
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Commande annulée</p>
                <p className="text-sm text-red-600">Stock restauré · Transactions remboursées</p>
              </div>
            </div>
            <Button
              onClick={() => handleStatusUpdate("traitement")}
              disabled={isUpdating}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Relancer la commande
            </Button>
          </div>
        )}

        {/* ── État financier ────────────────────────────────────── */}
        <div className={`p-4 rounded-lg border-2 ${colorClass.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`h-5 w-5 ${colorClass.icon}`} />
            <span className="font-medium">État financier</span>
          </div>
          <p className={`text-sm ${colorClass.text}`}>{financialStatus.message}</p>
        </div>

        {/* ── Résumé financier ──────────────────────────────────── */}
        {financialSummary && (
          <div className="space-y-3">
            {financialSummary.source === "estimate" && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Estimation indicative — les montants réels seront calculés à la prise en charge
              </div>
            )}
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

        {/* Dernière action financière */}
        {lastFinancialAction && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Dernière action financière</span>
            </div>
            <p className="text-sm text-blue-700">{getFinancialActionDescription(lastFinancialAction.action)}</p>
            <p className="text-xs text-blue-500 mt-1">{new Date(lastFinancialAction.timestamp).toLocaleString("fr-FR")}</p>
          </div>
        )}

        {/* Modal de confirmation pour actions financières */}
        {showConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold mb-3">Confirmer l'action</h3>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 mb-1">
                  <strong>Nouvel état :</strong> {showConfirmation.label}
                </p>
                <p className="text-sm text-yellow-700">
                  <strong>Action financière :</strong> {getFinancialActionDescription(showConfirmation.financialAction)}
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
                  onClick={() => executeStatusUpdate(showConfirmation.newValue)}
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
