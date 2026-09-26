import {
  useMemo,
  useState,
} from "react";

import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";

import axios from "axios";

import useAuthStore from "../../../../store/authStore";

const obtenerIniciales = (nombre = "") => {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();
};

const AddGroupParticipantsDialog = ({
  open,
  conversacion,
  usuarios = [],
  participantesActuales = [],
  loadingUsuarios = false,
  onClose,
  onUpdated,
}) => {
  const { token } = useAuthStore();

  // ============================================================
  // ESTADOS
  // ============================================================

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    seleccionados,
    setSeleccionados,
  ] = useState([]);

  const [
    agregando,
    setAgregando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ============================================================
  // API
  // ============================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const conversacionId = Number(
    conversacion?.id,
  );

  // ============================================================
  // IDS DE PARTICIPANTES ACTUALES
  // ============================================================

  const idsParticipantesActuales =
    useMemo(() => {
      return new Set(
        participantesActuales.map(
          (participante) =>
            Number(
              participante.usuario_id,
            ),
        ),
      );
    }, [participantesActuales]);

  // ============================================================
  // USUARIOS DISPONIBLES
  // ============================================================

  const usuariosDisponibles =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toLowerCase();

      return usuarios.filter(
        (usuario) => {
          const usuarioId = Number(
            usuario.id_usuario,
          );

          // Ya pertenece al grupo.
          if (
            idsParticipantesActuales.has(
              usuarioId,
            )
          ) {
            return false;
          }

          if (!termino) {
            return true;
          }

          const nombre =
            (
              usuario.nombre || ""
            ).toLowerCase();

          const rol =
            (
              usuario.rol_descripcion ||
              usuario.rol ||
              ""
            ).toLowerCase();

          return (
            nombre.includes(termino) ||
            rol.includes(termino)
          );
        },
      );
    }, [
      usuarios,
      busqueda,
      idsParticipantesActuales,
    ]);

  // ============================================================
  // SELECCIONAR USUARIO
  // ============================================================

  const handleToggleUsuario = (
    usuarioId,
  ) => {
    const id = Number(usuarioId);

    setSeleccionados(
      (actuales) => {
        const existe =
          actuales.includes(id);

        if (existe) {
          return actuales.filter(
            (item) => item !== id,
          );
        }

        return [
          ...actuales,
          id,
        ];
      },
    );
  };

  // ============================================================
  // CERRAR
  // ============================================================

  const handleClose = () => {
    if (agregando) {
      return;
    }

    setBusqueda("");
    setSeleccionados([]);
    setError("");

    onClose();
  };

  // ============================================================
  // AGREGAR PARTICIPANTES
  // ============================================================

  const handleAgregar = async () => {
    if (
      !token ||
      !conversacionId ||
      seleccionados.length === 0 ||
      agregando
    ) {
      return;
    }

    try {
      setAgregando(true);
      setError("");

      const response =
        await axios.post(
          `${apiUrl}/chat/conversaciones/${conversacionId}/participantes`,
          {
            participantes:
              seleccionados,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (onUpdated) {
        await onUpdated(
          response.data,
        );
      }

      setBusqueda("");
      setSeleccionados([]);

      onClose();
    } catch (error) {
      console.error(
        "Error agregando participantes:",
        error,
      );

      setError(
        error.response?.data
          ?.message ||
          "No se pudieron agregar los participantes.",
      );
    } finally {
      setAgregando(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Dialog
      open={open}
      onClose={
        agregando
          ? undefined
          : handleClose
      }
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Agregar participantes
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
          }}
        >
          Selecciona los usuarios que
          deseas agregar al grupo.
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Buscar usuario o rol..."
          value={busqueda}
          onChange={(event) =>
            setBusqueda(
              event.target.value,
            )
          }
          disabled={agregando}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
          >
            Usuarios disponibles
          </Typography>

          <Typography
            variant="caption"
            color={
              seleccionados.length > 0
                ? "primary"
                : "text.secondary"
            }
            fontWeight={700}
          >
            {seleccionados.length}{" "}
            seleccionado
            {seleccionados.length === 1
              ? ""
              : "s"}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 1,
            maxHeight: 350,
            overflowY: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          {loadingUsuarios ? (
            <Box
              sx={{
                minHeight: 160,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
              }}
            >
              <CircularProgress
                size={28}
              />
            </Box>
          ) : usuariosDisponibles.length ===
            0 ? (
            <Box
              sx={{
                px: 2,
                py: 4,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {busqueda.trim()
                  ? "No se encontraron usuarios."
                  : "No hay usuarios disponibles para agregar."}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {usuariosDisponibles.map(
                (usuario) => {
                  const usuarioId =
                    Number(
                      usuario.id_usuario,
                    );

                  const seleccionado =
                    seleccionados.includes(
                      usuarioId,
                    );

                  const rol =
                    usuario.rol_descripcion ||
                    usuario.rol ||
                    "Sin rol";

                  return (
                    <ListItem
                      key={usuarioId}
                      disablePadding
                    >
                      <ListItemButton
                        onClick={() =>
                          handleToggleUsuario(
                            usuarioId,
                          )
                        }
                        disabled={
                          agregando
                        }
                      >
                        <Checkbox
                          edge="start"
                          checked={
                            seleccionado
                          }
                          tabIndex={-1}
                          disableRipple
                        />

                        <ListItemAvatar>
                          <Avatar>
                            {obtenerIniciales(
                              usuario.nombre,
                            )}
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                          primary={
                            usuario.nombre
                          }
                          secondary={`${rol} · ${
                            usuario.conectado
                              ? "Conectado"
                              : "Desconectado"
                          }`}
                          primaryTypographyProps={{
                            fontWeight:
                              600,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                },
              )}
            </List>
          )}
        </Box>

        {error && (
          <Typography
            variant="body2"
            color="error"
            sx={{
              mt: 2,
            }}
          >
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={agregando}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          startIcon={
            agregando ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <PersonAddAltOutlinedIcon />
            )
          }
          disabled={
            agregando ||
            seleccionados.length === 0
          }
          onClick={handleAgregar}
        >
          {agregando
            ? "Agregando..."
            : "Agregar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddGroupParticipantsDialog;