import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Autocomplete,
  Typography,
  Box,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";

const swalConfig = {
  didOpen: () => {
    const swalContainer = document.querySelector(".swal2-container");

    if (swalContainer) {
      swalContainer.style.zIndex = "20000";
    }
  },
};

const CrearProformaModal = ({ open, onClose, apiUrl, onCreated }) => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  const cargarPedidos = async () => {
    try {
      setLoadingPedidos(true);

      const response = await axios.get(
        `${apiUrl}/facturas/proformas/pedidos/activos`,
      );

      setPedidos(response.data || []);
    } catch (error) {
      Swal.fire({
        ...swalConfig,
        title: "Error",
        text:
          error.response?.data?.message ||
          "Error al cargar los pedidos disponibles.",
        icon: "error",
      });
    } finally {
      setLoadingPedidos(false);
    }
  };

  useEffect(() => {
    if (open) {
      cargarPedidos();
    }
  }, [open]);

  const limpiarFormulario = () => {
    setPedidoSeleccionado(null);
    setTitulo("");
    setDescripcion("");
  };

  const cerrarModal = () => {
    limpiarFormulario();
    onClose();
  };

  const handleCrear = async () => {
    if (!pedidoSeleccionado?.id) {
      Swal.fire({
        ...swalConfig,
        title: "Atención",
        text: "Debes seleccionar el pedido al que pertenece la proforma.",
        icon: "warning",
      });

      return;
    }

    if (!titulo.trim()) {
      Swal.fire({
        ...swalConfig,
        title: "Atención",
        text: "El título de la proforma es obligatorio.",
        icon: "warning",
      });

      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${apiUrl}/facturas/proformas`, {
        pedido_id: pedidoSeleccionado.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
      });

      const nuevaProformaId = response.data.proforma_id;

      Swal.fire({
        ...swalConfig,
        title: "¡Listo!",
        text: "Proforma creada correctamente.",
        icon: "success",
      });

      limpiarFormulario();
      await onCreated(nuevaProformaId);
      onClose();
    } catch (error) {
      Swal.fire({
        ...swalConfig,
        title: "Error",
        text: error.response?.data?.message || "Error al crear la proforma.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return;
        cerrarModal();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Crear nueva proforma</DialogTitle>

      <DialogContent>
        <Autocomplete
          fullWidth
          options={pedidos}
          value={pedidoSeleccionado}
          loading={loadingPedidos}
          onChange={(event, newValue) => {
            setPedidoSeleccionado(newValue);
          }}
          getOptionLabel={(option) => {
            if (!option) return "";

            return `Pedido #${option.id} · ${
              option.proveedor_nombre || "Sin proveedor"
            } · ${option.fecha_creacion || "Sin fecha"}`;
          }}
          isOptionEqualToValue={(option, value) =>
            String(option.id) === String(value.id)
          }
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Pedido #{option.id} —{" "}
                  {option.proveedor_nombre || "Sin proveedor"}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Creado: {option.fecha_creacion || "Sin fecha"}
                  {" · "}
                  Líneas: {option.total_lineas || 0}
                  {option.fecha_compromiso
                    ? ` · Compromiso: ${option.fecha_compromiso}`
                    : ""}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar pedido"
              placeholder="Escribe el número de pedido o proveedor..."
              sx={{ mt: 1, mb: 2 }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingPedidos ? (
                      <CircularProgress size={20} />
                    ) : null}

                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <TextField
          fullWidth
          label="Título de la proforma"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={cerrarModal} disabled={loading}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleCrear}
          disabled={loading || loadingPedidos}
        >
          {loading ? <CircularProgress size={22} /> : "Crear proforma"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CrearProformaModal;