import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Package,
  User,
  MessageSquare,
  History,
  RefreshCw,
  Eye,
  Truck,
  Calendar,
  FileText,
  Settings,
  Info,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const BackendUrl = process.env.REACT_APP_Backend_Url;
  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
const ProductUpdateStatus = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // États du composant
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [creator, setCreator] = useState(null);
  const [validator, setValidator] = useState(null);
  
  // États des formulaires
  const [productStatus, setProductStatus] = useState("");
  const [shippingStatus, setShippingStatus] = useState("");
  const [comments, setComments] = useState("");
  const [shippingComments, setShippingComments] = useState("");
  const [validationStatus, setValidationStatus] = useState(false);
  
  // États de changement
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    fetchProductData();
  }, [id]);

  useEffect(() => {
    // Détecte si il y a des changements
    const changes = 
      productStatus !== originalData.isPublished ||
      shippingStatus !== originalData.shippingStatus ||
      comments !== originalData.comments ||
      shippingComments !== originalData.shippingComments ||
      validationStatus !== originalData.isValidated;
    
    setHasChanges(changes);
  }, [productStatus, shippingStatus, comments, shippingComments, validationStatus, originalData]);

  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BackendUrl}/ProductAdmin/${id}`);
      const productData = response.data.data;
      
      setProduct(productData);
      setProductStatus(productData.isPublished || "Attente");
      setShippingStatus(productData.shipping?.isPublished || "Published");
      setComments(productData.comments || "");
      setShippingComments(productData.shipping?.comments || "");
      setValidationStatus(productData.isValidated || false);
      
      // Stocker les données originales
      setOriginalData({
        isPublished: productData.isPublished || "Attente",
        shippingStatus: productData.shipping?.isPublished || "Published",
        comments: productData.comments || "",
        shippingComments: productData.shipping?.comments || "",
        isValidated: productData.isValidated || false
      });
     
      if (productData.validatedBy) {
        try {
          const validatorRes = await axios.get(`${BackendUrl}/admin/${productData.validatedBy}`);
          setValidator(validatorRes.data.data);
        } catch (error) {
          console.warn("Erreur chargement validateur:", error);
        }
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
      console.error("Error fetching product:", error);
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info("Aucun changement à sauvegarder");
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        published: productStatus,
        comments: comments,
        isValidated: validationStatus,
        sellerOrAdmin: "admin",
        sellerOrAdmin_id: admin?.id
      };

      await axios.put(`${BackendUrl}/product/validateProduct/${id}`, updateData);

      toast.success("Statut mis à jour avec succès");
      
      // Recharger les données
      await fetchProductData();
      
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error("Error updating product:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      Published: { 
        label: "Publié", 
        color: "bg-green-500", 
        icon: CheckCircle,
        description: "Visible publiquement",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      },
      UnPublished: { 
        label: "Non publié", 
        color: "bg-red-500", 
        icon: XCircle,
        description: "Non visible publiquement",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      },
      Attente: { 
        label: "En attente", 
        color: "bg-yellow-500", 
        icon: Clock,
        description: "En attente de validation",
        textColor: "text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200"
      },
      Refuser: { 
        label: "Refusé", 
        color: "bg-red-600", 
        icon: AlertTriangle,
        description: "Refusé par la modération",
        textColor: "text-red-800",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      }
    };
    return statusMap[status] || statusMap.Attente;
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

  const resetChanges = () => {
    setProductStatus(originalData.isPublished);
    setShippingStatus(originalData.shippingStatus);
    setComments(originalData.comments);
    setShippingComments(originalData.shippingComments);
    setValidationStatus(originalData.isValidated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
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
          <p className="text-gray-600 mb-4">Impossible de charger les informations du produit.</p>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </Card>
      </div>
    );
  }

  const productStatusInfo = getStatusInfo(productStatus);
  const shippingStatusInfo = getStatusInfo(shippingStatus);
  const currentProductStatusInfo = getStatusInfo(product.isPublished);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="hover:bg-gray-100"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion du statut
              </h1>
              <p className="text-gray-600 text-sm">
                {product.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetChanges}
                className="text-gray-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://ihambaobab.onrender.com/ProduitDétail/${id}`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir détail
            </Button>
          </div>
        </div>

        {/* Indicateur de changements */}
        {hasChanges && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-orange-800">Modifications en attente</p>
                    <p className="text-sm text-orange-700">Vous avez des changements non sauvegardés</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={resetChanges}>
                    Annuler
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isSaving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations du produit */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-blue-500" />
              Informations produit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Nom du produit</p>
                  <p className="font-semibold text-gray-900">{product.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Prix</p>
                  <p className="font-semibold text-gray-900">{product.prix} FCFA</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Stock</p>
                  <p className="font-semibold text-gray-900">{product.quantite} unités</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Créé le</p>
                  <p className="font-semibold text-gray-900 text-sm">{formatDate(product.createdAt)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Statut actuel</p>
                  <Badge className={currentProductStatusInfo.color}>
                    {currentProductStatusInfo.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Validation</p>
                  <Badge variant={product.isValidated ? "default" : "secondary"}>
                    {product.isValidated ? "Validé" : "Non validé"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statut principal du produit */}
          <Card className={`border-2 ${productStatusInfo.borderColor} ${productStatusInfo.bgColor}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className={`mr-2 h-5 w-5 ${productStatusInfo.textColor}`} />
                Statut principal du produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productStatus" className="text-sm font-medium">
                  Statut de publication
                </Label>
                <Select value={productStatus} onValueChange={setProductStatus}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Published">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Publié</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="UnPublished">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Non publié</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Attente">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>En attente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Refuser">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span>Refusé</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="validation" className="text-sm font-medium">
                  Statut de validation
                </Label>
                <Select 
                  value={validationStatus.toString()} 
                  onValueChange={(value) => setValidationStatus(value === "true")}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Validé</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="false">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Non validé</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comments" className="text-sm font-medium">
                  Commentaires de modération
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Ajoutez un commentaire expliquant le changement de statut..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ces commentaires aideront à comprendre les raisons du changement de statut
                </p>
              </div>

              {/* Aperçu du statut */}
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm font-medium mb-2">Aperçu du nouveau statut:</p>
                <div className="flex items-center space-x-2">
                  <Badge className={productStatusInfo.color}>
                    {productStatusInfo.label}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {productStatusInfo.description}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Actions disponibles</h3>
                <p className="text-sm text-gray-600">
                  Sauvegardez vos modifications ou annulez les changements
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/Admin/ProductDetail/${id}`)}
                  className="hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir produit
                </Button>
                
                {hasChanges && (
                  <Button
                    variant="outline"
                    onClick={resetChanges}
                    className="text-gray-600 hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={!hasChanges || isSaving}
                      className="bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder les modifications
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <Settings className="mr-2 h-5 w-5 text-blue-500" />
                        Confirmer les modifications
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-left space-y-3">
                        <p>Vous êtes sur le point de modifier le statut du produit:</p>
                        
                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                          {productStatus !== originalData.isPublished && (
                            <p><strong>Statut principal:</strong> {originalData.isPublished} → {productStatus}</p>
                          )}
                          {shippingStatus !== originalData.shippingStatus && (
                            <p><strong>Statut livraison:</strong> {originalData.shippingStatus} → {shippingStatus}</p>
                          )}
                          {validationStatus !== originalData.isValidated && (
                            <p><strong>Validation:</strong> {originalData.isValidated ? 'Validé' : 'Non validé'} → {validationStatus ? 'Validé' : 'Non validé'}</p>
                          )}
                        </div>
                        
                        <p className="text-sm text-amber-600">
                          ⚠️ Ces modifications affecteront la visibilité du produit sur la plateforme.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Confirmer les modifications
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductUpdateStatus;