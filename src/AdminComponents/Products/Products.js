import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Star,
  ChevronRight,
  Loader2,
  Filter,
  MoreVertical,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  ChevronDown,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const BackendUrl = process.env.REACT_APP_Backend_Url;

// Constantes pour les statuts
const PRODUCT_STATUSES = [
  { value: "All", label: "Tous les statuts", icon: null, color: "bg-gray-100" },
  { value: "Published", label: "Publié", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "UnPublished", label: "Non publié", icon: Eye, color: "bg-gray-100 text-gray-800" },
  { value: "Attente", label: "En attente", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "Refuser", label: "Refusé", icon: XCircle, color: "bg-red-100 text-red-800" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Nom (A-Z)" },
  { value: "name_desc", label: "Nom (Z-A)" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "date_desc", label: "Plus récents" },
  { value: "date_asc", label: "Plus anciens" },
];

const stripHtml = (html) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Hook personnalisé pour le debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");
  const [viewMode, setViewMode] = useState("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const [typeSearch, setTypeSearch] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef(null);

  const { toast } = useToast();
  const searchInputRef = useRef(null);
  const debouncedSearch = useDebounce(searchName, 400);

  const filteredTypeOptions = useMemo(
    () =>
      typeSearch.trim()
        ? types.filter((t) =>
            t.name.toLowerCase().includes(typeSearch.toLowerCase())
          )
        : types,
    [types, typeSearch]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setShowTypeDropdown(false);
        setTypeSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Products come from the server — no client-side filtering needed
  const paginatedProducts = products;
  const filteredAndSortedProducts = { length: totalProducts };

  const fetchProducts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: perPage });
      if (debouncedSearch.length >= 2) params.set('search', debouncedSearch);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (selectedType !== 'All') params.set('type', selectedType);

      const res = await axios.get(`${BackendUrl}/ProductsAdmin?${params}`);
      setProducts(res.data.products ?? res.data.data ?? []);
      setTotalProducts(res.data.total ?? 0);
      setTotalPages(res.data.pages ?? 1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.message || "Échec du chargement des produits",
      });
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [BackendUrl, debouncedSearch, selectedStatus, selectedType, perPage, toast]);

  // Load types once
  useEffect(() => {
    axios.get(`${BackendUrl}/getAllType/`)
      .then(res => setTypes(res.data.data ?? []))
      .catch(() => {});
  }, [BackendUrl]);

  // Reload when filters / page change
  useEffect(() => {
    if (debouncedSearch.length >= 2) setIsSearching(true);
    fetchProducts(currentPage);
  }, [debouncedSearch, selectedStatus, selectedType, perPage, currentPage]);

  const handleReset = useCallback(() => {
    setSearchName("");
    setSelectedType("All");
    setSelectedStatus("All");
    setSortBy("date_desc");
    setCurrentPage(1);
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  const getStatusConfig = (status) => {
    return PRODUCT_STATUSES.find(s => s.value === status) || PRODUCT_STATUSES[0];
  };

  // Composant Badge de statut
  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`} variant="secondary">
        {Icon && <Icon size={12} />}
        {config.label}
      </Badge>
    );
  };

  // Composant Carte Produit
  const ProductCard = React.memo(({ product }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50">
        <div className="relative aspect-square overflow-hidden">
          {!imageError ? (
            <img
              src={product.image1}
              alt={product.name}
              onError={() => setImageError(true)}
              className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Image indisponible</span>
              </div>
            </div>
          )}
          
          {/* Overlay avec actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <StatusBadge status={product.isPublished} />
            </div>
          </div>
        </div>

        <CardHeader className="space-y-3 pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="line-clamp-2 text-lg font-semibold leading-tight group-hover:text-blue-600 transition-colors">
              {product.name}
            </CardTitle>
            <div className="flex text-yellow-400 flex-shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </div>
          </div>
          
          <Badge variant="outline" className="w-fit text-xs">
            {product.type}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            {product.prix.toLocaleString()} €
          </div>
          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
            {stripHtml(product.description)}
          </p>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            asChild
            className="w-full group-hover:bg-blue-600 group-hover:shadow-lg transition-all duration-300"
            variant="default"
          >
            <Link to={`/Admin/ProductDet/${product._id}`}>
              Voir les détails
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  });

  // Composant Vue Liste
  const ProductListItem = React.memo(({ product }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
              {!imageError ? (
                <img
                  src={product.image1}
                  alt={product.name}
                  onError={() => setImageError(true)}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {stripHtml(product.description)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {product.type}
                    </Badge>
                    <StatusBadge status={product.isPublished} />
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold text-blue-600 mb-2">
                    {product.prix.toLocaleString()} €
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/Admin/ProductDet/${product._id}`}>
                      Voir détails
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  });

  // Composant Skeleton
  const ProductSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  );

  return (
    <ScrollArea className="h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* En-tête moderne */}
        <div className="bg-gradient-to-r from-white via-blue-50/20 to-white dark:from-gray-800 dark:via-blue-900/10 dark:to-gray-800 p-8 rounded-xl shadow-sm border border-blue-100/50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-400 bg-clip-text text-transparent">
                  Gestion des Produits
                </h1>
                <p className="text-muted-foreground mt-1">
                  {totalProducts} produit{totalProducts !== 1 ? 's' : ''} trouvé{totalProducts !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Rechercher des produits..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-10 pr-10 bg-white/50 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 transition-colors"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
              )}
            </div>
          </div>
        </div>

        {/* Filtres et contrôles */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtre par type — combobox compact */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Type:</span>
              </div>
              <div className="relative" ref={typeDropdownRef}>
                <button
                  onClick={() => setShowTypeDropdown((v) => !v)}
                  className="flex items-center gap-2 h-9 px-3 border border-input rounded-md text-sm bg-background hover:bg-accent min-w-48 max-w-xs"
                >
                  <span className="flex-1 text-left truncate">
                    {selectedType === "All" ? "Tous les types" : selectedType}
                  </span>
                  {selectedType !== "All" && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedType("All");
                        setCurrentPage(1);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${showTypeDropdown ? "rotate-180" : ""}`} />
                </button>

                {showTypeDropdown && (
                  <div className="absolute top-full left-0 z-50 mt-1 w-72 bg-white border border-input rounded-lg shadow-lg">
                    {/* Search input */}
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Rechercher un type…"
                          value={typeSearch}
                          onChange={(e) => setTypeSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:border-blue-400"
                          autoFocus
                        />
                      </div>
                    </div>
                    {/* Options list */}
                    <div className="max-h-60 overflow-y-auto py-1">
                      {!typeSearch && (
                        <button
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${selectedType === "All" ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                          onClick={() => {
                            setSelectedType("All");
                            setCurrentPage(1);
                            setShowTypeDropdown(false);
                            setTypeSearch("");
                          }}
                        >
                          Tous les types
                          <span className="ml-2 text-xs text-muted-foreground">({types.length})</span>
                        </button>
                      )}
                      {filteredTypeOptions.map((type) => (
                        <button
                          key={type._id}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${selectedType === type.name ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                          onClick={() => {
                            setSelectedType(type.name);
                            setCurrentPage(1);
                            setShowTypeDropdown(false);
                            setTypeSearch("");
                          }}
                        >
                          {type.name}
                        </button>
                      ))}
                      {filteredTypeOptions.length === 0 && (
                        <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                          Aucun type pour « {typeSearch} »
                        </p>
                      )}
                    </div>
                    <div className="border-t px-3 py-1.5 text-xs text-muted-foreground bg-slate-50 rounded-b-lg">
                      {filteredTypeOptions.length} type{filteredTypeOptions.length !== 1 ? "s" : ""}
                      {typeSearch && ` sur ${types.length}`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Filtre par statut */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Statut:</span>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_STATUSES.map((status) => {
                  const Icon = status.icon;
                  return (
                    <Button
                      key={status.value}
                      variant={selectedStatus === status.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStatus(status.value)}
                      className="flex items-center gap-2 transition-all"
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                      {status.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Contrôles d'affichage */}
            <div className="flex items-center gap-3">
              {/* Tri */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mode d'affichage */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Nombre par page */}
              <Select value={perPage.toString()} onValueChange={(value) => setPerPage(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="36">36</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        {isLoading ? (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-6`}>
            {[...Array(perPage)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : totalProducts === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos critères de recherche ou de filtrage.
            </p>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            {/* Grille/Liste des produits */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedProducts.map((product) => (
                  <ProductListItem key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination améliorée */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                <div className="text-sm text-muted-foreground">
                  Affichage de {((currentPage - 1) * perPage) + 1} à {Math.min(currentPage * perPage, totalProducts)} sur {totalProducts} produits
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                    
                    {/* Pages dynamiques */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}