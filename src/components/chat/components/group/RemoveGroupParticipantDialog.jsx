import { useEffect, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";

import axios from "axios";

import useAuthStore from "../../../../store/authStore";

const RemoveGroupParticipantDialog = ({
  open,
  conversacion,
  participante,
  onClose,
  onRemoved,
}) => {
  const { token } = useAuthStore();

  // ============================================================
  // ESTADOS
  // ============================================================

  const [eliminando, setEliminando] =
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
  // IDS
  // ============================================================

  const conversacionId = Number(
    conversacion?.id,
  );

  const participanteId = Number(
    participante?.usuario_id,
  );

  // ============================================================
  // DEBUG TEMPORAL
  // ============================================================

  console.log(
    "[RemoveGroupParticipantDialog] RENDER:",
    {
      open,
      conversacionId,
      participanteId,
      participante,
    },
  );

  // ============================================================
  // LIMPIAR ERROR AL ABRIR
  // ============================================================

  useEffect(() => {
    if (open) {
      setError("");
    }
  }, [
    open,
    participanteId,
  ]);

  // ============================================================
  // INICIAL
  // ============================================================

  const obtenerInicial = (nombre) => {
    if (!nombre) {
      return "?";
    }

    return nombre
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  // ============================================================
  // CERRAR
  // ============================================================

  const handleClose = () => {
    if (eliminando) {
      return;
    }

    console.log(
      "[RemoveGroupParticipantDialog] Cerrando dialog",
    );

    setError("");

    onClose?.();
  };

  // ============================================================
  // QUITAR PARTICIPANTE
  // ============================================================

  const handleRemove = async () => {
    console.log(
      "[RemoveGroupParticipantDialog] Confirmando eliminación:",
      {
        conversacionId,
        participanteId,
        participante,
      },
    );

    if (!token) {
      setError(
        "No se encontró una sesión válida.",
      );
      return;
    }

    if (!conversacionId) {
      setError(
        "No se encontró la conversación.",
      );
      return;
    }

    if (!participanteId) {
      setError(
        "No se encontró el participante.",
      );
      return;
    }

    if (eliminando) {
      return;
    }

    try {
      setEliminando(true);
      setError("");

      const response =
        await axios.delete(
          `${apiUrl}/chat/conversaciones/${conversacionId}/participantes/${participanteId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      console.log(
        "[RemoveGroupParticipantDialog] Participante eliminado:",
        response.data,
      );

      // ========================================================
      // NOTIFICAR A GROUP INFO
      // ========================================================

      if (onRemoved) {
        await onRemoved(
          participante,
          response.data,
        );
      }

      // ========================================================
      // CERRAR
      // ========================================================

      setError("");

      onClose?.();
    } catch (error) {
      console.error(
        "[RemoveGroupParticipantDialog] Error quitando participante:",
        error,
      );

      setError(
        error.response?.data?.message ||
          "No se pudo quitar al participante del grupo.",
      );
    } finally {
      setEliminando(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Dialog
      open={Boolean(open)}
      onClose={
        eliminando
          ? undefined
          : handleClose
      }
      fullWidth
      maxWidth="xs"
      disableRestoreFocus
    >
      {/* ======================================================
          TÍTULO
      ====================================================== */}

      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        <PersonRemoveOutlinedIcon
          color="error"
        />

        Quitar participante
      </DialogTitle>

      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            py: 2,
          }}
        >
          {/* AVATAR */}

          <Avatar
            sx={{
              width: 64,
              height: 64,
              mb: 1.5,
            }}
          >
            {obtenerInicial(
              participante?.nombre,
            )}
          </Avatar>

          {/* NOMBRE */}

          <Typography
            variant="body1"
            fontWeight={700}
          >
            {participante?.nombre ||
              "Usuario"}
          </Typography>

          {/* ROL */}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.25,
            }}
          >
            {participante?.rol ||
              "Sin rol"}
          </Typography>

          {/* CONFIRMACIÓN */}

          <Typography
            variant="body2"
            sx={{
              mt: 2.5,
            }}
          >
            ¿Seguro que deseas quitar a{" "}
            <strong>
              {participante?.nombre ||
                "este usuario"}
            </strong>{" "}
            del grupo?
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 1,
              maxWidth: 300,
            }}
          >
            El usuario dejará de tener
            acceso a esta conversación.
          </Typography>
        </Box>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 1,
            }}
          >
            {error}
          </Alert>
        )}
      </DialogContent>

      {/* ======================================================
          ACCIONES
      ====================================================== */}

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={eliminando}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleRemove}
          disabled={
            eliminando ||
            !participanteId ||
            !conversacionId
          }
          startIcon={
            eliminando ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : (
              <PersonRemoveOutlinedIcon />
            )
          }
        >
          {eliminando
            ? "Quitando..."
            : "Quitar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveGroupParticipantDialog;