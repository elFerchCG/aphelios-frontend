import {
  useEffect,
} from "react";

import {
  onSocketDisponible,
} from "../../../services/socketService";

const useChatSocket = ({
  obtenerConversaciones,
  setUsuarios,
}) => {
  useEffect(() => {
    let socketActual = null;

    // ============================================================
    // NUEVO MENSAJE
    // ============================================================

    const handleNuevoMensaje = () => {
      obtenerConversaciones();
    };

    // ============================================================
    // NUEVA CONVERSACIÓN
    // ============================================================

    const handleNuevaConversacion = (
      data,
    ) => {
      console.log(
        "[Chat] Nueva conversación:",
        data,
      );

      obtenerConversaciones();
    };

    // ============================================================
    // CONVERSACIÓN ACTUALIZADA
    // ============================================================

    const handleConversacionActualizada = (
      data,
    ) => {
      console.log(
        "[Chat] Conversación actualizada:",
        data,
      );

      obtenerConversaciones();
    };

    // ============================================================
    // CONVERSACIÓN ELIMINADA / USUARIO RETIRADO
    // ============================================================

    const handleConversacionEliminada = (
      data,
    ) => {
      console.log(
        "[Chat] Conversación eliminada:",
        data,
      );

      obtenerConversaciones();
    };

    // ============================================================
    // LISTA INICIAL DE USUARIOS CONECTADOS
    // ============================================================

    const handleUsuariosConectados = ({
      usuarios: conectados = [],
    }) => {
      const idsConectados =
        new Set(
          conectados.map(Number),
        );

      setUsuarios(
        (usuariosActuales) =>
          usuariosActuales.map(
            (usuario) => ({
              ...usuario,

              conectado:
                idsConectados.has(
                  Number(
                    usuario.id_usuario,
                  ),
                ),
            }),
          ),
      );
    };

    // ============================================================
    // CAMBIO DE PRESENCIA
    // ============================================================

    const handlePresencia = ({
      usuarioId,
      conectado,
    }) => {
      setUsuarios(
        (usuariosActuales) =>
          usuariosActuales.map(
            (usuario) =>
              Number(
                usuario.id_usuario,
              ) ===
              Number(usuarioId)
                ? {
                    ...usuario,

                    conectado:
                      Boolean(
                        conectado,
                      ),
                  }
                : usuario,
          ),
      );
    };

    // ============================================================
    // REGISTRAR LISTENERS
    // ============================================================

    const registrarListeners = (
      socket,
    ) => {
      if (
        socketActual === socket
      ) {
        return;
      }

      // ==========================================================
      // LIMPIAR SOCKET ANTERIOR
      // ==========================================================

      if (socketActual) {
        socketActual.off(
          "chat:mensaje:nuevo",
          handleNuevoMensaje,
        );

        socketActual.off(
          "chat:conversacion:nueva",
          handleNuevaConversacion,
        );

        socketActual.off(
          "chat:conversacion:actualizada",
          handleConversacionActualizada,
        );

        socketActual.off(
          "chat:conversacion:eliminada",
          handleConversacionEliminada,
        );

        socketActual.off(
          "chat:usuarios-conectados",
          handleUsuariosConectados,
        );

        socketActual.off(
          "chat:presencia",
          handlePresencia,
        );
      }

      socketActual = socket;

      // ==========================================================
      // REGISTRAR SOCKET ACTUAL
      // ==========================================================

      socketActual.on(
        "chat:mensaje:nuevo",
        handleNuevoMensaje,
      );

      socketActual.on(
        "chat:conversacion:nueva",
        handleNuevaConversacion,
      );

      socketActual.on(
        "chat:conversacion:actualizada",
        handleConversacionActualizada,
      );

      socketActual.on(
        "chat:conversacion:eliminada",
        handleConversacionEliminada,
      );

      socketActual.on(
        "chat:usuarios-conectados",
        handleUsuariosConectados,
      );

      socketActual.on(
        "chat:presencia",
        handlePresencia,
      );

      console.log(
        "[Chat] Listeners Socket.IO registrados",
      );
    };

    // ============================================================
    // ESPERAR SOCKET DISPONIBLE
    // ============================================================

    const unsubscribe =
      onSocketDisponible(
        registrarListeners,
      );

    // ============================================================
    // CLEANUP
    // ============================================================

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

        socketActual.off(
          "chat:conversacion:actualizada",
          handleConversacionActualizada,
        );

        socketActual.off(
          "chat:conversacion:eliminada",
          handleConversacionEliminada,
        );

        socketActual.off(
          "chat:usuarios-conectados",
          handleUsuariosConectados,
        );

        socketActual.off(
          "chat:presencia",
          handlePresencia,
        );
      }
    };
  }, [
    obtenerConversaciones,
    setUsuarios,
  ]);
};

export default useChatSocket;