import {
  useEffect,
  useState,
} from "react";

import {
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
  disponible: 1,
  activo: 1,
};

const UbicacionModal = ({
  open,
  mode = "create",
  data = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const isEdit = mode === "edit";

  const [formData, setFormData] =
    useState(initialFormData);

  const [errors, setErrors] = useState({
    descripcion: "",
    disponible: "",
    activo: "",
  });

  // =========================================
  // CARGAR / LIMPIAR FORMULARIO
  // =========================================

  useEffect(() => {
    if (!open) return;

    if (isEdit && data) {
      setFormData({
        id: data.id ?? "",
        descripcion:
          data.descripcion ?? "",
        disponible:
          Number(data.disponible ?? 1),
        activo:
          Number(data.activo ?? 1),
      });
    } else {
      setFormData({
        ...initialFormData,
      });
    }

    setErrors({
      descripcion: "",
      disponible: "",
      activo: "",
    });
  }, [open, isEdit, data]);

  // =========================================
  // CAMBIOS
  // =========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // =========================================
  // VALIDACIÓN
  // =========================================

  const validateForm = () => {
    const newErrors = {};

    if (
      !String(
        formData.descripcion ?? "",
      ).trim()
    ) {
      newErrors.descripcion =
        "Campo obligatorio";
    }

    if (
      formData.disponible === "" ||
      formData.disponible === null ||
      formData.disponible === undefined
    ) {
      newErrors.disponible =
        "Campo obligatorio";
    }

    if (
      isEdit &&
      (
        formData.activo === "" ||
        formData.activo === null ||
        formData.activo === undefined
      )
    ) {
      newErrors.activo =
        "Campo obligatorio";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // =========================================
  // GUARDAR
  // =========================================

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      id: formData.id,

      descripcion:
        formData.descripcion.trim(),

      disponible:
        Number(formData.disponible),
    };

    if (isEdit) {
      payload.activo =
        Number(formData.activo);
    }

    onSave(payload);
  };

  // =========================================
  // CERRAR
  // =========================================

  const handleClose = () => {
    if (loading) return;

    onClose();
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      {/* ============================= */}
      {/* HEADER */}
      {/* ============================= */}

      <DialogTitle sx={modalTitleSx}>
        <Typography
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1a237e",
          }}
        >
          {isEdit
            ? "Editar ubicación"
            : "Crear ubicación"}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#607d8b",
          }}
        >
          {isEdit
            ? "Actualiza la información de la ubicación seleccionada."
            : "Registra una nueva ubicación dentro de la bodega."}
        </Typography>
      </DialogTitle>

      {/* ============================= */}
      {/* CONTENIDO */}
      {/* ============================= */}

      <DialogContent sx={modalContentSx}>
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            color: "#607d8b",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          Los campos marcados con * son
          obligatorios.
        </Typography>

        {/* DESCRIPCIÓN */}

        <TextField
          name="descripcion"
          label="Descripción"
          value={formData.descripcion}
          onChange={handleChange}
          fullWidth
          required
          autoFocus
          margin="normal"
          error={
            Boolean(errors.descripcion)
          }
          helperText={
            errors.descripcion || " "
          }
        />

        {/* DISPONIBLE */}

        <FormControl
          fullWidth
          required
          margin="normal"
          error={
            Boolean(errors.disponible)
          }
        >
          <InputLabel id="ubicacion-disponible-label">
            Disponible para ventas
          </InputLabel>

          <Select
            labelId="ubicacion-disponible-label"
            name="disponible"
            label="Disponible para ventas"
            value={formData.disponible}
            onChange={handleChange}
          >
            <MenuItem value={1}>
              Disponible para ventas
            </MenuItem>

            <MenuItem value={0}>
              No disponible
            </MenuItem>
          </Select>

          <FormHelperText>
            {errors.disponible || " "}
          </FormHelperText>
        </FormControl>

        {/* ESTATUS SOLO EDICIÓN */}

        {isEdit && (
          <FormControl
            fullWidth
            required
            margin="normal"
            error={
              Boolean(errors.activo)
            }
          >
            <InputLabel id="ubicacion-activo-label">
              Estatus
            </InputLabel>

            <Select
              labelId="ubicacion-activo-label"
              name="activo"
              label="Estatus"
              value={formData.activo}
              onChange={handleChange}
            >
              <MenuItem value={1}>
                Activo
              </MenuItem>

              <MenuItem value={0}>
                Inactivo
              </MenuItem>
            </Select>

            <FormHelperText>
              {errors.activo || " "}
            </FormHelperText>
          </FormControl>
        )}
      </DialogContent>

      {/* ============================= */}
      {/* BOTONES */}
      {/* ============================= */}

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
          {loading
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Crear ubicación"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UbicacionModal;