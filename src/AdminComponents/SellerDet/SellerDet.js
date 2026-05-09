import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SellerDet.css";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Clock,
  Globe,
  Star,
  Heart,
  Users,
  Package,
  ShoppingBag,
  Eye,
  Trash2,
  MessageSquare,
  Facebook,
  Instagram,
  ExternalLink,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Badge,
  Store,
  Send,
  User,
  Building,
  CreditCard,
  AlertTriangle,
  Settings,
  PackageCheck,
  PackageX,
  Timer,
  Ban,
  Archive,
  PieChart,
  Filter,
  RefreshCw,
  Download,
  CheckSquare,
  Square,
  ChevronDown,
  Loader2
} from "lucide-react";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const getFileExtensionFromUrl = (fileUrl) => {
  if (!fileUrl) return "";

  const cleanUrl = fileUrl.split("?")[0].split("#")[0].toLowerCase();
  const urlParts = cleanUrl.split(".");

  return urlParts.length > 1 ? urlParts[urlParts.length - 1] : "";
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

const SellerDetails = () => {
  const navigate = useNavigate();
  const params = useParams();

  // États pour vos données réelles
  const [seller, setSeller] = useState({});
  const [products, setProducts] = useState([]);
  const [productError, setProductError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("active"); // Changé de "all" à "active"
  const [suspensionMessage, setSuspensionMessage] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isBulkValidating, setIsBulkValidating] = useState(false);
  const [bulkComment, setBulkComment] = useState('');
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const ownerIdentityExtension = getFileExtensionFromUrl(seller?.ownerIdentity);
  const isOwnerIdentityPdf = ownerIdentityExtension === "pdf";
  const isOwnerIdentityImage = IMAGE_EXTENSIONS.includes(ownerIdentityExtension);
  const sellerSubscriptionStatus = String(seller?.subscriptionStatus || (seller?.isvalid ? "active" : "suspended")).toLowerCase();
  const hasSubscriptionReference = Boolean(seller?.subscriptionId);
  const hasLinkedSubscription = ['active', 'trial'].includes(sellerSubscriptionStatus);
  const canActivateSeller = !seller?.isvalid && hasLinkedSubscription;
  const sellerState = seller?.isvalid
    ? (hasLinkedSubscription ? "Compte actif" : "Actif sans abonnement")
    : (hasLinkedSubscription ? "Prêt à activer" : "Activation bloquée");

  const subscriptionTone = seller?.isvalid
    ? (hasLinkedSubscription ? "success" : "warning")
    : (hasLinkedSubscription ? "info" : "danger");

  const subscriptionLabel = hasLinkedSubscription
    ? (sellerSubscriptionStatus === "trial" ? "Essai actif" : "Abonnement valide")
    : (seller?.subscriptionId ? "Abonnement incohérent" : "Aucun abonnement lié");

  const subscriptionHelp = hasLinkedSubscription
    ? `Plan ${sellerSubscriptionStatus}${seller?.subscriptionId ? " lié au compte" : ""}`
    : (seller?.subscriptionId
      ? "Le compte est actif côté interface mais aucun plan valide n\'est associé."
      : "Le backend bloquera toute activation tant qu\'aucun abonnement valide n\'est créé et lié.");

  // Récupération des données (votre code original adapté)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Récupérer les données du seller
        const sellerResponse = await axios.get(`${BackendUrl}/getSeller/${params.id}`);
        setSeller(sellerResponse.data.data);

        // Récupérer les produits du seller
        try {
          const productsResponse = await axios.get(`${BackendUrl}/searchProductBySellerAdmin/${params.id}`);
          setProducts(productsResponse.data.data);
          setProductError(null);
        } catch (error) {
          if (error.response?.status === 404) {
            setProductError(error.response.data.message);
            setProducts([]);
          } else {
            console.log(error);
          }
        }

        // Récupérer les catégories
        const categoriesResponse = await axios.get(`${BackendUrl}/getAllType/`);
        setCategories(categoriesResponse.data.data);

      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const getCategoryColor = (category) => {
    const colors = {
      mode: "bg-purple-100 text-purple-800",
      electronique: "bg-blue-100 text-blue-800",
      maison: "bg-green-100 text-green-800",
      beaute: "bg-pink-100 text-pink-800",
      sports: "bg-orange-100 text-orange-800",
      artisanat: "bg-yellow-100 text-yellow-800",
      bijoux: "bg-indigo-100 text-indigo-800",
      alimentation: "bg-red-100 text-red-800",
      livres: "bg-gray-100 text-gray-800",
      services: "bg-teal-100 text-teal-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getStoreTypeIcon = (type) => {
    switch (type) {
      case 'physique': return <Store className="w-4 h-4" />;
      case 'enligne': return <Globe className="w-4 h-4" />;
      case 'hybride': return <Building className="w-4 h-4" />;
      default: return <Store className="w-4 h-4" />;
    }
  };

  const getProductStatusInfo = (product) => {
    // Logique de priorité pour le statut
    if (!product.isValidated) {
      return {
        label: "Non Validé",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="w-3 h-3" />,
        priority: 4
      };
    }

    switch (product.isPublished) {
      case "Published":
        return {
          label: "Publié",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="w-3 h-3" />,
          priority: 1
        };
      case "UnPublished":
        return {
          label: "Non Publié",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <PackageX className="w-3 h-3" />,
          priority: 3
        };
      case "Attente":
        return {
          label: "En Attente",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Timer className="w-3 h-3" />,
          priority: 2
        };
      case "Refuser":
        return {
          label: "Refusé",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <Ban className="w-3 h-3" />,
          priority: 4
        };
      default:
        return {
          label: "Inconnu",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <AlertTriangle className="w-3 h-3" />,
          priority: 5
        };
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubscriptionToneClass = () => {
    switch (subscriptionTone) {
      case 'success': return 'seller-tone-success';
      case 'warning': return 'seller-tone-warning';
      case 'info': return 'seller-tone-info';
      default: return 'seller-tone-danger';
    }
  };

  // Statistiques améliorées avec produits supprimés
  const calculateStats = () => {
    const allProducts = products.length;
    const deletedProducts = products.filter(p => p.isDeleted).length;
    const activeProducts = products.filter(p => !p.isDeleted).length;

    // Calculer les stats sur les produits actifs seulement
    const activeProductsList = products.filter(p => !p.isDeleted);
    const totalStock = activeProductsList.reduce((sum, product) => sum + (product.quantite || 0), 0);
    const totalValue = activeProductsList.reduce((sum, product) => sum + ((product.prix || 0) * (product.quantite || 0)), 0);

    // Nouvelles statistiques sur les produits actifs
    const validatedProducts = activeProductsList.filter(p => p.isValidated).length;
    const unvalidatedProducts = activeProductsList.filter(p => !p.isValidated).length;
    const publishedProducts = activeProductsList.filter(p => p.isPublished === "Published").length;
    const pendingProducts = activeProductsList.filter(p => p.isPublished === "Attente").length;
    const rejectedProducts = activeProductsList.filter(p => p.isPublished === "Refuser").length;
    const unpublishedProducts = activeProductsList.filter(p => p.isPublished === "UnPublished").length;
    const lowStockProducts = activeProductsList.filter(p => (p.quantite || 0) < 5 && (p.quantite || 0) > 0).length;
    const outOfStockProducts = activeProductsList.filter(p => (p.quantite || 0) === 0).length;

    return {
      allProducts,
      activeProducts,
      deletedProducts,
      totalStock,
      totalValue,
      validatedProducts,
      unvalidatedProducts,
      publishedProducts,
      pendingProducts,
      rejectedProducts,
      unpublishedProducts,
      lowStockProducts,
      outOfStockProducts
    };
  };

  // Fonction pour filtrer les produits améliorée
  const getFilteredProducts = () => {
    switch (productFilter) {
      case "active":
        return products.filter(p => !p.isDeleted);
      case "deleted":
        return products.filter(p => p.isDeleted);
      case "all":
        return products;
      case "validated":
        return products.filter(p => p.isValidated && !p.isDeleted);
      case "unvalidated":
        return products.filter(p => !p.isValidated && !p.isDeleted);
      case "published":
        return products.filter(p => p.isPublished === "Published" && !p.isDeleted);
      case "pending":
        return products.filter(p => p.isPublished === "Attente" && !p.isDeleted);
      case "rejected":
        return products.filter(p => p.isPublished === "Refuser" && !p.isDeleted);
      case "unpublished":
        return products.filter(p => p.isPublished === "UnPublished" && !p.isDeleted);
      case "lowstock":
        return products.filter(p => (p.quantite || 0) < 5 && (p.quantite || 0) > 0 && !p.isDeleted);
      case "outofstock":
        return products.filter(p => (p.quantite || 0) === 0 && !p.isDeleted);
      default:
        return products.filter(p => !p.isDeleted);
    }
  };

  // Fonction pour obtenir le label du filtre actuel améliorée
  const getFilterLabel = () => {
    switch (productFilter) {
      case "active": return "actifs";
      case "deleted": return "supprimés";
      case "all": return "tous";
      case "validated": return "validés";
      case "unvalidated": return "non validés";
      case "published": return "publiés";
      case "pending": return "en attente";
      case "rejected": return "refusés";
      case "unpublished": return "non publiés";
      case "lowstock": return "avec stock faible";
      case "outofstock": return "en rupture de stock";
      default: return "";
    }
  };

  const filteredProducts = getFilteredProducts();
  const stats = calculateStats();

  // Sélection en masse
  const toggleSelectProduct = (id) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p._id)));
    }
  };

  const handleBulkValidate = async (published) => {
    if (selectedProductIds.size === 0) return;
    setIsBulkValidating(true);
    try {
      const adminData = JSON.parse(localStorage.getItem('AdminEcomme') || '{}');
      const token = adminData?.token || localStorage.getItem('AdminAuthToken');
      await axios.put(
        `${BackendUrl}/products/bulk-validate`,
        {
          productIds: Array.from(selectedProductIds),
          published,
          comments: bulkComment.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Mettre à jour localement sans recharger
      setProducts(prev => prev.map(p =>
        selectedProductIds.has(p._id)
          ? { ...p, isPublished: published, isValidated: published === "Published" }
          : p
      ));
      setSelectedProductIds(new Set());
      setBulkComment('');
      setShowBulkPanel(false);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la validation en masse");
    } finally {
      setIsBulkValidating(false);
    }
  };

  // Fonction de validation (votre code original)
  const validateSeller = async () => {
    try {
      if (!seller?.isvalid && !canActivateSeller) {
        alert("Activation bloquée: ce vendeur n\'a pas d\'abonnement valide lié.");
        return;
      }

      // Si on suspend (seller.isvalid === true), on envoie le message
      // Si on valide (seller.isvalid === false), on envoie un body vide
      const requestBody = seller.isvalid && suspensionMessage
        ? { suspensionMessage }
        : {};

      // Vérifier si un message de suspension est requis
      if (seller.isvalid && !suspensionMessage.trim()) {
        alert('Veuillez saisir une raison pour la suspension');
        return;
      }

      await axios.put(`${BackendUrl}/validerDemandeVendeur/${params.id}`, requestBody);

      // Recharger les données du seller après validation
      const response = await axios.get(`${BackendUrl}/getSeller/${params.id}`);
      setSeller(response.data.data);

      setShowValidateModal(false);
      setSuspensionMessage(''); // Reset du message
    } catch (error) {
      console.log(error);
      if (error.response?.status === 400) {
        alert(error.response.data.message);
      }
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : categoryId;
  };

  // Fonction pour supprimer un produit
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        // Ajoutez votre endpoint de suppression ici
        // await axios.delete(`${BackendUrl}/deleteProduct/${productId}`);

        // Recharger les produits
        const response = await axios.get(`${BackendUrl}/searchProductBySellerAdmin/${params.id}`);
        setProducts(response.data.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Fonction pour restaurer un produit supprimé
  const handleRestoreProduct = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir restaurer ce produit ?')) {
      try {
        // Ajoutez votre endpoint de restauration ici
        // await axios.put(`${BackendUrl}/restoreProduct/${productId}`, {});

        // Recharger les produits
        const response = await axios.get(`${BackendUrl}/searchProductBySellerAdmin/${params.id}`);
        setProducts(response.data.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="seller-details-shell min-h-screen bg-gray-50">
      {/* Header */}
      <div className="seller-details-topbar bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Détails du vendeur</h1>
                <p className="text-xs text-gray-500">Vue admin unifiée du compte, des produits et de l'abonnement</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/Admin/AFournisseurUpdate/${params.id}`)}
                className="seller-action seller-action-primary"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => setShowValidateModal(true)}
                disabled={!seller?.isvalid && !canActivateSeller}
                title={!seller?.isvalid && !canActivateSeller ? "Activation bloquée: aucun abonnement valide lié" : undefined}
                className={`seller-action ${seller.isvalid ? 'seller-action-danger' : 'seller-action-success'} ${!seller?.isvalid && !canActivateSeller ? 'seller-action-disabled' : ''}`}
              >
                {seller.isvalid ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <span>{seller.isvalid ? 'Suspendre' : (!canActivateSeller ? 'Activation bloquée' : 'Valider')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`seller-overview-banner ${getSubscriptionToneClass()}`}>
          <div className="seller-overview-banner__left">
            <div className="seller-overview-avatar">
              <img
                src={seller.logo || seller.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'User')}&background=0F766E&color=fff&size=160`}
                alt={seller.name}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'User')}&background=0F766E&color=fff&size=160`;
                }}
              />
            </div>
            <div>
              <div className="seller-overview-kicker">{seller.storeName || 'Boutique sans nom'}</div>
              <h2 className="seller-overview-title">{seller.name} {seller.userName2}</h2>
              <p className="seller-overview-subtitle">{seller.storeDescription || 'Aucune description disponible'}</p>
            </div>
          </div>

          <div className="seller-overview-banner__middle">
            <div className="seller-pill-row">
              <span className={`seller-pill ${seller.isvalid ? 'seller-pill-ok' : 'seller-pill-muted'}`}>
                {seller.isvalid ? 'Compte validé' : 'Compte en attente'}
              </span>
              <span className={`seller-pill ${hasLinkedSubscription ? 'seller-pill-ok' : 'seller-pill-alert'}`}>
                {subscriptionLabel}
              </span>
              <span className="seller-pill seller-pill-neutral">{sellerState}</span>
            </div>
            <p className="seller-overview-hint">{subscriptionHelp}</p>
          </div>

          <div className="seller-overview-banner__right">
            <div className="seller-mini-stat">
              <span>Produits</span>
              <strong>{stats.activeProducts}</strong>
            </div>
            <div className="seller-mini-stat">
              <span>Stock total</span>
              <strong>{stats.totalStock}</strong>
            </div>
            <div className="seller-mini-stat">
              <span>Mise à jour</span>
              <strong>{formatDateTime(seller.updatedAt || seller.createdAt)}</strong>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 seller-card">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Avatar and Basic Info */}
              <div className="flex-shrink-0 text-center lg:text-left">
                <div className="relative inline-block seller-avatar-wrap">
                  <img
                    src={seller.logo || seller.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'User')}&background=3B82F6&color=fff&size=150`}
                    alt={seller.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'User')}&background=3B82F6&color=fff&size=150`;
                    }}
                  />
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${seller.isvalid ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                    {seller.isvalid ?
                      <CheckCircle className="w-4 h-4 text-white" /> :
                      <Clock className="w-4 h-4 text-white" />
                    }
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${seller.isvalid
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {seller.isvalid ? 'Compte validé' : 'En attente de validation'}
                  </span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${hasLinkedSubscription ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {subscriptionLabel}
                  </span>
                </div>
              </div>

              {/* Main Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {seller.name} {seller.userName2}
                    </h1>
                    <p className="text-lg text-gray-600 mt-1">{seller.storeName}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold text-gray-900">{seller.rating || 0}</span>
                      <span className="text-gray-500">({seller.reviewsCount || 0} avis)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-gray-900">{(seller.followersCount || 0).toLocaleString()}</span>
                      <span className="text-gray-500">followers</span>
                    </div>
                  </div>
                </div>

                <div className="seller-quote mb-6">
                  <p className="text-gray-700">{seller.storeDescription || 'Aucune description disponible'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(seller.category)}`}>
                      {seller.category || 'Non défini'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    {getStoreTypeIcon(seller.storeType)}
                    <span className="capitalize">{seller.storeType || 'Non défini'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{seller.city}, {seller.region}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Membre depuis {seller.createdAt ? formatDate(seller.createdAt) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="seller-subscription-panel mt-6">
              <div className="seller-subscription-panel__header">
                <div>
                  <h3>État d'abonnement</h3>
                  <p>Contrôle d'accès à la vente, aux produits et aux commandes</p>
                </div>
                <span className={`seller-pill ${hasLinkedSubscription ? 'seller-pill-ok' : 'seller-pill-alert'}`}>
                  {subscriptionTone === 'success' ? 'Opérationnel' : 'Bloqué'}
                </span>
              </div>
              <div className="seller-subscription-panel__grid">
                <div>
                  <span>Statut backend</span>
                  <strong>{seller.subscriptionStatus || (seller.isvalid ? 'active' : 'suspended')}</strong>
                </div>
                <div>
                  <span>Abonnement valide lié</span>
                  <strong>{hasLinkedSubscription ? 'Oui' : (hasSubscriptionReference ? 'Non (incohérent)' : 'Non')}</strong>
                </div>
                <div>
                  <span>Dernière suspension</span>
                  <strong>{seller.suspensionDate ? formatDateTime(seller.suspensionDate) : 'Aucune'}</strong>
                </div>
                <div>
                  <span>Raison</span>
                  <strong>{seller.suspensionReason || 'Aucune'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Améliorées avec produits supprimés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produits Actifs</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeProducts}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.validatedProducts} validés • {stats.publishedProducts} publiés
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produits Supprimés</p>
                <p className="text-3xl font-bold text-red-600">{stats.deletedProducts}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total: {stats.allProducts} produits
                </p>
              </div>
              <Archive className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Total</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStock}</p>
                <p className="text-xs text-red-500 mt-1">
                  {stats.outOfStockProducts} ruptures • {stats.lowStockProducts} stock faible
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valeur Stock</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalValue.toLocaleString()} F</p>
                <p className="text-xs text-gray-500 mt-1">
                  Produits actifs uniquement
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Attente</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingProducts}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.rejectedProducts} refusés • {stats.unpublishedProducts} non publiés
                </p>
              </div>
              <Timer className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 seller-card">
          <div className="border-b border-gray-200 seller-tabs-shell">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Aperçu', icon: User },
                { id: 'products', label: `Produits (${stats.activeProducts})`, icon: Package },
                { id: 'contact', label: 'Contact & Réseaux', icon: Mail },
                { id: 'documents', label: 'Documents', icon: Badge }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`seller-tab ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Personnelles</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nom complet:</span>
                        <span className="font-medium">{seller.name} {seller.userName2}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email principal:</span>
                        <span className="font-medium">{seller.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email professionnel:</span>
                        <span className="font-medium">{seller.emailp || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Téléphone:</span>
                        <span className="font-medium">{seller.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Boutique</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type de boutique:</span>
                        <span className="font-medium capitalize">{seller.storeType || 'Non défini'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Horaires:</span>
                        <span className="font-medium">{seller.openingHours || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commande minimum:</span>
                        <span className="font-medium">{seller.minimumOrder || 'Aucune'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Code postal:</span>
                        <span className="font-medium">{seller.postalCode || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistiques détaillées pour les admins */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <PieChart className="w-5 h-5" />
                    <span>Statistiques Détaillées des Produits</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{stats.validatedProducts}</div>
                      <div className="text-sm text-green-700">Validés</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{stats.unvalidatedProducts}</div>
                      <div className="text-sm text-red-700">Non validés</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{stats.publishedProducts}</div>
                      <div className="text-sm text-blue-700">Publiés</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{stats.pendingProducts}</div>
                      <div className="text-sm text-yellow-700">En attente</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</div>
                      <div className="text-sm text-orange-700">Stock faible</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-600">{stats.outOfStockProducts}</div>
                      <div className="text-sm text-gray-700">Rupture stock</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse Complète</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{seller.address || 'Adresse non renseignée'}</p>
                    <p className="text-gray-700">{seller.city}, {seller.region}</p>
                    {seller.postalCode && <p className="text-gray-700">{seller.postalCode}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab - Amélioré avec gestion des produits supprimés */}
            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Package className="w-5 h-5" />
                      <span>Gestion des Produits ({filteredProducts.length}/{products.length})</span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Affichage des produits <span className="font-medium">{getFilterLabel()}</span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Filtrer par:</span>
                      <select
                        value={productFilter}
                        onChange={(e) => setProductFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <optgroup label="État général">
                          <option value="active">🟢 Actifs ({stats.activeProducts})</option>
                          <option value="deleted">🗑️ Supprimés ({stats.deletedProducts})</option>
                          <option value="all">📋 Tous ({stats.allProducts})</option>
                        </optgroup>
                        <optgroup label="Statut de validation">
                          <option value="validated">✅ Validés ({stats.validatedProducts})</option>
                          <option value="unvalidated">❌ Non validés ({stats.unvalidatedProducts})</option>
                        </optgroup>
                        <optgroup label="Statut de publication">
                          <option value="published">📢 Publiés ({stats.publishedProducts})</option>
                          <option value="pending">⏳ En attente ({stats.pendingProducts})</option>
                          <option value="rejected">🚫 Refusés ({stats.rejectedProducts})</option>
                          <option value="unpublished">📝 Non publiés ({stats.unpublishedProducts})</option>
                        </optgroup>
                        <optgroup label="Gestion du stock">
                          <option value="lowstock">⚠️ Stock faible ({stats.lowStockProducts})</option>
                          <option value="outofstock">🔴 Rupture stock ({stats.outOfStockProducts})</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Actualiser</span>
                      </button>
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center space-x-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        {selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0
                          ? <CheckSquare className="w-4 h-4" />
                          : <Square className="w-4 h-4" />
                        }
                        <span>{selectedProductIds.size > 0 ? `${selectedProductIds.size} sélectionné(s)` : 'Tout sélectionner'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="space-y-6">
                    {/* Barre d'action en masse */}
                    {selectedProductIds.size > 0 && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <span className="text-sm font-semibold text-indigo-800">
                            {selectedProductIds.size} produit(s) sélectionné(s)
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleBulkValidate("Published")}
                              disabled={isBulkValidating}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {isBulkValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              <span>Publier</span>
                            </button>
                            <button
                              onClick={() => handleBulkValidate("Attente")}
                              disabled={isBulkValidating}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                            >
                              {isBulkValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Timer className="w-3 h-3" />}
                              <span>Attente</span>
                            </button>
                            <button
                              onClick={() => setShowBulkPanel(v => !v)}
                              disabled={isBulkValidating}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Refuser</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleBulkValidate("UnPublished")}
                              disabled={isBulkValidating}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors"
                            >
                              {isBulkValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <PackageX className="w-3 h-3" />}
                              <span>Dépublier</span>
                            </button>
                            <button
                              onClick={() => setSelectedProductIds(new Set())}
                              className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-md hover:bg-gray-50 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                        {showBulkPanel && (
                          <div className="flex gap-2 pt-1 border-t border-indigo-200">
                            <input
                              type="text"
                              value={bulkComment}
                              onChange={e => setBulkComment(e.target.value)}
                              placeholder="Raison du refus (optionnel)..."
                              className="flex-1 px-3 py-1.5 text-sm border border-red-300 rounded-md focus:ring-2 focus:ring-red-400 focus:border-red-400"
                            />
                            <button
                              onClick={() => handleBulkValidate("Refuser")}
                              disabled={isBulkValidating}
                              className="flex items-center space-x-1 px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {isBulkValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              <span>Confirmer le refus</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Résumé du filtre actuel */}
                    {productFilter !== "active" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Filter className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-800">
                              Filtre actuel: {getFilterLabel()}
                            </span>
                            <span className="text-blue-600">
                              ({filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''})
                            </span>
                          </div>
                          <button
                            onClick={() => setProductFilter("active")}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Voir tous les produits actifs
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Grille des produits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((product) => {
                        const statusInfo = getProductStatusInfo(product);
                        const isDeleted = product.isDeleted;

                        return (
                          <div key={product._id} className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow relative ${isDeleted ? 'border-red-200 bg-red-50' : selectedProductIds.has(product._id) ? 'border-indigo-400 ring-2 ring-indigo-200 bg-white' : 'border-gray-200 bg-white'}`}>
                            {/* Checkbox sélection */}
                            {!isDeleted && (
                              <button
                                onClick={() => toggleSelectProduct(product._id)}
                                className="absolute top-2 right-2 z-10 p-1 rounded bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
                              >
                                {selectedProductIds.has(product._id)
                                  ? <CheckSquare className="w-5 h-5 text-indigo-600" />
                                  : <Square className="w-5 h-5 text-gray-400" />
                                }
                              </button>
                            )}
                            <div className="relative">
                              <img
                                src={product.image1 || 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Produit'}
                                alt={product.name}
                                className={`w-full h-48 object-cover ${isDeleted ? 'opacity-60 grayscale' : ''}`}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Produit';
                                }}
                              />

                              {/* Étiquettes de statut */}
                              <div className="absolute top-2 left-2 space-y-1">
                                {isDeleted && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <Archive className="w-3 h-3" />
                                    <span>Supprimé</span>
                                  </span>
                                )}
                                {!isDeleted && (
                                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                    {statusInfo.icon}
                                    <span>{statusInfo.label}</span>
                                  </span>
                                )}
                              </div>

                              {/* Indicateur stock faible */}
                              {!isDeleted && (product.quantite || 0) < 5 && (
                                <div className="absolute top-2 right-10">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {(product.quantite || 0) === 0 ? 'Rupture' : 'Stock faible'}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="p-4">
                              <h4 className={`font-semibold mb-2 truncate ${isDeleted ? 'text-gray-500' : 'text-gray-900'}`}>
                                {product.name}
                              </h4>

                              <div className="space-y-1 text-sm text-gray-600 mb-4">
                                <div className="flex justify-between">
                                  <span>Prix:</span>
                                  <span className={`font-medium ${isDeleted ? 'text-gray-500' : 'text-gray-900'}`}>
                                    {(product.prix || 0).toLocaleString()} F
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Stock:</span>
                                  <span className={`font-medium ${isDeleted ? 'text-gray-500' :
                                    (product.quantite || 0) === 0 ? 'text-red-600' :
                                      (product.quantite || 0) < 5 ? 'text-orange-600' : 'text-gray-900'
                                    }`}>
                                    {product.quantite || 0} pcs
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Type:</span>
                                  <span className={`font-medium ${isDeleted ? 'text-gray-500' : 'text-gray-900'}`}>
                                    {getCategoryName(product.ClefType)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Validation:</span>
                                  <span className={`font-medium ${isDeleted ? 'text-gray-500' :
                                    product.isValidated ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {product.isValidated ? 'Validé' : 'Non validé'}
                                  </span>
                                </div>
                                {isDeleted && (
                                  <div className="flex justify-between">
                                    <span>État:</span>
                                    <span className="font-medium text-red-600">Supprimé</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => navigate(`/Admin/ProductDet/${product._id}`)}
                                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Voir</span>
                                </button>

                                {!isDeleted ? (
                                  <>
                                    <button
                                      onClick={() => navigate(`/Admin/ProductUpdateStatus/${product._id}`)}
                                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                                    >
                                      <Settings className="w-4 h-4" />
                                      <span>Gérer</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(product._id)}
                                      className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleRestoreProduct(product._id)}
                                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                                    title="Restaurer le produit"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Restaurer</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {productFilter === "active"
                        ? (productError || 'Aucun produit actif')
                        : `Aucun produit ${getFilterLabel()}`
                      }
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {productFilter === "active"
                        ? (productError || 'Ce fournisseur n\'a pas encore ajouté de produits.')
                        : `Aucun produit ne correspond au filtre "${getFilterLabel()}".`
                      }
                    </p>
                    {productFilter !== "active" && (
                      <button
                        onClick={() => setProductFilter("active")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Voir les produits actifs
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Téléphone personnel</p>
                          <p className="font-medium">{seller.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Téléphone professionnel</p>
                          <p className="font-medium">{seller.businessPhone}</p>
                        </div>
                      </div>
                      {seller.whatsapp && (
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-500">WhatsApp</p>
                            <p className="font-medium">{seller.whatsapp}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email principal</p>
                          <p className="font-medium">{seller.email}</p>
                        </div>
                      </div>
                      {seller.emailp && (
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Email professionnel</p>
                            <p className="font-medium">{seller.emailp}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Réseaux Sociaux</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seller.website && (
                      <a
                        href={seller.website.startsWith('http') ? seller.website : `https://${seller.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Globe className="w-6 h-6 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium">Site Web</p>
                          <p className="text-sm text-gray-500">{seller.website}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                    {seller.facebook && (
                      <a
                        href={seller.facebook.startsWith('http') ? seller.facebook : `https://${seller.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Facebook className="w-6 h-6 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium">Facebook</p>
                          <p className="text-sm text-gray-500">Page Facebook</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                    {seller.instagram && (
                      <a
                        href={seller.instagram.startsWith('http') ? seller.instagram : `https://${seller.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Instagram className="w-6 h-6 text-pink-500" />
                        <div className="flex-1">
                          <p className="font-medium">Instagram</p>
                          <p className="text-sm text-gray-500">Profil Instagram</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Envoyer un Email</h3>
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tapez votre message ici..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Envoyer</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Documents et Pièces d'Identité</h3>

                {seller.ownerIdentity ? (
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Pièce d'Identité du Propriétaire</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Aperçu du document soumis par le vendeur.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          {isOwnerIdentityPdf ? "PDF" : isOwnerIdentityImage ? "Image" : "Document"}
                        </span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>

                    {isOwnerIdentityImage && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <img
                          src={seller.ownerIdentity}
                          alt="Pièce d'identité"
                          className="w-full h-auto max-h-96 object-contain bg-white"
                        />
                      </div>
                    )}

                    {isOwnerIdentityPdf && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <object
                          data={seller.ownerIdentity}
                          type="application/pdf"
                          className="w-full h-[620px]"
                        >
                          <div className="flex h-[320px] items-center justify-center bg-gray-100 p-4 text-center text-sm text-gray-600">
                            L'aperçu PDF n'est pas disponible dans ce navigateur.
                          </div>
                        </object>
                      </div>
                    )}

                    {!isOwnerIdentityImage && !isOwnerIdentityPdf && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Aperçu indisponible pour ce format de document.
                      </div>
                    )}

                    <a
                      href={seller.ownerIdentity}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir le document dans un nouvel onglet
                    </a>

                    <p className="text-sm text-gray-500 mt-3">
                      Document vérifié et validé par l'administration
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Document Manquant</h4>
                    <p className="text-gray-500">Aucune pièce d'identité n'a été fournie par ce fournisseur.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Validation */}
      {showValidateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="seller-modal bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              {seller.isvalid ? (
                <XCircle className="w-6 h-6 text-red-500" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {seller.isvalid ? 'Suspendre le Fournisseur' : 'Valider le Fournisseur'}
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              {seller.isvalid
                ? 'Pourquoi suspendez-vous ce fournisseur ?'
                : 'Êtes-vous sûr de vouloir valider ce fournisseur ? Il pourra alors vendre sur la plateforme.'
              }
            </p>

            {/* Champ de message de suspension - affiché seulement lors de la suspension */}
            {seller.isvalid && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la suspension *
                </label>
                <textarea
                  value={suspensionMessage}
                  onChange={(e) => setSuspensionMessage(e.target.value)}
                  placeholder="Expliquez la raison de la suspension..."
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows="4"
                  required
                />
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowValidateModal(false);
                  setSuspensionMessage(''); // Reset du message à la fermeture
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={validateSeller}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${seller.isvalid
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
              >
                {seller.isvalid ? 'Suspendre' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDetails;