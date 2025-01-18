import React, { useState } from "react";
import { Info, Edit, Save, Trash2 } from "lucide-react";

const ShippingRatesManager = ({
  setSelectedOriginZone,
  selectedOriginZone,
  nouvelleZone,
  setNouvelleZone,
  zones,
  setZones,
  nouveauTransporteur,
  setNouveauTransporteur,
  transporteurs,
  setTransporteurs,
  shippingOptions,
  setShippingOptions,
  packageDimensions,
  setPackageDimensions,
}) => {
  const [activeTab, setActiveTab] = useState("rates");
  const [editingZone, setEditingZone] = useState(null);
  const [editingCode, setEditingCode] = useState(null); // Code de la zone en édition
  const [editingTransporteur, setEditingTransporteur] = useState(null);

  // Tooltips explicatifs
  const tooltips = {
    baseFee:
      "Frais fixes appliqués pour chaque livraison, indépendamment du poids",
    weightFee: "Coût supplémentaire calculé en fonction du poids du colis",
    transporteur:
      "Sélectionnez l'agence de transport qui sera responsable de la livraison",
  };

  // Ajouter une nouvelle zone
  const ajouterZone = async () => {
    if (nouvelleZone?.name && nouvelleZone?.code) {
      const newZone = {
        ...nouvelleZone,
        id: zones.length > 0 ? Math.max(...zones.map((z) => z.id)) + 1 : 1,
      };
      const updatedZones = [...zones, newZone];
      setZones(updatedZones);
      setNouvelleZone({ name: "", code: "" });
    }
  };

  // Modifier une zone existante
  // Modifier une zone existante
  const modifierZone = (zone) => {
    // Trouver la zone existante par son ID
    const zoneExistante = zones.find((z) => z.id === zone.id);

    if (!zoneExistante) {
      console.error("Zone non trouvée");
      return;
    }

    // Stocker l'ancien nom de la zone
    const oldZoneName = zoneExistante.name;

    // Mettre à jour la liste des zones
    const updatedZones = zones.map((z) =>
      z.id === zone.id ? { ...z, ...zone } : z
    );

    setZones(updatedZones);

    // Mettre à jour les options de livraison
    setShippingOptions((prevOptions) => {
      // Convertir en tableau si nécessaire
      const currentOptions = Array.isArray(prevOptions)
        ? [...prevOptions]
        : Object.values(prevOptions);

      // Mapper les options et mettre à jour le nom si nécessaire
      return currentOptions.map((option) =>
        option.name === oldZoneName
          ? {
              ...option,
              name: zone.name,
            }
          : option
      );
    });

    // Réinitialiser l'état d'édition
    setEditingZone(null);
    setEditingCode(null);
  };

  // Supprimer une zone
  const supprimerZone = (zoneId) => {
    const updatedZones = zones.filter((z) => z.id !== zoneId);
    setZones(updatedZones);
  };
  // Ajouter un nouveau transporteur
  const ajouterTransporteur = async () => {
    if (nouveauTransporteur?.name && nouveauTransporteur?.contact) {
      const newTransporteur = {
        ...nouveauTransporteur,
        id: transporteurs.length + 1,
      };
      setTransporteurs([...transporteurs, newTransporteur]);
      setNouveauTransporteur({ name: "", contact: "" });
    }
  };

  // Modifier un transporteur existant
  const modifierTransporteur = (transporteur) => {
    const updatedTransporteurs = transporteurs.map((t) =>
      t.id === transporteur.id ? transporteur : t
    );

    // Mettre à jour les transporteurs dans les shipping options
    setShippingOptions((prevOptions) => {
      const currentOptions = Array.isArray(prevOptions)
        ? [...prevOptions]
        : Object.values(prevOptions);

      return currentOptions.map((option) => {
        // Si l'option a un transporteur avec l'ID modifié, mettre à jour ses détails
        if (option.transporteurId === transporteur.id) {
          return {
            ...option,
            transporteurName: transporteur.name,
            transporteurContact: transporteur.contact,
            transporteurId: transporteur.id,
          };
        }
        return option;
      });
    });
    console.log(shippingOptions);

    setTransporteurs(updatedTransporteurs);
    setEditingTransporteur(null);
  };

  // Supprimer un transporteur
  const supprimerTransporteur = (transporteurId) => {
    const updatedTransporteurs = transporteurs.filter(
      (t) => t.id !== transporteurId
    );
    setTransporteurs(updatedTransporteurs);
  };
  const updateShippingOption = (originZone, destZone, field, value) => {
    setShippingOptions((prevOptions) => {
      const currentOptions = Array.isArray(prevOptions)
        ? [...prevOptions]
        : Object.values(prevOptions);

      const updatedOptions = [...currentOptions];

      const destZoneIndex = updatedOptions.findIndex(
        (option) => option.name === destZone
      );

      if (destZoneIndex !== -1) {
        // Si le champ est 'transporteur', on met à jour l'ID et les détails du transporteur
        if (field === "transporteur") {
          const selectedTransporteur = transporteurs.find(
            (t) => t.id === Number(value)
          );
          updatedOptions[destZoneIndex] = {
            ...updatedOptions[destZoneIndex],
            transporteurId: Number(value),
            transporteurName: selectedTransporteur?.name,
            transporteurContact: selectedTransporteur?.contact,
          };
        } else {
          updatedOptions[destZoneIndex] = {
            ...updatedOptions[destZoneIndex],
            [field]: value,
          };
        }
      } else {
        // Ajouter une nouvelle option avec les détails du transporteur
        if (field === "transporteur") {
          const selectedTransporteur = transporteurs.find(
            (t) => t.id === Number(value)
          );

          updatedOptions.push({
            name: destZone,
            transporteurId: Number(value),
            transporteurName: selectedTransporteur.name,
            transporteurContact: selectedTransporteur.contact,
          });
          // console.log(selectedTransporteur);
        } else {
          updatedOptions.push({
            name: destZone,
            [field]: value,
          });
        }
      }
      // console.log(shippingOptions);

      return updatedOptions;
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">
        Gestion Avancée des Tarifs de Livraison
      </h2>

      {/* Tabs */}
      <div className="flex mb-4">
        {["rates", "zones", "transporteurs", "dimensions"].map((tab) => (
          <span
            style={{ cursor: "pointer" }}
            key={tab}
            className={`px-4 py-2 mr-2 ${
              activeTab === tab ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "rates"
              ? "Tarifs"
              : tab === "zones"
              ? "Zones"
              : tab === "transporteurs"
              ? "Transporteurs"
              : "Dimensions"}
          </span>
        ))}
      </div>
      {/* Contenu des onglets */}
      {activeTab === "rates" && (
        <div>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Zone d'Origine</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedOriginZone}
              onChange={(e) => setSelectedOriginZone(e.target.value)}
            >
              <option value="Choisir">Choisir</option>
              {zones?.map((zone) => (
                <option key={zone.code} value={zone.name}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Destination</th>
                <th className="p-2 text-left relative">
                  Frais de Base (FCFA)
                  <span title={tooltips.baseFee} className="inline-block ml-2">
                    <Info size={16} className="text-blue-500 cursor-help" />
                  </span>
                </th>
                <th className="p-2 text-left relative">
                  Frais au Kg (FCFA)
                  <span
                    title={tooltips.weightFee}
                    className="inline-block ml-2"
                  >
                    <Info size={16} className="text-blue-500 cursor-help" />
                  </span>
                </th>
                <th className="p-2 text-left relative">
                  Transporteur
                  <span
                    title={tooltips.transporteur}
                    className="inline-block ml-2"
                  >
                    <Info size={16} className="text-blue-500 cursor-help" />
                  </span>
                </th>
                <th className="p-2 text-left">Contact Transporteur</th>
              </tr>
            </thead>
            <tbody>
              {zones?.map((zone) => {
                // Trouver les options de livraison pour cette zone
                const zoneShippingOption = Array.isArray(shippingOptions)
                  ? shippingOptions.find((option) => option.name === zone.name)
                  : shippingOptions?.[zone.name];

                return (
                  <tr key={zone.code} className="border-b">
                    <td className="p-2">{zone.name}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-full p-1 border rounded"
                        value={zoneShippingOption?.baseFee || 0}
                        onChange={(e) =>
                          updateShippingOption(
                            selectedOriginZone,
                            zone.name,
                            "baseFee",
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-full p-1 border rounded"
                        value={zoneShippingOption?.weightFee || 0}
                        onChange={(e) =>
                          updateShippingOption(
                            selectedOriginZone,
                            zone.name,
                            "weightFee",
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td className="p-2">
                      <select
                        className="w-full p-1 border rounded"
                        value={zoneShippingOption?.transporteurId || ""}
                        onChange={(e) =>
                          updateShippingOption(
                            selectedOriginZone,
                            zone.name,
                            "transporteur",
                            e.target.value
                          )
                        }
                      >
                        {/* <option value="">Sélectionner un transporteur</option> */}
                        {transporteurs?.map((t, index) => (
                          <option key={index} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      {zoneShippingOption?.transporteurContact || "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Onglet Zones */}
      {/* Onglet Zones avec édition */}
      {activeTab === "zones" && (
        <div>
          <div className="mb-4 flex space-x-2">
            <input
              type="text"
              placeholder="Nom de la zone"
              className="flex-1 p-2 border rounded"
              value={nouvelleZone?.name}
              onChange={(e) =>
                setNouvelleZone((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <input
              type="text"
              placeholder="Code (ex: NYM)"
              className="w-24 p-2 border rounded"
              value={nouvelleZone?.code}
              onChange={(e) =>
                setNouvelleZone((prev) => ({ ...prev, code: e.target.value }))
              }
            />
            <span
              style={{ cursor: "pointer" }}
              onClick={ajouterZone}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Ajouter Zone
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Nom</th>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones?.map((zone) => (
                <tr key={zone.code} className="border-b">
                  {editingCode === zone.id ? (
                    <>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editingZone?.name || ""}
                          onChange={(e) =>
                            setEditingZone((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editingZone?.code || ""}
                          onChange={(e) =>
                            setEditingZone((prev) => ({
                              ...prev,
                              code: e.target.value,
                            }))
                          }
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 flex justify-end space-x-2">
                        <span
                          onClick={() => {
                            modifierZone(editingZone); // Sauvegarde
                            setEditingCode(null); // Fermer l'édition
                          }}
                          className="text-green-500 hover:bg-green-100 p-1 rounded"
                        >
                          <Save size={20} />
                        </span>
                        <span
                          onClick={() => {
                            setEditingZone(null);
                            setEditingCode(null);
                          }}
                          className="text-red-500 hover:bg-red-100 p-1 rounded"
                        >
                          <Trash2 size={20} />
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{zone.name}</td>
                      <td className="p-2">{zone.code}</td>
                      <td className="p-2 flex justify-end space-x-2">
                        <span
                          onClick={() => {
                            setEditingZone(zone);
                            setEditingCode(zone.id);
                          }}
                          className="text-blue-500 hover:bg-blue-100 p-1 rounded"
                        >
                          <Edit size={20} />
                        </span>
                        <span
                          onClick={() => supprimerZone(zone.id)}
                          className="text-red-500 hover:bg-red-100 p-1 rounded"
                        >
                          <Trash2 size={20} />
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Onglet Transporteurs */}
      {activeTab === "transporteurs" && (
        <div>
          <div className="mb-4 flex space-x-2">
            <input
              type="text"
              placeholder="Nom du transporteur"
              className="flex-1 p-2 border rounded"
              value={nouveauTransporteur?.name}
              onChange={(e) =>
                setNouveauTransporteur((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
            <input
              type="text"
              placeholder="Contact"
              className="w-32 p-2 border rounded"
              value={nouveauTransporteur?.contact}
              onChange={(e) =>
                setNouveauTransporteur((prev) => ({
                  ...prev,
                  contact: e.target.value,
                }))
              }
            />
            <span
              style={{ cursor: "pointer" }}
              onClick={ajouterTransporteur}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Ajouter Transporteur
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Nom</th>
                <th className="p-2 text-left">Contact</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transporteurs?.map((transporteur) => (
                <tr key={transporteur.id} className="border-b">
                  {editingTransporteur &&
                  editingTransporteur.id === transporteur.id ? (
                    <>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editingTransporteur.name}
                          onChange={(e) =>
                            setEditingTransporteur((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editingTransporteur.contact}
                          onChange={(e) =>
                            setEditingTransporteur((prev) => ({
                              ...prev,
                              contact: e.target.value,
                            }))
                          }
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 flex justify-end space-x-2">
                        <span
                          onClick={() =>
                            modifierTransporteur(editingTransporteur)
                          }
                          className="text-green-500 hover:bg-green-100 p-1 rounded"
                        >
                          <Save size={20} />
                        </span>
                        <span
                          onClick={() => setEditingTransporteur(null)}
                          className="text-red-500 hover:bg-red-100 p-1 rounded"
                        >
                          <Trash2 size={20} />
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{transporteur.name}</td>
                      <td className="p-2">{transporteur.contact}</td>
                      <td className="p-2 flex justify-end space-x-2">
                        <span
                          onClick={() => setEditingTransporteur(transporteur)}
                          className="text-blue-500 hover:bg-blue-100 p-1 rounded"
                        >
                          <Edit size={20} />
                        </span>
                        <span
                          onClick={() => supprimerTransporteur(transporteur.id)}
                          className="text-red-500 hover:bg-red-100 p-1 rounded"
                        >
                          <Trash2 size={20} />
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Nouvel onglet Dimensions */}
      {activeTab === "dimensions" && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Dimensions du Colis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Poids (kg)</label>
              <input
                type="number"
                value={packageDimensions?.weight}
                onChange={(e) =>
                  setPackageDimensions((prev) => ({
                    ...prev,
                    weight: Number(e.target.value),
                  }))
                }
                className="w-full p-2 border rounded"
                step="0.1"
              />
            </div>
            <div>
              <label className="block mb-2">Longueur (cm)</label>
              <input
                type="number"
                value={packageDimensions?.length}
                onChange={(e) =>
                  setPackageDimensions((prev) => ({
                    ...prev,
                    length: Number(e.target.value),
                  }))
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Largeur (cm)</label>
              <input
                type="number"
                value={packageDimensions?.width}
                onChange={(e) =>
                  setPackageDimensions((prev) => ({
                    ...prev,
                    width: Number(e.target.value),
                  }))
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Hauteur (cm)</label>
              {console.log(packageDimensions)}
              <input
                type="number"
                value={packageDimensions?.height}
                onChange={(e) =>
                  setPackageDimensions((prev) => ({
                    ...prev,
                    height: Number(e.target.value),
                  }))
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingRatesManager;
