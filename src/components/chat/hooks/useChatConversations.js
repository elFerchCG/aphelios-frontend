import {
  useCallback,
  useState,
} from "react";

import axios from "axios";

const useChatConversations = (
  token
) => {
  // ============================================================
  // ESTADOS
  // ============================================================

  const [
    conversaciones,
    setConversaciones,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  // ============================================================
  // API
  // ============================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ============================================================
  // OBTENER CONVERSACIONES
  // ============================================================

  const obtenerConversaciones =
    useCallback(async () => {
      if (!token) {
        return [];
      }

      try {
        setLoading(true);

        const response =
          await axios.get(
            `${apiUrl}/chat/conversaciones`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          response.data
            ?.conversaciones ??
          response.data ??
          [];

        const lista =
          Array.isArray(data)
            ? data
            : [];

        setConversaciones(
          lista
        );

        return lista;
      } catch (error) {
        console.error(
          "Error obteniendo conversaciones:",
          error
        );

        setConversaciones([]);

        return [];
      } finally {
        setLoading(false);
      }
    }, [
      token,
      apiUrl,
    ]);

  // ============================================================
  // MARCAR LOCALMENTE COMO LEÍDA
  // ============================================================

  const marcarConversacionLeida =
    useCallback(
      (conversacionId) => {
        setConversaciones(
          (
            conversacionesActuales
          ) =>
            conversacionesActuales.map(
              (conversacion) =>
                Number(
                  conversacion.id
                ) ===
                Number(
                  conversacionId
                )
                  ? {
                      ...conversacion,

                      mensajes_no_leidos:
                        0,
                    }
                  : conversacion
            )
        );
      },
      []
    );

  // ============================================================
  // RETURN
  // ============================================================

  return {
    conversaciones,
    setConversaciones,

    loading,

    obtenerConversaciones,
    marcarConversacionLeida,
  };
};

export default useChatConversations;