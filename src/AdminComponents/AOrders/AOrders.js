import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BackendUrl = process.env.REACT_APP_Backend_Url;
const ITEMS_PER_PAGE = 12;

function ModernOrders() {
  const navigate = useNavigate();
  const [allCommandes, setAllCommandes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allAddress, setAllAddress] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [commandes, users, profiles, addresses] = await Promise.all([
          axios.get(`${BackendUrl}/getAllCommandes`),
          axios.get(`${BackendUrl}/getUsers`),
          axios.get(`${BackendUrl}/getUserProfiles`),
          axios.get(`${BackendUrl}/getAllAddressByUser`),
        ]);

        setAllCommandes(commandes.data.commandes);
        setAllUsers(users.data.data);
        setAllProfiles(profiles.data.data);
        setAllAddress(addresses.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Filtrer les commandes par période
  const filterByTime = (orders) => {
    if (!orders) return [];
    const now = new Date();

    switch (timeFilter) {
      case "month":
        const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
        return orders.filter((order) => new Date(order.date) >= lastMonth);
      case "week":
        const lastWeek = new Date(now.setDate(now.getDate() - 7));
        return orders.filter((order) => new Date(order.date) >= lastWeek);
      case "24h":
        const last24h = new Date(now.setHours(now.getHours() - 24));
        return orders.filter((order) => new Date(order.date) >= last24h);
      default:
        return orders;
    }
  };

  // Recherche dans les commandes
  // Modifiez la fonction searchOrders comme ceci :
  const searchOrders = (orders) => {
    if (!searchQuery.trim() || !orders) return orders;
    const query = searchQuery.toLowerCase();

    return orders.filter((order) => {
      // Convertir les valeurs en chaînes de caractères pour la recherche
      const customerName =
        order.livraisonDetails?.customerName?.toLowerCase() || "";
      const customerEmail = order.livraisonDetails?.email?.toLowerCase() || "";
      const customerPhone = String(order.livraisonDetails?.numero || "");
      const customerArea = `${order.livraisonDetails?.region || ""} ${
        order.livraisonDetails?.quartier || ""
      }`.toLowerCase();
      const orderRef = order.reference?.toLowerCase() || "";
      const orderStatus = order.statusLivraison?.toLowerCase() || "";

      return (
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        customerPhone.includes(query) ||
        customerArea.includes(query) ||
        orderRef.includes(query) ||
        orderStatus.includes(query)
      );
    });
  };

  // Combinaison des filtres et pagination
  const filteredOrders = useMemo(() => {
    const timeFiltered = filterByTime(allCommandes);
    const searchFiltered = searchOrders(timeFiltered);
    return searchFiltered;
  }, [allCommandes, timeFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil((filteredOrders?.length || 0) / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "en cours":
        return "bg-blue-100 text-blue-800";
      case "échec":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl font-bold">Commandes</CardTitle>
            <p className="text-muted-foreground mt-1">
              {filteredOrders?.length || 0} commandes trouvées
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Dernier mois</SelectItem>
                <SelectItem value="week">Dernière semaine</SelectItem>
                <SelectItem value="24h">Dernières 24h</SelectItem>
                <SelectItem value="all">Toutes</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher des commandes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full sm:w-[250px]"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Zone</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Produits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders?.map((order) => {
                    const address = allAddress?.find(
                      (addr) => addr.clefUser === order.clefUser
                    );
                    const profile = allProfiles?.find(
                      (prof) => prof.clefUser === order.clefUser
                    );

                    return (
                      <TableRow
                        key={order._id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          navigate(`/Admin/AodersDet/${order._id}`)
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={profile?.image} />
                              <AvatarFallback>
                                {address?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {order.livraisonDetails?.customerName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {order.livraisonDetails?.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{order.livraisonDetails?.numero}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {`${order.livraisonDetails?.region}, ${order.livraisonDetails?.quartier}`}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {order.reference}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeStyle(
                              order.statusLivraison
                            )}
                          >
                            {order.statusLivraison}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {order.nbrProduits?.length || 0}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ModernOrders;
