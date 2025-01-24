import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  Trash,
  Mail,
  Edit,
  Phone,
  MapPin,
  Calendar,
  Package,
  Store,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const AFournisseurDet = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [fournisseur, setFournisseur] = useState(null);
  const [products, setProducts] = useState([]);
  const [productError, setProductError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [emailContent, setEmailContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fournisseurRes = await axios.get(
          `${BackendUrl}/fournisseur/${params.id}`
        );
        setFournisseur(fournisseurRes.data.data);
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${BackendUrl}/searchProductBySupplier/${params.id}`),
          axios.get(`${BackendUrl}/getAllType/`),
        ]);

        setProducts(productsRes.data.data);
        setCategories(categoriesRes.data.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setProductError(error.response.data.message);
        }
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const sendMail = async (e) => {
    e.preventDefault();
    if (!emailContent.trim()) {
      alert("Veuillez saisir le contenu de l'email");
      return;
    }
    setSendingEmail(true);
    try {
      await axios.post(`${BackendUrl}/sendMail/`, {
        email: fournisseur.email,
        content: emailContent,
      });
      setEmailContent("");
      alert("Email envoyé avec succès");
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Erreur lors de l'envoi de l'email");
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!fournisseur) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Impossible de charger les informations du fournisseur
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-32 h-32 mx-auto">
              <AvatarImage src={fournisseur.image} />
              <AvatarFallback className="text-4xl">
                {fournisseur.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{fournisseur.name}</CardTitle>
            <CardDescription>
              Fournisseur depuis{" "}
              {format(new Date(fournisseur.dateCreating), "dd MMMM yyyy", {
                locale: fr,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{fournisseur.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm">+227 {fournisseur.numero}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {fournisseur.region}, {fournisseur.quartier}
              </span>
            </div>
            <div className="pt-4">
              <Button
                className="w-full"
                onClick={() =>
                  navigate(`/Admin/AFournisseurUpdate/${params.id}`)
                }
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier le profil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Store Statistics */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Statistiques de la boutique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{products.length}</div>
                <div className="text-sm text-muted-foreground">Produits</div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">60</div>
                <div className="text-sm text-muted-foreground">Commandes</div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">200k</div>
                <div className="text-sm text-muted-foreground">CA (FCFA)</div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">En cours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Produits ({products.length})</span>
            <Button
              variant="outline"
              onClick={() => navigate("/Admin/AddProduct")}
            >
              Ajouter un produit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productError ? (
            <Alert>
              <AlertDescription>{productError}</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product._id} className="overflow-hidden">
                  <div className="relative group">
                    <img
                      src={product.image1}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          navigate(`/Admin/ProductDet/${product._id}`)
                        }
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Prix:</span>
                        <span className="ml-1 font-medium">
                          {product.prix} FCFA
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock:</span>
                        <span className="ml-1 font-medium">
                          {product.quantite}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      {categories.find((cat) => cat._id === product.ClefType)
                        ?.name || "N/A"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Envoyer un email</CardTitle>
          <CardDescription>
            Communiquez directement avec {fournisseur.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendMail} className="space-y-4">
            <Textarea
              placeholder="Votre message..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={6}
            />
            <Button type="submit" disabled={sendingEmail}>
              {sendingEmail ? "Envoi en cours..." : "Envoyer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AFournisseurDet;
