import Rutas from "./routing/Rutas";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

import Login from "./components/login/Login";
import useAuthStore from "./store/authStore";
import MercadoLibreOAuthCallback from "./components/ecommerce/MercadoLibreOAuthCallback";

import { ProcessProvider } from "../src/components/loaders/ProcessContext";

import { conectarSocket, desconectarSocket } from "./services/socketService";

const AppWrapper = () => {
  const navigate = useNavigate();

  const { token, validateSession, logout } = useAuthStore();

  const [checked, setChecked] = useState(false);

  // ============================================================
  // VALIDAR SESIÓN
  // ============================================================

  useEffect(() => {
    const check = async () => {
      const valid = await validateSession();

      if (!valid) {
        navigate("/login");
      }

      setChecked(true);
    };

    check();
  }, [validateSession, navigate]);

  // ============================================================
  // SINCRONIZAR LOGOUT ENTRE PESTAÑAS
  // ============================================================

  useEffect(() => {
    const handleStorageChange = () => {
      if (!localStorage.getItem("token")) {
        logout();
        navigate("/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, [logout, navigate]);

  // ============================================================
  // SOCKET.IO
  // ============================================================

  useEffect(() => {
    if (!checked || !token) {
      return;
    }

    const socket = conectarSocket(token);

    if (!socket) {
      return;
    }

    // ----------------------------------------------------------
    // PRUEBA TEMPORAL
    // ----------------------------------------------------------

    const handleChatReady = (data) => {
      // console.log("[Chat] Socket listo:", data);
    };

    const handleNuevoMensaje = (data) => {
      // console.log("[Chat] Mensaje recibido:", data);
    };

    socket.on("chat:ready", handleChatReady);

    socket.on("chat:mensaje:nuevo", handleNuevoMensaje);

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {
      socket.off("chat:ready", handleChatReady);

      socket.off("chat:mensaje:nuevo", handleNuevoMensaje);

      desconectarSocket();
    };
  }, [checked, token]);

  // ============================================================
  // RENDER
  // ============================================================

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!checked) {
    return null;
  }

  return (
    <ProcessProvider>
      <Rutas />
    </ProcessProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* =====================================================
          CALLBACK GLOBAL OAUTH MERCADO LIBRE

          No renderiza interfaz.
          Solo actúa cuando la URL contiene:
          ?code=...&state=...
      ====================================================== */}
      <MercadoLibreOAuthCallback />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/*" element={<AppWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
