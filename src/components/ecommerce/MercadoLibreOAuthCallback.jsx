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
      const params = new URLSearchParams(window.location.search);

      const code = params.get("code");
      const state = params.get("state");
      const oauthError = params.get("error");
      const oauthErrorDescription = params.get("error_description");

      // =====================================================
      // NO ES CALLBACK DE MERCADO LIBRE
      // =====================================================

      if (!code && !state && !oauthError) {
        return;
      }

      console.log("🟡 OAuth callback de Mercado Libre detectado", {
        tieneCode: Boolean(code),
        tieneState: Boolean(state),
        tieneError: Boolean(oauthError),
      });

      // Evitar doble ejecución por React StrictMode
      if (procesandoRef.current) {
        return;
      }

      procesandoRef.current = true;

      try {
        // =====================================================
        // MERCADO LIBRE DEVOLVIÓ ERROR / CANCELACIÓN
        // =====================================================

        if (oauthError) {
          throw new Error(
            oauthErrorDescription ||
              "Mercado Libre rechazó o canceló la autorización.",
          );
        }

        // =====================================================
        // VALIDAR RESPUESTA
        // =====================================================

        if (!code) {
          throw new Error(
            "Mercado Libre no devolvió el código de autorización.",
          );
        }

        if (!state) {
          throw new Error(
            "Mercado Libre no devolvió el state de autorización.",
          );
        }

        // =====================================================
        // ENVIAR CODE + STATE AL BACKEND
        // =====================================================

        const response = await axios.post(
          `${apiUrl}/mercadoLibre/oauth/callback`,
          {
            code,
            state,
          },
        );

        console.log("🟢 OAuth Mercado Libre completado", {
          ok: response.data?.ok,
          cuentaMlId: response.data?.cuenta?.cuentaMlId,
          sellerId: response.data?.cuenta?.sellerId,
          tieneRefreshToken:
            response.data?.cuenta?.tieneRefreshToken,
        });

        // =====================================================
        // LIMPIAR URL
        // =====================================================

        limpiarParametrosOAuth();

        // =====================================================
        // ÉXITO
        // =====================================================

        await Swal.fire({
          icon: "success",
          title: "Cuenta vinculada",
          text:
            response.data?.message ||
            "La cuenta de Mercado Libre fue autorizada correctamente.",
          confirmButtonText: "Aceptar",
        });
      } catch (error) {
        console.error(
          "❌ Error procesando OAuth de Mercado Libre:",
          error,
        );

        // Quitamos code/state aunque haya ocurrido un error.
        // Así no intentamos reutilizar el mismo authorization code
        // al refrescar la página.
        limpiarParametrosOAuth();

        const mensaje =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "No se pudo autorizar la cuenta de Mercado Libre.";

        await Swal.fire({
          icon: "error",
          title: "No se pudo vincular la cuenta",
          text: mensaje,
          confirmButtonText: "Aceptar",
        });
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