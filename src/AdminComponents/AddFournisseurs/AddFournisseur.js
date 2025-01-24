import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ImagePlus, UserPlus, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import image1 from "../../Images/sac2.png";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function AddFournisseur() {
  const navigate = useNavigate();
  const regexMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regexPhone = /^[0-9]{8,}$/;

  const [photo, setPhoto] = useState(null);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [quartier, setQuartier] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // New state for store creation
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeLogo, setStoreLogo] = useState(null);
  const [showStoreDialog, setShowStoreDialog] = useState(false);

  const validateForm = () => {
    if (nom.trim().length < 2) {
      setError("Le nom du fournisseur doit comporter au moins 2 caractères");
      return false;
    }

    if (!regexMail.test(email)) {
      setError("Le format de l'adresse e-mail n'est pas valide");
      return false;
    }

    if (!regexPhone.test(phone.toString())) {
      setError("Le format du numéro de téléphone n'est pas valide");
      return false;
    }

    if (region.trim().length < 4) {
      setError("Le nom de la région doit comporter au moins 4 caractères");
      return false;
    }

    if (quartier.trim().length < 3) {
      setError("Le nom du quartier doit comporter au moins 3 caractères");
      return false;
    }

    return true;
  };

  const createFournisseur = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", nom);
    formData.set("email", email);
    formData.set("phone", phone);
    formData.set("region", region);
    formData.set("quartier", quartier);
    if (photo) {
      formData.set("image", photo);
    }

    try {
      await axios.post(`${BackendUrl}/fournisseur`, formData);
      navigate("/Admin/AFournisseurs");
    } catch (error) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        "Erreur lors de l'ajout du fournisseur";
      setError(errorMessage);
      setShowErrorDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createStore = async (e) => {
    e.preventDefault();
    // Basic validation for store creation
    if (!storeName.trim() || !storeSlug.trim()) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const storeData = new FormData();
    storeData.set("name", storeName);
    storeData.set("slug", storeSlug);
    if (storeLogo) {
      storeData.set("logo", storeLogo);
    }

    try {
      // Implement store creation API call here
      // await axios.post(`${BackendUrl}/store`, storeData);
      alert("Magasin créé avec succès !");
      setShowStoreDialog(false);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création du magasin");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
    }
  };

  const handleStoreLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoreLogo(file);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Ajouter un Fournisseur
          </CardTitle>
          <CardDescription>
            Saisissez les informations du nouveau fournisseur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="image" className="cursor-pointer">
                <img
                  src={photo ? URL.createObjectURL(photo) : image1}
                  alt="Upload"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </Label>
              <Input
                type="file"
                id="image"
                className="hidden"
                onChange={handlePhotoUpload}
                accept="image/*"
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="abdourazak9323@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Numéro de Téléphone</Label>
                <Input
                  type="tel"
                  placeholder="+227 87727501"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label>Région</Label>
                <Input
                  type="text"
                  placeholder="Niamey"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
              <div>
                <Label>Quartier</Label>
                <Input
                  type="text"
                  placeholder="Saga"
                  value={quartier}
                  onChange={(e) => setQuartier(e.target.value)}
                />
              </div>
            </div>
          </div>

          <form onSubmit={createFournisseur} className="space-y-6">
            <div>
              <Label htmlFor="name">Nom du Fournisseur</Label>
              <Input
                id="name"
                placeholder="Ex: John Doe"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Lui écrire un Email</Label>
              <Textarea
                id="message"
                placeholder="Écrire un message au fournisseur..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}

            <div className="flex space-x-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Ajout en cours..." : "Ajouter le Fournisseur"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1 flex items-center gap-2"
                onClick={() => setShowStoreDialog(true)}
              >
                <Store className="w-4 h-4" /> Créer un Magasin
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erreur</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Store Creation Dialog */}
      <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-6 h-6" /> Créer un Magasin
            </DialogTitle>
            <DialogDescription>
              Saisissez les informations du nouveau magasin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createStore} className="space-y-4 p-4">
            <div>
              <Label htmlFor="storeName">Nom du Magasin</Label>
              <Input
                id="storeName"
                placeholder="Nom du magasin"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="storeSlug">Slug du Magasin</Label>
              <Input
                id="storeSlug"
                placeholder="slug-du-magasin"
                value={storeSlug}
                onChange={(e) => setStoreSlug(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="storeLogo">Logo du Magasin</Label>
              <Input
                type="file"
                id="storeLogo"
                onChange={handleStoreLogoUpload}
                accept="image/*"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Créer le Magasin
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddFournisseur;
