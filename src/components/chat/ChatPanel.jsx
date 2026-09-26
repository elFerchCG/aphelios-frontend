import { Drawer } from "@mui/material";

import { useEffect, useMemo, useState } from "react";

import axios from "axios";

import useAuthStore from "../../store/authStore";

import ChatWindow from "./ChatWindow";

// ============================================================
// COMPONENTES
// ============================================================

import ChatHeader from "./components/ChatHeader";
import ChatSearch from "./components/ChatSearch";
import ChatActions from "./components/ChatActions";
import ChatNotice from "./components/ChatNotice";
import ConversationList from "./components/ConversationList";
import UserList from "./components/UserList";
import CreateGroup from "./components/CreateGroup";

// ============================================================
// HOOKS
// ============================================================

import useChatConversations from "./hooks/useChatConversations";
import useChatUsers from "./hooks/useChatUsers";
import useChatSocket from "./hooks/useChatSocket";

const ChatPanel = ({ open, onClose }) => {
  const { token, user } = useAuthStore();

  // ============================================================
  // API
  // ============================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ============================================================
  // PERMISOS
  // ============================================================

  const esAdministrador =
    (user?.rol_descripcion || user?.rol || "").trim().toLowerCase() ===
    "administrador";

  // ============================================================
  // CONVERSACIONES
  // ============================================================

  const {
    conversaciones,
    loading,
    obtenerConversaciones,
    marcarConversacionLeida,
  } = useChatConversations(token);

  // ============================================================
  // USUARIOS
  // ============================================================

  const { usuarios, setUsuarios, loadingUsuarios, obtenerUsuarios } =
    useChatUsers(token);

  // ============================================================
  // SOCKET.IO
  // ============================================================

  useChatSocket({
    obtenerConversaciones,
    setUsuarios,
  });

  // ============================================================
  // ESTADOS DEL PANEL
  // ============================================================

  const [creandoConversacion, setCreandoConversacion] = useState(false);

  const [busqueda, setBusqueda] = useState("");

  const [busquedaUsuario, setBusquedaUsuario] = useState("");

  const [conversacionSeleccionada, setConversacionSeleccionada] =
    useState(null);

  // conversaciones | usuarios | crearGrupo
  const [vista, setVista] = useState("conversaciones");

  // ============================================================
  // ESTADOS PARA CREAR GRUPO
  // ============================================================

  const [nombreGrupo, setNombreGrupo] = useState("");

  const [busquedaGrupo, setBusquedaGrupo] = useState("");

  const [participantesGrupo, setParticipantesGrupo] = useState([]);

  const [creandoGrupo, setCreandoGrupo] = useState(false);

  // ============================================================
  // CARGAR CONVERSACIONES AL ABRIR
  // ============================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    obtenerConversaciones();
  }, [open, obtenerConversaciones]);

  // ============================================================
  // NOMBRE DE CONVERSACIÓN
  // ============================================================

  const obtenerNombreConversacion = (conversacion) => {
    if (conversacion.tipo === "directa") {
      return (
        conversacion.otro_usuario_nombre ||
        conversacion.nombre ||
        "Conversación directa"
      );
    }

    return conversacion.nombre || "Conversación";
  };

  // ============================================================
  // FILTRAR CONVERSACIONES
  // ============================================================

  const conversacionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return conversaciones;
    }

    return conversaciones.filter((conversacion) => {
      const nombre = obtenerNombreConversacion(conversacion).toLowerCase();

      const ultimoMensaje = (conversacion.ultimo_mensaje || "").toLowerCase();

      return nombre.includes(texto) || ultimoMensaje.includes(texto);
    });
  }, [conversaciones, busqueda]);

  // ============================================================
  // FILTRAR USUARIOS
  // ============================================================

  const usuariosFiltrados = useMemo(() => {
    const texto = busquedaUsuario.trim().toLowerCase();

    const lista = !texto
      ? usuarios
      : usuarios.filter((usuario) => {
          const nombre = (usuario.nombre || "").toLowerCase();

          const rol = (usuario.rol_descripcion || "").toLowerCase();

          return nombre.includes(texto) || rol.includes(texto);
        });

    // ========================================================
    // USUARIOS ONLINE PRIMERO
    // ========================================================

    return [...lista].sort((a, b) => {
      if (Boolean(a.conectado) !== Boolean(b.conectado)) {
        return a.conectado ? -1 : 1;
      }

      return (a.nombre || "").localeCompare(b.nombre || "", "es", {
        sensitivity: "base",
      });
    });
  }, [usuarios, busquedaUsuario]);

  // ============================================================
  // FILTRAR USUARIOS PARA GRUPO
  // ============================================================

  const usuariosGrupoFiltrados = useMemo(() => {
    const texto = busquedaGrupo.trim().toLowerCase();

    const lista = !texto
      ? usuarios
      : usuarios.filter((usuario) => {
          const nombre = (usuario.nombre || "").toLowerCase();

          const rol = (usuario.rol_descripcion || "").toLowerCase();

          return nombre.includes(texto) || rol.includes(texto);
        });

    return [...lista].sort((a, b) => {
      if (Boolean(a.conectado) !== Boolean(b.conectado)) {
        return a.conectado ? -1 : 1;
      }

      return (a.nombre || "").localeCompare(b.nombre || "", "es", {
        sensitivity: "base",
      });
    });
  }, [usuarios, busquedaGrupo]);

  // ============================================================
  // ABRIR CONVERSACIÓN
  // ============================================================

  const handleAbrirConversacion = (conversacion) => {
    setConversacionSeleccionada(conversacion);
  };

  // ============================================================
  // NUEVO CHAT
  // ============================================================

  const handleNuevoChat = async () => {
    setBusquedaUsuario("");

    setVista("usuarios");

    await obtenerUsuarios();
  };

  // ============================================================
  // SELECCIONAR USUARIO
  // ============================================================

  const handleSeleccionarUsuario = async (usuario) => {
    if (creandoConversacion) {
      return;
    }

    try {
      setCreandoConversacion(true);

      // ======================================================
      // CREAR U OBTENER CONVERSACIÓN DIRECTA
      // ======================================================

      await axios.post(
        `${apiUrl}/chat/conversaciones/directa`,
        {
          usuarioDestinoId: usuario.id_usuario,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // ======================================================
      // RECARGAR CONVERSACIONES
      // ======================================================

      const lista = await obtenerConversaciones();

      // ======================================================
      // ENCONTRAR CONVERSACIÓN DIRECTA
      // ======================================================

      const conversacion = lista.find(
        (item) =>
          item.tipo === "directa" &&
          Number(item.otro_usuario_id) === Number(usuario.id_usuario),
      );

      if (!conversacion) {
        console.error("No se encontró la conversación directa recién creada.");

        return;
      }

      // ======================================================
      // ABRIR CONVERSACIÓN
      // ======================================================

      setVista("conversaciones");

      setBusquedaUsuario("");

      setConversacionSeleccionada(conversacion);
    } catch (error) {
      console.error("Error abriendo conversación directa:", error);
    } finally {
      setCreandoConversacion(false);
    }
  };

  // ============================================================
  // NUEVO GRUPO
  // ============================================================

  const handleNuevoGrupo = async () => {
    if (!esAdministrador) {
      return;
    }

    setNombreGrupo("");
    setBusquedaGrupo("");
    setParticipantesGrupo([]);

    setVista("crearGrupo");

    await obtenerUsuarios();
  };

  // ============================================================
  // SELECCIONAR / QUITAR PARTICIPANTE
  // ============================================================

  const handleToggleParticipanteGrupo = (usuarioId) => {
    const id = Number(usuarioId);

    setParticipantesGrupo((actuales) => {
      const existe = actuales.some((item) => Number(item) === id);

      if (existe) {
        return actuales.filter((item) => Number(item) !== id);
      }

      return [...actuales, id];
    });
  };

  // ============================================================
  // CREAR GRUPO
  // ============================================================

  const handleCrearGrupo = async () => {
    if (!esAdministrador) {
      return;
    }

    if (creandoGrupo) {
      return;
    }

    const nombre = nombreGrupo.trim();

    if (!nombre || participantesGrupo.length === 0) {
      return;
    }

    try {
      setCreandoGrupo(true);

      // ======================================================
      // CREAR GRUPO
      // ======================================================

      const response = await axios.post(
        `${apiUrl}/chat/conversaciones/grupo`,
        {
          nombre,
          participantes: participantesGrupo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const conversacionId = response.data?.conversacion?.id;

      // ======================================================
      // RECARGAR CONVERSACIONES
      // ======================================================

      const lista = await obtenerConversaciones();

      // ======================================================
      // ENCONTRAR EL GRUPO CREADO
      // ======================================================

      const conversacion = lista.find(
        (item) => Number(item.id) === Number(conversacionId),
      );

      if (!conversacion) {
        console.error(
          "El grupo fue creado, pero no se encontró en la lista de conversaciones.",
        );

        setVista("conversaciones");

        return;
      }

      // ======================================================
      // LIMPIAR
      // ======================================================

      setNombreGrupo("");
      setBusquedaGrupo("");
      setParticipantesGrupo([]);

      setVista("conversaciones");

      // ======================================================
      // ABRIR GRUPO
      // ======================================================

      setConversacionSeleccionada(conversacion);
    } catch (error) {
      console.error("Error creando grupo:", error);
    } finally {
      setCreandoGrupo(false);
    }
  };

  // ============================================================
  // REGRESAR DESDE USUARIOS
  // ============================================================

  const handleRegresarConversaciones = () => {
    setVista("conversaciones");

    setBusquedaUsuario("");
  };

  // ============================================================
  // REGRESAR DESDE CREAR GRUPO
  // ============================================================

  const handleRegresarGrupo = () => {
    if (creandoGrupo) {
      return;
    }

    setVista("conversaciones");

    setNombreGrupo("");
    setBusquedaGrupo("");
    setParticipantesGrupo([]);
  };

  // ============================================================
  // REGRESAR DESDE CHAT WINDOW
  // ============================================================

  const handleRegresar = () => {
    setConversacionSeleccionada(null);

    setVista("conversaciones");

    obtenerConversaciones();
  };

  // ============================================================
  // CERRAR PANEL
  // ============================================================

  const handleClose = () => {
    setConversacionSeleccionada(null);

    setVista("conversaciones");

    setBusqueda("");
    setBusquedaUsuario("");

    setNombreGrupo("");
    setBusquedaGrupo("");
    setParticipantesGrupo([]);

    onClose();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: {
            xs: "100%",
            sm: 420,
          },

          maxWidth: "100vw",

          display: "flex",

          flexDirection: "column",
        },
      }}
    >
      {/* =====================================================
          CONVERSACIÓN ABIERTA
      ===================================================== */}

      {conversacionSeleccionada ? (
        <ChatWindow
          conversacion={conversacionSeleccionada}
          onBack={handleRegresar}
          onClose={handleClose}
          onLeido={marcarConversacionLeida}
          usuarios={usuarios}
          loadingUsuarios={loadingUsuarios}
          obtenerUsuarios={obtenerUsuarios}
        />
      ) : vista === "usuarios" ? (
        /* ====================================================
           NUEVO CHAT
        ==================================================== */

        <UserList
          usuarios={usuariosFiltrados}
          loading={loadingUsuarios}
          busqueda={busquedaUsuario}
          onBusquedaChange={setBusquedaUsuario}
          onBack={handleRegresarConversaciones}
          onClose={handleClose}
          onSelect={handleSeleccionarUsuario}
          disabled={creandoConversacion}
        />
      ) : vista === "crearGrupo" ? (
        /* ====================================================
           NUEVO GRUPO
        ==================================================== */

        <CreateGroup
          usuarios={usuariosGrupoFiltrados}
          loading={loadingUsuarios}
          creando={creandoGrupo}
          nombre={nombreGrupo}
          onNombreChange={setNombreGrupo}
          busqueda={busquedaGrupo}
          onBusquedaChange={setBusquedaGrupo}
          seleccionados={participantesGrupo}
          onToggleUsuario={handleToggleParticipanteGrupo}
          onBack={handleRegresarGrupo}
          onClose={handleClose}
          onCreate={handleCrearGrupo}
        />
      ) : (
        /* ====================================================
           LISTA DE CONVERSACIONES
        ==================================================== */

        <>
          <ChatHeader onClose={handleClose} />

          <ChatSearch value={busqueda} onChange={setBusqueda} />

          <ChatActions
            onNuevoChat={handleNuevoChat}
            onNuevoGrupo={handleNuevoGrupo}
            puedeCrearGrupos={esAdministrador}
          />

          <ChatNotice />

          <ConversationList
            conversaciones={conversacionesFiltradas}
            loading={loading}
            onOpen={handleAbrirConversacion}
          />
        </>
      )}
    </Drawer>
  );
};

export default ChatPanel;
