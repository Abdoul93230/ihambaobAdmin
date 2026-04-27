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
  Unlock,
} from "lucide-react";
import axios from "axios";

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

  // Calculer le résumé financier basé sur la commande
  useEffect(() => {
    if (order) {
      calculateFinancialSummary();
    }
  }, [order, allProducts]);

  const calculateFinancialSummary = () => {
    if (!order) return;

    // Si les transactions sont disponibles sur la commande, on les utilise (source de vérité)
    const transactions = order.transactionInfo || order.transactions || [];

    if (transactions.length > 0) {
      let totalCommission = 0;
      let totalNet = 0;
      const sellers = new Set();

      transactions.forEach((t) => {
        if (t.type === 'CREDIT_COMMANDE' || !t.type) {
          totalCommission += t.commission || 0;
          totalNet += t.montantNet || 0;
          if (t.sellerId) sellers.add(t.sellerId);
        }
      });

      setFinancialSummary({
        totalCommission,
        totalNet,
        sellersCount: sellers.size || 1,
        sellers: Array.from(sellers),
        source: 'transaction'
      });
      return;
    }

    // Fallback : estimation depuis les produits (si pas encore de transactions)
    if (!allProducts.length) return;

    let totalBrut = 0;
    const sellers = new Set();

    order.nbrProduits?.forEach((item) => {
      const product = allProducts.find((p) => p._id === item.produit || p._id === item.produit?._id);
      if (product) {
        sellers.add(product.Clefournisseur);
        const unitPrice = product.prixPromo > 0 ? product.prixPromo : product.prix;
        totalBrut += unitPrice * item.quantite;
      }
    });

    // Taux moyen indicatif (Starter = 3%, par défaut)
    const tauxIndicatif = 3;
    const commissionIndicative = Math.round((totalBrut * tauxIndicatif) / 100);

    setFinancialSummary({
      totalCommission: commissionIndicative,
      totalNet: totalBrut - commissionIndicative,
      sellersCount: sellers.size,
      sellers: Array.from(sellers),
      source: 'estimate',
      tauxIndicatif
    });
  };

  const getFinancialStatus = () => {
    if (!order) return { status: "unknown", message: "Données manquantes", icon: AlertTriangle, color: "gray" };

    const { etatTraitement, statusLivraison } = order;

    // Commande annulée
    if (statusLivraison === "annulé" || etatTraitement === "Annulée") {
      return {
        status: "cancelled",
        message: "Transactions annulées et remboursées",
        icon: AlertTriangle,
        color: "red"
      };
    }

    // Transactions confirmées (argent disponible bientôt)
    if (statusLivraison === "livré" || etatTraitement === "livraison reçu" || etatTraitement === "Traité") {
      return {
        status: "confirmed",
        message: "Transactions confirmées - Argent disponible dans 3-7 jours",
        icon: CheckCircle,
        color: "green"
      };
    }

    // Transactions créées (argent en attente)
    if (etatTraitement === "reçu par le livreur" || etatTraitement === "en cours de livraison") {
      return {
        status: "pending",
        message: "Transactions créées - Argent en attente dans le portefeuille",
        icon: Clock,
        color: "yellow"
      };
    }

    // Aucune transaction créée
    return {
      status: "none",
      message: "Aucune transaction créée - En attente de prise en charge",
      icon: Lock,
      color: "gray"
    };
  };

  const handleStatusUpdate = async (type, newValue) => {
    const currentOption = type === "etat" 
      ? ETAT_TRAITEMENT_OPTIONS.find(opt => opt.value === newValue)
      : STATUS_LIVRAISON_OPTIONS.find(opt => opt.value === newValue);

    if (currentOption?.financial !== "none") {
      setShowConfirmation({
        type,
        newValue,
        financialAction: currentOption.financial,
        option: currentOption
      });
    } else {
      await executeStatusUpdate(type, newValue);
    }
  };

  const executeStatusUpdate = async (type, newValue) => {
    if (!order?._id) return;

    setIsUpdating(true);
    try {
      const endpoint = type === "etat" 
        ? `${BackendUrl}/command/updateEtatTraitement/${order._id}`
        : `${BackendUrl}/command/updateStatusLivraison/${order._id}`;

      const payload = type === "etat" 
        ? { nouvelEtat: newValue }
        : { nouveauStatus: newValue };

      const response = await axios.put(endpoint, payload);

      // Mettre à jour la commande dans le composant parent
      if (onOrderUpdate) {
        const orderRes = await axios.get(`${BackendUrl}/getCommandesById/${order._id}`);
        onOrderUpdate(orderRes.data.commande);
      }

      // Enregistrer la dernière action financière
      const option = type === "etat" 
        ? ETAT_TRAITEMENT_OPTIONS.find(opt => opt.value === newValue)
        : STATUS_LIVRAISON_OPTIONS.find(opt => opt.value === newValue);

      if (option?.financial !== "none") {
        setLastFinancialAction({
          action: option.financial,
          timestamp: new Date(),
          status: newValue
        });
      }

      console.log("✅ Statut mis à jour avec succès");

    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setIsUpdating(false);
      setShowConfirmation(null);
    }
  };

  const getFinancialActionDescription = (action) => {
    switch (action) {
      case "create_transactions":
        return "Créer les transactions dans le portefeuille des vendeurs (statut EN_ATTENTE)";
      case "confirm_transactions":
        return "Confirmer les transactions - L'argent sera disponible après le délai de sécurité";
      case "cancel_refund":
        return "Annuler les transactions et rembourser le portefeuille + restaurer le stock";
      default:
        return "Aucune action financière";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(price || 0);
  };

  const financialStatus = getFinancialStatus();
  const StatusIcon = financialStatus.icon;

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
        <div className={`p-4 rounded-lg border-2 ${
          financialStatus.color === "green" ? "bg-green-50 border-green-200" :
          financialStatus.color === "yellow" ? "bg-yellow-50 border-yellow-200" :
          financialStatus.color === "red" ? "bg-red-50 border-red-200" :
          "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className={`h-5 w-5 ${
              financialStatus.color === "green" ? "text-green-600" :
              financialStatus.color === "yellow" ? "text-yellow-600" :
              financialStatus.color === "red" ? "text-red-600" :
              "text-gray-600"
            }`} />
            <span className="font-medium">État Financier Actuel</span>
          </div>
          <p className={`text-sm ${
            financialStatus.color === "green" ? "text-green-700" :
            financialStatus.color === "yellow" ? "text-yellow-700" :
            financialStatus.color === "red" ? "text-red-700" :
            "text-gray-700"
          }`}>
            {financialStatus.message}
          </p>
        </div>

        {/* Résumé financier */}
        {financialSummary && (
          <div className="space-y-2">
            {financialSummary.source === 'estimate' && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                Estimation indicative ({financialSummary.tauxIndicatif}% Starter) — les montants réels seront calculés à la prise en charge
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Commission</span>
                </div>
                <div className="text-lg font-bold text-blue-900">
                  {formatPrice(financialSummary.totalCommission)}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Net Vendeurs</span>
                </div>
                <div className="text-lg font-bold text-green-900">
                  {formatPrice(financialSummary.totalNet)}
                </div>
                <div className="text-xs text-green-600">
                  {financialSummary.sellersCount} vendeur(s) concerné(s)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contrôles de statut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              État de Traitement
            </label>
            <Select
              value={order?.etatTraitement}
              onValueChange={(value) => handleStatusUpdate("etat", value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un état" />
              </SelectTrigger>
              <SelectContent>
                {ETAT_TRAITEMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.label}
                      {option.financial !== "none" && (
                        <Badge variant="outline" className="text-xs">
                          💰 Action financière
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Statut de Livraison
            </label>
            <Select
              value={order?.statusLivraison}
              onValueChange={(value) => handleStatusUpdate("livraison", value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_LIVRAISON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.label}
                      {option.financial !== "none" && (
                        <Badge variant="outline" className="text-xs">
                          💰 Action financière
                        </Badge>
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
            <p className="text-sm text-blue-700">
              {getFinancialActionDescription(lastFinancialAction.action)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {new Date(lastFinancialAction.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        {/* Modal de confirmation */}
        {showConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold mb-3">Confirmer l'Action Financière</h3>
              
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Changement :</strong> {showConfirmation.option.label}
                </p>
                <p className="text-sm text-yellow-700">
                  <strong>Action financière :</strong> {getFinancialActionDescription(showConfirmation.financialAction)}
                </p>
              </div>

              {financialSummary && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Impact :</strong> {formatPrice(financialSummary.totalNet)} pour {financialSummary.sellersCount} vendeur(s)
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(null)}
                  disabled={isUpdating}
                >
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