import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  swalSuccess,
  swalError,
  swalWarning,
} from "../../../helpers/sweetAlert";

import NuevaRazonKaizenModal from "./NuevaRazonKaizenModal";

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

const NuevaAccionKaizenModal = ({
  open,
  onClose,
  producto,
  razones = [],
  onSaved,
  onRazonCreada,
}) => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const obtenerUsuarioLocal = () => {
    try {
      const usuarioStorage = localStorage.getItem("user");

      if (!usuarioStorage) return null;

      return JSON.parse(usuarioStorage);
    } catch (error) {
      console.error("Error al leer usuario local:", error);
      return null;
    }
  };

  const usuarioLocal = obtenerUsuarioLocal();

  const esMarketing = usuarioLocal?.rol_descripcion === "Marketing";

  const [usuariosAsignables, setUsuariosAsignables] = useState([]);
  const [openNuevaRazon, setOpenNuevaRazon] = useState(false);

  const [form, setForm] = useState({
    razon_id: "",
    acciones_mejora: "",
    fecha_seguimiento: "",
    responsables: [],
  });

  useEffect(() => {
    if (open) {
      setForm({
        razon_id: "",
        acciones_mejora: "",
        fecha_seguimiento: new Date().toISOString().slice(0, 10),
        responsables:
          esMarketing && usuarioLocal?.id_usuario
            ? [usuarioLocal.id_usuario]
            : [],
      });

      obtenerUsuariosAsignables();
    }
  }, [open]);

  const fechaKaizen = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (!producto) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const guardarAccion = async () => {
    try {
      if (
        !form.razon_id ||
        !form.acciones_mejora ||
        !form.fecha_seguimiento ||
        !form.responsables.length
      ) {
        swalWarning("Campos incompletos", "Todos los campos son obligatorios");
        return;
      }

      const usuarioLocal = obtenerUsuarioLocal();

      const body = {
        producto_id: producto.producto_id,
        publicacion_id: producto.publicacion_id || producto.id || null,
        sku: producto.sku,
        fecha_kaizen: new Date().toISOString().slice(0, 10),
        ventas: producto.ventas_reales,
        pronostico: producto.pronostico,
        diferencia: producto.diferencia,
        razon_id: form.razon_id,
        acciones_mejora: form.acciones_mejora,
        fecha_seguimiento: form.fecha_seguimiento,
        responsables: form.responsables,
        asignado_por_usuario_id: usuarioLocal?.id_usuario || null,
      };

      const resp = await axios.post(`${apiUrl}/kaizen`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        swalSuccess(
          "Acción registrada",
          resp.data.message || "Acción Kaizen registrada correctamente",
        );

        window.dispatchEvent(new Event("kaizenActualizado"));

        if (onSaved) {
          onSaved();
        }

        onClose();
      }
    } catch (error) {
      console.error("Error al guardar acción Kaizen:", error);

      swalError(
        "Error",
        error.response?.data?.message || "Error al guardar la acción Kaizen",
      );
    }
  };

  const obtenerUsuariosAsignables = async () => {
    try {
      const resp = await axios.get(`${apiUrl}/kaizen/usuariosAsignables`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        setUsuariosAsignables(resp.data.data);
      }
    } catch (error) {
      console.error("Error al obtener usuarios asignables:", error);
      swalError("Error", "No se pudieron cargar los usuarios asignables");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight="bold">Nueva Acción Kaizen</DialogTitle>

      <DialogContent>
        <Box
          sx={{
            p: 2,
            mb: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            backgroundColor: "#fafafa",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Producto
          </Typography>

          <Typography
            variant="h6"
            fontWeight="bold"
            mb={2}
            component={producto.permalink ? "a" : "div"}
            href={producto.permalink || undefined}
            target={producto.permalink ? "_blank" : undefined}
            rel={producto.permalink ? "noopener noreferrer" : undefined}
            sx={{
              display: "block",
              color: producto.permalink ? "#1976d2" : "inherit",
              textDecoration: "none",
              cursor: producto.permalink ? "pointer" : "default",
              "&:hover": {
                textDecoration: producto.permalink ? "underline" : "none",
              },
            }}
          >
            {producto.title}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                SKU
              </Typography>
              <Typography fontWeight="bold">{producto.sku}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Fecha Kaizen
              </Typography>
              <Typography fontWeight="bold">{fechaKaizen}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Stock
              </Typography>
              <Typography fontWeight="bold">{producto.stock_total}</Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Ventas
              </Typography>
              <Typography fontWeight="bold">
                {producto.ventas_reales}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Pronóstico
              </Typography>
              <Typography fontWeight="bold">{producto.pronostico}</Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Diferencia
              </Typography>
              <Box mt={0.5}>
                <Chip
                  label={producto.diferencia}
                  color={producto.diferencia < 0 ? "error" : "success"}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            select
            fullWidth
            label="Razón"
            name="razon_id"
            size="small"
            value={form.razon_id}
            onChange={handleChange}
          >
            {razones.map((razon) => (
              <MenuItem key={razon.id} value={razon.id}>
                {razon.codigo} - {razon.descripcion}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            onClick={() => setOpenNuevaRazon(true)}
            sx={{ whiteSpace: "nowrap" }}
          >
            Nueva
          </Button>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Acciones de mejora"
          name="acciones_mejora"
          size="small"
          value={form.acciones_mejora}
          onChange={handleChange}
          placeholder="Ejemplo: cambio de precio, mejora de publicación, campaña promocional..."
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          type="date"
          label="Fecha seguimiento"
          name="fecha_seguimiento"
          size="small"
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: new Date().toISOString().slice(0, 10),
          }}
          value={form.fecha_seguimiento}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />

        <TextField
          select
          fullWidth
          label="Asignado a"
          name="responsables"
          size="small"
          value={form.responsables}
          disabled={esMarketing}
          onChange={(e) => {
            const value = e.target.value;

            setForm({
              ...form,
              responsables:
                typeof value === "string" ? value.split(",") : value,
            });
          }}
          SelectProps={{
            multiple: true,
            renderValue: (selected) => (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5,
                  maxHeight: 70,
                  overflowY: "auto",
                }}
              >
                {selected.map((usuarioId) => {
                  const usuario = usuariosAsignables.find(
                    (item) => item.id_usuario === Number(usuarioId),
                  );

                  return (
                    <Chip
                      key={usuarioId}
                      label={usuario?.nombre || usuarioId}
                      size="small"
                    />
                  );
                })}
              </Box>
            ),
          }}
        >
          {usuariosAsignables.map((usuario) => (
            <MenuItem key={usuario.id_usuario} value={usuario.id_usuario}>
              <Checkbox
                checked={form.responsables.includes(usuario.id_usuario)}
              />
              <ListItemText
                primary={usuario.nombre}
                secondary={usuario.rol_descripcion}
              />
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>

        <Button variant="contained" onClick={guardarAccion}>
          Guardar
        </Button>
      </DialogActions>

      <NuevaRazonKaizenModal
        open={openNuevaRazon}
        onClose={() => setOpenNuevaRazon(false)}
        onSaved={(nuevaRazon) => {
          if (onRazonCreada) {
            onRazonCreada(nuevaRazon);
          }

          if (nuevaRazon?.id) {
            setForm((prev) => ({
              ...prev,
              razon_id: nuevaRazon.id,
            }));
          }
        }}
      />
    </Dialog>
  );
};

export default NuevaAccionKaizenModal;
