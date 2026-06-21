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
import Swal from "sweetalert2";

const NuevoRolModal = ({ open, onClose, onCreated }) => {
  const [descripcion, setDescripcion] = useState("");

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const cerrarModal = () => {
    setDescripcion("");
    onClose();
  };

  const crearRol = async () => {
    try {
      if (!descripcion.trim()) {
        Swal.fire({
          title: "Campo requerido",
          text: "Escribe el nombre del rol",
          icon: "warning",
          customClass: {
            container: "swal-encima-modal",
          },
        });

        return;
      }

      const resp = await axios.post(`${apiUrl}/usuarios/roles`, {
        descripcion: descripcion.trim(),
      });

      if (onCreated) {
        onCreated(resp.data.data);
      }

      setDescripcion("");
      onClose();

      Swal.fire({
        icon: "success",
        title: "Rol agregado",
        text: "Ya puedes asignarlo al usuario.",
        timer: 1800,
        showConfirmButton: false,
        customClass: {
          container: "swal-encima-modal",
        },
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Error al crear rol",
        icon: "error",
        customClass: {
          container: "swal-encima-modal",
        },
      });
    }
  };

  return (
    <Dialog open={open} onClose={cerrarModal} maxWidth="xs" fullWidth>
      <DialogTitle>Crear Rol</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Nombre del rol"
          margin="normal"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ejemplo: Lider Marketing"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={cerrarModal}>Cancelar</Button>
        <Button variant="contained" onClick={crearRol}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevoRolModal;
