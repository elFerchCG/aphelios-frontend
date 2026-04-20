import { useState, useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

const INITIAL_FORM = {
  selectedComponente: null,
  cantidad: 1,
  tipo: "ensamble",
};

function AgregarComponenteDialog({
  open,
  onClose,
  onSave,
  listaComponentes = [],
  initialValues = null,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (initialValues) {
      const componenteInicial =
        listaComponentes.find(
          (c) => c.componente_id === initialValues.componenteId
        ) || null;

      setForm({
        selectedComponente: componenteInicial,
        cantidad: initialValues.cantidad ?? 1,
        tipo: initialValues.tipo || "ensamble",
      });
    } else {
      setForm(INITIAL_FORM);
    }

    setError("");
  }, [open, initialValues, listaComponentes]);

  const selectedComponente = form.selectedComponente;

  const detalleComponente = useMemo(() => {
    if (!selectedComponente) {
      return {
        sku: "N/A",
        descripcion: "N/A",
        proveedor: "N/A",
        multiplo: "N/A",
        factorConversion: "N/A",
      };
    }

    return {
      sku: selectedComponente.sku || "N/A",
      descripcion: selectedComponente.descripcion || "N/A",
      proveedor:
        selectedComponente.proveedor_nombre ||
        selectedComponente.razon_social ||
        "N/A",
      multiplo:
        selectedComponente.multiplo !== undefined
          ? selectedComponente.multiplo
          : "N/A",
      factorConversion:
        selectedComponente.factor_conversion !== undefined
          ? selectedComponente.factor_conversion
          : "N/A",
    };
  }, [selectedComponente]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = () => {
    if (!selectedComponente) {
      setError("Debes seleccionar un componente.");
      return;
    }

    onSave?.({
      componenteId: selectedComponente.componente_id,
      sku: selectedComponente.sku,
      cantidad: form.cantidad,
      tipo: form.tipo,
    });
  };

  const handleDialogClose = (_, reason) => {
    if (reason === "backdropClick") return;
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          px: 1,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", fontWeight: 700, pb: 1 }}>
        Enlazar componente existente
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3, pb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={listaComponentes}
              value={selectedComponente}
              onChange={(_, value) => handleChange("selectedComponente", value)}
              isOptionEqualToValue={(option, value) =>
                option.componente_id === value.componente_id
              }
              getOptionLabel={(option) =>
                option
                  ? `${option.sku || "SIN SKU"} - ${
                      option.descripcion || "Sin descripción"
                    }`
                  : ""
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Componente (SKU - Descripción)"
                  fullWidth
                />
              )}
            />
          </Grid>

          {error ? (
            <Grid item xs={12}>
              <Alert severity="warning">{error}</Alert>
            </Grid>
          ) : null}

          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 2,
                bgcolor: "grey.50",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Datos del componente seleccionado
              </Typography>

              <Divider sx={{ mb: 1.5 }} />

              <Typography variant="body2">
                <strong>SKU:</strong> {detalleComponente.sku}
              </Typography>
              <Typography variant="body2">
                <strong>Descripción:</strong> {detalleComponente.descripcion}
              </Typography>
              <Typography variant="body2">
                <strong>Proveedor:</strong> {detalleComponente.proveedor}
              </Typography>
              <Typography variant="body2">
                <strong>Múltiplo:</strong> {detalleComponente.multiplo}
              </Typography>
              <Typography variant="body2">
                <strong>Factor conversión:</strong>{" "}
                {detalleComponente.factorConversion}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>

        <Button onClick={handleSubmit} variant="contained" color="success">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AgregarComponenteDialog;