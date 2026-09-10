import { useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

import axios from "axios";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../../../common/modalStyles";

import { swalSuccess } from "../../../../helpers/sweetAlert";
import { handleApiError } from "../../../../helpers/apiErrorHandler";

const NuevoRolModal = ({ open, onClose, onCreated }) => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const validate = (value = descripcion) => {
    if (!value.trim()) {
      return "Campo obligatorio";
    }

    return "";
  };

  const handleChange = (event) => {
    const value = event.target.value;

    setDescripcion(value);

    if (submitted) {
      setError(validate(value));
    } else if (error) {
      setError("");
    }
  };

  const handleClose = () => {
    if (saving) return;

    setDescripcion("");
    setError("");
    setSubmitted(false);

    onClose();
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    const validationError = validate();
    setError(validationError);

    if (validationError) return;

    try {
      setSaving(true);

      const response = await axios.post(
        `${apiUrl}/usuarios/roles`,
        {
          descripcion: descripcion.trim(),
        },
      );

      const nuevoRol =
        response.data?.rol ||
        response.data?.data ||
        response.data;

      setDescripcion("");
      setError("");
      setSubmitted(false);

      onClose();

      swalSuccess(
        "Rol creado",
        "El nuevo rol se creó correctamente",
      );

      if (onCreated) {
        await onCreated(nuevoRol);
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo crear el rol.",
        warningTitle: "No se pudo crear el rol",
      });
    } finally {
      setSaving(false);
    }
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
          Crear nuevo rol
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#607d8b",
          }}
        >
          Registra un nuevo rol para asignarlo posteriormente a los usuarios.
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
          label="Nombre del rol"
          fullWidth
          required
          margin="normal"
          value={descripcion}
          onChange={handleChange}
          error={Boolean(error)}
          helperText={error || " "}
          autoFocus
        />
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={saving}
          sx={modalSecondaryButtonSx}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          sx={modalPrimaryButtonSx}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevoRolModal;