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
  Settings,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Zap,
  Heart,
  Share2,
  Download,
  ExternalLink,
  User,
  Shield,
  FileText,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const ProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState("");
  const [product, setProduct] = useState(null);
  const [fournisseur, setFournisseur] = useState(null);
  const [types, setTypes] = useState(null);
  const [categorie, setCategorie] = useState(null);
  const [creator, setCreator] = useState(null);
  const [validator, setValidator] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      const [productRes, typesRes, categoriesRes] = await Promise.all([
        axios.get(`${BackendUrl}/ProductAdmin/${id}`),
        axios.get(`${BackendUrl}/getAllType/`),
        axios.get(`${BackendUrl}/getAllCategories`),
      ]);

      const productData = productRes.data.data;
      setProduct(productData);
      
      // Set active image - prioritize image1, then pictures array
      if (productData.image1) {
        setActiveImage(productData.image1);
      } else if (productData.pictures && productData.pictures.length > 0) {
        setActiveImage(productData.pictures[0]);
      }

      // Fetch fournisseur data
      if (productData.Clefournisseur) {
        try {
          const fournisseurRes = await axios.get(`${BackendUrl}/fournisseur/${productData.Clefournisseur}`);
          setFournisseur(fournisseurRes.data.data);
        } catch (error) {
          console.warn("Erreur lors du chargement du fournisseur:", error);
        }
      }

      // Fetch creator and validator info if available
      if (productData.createdBy) {
        try {
          const creatorRes = await axios.get(`${BackendUrl}/user/${productData.createdBy}`);
          setCreator(creatorRes.data.data);
        } catch (error) {
          console.warn("Erreur lors du chargement du créateur:", error);
        }
      }

      if (productData.validatedBy) {
        try {
          const validatorRes = await axios.get(`${BackendUrl}/user/${productData.validatedBy}`);
          setValidator(validatorRes.data.data);
        } catch (error) {
          console.warn("Erreur lors du chargement du validateur:", error);
        }
      }

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
      console.error("Error fetching product data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${BackendUrl}/Product/${id}`);
      toast.success("Produit supprimé avec succès");
      navigate("/Admin/Products");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPublicationStatusInfo = (status) => {
    // alert(status);
    const statusMap = {
      Published: { 
        label: "Publié", 
        color: "bg-green-500", 
        icon: CheckCircle,
        description: "Produit visible publiquement"
      },
      UnPublished: { 
        label: "Non publié", 
        color: "bg-red-500", 
        icon: XCircle,
        description: "Produit non visible publiquement"
      },
      Attente: { 
        label: "En attente", 
        color: "bg-yellow-500", 
        icon: Clock,
        description: "En attente de validation"
      },
      Refuser: { 
        label: "Refusé", 
        color: "bg-red-600", 
        icon: XCircle,
        description: "Produit refusé par la modération"
      }
    };
    return statusMap[status] || statusMap.Attente;
  };

  const calculateStockLevel = () => {
    if (!product) return 0;
    const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || product.quantite;
    const maxStock = 100;
    return Math.min((totalStock / maxStock) * 100, 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDiscountPercentage = () => {
    if (!product.prixPromo || product.prixPromo === 0) return 0;
    return Math.round(((product.prix - product.prixPromo) / product.prix) * 100);
  };

  const getEffectivePrice = () => {
    return product.prixPromo > 0 ? product.prixPromo : product.prix;
  };

  // Get all available images
  const getAllImages = () => {
    const images = [];
    if (product.image1) images.push(product.image1);
    if (product.image2) images.push(product.image2);
    if (product.image3) images.push(product.image3);
    if (product.pictures && Array.isArray(product.pictures)) {
      product.pictures.forEach(pic => {
        if (pic && !images.includes(pic)) images.push(pic);
      });
    }
    return images;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-[600px] w-full" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Produit non trouvé</h2>
          <p className="text-gray-600 mb-4">Le produit demandé n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate("/Admin/Products")}>
            Retour aux produits
          </Button>
        </Card>
      </div>
    );
  }

  const statusInfo = getPublicationStatusInfo(product.isPublished || "Attente");
  // console.log({prod:product.shipping?.isDeleted});
  
  const StatusIcon = statusInfo.icon;
  const stockLevel = calculateStockLevel();
  const allImages = getAllImages();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec navigation et actions rapides */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="hover:bg-gray-100 transition-colors"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="mr-2" /> Retour
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Prévisualiser
            </Button>
          </div>
        </div>
        {/* {alert(statusInfo.label)} */}

        {/* Status et métriques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <StatusIcon className={`h-5 w-5 text-white`} />
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Stock total</p>
                  <p className="font-semibold">{product.quantite} unités</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Prix effectif</p>
                  <p className="font-semibold">{getEffectivePrice()} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Validation</p>
                  <Badge variant={product.isValidated ? "default" : "secondary"}>
                    {product.isValidated ? "Validé" : "Non validé"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Créé le</p>
                  <p className="font-semibold text-sm">{formatDate(product.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Section Galerie d'images */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="relative">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-[600px] object-cover transition-transform duration-300 hover:scale-105"
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                  
                  {/* Badges promotionnels */}
                  <div className="absolute top-4 right-4 flex flex-col space-y-2">
                    {getDiscountPercentage() > 0 && (
                      <Badge className="bg-red-500 animate-pulse">
                        <Zap className="h-3 w-3 mr-1" />
                        -{getDiscountPercentage()}%
                      </Badge>
                    )}
                    {product.isValidated && (
                      <Badge className="bg-green-500">
                        <Shield className="h-3 w-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                    {product.shipping?.isDeleted && (
                      <Badge className="bg-gray-500">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Supprimé
                      </Badge>
                    )}
                  </div>
                  
                  {/* Niveau de stock visuel */}
                  <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-white text-sm mb-2">Niveau de stock</p>
                    <Progress value={stockLevel} className="w-32 h-2" />
                    <p className="text-white text-xs mt-1">
                      {stockLevel > 70 ? "Bon stock" : stockLevel > 30 ? "Stock moyen" : "Stock faible"}
                    </p>
                  </div>
                </div>
                
                {/* Miniatures d'images */}
                {allImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {allImages.slice(0, 8).map((img, idx) => (
                      <button
                        key={idx}
                        className={`relative overflow-hidden rounded-lg transition-all duration-200 ${
                          activeImage === img
                            ? "ring-2 ring-blue-500 scale-105"
                            : "opacity-70 hover:opacity-100"
                        }`}
                        onClick={() => setActiveImage(img)}
                      >
                        <img
                          src={img}
                          alt={`Vue ${idx + 1}`}
                          className="h-20 w-full object-cover"
                        />
                        {activeImage === img && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                      </button>
                    ))}
                    {allImages.length > 8 && (
                      <div className="h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">+{allImages.length - 8}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Variantes */}
            {product.variants?.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl">
                    <div className="flex items-center">
                      <Package className="mr-2 h-5 w-5" />
                      Variantes disponibles
                    </div>
                    <Badge variant="outline">{product.variants.length} variantes</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {product.variants.map((variant, idx) => (
                    <div
                      key={idx}
                      className="group relative overflow-hidden rounded-lg transition-all hover:shadow-md border"
                    >
                      {variant.imageUrl && (
                        <img
                          src={variant.imageUrl}
                          alt={variant.color || `Variante ${idx + 1}`}
                          className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                      <div className="p-3 space-y-2">
                        {variant.color && (
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: variant.colorCode || variant.color }}
                            />
                            <span className="capitalize font-medium">{variant.color}</span>
                          </div>
                        )}
                        {variant.stock !== undefined && (
                          <Badge 
                            variant={variant.stock > 10 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {variant.stock} en stock
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Section informations produit */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-bold mb-2 leading-tight">
                        {product.name}
                      </CardTitle>
                      <p className="text-gray-600">{statusInfo.description}</p>
                      {product.marque && (
                        <p className="text-lg text-gray-700 font-medium mt-1">
                          Marque: {product.marque}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
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
                    <span className="text-4xl font-bold text-blue-600">
                      {getEffectivePrice()} FCFA
                    </span>
                    {getDiscountPercentage() > 0 && (
                      <div className="flex flex-col">
                        <span className="text-xl line-through text-gray-400">
                          {product.prix} FCFA
                        </span>
                        <Badge variant="destructive" className="text-xs w-fit">
                          -{getDiscountPercentage()}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Prix divers */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {product.prixf > 0 && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-700 font-medium">Prix F</p>
                        <p className="font-bold text-yellow-900">{product.prixf} FCFA</p>
                      </div>
                    )}
                    {product.prixLivraison > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700 font-medium">Frais de livraison</p>
                        <p className="font-bold text-green-900">{product.prixLivraison} FCFA</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full grid grid-cols-5 gap-1">
                    <TabsTrigger value="details" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <Info className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Détails</span>
                    </TabsTrigger>
                    <TabsTrigger value="shipping" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <Truck className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Livraison</span>
                    </TabsTrigger>
                    <TabsTrigger value="vendor" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <Store className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Vendeur</span>
                    </TabsTrigger>
                    <TabsTrigger value="management" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <User className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Gestion</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Stats</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">Stock disponible</p>
                        <p className="font-bold text-blue-900">{product.quantite} unités</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-700 font-medium">Date de création</p>
                        <p className="font-bold text-purple-900 text-sm">{formatDate(product.dateCreating || product.createdAt)}</p>
                      </div>
                    </div>

                    {product.description && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Info className="mr-2 h-5 w-5 text-blue-500" />
                          Description détaillée
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <div
                            style={{ textAlign: "left" }}
                            className="prose max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{
                              __html: product.description,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="shipping" className="mt-6">
                    <div className="space-y-6">
                      {product.shipping && (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <Card className="p-4 text-center border border-blue-200 bg-blue-50">
                              <Scale className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                              <p className="text-sm text-blue-700 font-medium">Poids</p>
                              <p className="font-bold text-blue-900">
                                {product.shipping?.weight || 0} kg
                              </p>
                            </Card>
                            <Card className="p-4 text-center border border-purple-200 bg-purple-50">
                              <Box className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                              <p className="text-sm text-purple-700 font-medium">Dimensions</p>
                              <p className="font-bold text-purple-900 text-sm">
                                {product.shipping?.dimensions?.length || 0} x{" "}
                                {product.shipping?.dimensions?.width || 0} x{" "}
                                {product.shipping?.dimensions?.height || 0} cm
                              </p>
                            </Card>
                            <Card className="p-4 text-center border border-green-200 bg-green-50">
                              <MapPin className="h-8 w-8 mx-auto mb-3 text-green-600" />
                              <p className="text-sm text-green-700 font-medium">Origine</p>
                              <p className="font-bold text-green-900">
                                {product.shipping?.origine || "Non spécifié"}
                              </p>
                            </Card>
                          </div>

                          {product.shipping?.zones?.length > 0 && (
                            <div className="mt-6">
                              <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Truck className="mr-2 h-5 w-5 text-blue-500" />
                                Zones de livraison ({product.shipping.zones.length})
                              </h3>
                              <Accordion type="single" collapsible className="w-full space-y-2">
                                {product.shipping.zones.map((zone, idx) => (
                                  <AccordionItem key={idx} value={`zone-${idx}`} className="border rounded-lg">
                                    <AccordionTrigger className="hover:bg-gray-50 p-4 rounded-lg">
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center space-x-3">
                                          <MapPin className="h-5 w-5 text-blue-500" />
                                          <span className="font-medium">{zone.name}</span>
                                        </div>
                                        <Badge variant="outline">{zone.baseFee} FCFA</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-gray-50 rounded-lg mt-2">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                          <div className="flex items-center space-x-2">
                                            <DollarSign className="h-4 w-4 text-gray-500" />
                                            <span>Base: {zone.baseFee} FCFA</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Scale className="h-4 w-4 text-gray-500" />
                                            <span>Par kg: {zone.weightFee} FCFA</span>
                                          </div>
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="vendor" className="mt-6">
                    <div className="space-y-6">
                      {fournisseur ? (
                        <Card className="border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Store className="mr-2 h-5 w-5 text-green-500" />
                              Informations du fournisseur
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-white rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 font-medium">Nom du fournisseur</p>
                                <p className="font-bold text-gray-900">{fournisseur?.name}</p>
                              </div>
                              <div className="p-4 bg-white rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 font-medium">Type de compte</p>
                                <Badge variant={fournisseur?.userRole === 'admin' ? 'default' : 'secondary'}>
                                  {fournisseur?.userRole || 'Vendeur'}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-4 bg-white rounded-lg shadow-sm space-y-3">
                              {fournisseur?.numero && (
                                <div className="flex items-center space-x-3">
                                  <Phone className="h-5 w-5 text-green-500" />
                                  <span className="font-medium">{fournisseur.numero}</span>
                                </div>
                              )}
                              {fournisseur?.email && (
                                <div className="flex items-center space-x-3">
                                  <Mail className="h-5 w-5 text-blue-500" />
                                  <span className="font-medium">{fournisseur.email}</span>
                                </div>
                              )}
                              {(fournisseur?.region || fournisseur?.quartier) && (
                                <div className="flex items-center space-x-3">
                                  <MapPin className="h-5 w-5 text-red-500" />
                                  <span className="font-medium">
                                    {fournisseur?.region} {fournisseur?.quartier && `/ ${fournisseur.quartier}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="p-8 text-center">
                          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">
                            Aucune information fournisseur
                          </h3>
                          <p className="text-gray-500">
                            Les informations du fournisseur ne sont pas disponibles pour ce produit.
                          </p>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="management" className="mt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Informations de création */}
                        <Card className="border border-blue-100 bg-blue-50">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <User className="mr-2 h-5 w-5 text-blue-500" />
                              Création du produit
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-blue-700">Créé par:</span>
                              <span className="font-medium">
                                {creator ? creator.name : 'ID: ' + (product.createdBy || 'Non défini')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-blue-700">Rôle:</span>
                              <Badge variant={product.userRole === 'admin' ? 'default' : 'secondary'}>
                                {product.userRole || 'Non défini'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-blue-700">Date de création:</span>
                              <span className="font-medium text-sm">
                                {formatDate(product.createdAt)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Informations de validation */}
                        <Card className="border border-green-100 bg-green-50">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <Shield className="mr-2 h-5 w-5 text-green-500" />
                              Validation du produit
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-green-700">Statut de validation:</span>
                              <Badge variant={product.isValidated ? 'default' : 'destructive'}>
                                {product.isValidated ? 'Validé' : 'Non validé'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-green-700">Validé par:</span>
                              <span className="font-medium">
                                {validator ? validator.name : (product.validatedBy ? 'ID: ' + product.validatedBy : 'Aucun')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-green-700">Statut de publication:</span>
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Commentaires et notes */}
                      {product.comments && (
                        <Card className="border border-yellow-100 bg-yellow-50">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <FileText className="mr-2 h-5 w-5 text-yellow-500" />
                              Commentaires de modération
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-white p-4 rounded-lg border">
                              <p className="text-gray-700">{product.comments}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Flags et états spéciaux */}
                      <Card className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <Settings className="mr-2 h-5 w-5 text-gray-500" />
                            États du produit
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-700">Suppression logique:</span>
                              <Badge variant={product.shipping?.isDeleted ? 'destructive' : 'secondary'}>
                                {product.shipping?.isDeleted ? 'Supprimé' : 'Actif'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-700">Publication:</span>
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 border border-blue-200 bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <Eye className="h-8 w-8 text-blue-600" />
                            <div>
                              <p className="text-sm text-blue-700 font-medium">Vues</p>
                              <p className="font-bold text-blue-900 text-xl">
                                {product.views || 0}
                              </p>
                            </div>
                          </div>
                        </Card>
                        
                        <Card className="p-4 border border-green-200 bg-green-50">
                          <div className="flex items-center space-x-3">
                            <Heart className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="text-sm text-green-700 font-medium">Favoris</p>
                              <p className="font-bold text-green-900 text-xl">
                                {product.favorites || 0}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>

                      <Card className="p-4 border border-purple-200 bg-purple-50">
                        <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                          <TrendingUp className="mr-2 h-5 w-5" />
                          Historique et performance
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-purple-700">Prix de base</span>
                            <span className="font-bold text-purple-900">
                              {product.prix} FCFA
                            </span>
                          </div>
                          {product.prixPromo > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-purple-700">Prix promotionnel</span>
                              <span className="font-bold text-purple-900">
                                {product.prixPromo} FCFA (-{getDiscountPercentage()}%)
                              </span>
                            </div>
                          )}
                          {product.prixf > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-purple-700">Prix F</span>
                              <span className="font-bold text-purple-900">
                                {product.prixf} FCFA
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-purple-700">Date de création originale</span>
                            <span className="font-bold text-purple-900 text-sm">
                              {formatDate(product.dateCreating)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-purple-700">Dernière modification</span>
                            <span className="font-bold text-purple-900 text-sm">
                              {formatDate(product.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </Card>

                      {/* Métriques de stock */}
                      <Card className="p-4 border border-orange-200 bg-orange-50">
                        <h4 className="font-medium text-orange-900 mb-3 flex items-center">
                          <Package className="mr-2 h-5 w-5" />
                          Analyse du stock
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-orange-700">Stock principal</span>
                            <span className="font-bold text-orange-900">
                              {product.quantite} unités
                            </span>
                          </div>
                          {product.variants?.length > 0 && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-orange-700">Nombre de variantes</span>
                                <span className="font-bold text-orange-900">
                                  {product.variants.length}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-orange-700">Stock total variantes</span>
                                <span className="font-bold text-orange-900">
                                  {product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)} unités
                                </span>
                              </div>
                            </>
                          )}
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-orange-700 text-sm">Niveau de stock</span>
                              <span className="font-bold text-orange-900 text-sm">
                                {Math.round(stockLevel)}%
                              </span>
                            </div>
                            <Progress value={stockLevel} className="h-2" />
                          </div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Boutons d'action améliorés */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Ligne 1: Actions principales */}
                  <Button
                    variant="default"
                    className="h-12 bg-blue-600 hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                    onClick={() => navigate(`/Admin/ProductUpdat/${id}`)}
                  >
                    <Edit className="mr-2 h-5 w-5" />
                    Modifier le produit
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-12 border-purple-300 text-purple-700 hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
                    onClick={() => navigate(`/Admin/ProductUpdateStatus/${id}`)}
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Gérer le statut
                  </Button>
                </div>

                {/* Ligne 2: Actions secondaires */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 hover:bg-blue-50 border-blue-300 text-blue-700"
                    onClick={() => window.open(`https://ihambaobab.onrender.com/ProduitDétail/${id}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir en ligne
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 hover:bg-red-50 border-red-300 text-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                          <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                          Confirmer la suppression
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left">
                          Êtes-vous sûr de vouloir supprimer le produit <strong>"{product.name}"</strong> ?
                          <br /><br />
                          <span className="text-red-600 font-medium">
                            ⚠️ Cette action est irréversible et supprimera définitivement :
                          </span>
                          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                            <li>Toutes les informations du produit</li>
                            <li>Les images et variantes associées</li>
                            <li>L'historique des ventes</li>
                            <li>Les avis et évaluations clients</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Suppression...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer définitivement
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Informations sur le statut */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Statut actuel:</span>
                    <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {statusInfo.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section recommandations améliorées */}
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-yellow-500" />
              Recommandations d'optimisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {stockLevel < 30 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-500 mb-2" />
                  <h4 className="font-medium text-red-900">Stock faible</h4>
                  <p className="text-sm text-red-700">
                    Stock actuel: {product.quantite} unités. Réapprovisionner recommandé.
                  </p>
                </div>
              )}
              
              {(!product.description || product.description.length < 50) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Info className="h-6 w-6 text-yellow-500 mb-2" />
                  <h4 className="font-medium text-yellow-900">Description à améliorer</h4>
                  <p className="text-sm text-yellow-700">
                    Une description plus détaillée améliore les ventes et le référencement.
                  </p>
                </div>
              )}
              
              {allImages.length < 3 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Package className="h-6 w-6 text-blue-500 mb-2" />
                  <h4 className="font-medium text-blue-900">Images supplémentaires</h4>
                  <p className="text-sm text-blue-700">
                    Seulement {allImages.length} image(s). Ajouter plus d'images augmente l'engagement.
                  </p>
                </div>
              )}

              {!product.isValidated && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <Shield className="h-6 w-6 text-orange-500 mb-2" />
                  <h4 className="font-medium text-orange-900">Validation en attente</h4>
                  <p className="text-sm text-orange-700">
                    Le produit n'est pas encore validé. Contacter un administrateur.
                  </p>
                </div>
              )}

              {product.shipping?.isPublished === 'UnPublished' && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <Eye className="h-6 w-6 text-purple-500 mb-2" />
                  <h4 className="font-medium text-purple-900">Produit non publié</h4>
                  <p className="text-sm text-purple-700">
                    Le produit n'est pas visible publiquement. Modifier le statut de publication.
                  </p>
                </div>
              )}

              {(!product.shipping || !product.shipping.zones || product.shipping.zones.length === 0) && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <Truck className="h-6 w-6 text-indigo-500 mb-2" />
                  <h4 className="font-medium text-indigo-900">Options de livraison manquantes</h4>
                  <p className="text-sm text-indigo-700">
                    Ajouter des zones de livraison pour améliorer l'accessibilité du produit.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;