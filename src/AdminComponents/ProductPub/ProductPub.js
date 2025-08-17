import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function ProductPub() {
  const [allPub, setAllPub] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [categorie, setCategorie] = useState("");
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchPublications = () => {
    axios
      .get(`${BackendUrl}/productPubget`)
      .then((pub) => {
        setAllPub(pub.data.data.length > 0 ? pub.data.data : null);
      })
      .catch((error) => {
        toast({
          title: "Erreur",
          description: "Impossible de charger les publications",
          variant: "destructive",
        });
      });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const creer = (e) => {
    e.preventDefault();

    if (!categorie) {
      toast({
        title: "Erreur",
        description: "Veuillez choisir une catégorie",
        variant: "destructive",
      });
      return;
    }

    if (!image) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      });
      return;
    }

    const clefCategorie = allCategories.find(
      (item) => item.name === categorie
    )?._id;

    const formData = new FormData();
    formData.append("image", image);
    formData.append("clefCategorie", clefCategorie);

    axios
      .post(`${BackendUrl}/productPubCreate`, formData)
      .then(() => {
        toast({
          title: "Succès",
          description: "Publication créée avec succès",
        });
        setCategorie("");
        setImage(null);
        setPreviewImage(null);
        fetchPublications();
      })
      .catch((error) => {
        toast({
          title: "Erreur",
          description: "Échec de la création de la publication",
          variant: "destructive",
        });
      });
  };

  const deletProductPub = (id) => {
    axios
      .delete(`${BackendUrl}/productPubDelete/${id}`)
      .then(() => {
        toast({
          title: "Succès",
          description: "Publication supprimée",
        });
        fetchPublications();
      })
      .catch((error) => {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la publication",
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    fetchPublications();

    axios
      .get(`${BackendUrl}/getAllCategories`)
      .then((All) => {
        if (All.data.data) {
          setAllCategories(All.data.data);
        }
      })
      .catch((error) => {
        toast({
          title: "Erreur",
          description: "Impossible de charger les catégories",
          variant: "destructive",
        });
      });
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-6 p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Publications Existantes</CardTitle>
        </CardHeader>
        <CardContent>
          {allPub && allPub.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allPub?.map((pub) => (
                <div key={pub._id} className="relative group">
                  <img
                    src={pub.image}
                    alt="Publication"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deletProductPub(pub._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-center text-sm">
                    {
                      allCategories?.find(
                        (item) => item._id === pub.clefCategorie
                      )?.name
                    }
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              Aucune publication enregistrée pour le moment
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ajouter une Publication</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={creer} className="space-y-4">
            <div>
              <Input
                type="file"
                onChange={handleImageChange}
                className="mb-4"
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
            </div>

            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {allCategories?.map((param) => (
                  <SelectItem key={param._id} value={param.name}>
                    {param.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" className="w-full">
              <Upload className="mr-2 h-4 w-4" /> Publier
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductPub;
