import React, { useEffect, useState } from "react";
import { Package, Upload, ArrowLeft, Save } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DeletePicturesButton from "../DeletPictureButton";
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

export default function UpdateProduct() {
  //const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const [isLoading, setIsLoading] = useState(false);
  const [variants, setVariants] = useState([]);
  const [mainImages, setMainImages] = useState({
    image1: null,
    image2: null,
    image3: null,
  });
  const [currentImages, setCurrentImages] = useState({
    image1: "",
    image2: "",
    image3: "",
  });
  const [additionalImages, setAdditionalImages] = useState([]);
  const [currentAdditionalImages, setCurrentAdditionalImages] = useState([]);
  const [ClefType, setClefType] = useState("");
  const [Clefournisseur, setClefournisseur] = useState(null);
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
    name: "",
    description: "",
    price: "",
    pricePromo: "0",
    priceSuplier: 0,
    quantity: "",
    brand: "",
    supplier: "",
    type: "",
    deliveryPrice: "0",
  });

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);

  const chgDeletedVariantIds = (id) => {
    setDeletedVariantIds([...deletedVariantIds, id]); // Crée un nouveau tableau
  };
  const handleAlert = (message) => {
    toast.success(`${message} !`);
  };

  const handleAlertwar = (message) => {
    toast.warn(`${message} !`);
  };
  const refreshProductData = () => {
    console.log("Rafraîchissement des données du produit...");
    // Logique pour rafraîchir les données après suppression
  };

  // Fonction pour extraire et filtrer les transporteurs uniques
  // Fonction de validation
  function validateTransporteurs(transporteurs) {
    if (!Array.isArray(transporteurs) || transporteurs.length === 0) {
      alert("Le tableau est vide ou invalide.");
      return false;
    }

    const requiredFields = [
      "baseFee",
      "name",
      "transporteurContact",
      "transporteurId",
      "transporteurName",
    ];

    for (let i = 0; i < transporteurs.length; i++) {
      const transporteur = transporteurs[i];

      // Vérification des champs requis
      for (const field of requiredFields) {
        if (!(field in transporteur)) {
          alert(`Champ manquant: ${field} à l'index ${i}`);
          return false;
        }
      }

      // Vérification des types de données
      if (
        typeof transporteur.name !== "string" ||
        transporteur.name.trim() === ""
      ) {
        alert(`Nom invalide à l'index ${i}.`);
        return false;
      }
      if (
        typeof transporteur.transporteurContact !== "string" ||
        !/^[0-9]{8}$/.test(transporteur.transporteurContact)
      ) {
        alert(`Contact du transporteur invalide à l'index ${i}.`);
        return false;
      }
      if (
        typeof transporteur.transporteurId !== "number" ||
        transporteur.transporteurId <= 0
      ) {
        alert(`ID du transporteur invalide à l'index ${i}.`);
        return false;
      }
      if (
        typeof transporteur.baseFee !== "number" ||
        transporteur.baseFee < 0
      ) {
        alert(`Frais de base invalide à l'index ${i}.`);
        return false;
      }
      if (
        typeof transporteur.transporteurName !== "string" ||
        transporteur.transporteurName.trim() === ""
      ) {
        alert(`Nom du transporteur invalide à l'index ${i}.`);
        return false;
      }
    }

    alert("Validation réussie.");
    return true;
  }

  // Fonction pour extraire et filtrer les transporteurs uniques
  function extractUniqueTransporteurs(transporteurs) {
    const uniqueTransporteurs = [];
    const seen = new Set();

    for (const transporteur of transporteurs) {
      const key = `${transporteur.transporteurName}-${transporteur.transporteurContact}-${transporteur.transporteurId}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTransporteurs.push({
          name: transporteur.transporteurName,
          contact: transporteur.transporteurContact,
          id: Number(transporteur.transporteurId),
        });
      }
    }
    return uniqueTransporteurs;
  }

  useEffect(() => {
    // Charger les données du produit et les données de référence
    Promise.all([
      axios.get(`${BackendUrl}/Product/${id}`),
      axios.get(`${BackendUrl}/fournisseurs`),
      axios.get(`${BackendUrl}/getAllCategories`),
      axios.get(`${BackendUrl}/getAllType`),
    ])
      .then(([productRes, suppliersRes, categoriesRes, typesRes]) => {
        const product = productRes.data.data;

        // Mettre à jour les images actuelles
        setCurrentImages({
          image1: product.image1,
          image2: product.image2,
          image3: product.image3,
        });
        setCurrentAdditionalImages(product.pictures || []);

        // Convertir les variantes existantes au nouveau format

        const convertedVariants =
          product.variants?.map((variant) => ({
            id: variant._id,
            color: variant.colorCode,
            colorName: variant.color,
            sizes: variant.sizes,
            imageUrl: variant.imageUrl,
            _id: variant._id,
          })) || [];
        setVariants(convertedVariants);
        // console.log(product);
        ////////////////////////////////////// details sur la livrason
        if (product?.shipping) {
          setShippingOptions(product?.shipping?.zones);
          setZones(
            product?.shipping?.zones?.map((param, index) => {
              return {
                name: param.name,
                code: "NM",
                id: index,
              };
            })
          );
        }

        ////////////////////////////////////// details sur la livrason

        setTransporteurs(extractUniqueTransporteurs(product?.shipping?.zones));
        setPackageDimensions({
          weight: product?.shipping?.weight,
          length: product?.shipping?.dimensions?.length,
          width: product?.shipping?.dimensions?.width,
          height: product?.shipping?.dimensions?.height,
        });

        setSelectedOriginZone(product?.shipping?.origine);

        // Mettre à jour les données du produit
        setProductData({
          name: product.name,
          description: product.description,
          price: product.prix.toString(),
          pricePromo: product.prixPromo.toString(),
          priceSuplier: product.prixf?.toString() || "0",
          quantity: product.quantite.toString(),
          brand: product.marque,
          supplier: product.Clefournisseur,
          type: product.ClefType,
          deliveryPrice: product.prixLivraison?.toString() || "0",
        });
        setClefournisseur(product.Clefournisseur);
        setClefType(product.ClefType);

        // console.log(product);

        // Mettre à jour les données de référence
        setSuppliers(suppliersRes.data.data);
        setCategories(categoriesRes.data.data);
        setProductTypes(typesRes.data.data);
      })
      .catch((error) => {
        toast.error("Erreur lors du chargement des données");
        console.error(error);
      });
  }, [id]);

  const handleImageChange = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImages((prev) => ({ ...prev, [type]: file }));
    }
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
        typeof String(transporteur.transporteurContact) !== "string" ||
        !/^[0-9]{8}$/.test(String(transporteur.transporteurContact))
      ) {
        handleAlertwar(`Contact du transporteur invalide à l'index ${i + 1}.`);
        console.log(transporteur.transporteurContact);
        return false;
      }
      if (
        typeof Number(transporteur.transporteurId) !== "number" ||
        Number(transporteur.transporteurId) <= 0
      ) {
        handleAlertwar(`ID du transporteur invalide à l'index ${i + 1}.`);
        console.log(transporteur.transporteurId);
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
        handleAlertwar(`Nom du transporteur invalide à l'index ${i + 1}.`);
        return false;
      }
    }

    handleAlert("Validation réussie.");
    return true;
  }

  const handleAdditionalImages = (e) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log(deletedVariantIds);

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

    if (productData.description.length <= 20) {
      console.log(productData.description);
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

    if (productData.supplier.length < 2 || productData.supplier === "Choisir") {
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
    if (shippingOptions?.length === 0) {
      handleAlertwar(errorMessages.zoneInvalid);
      return;
    }
    if (selectedOriginZone?.length === 0 || selectedOriginZone === "choisir") {
      handleAlertwar(errorMessages.origineInvalid);
      return;
    }

    if (validateTransporteurs(shippingOptions)) {
      // handleAlert("Prêt pour l'envoi au backend.");
    } else {
      handleAlertwar("Erreur de validation.");
      return;
    }

    try {
      const formData = new FormData();

      // Ajouter les images principales modifiées
      Object.entries(mainImages).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      // Ajouter les images additionnelles
      additionalImages.forEach((file) => {
        formData.append("nouveauChampImages", file);
      });

      // Ajouter les images des variantes
      variants.forEach((variant, index) => {
        if (variant.imageFile) {
          // Utiliser le nom de la couleur comme clé pour l'upload
          formData.append(`imageVariante${index}`, variant.imageFile);
        }
      });
      formData.append("name", productData.name);
      formData.append("shippingZones", JSON.stringify(shippingOptions));
      formData.append("origine", selectedOriginZone);
      formData.append("weight", packageDimensions.weight);
      formData.append("length", packageDimensions.length);
      formData.append("width", packageDimensions.width);
      formData.append("height", packageDimensions.height);
      formData.append("prix", productData.price);
      formData.append("description", productData.description);
      formData.append("quantite", productData.quantity);
      formData.append("prixPromo", productData.pricePromo);
      formData.append("ClefType", ClefType);
      formData.append("Clefournisseur", Clefournisseur);
      formData.append("deletedVariantIds", JSON.stringify(deletedVariantIds));
      formData.append(
        "marque",
        productData.brand.length != 0 ? productData.brand : "inconu"
      );

      formData.append("prixF", productData.priceSuplier);
      if (productData.deliveryPrice && Number(productData.deliveryPrice) > 0) {
        formData.append("prixLivraison", productData.deliveryPrice);
      }

      // Ajouter les variantes (sans les fichiers d'image)
      const variantsToSend = variants.map(
        ({ imageFile, imagePreview, ...rest }) => rest
      );
      formData.append("variants", JSON.stringify(variantsToSend));

      // for (let [key, value] of formData.entries()) {
      //   console.log(`${key}:`, value);
      // }

      setIsLoading(true);
      const response = await axios.put(`${BackendUrl}/product/${id}`, formData);
      toast.success(response.data.message);
      setDeletedVariantIds([]);
      const response2 = await axios.get(`${BackendUrl}/product/${id}`);
      const product = response2.data.data;

      // Mettre à jour les images actuelles
      setCurrentImages({
        image1: product.image1,
        image2: product.image2,
        image3: product.image3,
      });
      setCurrentAdditionalImages(product.pictures || []);

      // Convertir les variantes existantes au nouveau format

      const convertedVariants =
        product.variants?.map((variant) => ({
          id: variant._id,
          color: variant.colorCode,
          colorName: variant.color,
          sizes: variant.sizes,
          imageUrl: variant.imageUrl,
          _id: variant._id,
        })) || [];
      setVariants(convertedVariants);
      // console.log(product.variants);

      // Mettre à jour les données du produit
      setProductData({
        name: product.name,
        description: product.description,
        price: product.prix.toString(),
        pricePromo: product.prixPromo.toString(),
        priceSuplier: product.prixf?.toString() || "0",
        quantity: product.quantite.toString(),
        brand: product.marque,
        supplier: product.Clefournisseur,
        type: product.ClefType,
        deliveryPrice: product.prixLivraison?.toString() || "0",
      });
      setClefournisseur(product.Clefournisseur);
      setClefType(product.ClefType);
      // window.location.reload();

      // navigate(`/Admin/ProductDet/${id}`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du produit");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier le Produit
          </h1>
          <button
            // onClick={() => navigate(-1)}
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
        </div>

        <form className="space-y-8">
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
                  value={productData.pricePromo}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      pricePromo: e.target.value,
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
                      quantity: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marque
                </label>
                <input
                  type="text"
                  value={productData.brand}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      brand: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix de livraison (Niamey)
                </label>
                <input
                  type="number"
                  value={productData.deliveryPrice}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      deliveryPrice: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              {/* /////////////////////////////////////////////////////////////////// */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  type de Produits {" : "}
                  {/* {productTypes?.find(type => type._id === ClefType)?.name} :  */}
                  {productTypes ? (
                    productTypes.map((param, index) => {
                      if (param._id === ClefType) {
                        return (
                          <span key={index}>{`${param.name}--> ${
                            categories?.find(
                              (item) => item?._id === param?.clefCategories
                            )?.name
                          }`}</span>
                        );
                      }
                    })
                  ) : (
                    <></>
                  )}
                </label>
                {/* <input
                  type="number"
                  value={productData.deliveryPrice}
                  onChange={e => setProductData(prev => ({ ...prev, deliveryPrice: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                /> */}
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
                  fournisseur :{" "}
                  {
                    suppliers?.find(
                      (fournisseur) => fournisseur._id === Clefournisseur
                    )?.name
                  }
                </label>

                <select
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  onChange={(e) => {
                    setProductData((prev) => ({
                      ...prev,
                      supplier: e.target.value,
                    }));
                    suppliers?.map((param, index) => {
                      if (param.email === e.target.value) {
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
                  PrixFounisseur
                </label>
                <input
                  type="number"
                  value={productData.priceSuplier}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      priceSuplier: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
              {/* /////////////////////////////////////////////////////////////////// */}
            </div>
          </div>

          {/* Section des variantes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Variantes du produit</h2>
            <ProductVariantForm
              chg={chgDeletedVariantIds}
              variants={variants}
              setVariants={setVariants}
            />
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
                      ) : currentImages[key] ? (
                        <img
                          src={currentImages[key]}
                          alt={`Current ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            Cliquez pour modifier
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, key)}
                        accept="image/*"
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {currentAdditionalImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Additional ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center w-full">
                <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Cliquez pour ajouter ou remplacer les images
                      additionnelles
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
              {currentAdditionalImages.length > 0 ? (
                <DeletePicturesButton
                  productId={id}
                  onSuccess={refreshProductData}
                />
              ) : (
                <></>
              )}
            </div>
          </div>

          {/* Section de la description */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Description</h2>
            <ReactQuill
              value={productData.description}
              onChange={(value) =>
                setProductData((prev) => ({ ...prev, description: value }))
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
            produitId={id}
            packageDimensions={packageDimensions}
            setPackageDimensions={setPackageDimensions}
          />

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              // onClick={() => navigate(-1)}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {isLoading ? "Mise à jour en cours..." : "Mettre à jour"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}
