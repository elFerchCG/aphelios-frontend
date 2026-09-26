import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";

import axios from "axios";

import useAuthStore from "../../../../store/authStore";

const LeaveGroupDialog = ({ open, conversacion, onClose, onLeft }) => {
  const { token } = useAuthStore();

  // ============================================================
  // ESTADOS
  // ============================================================

  const [saliendo, setSaliendo] = useState(false);

  const [error, setError] = useState("");

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

  const conversacionId = Number(conversacion?.id);

  const nombreGrupo = conversacion?.nombre || "este grupo";

  // ============================================================
  // LIMPIAR ESTADO AL ABRIR
  // ============================================================

  useEffect(() => {
    if (open) {
      setError("");
    }
  }, [open, conversacionId]);

  // ============================================================
  // CERRAR
  // ============================================================

  const handleClose = () => {
    if (saliendo) {
      return;
    }

    setError("");

    onClose?.();
  };

  // ============================================================
  // SALIR DEL GRUPO
  // ============================================================

  const handleLeave = async () => {
    if (saliendo) {
      return;
    }

    if (!token) {
      setError("No se encontró una sesión válida.");
      return;
    }

    if (!conversacionId) {
      setError("No se encontró la conversación.");
      return;
    }

    try {
      setSaliendo(true);
      setError("");

      // ========================================================
      // SALIR DEL GRUPO
      // ========================================================

      const response = await axios.post(
        `${apiUrl}/chat/conversaciones/${conversacionId}/salir`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // ========================================================
      // NOTIFICAR AL PADRE
      // ========================================================

      if (onLeft) {
        await onLeft(response.data);
      }

      // ========================================================
      // CERRAR
      // ========================================================

      onClose?.();
    } catch (error) {
      console.error("Error saliendo del grupo:", error);

      setError(error.response?.data?.message || "No se pudo salir del grupo.");
    } finally {
      setSaliendo(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Dialog
      open={Boolean(open)}
      onClose={saliendo ? undefined : handleClose}
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
        <LogoutOutlinedIcon color="error" />
        Salir del grupo
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
          {/* ICONO */}

          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "action.hover",
              mb: 2,
            }}
          >
            <GroupsOutlinedIcon
              sx={{
                fontSize: 34,
                color: "text.secondary",
              }}
            />
          </Box>

          {/* GRUPO */}

          <Typography variant="body1" fontWeight={700}>
            {nombreGrupo}
          </Typography>

          {/* CONFIRMACIÓN */}

          <Typography
            variant="body2"
            sx={{
              mt: 2,
            }}
          >
            ¿Seguro que deseas salir de <strong>{nombreGrupo}</strong>?
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 1,
              maxWidth: 310,
            }}
          >
            Dejarás de tener acceso a los mensajes y a la conversación del
            grupo.
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
        <Button onClick={handleClose} disabled={saliendo}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleLeave}
          disabled={saliendo || !conversacionId}
          startIcon={
            saliendo ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <LogoutOutlinedIcon />
            )
          }
        >
          {saliendo ? "Saliendo..." : "Salir del grupo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveGroupDialog;
