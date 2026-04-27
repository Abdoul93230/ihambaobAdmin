import "./App.css";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Admin from "./Pages/Admin";
import { useState, useEffect } from "react";
import AdminConnection from "./AdminComponents/AdminConnection/AdminConnection";
import io from "socket.io-client";
import "reactjs-popup/dist/index.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastProvider } from "./hooks/useToast";
import { Toaster } from "./components/ui/toaster";
import { QueryClient, QueryClientProvider } from "react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // Import du AuthContext
import axios from "axios";

const BackendUrl = process.env.REACT_APP_Backend_Url;

// Composant interne qui utilise le contexte d'authentification
function AppContent() {
  const [allCategories, setAllCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const { isAuthenticated, loading } = useAuth(); // Utilisation du contexte

  useEffect(() => {
    // Socket.io setup
    const socket = io(BackendUrl);

    socket.on("new_message_user", (data) => {
      // console.log("Nouveau message reçu :");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Charger les données seulement si authentifié
    if (isAuthenticated) {
      loadAppData();
    }
  }, [isAuthenticated]);

  const loadAppData = async () => {
    try {
      // Charger les catégories
      const categoriesResponse = await axios.get(`${BackendUrl}/getAllCategories`);
      setAllCategories(categoriesResponse.data.data);

      // Charger les produits
      const productsResponse = await axios.get(`${BackendUrl}/ProductsClients`);
      setAllProducts(productsResponse.data.data);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  // Afficher le spinner pendant la vérification d'authentification
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Route principale */}
          <Route
            path="/"
            element={
              <ProtectedAdminRoute 
                allCategories={allCategories} 
                allProducts={allProducts} 
              />
            }
          />
          
          {/* Routes admin */}
          <Route
            path="/Admin"
            element={
              <ProtectedAdminRoute 
                allCategories={allCategories} 
                allProducts={allProducts} 
              />
            }
          />

          <Route
            path="/Admin/:op"
            element={
              <ProtectedAdminRoute 
                allCategories={allCategories} 
                allProducts={allProducts} 
              />
            }
          />
          
          <Route
            path="/Admin/:op/:id"
            element={
              <ProtectedAdminRoute 
                allCategories={allCategories} 
                allProducts={allProducts} 
              />
            }
          />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </div>
  );
}

// Composant pour les routes protégées qui utilise VRAIMENT le contexte
function ProtectedAdminRoute({ allCategories, allProducts }) {
  const { isAuthenticated } = useAuth(); // Utilisation du contexte

  return isAuthenticated ? (
    <Admin
      allCategories={allCategories}
      allProducts={allProducts}
    />
  ) : (
    <AdminConnection />
  );
}

// Composant de chargement réutilisable
function LoadingSpinner() {
  const spinnerStyle = {
    border: "4px solid rgba(0, 0, 0, 0.15)",
    borderTop: "4px solid #FF6969",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    animation: "spin 1s linear infinite",
    margin: "auto",
  };

  const spinnerContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  };

  return (
    <div style={spinnerContainerStyle}>
      <div style={spinnerStyle}></div>
      <p>Vérification en cours...</p>
    </div>
  );
}

// Composant principal avec tous les providers
function App() {
  // Créer le client React Query
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
          <Toaster />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

// Fonctions utilitaires pour les toasts (conservées)
const handleAlert = (message) => {
  toast.success(`${message} !`, {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

const handleAlertwar = (message) => {
  toast.warn(`${message} !`, {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

const handleAlertwar2 = (message, time) => {
  toast.warn(`${message} !`, {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: time,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export { handleAlert, handleAlertwar, handleAlertwar2 };