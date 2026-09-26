import {
  Avatar,
  Box,
  CircularProgress,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import GroupsIcon from "@mui/icons-material/Groups";

// ============================================================
// HELPERS
// ============================================================

const obtenerNombreConversacion = (
  conversacion
) => {
  if (conversacion.tipo === "directa") {
    return (
      conversacion.otro_usuario_nombre ||
      conversacion.nombre ||
      "Conversación directa"
    );
  }

  return (
    conversacion.nombre ||
    "Conversación"
  );
};

const obtenerIcono = (
  conversacion
) => {
  if (conversacion.tipo === "directa") {
    return <PersonIcon />;
  }

  if (conversacion.tipo === "rol") {
    return <GroupsIcon />;
  }

  return <GroupIcon />;
};

const obtenerUltimoMensaje = (
  conversacion
) => {
  if (!conversacion.ultimo_mensaje) {
    return "Sin mensajes todavía";
  }

  return conversacion.ultimo_mensaje;
};

// ============================================================
// COMPONENTE
// ============================================================

const ConversationList = ({
  conversaciones = [],
  loading = false,
  onOpen,
}) => {
  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          py: 5,

          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ==========================================================
  // SIN CONVERSACIONES
  // ==========================================================

  if (conversaciones.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          px: 3,
          py: 5,

          textAlign: "center",
        }}
      >
        <Typography
          color="text.secondary"
        >
          No hay conversaciones.
        </Typography>
      </Box>
    );
  }

  // ==========================================================
  // LISTADO
  // ==========================================================

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
      }}
    >
      <List disablePadding>
        {conversaciones.map(
          (conversacion) => {
            const noLeidos = Number(
              conversacion.mensajes_no_leidos ||
                0
            );

            const tieneNoLeidos =
              noLeidos > 0;

            return (
              <ListItemButton
                key={conversacion.id}
                onClick={() =>
                  onOpen?.(conversacion)
                }
                sx={{
                  px: 2.5,
                  py: 1.5,

                  backgroundColor:
                    tieneNoLeidos
                      ? "#F0F7FD"
                      : "transparent",

                  borderLeft:
                    tieneNoLeidos
                      ? "4px solid #2389dc"
                      : "4px solid transparent",

                  transition:
                    "background-color 0.2s ease",

                  "&:hover": {
                    backgroundColor:
                      tieneNoLeidos
                        ? "#E5F2FC"
                        : "rgba(15, 95, 143, 0.06)",
                  },
                }}
              >
                {/* ===========================================
                    AVATAR
                =========================================== */}

                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,

                      backgroundColor:
                        tieneNoLeidos
                          ? "#2389dc"
                          : "#9fb4bf",

                      color: "#ffffff",
                    }}
                  >
                    {obtenerIcono(
                      conversacion
                    )}
                  </Avatar>
                </ListItemAvatar>

                {/* ===========================================
                    NOMBRE + ÚLTIMO MENSAJE
                =========================================== */}

                <ListItemText
                  sx={{
                    mr: 1,
                    minWidth: 0,
                  }}
                  primary={obtenerNombreConversacion(
                    conversacion
                  )}
                  secondary={obtenerUltimoMensaje(
                    conversacion
                  )}
                  primaryTypographyProps={{
                    fontFamily:
                      "Montserrat, sans-serif",

                    fontWeight:
                      tieneNoLeidos
                        ? 800
                        : 600,

                    color:
                      tieneNoLeidos
                        ? "#0f2744"
                        : "#263238",

                    noWrap: true,
                  }}
                  secondaryTypographyProps={{
                    noWrap: true,

                    fontWeight:
                      tieneNoLeidos
                        ? 600
                        : 400,

                    color:
                      tieneNoLeidos
                        ? "#455a64"
                        : "text.secondary",
                  }}
                />

                {/* ===========================================
                    CONTADOR DE NO LEÍDOS
                =========================================== */}

                {tieneNoLeidos && (
                  <Box
                    sx={{
                      minWidth: 24,
                      height: 24,

                      px: 0.7,

                      borderRadius: "12px",

                      backgroundColor:
                        "#2389dc",

                      color: "#ffffff",

                      display: "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      flexShrink: 0,

                      fontFamily:
                        "Montserrat, sans-serif",

                      fontSize: 11,

                      fontWeight: 800,

                      boxShadow:
                        "0 2px 5px rgba(35, 137, 220, 0.25)",
                    }}
                  >
                    {noLeidos > 99
                      ? "99+"
                      : noLeidos}
                  </Box>
                )}
              </ListItemButton>
            );
          }
        )}
      </List>
    </Box>
  );
};

export default ConversationList;