import {
  Avatar,
  Box,
  Typography,
} from "@mui/material";

import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";

// ============================================================
// COMPONENTE
// ============================================================

const MessageBubble = ({
  mensaje,
  usuarioActualId,
  usuarioActual,
  tipoConversacion,
}) => {
  // ============================================================
  // TIPO DE MENSAJE
  // ============================================================

  const esMio =
    Number(mensaje?.usuario_id) ===
    Number(usuarioActualId);

  const esSistema =
    mensaje?.tipo === "sistema";

  const esConversacionDirecta =
    tipoConversacion === "directa";

  const fueLeido =
    Number(mensaje?.leido) === 1 ||
    mensaje?.leido === true;

  // ============================================================
  // INICIALES
  // ============================================================

  const obtenerIniciales = (nombre) => {
    if (!nombre) {
      return "U";
    }

    const partes = nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (partes.length === 0) {
      return "U";
    }

    if (partes.length === 1) {
      return partes[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      partes[0][0] +
      partes[1][0]
    ).toUpperCase();
  };

  // ============================================================
  // FORMATEAR HORA
  // ============================================================

  const formatearHora = (fecha) => {
    if (!fecha) {
      return "";
    }

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString(
      "es-MX",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  // ============================================================
  // RENDERIZAR TEXTO CON EMOJIS MÁS GRANDES
  // ============================================================

  const renderizarMensaje = (
    texto = "",
  ) => {
    const partes = texto.split(
      /(\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*)/gu,
    );

    return partes.map(
      (parte, index) => {
        const esEmoji =
          /\p{Extended_Pictographic}/u.test(
            parte,
          );

        // ======================================================
        // EMOJI
        // ======================================================

        if (esEmoji) {
          return (
            <Box
              key={index}
              component="span"
              sx={{
                fontSize: "19px",

                lineHeight: 1,

                verticalAlign: "-2px",
              }}
            >
              {parte}
            </Box>
          );
        }

        // ======================================================
        // TEXTO NORMAL
        // ======================================================

        return parte;
      },
    );
  };

  // ============================================================
  // MENSAJE DEL SISTEMA
  // ============================================================

  if (esSistema) {
    return (
      <Box
        sx={{
          display: "flex",

          justifyContent:
            "center",

          my: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            py: 0.7,

            borderRadius: 2,

            backgroundColor:
              "rgba(15, 39, 68, 0.06)",

            color: "#607d8b",

            textAlign: "center",
          }}
        >
          {mensaje.mensaje}
        </Typography>
      </Box>
    );
  }

  // ============================================================
  // MENSAJE NORMAL
  // ============================================================

  return (
    <Box
      sx={{
        width: "100%",

        display: "flex",

        // ======================================================
        // PROPIO = DERECHA
        // AJENO = IZQUIERDA
        // ======================================================

        justifyContent:
          esMio
            ? "flex-end"
            : "flex-start",

        mb: 1.8,
      }}
    >
      {/* ======================================================
          AVATAR + MENSAJE
      ====================================================== */}

      <Box
        sx={{
          display: "flex",

          flexDirection:
            esMio
              ? "row-reverse"
              : "row",

          alignItems: "flex-end",

          gap: 1,

          maxWidth: "82%",
        }}
      >
        {/* ====================================================
            AVATAR
        ==================================================== */}

        <Avatar
          sx={{
            width: 34,
            height: 34,

            flexShrink: 0,

            fontFamily:
              "Montserrat, sans-serif",

            fontWeight: 700,

            fontSize: 11,

            backgroundColor:
              esMio
                ? "#2389dc"
                : "#9fb4bf",

            color: "#ffffff",
          }}
        >
          {obtenerIniciales(
            esMio
              ? usuarioActual?.nombre
              : mensaje.usuario_nombre,
          )}
        </Avatar>

        {/* ====================================================
            CONTENIDO
        ==================================================== */}

        <Box
          sx={{
            minWidth: 60,

            display: "flex",

            flexDirection:
              "column",

            alignItems:
              esMio
                ? "flex-end"
                : "flex-start",
          }}
        >
          {/* ==================================================
              REMITENTE
          ================================================== */}

          <Typography
            variant="caption"
            sx={{
              mb: 0.35,

              px: 0.7,

              fontFamily:
                "Montserrat, sans-serif",

              fontWeight: 700,

              fontSize: 11,

              color:
                esMio
                  ? "#1565a8"
                  : "#607d8b",

              textAlign:
                esMio
                  ? "right"
                  : "left",
            }}
          >
            {esMio
              ? "Tú"
              : mensaje.usuario_nombre ||
                "Usuario"}
          </Typography>

          {/* ==================================================
              BURBUJA
          ================================================== */}

          <Box
            sx={{
              px: 1.6,
              py: 1.05,

              minWidth: 80,
              maxWidth: "100%",

              borderRadius:
                esMio
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",

              backgroundColor:
                esMio
                  ? "#DCEEFE"
                  : "#FFFFFF",

              color: "#263238",

              border:
                esMio
                  ? "1px solid rgba(21, 101, 168, 0.10)"
                  : "1px solid rgba(0, 0, 0, 0.05)",

              boxShadow:
                "0 1px 3px rgba(0,0,0,0.10)",
            }}
          >
            {/* ================================================
                TEXTO
            ================================================ */}

            <Typography
              variant="body2"
              component="div"
              sx={{
                whiteSpace:
                  "pre-wrap",

                overflowWrap:
                  "anywhere",

                lineHeight: 1.45,

                fontFamily:
                  "Montserrat, sans-serif",

                fontSize: 13.5,
              }}
            >
              {renderizarMensaje(
                mensaje.mensaje,
              )}
            </Typography>

            {/* ================================================
                HORA + ESTADO DE LECTURA
            ================================================ */}

            <Box
              sx={{
                display: "flex",

                alignItems: "center",

                justifyContent:
                  "flex-end",

                gap: 0.35,

                mt: 0.45,

                minHeight: 14,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color:
                    "#607d8b",

                  fontSize: 10,

                  lineHeight: 1.2,
                }}
              >
                {formatearHora(
                  mensaje.fecha_creacion,
                )}
              </Typography>

              {/* ==============================================
                  CHECK DE LECTURA

                  ✓  = enviado
                  ✓✓ = leído

                  Solo aplica a mensajes propios
                  en conversaciones directas.
              ============================================== */}

              {esMio &&
                esConversacionDirecta && (
                  <Box
                    title={
                      fueLeido
                        ? "Leído"
                        : "Enviado"
                    }
                    sx={{
                      height: 14,

                      display: "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      color:
                        fueLeido
                          ? "#2389dc"
                          : "#78909c",
                    }}
                  >
                    {fueLeido ? (
                      <DoneAllIcon
                        sx={{
                          fontSize: 16,
                        }}
                      />
                    ) : (
                      <DoneIcon
                        sx={{
                          fontSize: 15,
                        }}
                      />
                    )}
                  </Box>
                )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageBubble;