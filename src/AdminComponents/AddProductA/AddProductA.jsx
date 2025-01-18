import React, { useEffect, useState } from "react";
import { Package, Upload, X, Save, ArrowLeft } from "lucide-react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import ProductVariantForm from "../ProductVariantForm";
import ShippingRatesManager from "../ShippingRatesManager";

//const BackendUrl = process.env.REACT_APP_Backend_Url;
// const BackendUrl = "https://secoure.onrender.com";
const BackendUrl = process.env.REACT_APP_Backend_Url;

// interface Variant {
//   id: string;
//   color: string;
//   colorName: string;
//   sizes: string[];
//   imageFile: File | null;
//   imagePreview: string | null;
// }

export default function AddProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [variants, setVariants] = useState([]);
  const [mainImages, setMainImages] = useState({
    image1: null,
    image2: null,
    image3: null,
  });
  const [additionalImages, setAdditionalImages] = useState([]);
  const [preview, setPreview] = useState({
    current: "",
    images: [],
  });
  const [Clefournisseur, setClefournisseur] = useState(null);
  const [fournisseur, setFournisseur] = useState(null);
  const [ClefType, setClefType] = useState("");
  const [description, setDescription] = useState("inconu");
  const [prixLivraison, setPrixLivraison] = useState(0);
  // États avec valeurs initiales
  const [zones, setZones] = useState([]);
  // État pour le formulaire d'ajout de transporteur
  const [nouveauTransporteur, setNouveauTransporteur] = useState({
    name: "",
    contact: "",
  });
  const [transporteurs, setTransporteurs] = useState([]);
  const [selectedOriginZone, setSelectedOriginZone] = useState("");
  // État pour le formulaire d'ajout de zone
  const [nouvelleZone, setNouvelleZone] = useState({
    name: "",
    code: "",
    id: 1,
  });
  const [shippingOptions, setShippingOptions] = useState([]);
  const [packageDimensions, setPackageDimensions] = useState({
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
  });
  const [productData, setProductData] = useState({
    desc: "",
    name: "",
    price: "",
    quantity: 0,
    fournisseur: "",
    price_Promo: 0,
    prixF: 0,
    Categorie: "",
    type_de_Produits: "",
    marque: "inconu",
    deliveryPrice: 0,
  });

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productTypes, setProductTypes] = useState([]);

  const handleAlert = (message) => {
    toast.success(`${message} !`);
  };

  const handleAlertwar = (message) => {
    toast.warn(`${message} !`);
  };

  useEffect(() => {
    // Charger les données initiales
    Promise.all([
      axios.get(`${BackendUrl}/fournisseurs`),
      axios.get(`${BackendUrl}/getAllCategories`),
      axios.get(`${BackendUrl}/getAllType`),
    ])
      .then(([suppliersRes, categoriesRes, typesRes]) => {
        setSuppliers(suppliersRes.data.data);
        setCategories(categoriesRes.data.data);
        setProductTypes(typesRes.data.data);
      })
      .catch((error) => {
        toast.error("Erreur lors du chargement des données");
        console.error(error);
      });
  }, []);

  const handleImageChange = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImages((prev) => ({ ...prev, [type]: file }));
      setPreview((prev) => ({
        ...prev,
        current: URL.createObjectURL(file),
        images: [...prev.images, URL.createObjectURL(file)],
      }));
    }
  };

  const handleAdditionalImages = (e) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages(files);
    files.forEach((file) => {
      setPreview((prev) => ({
        ...prev,
        images: [...prev.images, URL.createObjectURL(file)],
      }));
    });
  };

  // Fonction de validation
  function validateTransporteurs(transporteurs) {
    if (!Array.isArray(transporteurs) || transporteurs.length === 0) {
      handleAlertwar("Le tableau est vide ou invalide.");
      return false;
    }

    const requiredFields = [
      "name",
      "baseFee",
      // "weightFee",
      "transporteurContact",
      "transporteurId",
      "transporteurName",
    ];

    for (let i = 0; i < transporteurs.length; i++) {
      const transporteur = transporteurs[i];

      // Vérification des champs requis
      for (const field of requiredFields) {
        if (!(field in transporteur)) {
          handleAlertwar(`Champ manquant: ${field} à l'index ${i + 1}`);
          return false;
        }
      }

      // Vérification des types de données
      if (
        typeof transporteur.name !== "string" ||
        transporteur.name.trim() === ""
      ) {
        handleAlertwar(`Nom invalide à l'index ${i + 1}.`);
        return false;
      }
      if (
        typeof transporteur.transporteurContact !== "string" ||
        !/^[0-9]{8}$/.test(transporteur.transporteurContact)
      ) {
        handleAlertwar(`Contact du transporteur invalide à l'index ${i + 1}}.`);
        return false;
      }
      if (
        typeof transporteur.transporteurId !== "number" ||
        transporteur.transporteurId <= 0
      ) {
        handleAlertwar(`ID du transporteur invalide à l'index ${i + 1}}.`);
        return false;
      }
      if (
        typeof transporteur.baseFee !== "number" ||
        transporteur.baseFee < 0
      ) {
        handleAlertwar(`Frais de base invalide à l'index ${i + 1}.`);
        return false;
      }
      if (
        typeof transporteur.weightFee !== "number" ||
        transporteur.weightFee < 0
      ) {
        handleAlertwar(`Frais par Killo invalide à l'index ${i + 1}.`);
        return false;
      }
      if (
        typeof transporteur.transporteurName !== "string" ||
        transporteur.transporteurName.trim() === ""
      ) {
        handleAlertwar(`Nom du transporteur invalide à l'index ${i + 1}}.`);
        return false;
      }
    }

    handleAlert("Validation réussie.");
    return true;
  }

  // Exemple d'utilisation
  // const transporteurs = [
  //   {
  //       baseFee: 12,
  //       name: "Benine",
  //       transporteurContact: "45353555",
  //       transporteurId: 1,
  //       transporteurName: "Abdoul",
  //       weightFee: 1
  //   },
  //   {
  //       baseFee: 0,
  //       name: "Niamey2",
  //       transporteurContact: "87727502",
  //       transporteurId: 2,
  //       transporteurName: "Aliza"
  //   }
  // ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(shippingOptions);
    // return;
    const errorMessages = {
      image1: "Vous devez mettre l'image1",
      image2: "Vous devez mettre l'image2",
      image3: "Vous devez mettre l'image3",
      colors: "Vous devez mettre au moins une couleur du produit",
      tails: "Vous devez mettre au moins une taille du produit",
      descriptionLength: "La description doit comporter au moins 20 caractères",
      priceInvalid: "Le prix est incorrect",
      quantityInvalid: "La quantité n'est pas valide",
      categorieInvalid: "La catégorie n'est pas valide",
      typeDeProduitsInvalid: "Le type de produits n'est pas valide",
      fournisseurInvalid: "Le fournisseur n'est pas valide",

      // Messages pour les dimensions du produit
      weightInvalid: "Le poids du produit doit être supérieur à 0",
      lengthInvalid: "La longueur du produit doit être supérieure à 0",
      widthInvalid: "La largeur du produit doit être supérieure à 0",
      heightInvalid: "La hauteur du produit doit être supérieure à 0",
      zoneInvalid: "vous deviez mettre au moins une option de livrason",
      origineInvalid: "vous deviez choisir votre zone d'origine ",
    };

    const regexNumber = /^\d+$/;

    if (!mainImages.image1) {
      handleAlertwar(errorMessages.image1);
      return;
    }
    if (!mainImages.image2) {
      handleAlertwar(errorMessages.image2);
      return;
    }
    if (!mainImages.image3) {
      handleAlertwar(errorMessages.image3);
      return;
    }

    // Vérifiez les autres champs obligatoires de la même manière

    if (productData.desc.length <= 20) {
      console.log(productData.desc);
      handleAlertwar(errorMessages.descriptionLength);
      return;
    }

    if (
      !regexNumber.test(productData.price) ||
      Number(productData.price) < 40
    ) {
      handleAlertwar(errorMessages.priceInvalid);
      return;
    }

    if (
      !regexNumber.test(String(productData.quantity)) ||
      Number(productData.quantity) <= 0
    ) {
      handleAlertwar(errorMessages.quantityInvalid);
      return;
    }

    if (ClefType === "Choisir" || !ClefType) {
      handleAlertwar(errorMessages.typeDeProduitsInvalid);
      return;
    }

    if (
      productData.fournisseur.length < 2 ||
      productData.fournisseur === "Choisir"
    ) {
      handleAlertwar(errorMessages.fournisseurInvalid);
      return;
    }
    if (packageDimensions.weight === 0) {
      handleAlertwar(errorMessages.weightInvalid);
      return;
    }
    if (packageDimensions.length === 0) {
      handleAlertwar(errorMessages.lengthInvalid);
      return;
    }
    if (packageDimensions.width === 0) {
      handleAlertwar(errorMessages.widthInvalid);
      return;
    }
    if (packageDimensions.height === 0) {
      handleAlertwar(errorMessages.heightInvalid);
      return;
    }
    if (shippingOptions.length === 0) {
      handleAlertwar(errorMessages.zoneInvalid);
      return;
    }
    if (selectedOriginZone.length === 0 || selectedOriginZone === "choisir") {
      handleAlertwar(errorMessages.origineInvalid);
      return;
    }

    if (validateTransporteurs(shippingOptions)) {
      handleAlert("Prêt pour l'envoi au backend.");
    } else {
      handleAlertwar("Erreur de validation.");
      return;
    }

    // return;

    try {
      const formData = new FormData();

      formData.append("name", productData.name);
      formData.append("shippingZones", JSON.stringify(shippingOptions));
      formData.append("origine", selectedOriginZone);
      formData.append("weight", packageDimensions.weight);
      formData.append("length", packageDimensions.length);
      formData.append("width", packageDimensions.width);
      formData.append("height", packageDimensions.height);
      formData.append("prix", productData.price);
      formData.append("description", productData.desc);
      formData.append("quantite", productData.quantity);
      formData.append("prixPromo", productData.price_Promo);
      // formData.append("couleur", colors);
      formData.append("ClefType", ClefType);
      formData.append("Clefournisseur", Clefournisseur);
      formData.append(
        "marque",
        productData.marque.length != 0 ? productData.marque : "inconu"
      );
      formData.append("prixF", productData.prixF);
      if (productData.deliveryPrice && productData.deliveryPrice > 0) {
        formData.append("prixLivraison", productData.deliveryPrice);
      }

      // Ajouter les images principales
      Object.entries(mainImages).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      // Ajouter les images additionnelles
      // additionalImages.forEach(file => {
      //   formData.append('nouveauChampImages', file);
      // });

      // Ajouter les variantes

      // Ajouter les images des variantes
      variants.forEach((variant, index) => {
        if (variant.imageFile) {
          // Utiliser le nom de la couleur comme clé pour l'upload
          formData.append(`imageVariante${index}`, variant.imageFile);
        }
      });

      formData.append("variants", JSON.stringify(variants));
      setIsLoading(true);
      const response = await axios.post(`${BackendUrl}/product`, formData);
      toast.success(response.data.message);

      // Réinitialiser le formulaire
      setProductData({
        desc: "",
        name: "",
        price: "",
        quantity: 0,
        fournisseur: "",
        price_Promo: 0,
        prixF: 0,
        Categorie: "",
        type_de_Produits: "",
        marque: "inconu",
        deliveryPrice: 0,
      });

      setPackageDimensions({
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
      });
      setShippingOptions([]);
      setVariants([]);
      setMainImages({ image1: null, image2: null, image3: null });
      setAdditionalImages([]);
      setPreview({ current: "", images: [] });
    } catch (error) {
      toast.error("Erreur lors de la création du produit");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Produit</h1>
          <button
            onClick={() => window.history.back()}
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section des informations de base */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Informations de base</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du produit
                </label>
                <input
                  type="text"
                  value={productData.name}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix
                </label>
                <input
                  type="number"
                  value={productData.price}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix promotionnel
                </label>
                <input
                  type="number"
                  value={productData.price_Promo}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      price_Promo: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité
                </label>
                <input
                  type="number"
                  value={productData.quantity}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      quantity: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  prixLivraison (Niamey)
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  type="number"
                  min={0}
                  value={productData.deliveryPrice}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      deliveryPrice: Number(e.target.value),
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  fournisseur
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  onChange={(e) => {
                    setProductData((prev) => ({
                      ...prev,
                      fournisseur: e.target.value,
                    }));
                    suppliers?.map((param, index) => {
                      if (param.email === e.target.value) {
                        console.log(param._id);
                        setClefournisseur(param._id);
                      }
                    });
                  }}
                >
                  <option>Choisir</option>
                  {suppliers ? (
                    suppliers.map((param, index) => {
                      return <option key={index}>{param.email}</option>;
                    })
                  ) : (
                    <option>Auccun</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  type de Produits
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    setClefType(
                      productTypes[Number(e.target.selectedIndex) - 1]?._id
                    );
                  }}
                >
                  <option>Choisir</option>
                  {productTypes ? (
                    productTypes.map((param, index) => {
                      return (
                        <option key={index}>{`${param.name}--> ${
                          categories?.find(
                            (item) => item?._id === param?.clefCategories
                          )?.name
                        }`}</option>
                      );
                    })
                  ) : (
                    <option>Aucun</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marque
                </label>
                <input
                  type="text"
                  defaultValue={productData.marque}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      marque: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PrixFounisseur
                </label>
                <input
                  type="number"
                  value={productData.prixF}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      prixF: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Section des variantes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Variantes du produit</h2>
            <ProductVariantForm variants={variants} setVariants={setVariants} />
          </div>

          {/* Section des images */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Images du produit</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {["image1", "image2", "image3"].map((key, index) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Image principale {index + 1}
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      {mainImages[key] ? (
                        <img
                          src={URL.createObjectURL(mainImages[key])}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            Cliquez pour ajouter
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, key)}
                        accept="image/*"
                        required={!mainImages[key]}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images additionnelles
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Cliquez pour ajouter plusieurs images
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAdditionalImages}
                    multiple
                    accept="image/*"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section de la description */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Description</h2>
            <ReactQuill
              value={productData.desc}
              onChange={(value) =>
                setProductData((prev) => ({ ...prev, desc: value }))
              }
              className="h-64 mb-12"
            />
          </div>

          <ShippingRatesManager
            selectedOriginZone={selectedOriginZone}
            setSelectedOriginZone={setSelectedOriginZone}
            nouvelleZone={nouvelleZone}
            setNouvelleZone={setNouvelleZone}
            zones={zones}
            setZones={setZones}
            nouveauTransporteur={nouveauTransporteur}
            setNouveauTransporteur={setNouveauTransporteur}
            transporteurs={transporteurs}
            setTransporteurs={setTransporteurs}
            shippingOptions={shippingOptions}
            setShippingOptions={setShippingOptions}
            packageDimensions={packageDimensions}
            setPackageDimensions={setPackageDimensions}
          />

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {isLoading ? "Création en cours..." : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}
