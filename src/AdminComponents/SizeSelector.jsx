import React from "react";

const sizeOptions = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  shoes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  numeric: ["30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50"],
  oneSize: ["Taille Unique"],
  custom: [],
};

export default function SizeSelector({
  selectedSizes,
  onSizeToggle,
  sizeType,
}) {
  const [customSize, setCustomSize] = React.useState("");
  const availableSizes = sizeOptions[sizeType] || [];

  const handleCustomSizeAdd = (e) => {
    console.log("custom size");
    e.preventDefault();
    if (customSize && !selectedSizes.includes(customSize)) {
      onSizeToggle(customSize);
      setCustomSize("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {availableSizes.map((size) => (
          <div
            style={{ cursor: "pointer" }}
            key={size}
            onClick={() => onSizeToggle(size)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${
                selectedSizes.includes(size)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            {size}
          </div>
        ))}
      </div>

      {sizeType === "custom" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            placeholder="Ajouter une taille personnalisée"
            className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <span
            style={{ cursor: "pointer" }}
            type="submit"
            onClick={handleCustomSizeAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!customSize}
          >
            Ajouter
          </span>
        </div>
      )}

      {selectedSizes.length > 0 && sizeType === "custom" && (
        <div className="flex flex-wrap gap-2">
          {selectedSizes.map((size) => (
            <span
              style={{ cursor: "pointer" }}
              key={size}
              className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2"
            >
              {size}
              <span
                onClick={() => onSizeToggle(size)}
                className="text-gray-500 hover:text-red-500"
              >
                ×
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
