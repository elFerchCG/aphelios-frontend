import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import useAuthStore from "../../../../store/authStore";

const MAX_NOMBRE = 150;

const EditGroupNameDialog = ({
  open,
  conversacion,
  onClose,
  onUpdated,
}) => {
  const { token } = useAuthStore();

  // ============================================================
  // ESTADOS
  // ============================================================

  const [nombre, setNombre] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // API
  // ============================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // ============================================================
  // CONVERSACIÓN
  // ============================================================

  const conversacionId = Number(
    conversacion?.id,
  );

  // ============================================================
  // CARGAR NOMBRE ACTUAL
  // ============================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    setNombre(
      conversacion?.nombre || "",
    );

    setError("");
  }, [
    open,
    conversacion?.nombre,
  ]);

  // ============================================================
  // VALORES
  // ============================================================

  const nombreLimpio =
    nombre.trim();

  const nombreActual =
    (
      conversacion?.nombre || ""
    ).trim();

  const nombreCambio =
    nombreLimpio !== nombreActual;

  const puedeGuardar =
    nombreLimpio.length > 0 &&
    nombreLimpio.length <= MAX_NOMBRE &&
    nombreCambio &&
    !guardando;

  // ============================================================
  // CERRAR
  // ============================================================

  const handleClose = () => {
    if (guardando) {
      return;
    }

    setError("");
    onClose();
  };

  // ============================================================
  // CAMBIAR NOMBRE
  // ============================================================

  const handleNombreChange = (
    event,
  ) => {
    const value =
      event.target.value;

    if (
      value.length >
      MAX_NOMBRE
    ) {
      return;
    }

    setNombre(value);

    if (error) {
      setError("");
    }
  };

  // ============================================================
  // GUARDAR
  // ============================================================

  const handleGuardar =
    async () => {
      if (
        !token ||
        !conversacionId ||
        !puedeGuardar
      ) {
        return;
      }

      try {
        setGuardando(true);
        setError("");

        const response =
          await axios.patch(
            `${apiUrl}/chat/conversaciones/${conversacionId}/nombre`,
            {
              nombre:
                nombreLimpio,
            },
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        // ========================================================
        // NOMBRE ACTUALIZADO
        // ========================================================

        const nuevoNombre =
          response.data?.conversacion
            ?.nombre ||
          response.data?.nombre ||
          nombreLimpio;

        if (onUpdated) {
          onUpdated(
            nuevoNombre,
            response.data,
          );
        }

        onClose();
      } catch (error) {
        console.error(
          "Error actualizando nombre del grupo:",
          error,
        );

        setError(
          error.response?.data
            ?.message ||
            "No se pudo actualizar el nombre del grupo.",
        );
      } finally {
        setGuardando(false);
      }
    };

  // ============================================================
  // ENTER
  // ============================================================

  const handleKeyDown = (
    event,
  ) => {
    if (
      event.key === "Enter" &&
      puedeGuardar
    ) {
      event.preventDefault();

      handleGuardar();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle
        sx={{
          fontFamily:
            "Montserrat, sans-serif",
          fontWeight: 700,
          color: "#0f2744",
        }}
      >
        Editar nombre del grupo
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            pt: 1,
          }}
        >
          <TextField
            autoFocus
            fullWidth
            label="Nombre del grupo"
            value={nombre}
            disabled={guardando}
            onChange={
              handleNombreChange
            }
            onKeyDown={
              handleKeyDown
            }
            error={Boolean(error)}
            helperText={
              error ||
              `${nombre.length}/${MAX_NOMBRE} caracteres`
            }
            inputProps={{
              maxLength:
                MAX_NOMBRE,
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              mt: 1,
            }}
          >
            El nuevo nombre será
            visible para todos los
            participantes del grupo.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={guardando}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleGuardar}
          disabled={
            !puedeGuardar
          }
          startIcon={
            guardando ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : null
          }
        >
          {guardando
            ? "Guardando..."
            : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditGroupNameDialog;