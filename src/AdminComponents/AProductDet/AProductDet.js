import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Trash2,
  Edit,
  Image,
  CheckCircle,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function AProductDet() {
  const navigate = useNavigate();
  const params = useParams();
  const [imgP, setImgP] = useState(null);
  const [product, setProduct] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [types, setTypes] = useState("");
  const [categorie, setcategorie] = useState("");
  const [Seller, setSeller] = useState(null);
  const [isWaiting, setIsWaitting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const changeImgP = (param, index) => {
    setImgP(param);
    setActiveImageIndex(index);
  };

  useEffect(() => {
    const id = params.id;

    axios
      .get(`${BackendUrl}/Product/${id}`)
      .then((res) => {
        setProduct(res.data.data);
        if (!imgP) setImgP(res.data.data.image1);

        const ctype = res.data.data.ClefType;
        const cFournisseur = res.data.data.Clefournisseur;

        axios
          .get(`${BackendUrl}/getSeller/${cFournisseur}`)
          .then((res) => {
            setSeller(res.data.data);
          })
          .catch((error) => {
            console.error("Seller fetch error", error);
          });

        axios
          .get(`${BackendUrl}/fournisseur/${cFournisseur}`)
          .then((res) => {
            setFournisseur(res.data.data);
          })
          .catch((error) => {
            console.error("Fournisseur fetch error", error);
          });

        axios
          .get(`${BackendUrl}/getAllType/`)
          .then((res) => {
            const param = res.data.data.find((param) => param._id === ctype);
            if (param) {
              setTypes(param);
              axios
                .get(`${BackendUrl}/getAllCategories`)
                .then((re) => {
                  const para = re.data.data.find(
                    (para) => para._id === param.clefCategories
                  );
                  if (para) {
                    setcategorie(para);
                  }
                })
                .catch((error) => {
                  console.error("Categories fetch error", error);
                });
            }
          })
          .catch((error) => {
            console.error("Types fetch error", error);
          });
      })
      .catch((error) => {
        console.error("Product fetch error", error);
      });
  }, []);

  const SupprimerProduct = () => {
    setIsWaitting(true);
    axios
      .delete(`${BackendUrl}/Product/${params.id}`)
      .then((rep) => {
        toast.success(rep.data.message, {
          position: "top-right",
          autoClose: 3000,
        });
        setIsWaitting(false);
        navigate("/Admin/Products");
      })
      .catch((error) => {
        toast.error("Erreur lors de la suppression", {
          position: "top-right",
          autoClose: 3000,
        });
        setIsWaitting(false);
      });
  };

  const renderGallery = () => {
    const images = [product.image1, product.image2, product.image3];
    return (
      <div className="space-y-4">
        <div className="relative">
          <img
            src={imgP}
            alt="Product"
            className="w-full h-[500px] object-cover rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
          />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-white/70 p-2 rounded-full hover:bg-white/90 transition"
          >
            <ChevronLeft className="text-gray-800" />
          </button>
        </div>
        <div className="flex space-x-4 justify-center">
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Product thumbnail ${index + 1}`}
              onClick={() => changeImgP(img, index)}
              className={`w-24 h-24 object-cover rounded-lg cursor-pointer transition-all duration-300 
                ${
                  activeImageIndex === index
                    ? "border-4 border-blue-500 opacity-100"
                    : "opacity-60 hover:opacity-100"
                }`}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderProductDetails = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-lg rounded-xl p-6 space-y-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {product?.name}
          </h1>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 font-semibold">Prix</p>
              <p className="text-xl text-blue-600">{product?.prix} FCFA</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Prix Promo</p>
              <p className="text-xl text-red-600">{product?.prixPromo} FCFA</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">Quantité</p>
              <p className="font-bold">{product?.quantite}</p>
            </div>
            <div>
              <p className="text-gray-600">Marque</p>
              <p className="font-bold">{product?.marque}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3">Description</h3>
            <div
              className="text-gray-700"
              dangerouslySetInnerHTML={{
                __html: product.description,
              }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">Couleurs</h3>
              <div className="flex space-x-2">
                {product.couleur &&
                  product.couleur[0]
                    .split(",")
                    .map((color, index) => (
                      <span
                        key={index}
                        className="w-10 h-10 rounded-full border-2 border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">Tailles</h3>
              <div className="flex space-x-2">
                {product.taille &&
                  product.taille[0].split(",").map((size, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gray-100 rounded-full text-sm"
                    >
                      {size}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3">
              Informations supplémentaires
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Fournisseur</p>
                <p>{fournisseur?.name || Seller?.name || "Aucun"}</p>
              </div>
              <div>
                <p className="text-gray-600">Catégorie</p>
                <p>{categorie.name || "Aucune"}</p>
              </div>
              <div>
                <p className="text-gray-600">Type de Produit</p>
                <p>{types.name || "Non spécifié"}</p>
              </div>
              <div>
                <p className="text-gray-600">ID Produit</p>
                <p>{product._id}</p>
              </div>
            </div>
          </div>
        </div>

        {product?.pictures && (
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Images Couleurs</h3>
            <div className="grid grid-cols-3 gap-4">
              {product.pictures.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Color variation ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg hover:scale-105 transition"
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={SupprimerProduct}
            className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition flex items-center justify-center"
          >
            <Trash2 className="mr-2" /> Supprimer
          </button>
          <Link
            to={`/Admin/ProductUpdat/${params.id}`}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-center"
          >
            <Edit className="mr-2" /> Modifier
          </Link>
        </div>
      </div>
    );
  };

  if (isWaiting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl text-gray-700">Suppression en cours...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="grid md:grid-cols-2 gap-8">
        <div>{renderGallery()}</div>
        <div>{renderProductDetails()}</div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default AProductDet;
