import { useCallback, useState } from "react";

import axios from "axios";

const useChatConversations = (token) => {
  // ============================================================
  // ESTADOS
  // ============================================================

  const [conversaciones, setConversaciones] = useState([]);

  const [loading, setLoading] = useState(false);

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

  const obtenerConversaciones = useCallback(async () => {
    if (!token) {
      return [];
    }

    try {
      setLoading(true);

      const response = await axios.get(`${apiUrl}/chat/conversaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data?.conversaciones ?? response.data ?? [];

      const lista = Array.isArray(data) ? data : [];

      setConversaciones(lista);

      return lista;
    } catch (error) {
      console.error("Error obteniendo conversaciones:", error);

      setConversaciones([]);

      return [];
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  
  // ============================================================
  // ANCLAR CONVERSACIONES
  // ============================================================
  const toggleAnclada = useCallback(
    async (conversacion) => {
      if (!token || !conversacion?.id) {
        return;
      }

      const estaAnclada =
        Number(conversacion.anclada) === 1 || conversacion.anclada === true;

      const nuevoEstado = !estaAnclada;

      try {
        await axios.patch(
          `${apiUrl}/chat/conversaciones/${conversacion.id}/anclada`,
          {
            anclada: nuevoEstado,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Volvemos a obtener las conversaciones.
        //
        // El backend ya las entrega ordenadas:
        // 1. Ancladas
        // 2. Actividad más reciente
        await obtenerConversaciones();
      } catch (error) {
        console.error("Error al anclar/desanclar conversación:", error);
      }
    },
    [token, apiUrl, obtenerConversaciones],
  );

  // ============================================================
  // SILENCIAR CONVERSACIONES
  // ============================================================
  const toggleSilenciada = useCallback(
  async (conversacion) => {
    if (!token || !conversacion?.id) return;

    const estaSilenciada =
      Number(conversacion.silenciado) === 1 ||
      conversacion.silenciado === true;

    const nuevoEstado = !estaSilenciada;

    try {
      await axios.patch(
        `${apiUrl}/chat/conversaciones/${conversacion.id}/silenciar`,
        {
          silenciado: nuevoEstado,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await obtenerConversaciones();
    } catch (error) {
      console.error(
        "Error al silenciar/desilenciar conversación:",
        error,
      );
    }
  },
  [token, apiUrl, obtenerConversaciones],
);

  // ============================================================
  // MARCAR LOCALMENTE COMO LEÍDA
  // ============================================================

  const marcarConversacionLeida = useCallback((conversacionId) => {
    setConversaciones((conversacionesActuales) =>
      conversacionesActuales.map((conversacion) =>
        Number(conversacion.id) === Number(conversacionId)
          ? {
              ...conversacion,

              mensajes_no_leidos: 0,
            }
          : conversacion,
      ),
    );
  }, []);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    conversaciones,
    setConversaciones,

    loading,

    obtenerConversaciones,
    marcarConversacionLeida,
    toggleAnclada,
    toggleSilenciada,
  };
};

export default useChatConversations;
