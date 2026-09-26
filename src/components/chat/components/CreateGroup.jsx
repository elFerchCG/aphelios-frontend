import {
  Avatar,
  Box,
  Button,
  Checkbox,
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
import GroupAddIcon from "@mui/icons-material/GroupAdd";

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

const CreateGroup = ({
  usuarios = [],
  loading = false,
  creando = false,

  nombre = "",
  onNombreChange,

  busqueda = "",
  onBusquedaChange,

  seleccionados = [],
  onToggleUsuario,

  onBack,
  onClose,
  onCreate,
}) => {
  const cantidadSeleccionados =
    seleccionados.length;

  const puedeCrear =
    nombre.trim().length > 0 &&
    cantidadSeleccionados > 0 &&
    !creando;

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
          disabled={creando}
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
            Nuevo grupo
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Crea una conversación grupal
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          aria-label="Cerrar chat"
          disabled={creando}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* =====================================================
          NOMBRE DEL GRUPO
      ===================================================== */}

      <Box
        sx={{
          px: 2,
          pt: 2,
          pb: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          label="Nombre del grupo"
          placeholder="Ej. Equipo Marketing"
          value={nombre}
          disabled={creando}
          inputProps={{
            maxLength: 150,
          }}
          onChange={(event) =>
            onNombreChange?.(
              event.target.value
            )
          }
        />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            textAlign: "right",
            mt: 0.5,
          }}
        >
          {nombre.length}/150
        </Typography>
      </Box>

      {/* =====================================================
          BUSCAR USUARIOS
      ===================================================== */}

      <Box
        sx={{
          px: 2,
          pb: 1.5,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar usuario o rol..."
          value={busqueda}
          disabled={creando}
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
          CONTADOR
      ===================================================== */}

      <Box
        sx={{
          px: 2.5,
          pb: 1,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily:
              "Montserrat, sans-serif",

            fontWeight: 700,

            color: "#455A64",
          }}
        >
          Participantes
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color:
              cantidadSeleccionados > 0
                ? "#2389dc"
                : "text.secondary",

            fontWeight: 700,
          }}
        >
          {cantidadSeleccionados} seleccionados
        </Typography>
      </Box>

      {/* =====================================================
          USUARIOS
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
              justifyContent: "center",
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
                const usuarioId =
                  Number(
                    usuario.id_usuario
                  );

                const seleccionado =
                  seleccionados.some(
                    (id) =>
                      Number(id) ===
                      usuarioId
                  );

                const conectado =
                  Boolean(
                    usuario.conectado
                  );

                return (
                  <ListItemButton
                    key={
                      usuario.id_usuario
                    }
                    disabled={creando}
                    onClick={() =>
                      onToggleUsuario?.(
                        usuarioId
                      )
                    }
                    sx={{
                      px: 2.5,
                      py: 1.2,

                      backgroundColor:
                        seleccionado
                          ? "#F0F7FD"
                          : "transparent",

                      "&:hover": {
                        backgroundColor:
                          seleccionado
                            ? "#E5F2FC"
                            : "rgba(35, 137, 220, 0.06)",
                      },
                    }}
                  >
                    <Checkbox
                      edge="start"
                      checked={
                        seleccionado
                      }
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        mr: 1,
                      }}
                    />

                    <ListItemAvatar>
                      <Box
                        sx={{
                          position:
                            "relative",

                          width: 42,
                          height: 42,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 42,
                            height: 42,

                            backgroundColor:
                              seleccionado
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

                        <Box
                          sx={{
                            position:
                              "absolute",

                            right: -1,
                            bottom: -1,

                            width: 12,
                            height: 12,

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

      <Divider />

      {/* =====================================================
          CREAR
      ===================================================== */}

      <Box
        sx={{
          p: 2,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          startIcon={
            creando ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <GroupAddIcon />
            )
          }
          disabled={
            !puedeCrear
          }
          onClick={onCreate}
          sx={{
            minHeight: 42,

            textTransform: "none",

            fontFamily:
              "Montserrat, sans-serif",

            fontWeight: 700,

            borderRadius: 2,

            backgroundColor:
              "#2389dc",

            boxShadow: "none",

            "&:hover": {
              backgroundColor:
                "#1976c5",

              boxShadow: "none",
            },
          }}
        >
          {creando
            ? "Creando grupo..."
            : "Crear grupo"}
        </Button>
      </Box>
    </>
  );
};

export default CreateGroup;