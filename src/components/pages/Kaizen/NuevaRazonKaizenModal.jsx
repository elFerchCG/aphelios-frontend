import React, { useState } from "react";
import axios from "axios";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import {
  swalSuccess,
  swalError,
  swalWarning,
} from "../../../helpers/sweetAlert";

const NuevaRazonKaizenModal = ({ open, onClose, onSaved }) => {
  const [descripcion, setDescripcion] = useState("");

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const cerrarModal = () => {
    setDescripcion("");
    onClose();
  };

  const guardarRazon = async () => {
    try {
      if (!descripcion.trim()) {
        swalWarning("Campo requerido", "La descripción es obligatoria");
        return;
      }

      const token = localStorage.getItem("token");

      const resp = await axios.post(
        `${apiUrl}/kaizen/razones`,
        {
          descripcion: descripcion.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        swalSuccess(
          "Razón creada",
          resp.data.message || "Razón creada correctamente",
        );

        const nuevaRazon = resp.data.data;

        setDescripcion("");

        if (onSaved) {
          onSaved(resp.data.data || resp.data);
        }

        onClose();
      }
    } catch (error) {
      console.error("Error al crear razón:", error);

      swalError(
        "Error",
        error.response?.data?.message || "Error al crear la razón Kaizen",
      );
    }
  };

  return (
    <Dialog open={open} onClose={cerrarModal} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight="bold">Nueva Razón Kaizen</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Descripción"
          size="small"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ejemplo: Falta de publicidad en Mercado Libre"
          sx={{ mt: 1 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={cerrarModal}>Cancelar</Button>

        <Button variant="contained" onClick={guardarRazon}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevaRazonKaizenModal;
