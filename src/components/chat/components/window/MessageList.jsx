import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import MessageBubble from "./MessageBubble";

// ============================================================
// COMPONENTE
// ============================================================

const MessageList = ({
  mensajes,
  loading,
  usuarioActualId,
  usuarioActual,
  mensajesEndRef,
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,

        overflowY: "auto",

        px: 2,
        py: 2,

        backgroundColor: "#f7f9fb",
      }}
    >
      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <Box
          sx={{
            height: "100%",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : mensajes.length === 0 ? (
        // ====================================================
        // SIN MENSAJES
        // ====================================================

        <Box
          sx={{
            height: "100%",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            textAlign: "center",

            px: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily:
                  "Montserrat, sans-serif",

                fontWeight: 700,

                color: "#0f2744",
              }}
            >
              Aún no hay mensajes
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Envía el primer mensaje de esta conversación.
            </Typography>
          </Box>
        </Box>
      ) : (
        // ====================================================
        // MENSAJES
        // ====================================================

        mensajes.map((mensaje) => (
          <MessageBubble
            key={mensaje.id}
            mensaje={mensaje}
            usuarioActualId={usuarioActualId}
            usuarioActual={usuarioActual}
          />
        ))
      )}

      {/* ======================================================
          REFERENCIA DEL SCROLL
      ====================================================== */}

      <div ref={mensajesEndRef} />
    </Box>
  );
};

export default MessageList;