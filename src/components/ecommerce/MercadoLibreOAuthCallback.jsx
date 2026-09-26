import { useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const MercadoLibreOAuthCallback = () => {
  // Evita procesar dos veces el callback por React StrictMode
  const procesandoRef = useRef(false);

  useEffect(() => {
    const procesarCallback = async () => {
      // =====================================================
      // 1. LEER PARÁMETROS DE LA URL
      // =====================================================

      const params = new URLSearchParams(window.location.search);

      const code = params.get("code");
      const state = params.get("state");

      console.log("🟡 OAuth callback detectado");
      console.log("Tiene code:", Boolean(code));
      console.log("Tiene state:", Boolean(state));

      const oauthError = params.get("error");
      const oauthErrorDescription = params.get("error_description");

      // =====================================================
      // 2. NO ES UN CALLBACK DE MERCADO LIBRE
      // =====================================================

      if (!code && !state && !oauthError) {
        return;
      }

      if (procesandoRef.current) {
        return;
      }

      procesandoRef.current = true;

      // =====================================================
      // 3. MERCADO LIBRE DEVOLVIÓ UN ERROR
      // =====================================================

      if (oauthError) {
        await Swal.fire({
          icon: "error",
          title: "Mercado Libre",
          text:
            oauthErrorDescription ||
            "Mercado Libre no pudo autorizar la cuenta.",
        });

        limpiarParametrosOAuth();
        return;
      }

      // =====================================================
      // 4. VALIDAR CODE Y STATE
      // =====================================================

      if (!code || !state) {
        await Swal.fire({
          icon: "error",
          title: "Autorización incompleta",
          text: "Mercado Libre no devolvió todos los datos necesarios.",
        });

        limpiarParametrosOAuth();
        return;
      }

      try {
        // =====================================================
        // 5. ENVIAR CODE + STATE AL BACKEND
        // =====================================================

        console.log("🟠 Enviando callback OAuth al backend...");
        console.log("URL:", `${apiUrl}/mercadoLibre/oauth/callback`);

        const response = await axios.post(
          `${apiUrl}/mercadoLibre/oauth/callback`,
          {
            code,
            state,
          },
        );

        // =====================================================
        // 6. CUENTA CONECTADA
        // =====================================================

        await Swal.fire({
          icon: "success",
          title: "Cuenta conectada",
          text:
            response.data?.message ||
            "La cuenta de Mercado Libre fue conectada correctamente.",
        });

        // =====================================================
        // 7. LIMPIAR CODE Y STATE DE LA URL
        // =====================================================

        limpiarParametrosOAuth();
      } catch (error) {
        console.error("Error procesando OAuth de Mercado Libre:", error);

        const mensaje =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "No se pudo conectar la cuenta de Mercado Libre.";

        await Swal.fire({
          icon: "error",
          title: "Error conectando Mercado Libre",
          text: mensaje,
        });

        limpiarParametrosOAuth();
      }
    };

    procesarCallback();
  }, []);

  return null;
};

// =========================================================
// LIMPIAR PARÁMETROS OAUTH DE LA URL
// =========================================================

const limpiarParametrosOAuth = () => {
  const url = new URL(window.location.href);

  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");

  window.history.replaceState(
    {},
    document.title,
    `${url.pathname}${url.search}${url.hash}`,
  );
};

export default MercadoLibreOAuthCallback;
