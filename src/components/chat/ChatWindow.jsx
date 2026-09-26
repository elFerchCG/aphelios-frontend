import { Box } from "@mui/material";

import { useCallback, useEffect, useRef, useState } from "react";

import axios from "axios";

import useAuthStore from "../../store/authStore";
import { getSocket } from "../../services/socketService";

import GroupInfo from "./components/GroupInfo";
import ConversationHeader from "./components/window/ConversationHeader";
import MessageList from "./components/window/MessageList";
import MessageInput from "./components/window/MessageInput";

const ChatWindow = ({
  conversacion,
  onBack,
  onClose,
  onLeido,

  usuarios,
  loadingUsuarios,
  obtenerUsuarios,
}) => {
  const { token, user } = useAuthStore();

  // ============================================================
  // USUARIO ACTUAL
  // ============================================================

  const usuarioActualId = Number(
    user?.id ?? user?.id_usuario ?? user?.usuario_id,
  );

  // ============================================================
  // ESTADOS
  // ============================================================

  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nuevoMensaje, setNuevoMensaje] = useState("");

  const [enviando, setEnviando] = useState(false);

  const [vista, setVista] = useState("chat");

  const mensajesEndRef = useRef(null);

  // ============================================================
  // API
  // ============================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const conversacionId = Number(conversacion?.id);

  // ============================================================
  // SCROLL AL FINAL
  // ============================================================

  const scrollAlFinal = useCallback((behavior = "smooth") => {
    mensajesEndRef.current?.scrollIntoView({
      behavior,
    });
  }, []);

  // ============================================================
  // OBTENER MENSAJES
  // ============================================================

  const obtenerMensajes = useCallback(async () => {
    if (!token || !conversacionId) {
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `${apiUrl}/chat/conversaciones/${conversacionId}/mensajes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data?.mensajes || response.data || [];

      setMensajes(Array.isArray(data) ? data : []);

      setTimeout(() => {
        scrollAlFinal("auto");
      }, 0);
    } catch (error) {
      console.error("Error obteniendo mensajes:", error);

      setMensajes([]);
    } finally {
      setLoading(false);
    }
  }, [token, conversacionId, apiUrl, scrollAlFinal]);

  // ============================================================
  // MARCAR CONVERSACIÓN COMO LEÍDA
  // ============================================================

  const marcarComoLeida = useCallback(async () => {
    if (!token || !conversacionId) {
      return;
    }

    try {
      await axios.patch(
        `${apiUrl}/chat/conversaciones/${conversacionId}/leido`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // ========================================================
      // ACTUALIZAR CONTADOR GLOBAL
      // ========================================================

      window.dispatchEvent(new CustomEvent("chat:no-leidos:actualizar"));

      // ========================================================
      // ACTUALIZAR CHAT PANEL
      // ========================================================

      if (onLeido) {
        onLeido(conversacionId);
      }
    } catch (error) {
      console.error("Error marcando conversación como leída:", error);
    }
  }, [token, conversacionId, apiUrl, onLeido]);

  // ============================================================
  // REINICIAR VISTA AL CAMBIAR DE CONVERSACIÓN
  // ============================================================

  useEffect(() => {
    setVista("chat");
  }, [conversacionId]);

  // ============================================================
  // CARGAR HISTORIAL
  // ============================================================

  useEffect(() => {
    obtenerMensajes();
  }, [obtenerMensajes]);

  // ============================================================
  // MARCAR COMO LEÍDA AL ENTRAR
  // ============================================================

  useEffect(() => {
    if (!conversacionId) {
      return;
    }

    marcarComoLeida();

    // Solo queremos ejecutarlo cuando cambia la conversación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionId]);

  // ============================================================
  // SOCKET.IO
  // ============================================================

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    // ==========================================================
    // NUEVO MENSAJE
    // ==========================================================

    const handleNuevoMensaje = (data) => {
      if (Number(data?.conversacionId) !== conversacionId) {
        return;
      }

      const mensajeRecibido = data?.mensaje;

      if (!mensajeRecibido?.id) {
        return;
      }

      // ========================================================
      // AGREGAR SIN DUPLICAR
      // ========================================================

      setMensajes((mensajesActuales) => {
        const existe = mensajesActuales.some(
          (mensaje) => Number(mensaje.id) === Number(mensajeRecibido.id),
        );

        if (existe) {
          return mensajesActuales;
        }

        return [...mensajesActuales, mensajeRecibido];
      });

      // ========================================================
      // SCROLL
      // ========================================================

      setTimeout(() => {
        scrollAlFinal();
      }, 0);

      // ========================================================
      // SI EL MENSAJE ES AJENO Y EL CHAT ESTÁ ABIERTO,
      // MARCAR COMO LEÍDO
      // ========================================================

      if (Number(mensajeRecibido.usuario_id) !== usuarioActualId) {
        marcarComoLeida();
      }
    };

    // ==========================================================
    // LISTENER
    // ==========================================================

    socket.on("chat:mensaje:nuevo", handleNuevoMensaje);

    // ==========================================================
    // CLEANUP
    // ==========================================================

    return () => {
      socket.off("chat:mensaje:nuevo", handleNuevoMensaje);
    };
  }, [conversacionId, usuarioActualId, marcarComoLeida, scrollAlFinal]);

  // ============================================================
  // ENVIAR MENSAJE
  // ============================================================

  const enviarMensaje = async () => {
    const texto = nuevoMensaje.trim();

    if (!texto || enviando || !conversacionId) {
      return;
    }

    try {
      setEnviando(true);

      const response = await axios.post(
        `${apiUrl}/chat/conversaciones/${conversacionId}/mensajes`,
        {
          mensaje: texto,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const mensajeCreado = response.data?.mensaje;

      // ========================================================
      // AGREGAR RESPUESTA HTTP SIN DUPLICAR
      //
      // SOCKET.IO TAMBIÉN DEVUELVE EL MENSAJE AL EMISOR
      // ========================================================

      if (mensajeCreado?.id) {
        setMensajes((mensajesActuales) => {
          const existe = mensajesActuales.some(
            (mensaje) => Number(mensaje.id) === Number(mensajeCreado.id),
          );

          if (existe) {
            return mensajesActuales;
          }

          return [...mensajesActuales, mensajeCreado];
        });
      }

      setNuevoMensaje("");

      setTimeout(() => {
        scrollAlFinal();
      }, 0);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    } finally {
      setEnviando(false);
    }
  };

  // ============================================================
  // ABRIR INFORMACIÓN DEL GRUPO
  // ============================================================

  const handleOpenGroupInfo = () => {
    if (conversacion?.tipo !== "grupo") {
      return;
    }

    setVista("info");
  };

  // ============================================================
  // REGRESAR AL CHAT DESDE INFORMACIÓN
  // ============================================================

  const handleBackToChat = () => {
    setVista("chat");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f7f9fb",
      }}
    >
      {/* =====================================================
          INFORMACIÓN DEL GRUPO
      ===================================================== */}

      {vista === "info" && conversacion?.tipo === "grupo" ? (
        <GroupInfo
          conversacion={conversacion}
          usuarios={usuarios}
          loadingUsuarios={loadingUsuarios}
          obtenerUsuarios={obtenerUsuarios}
          onBack={handleBackToChat}
          onClose={onClose}
        />
      ) : (
        <>
          {/* =================================================
              HEADER DE CONVERSACIÓN
          ================================================= */}

          <ConversationHeader
            conversacion={conversacion}
            onBack={onBack}
            onClose={onClose}
            onOpenInfo={handleOpenGroupInfo}
          />

          {/* =================================================
              MENSAJES
          ================================================= */}

          <MessageList
            mensajes={mensajes}
            loading={loading}
            usuarioActualId={usuarioActualId}
            usuarioActual={user}
            mensajesEndRef={mensajesEndRef}
          />

          {/* =================================================
              INPUT
          ================================================= */}

          <MessageInput
            value={nuevoMensaje}
            enviando={enviando}
            onChange={setNuevoMensaje}
            onSend={enviarMensaje}
          />
        </>
      )}
    </Box>
  );
};

export default ChatWindow;
