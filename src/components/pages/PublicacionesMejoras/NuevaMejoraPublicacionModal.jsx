import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";

const NuevaMejoraPublicacionModal = ({
  open,
  onClose,
  publicacion,
  onGuardado,
}) => {
  const [descripcionMejora, setDescripcionMejora] = useState("");
  const [estatus, setEstatus] = useState("pendiente");
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [responsablesTexto, setResponsablesTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [responsables, setResponsables] = useState([]);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const obtenerResponsables = async () => {
    try {
      const resp = await axios.get(
        `${apiUrl}/publicacionesMejoras/responsablesMarketing`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        setUsuarios(resp.data.data || []);
      }
    } catch (error) {
      console.error("Error al obtener responsables:", error);
    }
  };

  useEffect(() => {
    if (open) {
      setDescripcionMejora("");
      setEstatus("pendiente");
      setFechaCompromiso("");
      setResponsables([]);
      setError("");
      obtenerResponsables();
    }
  }, [open]);

  const guardarMejora = async () => {
    if (!publicacion?.producto_id) {
      setError("No se encontró la publicación seleccionada.");
      return;
    }

    if (!descripcionMejora.trim()) {
      setError("La descripción de la mejora es obligatoria.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const responsablesIds = responsables.map((usuario) => usuario.id_usuario);

      const payload = {
        producto_id: publicacion.producto_id,
        publicacion_id: publicacion.publicacion_id,
        sku: publicacion.sku,
        descripcion_mejora: descripcionMejora.trim(),
        estatus,
        fecha_compromiso: fechaCompromiso || null,
        responsables: responsablesIds,
      };

      const resp = await axios.post(
        `${apiUrl}/publicacionesMejoras/mejoras`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        onGuardado();
      } else {
        setError(resp.data.message || "No se pudo registrar la mejora.");
      }
    } catch (error) {
      console.error("Error al registrar mejora:", error);
      setError("Error al registrar la mejora.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: "bold" }}>Registrar mejora</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {publicacion?.title}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            SKU: {publicacion?.sku || "Sin SKU"} | Publicación:{" "}
            {publicacion?.publicacion_id || "Sin ID"}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Descripción de la mejora"
          value={descripcionMejora}
          onChange={(e) => setDescripcionMejora(e.target.value)}
          fullWidth
          multiline
          minRows={4}
          sx={{ mb: 2 }}
          placeholder="Ej. Mejorar título, cambiar imágenes, ajustar palabras clave..."
        />

        <TextField
          select
          label="Estatus inicial"
          value={estatus}
          onChange={(e) => setEstatus(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="pendiente">Pendiente</MenuItem>
          <MenuItem value="en_proceso">En proceso</MenuItem>
        </TextField>

        <TextField
          label="Fecha compromiso"
          type="date"
          value={fechaCompromiso}
          onChange={(e) => setFechaCompromiso(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <Autocomplete
          multiple
          options={usuarios}
          value={responsables}
          onChange={(event, newValue) => setResponsables(newValue)}
          getOptionLabel={(option) => option.nombre || ""}
          isOptionEqualToValue={(option, value) =>
            option.id_usuario === value.id_usuario
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Responsables"
              placeholder="Selecciona responsables"
              helperText="Selecciona uno o varios usuarios de marketing"
            />
          )}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={guardando}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={guardarMejora}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar mejora"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevaMejoraPublicacionModal;
