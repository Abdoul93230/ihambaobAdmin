import React from "react";
import axios from "axios";

// interface DeletePicturesButtonProps {
//   productId: string;
//   onSuccess?: () => void; // Callback optionnelle après la suppression
// }
const BackendUrl = process.env.REACT_APP_Backend_Url;
const DeletePicturesButton = ({ productId, onSuccess }) => {
  const handleDelete = async () => {
    const confirm = window.confirm(
      "Êtes-vous sûr de vouloir supprimer toutes les images de ce produit ? Cette action est irréversible."
    );

    if (confirm) {
      try {
        // Effectuer la requête DELETE
        const response = await axios.delete(
          `${BackendUrl}/products/pictures/${productId}`
        );

        if (response.status === 200) {
          alert("Images supprimées avec succès !");
          if (onSuccess) {
            onSuccess(); // Optionnel : appeler une fonction de callback pour rafraîchir les données
          }
        }
      } catch (error) {
        console.error("Erreur lors de la suppression des images :", error);
        alert("Une erreur est survenue. Veuillez réessayer.");
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="btn btn-danger"
      style={{ marginTop: "10px" }}
    >
      Supprimer les images
    </button>
  );
};

export default DeletePicturesButton;
