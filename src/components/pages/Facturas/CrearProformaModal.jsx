import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";

const swalConfig = {
  didOpen: () => {
    const swalContainer = document.querySelector(".swal2-container");
    if (swalContainer) {
      swalContainer.style.zIndex = "20000";
    }
  },
};

const CrearProformaModal = ({ open, onClose, apiUrl, onCreated }) => {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  const limpiarFormulario = () => {
    setTitulo("");
    setDescripcion("");
  };

  const cerrarModal = () => {
    limpiarFormulario();
    onClose();
  };

  const handleCrear = async () => {
    if (!titulo.trim()) {
      Swal.fire({
        ...swalConfig,
        title: "Atención",
        text: "El título de la proforma es obligatorio.",
        icon: "warning",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${apiUrl}/facturas/proformas`, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
      });

      const nuevaProformaId = response.data.proforma_id;

      Swal.fire({
        ...swalConfig,
        title: "¡Listo!",
        text: "Proforma creada correctamente.",
        icon: "success",
      });

      limpiarFormulario();
      onCreated(nuevaProformaId);
      onClose();
    } catch (error) {
      Swal.fire({
        ...swalConfig,
        title: "Error",
        text: error.response?.data?.message || "Error al crear la proforma.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return;
        cerrarModal();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Crear nueva proforma</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Título de la proforma"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
        />

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={cerrarModal} disabled={loading}>
          Cancelar
        </Button>

        <Button variant="contained" onClick={handleCrear} disabled={loading}>
          {loading ? <CircularProgress size={22} /> : "Crear proforma"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CrearProformaModal;