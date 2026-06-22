import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

const CancelarTareaModal = ({ open, onClose, tarea, onActualizado }) => {
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (open) {
      setMotivoCancelacion("");
      setError("");
    }
  }, [open]);

  const cancelarTarea = async () => {
    if (!tarea?.id) {
      setError("No se encontró la tarea seleccionada.");
      return;
    }

    if (!motivoCancelacion.trim()) {
      setError("Debes escribir el motivo de cancelación.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const resp = await axios.patch(
        `${apiUrl}/publicacionesMejoras/${tarea.id}/estatus`,
        {
          estatus: "cancelado",
          motivo_cancelacion: motivoCancelacion.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        onClose();
        onActualizado();
      } else {
        setError(resp.data.message || "No se pudo cancelar la tarea.");
      }
    } catch (error) {
      console.error("Error al cancelar tarea:", error);
      setError(
        error.response?.data?.message || "No se pudo cancelar la tarea.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: "bold" }}>Cancelar tarea</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Escribe el motivo por el cual se cancelará esta tarea.
        </Typography>

        <TextField
          label="Motivo de cancelación"
          value={motivoCancelacion}
          onChange={(e) => setMotivoCancelacion(e.target.value)}
          fullWidth
          multiline
          minRows={4}
          placeholder="Ej. La mejora ya no aplica, la publicación fue pausada, falta información del proveedor..."
          disabled={guardando}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={guardando}>
          Cerrar
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={cancelarTarea}
          disabled={guardando}
        >
          {guardando ? "Cancelando..." : "Confirmar cancelación"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelarTareaModal;