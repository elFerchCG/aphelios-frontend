import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Badge,
  IconButton,
  Tooltip,
} from "@mui/material";

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

import axios from "axios";

import useAuthStore from "../../store/authStore";

import {
  onSocketDisponible,
} from "../../services/socketService";

const ChatButton = ({ onClick }) => {
  const { token, user } =
    useAuthStore();

  const [
    noLeidos,
    setNoLeidos,
  ] = useState(0);

  // Indica si el usuario ya abrió el panel
  // desde la última vez que recibió mensajes.
  const [
    avisoAtendido,
    setAvisoAtendido,
  ] = useState(false);

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

  const obtenerNoLeidos =
    useCallback(async () => {
      if (!token) {
        return;
      }

      try {
        const response =
          await axios.get(
            `${apiUrl}/chat/no-leidos`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        setNoLeidos(
          Number(
            response.data?.total ??
              response.data
                ?.mensajes_no_leidos ??
              0,
          ),
        );
      } catch (error) {
        console.error(
          "Error obteniendo mensajes no leídos:",
          error,
        );
      }
    }, [
      token,
      apiUrl,
    ]);

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    obtenerNoLeidos();
  }, [obtenerNoLeidos]);

  // ============================================================
  // SI YA NO HAY PENDIENTES
  // RESETEAR ESTADO DE AVISO
  // ============================================================

  useEffect(() => {
    if (noLeidos <= 0) {
      setAvisoAtendido(false);
    }
  }, [noLeidos]);

  // ============================================================
  // SOCKET.IO
  // ============================================================

  useEffect(() => {
    let socketActual = null;

    // ==========================================================
    // NUEVO MENSAJE
    // ==========================================================

    const handleNuevoMensaje = (
      data,
    ) => {
      // Siempre refrescamos contador.
      obtenerNoLeidos();

      const mensaje =
        data?.mensaje;

      // Si el evento no trae mensaje,
      // no podemos saber quién lo mandó.
      if (!mensaje) {
        return;
      }

      // ========================================================
      // NO REACTIVAR ANIMACIÓN POR MENSAJES DEL SISTEMA
      // ========================================================

      if (
        mensaje.tipo ===
        "sistema"
      ) {
        return;
      }

      // ========================================================
      // NO REACTIVAR POR MIS PROPIOS MENSAJES
      // ========================================================

      const usuarioActualId =
        user?.id ??
        user?.id_usuario;

      if (
        Number(
          mensaje.usuario_id,
        ) ===
        Number(usuarioActualId)
      ) {
        return;
      }

      // ========================================================
      // LLEGÓ UN MENSAJE DE OTRA PERSONA
      //
      // Aunque el usuario ya hubiera abierto Mensajes,
      // vuelve a requerir su atención.
      // ========================================================

      setAvisoAtendido(false);
    };

    // ==========================================================
    // NUEVA CONVERSACIÓN
    // ==========================================================

    const handleNuevaConversacion =
      () => {
        obtenerNoLeidos();
      };

    // ==========================================================
    // SOCKET DISPONIBLE
    // ==========================================================

    const conectarListener = (
      socket,
    ) => {
      if (
        socketActual === socket
      ) {
        return;
      }

      // ========================================================
      // LIMPIAR INSTANCIA ANTERIOR
      // ========================================================

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
    };

    // ==========================================================
    // SUSCRIBIR
    // ==========================================================

    const unsubscribe =
      onSocketDisponible(
        conectarListener,
      );

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
  }, [
    obtenerNoLeidos,
    user?.id,
    user?.id_usuario,
  ]);

  // ============================================================
  // ACTUALIZACIÓN LOCAL
  // ============================================================

  useEffect(() => {
    const handleActualizarNoLeidos =
      () => {
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
  // ABRIR MENSAJES
  // ============================================================

  const handleClick = () => {
    // El usuario ya atendió visualmente
    // el aviso.
    setAvisoAtendido(true);

    onClick?.();
  };

  // ============================================================
  // ¿DEBE LLAMAR LA ATENCIÓN?
  // ============================================================

  const debeAnimar =
    noLeidos > 0 &&
    !avisoAtendido;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Tooltip title="Mensajes">
      <IconButton
        onClick={handleClick}
        aria-label="Abrir mensajes"
        sx={{
          color: "inherit",

          // ====================================================
          // ANIMACIÓN DE ATENCIÓN
          //
          // La mayor parte del ciclo está quieto.
          // Hace un pequeño pop y vuelve a descansar.
          // ====================================================

          "@keyframes chatAttention": {
            "0%": {
              transform:
                "scale(1)",
            },

            "68%": {
              transform:
                "scale(1)",
            },

            "76%": {
              transform:
                "scale(1.20)",
            },

            "84%": {
              transform:
                "scale(0.95)",
            },

            "91%": {
              transform:
                "scale(1.10)",
            },

            "96%": {
              transform:
                "scale(1)",
            },

            "100%": {
              transform:
                "scale(1)",
            },
          },
        }}
      >
        <Badge
          badgeContent={noLeidos}
          color="error"
          max={99}
          invisible={noLeidos <= 0}
          sx={{
            animation: debeAnimar
              ? "chatAttention 2.8s ease-in-out infinite"
              : "none",

            transformOrigin:
              "center",
          }}
        >
          <ChatBubbleOutlineIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default ChatButton;