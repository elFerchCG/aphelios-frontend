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
} from "../../../common/modalStyles";

const initialFormData = {
  id_usuario: "",
  nombre: "",
  password: "",
  pin: "",
  rol_id: "",
  estado: 1,
};

const UsuarioModal = ({
  open,
  mode = "create",
  data = null,
  roles = [],
  loading = false,
  onClose,
  onSave,
  onOpenRoleModal,
}) => {
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (isEdit && data) {
      setFormData({
        id_usuario: data.id_usuario ?? "",
        nombre: data.nombre ?? "",
        password: "",
        pin: "",
        rol_id: data.rol_id ?? "",
        estado: data.estado ?? 1,
      });
    } else {
      setFormData(initialFormData);
    }

    setErrors({});
    setSubmitted(false);
  }, [open, isEdit, data]);

  const validate = (values = formData) => {
    const newErrors = {};

    if (!values.nombre.trim()) {
      newErrors.nombre = "Campo obligatorio";
    }

    if (
      values.rol_id === "" ||
      values.rol_id === null ||
      values.rol_id === undefined
    ) {
      newErrors.rol_id = "Campo obligatorio";
    }

    if (!isEdit && !values.password.trim()) {
      newErrors.password = "Campo obligatorio";
    }

    if (
      isEdit &&
      values.estado !== 0 &&
      values.estado !== 1
    ) {
      newErrors.estado = "Campo obligatorio";
    }

    if (values.pin && values.pin.length < 4) {
      newErrors.pin = "El PIN debe tener entre 4 y 6 dígitos";
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

  const handlePinChange = (event) => {
    const value = event.target.value;

    if (
      value === "" ||
      (/^\d+$/.test(value) && value.length <= 6)
    ) {
      const nextData = {
        ...formData,
        pin: value,
      };

      setFormData(nextData);

      if (submitted) {
        setErrors(validate(nextData));
      } else if (errors.pin) {
        setErrors((prev) => ({
          ...prev,
          pin: undefined,
        }));
      }
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);

    const validationErrors = validate();

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = {
      id_usuario: formData.id_usuario,
      nombre: formData.nombre.trim(),
      rol_id: Number(formData.rol_id),
      estado: Number(formData.estado),
    };

    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    if (formData.pin.trim()) {
      payload.pin = formData.pin.trim();
    }

    if (!isEdit && !formData.pin.trim()) {
      payload.pin = null;
    }

    onSave(payload);
  };

  const handleClose = () => {
    if (loading) return;

    setFormData(initialFormData);
    setErrors({});
    setSubmitted(false);

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={modalTitleSx}>
        <Box>
          <Typography
            sx={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1a237e",
            }}
          >
            {isEdit ? "Editar usuario" : "Crear usuario"}
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
              ? "Modifica la información del usuario seleccionado."
              : "Registra un nuevo usuario y asigna el rol correspondiente dentro de APHELIOS."}
          </Typography>
        </Box>
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
          label="Nombre"
          fullWidth
          required
          margin="normal"
          value={formData.nombre}
          onChange={handleChange("nombre")}
          error={Boolean(errors.nombre)}
          helperText={errors.nombre || " "}
        />

        <TextField
          label={
            isEdit
              ? "Nueva contraseña"
              : "Contraseña"
          }
          fullWidth
          required={!isEdit}
          margin="normal"
          type="password"
          value={formData.password}
          onChange={handleChange("password")}
          error={Boolean(errors.password)}
          helperText={
            errors.password ||
            (isEdit
              ? "Déjala vacía si no deseas cambiarla."
              : " ")
          }
        />

        <TextField
          label={
            isEdit
              ? "Nuevo PIN de autorización"
              : "PIN de autorización"
          }
          fullWidth
          margin="normal"
          value={formData.pin}
          onChange={handlePinChange}
          error={Boolean(errors.pin)}
          helperText={
            errors.pin ||
            (isEdit
              ? "Opcional. Déjalo vacío si no deseas cambiarlo."
              : "Opcional. Debe contener entre 4 y 6 dígitos.")
          }
          inputProps={{
            maxLength: 6,
            inputMode: "numeric",
            pattern: "[0-9]*",
          }}
          placeholder="Solo números"
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            mt: 1,
          }}
        >
          <FormControl
            fullWidth
            required
            error={Boolean(errors.rol_id)}
          >
            <InputLabel id="usuario-rol-label">
              Rol
            </InputLabel>

            <Select
              labelId="usuario-rol-label"
              value={formData.rol_id}
              label="Rol"
              onChange={handleChange("rol_id")}
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
                <MenuItem value="" disabled>
                  No hay roles disponibles
                </MenuItem>
              )}
            </Select>

            <FormHelperText>
              {errors.rol_id || " "}
            </FormHelperText>
          </FormControl>

          {!isEdit && (
            <Button
              variant="outlined"
              onClick={onOpenRoleModal}
              sx={{
                mt: 0,
                minWidth: 110,
                height: 56,
                whiteSpace: "nowrap",
              }}
            >
              Nuevo rol
            </Button>
          )}
        </Box>

        {isEdit && (
          <FormControl
            fullWidth
            required
            margin="normal"
            error={Boolean(errors.estado)}
          >
            <InputLabel id="usuario-estatus-label">
              Estatus
            </InputLabel>

            <Select
              labelId="usuario-estatus-label"
              value={formData.estado}
              label="Estatus"
              onChange={handleChange("estado")}
            >
              <MenuItem value={1}>Activo</MenuItem>
              <MenuItem value={0}>Inactivo</MenuItem>
            </Select>

            <FormHelperText>
              {errors.estado || " "}
            </FormHelperText>
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

export default UsuarioModal;