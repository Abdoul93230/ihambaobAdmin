import React, { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  Home,
  TrendingUp,
  Inbox,
  Package,
  Users,
  ShoppingCart,
  PlusCircle,
  ShoppingBag,
  Tags,
  Newspaper,
  LogOut,
  Search,
  Bell,
  Menu,
  Settings,
  MessageCircle,
  Crown,
  CreditCard,
  RefreshCw,
  Ticket,
  MapPin,
  Map,
  Truck,
  ChevronRight,
  X,
  Gift,
} from "lucide-react";
import { Wallet as WalletIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import all page components
import Analytics from "../Analytics/Analytics";
import Imbox from "../Inbox/Imbox";
import Products from "../Products/Products";
import AProductDet from "../AProductDet/AProductDet";
import ProductUpdateStatus from "../AProductDet/ProductUpdateStatus";
import AProductUpdat from "../AProductUpdat/AProductUpdat";
import AddProductA from "../AddProductA/AddProductA";
import ACustomers from "../ACustomers/ACustomers";
import AOrders from "../AOrders/AOrders";
import ACustomerDet from "../ACustomerDet/ACustomerDet";
import AodersDet from "../AodersDet/AodersDet";
import Sellers from "../Sellers/Sellers";
import SellerDet from "../SellerDet/SellerDet";
import AddCategorie from "../AddCategorie/AddCategorie";
import ProductPub from "../ProductPub/ProductPub";
import Overview from "../Overview/Overview";
import AdminFinancialDashboard from "./AdminFinancialDashboard";
import ShippingZonesAdmin from "../Livraisons/Livraison";
import AdminZones from "@/zones/AdminZones";
import { useAuth } from "@/contexts/AuthContext";
import PlanConfiguration from "@/Pages/admin/PlanConfiguration";
import AdminSeller from "@/Pages/admin/AdminSeller";
import ComprehensiveSubscriptionDashboard from "@/Pages/admin/ComprehensiveSubscriptionDashboard";
import AdminManualRenewal from "@/Pages/admin/AdminManualRenewal";
import SubscriptionAnalytics from "@/Pages/admin/SubscriptionAnalytics";
import PromoCodes from "@/Pages/PromoCodes/PromoCodes";
import GamificationAdmin from "@/Pages/Gamification/GamificationAdmin";
import AdminSellerShipping from "@/Pages/admin/AdminSellerShipping";

// ─── Navigation groupée ───────────────────────────────────────────────────────
const SIDEBAR_GROUPS = [
  {
    section: null,
    items: [
      { icon: Home,       label: "Tableau de Bord", to: "/Admin",     exact: true },
      { icon: TrendingUp, label: "Analytiques",      to: "/Admin/Analytics" },
      { icon: Inbox,      label: "Messages",          to: "/Admin/Imbox", badge: 5 },
    ],
  },
  {
    section: "Catalogue",
    items: [
      { icon: Package,    label: "Produits",           to: "/Admin/Products" },
      { icon: PlusCircle, label: "Ajouter un produit", to: "/Admin/AddProductA" },
      { icon: Tags,       label: "Catégories",          to: "/Admin/AddCategorie" },
      { icon: Newspaper,  label: "Publications",        to: "/Admin/ProductPub" },
    ],
  },
  {
    section: "Commerce",
    items: [
      { icon: ShoppingCart, label: "Commandes", to: "/Admin/AOrders" },
      { icon: Users,        label: "Clients",   to: "/Admin/ACustomers" },
      { icon: ShoppingBag,  label: "Vendeurs",  to: "/Admin/Sellers" },
    ],
  },
  {
    section: "Livraison",
    items: [
      { icon: Truck,  label: "Expédition vendeurs", to: "/Admin/AdminSellerShipping" },
      { icon: MapPin, label: "Zones de livraison",  to: "/Admin/ShippingZonesAdmin" },
      { icon: Map,    label: "Zones admin",          to: "/Admin/AdminZones" },
    ],
  },
  {
    section: "Finances",
    items: [
      { icon: WalletIcon, label: "Gestion financière", to: "/Admin/AdminFinancialDashboard" },
      { icon: Ticket,     label: "Codes promo",         to: "/Admin/PromoCodes" },
      { icon: Gift,       label: "Baobab Points",        to: "/Admin/GamificationAdmin" },
    ],
  },
  {
    section: "Abonnements",
    items: [
      { icon: Crown,      label: "Centre abonnements",  to: "/Admin/SubscriptionCenter" },
      { icon: CreditCard, label: "Analytics",            to: "/Admin/SubscriptionAnalytics" },
      { icon: RefreshCw,  label: "Renouvellements",      to: "/Admin/AdminManualRenewal" },
      { icon: Settings,   label: "Plans & tarifs",       to: "/Admin/Plans" },
      { icon: Users,      label: "Gestion vendeurs",     to: "/Admin/AdminSeller" },
    ],
  },
];

const PAGE_COMPONENTS = {
  Analytics,
  Imbox,
  Products,
  ProductDet: AProductDet,
  ProductUpdat: AProductUpdat,
  AddProductA,
  ACustomers,
  AOrders,
  ACustomerDet,
  AodersDet,
  Sellers,
  SellerDet,
  AddCategorie,
  ProductPub,
  ProductUpdateStatus,
  AdminFinancialDashboard,
  ShippingZonesAdmin,
  AdminZones,
  PromoCodes,
  SubscriptionCenter: ComprehensiveSubscriptionDashboard,
  SubscriptionAnalytics,
  AdminManualRenewal,
  Plans: PlanConfiguration,
  AdminSeller,
  GamificationAdmin,
  AdminSellerShipping,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isActive(to, exact, pathname) {
  if (exact) return pathname === to || pathname === to + "/";
  return pathname === to || pathname.startsWith(to + "/");
}

function getCurrentPageLabel(pathname) {
  for (const group of SIDEBAR_GROUPS) {
    for (const item of group.items) {
      if (isActive(item.to, item.exact, pathname)) return item.label;
    }
  }
  return "Tableau de Bord";
}

// ─── SidebarContent ───────────────────────────────────────────────────────────
function SidebarContent({ pathname, onClose, logout }) {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white text-sm">
            IB
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Ihambaoba</p>
            <p className="text-[10px] text-slate-400 leading-tight">Administration</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav scrollable */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {SIDEBAR_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-5" : ""}>
            {group.section && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.section}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.to, item.exact, pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}
                    />
                    <span className="leading-none">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-slate-700/60">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ allCategories, allProducts }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const params = useParams();
  const location = useLocation();
  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
  const { logout } = useAuth();

  const PageComponent = PAGE_COMPONENTS[params.op] || Overview;
  const pageLabel = getCurrentPageLabel(location.pathname);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar desktop ─────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 h-screen border-r border-slate-800">
        <SidebarContent pathname={location.pathname} logout={logout} />
      </aside>

      {/* ── Sidebar mobile overlay ──────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-60 h-full z-50 shadow-2xl">
            <SidebarContent
              pathname={location.pathname}
              onClose={() => setMobileSidebarOpen(false)}
              logout={logout}
            />
          </div>
        </div>
      )}

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 h-14 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Menu mobile */}
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / titre page */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 hidden sm:block">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:block" />
              <span className="font-semibold text-gray-800">{pageLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Recherche */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Messages */}
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <MessageCircle className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* Séparateur */}
            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src="/placeholder-avatar.png" />
                    <AvatarFallback className="text-xs bg-blue-600 text-white font-semibold">
                      {admin?.name?.[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">
                      {admin?.name || "Admin"}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-tight">Administrateur</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-gray-500">Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Paramètres</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={logout}>
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <PageComponent
              allCategories={allCategories}
              allProducts={allProducts}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
