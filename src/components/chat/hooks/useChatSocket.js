import {
  useEffect,
} from "react";

import {
  onSocketDisponible,
} from "../../../services/socketService";

const useChatSocket = ({
  obtenerConversaciones,
  setUsuarios,

  conversaciones = [],
  chatSilenciado = false,

  usuarioId,
  conversacionSeleccionadaId,
}) => {
  useEffect(() => {
    let socketActual = null;

    // ============================================================
    // REPRODUCIR SONIDO
    // ============================================================

    const reproducirSonidoNotificacion = () => {
      try {
        const audio = new Audio(
          "/sounds/notification.mp3",
        );

        audio.volume = 0.45;

        audio.play().catch(() => {
          // El navegador puede bloquear el audio
          // hasta que exista interacción del usuario.
        });
      } catch (error) {
        console.error(
          "[Chat] Error reproduciendo sonido:",
          error,
        );
      }
    };

    // ============================================================
    // NUEVO MENSAJE
    // ============================================================

    const handleNuevoMensaje = (data) => {
      // Siempre actualizamos la lista.
      obtenerConversaciones();

      const conversacionId = Number(
        data?.conversacionId,
      );

      const mensaje = data?.mensaje;

      // ==========================================================
      // VALIDAR EVENTO
      // ==========================================================

      if (
        !conversacionId ||
        !mensaje
      ) {
        return;
      }

      // ==========================================================
      // NO SONAR PARA MENSAJES DEL SISTEMA
      // ==========================================================

      if (
        mensaje.tipo ===
        "sistema"
      ) {
        return;
      }

      // ==========================================================
      // NO SONAR PARA MIS PROPIOS MENSAJES
      // ==========================================================

      if (
        Number(
          mensaje.usuario_id,
        ) ===
        Number(usuarioId)
      ) {
        return;
      }

      // ==========================================================
      // SILENCIO GLOBAL
      // ==========================================================

      if (chatSilenciado) {
        return;
      }

      // ==========================================================
      // NO SONAR SI ESTOY VIENDO ESA CONVERSACIÓN
      // ==========================================================

      if (
        Number(
          conversacionSeleccionadaId,
        ) ===
        conversacionId
      ) {
        return;
      }

      // ==========================================================
      // BUSCAR CONVERSACIÓN
      // ==========================================================

      const conversacion =
        conversaciones.find(
          (item) =>
            Number(item.id) ===
            conversacionId,
        );

      // ==========================================================
      // VERIFICAR SI ESA CONVERSACIÓN ESTÁ SILENCIADA
      // ==========================================================

      const estaSilenciada =
        Number(
          conversacion?.silenciado,
        ) === 1 ||
        conversacion?.silenciado === true;

      if (estaSilenciada) {
        return;
      }

      // ==========================================================
      // REPRODUCIR NOTIFICACIÓN
      // ==========================================================

      reproducirSonidoNotificacion();
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
      usuarioId:
        usuarioPresenciaId,
      conectado,
    }) => {
      setUsuarios(
        (usuariosActuales) =>
          usuariosActuales.map(
            (usuario) =>
              Number(
                usuario.id_usuario,
              ) ===
              Number(
                usuarioPresenciaId,
              )
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
    conversaciones,
    chatSilenciado,
    usuarioId,
    conversacionSeleccionadaId,
  ]);
};

export default useChatSocket;