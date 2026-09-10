import { useEffect, useRef, useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../../../common/modalStyles";

const initialFormData = {
  inv_seguridad: "1.0",
  inv_maximo: "1.0",
};

const InventariosMRPModal = ({
  open,
  proveedor = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const seguridadRef = useRef(null);

  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({
    inv_seguridad: "",
    inv_maximo: "",
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFormData(initialFormData);

    setErrors({
      inv_seguridad: "",
      inv_maximo: "",
    });

    setSubmitted(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      seguridadRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeout);
  }, [open]);

  const validateField = (name, value) => {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "Campo obligatorio";
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return "Ingresa un valor válido";
    }

    if (numericValue < 0) {
      return "El valor no puede ser negativo";
    }

    if (!/^\d+(\.\d)?$/.test(String(value))) {
      return "Solo se permite un decimal";
    }

    return "";
  };

  const validateForm = () => {
    const newErrors = {
      inv_seguridad: validateField(
        "inv_seguridad",
        formData.inv_seguridad,
      ),
      inv_maximo: validateField(
        "inv_maximo",
        formData.inv_maximo,
      ),
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some(Boolean);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        [name]: "",
      }));

      if (submitted) {
        setErrors((prev) => ({
          ...prev,
          [name]: validateField(name, ""),
        }));
      }

      return;
    }

    if (/^\d+(\.\d)?$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (submitted) {
        setErrors((prev) => ({
          ...prev,
          [name]: validateField(name, value),
        }));
      }
    }
  };

  const handleClose = () => {
    if (loading) return;

    setFormData(initialFormData);

    setErrors({
      inv_seguridad: "",
      inv_maximo: "",
    });

    setSubmitted(false);

    onClose();
  };

  const handleSubmit = () => {
    setSubmitted(true);

    const isValid = validateForm();

    if (!isValid) return;

    const payload = {
      inv_seguridad: Number(
        formData.inv_seguridad,
      ).toFixed(1),

      inv_maximo: Number(
        formData.inv_maximo,
      ).toFixed(1),
    };

    onSave(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={modalTitleSx}>
        <Typography
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1a237e",
          }}
        >
          Ajustar inventarios MRP
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#607d8b",
          }}
        >
          Actualiza los valores de inventario de forma masiva
          para las publicaciones del proveedor.
        </Typography>
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            color: "#455a64",
            fontWeight: 600,
          }}
        >
          Proveedor:{" "}
          {proveedor?.razon_social || "Sin proveedor seleccionado"}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 1,
            color: "#607d8b",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          Los campos marcados con * son obligatorios.
        </Typography>

        <TextField
          inputRef={seguridadRef}
          name="inv_seguridad"
          label="Inventario de seguridad"
          type="number"
          fullWidth
          required
          margin="normal"
          value={formData.inv_seguridad}
          onChange={handleChange}
          error={Boolean(errors.inv_seguridad)}
          helperText={errors.inv_seguridad || " "}
          inputProps={{
            min: 0,
            step: 0.5,
            inputMode: "decimal",
          }}
        />

        <TextField
          name="inv_maximo"
          label="Inventario máximo"
          type="number"
          fullWidth
          required
          margin="normal"
          value={formData.inv_maximo}
          onChange={handleChange}
          error={Boolean(errors.inv_maximo)}
          helperText={errors.inv_maximo || " "}
          inputProps={{
            min: 0,
            step: 0.5,
            inputMode: "decimal",
          }}
        />
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

export default InventariosMRPModal;