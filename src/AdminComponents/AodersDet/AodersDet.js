import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import "./AodersDet.css";
import { Badge } from "../../components/ui/badge";
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
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  Truck,
  Store,
} from "lucide-react";
import axios from "axios";
import FinancialOrderManager from "../FinancialOrderManager";

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
  const [orderDetails, setOrderDetails] = useState(null);
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

  // Grouper les produits par vendeur avec leur statut isValideSeller
  const getSellerValidationGroups = () => {
    if (!order?.nbrProduits) return [];
    const groups = {};
    order.nbrProduits.forEach((item) => {
      const product = getProductSnapshot(item);
      const supplier = product?.Clefournisseur;
      const storeId = String(supplier?._id || product?.createdBy || 'unknown');
      if (!groups[storeId]) {
        groups[storeId] = {
          storeId,
          storeName: supplier?.storeName || supplier?.name || 'Vendeur inconnu',
          logo: supplier?.logo || null,
          produits: [],
        };
      }
      groups[storeId].produits.push({
        nom: product?.name || 'Produit supprimé',
        image: product?.image1 || product?.imageUrl || null,
        quantite: item.quantite,
        isValideSeller: item.isValideSeller || false,
        tailles: item.tailles || [],
        couleurs: item.couleurs || [],
      });
    });
    return Object.values(groups);
  };

  // Frais réels sauvegardés sur la commande (calculés depuis le client par boutique)
  const calculateTotalShippingCost = () => {
    return order?.fraisLivraison || 0;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header - FULL WIDTH */}
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

            {/* Géré par FinancialOrderManager ci-dessous */}
          </CardContent>
        </Card>
        
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
            {/* Résumé financier complet */}
            <div className="mt-4 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Sous-total */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Sous-total (articles)</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(order?.prixTotal || (order?.prix - (order?.fraisLivraison || 0) + (order?.reduction || 0) + (order?.pointsDiscount || 0)))}
                  </span>
                </div>

                {/* Frais livraison avec ventilation par boutique */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Frais de livraison</span>
                  <span className="font-medium text-gray-900">+ {formatPrice(order?.fraisLivraison || 0)}</span>
                </div>
                {order?.shippingByStore?.length > 1 && (
                  <div className="pl-4 space-y-1">
                    {order.shippingByStore.map((entry, i) => (
                      <div key={i} className="flex justify-between items-center text-xs text-gray-400">
                        <span>🏪 {entry.storeName}</span>
                        <span>{formatPrice(entry.shippingCost)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Réduction code promo */}
                {(order?.reduction > 0 || (order?.codePro && promoCode)) && (
                  <div className="flex justify-between items-center text-sm bg-green-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CreditCard className="h-4 w-4" />
                      <span>Code promo
                        {order?.codePromo && (
                          <span className="ml-1 text-xs font-bold uppercase tracking-wide text-green-600">
                            ({order.codePromo})
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-bold text-green-700">
                      -{formatPrice(order?.reduction || promoCode?.prixReduiction || 0)}
                    </span>
                  </div>
                )}

                {/* Points Baobab */}
                {order?.pointsDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm bg-amber-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700">
                      <span>🌿</span>
                      <span>Points Baobab
                        <span className="ml-1 text-xs text-amber-500">({order.pointsUsed || 0} pts)</span>
                      </span>
                    </div>
                    <span className="font-bold text-amber-700">-{formatPrice(order.pointsDiscount)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="px-4 py-3 bg-white border-t border-gray-100 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total payé</span>
                <span className="text-xl font-extrabold text-teal-600">{formatPrice(order?.prix)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Section Validation par vendeur - FULL WIDTH */}
        {(() => {
          const groups = getSellerValidationGroups();
          if (!groups.length) return null;
          const totalProduits = groups.reduce((s, g) => s + g.produits.length, 0);
          const totalValides  = groups.reduce((s, g) => s + g.produits.filter(p => p.isValideSeller).length, 0);
          const allDone = totalValides === totalProduits;

          return (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Validation par vendeur
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    allDone
                      ? 'bg-green-100 text-green-700'
                      : totalValides === 0
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {totalValides}/{totalProduits} validé{totalProduits > 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {groups.map((group) => {
                  const total     = group.produits.length;
                  const validated = group.produits.filter(p => p.isValideSeller).length;
                  const allOk     = validated === total;
                  const noneOk    = validated === 0;

                  return (
                    <div key={group.storeId} className="border rounded-xl overflow-hidden">
                      {/* En-tête seller */}
                      <div className={`flex items-center justify-between p-3 border-b ${
                        allOk  ? 'bg-green-50 border-green-100' :
                        noneOk ? 'bg-gray-50 border-gray-100' :
                                 'bg-yellow-50 border-yellow-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          {group.logo ? (
                            <img src={group.logo} alt="Logo"
                              className="w-9 h-9 rounded-full object-cover border shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                              <Store className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-sm">{group.storeName}</div>
                            <div className="text-xs text-gray-500">
                              {validated}/{total} produit{total > 1 ? 's' : ''} validé{validated > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          allOk  ? 'bg-green-100 text-green-700' :
                          noneOk ? 'bg-gray-100 text-gray-600' :
                                   'bg-yellow-100 text-yellow-700'
                        }`}>
                          {allOk ? '✅ Tout validé' : noneOk ? '⏳ En attente' : `⏳ ${validated}/${total}`}
                        </span>
                      </div>

                      {/* Liste des produits du seller */}
                      <div className="divide-y">
                        {group.produits.map((prod, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.nom}
                                className="w-11 h-11 rounded-lg object-cover border shrink-0" />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{prod.nom}</div>
                              <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-0.5">
                                <span>Qté : {prod.quantite}</span>
                                {prod.tailles?.length > 0 && (
                                  <span>Tailles : {prod.tailles.join(', ')}</span>
                                )}
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                              prod.isValideSeller
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-600'
                            }`}>
                              {prod.isValideSeller ? '✓ Validé' : '⏳ En attente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </div>
  );
};

export default OrderDetails;
