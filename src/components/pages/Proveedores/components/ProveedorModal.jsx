import { useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
} from "../../../common/modalStyles";

const initialFormData = {
  id_proveedor: "",
  razon_social: "",
  rfc: "",
  correo: "",
  surtido: 1,
  backorder: 1,
  estado: 1,
  sku_proveedor: "",
};

const ProveedorModal = ({
  open,
  mode = "create",
  data = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({
    razon_social: "",
    rfc: "",
    surtido: "",
    backorder: "",
    estado: "",
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (isEdit && data) {
      setFormData({
        ...initialFormData,
        ...data,
        surtido: data.surtido ?? 1,
        backorder: data.backorder ?? 1,
        estado: data.estado ?? 1,
        sku_proveedor: data.sku_proveedor ?? "",
      });
    } else {
      setFormData(initialFormData);
    }

    setErrors({
      razon_social: "",
      rfc: "",
      surtido: "",
      backorder: "",
      estado: "",
    });

    setSubmitted(false);
  }, [open, isEdit, data]);

  const validateField = (name, value) => {
    switch (name) {
      case "razon_social":
        if (!String(value ?? "").trim()) {
          return "Campo obligatorio";
        }
        break;

      case "rfc":
        if (!String(value ?? "").trim()) {
          return "Campo obligatorio";
        }
        break;

      case "surtido":
        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return "Campo obligatorio";
        }

        if (
          Number.isNaN(Number(value)) ||
          Number(value) < 0 ||
          !Number.isInteger(Number(value))
        ) {
          return "Debe ser un número entero mayor o igual a 0";
        }
        break;

      case "backorder":
        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return "Campo obligatorio";
        }
        break;

      case "estado":
        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return "Campo obligatorio";
        }
        break;

      default:
        break;
    }

    return "";
  };

  const validateForm = () => {
    const newErrors = {
      razon_social: validateField(
        "razon_social",
        formData.razon_social,
      ),
      rfc: validateField(
        "rfc",
        formData.rfc,
      ),
      surtido: validateField(
        "surtido",
        formData.surtido,
      ),
      backorder: validateField(
        "backorder",
        formData.backorder,
      ),
      estado: isEdit
        ? validateField(
            "estado",
            formData.estado,
          )
        : "",
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some(Boolean);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (submitted) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    } else if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSurtidoChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        surtido: "",
      }));

      if (submitted) {
        setErrors((prev) => ({
          ...prev,
          surtido: validateField(
            "surtido",
            "",
          ),
        }));
      }

      return;
    }

    if (/^\d+$/.test(value)) {
      const numericValue = Number(value);

      setFormData((prev) => ({
        ...prev,
        surtido: numericValue,
      }));

      if (submitted) {
        setErrors((prev) => ({
          ...prev,
          surtido: validateField(
            "surtido",
            numericValue,
          ),
        }));
      }
    }
  };

  const handleClose = () => {
    if (loading) return;

    setFormData(initialFormData);
    setSubmitted(false);

    setErrors({
      razon_social: "",
      rfc: "",
      surtido: "",
      backorder: "",
      estado: "",
    });

    onClose();
  };

  const handleSubmit = () => {
    setSubmitted(true);

    const isValid = validateForm();

    if (!isValid) return;

    const payload = {
      id_proveedor: formData.id_proveedor,
      razon_social: formData.razon_social.trim(),
      rfc: formData.rfc.trim(),
      correo: formData.correo.trim(),
      surtido: Number(formData.surtido),
      backorder: Number(formData.backorder),
      sku_proveedor: formData.sku_proveedor.trim(),
    };

    if (isEdit) {
      payload.estado = Number(formData.estado);
    }

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
          {isEdit
            ? "Editar proveedor"
            : "Crear proveedor"}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#607d8b",
          }}
        >
          {isEdit
            ? "Actualiza la información del proveedor seleccionado."
            : "Registra un nuevo proveedor dentro de APHELIOS."}
        </Typography>
      </DialogTitle>

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
          Los campos marcados con * son obligatorios.
        </Typography>

        <TextField
          name="razon_social"
          label="Razón social"
          fullWidth
          required
          margin="normal"
          value={formData.razon_social}
          onChange={handleChange}
          error={Boolean(errors.razon_social)}
          helperText={
            errors.razon_social || " "
          }
          autoFocus
        />

        <TextField
          name="rfc"
          label="RFC"
          fullWidth
          required
          margin="normal"
          value={formData.rfc}
          onChange={handleChange}
          error={Boolean(errors.rfc)}
          helperText={errors.rfc || " "}
        />

        <TextField
          name="correo"
          label="Correo"
          fullWidth
          margin="normal"
          type="email"
          value={formData.correo}
          onChange={handleChange}
          helperText=" "
        />

        <TextField
          name="surtido"
          label="Surtido MRP"
          fullWidth
          required
          margin="normal"
          type="number"
          value={formData.surtido}
          onChange={handleSurtidoChange}
          error={Boolean(errors.surtido)}
          helperText={errors.surtido || " "}
          inputProps={{
            min: 0,
            step: 1,
            inputMode: "numeric",
            pattern: "[0-9]*",
          }}
        />

        <FormControl
          fullWidth
          required
          margin="normal"
          error={Boolean(errors.backorder)}
        >
          <InputLabel id="proveedor-backorder-label">
            Back Order
          </InputLabel>

          <Select
            labelId="proveedor-backorder-label"
            name="backorder"
            label="Back Order"
            value={formData.backorder}
            onChange={handleChange}
          >
            <MenuItem value={1}>
              Activo
            </MenuItem>

            <MenuItem value={0}>
              Inactivo
            </MenuItem>
          </Select>

          {errors.backorder && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                ml: 1.75,
                color: "error.main",
              }}
            >
              {errors.backorder}
            </Typography>
          )}
        </FormControl>

        <TextField
          name="sku_proveedor"
          label="SKU"
          fullWidth
          margin="normal"
          value={formData.sku_proveedor}
          onChange={handleChange}
          helperText=" "
        />

        {isEdit && (
          <FormControl
            fullWidth
            required
            margin="normal"
            error={Boolean(errors.estado)}
          >
            <InputLabel id="proveedor-estado-label">
              Estatus
            </InputLabel>

            <Select
              labelId="proveedor-estado-label"
              name="estado"
              label="Estatus"
              value={formData.estado}
              onChange={handleChange}
            >
              <MenuItem value={1}>
                Activo
              </MenuItem>

              <MenuItem value={0}>
                Inactivo
              </MenuItem>
            </Select>

            {errors.estado && (
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  ml: 1.75,
                  color: "error.main",
                }}
              >
                {errors.estado}
              </Typography>
            )}
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
          {loading
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Crear proveedor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProveedorModal;