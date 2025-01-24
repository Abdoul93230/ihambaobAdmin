import React, { useEffect, useState } from "react";
import { Search, Star, ChevronRight, Loader2, Filter } from "lucide-react";
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

const BackendUrl = process.env.REACT_APP_Backend_Url;

const stripHtml = (html) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedType, setSelectedType] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, typesRes] = await Promise.all([
        axios.get(`${BackendUrl}/Products`),
        axios.get(`${BackendUrl}/getAllType/`),
      ]);

      setProducts(productsRes.data.data);
      setTypes(typesRes.data.data);
      setTotalPages(Math.ceil(productsRes.data.data.length / perPage));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Failed to fetch products",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeSelect = async (typeId, typeName) => {
    setIsLoading(true);
    setSelectedType(typeName);
    try {
      if (typeName === "All") {
        await fetchInitialData();
        return;
      }

      const response = await axios.get(
        `${BackendUrl}/searchProductByType/${typeId}`
      );
      setProducts(response.data.products);
      setTotalPages(Math.ceil(response.data.products.length / perPage));
      setCurrentPage(1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to filter products",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchName.length < 2) {
      toast({
        variant: "warning",
        title: "Warning",
        description: "Search term must be at least 2 characters long",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${BackendUrl}/searchProductByName/${searchName}`
      );
      setProducts(response.data.products);
      setTotalPages(Math.ceil(response.data.products.length / perPage));
      setCurrentPage(1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search products",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // const paginatedProducts = products.slice(
  //   (currentPage - 1) * perPage,
  //   currentPage * perPage
  // );

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  const ProductCard = ({ product }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="relative aspect-square overflow-hidden">
          {!imageError ? (
            <img
              src={product.image1}
              alt={product.name}
              onError={() => setImageError(true)}
              className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
          <Badge variant="secondary" className="absolute top-2 right-2">
            {product.type}
          </Badge>
        </div>

        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center">
            <CardTitle className="line-clamp-1 text-lg font-semibold">
              {product.name}
            </CardTitle>
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="text-2xl font-bold text-blue-600">
            ${product.prix.toLocaleString()}
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {stripHtml(product.description)}
          </p>
        </CardContent>

        <CardFooter>
          <Button
            asChild
            className="w-full group-hover:bg-blue-700 transition-colors"
            variant="default"
          >
            <Link to={`/Admin/ProductDet/${product._id}`}>
              View Details
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const ProductSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );

  const paginatedProducts = products.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <ScrollArea className="h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Products
              </h1>
              <Badge variant="outline" className="text-lg">
                {selectedType}
              </Badge>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <Input
                type="search"
                placeholder="Search products..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" variant="default">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedType === "All" ? "default" : "outline"}
              onClick={() => handleTypeSelect(null, "All")}
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              All
            </Button>
            {types.map((type) => (
              <Button
                key={type._id}
                variant={selectedType === type.name ? "default" : "outline"}
                onClick={() => handleTypeSelect(type._id, type.name)}
                className="whitespace-nowrap"
              >
                {type.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    />
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
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
