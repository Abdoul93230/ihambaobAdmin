import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Store,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  Upload,
  X,
  ShieldCheck,
  Crown,
  AlertCircle,
  Share2,
} from "lucide-react";
import { toast } from "react-toastify";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const COUNTRIES = [
  { code: "NE", name: "Niger", dial: "+227", flag: "🇳🇪", digits: 8, placeholder: "87 72 75 01" },
  { code: "BJ", name: "Bénin", dial: "+229", flag: "🇧🇯", digits: 8, placeholder: "97 00 00 00" },
  { code: "BF", name: "Burkina Faso", dial: "+226", flag: "🇧🇫", digits: 8, placeholder: "70 00 00 00" },
  { code: "ML", name: "Mali", dial: "+223", flag: "🇲🇱", digits: 8, placeholder: "70 00 00 00" },
  { code: "SN", name: "Sénégal", dial: "+221", flag: "🇸🇳", digits: 9, placeholder: "77 000 00 00" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮", digits: 10, placeholder: "07 00 00 00 00" },
  { code: "TG", name: "Togo", dial: "+228", flag: "🇹🇬", digits: 8, placeholder: "90 00 00 00" },
  { code: "GN", name: "Guinée", dial: "+224", flag: "🇬🇳", digits: 9, placeholder: "620 00 00 00" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷", digits: 9, placeholder: "6 00 00 00 00" },
];

const CATEGORIES = [
  { value: "mode", label: "Mode & Vêtements", icon: "👗" },
  { value: "electronique", label: "Électronique & High-Tech", icon: "📱" },
  { value: "maison", label: "Maison & Décoration", icon: "🏠" },
  { value: "beaute", label: "Beauté & Cosmétiques", icon: "💄" },
  { value: "sports", label: "Sports & Loisirs", icon: "⚽" },
  { value: "artisanat", label: "Artisanat d'Afrique", icon: "🎨" },
  { value: "bijoux", label: "Bijoux & Montres", icon: "💍" },
  { value: "alimentation", label: "Alimentation & Épicerie", icon: "🍎" },
  { value: "livres", label: "Livres & Papeterie", icon: "📚" },
  { value: "services", label: "Services", icon: "💼" },
  { value: "autre", label: "Autre", icon: "📦" },
];

const PLANS = [
  {
    id: "Starter",
    name: "Starter (Essai 1 mois gratuit)",
    badge: "Populaire",
    desc: "Idéal pour lancer une boutique. Caisse POS et gestion complète.",
    color: "border-emerald-500 bg-emerald-50/50 text-emerald-900",
  },
  {
    id: "Pro",
    name: "Plan Pro",
    badge: "Visibilité +",
    desc: "Produits illimités, commissions réduites et mise en avant.",
    color: "border-blue-500 bg-blue-50/50 text-blue-900",
  },
  {
    id: "Business",
    name: "Plan Business",
    badge: "Premium",
    desc: "Commission la plus basse, visibilité sponsoring maximale.",
    color: "border-amber-500 bg-amber-50/50 text-amber-900",
  },
];

export default function AddSeller() {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState("");
  const [userName2, setUserName2] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(COUNTRIES[0]);
  const [phoneRaw, setPhoneRaw] = useState("");
  const [password, setPassword] = useState("Baobab@2026");
  const [showPassword, setShowPassword] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [category, setCategory] = useState("mode");
  const [storeType, setStoreType] = useState("hybride");
  const [businessProfile, setBusinessProfile] = useState("hybride");
  const [city, setCity] = useState("Niger");
  const [region, setRegion] = useState("Niamey");
  const [address, setAddress] = useState("");
  const [planType, setPlanType] = useState("Starter");

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [createdData, setCreatedData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Générateur de mot de passe par défaut
  const generatePassword = () => {
    const prefixes = ["Baobab", "Iham", "Store", "Seller", "Niamey"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const chars = ["!", "@", "#", "$", "*"];
    const special = chars[Math.floor(Math.random() * chars.length)];
    const newPass = `${prefix}${special}${num}`;
    setPassword(newPass);
    setShowPassword(true);
    toast.info(`Mot de passe généré : ${newPass}`);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier du logo ne doit pas dépasser 5 Mo");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Le nom du vendeur est requis.");
    if (!userName2.trim()) return toast.error("Le prénom du vendeur est requis.");
    if (!storeName.trim()) return toast.error("Le nom de la boutique est requis.");
    if (!password.trim() || password.length < 6) {
      return toast.error("Le mot de passe par défaut doit comporter au moins 6 caractères.");
    }

    const cleanEmail = email.trim();
    const cleanPhoneDigits = phoneRaw.replace(/\D/g, "");

    if (!cleanEmail && !cleanPhoneDigits) {
      return toast.error("Veuillez renseigner au moins un email ou un numéro de téléphone.");
    }

    let formattedPhone = "";
    if (cleanPhoneDigits) {
      formattedPhone = `${phoneCountry.dial}${cleanPhoneDigits}`;
    }

    setLoading(true);

    try {
      const storedAdmin = localStorage.getItem("AdminEcomme");
      const adminToken = storedAdmin ? JSON.parse(storedAdmin)?.token : null;

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("userName2", userName2.trim());
      if (cleanEmail) formData.append("email", cleanEmail);
      if (formattedPhone) formData.append("phone", formattedPhone);
      formData.append("password", password.trim());
      formData.append("storeName", storeName.trim());
      if (storeDescription.trim()) formData.append("storeDescription", storeDescription.trim());
      formData.append("category", category);
      formData.append("storeType", storeType);
      formData.append("businessProfile", businessProfile);
      formData.append("city", city.trim() || "Niger");
      formData.append("region", region.trim() || "Niamey");
      if (address.trim()) formData.append("address", address.trim());
      formData.append("planType", planType);

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await axios.post(`${BackendUrl}/api/adminSeller/create-seller`, formData, {
        headers: {
          Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
          "Content-Type": "multipart/form-data",
        },
      });

      setCreatedData(res.data.data);
      toast.success(res.data.message || "Boutique créée et activée avec succès !");
    } catch (err) {
      console.error("Erreur création vendeur:", err);
      const msg = err.response?.data?.message || err.response?.data?.error?.message || "Erreur lors de la création du vendeur.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getShareText = () => {
    if (!createdData) return "";
    const creds = createdData.credentials;
    return `👋 Bonjour ${createdData.seller?.userName2 || ""},\n\nVotre compte vendeur IhamBaobab pour la boutique *${createdData.seller?.storeName}* est créé et immédiatement actif !\n\n📱 Application : SellerMobileApp\n🔑 Identifiant : ${creds.email || creds.phone}\n🔒 Mot de passe : ${creds.defaultPassword}\n\nVous pouvez vous connecter dès maintenant pour gérer vos produits et vos ventes.`;
  };

  const copyCredentials = () => {
    const text = getShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Identifiants copiés dans le presse-papier !");
    setTimeout(() => setCopied(false), 3000);
  };

  const resetForm = () => {
    setCreatedData(null);
    setName("");
    setUserName2("");
    setEmail("");
    setPhoneRaw("");
    setStoreName("");
    setStoreDescription("");
    setAddress("");
    removeLogo();
    generatePassword();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/Admin/Sellers")}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
              title="Retour aux vendeurs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Administration
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Activation Immédiate</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Créer un compte vendeur
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate("/Admin/Sellers")}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200/60 transition-colors self-start sm:self-auto"
          >
            Liste des vendeurs →
          </button>
        </div>

        {/* Modal / Card de succès si créé */}
        {createdData && (
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 lg:p-8 text-white shadow-xl animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/20 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/25 text-xs font-bold uppercase tracking-wider mb-1">
                    Compte activé & prêt à l'emploi
                  </div>
                  <h2 className="text-2xl font-black">
                    {createdData.seller.storeName}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    Gérant : {createdData.seller.name} {createdData.seller.userName2} ({createdData.seller.region}, {createdData.seller.city})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={copyCredentials}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold hover:bg-emerald-50 transition-all shadow-md active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copié !" : "Copier les accès"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getShareText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold transition-all border border-white/20"
                >
                  <Share2 className="w-4 h-4" />
                  Envoyer via WhatsApp
                </a>
              </div>
            </div>

            {/* Identifiants récapitulatifs */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold block mb-1">
                  Identifiant de connexion
                </span>
                <span className="text-lg font-bold select-all break-all text-white">
                  {createdData.credentials.identifier}
                </span>
                <span className="text-xs text-emerald-200/80 block mt-1">
                  (Email ou numéro utilisable indifféremment)
                </span>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold block mb-1">
                  Mot de passe par défaut
                </span>
                <span className="text-lg font-mono font-bold select-all text-amber-300">
                  {createdData.credentials.defaultPassword}
                </span>
                <span className="text-xs text-emerald-200/80 block mt-1">
                  À transmettre au vendeur pour sa 1ère connexion
                </span>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold block mb-1">
                  Statut & Abonnement
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-base font-bold text-white">
                    Actif • Plan {createdData.seller.planType || "Starter"}
                  </span>
                </div>
                <span className="text-xs text-emerald-200/80 block mt-1">
                  Accès débloqué sur SellerMobileApp & Web
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-emerald-100">
                ✨ Le vendeur peut désormais se connecter sur <strong>SellerMobileApp</strong> avec ces identifiants sans aucune étape de validation supplémentaire.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-xs transition-colors"
                >
                  + Créer un autre vendeur
                </button>
                <button
                  onClick={() => navigate("/Admin/Sellers")}
                  className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs transition-colors shadow-sm"
                >
                  Voir la liste des vendeurs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de création */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne gauche (2 colonnes) : Coordonnées & Boutique */}
            <div className="lg:col-span-2 space-y-6">
              {/* Carte 1 : Identifiants & Mot de passe */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Accès & Mot de passe par défaut
                    </h3>
                    <p className="text-xs text-slate-500">
                      Identifiants que le vendeur utilisera pour se connecter à l'app mobile
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Adresse Email <span className="text-slate-400 font-normal lowercase">(optionnel si tél fourni)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vendeur@email.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Numéro de téléphone <span className="text-slate-400 font-normal lowercase">(optionnel si email fourni)</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={phoneCountry.code}
                        onChange={(e) => {
                          const found = COUNTRIES.find((c) => c.code === e.target.value);
                          if (found) setPhoneCountry(found);
                        }}
                        className="w-28 py-2.5 px-2 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-xs font-semibold focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.dial}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phoneRaw}
                          onChange={(e) => setPhoneRaw(e.target.value)}
                          placeholder={phoneCountry.placeholder}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mot de passe par défaut */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      Mot de passe par défaut <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Générer un mot de passe
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ex: Baobab@2026"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Ce mot de passe sera communiqué au vendeur. Il pourra le modifier après sa première connexion.
                  </p>
                </div>
              </div>

              {/* Carte 2 : Identité du Gérant */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Identité du gérant
                    </h3>
                    <p className="text-xs text-slate-500">
                      Nom et prénom du responsable légal de la boutique
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nom de famille <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex : Diallo"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Prénom(s) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={userName2}
                      onChange={(e) => setUserName2(e.target.value)}
                      placeholder="Ex : Moussa"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Carte 3 : Informations Boutique & Localisation */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Boutique & Localisation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Informations visibles sur la marketplace IhamBaobab
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Nom de la boutique */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nom commercial de la boutique <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Ex : Mode & Tendance Niamey"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-semibold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Catégorie */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Catégorie
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.icon} {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type de boutique */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Canal de vente
                      </label>
                      <select
                        value={storeType}
                        onChange={(e) => setStoreType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 outline-none"
                      >
                        <option value="hybride">Hybride (Physique & En ligne)</option>
                        <option value="physique">Boutique physique</option>
                        <option value="enligne">En ligne uniquement</option>
                      </select>
                    </div>

                    {/* Profil vendeur */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Profil vendeur
                      </label>
                      <select
                        value={businessProfile}
                        onChange={(e) => setBusinessProfile(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 outline-none"
                      >
                        <option value="hybride">Hybride (Création & Revente)</option>
                        <option value="commercant">Commerçant / Revente</option>
                        <option value="createur">Artisan / Créateur</option>
                      </select>
                    </div>
                  </div>

                  {/* Localisation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Pays
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex : Niger"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Région / Ville
                      </label>
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="Ex : Niamey"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Description courte */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Description de la boutique <span className="text-slate-400 font-normal lowercase">(optionnelle)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      placeholder="Présentation des produits et de la boutique..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite (1 colonne) : Abonnement, Logo & Validation */}
            <div className="space-y-6">
              {/* Carte Abonnement */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900">
                    Plan & Abonnement
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {PLANS.map((p) => {
                    const isSel = planType === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPlanType(p.id)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          isSel ? p.color : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{p.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white/80 border border-slate-200">
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    <strong>Validation automatique :</strong> Le compte sera créé avec le statut <code>isvalid: true</code> et un mois d'accès gratuit activé.
                  </p>
                </div>
              </div>

              {/* Carte Logo */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Logo de la boutique
                  </h3>
                  <span className="text-xs text-slate-400">Optionnel</span>
                </div>

                {logoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex flex-col items-center">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-28 h-28 object-cover rounded-xl shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="mt-2 text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <X className="w-3.5 h-3.5" /> Supprimer le logo
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                    <Upload className="w-7 h-7 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-700">Importer un logo</span>
                    <span className="text-xs text-slate-400 mt-0.5">PNG, JPG jusqu'à 5 Mo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Bouton de soumission */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création et activation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Créer & Activer le vendeur
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-400">
                  Le vendeur sera immédiatement opérationnel sur Mobile et Web.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
