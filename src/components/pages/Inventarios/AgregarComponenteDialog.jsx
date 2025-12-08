import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

function AgregarComponenteDialog({
  open,
  onClose,
  onSave,
  listaComponentes = [], // 👈 ahora viene la lista de componentes existentes
  initialValues,
}) {
  const [selectedComponente, setSelectedComponente] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [tipo, setTipo] = useState("ensamble");

  // Reset cuando se abre el modal o cambian initialValues
  useEffect(() => {
    if (initialValues) {
      // por si luego lo usas para editar
      setSelectedComponente(
        listaComponentes.find(
          (c) => c.componente_id === initialValues.componenteId
        ) || null
      );
      setCantidad(initialValues.cantidad ?? 1);
      setTipo(initialValues.tipo || "ensamble");
    } else {
      setSelectedComponente(null);
      setCantidad(1);
      setTipo("ensamble");
    }
  }, [initialValues, open, listaComponentes]);

  const handleSubmit = () => {
    if (!selectedComponente) {
      // podrías meter Swal aquí si quieres, pero lo dejo simple
      alert("Debes seleccionar un componente.");
      return;
    }

    onSave?.({
      componenteId: selectedComponente.componente_id,
      sku: selectedComponente.sku,
      cantidad,
      tipo,
    });
  };

  const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick") return;
    onClose();
  };

  const descripcionSafe = selectedComponente?.descripcion || "N/A";
  const proveedorSafe = selectedComponente?.proveedor_nombre || "N/A"; // si lo traes en la lista
  const multiploSafe =
    selectedComponente?.multiplo !== undefined
      ? selectedComponente.multiplo
      : "N/A";
  const factorSafe =
    selectedComponente?.factor_conversion !== undefined
      ? selectedComponente.factor_conversion
      : "N/A";

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", pb: 1 }}>
        Enlazar componente existente
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3, pb: 1 }}>
        <Grid container spacing={2}>
          {/* Autocomplete de componente */}
          <Grid item xs={12}>
            <Autocomplete
              options={listaComponentes}
              getOptionLabel={(option) =>
                option
                  ? `${option.sku || "SIN SKU"} - ${
                      option.descripcion || "Sin descripción"
                    }`
                  : ""
              }
              value={selectedComponente}
              onChange={(_, value) => setSelectedComponente(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Componente (SKU - Descripción)"
                  fullWidth
                  size="medium"
                />
              )}
            />
          </Grid>

          {/* Datos del componente seleccionado */}
          <Grid item xs={12}>
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Datos del componente seleccionado
              </Typography>

              <Typography variant="body2">
                <strong>SKU:</strong> {selectedComponente?.sku || "N/A"}
              </Typography>
              <Typography variant="body2">
                <strong>Descripción:</strong> {descripcionSafe}
              </Typography>
              <Typography variant="body2">
                <strong>Proveedor:</strong> {proveedorSafe}
              </Typography>
              <Typography variant="body2">
                <strong>Múltiplo:</strong> {multiploSafe}
              </Typography>
              <Typography variant="body2">
                <strong>Factor conversión:</strong> {factorSafe}
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
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ backgroundColor: "#1976d2" }}
        >
          CERRAR
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ backgroundColor: "#2e7d32" }}
        >
          GUARDAR
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AgregarComponenteDialog;
