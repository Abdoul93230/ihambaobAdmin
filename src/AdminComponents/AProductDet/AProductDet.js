import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Trash2,
  Edit,
  ChevronLeft,
  Package,
  Truck,
  Info,
  Scale,
  DollarSign,
  Box,
  MapPin,
  Star,
  Store,
  Phone,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const ProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState("");
  const [product, setProduct] = useState(null);
  const [fournisseur, setFournisseur] = useState(null);
  const [types, setTypes] = useState(null);
  const [categorie, setCategorie] = useState(null);
  const [seller, setSeller] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      const [productRes, typesRes, categoriesRes] = await Promise.all([
        axios.get(`${BackendUrl}/Product/${id}`),
        axios.get(`${BackendUrl}/getAllType/`),
        axios.get(`${BackendUrl}/getAllCategories`),
      ]);

      const productData = productRes.data.data;
      setProduct(productData);
      setActiveImage(productData.image1);

      // Fetch seller and supplier data
      const [fournisseurRes] = await Promise.all([
        axios.get(`${BackendUrl}/fournisseur/${productData.Clefournisseur}`),
      ]);
      // const [ sellerRes] = await Promise.all([
      //   axios.get(`${BackendUrl}/getSeller/${productData.Clefournisseur}`),
      // ]);

      // console.log(fournisseurRes.data.data);
      // setSeller(sellerRes.data.data);
      setFournisseur(fournisseurRes.data.data);

      // Set type and category
      const typeData = typesRes.data.data.find(
        (t) => t._id === productData.ClefType
      );
      setTypes(typeData);

      if (typeData) {
        const categoryData = categoriesRes.data.data.find(
          (c) => c._id === typeData.clefCategories
        );
        setCategorie(categoryData);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`${BackendUrl}/Product/${id}`);
      toast.success("Produit supprimé avec succès");
      navigate("/Admin/Products");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
          <Skeleton className="h-[600px] w-full" />
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 hover:bg-gray-100 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="mr-2" /> Retour
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery Section */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-[600px] object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {product.prixPromo > 0 && (
                    <Badge className="absolute top-4 right-4 bg-red-500">
                      Promo!
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 p-4">
                  {[product.image1, product.image2, product.image3]
                    .filter(Boolean)
                    .map((img, idx) => (
                      <button
                        key={idx}
                        className={`relative overflow-hidden rounded-lg transition-all ${
                          activeImage === img
                            ? "ring-2 ring-blue-500"
                            : "opacity-70"
                        }`}
                        onClick={() => setActiveImage(img)}
                      >
                        <img
                          src={img}
                          alt={`Vue ${idx + 1}`}
                          className="h-24 w-full object-cover"
                        />
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Variants Section */}
            {product.variants?.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Package className="mr-2 h-5 w-5" />
                    Variantes disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {product.variants.map((variant, idx) => (
                    <div
                      key={idx}
                      className="group relative overflow-hidden rounded-lg transition-all hover:shadow-md"
                    >
                      <img
                        src={variant.imageUrl}
                        alt={variant.color}
                        className="w-full h-40 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-3 backdrop-blur-sm">
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: variant.colorCode }}
                            />
                            <span className="capitalize">{variant.color}</span>
                          </div>
                          <Badge variant="secondary">
                            Stock: {variant.stock}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Product Information Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-3xl font-bold">
                      {product.name}
                    </CardTitle>
                    <div className="flex space-x-2">
                      {categorie && (
                        <Badge variant="secondary" className="text-sm">
                          {categorie.name}
                        </Badge>
                      )}
                      {types && (
                        <Badge variant="outline" className="text-sm">
                          {types.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-4">
                    <span className="text-3xl font-bold text-blue-600">
                      {product.prixPromo > 0 ? product.prixPromo : product.prix}{" "}
                      FCFA
                    </span>
                    {product.prixPromo > 0 && (
                      <span className="text-xl line-through text-gray-400">
                        {product.prix} FCFA
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 gap-4">
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                    >
                      <Info className="mr-2 h-4 w-4" />
                      Détails
                    </TabsTrigger>
                    <TabsTrigger
                      value="shipping"
                      className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      Livraison
                    </TabsTrigger>
                    <TabsTrigger
                      value="vendor"
                      className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                    >
                      <Store className="mr-2 h-4 w-4" />
                      Vendeur
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Marque</p>
                        <p className="font-medium">{product.marque}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Stock</p>
                        <p className="font-medium">{product.quantite} unités</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Description</h3>
                      <div
                        style={{ textAlign: "left" }}
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: product.description,
                        }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="shipping" className="mt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <Scale className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-gray-500">Poids</p>
                          <p className="font-medium">
                            {product.shipping?.weight} kg
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <Box className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-gray-500">Dimensions</p>
                          <p className="font-medium">
                            {product.shipping?.dimensions.length} x{" "}
                            {product.shipping?.dimensions.width} x{" "}
                            {product.shipping?.dimensions.height} cm
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <MapPin className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-gray-500">Origine</p>
                          <p className="font-medium">
                            {product.shipping?.origine}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-4">
                          Zones de livraison
                        </h3>
                        <Accordion type="single" collapsible className="w-full">
                          {product.shipping?.zones.map((zone, idx) => (
                            <AccordionItem key={idx} value={`zone-${idx}`}>
                              <AccordionTrigger className="hover:bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-blue-500" />
                                  <span>{zone.name}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="p-4 bg-gray-50 rounded-lg mt-2">
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <Truck className="h-4 w-4 text-gray-500" />
                                    <span>{zone.transporteurName}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span>{zone.transporteurContact}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-gray-500" />
                                    <span>
                                      Frais de base: {zone.baseFee} FCFA
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Scale className="h-4 w-4 text-gray-500" />
                                    <span>
                                      Frais par kg: {zone.weightFee} FCFA
                                    </span>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="vendor" className="mt-6">
                    <div className="space-y-6">
                      {seller ? (
                        <Card className="border border-gray-100">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Store className="mr-2 h-5 w-5 text-blue-500" />
                              Informations du vendeur
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">
                                  Nom du vendeur
                                </p>
                                <p className="font-medium">{seller?.name}</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">
                                  Boutique
                                </p>
                                <p className="font-medium">
                                  {fournisseur?.name}
                                </p>
                              </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{seller?.phone}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{seller?.email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span>{seller?.address}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : fournisseur ? (
                        <Card className="border border-gray-100">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Store className="mr-2 h-5 w-5 text-blue-500" />
                              Informations du fournisseur
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">
                                  Nom du fournisseur
                                </p>
                                <p className="font-medium">
                                  {fournisseur?.name}
                                </p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">
                                  Boutique
                                </p>
                                <p className="font-medium">
                                  {fournisseur?.name}
                                </p>
                              </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{fournisseur?.numero}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{fournisseur?.email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span>
                                  {fournisseur?.region} /{" "}
                                  {fournisseur?.quartier}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <></>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex space-x-4">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={() => navigate(`/Admin/ProductUpdat/${id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
