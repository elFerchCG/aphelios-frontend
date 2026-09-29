import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import GroupsIcon from "@mui/icons-material/Groups";

import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import PushPinIcon from "@mui/icons-material/PushPin";

import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import VolumeOffOutlinedIcon from "@mui/icons-material/VolumeOffOutlined";

// ============================================================
// HELPERS
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

const obtenerIcono = (conversacion) => {
  if (conversacion.tipo === "directa") {
    return <PersonIcon />;
  }

  if (conversacion.tipo === "rol") {
    return <GroupsIcon />;
  }

  return <GroupIcon />;
};

const obtenerUltimoMensaje = (conversacion) => {
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
  usuarios = [],
  loading = false,
  onOpen,
  onToggleAnclada,
  onToggleSilenciada,
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
        <Typography color="text.secondary">
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
        {conversaciones.map((conversacion) => {
          const noLeidos = Number(
            conversacion.mensajes_no_leidos || 0,
          );

          const tieneNoLeidos = noLeidos > 0;

          // ====================================================
          // CONVERSACIÓN ANCLADA
          // ====================================================

          const estaAnclada =
            Number(conversacion.anclada) === 1 ||
            conversacion.anclada === true;

          // ====================================================
          // CONVERSACIÓN SILENCIADA
          // ====================================================

          const estaSilenciada =
            Number(conversacion.silenciado) === 1 ||
            conversacion.silenciado === true;

          // ====================================================
          // PRESENCIA
          // ====================================================

          const esDirecta =
            conversacion.tipo === "directa";

          const otroUsuario = esDirecta
            ? usuarios.find(
                (usuario) =>
                  Number(usuario.id_usuario) ===
                  Number(
                    conversacion.otro_usuario_id,
                  ),
              )
            : null;

          const estaConectado = Boolean(
            otroUsuario?.conectado,
          );

          return (
            <ListItemButton
              key={conversacion.id}
              onClick={() =>
                onOpen?.(conversacion)
              }
              sx={{
                px: 2.5,
                py: 1.5,

                backgroundColor: tieneNoLeidos
                  ? "#F0F7FD"
                  : "transparent",

                borderLeft: tieneNoLeidos
                  ? "4px solid #2389dc"
                  : "4px solid transparent",

                transition:
                  "background-color 0.2s ease",

                "&:hover": {
                  backgroundColor: tieneNoLeidos
                    ? "#E5F2FC"
                    : "rgba(15, 95, 143, 0.06)",

                  "& .chat-pin-button": {
                    opacity: 1,
                  },

                  "& .chat-sound-button": {
                    opacity: 1,
                  },
                },
              }}
            >
              {/* ===========================================
                  AVATAR
              =========================================== */}

              <ListItemAvatar>
                <Box
                  sx={{
                    position: "relative",
                    width: 42,
                    height: 42,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,

                      backgroundColor: tieneNoLeidos
                        ? "#2389dc"
                        : "#9fb4bf",

                      color: "#ffffff",
                    }}
                  >
                    {obtenerIcono(conversacion)}
                  </Avatar>

                  {/* =======================================
                      ESTADO DE CONEXIÓN
                  ======================================= */}

                  {esDirecta && (
                    <Box
                      title={
                        estaConectado
                          ? "En línea"
                          : "Desconectado"
                      }
                      sx={{
                        position: "absolute",

                        right: -1,
                        bottom: -1,

                        width: 13,
                        height: 13,

                        borderRadius: "50%",

                        backgroundColor:
                          estaConectado
                            ? "#2e7d32"
                            : "#9e9e9e",

                        border:
                          "2px solid #ffffff",

                        boxSizing: "border-box",

                        boxShadow:
                          "0 1px 3px rgba(0, 0, 0, 0.18)",
                      }}
                    />
                  )}
                </Box>
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
                  conversacion,
                )}
                secondary={obtenerUltimoMensaje(
                  conversacion,
                )}
                primaryTypographyProps={{
                  fontFamily:
                    "Montserrat, sans-serif",

                  fontWeight: tieneNoLeidos
                    ? 800
                    : 600,

                  color: tieneNoLeidos
                    ? "#0f2744"
                    : "#263238",

                  noWrap: true,
                }}
                secondaryTypographyProps={{
                  noWrap: true,

                  fontWeight: tieneNoLeidos
                    ? 600
                    : 400,

                  color: tieneNoLeidos
                    ? "#455a64"
                    : "text.secondary",
                }}
              />

              {/* ===========================================
                  SILENCIAR / ACTIVAR SONIDO
              =========================================== */}

              <Tooltip
                title={
                  estaSilenciada
                    ? "Activar sonido"
                    : "Silenciar conversación"
                }
                placement="top"
              >
                <IconButton
                  className="chat-sound-button"
                  size="small"
                  onClick={(event) => {
                    // Evitamos abrir la conversación.
                    event.stopPropagation();

                    onToggleSilenciada?.(
                      conversacion,
                    );
                  }}
                  aria-label={
                    estaSilenciada
                      ? "Activar sonido de conversación"
                      : "Silenciar conversación"
                  }
                  sx={{
                    // Silenciada:
                    // siempre mostramos el icono.
                    //
                    // Con sonido:
                    // aparece solamente en hover.
                    opacity: estaSilenciada
                      ? 1
                      : 0,

                    color: estaSilenciada
                      ? "#d32f2f"
                      : "#78909c",

                    flexShrink: 0,

                    transition:
                      "opacity 0.2s ease, " +
                      "color 0.2s ease, " +
                      "background-color 0.2s ease",

                    "&:hover": {
                      color: estaSilenciada
                        ? "#d32f2f"
                        : "#1565a8",

                      backgroundColor:
                        estaSilenciada
                          ? "rgba(211, 47, 47, 0.08)"
                          : "rgba(21, 101, 168, 0.08)",
                    },
                  }}
                >
                  {estaSilenciada ? (
                    <VolumeOffOutlinedIcon
                      sx={{
                        fontSize: 18,
                      }}
                    />
                  ) : (
                    <VolumeUpOutlinedIcon
                      sx={{
                        fontSize: 18,
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>

              {/* ===========================================
                  ANCLAR / DESANCLAR
              =========================================== */}

              <Tooltip
                title={
                  estaAnclada
                    ? "Desanclar conversación"
                    : "Anclar conversación"
                }
                placement="top"
              >
                <IconButton
                  className="chat-pin-button"
                  size="small"
                  onClick={(event) => {
                    // Evitamos que también abra
                    // la conversación.
                    event.stopPropagation();

                    onToggleAnclada?.(
                      conversacion,
                    );
                  }}
                  aria-label={
                    estaAnclada
                      ? "Desanclar conversación"
                      : "Anclar conversación"
                  }
                  sx={{
                    mr: tieneNoLeidos
                      ? 0.5
                      : 0,

                    // Si está anclada permanece
                    // visible.
                    // Si no, aparece con hover.
                    opacity: estaAnclada
                      ? 1
                      : 0,

                    color: estaAnclada
                      ? "#1565a8"
                      : "#78909c",

                    flexShrink: 0,

                    transition:
                      "opacity 0.2s ease, " +
                      "color 0.2s ease, " +
                      "background-color 0.2s ease",

                    "&:hover": {
                      color: "#1565a8",

                      backgroundColor:
                        "rgba(21, 101, 168, 0.08)",
                    },
                  }}
                >
                  {estaAnclada ? (
                    <PushPinIcon
                      sx={{
                        fontSize: 18,
                      }}
                    />
                  ) : (
                    <PushPinOutlinedIcon
                      sx={{
                        fontSize: 18,
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>

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

                    backgroundColor: "#2389dc",

                    color: "#ffffff",

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

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
        })}
      </List>
    </Box>
  );
};

export default ConversationList;