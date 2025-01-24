import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Home,
  TrendingUp, // Remplace BarChart2
  Inbox, // Pour Imbox
  Package, // Pour Products
  Users,
  ShoppingCart, // Pour Orders
  PlusCircle, // Pour Add Product
  Truck, // Pour Fournisseurs
  ShoppingBag, // Pour Sellers
  Tags, // Pour Add Categorie
  Newspaper, // Pour ProductPub
  LogOut,
  Search,
  Bell,
  Menu,
  Settings,
  MessageCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

// Import all your page components
import Analytics from "../Analytics/Analytics";
import Imbox from "../Inbox/Imbox";
import Products from "../Products/Products";
import AProductDet from "../AProductDet/AProductDet";
import AProductUpdat from "../AProductUpdat/AProductUpdat";
import AddProductA from "../AddProductA/AddProductA";
import ACustomers from "../ACustomers/ACustomers";
import AOrders from "../AOrders/AOrders";
import ACustomerDet from "../ACustomerDet/ACustomerDet";
import AodersDet from "../AodersDet/AodersDet";
import AFournisseurs from "../AFournisseurs/AFournisseurs";
import Sellers from "../Sellers/Sellers";
import AFournisseurDet from "../AFournisseurDet/AFournisseurDet";
import SellerDet from "../SellerDet/SellerDet";
import AddFournisseur from "../AddFournisseurs/AddFournisseur";
import AddCategorie from "../AddCategorie/AddCategorie";
import AFournisseurUpdate from "../AFournisseurUpdate/AFournisseurUpdate";
import ProductPub from "../ProductPub/ProductPub";
import Overview from "../Overview/Overview";

const SIDEBAR_ITEMS = [
  {
    icon: Home,
    label: "Tableau de Bord",
    to: "/Admin",
  },
  {
    icon: TrendingUp,
    label: "Analytiques",
    to: "/Admin/Analytics",
  },
  {
    icon: Inbox,
    label: "Boîte de Réception",
    to: "/Admin/Imbox",
    badge: 5,
  },
  {
    icon: Package,
    label: "Produits",
    to: "/Admin/Products",
  },
  {
    icon: Users,
    label: "Clients",
    to: "/Admin/ACustomers",
  },
  {
    icon: ShoppingCart,
    label: "Commandes",
    to: "/Admin/AOrders",
  },
  {
    icon: PlusCircle,
    label: "Ajouter Produit",
    to: "/Admin/AddProductA",
  },
  {
    icon: Truck,
    label: "Fournisseurs",
    to: "/Admin/AFournisseurs",
  },
  {
    icon: ShoppingBag,
    label: "Vendeurs",
    to: "/Admin/Sellers",
  },
  {
    icon: Tags,
    label: "Ajouter Catégorie",
    to: "/Admin/AddCategorie",
  },
  {
    icon: Newspaper,
    label: "Publications Produits",
    to: "/Admin/ProductPub",
  },
];

const PAGE_COMPONENTS = {
  Analytics,
  Imbox: Imbox,
  Products,
  ProductDet: AProductDet,
  ProductUpdat: AProductUpdat,
  AddProductA,
  ACustomers,
  AOrders,
  ACustomerDet,
  AodersDet,
  AFournisseurs,
  Sellers,
  AFournisseurDet,
  SellerDet,
  AddFournisseur,
  AddCategorie,
  AFournisseurUpdate,
  ProductPub,
};

function AdminDashboard({ allCategories, allProducts }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("AdminEcomme"));

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem("AdminEcomme");
    navigate("/login");
  };

  const PageComponent = PAGE_COMPONENTS[params.op] || Overview;

  return (
    <div className="flex h-screen">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="fixed top-4 left-4 z-50 md:hidden">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-2xl font-bold text-blue-600">DASHBOARD</h2>
          </div>
          <nav className="p-4 space-y-2">
            {SIDEBAR_ITEMS.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center justify-between py-3 px-3 hover:bg-blue-50 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-600 rounded-full px-2 py-0.5 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}

            <Button
              variant="destructive"
              className="w-full mt-4 flex items-center justify-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 bg-white border-r shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-blue-600">DASHBOARD</h2>
        </div>
        <nav className="p-4 space-y-2">
          {SIDEBAR_ITEMS.map((item, index) => (
            <Link
              key={index}
              to={item.to}
              className="flex items-center justify-between py-3 px-3 hover:bg-blue-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  {item.label}
                </span>
              </div>
              {item.badge && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-600 rounded-full px-2 py-0.5 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}

          <Button
            variant="destructive"
            className="w-full mt-4 flex items-center justify-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </Button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="mr-4 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu />
            </Button>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input type="search" placeholder="Search..." className="pl-8" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <MessageCircle />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell />
              <Badge variant="destructive" className="absolute -top-2 -right-2">
                3
              </Badge>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center cursor-pointer">
                  <Avatar className="mr-2">
                    <AvatarImage src="/placeholder-avatar.png" />
                    <AvatarFallback>{admin?.name?.[0] || "A"}</AvatarFallback>
                  </Avatar>
                  <span>{admin?.name}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleLogout}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <PageComponent
            allCategories={allCategories}
            allProducts={allProducts}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
