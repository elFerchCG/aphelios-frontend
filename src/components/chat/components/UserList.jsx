import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

// ============================================================
// HELPERS
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
// COMPONENTE
// ============================================================

const UserList = ({
  usuarios = [],
  loading = false,
  busqueda = "",
  onBusquedaChange,
  onBack,
  onClose,
  onSelect,
  disabled = false,
}) => {
  return (
    <>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Box
        sx={{
          px: 2,
          py: 1.8,

          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <IconButton
          onClick={onBack}
          aria-label="Regresar"
        >
          <ArrowBackIcon />
        </IconButton>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily:
                "Montserrat, sans-serif",

              fontWeight: 800,

              color: "#0f2744",
            }}
          >
            Nuevo chat
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Selecciona un usuario
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          aria-label="Cerrar chat"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* =====================================================
          BUSCADOR
      ===================================================== */}

      <Box
        sx={{
          px: 2,
          py: 2,
        }}
      >
        <TextField
          fullWidth
          size="small"
          autoFocus
          placeholder="Buscar usuario o rol..."
          value={busqueda}
          onChange={(event) =>
            onBusquedaChange?.(
              event.target.value
            )
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* =====================================================
          LISTADO
      ===================================================== */}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {loading ? (
          <Box
            sx={{
              py: 5,

              display: "flex",
              justifyContent:
                "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : usuarios.length === 0 ? (
          <Box
            sx={{
              px: 3,
              py: 5,

              textAlign: "center",
            }}
          >
            <Typography
              color="text.secondary"
            >
              No se encontraron usuarios.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {usuarios.map(
              (usuario) => {
                const conectado =
                  Boolean(
                    usuario.conectado
                  );

                return (
                  <ListItemButton
                    key={
                      usuario.id_usuario
                    }
                    disabled={disabled}
                    onClick={() =>
                      onSelect?.(
                        usuario
                      )
                    }
                    sx={{
                      px: 2.5,
                      py: 1.4,

                      "&:hover": {
                        backgroundColor:
                          "rgba(35, 137, 220, 0.06)",
                      },
                    }}
                  >
                    {/* =======================================
                        AVATAR + PRESENCIA
                    ======================================= */}

                    <ListItemAvatar>
                      <Box
                        sx={{
                          position:
                            "relative",

                          width: 44,
                          height: 44,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,

                            backgroundColor:
                              conectado
                                ? "#2389dc"
                                : "#9fb4bf",

                            fontFamily:
                              "Montserrat, sans-serif",

                            fontWeight: 700,

                            fontSize: 13,
                          }}
                        >
                          {obtenerIniciales(
                            usuario.nombre
                          )}
                        </Avatar>

                        {/* ===============================
                            ESTADO ONLINE
                        =============================== */}

                        <Box
                          sx={{
                            position:
                              "absolute",

                            right: -1,
                            bottom: -1,

                            width: 13,
                            height: 13,

                            borderRadius:
                              "50%",

                            backgroundColor:
                              conectado
                                ? "#2eaf62"
                                : "#b0bec5",

                            border:
                              "2px solid #ffffff",
                          }}
                        />
                      </Box>
                    </ListItemAvatar>

                    {/* =======================================
                        INFORMACIÓN DEL USUARIO
                    ======================================= */}

                    <ListItemText
                      primary={
                        usuario.nombre
                      }
                      secondary={
                        <>
                          {usuario.rol_descripcion ||
                            "Sin rol"}

                          {" · "}

                          <Box
                            component="span"
                            sx={{
                              color:
                                conectado
                                  ? "#2e7d32"
                                  : "#78909c",

                              fontWeight:
                                conectado
                                  ? 600
                                  : 400,
                            }}
                          >
                            {conectado
                              ? "En línea"
                              : "Desconectado"}
                          </Box>
                        </>
                      }
                      primaryTypographyProps={{
                        fontFamily:
                          "Montserrat, sans-serif",

                        fontWeight: 700,

                        color:
                          "#263238",

                        noWrap: true,
                      }}
                      secondaryTypographyProps={{
                        component: "div",
                        noWrap: true,
                      }}
                    />
                  </ListItemButton>
                );
              }
            )}
          </List>
        )}
      </Box>
    </>
  );
};

export default UserList;