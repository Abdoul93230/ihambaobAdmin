import React, { useState } from "react";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";
import SizeSelector from "./SizeSelector";

// interface Variant {
//   id: string;
//   color: string;
//   colorName: string;
//   sizes: string[];
//   imageFile: File | null;
//   imagePreview: string | null;
// }

export default function ProductVariantForm({ variants, setVariants, chg }) {
  const [currentVariant, setCurrentVariant] = useState({
    id: "",
    colorCode: "#000000",
    color: "#000000",
    colorName: "",
    sizes: [],
    imageFile: null,
    imagePreview: null,
  });
  const [sizeType, setSizeType] = useState("clothing");

  const handleAddVariant = () => {
    if (currentVariant.colorName && currentVariant.sizes.length > 0) {
      const newVariant = {
        ...currentVariant,
        id: Date.now().toString(),
      };
      setVariants([...variants, newVariant]);

      // Reset current variant
      setCurrentVariant({
        id: "",
        colorCode: "#000000",
        color: "#000000",
        colorName: "",
        sizes: [],
        imageFile: null,
        imagePreview: null,
      });

      //   console.log([...variants, newVariant]);
    }
  };

  const handleRemoveVariant = (id, _id) => {
    if (_id) {
      chg(_id);
    }
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSizeToggle = (size) => {
    setCurrentVariant((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentVariant((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Variantes du Produit
      </h2>

      <div className="space-y-4 mb-8 p-6 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={currentVariant.colorCode}
                onChange={(e) =>
                  setCurrentVariant((prev) => ({
                    ...prev,
                    colorCode: e.target.value,
                    color: e.target.value,
                  }))
                }
                className="h-10 w-20 rounded cursor-pointer"
              />
              <input
                type="text"
                placeholder="Nom de la couleur"
                value={currentVariant.colorName}
                onChange={(e) =>
                  setCurrentVariant((prev) => ({
                    ...prev,
                    colorName: e.target.value,
                  }))
                }
                className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image de la variante
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="w-full p-2 border rounded-md text-center hover:bg-gray-100">
                  {currentVariant.imageFile
                    ? currentVariant.imageFile.name
                    : "Choisir une image"}
                </div>
              </label>
              {currentVariant.imagePreview && (
                <div className="h-10 w-10 rounded-md overflow-hidden">
                  <img
                    src={currentVariant.imagePreview}
                    alt="Aperçu"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de tailles
          </label>
          <select
            value={sizeType}
            onChange={(e) => {
              setSizeType(e.target.value);
              setCurrentVariant((prev) => ({ ...prev, sizes: [] }));
            }}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 mb-4"
          >
            <option value="clothing">Vêtements (XS-3XL)</option>
            <option value="shoes">Chaussures (36-46)</option>
            <option value="numeric">Tailles numériques (30-50)</option>
            <option value="oneSize">Taille unique</option>
            <option value="custom">Tailles personnalisées</option>
          </select>

          <SizeSelector
            selectedSizes={currentVariant.sizes}
            onSizeToggle={handleSizeToggle}
            sizeType={sizeType}
          />
        </div>

        <button
          style={{ cursor: "pointer" }}
          onClick={handleAddVariant}
          disabled={
            !currentVariant.colorName || currentVariant.sizes.length === 0
          }
          className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter la variante
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Variantes ajoutées ({variants.length})
        </h3>
{console.log({variants})
}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {variant.imagePreview || variant?.imageUrl ? (
                    <img
                      src={variant.imagePreview || variant?.imageUrl}
                      alt={variant.colorName}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: variant.colorCode }}
                      />
                      <span className="font-medium">{variant.colorName}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {variant.sizes.map((size) => (
                        <span
                          key={size}
                          className="px-2 py-1 text-xs bg-gray-100 rounded"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleRemoveVariant(
                      variant.id,
                      variant?._id ? variant._id : null
                    )
                  }
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
