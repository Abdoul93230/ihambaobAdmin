import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select2";
import {
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  Truck,
} from "lucide-react";
import axios from "axios";

const BackendUrl = process.env.REACT_APP_Backend_Url;
// Dans votre composant OrderDetails, ajoutez ces constantes
const ETAT_TRAITEMENT_OPTIONS = [
  "traitement",
  "reçu par le livreur",
  "en cours de livraison",
  "livraison reçu",
  "Traité",
];

const STATUS_LIVRAISON_OPTIONS = ["en cours", "en route", "livré", "annulé"];

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
  const { id } = useParams();

  useEffect(() => {
    const fetchOrderData = async () => {
      setIsLoading(true);
      try {
        const [orderRes, usersRes, addressRes, suppliersRes, sellersRes] =
          await Promise.all([
            axios.get(`${BackendUrl}/getCommandesById/${id}`),
            axios.get(`${BackendUrl}/getUsers`),
            axios.get(`${BackendUrl}/getAllAddressByUser`),
            axios.get(`${BackendUrl}/fournisseurs`),
            axios.get(`${BackendUrl}/getSellers`),
          ]);

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
          suppliers: suppliersRes.data.data,
          sellers: sellersRes.data.data,
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

  const calculateTotalShippingCost = () => {
    const region = orderData.address?.region || "Niamey";
    const processedProducts = new Set();

    return order?.nbrProduits.reduce((total, item) => {
      const product = allProducts?.find((p) => p._id === item.produit);

      if (!product) return total;

      // Only calculate base shipping once per unique product
      let shippingCost = 0;
      if (!processedProducts.has(product._id)) {
        const zoneClient =
          product.shipping?.zones?.find(
            (zone) => zone.name.toLowerCase() === region.toLowerCase()
          ) || product.shipping?.zones?.[0];

        // Base fee applied only once per unique product
        shippingCost += zoneClient?.baseFee || 1000;
        processedProducts.add(product._id);
      }

      // Weight-based fees scale with quantity
      if (product.shipping?.weight) {
        const zoneClient =
          product.shipping.zones?.find(
            (zone) => zone.name.toLowerCase() === region.toLowerCase()
          ) || product.shipping.zones?.[0];

        shippingCost +=
          (zoneClient?.weightFee || 0) *
          product.shipping.weight *
          item.quantite;
      }

      return total + shippingCost;
    }, 0);
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

  const handleUpdateEtatTraitement = async (newEtat) => {
    try {
      await axios.put(
        `${BackendUrl}/command/updateEtatTraitement/${order?._id}`,
        {
          nouvelEtat: newEtat,
        }
      );
      // Rafraîchir les données de la commande
      const orderRes = await axios.get(
        `${BackendUrl}/getCommandesById/${order?._id}`
      );
      setOrderData((prev) => ({ ...prev, order: orderRes.data.commande }));
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de l'état de traitement:",
        error
      );
    }
  };

  const handleUpdateStatusLivraison = async (newStatus) => {
    try {
      await axios.put(
        `${BackendUrl}/command/updateStatusLivraison/${order?._id}`,
        {
          nouveauStatus: newStatus,
        }
      );
      // Rafraîchir les données de la commande
      const orderRes = await axios.get(
        `${BackendUrl}/getCommandesById/${order?._id}`
      );
      setOrderData((prev) => ({ ...prev, order: orderRes.data.commande }));
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut de livraison:",
        error
      );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Détails de la commande</h1>
        <Button
          onClick={() => setShowValidationModal(true)}
          className="bg-green-600 hover:bg-green-700"
          disabled={!canValidateOrder}
        >
          {isValidating ? "Validation..." : "Valider la commande"}
        </Button>
      </div>
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
      <div className="grid md:grid-cols-2 gap-6">
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
        {/* //////////////////////////////////////////////////////// */}
        <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">
              État de traitement
            </h3>
            <Select
              value={order?.etatTraitement}
              onValueChange={handleUpdateEtatTraitement}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un état" />
              </SelectTrigger>
              <SelectContent>
                {ETAT_TRAITEMENT_OPTIONS.map((etat) => (
                  <SelectItem
                    key={etat}
                    value={etat}
                    className="hover:bg-gray-100"
                  >
                    {etat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Statut de livraison
            </h3>
            <Select
              value={order?.statusLivraison}
              onValueChange={handleUpdateStatusLivraison}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_LIVRAISON_OPTIONS.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="hover:bg-gray-100"
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* //////////////////////////////////////////////////////// */}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Détails de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Tailles</TableHead>
                    <TableHead>Couleurs</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">
                      Frais de livraison
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const processedProductIds = new Set();
                    return order?.nbrProduits.map((item, index) => {
                      const product = allProducts?.find(
                        (p) => p?._id === item.produit
                      );
                      const supplier =
                        suppliers?.find(
                          (s) => s._id === product?.Clefournisseur
                        ) ||
                        sellers?.find((s) => s._id === product?.Clefournisseur);
                      const unitPrice = product?.prixPromo || product?.prix;
                      const region = orderData.address?.region || "Niamey";
                      // const shippingCost = product
                      //   ? calculateShippingCost(product, item.quantite, region)
                      //   : 1000; // Default shipping cost

                      const shippingCost = calculateShippingCost(
                        product,
                        item.quantite,
                        region,
                        processedProductIds.has(product?._id)
                      );

                      // Mark this product ID as processed
                      processedProductIds.add(product?._id);

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {product?.name}
                          </TableCell>
                          <TableCell>
                            {supplier?.numero || supplier?.phone || "N/A"}
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
                            {item.couleurs &&
                            /^(http|https):\/\/\S+$/.test(item.couleurs[0]) ? (
                              <div className="flex gap-1">
                                {item.couleurs.map((color, idx) => (
                                  <img
                                    key={idx}
                                    src={color}
                                    alt="Couleur"
                                    className="h-6 w-6 rounded-full object-cover"
                                  />
                                ))}
                              </div>
                            ) : (
                              <span>{item.couleurs?.join(", ")}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(unitPrice * item.quantite)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(shippingCost)}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total frais de livraison</span>
                <span className="font-bold">
                  {formatPrice(calculateTotalShippingCost())}
                </span>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetails;
