import React, { useEffect, useState } from "react";

import axios from "axios";

import {
  Autocomplete,
  Box,
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
} from "../../common/modalStyles";

import { swalSuccess } from "../../../helpers/sweetAlert";
import { handleApiError } from "../../../helpers/apiErrorHandler";

// =========================================================
// LÍMITES
// =========================================================

const LIMITES = {
  titulo: 255,
  descripcion: 2000,
  origen: 100,
};

// =========================================================
// VALORES INICIALES
// =========================================================

const formularioInicial = {
  titulo: "",
  descripcion: "",
  responsable_ids: [],
  prioridad: "media",
  origen: "",
  fecha_objetivo: "",
};

const erroresIniciales = {
  titulo: "",
};

// =========================================================
// COMPONENTE
// =========================================================

const PlanTrabajoTareaModal = ({
  open,
  onClose,
  tarea = null,
  administradores = [],
  onSaved,
}) => {
  // =========================================================
  // CONFIG
  // =========================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  // =========================================================
  // STATES
  // =========================================================

  const [formulario, setFormulario] = useState(formularioInicial);

  const [errores, setErrores] = useState(erroresIniciales);

  const [submitted, setSubmitted] = useState(false);

  const [saving, setSaving] = useState(false);

  const esEdicion = Boolean(tarea?.id);

  // =========================================================
  // CARGAR DATOS
  // =========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrores(erroresIniciales);
    setSubmitted(false);

    if (!tarea) {
      setFormulario(formularioInicial);
      return;
    }

    const fechaObjetivo = tarea.fecha_objetivo
      ? String(tarea.fecha_objetivo).slice(0, 10)
      : "";

    setFormulario({
      titulo: tarea.titulo || "",

      descripcion: tarea.descripcion || "",

      responsable_ids: Array.isArray(tarea.responsable_ids)
        ? tarea.responsable_ids.map(Number)
        : [],

      prioridad: tarea.prioridad || "media",

      origen: tarea.origen || "",

      fecha_objetivo: fechaObjetivo,
    });
  }, [open, tarea]);

  // =========================================================
  // VALIDACIÓN
  // =========================================================

  const validate = (values = formulario) => {
    const nuevosErrores = {
      titulo: "",
      orden: "",
    };

    if (!values.titulo.trim()) {
      nuevosErrores.titulo = "Campo obligatorio";
    }

    return nuevosErrores;
  };

  const tieneErrores = (validationErrors) =>
    Object.values(validationErrors).some((value) => Boolean(value));

  // =========================================================
  // CAMBIOS GENERALES
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    const nuevosValores = {
      ...formulario,
      [name]: value,
    };

    setFormulario(nuevosValores);

    if (submitted) {
      setErrores(validate(nuevosValores));
    } else if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // =========================================================
  // RESPONSABLES
  // =========================================================

  const responsablesSeleccionados = administradores.filter((admin) =>
    formulario.responsable_ids.some(
      (id) => Number(id) === Number(admin.id_usuario),
    ),
  );

  const handleResponsablesChange = (_event, nuevosResponsables) => {
    setFormulario((prev) => ({
      ...prev,

      responsable_ids: nuevosResponsables.map((admin) =>
        Number(admin.id_usuario),
      ),
    }));
  };

  // =========================================================
  // CERRAR
  // =========================================================

  const handleClose = () => {
    if (saving) {
      return;
    }

    setFormulario(formularioInicial);

    setErrores(erroresIniciales);

    setSubmitted(false);

    onClose();
  };

  // =========================================================
  // GUARDAR
  // =========================================================

  const handleSubmit = async () => {
    setSubmitted(true);

    const validationErrors = validate();

    setErrores(validationErrors);

    if (tieneErrores(validationErrors)) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        titulo: formulario.titulo.trim(),

        descripcion: formulario.descripcion.trim() || null,

        responsable_ids: formulario.responsable_ids,

        prioridad: formulario.prioridad,

        origen: formulario.origen.trim() || null,

        fecha_objetivo: formulario.fecha_objetivo || null,
      };

      if (esEdicion) {
        await axios.patch(`${apiUrl}/planTrabajo/tareas/${tarea.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.post(`${apiUrl}/planTrabajo/tareas`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setFormulario(formularioInicial);

      setErrores(erroresIniciales);

      setSubmitted(false);

      onClose();

      swalSuccess(
        esEdicion ? "Tarea actualizada" : "Tarea creada",
        esEdicion
          ? "La tarea se actualizó correctamente."
          : "La nueva tarea se creó correctamente.",
      );

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: esEdicion
          ? "No se pudo actualizar la tarea."
          : "No se pudo crear la tarea.",

        warningTitle: esEdicion
          ? "No se pudo actualizar la tarea"
          : "No se pudo crear la tarea",
      });
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <DialogTitle sx={modalTitleSx}>
        <Typography
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1a237e",
          }}
        >
          {esEdicion ? "Editar tarea" : "Nueva tarea"}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#607d8b",
          }}
        >
          {esEdicion
            ? "Actualiza la información de la tarea seleccionada."
            : "Registra una nueva actividad dentro del plan de trabajo administrativo."}
        </Typography>
      </DialogTitle>

      {/* =====================================================
          CONTENIDO
      ====================================================== */}

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

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* =================================================
              TÍTULO
          ================================================== */}

          <TextField
            name="titulo"
            label="Título"
            fullWidth
            required
            margin="normal"
            value={formulario.titulo}
            onChange={handleChange}
            error={Boolean(errores.titulo)}
            helperText={
              errores.titulo
                ? `${errores.titulo} · ${formulario.titulo.length}/${LIMITES.titulo} caracteres`
                : `${formulario.titulo.length}/${LIMITES.titulo} caracteres`
            }
            inputProps={{
              maxLength: LIMITES.titulo,
            }}
            autoFocus
          />

          {/* =================================================
              DESCRIPCIÓN
          ================================================== */}

          <TextField
            name="descripcion"
            label="Descripción"
            fullWidth
            multiline
            minRows={3}
            margin="normal"
            value={formulario.descripcion}
            onChange={handleChange}
            helperText={`${formulario.descripcion.length}/${LIMITES.descripcion} caracteres`}
            inputProps={{
              maxLength: LIMITES.descripcion,
            }}
          />

          {/* =================================================
              RESPONSABLES
          ================================================== */}

          <Autocomplete
            multiple
            fullWidth
            options={administradores}
            value={responsablesSeleccionados}
            onChange={handleResponsablesChange}
            getOptionLabel={(option) => option?.nombre || ""}
            isOptionEqualToValue={(option, value) =>
              Number(option.id_usuario) === Number(value.id_usuario)
            }
            noOptionsText="No se encontraron administradores"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Responsables"
                placeholder={
                  formulario.responsable_ids.length === 0
                    ? "Buscar administrador..."
                    : ""
                }
                margin="normal"
                helperText="Opcional. Busca y selecciona uno o varios administradores."
              />
            )}
          />

          {/* =================================================
              PRIORIDAD
          ================================================== */}

          <FormControl fullWidth margin="normal">
            <InputLabel>Prioridad</InputLabel>

            <Select
              name="prioridad"
              value={formulario.prioridad}
              label="Prioridad"
              onChange={handleChange}
            >
              <MenuItem value="baja">Baja</MenuItem>

              <MenuItem value="media">Media</MenuItem>

              <MenuItem value="alta">Alta</MenuItem>

              <MenuItem value="urgente">Urgente</MenuItem>
            </Select>
          </FormControl>

          {/* =================================================
              FECHA OBJETIVO
          ================================================== */}

          <TextField
            name="fecha_objetivo"
            label="Fecha objetivo"
            type="date"
            fullWidth
            margin="normal"
            value={formulario.fecha_objetivo}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* =================================================
              ORIGEN
          ================================================== */}

          <TextField
            name="origen"
            label="Origen"
            placeholder="Ej. Junta semanal"
            fullWidth
            margin="normal"
            value={formulario.origen}
            onChange={handleChange}
            helperText={`${formulario.origen.length}/${LIMITES.origen} caracteres`}
            inputProps={{
              maxLength: LIMITES.origen,
            }}
          />
        </Box>
      </DialogContent>

      {/* =====================================================
          ACCIONES
      ====================================================== */}

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
          {saving
            ? "Guardando..."
            : esEdicion
              ? "Guardar cambios"
              : "Crear tarea"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanTrabajoTareaModal;
