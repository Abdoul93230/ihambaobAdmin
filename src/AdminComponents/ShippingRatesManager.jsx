import React, { useState } from "react";

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
  const [activeTab, setActiveTab] = useState("origin");

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Configuration de Livraison
      </h2>

      {/* Navigation par onglets */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <div
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "origin"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("origin")}
          >
            Zone d'Origine
          </div>
          <div
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "dimensions"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("dimensions")}
          >
            Dimensions du Colis
          </div>
        </div>
      </div>

      {/* Contenu de l'onglet Zone d'Origine */}
      {activeTab === "origin" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Zone d'Origine de l'Expédition
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-3 font-medium text-gray-700 text-base">
                  Saisissez votre zone d'origine
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: Niamey, Dosso, Tahoua..."
                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white text-gray-800 placeholder-gray-400 text-lg shadow-sm"
                    value={selectedOriginZone === "Choisir" ? "" : selectedOriginZone || ""}
                    onChange={(e) => setSelectedOriginZone(e.target.value)}
                    onFocus={(e) => e.target.placeholder = "Tapez le nom de votre ville ou zone..."}
                    onBlur={(e) => e.target.placeholder = "Ex: Niamey, Dosso, Tahoua..."}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 ml-1">
                  Cette information sera utilisée pour calculer les frais de livraison
                </p>
              </div>

              {selectedOriginZone && selectedOriginZone !== "Choisir" && selectedOriginZone.trim() !== "" && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-green-800 font-semibold text-base">
                        Zone d'origine configurée
                      </p>
                      <p className="text-green-700 text-sm mt-1 leading-relaxed">
                        <span className="font-medium">{selectedOriginZone}</span> sera utilisée comme point de départ pour toutes vos expéditions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(!selectedOriginZone || selectedOriginZone === "Choisir" || selectedOriginZone.trim() === "") && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-amber-800 font-medium">Zone d'origine requise</p>
                      <p className="text-amber-700 text-sm mt-1">
                        Veuillez saisir votre zone d'origine pour continuer.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contenu de l'onglet Dimensions */}
      {activeTab === "dimensions" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Dimensions du Colis
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Poids (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={packageDimensions?.weight || ""}
                    onChange={(e) =>
                      setPackageDimensions((prev) => ({
                        ...prev,
                        weight: Number(e.target.value),
                      }))
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Longueur (cm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={packageDimensions?.length || ""}
                    onChange={(e) =>
                      setPackageDimensions((prev) => ({
                        ...prev,
                        length: Number(e.target.value),
                      }))
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    min="0"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Largeur (cm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={packageDimensions?.width || ""}
                    onChange={(e) =>
                      setPackageDimensions((prev) => ({
                        ...prev,
                        width: Number(e.target.value),
                      }))
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    min="0"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Hauteur (cm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={packageDimensions?.height || ""}
                    onChange={(e) =>
                      setPackageDimensions((prev) => ({
                        ...prev,
                        height: Number(e.target.value),
                      }))
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    min="0"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                    cm
                  </span>
                </div>
              </div>
            </div>

            {/* Résumé des dimensions */}
            {(packageDimensions?.weight || packageDimensions?.length || packageDimensions?.width || packageDimensions?.height) && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-medium text-gray-800 mb-2">Résumé du Colis :</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  {packageDimensions?.weight && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Poids: {packageDimensions.weight} kg
                    </span>
                  )}
                  {packageDimensions?.length && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      L: {packageDimensions.length} cm
                    </span>
                  )}
                  {packageDimensions?.width && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      l: {packageDimensions.width} cm
                    </span>
                  )}
                  {packageDimensions?.height && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      H: {packageDimensions.height} cm
                    </span>
                  )}
                </div>
                {packageDimensions?.length && packageDimensions?.width && packageDimensions?.height && (
                  <div className="mt-2 text-sm text-gray-600">
                    Volume approximatif : {(packageDimensions.length * packageDimensions.width * packageDimensions.height / 1000).toFixed(2)} L
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingRatesManager;