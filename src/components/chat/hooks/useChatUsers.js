import {
  useCallback,
  useState,
} from "react";

import axios from "axios";

const useChatUsers = (
  token
) => {
  // ============================================================
  // ESTADOS
  // ============================================================

  const [
    usuarios,
    setUsuarios,
  ] = useState([]);

  const [
    loadingUsuarios,
    setLoadingUsuarios,
  ] = useState(false);

  // ============================================================
  // API
  // ============================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ============================================================
  // OBTENER USUARIOS
  // ============================================================

  const obtenerUsuarios =
    useCallback(async () => {
      if (!token) {
        return [];
      }

      try {
        setLoadingUsuarios(
          true
        );

        const response =
          await axios.get(
            `${apiUrl}/chat/usuarios`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          response.data
            ?.usuarios ??
          response.data ??
          [];

        const lista =
          Array.isArray(data)
            ? data
            : [];

        setUsuarios(lista);

        return lista;
      } catch (error) {
        console.error(
          "Error obteniendo usuarios del chat:",
          error
        );

        setUsuarios([]);

        return [];
      } finally {
        setLoadingUsuarios(
          false
        );
      }
    }, [
      token,
      apiUrl,
    ]);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    usuarios,
    setUsuarios,

    loadingUsuarios,

    obtenerUsuarios,
  };
};

export default useChatUsers;