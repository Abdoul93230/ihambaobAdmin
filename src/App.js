import "./App.css";
import "./index.css";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Admin from "./Pages/Admin";
import axios from "axios";
import { useState, useEffect } from "react";
import AdminConnection from "./AdminComponents/AdminConnection/AdminConnection";
import io from "socket.io-client";
import "reactjs-popup/dist/index.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { Provider } from "react-redux";
// import store from "./redux/store";
// import {
//   getCategories,
//   getProducts,
//   getProducts_Commentes,
//   getProducts_Pubs,
//   getTypes,
// } from "./redux/ProductsActions";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function App() {
  const [allCategories, setAllCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [adminConnection, setAdminConnection] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const changeAdminConnection = () => {
    setAdminConnection(true);
  };

  useEffect(() => {
    // store.dispatch(getProducts());
    // store.dispatch(getTypes());
    // store.dispatch(getCategories());
    // store.dispatch(getProducts_Pubs());
    // store.dispatch(getProducts_Commentes());
    const socket = io(BackendUrl);

    // socket.on("connect", () => {
    //   console.log("Connecté au serveur Socket.io");
    // });

    socket.on("new_message_user", (data) => {
      // console.log("Nouveau message reçu :");
    });

    // socket.on("disconnect", () => {
    //   console.log("Déconnecté du serveur Socket.io");
    // });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem("AdminEcomme"));
    if (admin) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${admin.token}`;
      axios
        .get(`${BackendUrl}/verifyAdmin`, { withCredentials: true })
        .then((response) => {
          setAdminConnection(true);
          setVerificationComplete(true);
          // console.log({ local: user.token });
          // console.log(response.data);
          // console.log(response);
        })
        .catch((error) => {
          setAdminConnection(false);
          setVerificationComplete(true);
          // console.log(error);
        });
    } else {
      setVerificationComplete(true);
    }

    axios
      .get(`${BackendUrl}/getAllCategories`)
      .then((Categories) => {
        setAllCategories(Categories.data.data);
      })
      .catch((error) => {
        console.log(error);
      });

    axios
      .get(`${BackendUrl}/products`)
      .then((Categories) => {
        setAllProducts(Categories.data.data);
      })
      .catch((error) => {
        console.log(error.response.data.message);
      });
  }, []);

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
    height: "100vh", // Centre le spinner verticalement sur la page
  };

  return (
    // <Provider store={store}>
    <div className="App">
      <BrowserRouter>
        {verificationComplete ? (
          <Routes>
            <Route
              path="/"
              element={
                adminConnection ? (
                  <Admin
                    allCategories={allCategories}
                    allProducts={allProducts}
                  />
                ) : (
                  <AdminConnection chg={changeAdminConnection} />
                )
              }
            ></Route>
            <Route
              path="/Admin"
              element={
                adminConnection ? (
                  <Admin
                    allCategories={allCategories}
                    allProducts={allProducts}
                  />
                ) : (
                  <AdminConnection chg={changeAdminConnection} />
                )
              }
            ></Route>

            <Route
              path="/Admin/:op"
              element={
                adminConnection ? (
                  <Admin
                    allCategories={allCategories}
                    allProducts={allProducts}
                  />
                ) : (
                  <AdminConnection chg={changeAdminConnection} />
                )
              }
            ></Route>
            <Route
              path="/Admin/:op/:id"
              element={
                adminConnection ? (
                  <Admin
                    allCategories={allCategories}
                    allProducts={allProducts}
                  />
                ) : (
                  <AdminConnection chg={changeAdminConnection} />
                )
              }
            ></Route>
          </Routes>
        ) : (
          <div style={spinnerContainerStyle}>
            <div style={spinnerStyle}></div>
            {/* <p>En cours de vérification...</p> */}
          </div>
        )}
      </BrowserRouter>
      <ToastContainer />
    </div>
    // </Provider>
  );
}

export default App;

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
