import React, { useEffect, useState } from "react";
import { User, Search, Plus, Star, Users, MapPin, Phone, Mail, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function Sellers() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  const fetchAllSellers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BackendUrl}/getSellers`);
      setSellers(response.data.data);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSellers();
  }, []);

  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      alert("Le nom à rechercher doit avoir au moins 2 caractères");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${BackendUrl}/findSellerByName/${searchTerm}`);
      setSellers(response.data.data);
      setCurrentPage(1);
    } catch (error) {
      if (error.response?.status === 404) {
        alert(error.response.data.message);
      } else {
        console.error("Search error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    setSearchTerm("");
    fetchAllSellers();
    setCurrentPage(1);
  };

  const filteredSellers = sellers.filter(
    (seller) =>
      seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedSellers = filteredSellers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (
      direction === "next" &&
      currentPage < Math.ceil(filteredSellers.length / itemsPerPage)
    ) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSellerClick = (id) => {
    navigate(`/Admin/SellerDet/${id}`);
  };

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

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
          <button
            onClick={() => navigate("/Admin/AddFournisseur")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start"
          >
            <Plus className="w-4 h-4" />
            Ajouter un fournisseur
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou boutique..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              Rechercher
            </button>
            <button
              onClick={handleResetSearch}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Tout voir
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boutique
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedSellers.map((seller) => (
                <tr
                  key={seller._id}
                  onClick={() => handleSellerClick(seller._id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {seller.logo ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={seller.logo}
                            alt={seller.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {seller.name}
                        </div>
                        <div className="text-sm text-gray-500">{seller.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{seller.storeName}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {seller.storeDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(seller.category)}`}>
                      {seller.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{seller.region}</div>
                    <div className="text-sm text-gray-500">{seller.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{seller.phone}</div>
                    <div className="text-sm text-gray-500">{seller.businessPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      seller.isvalid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {seller.isvalid ? 'Validé' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {displayedSellers.map((seller) => (
          <div
            key={seller._id}
            onClick={() => handleSellerClick(seller._id)}
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {seller.logo ? (
                  <img
                    className="h-12 w-12 rounded-full object-cover"
                    src={seller.logo}
                    alt={seller.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {seller.name}
                  </h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    seller.isvalid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {seller.isvalid ? 'Validé' : 'En attente'}
                  </span>
                </div>
                
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Store className="w-4 h-4 mr-1" />
                  <span className="truncate">{seller.storeName}</span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(seller.category)}`}>
                    {seller.category}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{seller.city}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span className="truncate">{seller.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    <span>{seller.phone}</span>
                  </div>
                </div>

                {seller.rating > 0 && (
                  <div className="mt-2 flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">
                      {seller.rating} ({seller.reviewsCount} avis)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && displayedSellers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucun fournisseur trouvé
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Essayez de modifier vos critères de recherche.
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredSellers.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange("prev")}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => handlePageChange("next")}
              disabled={currentPage === Math.ceil(filteredSellers.length / itemsPerPage)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                à{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredSellers.length)}
                </span>{" "}
                sur{" "}
                <span className="font-medium">{filteredSellers.length}</span>{" "}
                résultats
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange("prev")}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} sur {Math.ceil(filteredSellers.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => handlePageChange("next")}
                  disabled={currentPage === Math.ceil(filteredSellers.length / itemsPerPage)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sellers;