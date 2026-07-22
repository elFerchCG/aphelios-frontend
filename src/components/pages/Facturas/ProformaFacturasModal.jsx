import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import CrearProformaModal from "./CrearProformaModal";

const swalConfig = {
  didOpen: () => {
    const swalContainer = document.querySelector(".swal2-container");
    if (swalContainer) {
      swalContainer.style.zIndex = "20000";
    }
  },
};

const ProformaFacturasModal = ({ open, onClose, facturaIds, apiUrl }) => {
  const [proformas, setProformas] = useState([]);
  const [proformaId, setProformaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [crearProformaOpen, setCrearProformaOpen] = useState(false);

  const cargarProformas = async () => {
    try {
      const response = await axios.get(`${apiUrl}/facturas/proformas`);
      setProformas(response.data || []);
    } catch (error) {
      Swal.fire({
        ...swalConfig,
        title: "Error",
        text: error.response?.data?.message || "Error al cargar las proformas.",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    if (open) cargarProformas();
  }, [open]);

  const limpiarFormulario = () => {
    setProformaId("");
  };

  const cerrarModal = () => {
    limpiarFormulario();
    onClose();
  };

  const enlazarFacturas = async (idProforma) => {
    await axios.post(`${apiUrl}/facturas/enlazar/proforma`, {
      proforma_id: idProforma,
      facturaIds,
    });
  };

  const handleProformaCreada = async (nuevaProformaId) => {
    await cargarProformas();
    setProformaId(nuevaProformaId);
  };

  const handleGuardar = async () => {
    if (!facturaIds || facturaIds.length === 0) {
      Swal.fire({
        ...swalConfig,
        title: "Atención",
        text: "No hay facturas para enlazar.",
        icon: "warning",
      });
      return;
    }

    if (!proformaId) {
      Swal.fire({
        ...swalConfig,
        title: "Atención",
        text: "Selecciona una proforma.",
        icon: "warning",
      });
      return;
    }

    try {
      setLoading(true);

      await enlazarFacturas(proformaId);

      Swal.fire({
        ...swalConfig,
        title: "¡Proceso completado!",
        html: `
    <div style="text-align:center;">
      <p>Se enlazaron correctamente</p>
      <h2 style="margin:8px 0;color:#1976d2;">
        ${facturaIds.length} factura(s)
      </h2>
      <p>a la proforma seleccionada.</p>
    </div>
  `,
        icon: "success",
        confirmButtonText: "Aceptar",
      });

      cerrarModal();
    } catch (error) {
      Swal.fire({
        ...swalConfig,
        title: "Error",
        text:
          error.response?.data?.message ||
          "Error al enlazar las facturas a la proforma.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          cerrarModal();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enlazar facturas a proforma</DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Se subieron <b>{facturaIds?.length || 0}</b> factura(s). Selecciona
            una proforma existente o crea una nueva para enlazarlas.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Box>
            {proformas.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No existen proformas registradas. Crea una nueva para poder
                enlazar estas facturas.
              </Alert>
            )}

            {proformas.length > 0 && (
              <Autocomplete
                fullWidth
                options={proformas}
                value={
                  proformas.find((p) => String(p.id) === String(proformaId)) ||
                  null
                }
                onChange={(event, newValue) => {
                  setProformaId(newValue ? newValue.id : "");
                }}
                getOptionLabel={(option) =>
                  option
                    ? `${option.titulo} · Pedido #${option.pedido_id || "N/A"} · ${
                        option.proveedor_nombre || "Sin proveedor"
                      }`
                    : ""
                }
                isOptionEqualToValue={(option, value) =>
                  String(option.id) === String(value.id)
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {option.titulo}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Pedido #{option.pedido_id || "N/A"}
                        {" · "}
                        {option.proveedor_nombre || "Sin proveedor"}
                        {" · "}
                        {option.pedido_fecha || "Sin fecha"}
                        {" · "}
                        {option.total_facturas || 0} factura(s)
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar proforma"
                    placeholder="Título, pedido o proveedor..."
                    sx={{ mb: 2 }}
                  />
                )}
              />
            )}

            <Button
              variant="outlined"
              onClick={() => setCrearProformaOpen(true)}
            >
              Crear nueva proforma
            </Button>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrarModal} disabled={loading}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled={loading}
          >
            {loading ? <CircularProgress size={22} /> : "Guardar enlace"}
          </Button>
        </DialogActions>
      </Dialog>

      <CrearProformaModal
        open={crearProformaOpen}
        onClose={() => setCrearProformaOpen(false)}
        apiUrl={apiUrl}
        onCreated={handleProformaCreada}
      />
    </>
  );
};

export default ProformaFacturasModal;
