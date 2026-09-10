import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../../../../common/modalStyles";

const initialFormData = {
  id: "",
  descripcion: "",
  categoria: "",
  rol_id: "",
  activo: 1,
};

const TipoTransaccionModal = ({
  open,
  mode = "create",
  data = null,
  roles = [],
  onClose,
  onSave,
  loading = false,
}) => {
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (isEdit && data) {
      setFormData({
        id: data.id ?? "",
        descripcion: data.descripcion ?? "",
        categoria: data.categoria ?? "",
        rol_id: data.rol_id ?? "",
        activo: data.activo ?? 1,
      });
    } else {
      setFormData(initialFormData);
    }

    setErrors({});
    setSubmitted(false);
  }, [open, isEdit, data]);

  const validate = (values = formData) => {
    const newErrors = {};

    if (!values.descripcion.trim()) {
      newErrors.descripcion = "Campo obligatorio";
    }

    if (!values.categoria.trim()) {
      newErrors.categoria = "Campo obligatorio";
    }

    if (
      values.rol_id === "" ||
      values.rol_id === null ||
      values.rol_id === undefined
    ) {
      newErrors.rol_id = "Campo obligatorio";
    }

    if (isEdit && values.activo !== 0 && values.activo !== 1) {
      newErrors.activo = "Campo obligatorio";
    }

    return newErrors;
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    const nextData = {
      ...formData,
      [field]: value,
    };

    setFormData(nextData);

    if (submitted) {
      setErrors(validate(nextData));
    } else if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);

    const validationErrors = validate();

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSave({
      ...formData,
      descripcion: formData.descripcion.trim(),
      categoria: formData.categoria.trim(),
      rol_id: Number(formData.rol_id),
      activo: Number(formData.activo),
    });
  };

  const handleClose = () => {
    if (loading) return;

    setFormData(initialFormData);
    setErrors({});
    setSubmitted(false);

    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={modalTitleSx}>
        <Box>
          <Typography
            sx={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1a237e",
            }}
          >
            {isEdit
              ? "Editar tipo de transacción"
              : "Crear tipo de transacción"}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: "#607d8b",
              fontWeight: 400,
            }}
          >
            {isEdit
              ? "Modifica la información del tipo de movimiento seleccionado."
              : "Completa la información para registrar un nuevo tipo de movimiento."}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={modalContentSx}>

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1,
            color: "#78909c",
          }}
        >
          * Campos obligatorios
        </Typography>
        
        <TextField
          label="Descripción"
          fullWidth
          required
          margin="normal"
          value={formData.descripcion}
          onChange={handleChange("descripcion")}
          error={Boolean(errors.descripcion)}
          helperText={errors.descripcion || " "}
        />

        <TextField
          label="Categoría"
          fullWidth
          required
          margin="normal"
          value={formData.categoria}
          onChange={handleChange("categoria")}
          error={Boolean(errors.categoria)}
          helperText={errors.categoria || " "}
        />

        <FormControl
          fullWidth
          required
          margin="normal"
          error={Boolean(errors.rol_id)}
        >
          <InputLabel id="tipo-transaccion-rol-label">Rol</InputLabel>

          <Select
            labelId="tipo-transaccion-rol-label"
            value={formData.rol_id}
            label="Rol"
            onChange={handleChange("rol_id")}
          >
            <MenuItem value="">
              <em>Seleccionar rol</em>
            </MenuItem>

            {roles.length > 0 ? (
              roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.descripcion}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                No hay roles disponibles
              </MenuItem>
            )}
          </Select>

          <FormHelperText>{errors.rol_id || " "}</FormHelperText>
        </FormControl>

        {isEdit && (
          <FormControl
            fullWidth
            required
            margin="normal"
            error={Boolean(errors.activo)}
          >
            <InputLabel id="tipo-transaccion-estatus-label">Estatus</InputLabel>

            <Select
              labelId="tipo-transaccion-estatus-label"
              value={formData.activo}
              label="Estatus"
              onChange={handleChange("activo")}
            >
              <MenuItem value={1}>Activo</MenuItem>
              <MenuItem value={0}>Inactivo</MenuItem>
            </Select>

            <FormHelperText>{errors.activo || " "}</FormHelperText>
          </FormControl>
        )}
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={loading}
          sx={modalSecondaryButtonSx}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={modalPrimaryButtonSx}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TipoTransaccionModal;
