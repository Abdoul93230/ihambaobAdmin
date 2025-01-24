import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  User,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BackendUrl = process.env.REACT_APP_Backend_Url;
const ITEMS_PER_PAGE = 10;

const AFournisseurs = () => {
  const navigate = useNavigate();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const AFournisseurDet = (id) => {
    navigate(`/Admin/AFournisseurDet/${id}`);
  };

  useEffect(() => {
    fetchFournisseurs();
  }, [currentPage]);

  const fetchFournisseurs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${BackendUrl}/fournisseurs`);
      const data = res.data.data;
      setTotalItems(data.length);
      setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));

      // Pagination logic
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setFournisseurs(data.slice(startIndex, endIndex));
    } catch (error) {
      console.error("Error fetching fournisseurs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchFournisseur = async () => {
    if (searchName.length < 2) {
      alert("Le nom à rechercher doit avoir au moins 2 caractères");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${BackendUrl}/findFournisseurByName/${searchName}`
      );
      const data = res.data.data;
      setTotalItems(data.length);
      setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
      setCurrentPage(1);
      setFournisseurs(data.slice(0, ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error searching fournisseurs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchFournisseur();
    }
  };

  const resetSearch = async () => {
    setSearchName("");
    setCurrentPage(1);
    fetchFournisseurs();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = window.innerWidth < 640 ? 3 : 5;
    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisibleButtons / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          className="min-w-8"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl font-bold">Fournisseurs</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Rechercher des fournisseurs..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={searchFournisseur}
                  className="flex-grow sm:flex-grow-0"
                  disabled={isLoading}
                >
                  Rechercher
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetSearch}
                  className="flex-grow sm:flex-grow-0"
                  disabled={isLoading}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Photo</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden sm:table-cell">Région</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Numéro</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Localité
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : fournisseurs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Aucun fournisseur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  fournisseurs.map((fournisseur) => (
                    <TableRow
                      key={fournisseur._id}
                      onClick={() => AFournisseurDet(fournisseur._id)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={fournisseur.image}
                            alt={fournisseur.name}
                          />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {fournisseur.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {fournisseur.region}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {fournisseur.email}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        +227 {fournisseur.numero}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {fournisseur.quartier}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/Admin/AddFournisseur")}
              className="w-full sm:w-auto"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un fournisseur
            </Button>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Précédent</span>
                </Button>

                <div className="flex gap-2">{renderPaginationButtons()}</div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="mr-2 hidden sm:inline">Suivant</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500 text-center">
            Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} sur{" "}
            {totalItems} fournisseurs
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AFournisseurs;
