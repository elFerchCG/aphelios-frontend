import { io } from "socket.io-client";

let socket = null;

// Componentes esperando a que exista el socket.
const socketSubscribers =
  new Set();

const getApiUrl = () => {
  return process.env
    .REACT_APP_API_URL_LOCAL;
};

// ============================================================
// AVISAR QUE YA EXISTE SOCKET
// ============================================================

const notificarSocketDisponible =
  () => {
    if (!socket) {
      return;
    }

    socketSubscribers.forEach(
      (callback) => {
        try {
          callback(socket);
        } catch (error) {
          console.error(
            "[Socket.IO] Error notificando socket:",
            error
          );
        }
      }
    );
  };

// ============================================================
// CONECTAR
// ============================================================

export const conectarSocket = (
  token
) => {
  if (!token) {
    console.warn(
      "[Socket.IO] No se puede conectar sin token."
    );

    return null;
  }

  // ==========================================================
  // YA EXISTE
  // ==========================================================

  if (socket) {
    // Actualizamos el token por si cambió.
    socket.auth = {
      token,
    };

    if (!socket.connected) {
      socket.connect();
    }

    // Importante:
    // aunque esté conectando, la instancia ya existe.
    notificarSocketDisponible();

    return socket;
  }

  // ==========================================================
  // CREAR SOCKET
  // ==========================================================

  const socketUrl =
    getApiUrl();

  socket = io(
    socketUrl,
    {
      auth: {
        token,
      },

      transports: [
        "websocket",
      ],

      autoConnect: true,

      reconnection: true,

      reconnectionAttempts:
        Infinity,

      reconnectionDelay:
        1000,

      reconnectionDelayMax:
        5000,
    }
  );

  // ==========================================================
  // AVISAR INMEDIATAMENTE
  //
  // No necesitamos esperar al evento "connect".
  // Los componentes ya pueden registrar listeners.
  // ==========================================================

  notificarSocketDisponible();

  // ==========================================================
  // EVENTOS GENERALES
  // ==========================================================

  socket.on(
    "connect",
    () => {
      console.log(
        `[Socket.IO] Conectado: ${socket.id}`
      );
    }
  );

  socket.on(
    "chat:ready",
    (data) => {
      // console.log(
      //   "[Socket.IO] Chat listo:",
      //   data
      // );
    }
  );

  socket.on(
    "connect_error",
    (error) => {
      console.error(
        "[Socket.IO] Error de conexión:",
        error.message
      );
    }
  );

  socket.on(
    "disconnect",
    (reason) => {
      console.log(
        "[Socket.IO] Desconectado:",
        reason
      );
    }
  );

  return socket;
};

// ============================================================
// SUSCRIBIRSE A DISPONIBILIDAD DEL SOCKET
// ============================================================

export const onSocketDisponible = (
  callback
) => {
  if (
    typeof callback !==
    "function"
  ) {
    return () => {};
  }

  socketSubscribers.add(
    callback
  );

  // Si el socket ya existe,
  // ejecutamos inmediatamente.
  if (socket) {
    callback(socket);
  }

  // Cleanup para React.
  return () => {
    socketSubscribers.delete(
      callback
    );
  };
};

// ============================================================
// DESCONECTAR
// ============================================================

export const desconectarSocket =
  () => {
    if (!socket) {
      return;
    }

    socket.removeAllListeners();

    socket.disconnect();

    socket = null;
  };

// ============================================================
// OBTENER SOCKET ACTUAL
// ============================================================

export const getSocket = () => {
  return socket;
};