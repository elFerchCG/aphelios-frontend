import { useCallback, useEffect, useState } from "react";

import { Badge, IconButton, Tooltip } from "@mui/material";

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

import axios from "axios";

import useAuthStore from "../../store/authStore";

import { onSocketDisponible } from "../../services/socketService";

const ChatButton = ({ onClick }) => {
  const { token } = useAuthStore();

  const [noLeidos, setNoLeidos] = useState(0);

  // ============================================================
  // API
  // ============================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ============================================================
  // OBTENER TOTAL NO LEÍDOS
  // ============================================================

  const obtenerNoLeidos = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await axios.get(
        `${apiUrl}/chat/no-leidos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setNoLeidos(
        Number(
          response.data?.total ??
            response.data?.mensajes_no_leidos ??
            0,
        ),
      );
    } catch (error) {
      console.error(
        "Error obteniendo mensajes no leídos:",
        error,
      );
    }
  }, [token, apiUrl]);

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    obtenerNoLeidos();
  }, [obtenerNoLeidos]);

  // ============================================================
  // SOCKET.IO
  // ============================================================

  useEffect(() => {
    let socketActual = null;

    // ==========================================================
    // NUEVO MENSAJE
    // ==========================================================

    const handleNuevoMensaje = (data) => {
      console.log(
        "[ChatButton] Nuevo mensaje recibido:",
        data,
      );

      obtenerNoLeidos();
    };

    // ==========================================================
    // NUEVA CONVERSACIÓN
    // ==========================================================

    const handleNuevaConversacion = (data) => {
      console.log(
        "[ChatButton] Nueva conversación recibida:",
        data,
      );

      obtenerNoLeidos();
    };

    // ==========================================================
    // SOCKET DISPONIBLE
    // ==========================================================

    const conectarListener = (socket) => {
      // Evitar registrar dos veces
      // sobre la misma instancia.
      if (socketActual === socket) {
        return;
      }

      // Si por alguna razón cambió
      // la instancia, limpiamos la anterior.
      if (socketActual) {
        socketActual.off(
          "chat:mensaje:nuevo",
          handleNuevoMensaje,
        );

        socketActual.off(
          "chat:conversacion:nueva",
          handleNuevaConversacion,
        );
      }

      socketActual = socket;

      // ========================================================
      // REGISTRAR LISTENERS
      // ========================================================

      socketActual.on(
        "chat:mensaje:nuevo",
        handleNuevoMensaje,
      );

      socketActual.on(
        "chat:conversacion:nueva",
        handleNuevaConversacion,
      );

      console.log(
        "[ChatButton] Listeners de chat registrados",
      );
    };

    // ==========================================================
    // SUSCRIBIR
    // ==========================================================

    const unsubscribe =
      onSocketDisponible(conectarListener);

    // ==========================================================
    // CLEANUP
    // ==========================================================

    return () => {
      unsubscribe();

      if (socketActual) {
        socketActual.off(
          "chat:mensaje:nuevo",
          handleNuevoMensaje,
        );

        socketActual.off(
          "chat:conversacion:nueva",
          handleNuevaConversacion,
        );
      }
    };
  }, [obtenerNoLeidos]);

  // ============================================================
  // ACTUALIZACIÓN LOCAL
  // ============================================================

  useEffect(() => {
    const handleActualizarNoLeidos = () => {
      obtenerNoLeidos();
    };

    window.addEventListener(
      "chat:no-leidos:actualizar",
      handleActualizarNoLeidos,
    );

    return () => {
      window.removeEventListener(
        "chat:no-leidos:actualizar",
        handleActualizarNoLeidos,
      );
    };
  }, [obtenerNoLeidos]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Tooltip title="Mensajes">
      <IconButton
        onClick={onClick}
        aria-label="Abrir mensajes"
        sx={{
          color: "inherit",
        }}
      >
        <Badge
          badgeContent={noLeidos}
          color="error"
          max={99}
          invisible={noLeidos <= 0}
        >
          <ChatBubbleOutlineIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default ChatButton;