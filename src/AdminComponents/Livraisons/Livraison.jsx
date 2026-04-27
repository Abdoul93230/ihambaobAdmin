import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  Edit,
  Globe,
  Package,
  Truck,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";

const BackendUrl = process.env.REACT_APP_Backend_Url;

// Couleurs du thème
const COLORS = {
  orange: "#E87E04",
  white: "#FFFFFF",
  green: "#008751",
  darkGreen: "#006B3F",
  lightOrange: "#FFE0B2",
  lightGreen: "#CCFFCC",
  gray: "#718096",
};

const ShippingZonesAdmin = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [expandedZone, setExpandedZone] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    transporteurId: "",
    transporteurName: "",
    transporteurContact: "",
    baseFee: 0,
    weightFee: 0,
    countries: [""],
  });

  // Récupérer toutes les zones d'expédition
  const fetchZones = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BackendUrl}/api/shipping/zones`);
      if (response.data.success) {
        setZones(response.data.zones);
      } else {
        setError("Échec du chargement des zones d'expédition");
      }
    } catch (err) {
      setError(
        "Erreur lors de la récupération des zones d'expédition: " + err.message
      );
      toast.error("Impossible de charger les zones d'expédition");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Fonction de tri
  const sortZones = (data) => {
    return [...data].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Changer la direction de tri
  const handleSort = (field) => {
    setSortDirection(
      sortField === field ? (sortDirection === "asc" ? "desc" : "asc") : "asc"
    );
    setSortField(field);
  };

  // Filtrer les zones selon le terme de recherche
  const filteredZones = sortZones(
    zones.filter(
      (zone) =>
        zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.transporteurName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        zone.countries.some((country) =>
          country.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
  );

  // Ouvrir le modal pour ajouter/éditer une zone
  const openModal = (zone = null) => {
    if (zone) {
      setSelectedZone(zone);
      setFormData({
        name: zone.name,
        transporteurId: zone.transporteurId,
        transporteurName: zone.transporteurName,
        transporteurContact: zone.transporteurContact,
        baseFee: zone.baseFee,
        weightFee: zone.weightFee,
        countries: [...zone.countries],
      });
    } else {
      setSelectedZone(null);
      setFormData({
        name: "",
        transporteurId: "",
        transporteurName: "",
        transporteurContact: "",
        baseFee: 0,
        weightFee: 0,
        countries: [""],
      });
    }
    setIsModalOpen(true);
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gérer les changements de pays
  const handleCountryChange = (index, value) => {
    const updatedCountries = [...formData.countries];
    updatedCountries[index] = value;
    setFormData((prev) => ({
      ...prev,
      countries: updatedCountries,
    }));
  };

  // Ajouter un champ de pays
  const addCountryField = () => {
    setFormData((prev) => ({
      ...prev,
      countries: [...prev.countries, ""],
    }));
  };

  // Supprimer un champ de pays
  const removeCountryField = (index) => {
    if (formData.countries.length > 1) {
      const updatedCountries = [...formData.countries];
      updatedCountries.splice(index, 1);
      setFormData((prev) => ({
        ...prev,
        countries: updatedCountries,
      }));
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name ||
      !formData.transporteurId ||
      !formData.transporteurName ||
      !formData.transporteurContact ||
      formData.countries.some((c) => !c)
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      let response;

      if (selectedZone) {
        // Mise à jour
        response = await axios.put(
          `${BackendUrl}/api/shipping/zones/${selectedZone._id}`,
          formData
        );
        toast.success("Zone d'expédition mise à jour avec succès");
      } else {
        // Création
        response = await axios.post(
          `${BackendUrl}/api/shipping/zones`,
          formData
        );
        toast.success("Zone d'expédition créée avec succès");
      }

      if (response.data.success) {
        closeModal();
        fetchZones();
      }
    } catch (err) {
      toast.error(`Erreur: ${err.response?.data?.message || err.message}`);
    }
  };

  // Supprimer une zone
  const handleDelete = async () => {
    if (!selectedZone) return;

    try {
      const response = await axios.delete(
        `${BackendUrl}/api/shipping/zones/${selectedZone._id}`
      );

      if (response.data.success) {
        toast.success("Zone d'expédition supprimée avec succès");
        setIsDeleteModalOpen(false);
        fetchZones();
      }
    } catch (err) {
      toast.error(`Erreur: ${err.response?.data?.message || err.message}`);
    }
  };

  // Fermer les modals
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedZone(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedZone(null);
  };

  // Ouvrir le modal de confirmation de suppression
  const openDeleteModal = (zone) => {
    setSelectedZone(zone);
    setIsDeleteModalOpen(true);
  };

  // Gérer l'expansion de la carte de zone
  const toggleZoneExpansion = (zoneId) => {
    setExpandedZone(expandedZone === zoneId ? null : zoneId);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          Gestion des Zones d'Expédition
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher une zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-300 w-full sm:w-auto"
            style={{
              backgroundColor: COLORS.green,
              hover: { backgroundColor: COLORS.darkGreen },
            }}
          >
            <Plus size={18} />
            <span>Nouvelle Zone</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"
            style={{ borderColor: COLORS.orange }}
          ></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : filteredZones.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Package size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Aucune zone d'expédition trouvée
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? "Aucun résultat pour votre recherche"
              : "Commencez par créer votre première zone d'expédition"}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-orange-500 hover:text-orange-600 font-medium"
              style={{ color: COLORS.orange }}
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-sm font-medium cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Nom de la Zone
                      {sortField === "name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-medium cursor-pointer"
                    onClick={() => handleSort("transporteurName")}
                  >
                    <div className="flex items-center">
                      Transporteur
                      {sortField === "transporteurName" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-medium cursor-pointer"
                    onClick={() => handleSort("baseFee")}
                  >
                    <div className="flex items-center">
                      Frais de Base
                      {sortField === "baseFee" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-medium cursor-pointer"
                    onClick={() => handleSort("weightFee")}
                  >
                    <div className="flex items-center">
                      Frais au Poids
                      {sortField === "weightFee" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        ))}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredZones?.map((zone) => (
                  <React.Fragment key={zone._id}>
                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Globe size={18} className="text-gray-500 mr-2" />
                          <span className="font-medium">{zone.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Truck size={18} className="text-gray-500 mr-2" />
                          <span>{zone.transporteurName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {zone.baseFee.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {zone.weightFee.toFixed(2)} €/kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleZoneExpansion(zone._id)}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                          >
                            <Info size={18} />
                          </button>
                          <button
                            onClick={() => openModal(zone)}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(zone)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedZone === zone._id && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">
                                Détails du Transporteur
                              </h4>
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p>
                                  <span className="font-medium">ID:</span>{" "}
                                  {zone.transporteurId}
                                </p>
                                <p>
                                  <span className="font-medium">Nom:</span>{" "}
                                  {zone.transporteurName}
                                </p>
                                <p>
                                  <span className="font-medium">Contact:</span>{" "}
                                  {zone.transporteurContact}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">
                                Pays Desservis ({zone.countries.length})
                              </h4>
                              <div className="bg-white p-4 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-2">
                                  {zone.countries?.map((country, idx) => (
                                    <div
                                      key={idx}
                                      className="px-3 py-1 bg-green-50 text-green-800 rounded-full text-sm inline-flex items-center"
                                      style={{
                                        backgroundColor: COLORS.lightGreen,
                                      }}
                                    >
                                      {country}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-gray-500 text-sm">
            Affichage de {filteredZones.length} zone(s) sur {zones.length} au
            total
          </div>
        </>
      )}

      {/* Modal pour créer/éditer une zone */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedZone
                  ? "Modifier la Zone d'Expédition"
                  : "Créer une Nouvelle Zone d'Expédition"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la Zone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Ex: Europe Occidentale"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID du Transporteur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="transporteurId"
                    value={formData.transporteurId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Ex: DHL-EU-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Transporteur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="transporteurName"
                    value={formData.transporteurName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Ex: DHL Express"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact du Transporteur{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="transporteurContact"
                    value={formData.transporteurContact}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Ex: 33612345678"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frais de Base (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="baseFee"
                    value={formData.baseFee}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frais au Poids (€/kg){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="weightFee"
                    value={formData.weightFee}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Pays Desservis <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addCountryField}
                    className="text-sm text-green-600 hover:text-green-700 flex items-center"
                    style={{ color: COLORS.green }}
                  >
                    <Plus size={16} className="mr-1" /> Ajouter un pays
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3 max-h-60 overflow-y-auto">
                  {formData.countries?.map((country, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={country}
                        onChange={(e) =>
                          handleCountryChange(index, e.target.value)
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                        placeholder="Code pays (ex: FR, DE, IT)"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeCountryField(index)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50"
                        disabled={formData.countries.length <= 1}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez les codes pays à deux lettres (ISO 3166-1 alpha-2)
                </p>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg text-white transition-colors duration-300"
                  style={{
                    backgroundColor: COLORS.green,
                    hover: { backgroundColor: COLORS.darkGreen },
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Save size={18} />
                    <span>{selectedZone ? "Mettre à jour" : "Créer"}</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Confirmer la suppression
              </h2>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Êtes-vous sûr de vouloir supprimer la zone d'expédition{" "}
                <span className="font-semibold">{selectedZone?.name}</span> ?
                Cette action est irréversible.
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={closeDeleteModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors duration-300"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingZonesAdmin;
