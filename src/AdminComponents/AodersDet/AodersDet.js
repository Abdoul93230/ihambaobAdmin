import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import "./AodersDet.css";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import FinancialOrderManager from "../FinancialOrderManager";
import { toast } from "react-toastify";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const OrderDetails = ({ allProducts, allCategories }) => {
  const [orderData, setOrderData] = useState({
    order: null,
    user: null,
    address: null,
    promoCode: null,
    suppliers: [],
    sellers: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchOrderData = async () => {
      setIsLoading(true);
      try {
        const [orderRes, usersRes, addressRes] =
          await Promise.all([
            axios.get(`${BackendUrl}/getCommandesById/${id}`),
            axios.get(`${BackendUrl}/getUsers`),
            axios.get(`${BackendUrl}/getAllAddressByUser`),
          ]);
          console.log({orderRes})

        const order = orderRes.data.commande;
        if (order.codePro) {
          const promoCodeRes = await axios.get(
            `${BackendUrl}/getCodePromoByClefUser/${order.clefUser}`
          );

          setOrderData((prev) => ({
            ...prev,
            promoCode:
              promoCodeRes.data.data.find(
                (item) => item._id === order.idCodePro
              ) || null,
          }));
        }
        setOrderDetails(order);

        setOrderData((prev) => ({
          ...prev,
          order: order,
          user: usersRes.data.data.find((u) => u._id === order.clefUser),
          address: addressRes.data.data.find(
            (a) => a.clefUser === order.clefUser
          ),
          suppliers: [],
          sellers: [],
        }));
      } catch (error) {
        console.error("Error fetching order data:", error);
      }
      setIsLoading(false);
    };

    fetchOrderData();
  }, [id]);

  const calculateShippingCost = (
    product,
    quantity,
    region,
    isSubsequentVariant = false
  ) => {
    const shippingInfo = product.shipping;

    // Default to 1000 if no shipping info
    if (
      !shippingInfo ||
      !shippingInfo.zones ||
      shippingInfo.zones.length === 0
    ) {
      return 1000;
    }

    // Find matching zone or default to first zone
    let zoneClient =
      shippingInfo.zones.find(
        (zone) => zone.name.toLowerCase() === region.toLowerCase()
      ) || shippingInfo.zones[0];

    // Calculate base fee - only for first variant
    const baseFee = isSubsequentVariant ? 0 : zoneClient.baseFee || 0;

    // Calculate weight-based fees
    const weightFee = shippingInfo.weight
      ? shippingInfo.weight * (zoneClient.weightFee || 0) * quantity
      : 0;

    return baseFee + weightFee;
  };

  // const calculateTotalShippingCost = () => {
  //   const region = orderData.address?.region || "Niamey";

  //   return order?.nbrProduits.reduce((total, item) => {
  //     const product = allProducts?.find((p) => p._id === item.produit);

  //     if (!product) return total;

  //     const shippingCost = calculateShippingCost(
  //       product,
  //       item.quantite,
  //       region
  //     );
  //     return total + shippingCost;
  //   }, 0);
  // };

  // Résout le snapshot produit depuis order.prod par l'id de nbrProduits
  const getProductSnapshot = (item) => {
    const id = typeof item.produit === "object" ? item.produit?._id : item.produit;
    return order?.prod?.find((p) => String(p._id) === String(id)) || null;
  };

  // Frais réels sauvegardés sur la commande (calculés depuis le client par boutique)
  const calculateTotalShippingCost = () => {
    return order?.fraisLivraison || 0;
  };

  const handleValidateOrder = async () => {
    if (!orderData.order?._id) return;

    setIsValidating(true);
    try {
      await axios.put(
        `${BackendUrl}/mettreAJourStatuts/${orderData.order._id}`
      );
      const orderRes = await axios.get(
        `${BackendUrl}/getCommandesById/${orderData.order._id}`
      );
      setOrderData((prev) => ({ ...prev, order: orderRes.data.commande }));
      // Vous pouvez ajouter une notification de succès ici si vous le souhaitez
    } catch (error) {
      console.error("Error validating order:", error);
      // Vous pouvez ajouter une notification d'erreur ici si vous le souhaitez
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusBadge = (status, type) => {
    const styles = {
      payment: {
        completed: "bg-green-100 text-green-800",
        "en cours": "bg-blue-100 text-blue-800",
        échec: "bg-red-100 text-red-800",
      },
      delivery: {
        completed: "bg-green-100 text-green-800",
        "en cours": "bg-yellow-100 text-yellow-800",
        pending: "bg-gray-100 text-gray-800",
      },
    };

    return (
      <Badge className={styles[type][status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!orderData.order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">Commande introuvable.</div>
      </div>
    );
  }

  const { order, user, address, promoCode, suppliers, sellers } = orderData;

  const canValidateOrder = order.statusPayment !== "recu" && !isValidating;

  // const calculateTotalShippingCost = () => {
  //   return order?.nbrProduits.reduce((total, item) => {
  //     const product = allProducts?.find((p) => p._id === item.produit);
  //     const shippingCost =
  //       product?.shipping?.zones?.[0]?.baseFee ||
  //       product?.prixLivraison ||
  //       1000; // Default shipping cost
  //     return total + shippingCost * item.quantite;
  //   }, 0);
  // };

  const handleConfirmValidation = () => {
    handleValidateOrder();
    setShowValidationModal(false);
  };

  // Fonction pour mise à jour directe d'état
  const handleStatusUpdate = async (newStatus) => {
    if (!order?._id) {
      toast.error("Aucun ID de commande disponible");
      return;
    }

    setIsValidating(true);
    try {
      
      // Mettre à jour l'état de traitement
      await axios.put(
        `${BackendUrl}/command/updateEtatTraitement/${order._id}`,
        { nouvelEtat: newStatus }
      );
      
      // Rafraîchir les données de la commande
      const orderRes = await axios.get(
        `${BackendUrl}/getCommandesById/${orderData.order._id}`
      );
      
      const updatedOrder = orderRes.data.commande;
      
      // Mettre à jour les deux états
      setOrderData((prev) => ({ ...prev, order: updatedOrder }));
      setOrderDetails(updatedOrder);
      
      // Afficher une notification de succès
      setNotification({
        type: 'success',
        message: `✅ État mis à jour vers: ${newStatus}`,
        timestamp: Date.now()
      });
      
      // Auto-masquer après 3 secondes
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état:", error);
      // Afficher une notification d'erreur
      setNotification({
        type: 'error',
        message: `❌ Erreur: ${error.message}`,
        timestamp: Date.now()
      });
      
      // Auto-masquer après 5 secondes
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsValidating(false);
    }
  };

  // Fonctions déplacées vers FinancialOrderManager pour une meilleure séparation des responsabilités

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Notification Toast Responsive */}
        {notification && (
          <div className={`fixed top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto z-50 p-3 sm:p-4 rounded-lg shadow-lg border max-w-full sm:max-w-md animate-slide-in-right ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm sm:text-base pr-2">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {/* Header Responsive avec actions contextuelles - FULL WIDTH */}
        <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
              {/* Titre et référence */}
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                  Commande #{order?.reference}
                </h1>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="bg-white px-2 py-1 rounded-md font-medium">
                    {new Date(order?.date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="bg-white px-2 py-1 rounded-md">
                    Gestion et suivi
                  </span>
                </div>
              </div>
              
              {/* État actuel */}
              <div className="flex flex-col sm:items-end space-y-2">
                <span className="text-xs sm:text-sm text-gray-500 font-medium">État actuel</span>
                <div className={`px-3 py-2 rounded-full font-semibold text-xs sm:text-sm text-center sm:text-right ${
                  order?.etatTraitement === "traitement" ? "bg-yellow-100 text-yellow-800" :
                  order?.etatTraitement === "reçu par le livreur" ? "bg-blue-100 text-blue-800" :
                  order?.etatTraitement === "en cours de livraison" ? "bg-purple-100 text-purple-800" :
                  order?.etatTraitement === "livraison reçu" || order?.etatTraitement === "livré" ? "bg-green-100 text-green-800" :
                  order?.etatTraitement === "annulé" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {order?.etatTraitement || "En attente"}
                </div>
              </div>
            </div>

            {/* Actions rapides contextuelles - Responsive */}
            <div className="mt-4 sm:mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions rapides</h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* === COMMANDES ANNULÉES === */}
              {order?.etatTraitement === "annulé" && (
                <div className="w-full space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                  <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Commande annulée</span>
                  </div>
                  <Button
                    onClick={() => handleStatusUpdate("traitement")}
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2 text-sm"
                    disabled={isValidating}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">Relancer la commande</span>
                    <span className="sm:hidden">Relancer</span>
                  </Button>
                </div>
              )}

              {/* === COMMANDES LIVRÉES === */}
              {(order?.etatTraitement === "livré" || order?.etatTraitement === "livraison reçu" || order?.etatTraitement === "Traité") && (
                <div className="w-full bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Commande terminée</span>
                </div>
              )}

              {/* === COMMANDES EN COURS === */}
              {!["annulé", "livré", "livraison reçu", "Traité"].includes(order?.etatTraitement) && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {/* Bouton pour marquer comme reçu par livreur */}
                  {(order?.etatTraitement === "traitement" || order?.etatTraitement === "en cours" || order?.etatTraitement === "validé") && (
                    <Button
                      onClick={() => handleStatusUpdate("reçu par le livreur")}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 text-sm"
                      disabled={isValidating}
                    >
                      <Package className="h-4 w-4" />
                      <span className="hidden sm:inline">Reçu par livreur</span>
                      <span className="sm:hidden">Reçu</span>
                    </Button>
                  )}
                  
                  {/* Bouton pour marquer comme en cours de livraison */}
                  {order?.etatTraitement === "reçu par le livreur" && (
                    <Button
                      onClick={() => handleStatusUpdate("en cours de livraison")}
                      className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 text-sm"
                      disabled={isValidating}
                    >
                      <Truck className="h-4 w-4" />
                      <span className="hidden sm:inline">En livraison</span>
                      <span className="sm:hidden">Livraison</span>
                    </Button>
                  )}
                  
                  {/* Bouton pour marquer comme livré */}
                  {(order?.etatTraitement === "reçu par le livreur" || order?.etatTraitement === "en cours de livraison") && (
                    <Button
                      onClick={() => handleStatusUpdate("livré")}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 text-sm"
                      disabled={isValidating}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Marquer livré</span>
                      <span className="sm:hidden">Livré</span>
                    </Button>
                  )}
                  
                  {/* Bouton pour annuler (toujours disponible sauf si terminé) */}
                  <Button
                    onClick={() => {
                      if (window.confirm("Êtes-vous sûr de vouloir annuler cette commande ? Cette action créera des transactions d'annulation.")) {
                        handleStatusUpdate("annulé");
                      }
                    }}
                    variant="destructive"
                    className="flex items-center justify-center gap-2 text-sm"
                    disabled={isValidating}
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Annuler commande</span>
                    <span className="sm:hidden">Annuler</span>
                  </Button>
                </div>
              )}

          {/* Bouton de validation général (fallback pour cas non gérés) */}
          {(!order?.etatTraitement || order?.etatTraitement === "en attente") && (
            <Button
              onClick={() => setShowValidationModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!canValidateOrder}
            >
              {isValidating ? "Validation..." : "Valider la commande"}
            </Button>
          )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Valider la commande ?</h2>
            <p className="text-gray-600 mb-6">
              Cette action va mettre à jour le statut de la commande. Êtes-vous
              sûr de vouloir continuer ?
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowValidationModal(false)}
                disabled={isValidating}
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmValidation}
                disabled={isValidating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
        )}
        
        {/* Section Informations Client/Livraison - Grille Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Information client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{address?.numero}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{address?.region}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{address?.quartier}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span>{address?.description}</span>
            </div>
          </CardContent>
        </Card>
          {/* Composant de gestion financière intégré */}
          <FinancialOrderManager 
            order={order}
            onOrderUpdate={(updatedOrder) => setOrderData(prev => ({ ...prev, order: updatedOrder }))}
            allProducts={allProducts}
          />
        </div>

        {/* Section Produits de la Commande - FULL WIDTH */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Détails de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Section État Financier */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                � État Financier & Portefeuille
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">Transactions créées:</span>
                  <span className="ml-2 font-medium">
                    {(order?.etatTraitement === "reçu par le livreur" || order?.etatTraitement === "en cours de livraison") 
                      ? "✅ Oui - Argent EN_ATTENTE dans portefeuille" 
                      : "⏳ En attente - Aucune transaction créée"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">Transactions confirmées:</span>
                  <span className="ml-2 font-medium">
                    {(order?.statusLivraison === "livré" || order?.etatTraitement === "livraison reçu" || order?.etatTraitement === "Traité") 
                      ? "✅ Oui - Argent CONFIRMÉ (disponible après délai)" 
                      : "⏳ En attente de livraison"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">Argent disponible seller:</span>
                  <span className="ml-2 font-medium">
                    {(order?.statusLivraison === "livré" || order?.etatTraitement === "Traité") 
                      ? "🟡 Dans 3-7 jours (délai déblocage)" 
                      : "🔒 Bloqué jusqu'à livraison"}
                  </span>
                </div>
              </div>
              {(order?.statusLivraison === "annulé" || order?.etatTraitement === "Annulée") && (
                <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
                  ❌ <strong>Commande annulée</strong> - Transactions remboursées et stock restauré automatiquement
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Référence</span>
                <div className="font-medium">{order?.reference}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">
                  Statut paiement
                </span>
                <div>{getStatusBadge(order?.statusPayment, "payment")}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">
                  Statut livraison
                </span>
                <div>{getStatusBadge(order?.statusLivraison, "delivery")}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">
                  Prix total
                </span>
                <div className="font-medium">{formatPrice(order?.prix)}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">
                  Frais de livraison
                </span>
                <div className="font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  {formatPrice(calculateTotalShippingCost())}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Tableau Responsive avec scroll horizontal */}
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px] text-xs sm:text-sm">Produit</TableHead>
                    <TableHead className="min-w-[200px] text-xs sm:text-sm">Fournisseur</TableHead>
                    <TableHead className="min-w-[60px] text-center text-xs sm:text-sm">Qté</TableHead>
                    <TableHead className="min-w-[80px] text-xs sm:text-sm hidden md:table-cell">Tailles</TableHead>
                    <TableHead className="min-w-[200px] text-xs sm:text-sm">Produit & Couleurs</TableHead>
                    <TableHead className="min-w-[80px] text-right text-xs sm:text-sm">Prix unit.</TableHead>
                    <TableHead className="min-w-[80px] text-right text-xs sm:text-sm">Total</TableHead>
                    <TableHead className="min-w-[80px] text-right text-xs sm:text-sm hidden lg:table-cell">
                      Frais livraison
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const seenStores = {};
                    return order?.nbrProduits.map((item, index) => {
                      const product = getProductSnapshot(item);
                      const supplier = product?.Clefournisseur;
                      const unitPrice = product?.prixPromo || product?.price || product?.prix || 0;
                      const storeId = String(supplier?._id || product?.createdBy || "unknown");
                      const isFirstOfStore = !seenStores[storeId];
                      seenStores[storeId] = true;
                      const hasShippingByStore = order?.shippingByStore?.length > 0;
                      const storeShipping = hasShippingByStore
                        ? order.shippingByStore.find(s => String(s.storeId) === storeId)
                        : null;
                      // N'afficher que si shippingByStore existe (données fiables)
                      // Pour les vieilles commandes sans shippingByStore : afficher —
                      const shippingCost = (hasShippingByStore && isFirstOfStore && storeShipping)
                        ? storeShipping.shippingCost
                        : null;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {(product?.image1 || product?.imageUrl) && (
                                <img src={product.image1 || product.imageUrl} alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover border shadow-sm shrink-0" />
                              )}
                              <span className="text-sm">{product?.name || "Produit supprimé"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {supplier ? (
                              <div className="flex items-center gap-2">
                                {supplier.logo && (
                                  <img src={supplier.logo} alt="Logo"
                                    className="w-8 h-8 rounded-full object-cover border shrink-0" />
                                )}
                                <div>
                                  <div className="font-semibold text-sm text-blue-700">
                                    {supplier.storeName || supplier.name}
                                  </div>
                                  {(supplier.isvalid) && (
                                    <span className="text-xs text-green-600">✓ Validé</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">—</span>
                            )}
                          </TableCell>
                          <TableCell>{item.quantite}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.tailles?.map((size, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {size}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {/* Couleurs sélectionnées */}
                              {item.couleurs && item.couleurs.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-700">Couleurs :</div>
                                  {/^(http|https):\/\/\S+$/.test(item.couleurs[0]) ? (
                                    // Si ce sont des images de couleurs
                                    <div className="flex gap-1 flex-wrap">
                                      {item.couleurs.map((color, idx) => (
                                        <img
                                          key={idx}
                                          src={color}
                                          alt={`Couleur ${idx + 1}`}
                                          className="w-8 h-8 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                                          title={`Couleur ${idx + 1}`}
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    // Si ce sont des noms de couleurs
                                    <div className="flex gap-1 flex-wrap">
                                      {item.couleurs.map((color, idx) => (
                                        <Badge 
                                          key={idx}
                                          variant="outline" 
                                          className="text-xs px-2 py-1 bg-gray-50"
                                        >
                                          {color}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Si pas de couleurs, on affiche juste l'info */}
                              {(!item.couleurs || item.couleurs.length === 0) && (
                                <div className="text-xs text-gray-400 italic">
                                  Couleur standard
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(unitPrice * item.quantite)}
                          </TableCell>
                          <TableCell className="text-right">
                            {shippingCost !== null
                              ? formatPrice(shippingCost)
                              : <span className="text-gray-300">—</span>}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
                </Table>
              </div>
            </div>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
              {/* Ventilation par boutique depuis shippingByStore (source unique de vérité) */}
              {order?.shippingByStore?.length > 1 &&
                order.shippingByStore.map((entry, i) => (
                  <div key={i} className="flex justify-between items-center text-sm text-gray-600">
                    <span>🏪 {entry.storeName}</span>
                    <span>{formatPrice(entry.shippingCost)}</span>
                  </div>
                ))
              }
              <div className="flex justify-between items-center font-medium pt-1 border-t border-gray-200">
                <span>Total frais de livraison</span>
                <span className="font-bold">{formatPrice(order?.fraisLivraison || 0)}</span>
              </div>
            </div>

            {order?.codePro && promoCode && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Code promo appliqué :{" "}
                    {formatPrice(promoCode.prixReduiction)} de réduction
                  </span>
                </div>
              </div>
            )}

            {order?.pointsDiscount > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">🌿</span>
                    <span className="font-medium text-amber-800">Points Baobab utilisés</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-800">-{formatPrice(order.pointsDiscount)}</span>
                    <p className="text-xs text-amber-600">{order.pointsUsed || 0} pts déduits</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetails;
