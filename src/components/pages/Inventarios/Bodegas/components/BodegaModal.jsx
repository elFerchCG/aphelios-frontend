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
} from "../../../../common/modalStyles";

const initialFormData = {
  id: "",
  nombre: "",
  tipo: "",
  neteable: 1,
  rol_id: "",
  activo: 1,
};

const BodegaModal = ({
  open,
  mode = "create",
  data = null,
  roles = [],
  loading = false,
  onClose,
  onSave,
}) => {
  const isEdit = mode === "edit";

  const [formData, setFormData] =
    useState(initialFormData);

  const [errors, setErrors] = useState({
    nombre: "",
    tipo: "",
    neteable: "",
    rol_id: "",
    activo: "",
  });

  const [submitted, setSubmitted] =
    useState(false);

  // ==============================
  // CARGAR DATOS
  // ==============================

  useEffect(() => {
    if (!open) return;

    if (isEdit && data) {
      setFormData({
        id: data.id ?? "",
        nombre: data.Nombre ?? data.nombre ?? "",
        tipo: data.Tipo ?? data.tipo ?? "",
        neteable:
          data.Neteable ??
          data.neteable ??
          1,
        rol_id: data.rol_id ?? "",
        activo: data.activo ?? 1,
      });
    } else {
      setFormData(initialFormData);
    }

    setErrors({
      nombre: "",
      tipo: "",
      neteable: "",
      rol_id: "",
      activo: "",
    });

    setSubmitted(false);
  }, [open, isEdit, data]);

  // ==============================
  // VALIDACIONES
  // ==============================

  const validateField = (name, value) => {
    switch (name) {
      case "nombre":
        if (!String(value ?? "").trim()) {
          return "Campo obligatorio";
        }
        break;

      case "tipo":
        if (!String(value ?? "").trim()) {
          return "Campo obligatorio";
        }
        break;

      case "neteable":
        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return "Campo obligatorio";
        }
        break;

      case "rol_id":
        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return "Campo obligatorio";
        }
        break;

      case "activo":
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
      nombre: validateField(
        "nombre",
        formData.nombre,
      ),

      tipo: validateField(
        "tipo",
        formData.tipo,
      ),

      neteable: validateField(
        "neteable",
        formData.neteable,
      ),

      rol_id: validateField(
        "rol_id",
        formData.rol_id,
      ),

      activo: isEdit
        ? validateField(
            "activo",
            formData.activo,
          )
        : "",
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some(Boolean);
  };

  // ==============================
  // CAMBIOS
  // ==============================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (submitted) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(
          name,
          value,
        ),
      }));
    } else if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // ==============================
  // CERRAR
  // ==============================

  const handleClose = () => {
    if (loading) return;

    setFormData(initialFormData);

    setErrors({
      nombre: "",
      tipo: "",
      neteable: "",
      rol_id: "",
      activo: "",
    });

    setSubmitted(false);

    onClose();
  };

  // ==============================
  // GUARDAR
  // ==============================

  const handleSubmit = () => {
    setSubmitted(true);

    if (!validateForm()) return;

    const payload = {
      id: formData.id,
      nombre: formData.nombre.trim(),
      tipo: formData.tipo.trim(),
      neteable: Number(formData.neteable),
      rol_id: Number(formData.rol_id),
    };

    if (isEdit) {
      payload.activo = Number(
        formData.activo,
      );
    }

    onSave(payload);
  };

  // ==============================
  // RENDER
  // ==============================

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
            ? "Editar bodega"
            : "Crear bodega"}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#607d8b",
          }}
        >
          {isEdit
            ? "Actualiza la información de la bodega seleccionada."
            : "Registra una nueva bodega dentro de APHELIOS."}
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

        {/* NOMBRE */}

        <TextField
          name="nombre"
          label="Nombre"
          fullWidth
          required
          margin="normal"
          value={formData.nombre}
          onChange={handleChange}
          error={Boolean(errors.nombre)}
          helperText={
            errors.nombre || " "
          }
          autoFocus
        />

        {/* TIPO */}

        <TextField
          name="tipo"
          label="Tipo"
          fullWidth
          required
          margin="normal"
          value={formData.tipo}
          onChange={handleChange}
          error={Boolean(errors.tipo)}
          helperText={
            errors.tipo || " "
          }
        />

        {/* DISPONIBLE PARA VENTAS */}

        <FormControl
          fullWidth
          required
          margin="normal"
          error={Boolean(errors.neteable)}
        >
          <InputLabel id="bodega-neteable-label">
            Disponible para ventas
          </InputLabel>

          <Select
            labelId="bodega-neteable-label"
            name="neteable"
            label="Disponible para ventas"
            value={formData.neteable}
            onChange={handleChange}
          >
            <MenuItem value={1}>
              Disponible para ventas
            </MenuItem>

            <MenuItem value={0}>
              No disponible
            </MenuItem>
          </Select>

          {errors.neteable && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                ml: 1.75,
                color: "error.main",
              }}
            >
              {errors.neteable}
            </Typography>
          )}
        </FormControl>

        {/* ROL */}

        <FormControl
          fullWidth
          required
          margin="normal"
          error={Boolean(errors.rol_id)}
        >
          <InputLabel id="bodega-rol-label">
            Rol
          </InputLabel>

          <Select
            labelId="bodega-rol-label"
            name="rol_id"
            label="Rol"
            value={formData.rol_id}
            onChange={handleChange}
          >
            <MenuItem value="">
              <em>Seleccionar rol</em>
            </MenuItem>

            {roles.length > 0 ? (
              roles.map((role) => (
                <MenuItem
                  key={role.id}
                  value={role.id}
                >
                  {role.descripcion}
                </MenuItem>
              ))
            ) : (
              <MenuItem
                value=""
                disabled
              >
                No hay roles disponibles
              </MenuItem>
            )}
          </Select>

          {errors.rol_id && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                ml: 1.75,
                color: "error.main",
              }}
            >
              {errors.rol_id}
            </Typography>
          )}
        </FormControl>

        {/* ESTATUS - SOLO EDICIÓN */}

        {isEdit && (
          <FormControl
            fullWidth
            required
            margin="normal"
            error={Boolean(errors.activo)}
          >
            <InputLabel id="bodega-activo-label">
              Estatus
            </InputLabel>

            <Select
              labelId="bodega-activo-label"
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

            {errors.activo && (
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  ml: 1.75,
                  color: "error.main",
                }}
              >
                {errors.activo}
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
              : "Crear bodega"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BodegaModal;