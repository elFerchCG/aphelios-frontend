import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
} from "@mui/material";

function ActualizarComponenteDialog({
  open,
  onClose,
  componente,
  onSave,
  listaProveedores = [],
}) {
  const [form, setForm] = useState({
    componenteId: null,
    sku: "",
    descripcion: "",
    proveedorId: "",
    multiplo: 1,
    factorConversion: 1,
  });

  const [proveedorId, setProveedorId] = useState("");

  // cuando se abre o cambia el componente, llenamos el form
  useEffect(() => {
    if (componente) {
      setForm({
        componenteId: componente.componenteId || componente.componente_id,
        sku: componente.sku || "",
        descripcion: componente.descripcion || "",
        proveedorId: componente.proveedorId || componente.proveedor_id || "",
        multiplo: componente.multiplo !== undefined ? componente.multiplo : 1,
        factorConversion:
          componente.factor_conversion !== undefined
            ? componente.factor_conversion
            : 1,
      });
    } else {
      setForm({
        componenteId: null,
        sku: "",
        descripcion: "",
        proveedorId: "",
        multiplo: 1,
        factorConversion: 1,
      });
    }
  }, [componente, open]);

  const handleChange = (field) => (e) => {
    const value =
      field === "multiplo" || field === "factorConversion"
        ? Number(e.target.value)
        : e.target.value;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (!form.componenteId) return;

    const proveedorIdFinal =
      form.proveedorId && form.proveedorId !== "" ? form.proveedorId : "1"; 

    onSave?.({
      componenteId: form.componenteId,
      descripcion: form.descripcion,
      proveedor_id: proveedorIdFinal,
      multiplo: form.multiplo,
      factor_conversion: form.factorConversion,
    });
  };

  const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick") return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", pb: 1 }}>
        Actualizar componente
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3, pb: 1 }}>
        <Grid container spacing={2}>
          {/* SKU (solo lectura) */}
          <Grid item xs={12} md={6}>
            <TextField
              label="SKU"
              value={form.sku}
              fullWidth
              size="medium"
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>

          {/* Descripción (editable) */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Descripción"
              value={form.descripcion}
              onChange={handleChange("descripcion")}
              fullWidth
              size="medium"
            />
          </Grid>

          {/* Proveedor (editable) */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Proveedor"
              value={form.proveedorId}
              onChange={handleChange("proveedorId")}
              fullWidth
              size="medium"
            >
              {listaProveedores.length > 0 ? (
                listaProveedores.map((prov) => (
                  <MenuItem
                    key={prov.id_proveedor}
                    value={String(prov.id_proveedor)}
                  >
                    {prov.razon_social}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="">Sin proveedores</MenuItem>
              )}
            </TextField>
          </Grid>

          {/* Múltiplo */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Múltiplo"
              type="number"
              value={form.multiplo}
              onChange={handleChange("multiplo")}
              fullWidth
              size="medium"
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Factor conversión */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Factor conversión"
              type="number"
              value={form.factorConversion}
              onChange={handleChange("factorConversion")}
              fullWidth
              size="medium"
              inputProps={{ min: 1 }}
            />
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

export default ActualizarComponenteDialog;
