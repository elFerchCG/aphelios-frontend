import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  swalSuccess,
  swalError,
  swalWarning,
} from "../../../helpers/sweetAlert";

const EditarResponsablesKaizenModal = ({
  open,
  onClose,
  kaizen,
  onSaved,
  soloLectura = false,
}) => {
  const [usuariosAsignables, setUsuariosAsignables] = useState([]);
  const [responsables, setResponsables] = useState([]);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const obtenerUsuariosAsignables = async () => {
    try {
      const resp = await axios.get(`${apiUrl}/kaizen/usuariosAsignables`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        setUsuariosAsignables(resp.data.data);
      }
    } catch (error) {
      console.error("Error al obtener usuarios asignables:", error);
      swalError("Error", "No se pudieron cargar los usuarios asignables");
    }
  };

  const guardarResponsables = async () => {
    try {
      if (!responsables.length) {
        swalWarning(
          "Campos incompletos",
          "Debe asignar al menos un responsable",
        );
        return;
      }

      const resp = await axios.patch(
        `${apiUrl}/kaizen/${kaizen.id}/responsables`,
        {
          responsables,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        swalSuccess(
          "Responsables actualizados",
          resp.data.message || "Responsables actualizados correctamente",
        );

        if (onSaved) {
          onSaved();
        }

        onClose();
      }
    } catch (error) {
      console.error("Error al actualizar responsables:", error);

      swalError(
        "Error",
        error.response?.data?.message ||
          "Error al actualizar responsables del Kaizen",
      );
    }
  };

  useEffect(() => {
    if (open && kaizen) {
      obtenerUsuariosAsignables();

      const responsablesIniciales =
        kaizen.responsables_ids
          ?.split(",")
          .map((id) => Number(id))
          .filter(Boolean) || [];

      setResponsables(responsablesIniciales);
    }
  }, [open, kaizen]);

  if (!kaizen) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight="bold">Editar responsables Kaizen</DialogTitle>

      <DialogContent>
        <Box
          sx={{
            p: 2,
            mb: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            backgroundColor: "#fafafa",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Producto
          </Typography>

          <Typography fontWeight="bold" mb={1}>
            {kaizen.title}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            SKU
          </Typography>

          <Typography fontWeight="bold">{kaizen.sku}</Typography>
        </Box>

        <TextField
          select
          fullWidth
          label="Asignado a"
          size="small"
          value={responsables}
          disabled={soloLectura}
          onChange={(e) => {
            const value = e.target.value;

            setResponsables(
              typeof value === "string" ? value.split(",") : value,
            );
          }}
          SelectProps={{
            multiple: true,
            renderValue: (selected) => (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5,
                  maxHeight: 70,
                  overflowY: "auto",
                }}
              >
                {selected.map((usuarioId) => {
                  const usuario = usuariosAsignables.find(
                    (item) => item.id_usuario === Number(usuarioId),
                  );

                  return (
                    <Chip
                      key={usuarioId}
                      label={usuario?.nombre || usuarioId}
                      size="small"
                    />
                  );
                })}
              </Box>
            ),
          }}
        >
          {usuariosAsignables.map((usuario) => (
            <MenuItem key={usuario.id_usuario} value={usuario.id_usuario}>
              <Checkbox checked={responsables.includes(usuario.id_usuario)} />
              <ListItemText
                primary={usuario.nombre}
                secondary={usuario.rol_descripcion}
              />
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{soloLectura ? "Cerrar" : "Cancelar"}</Button>

        {!soloLectura && (
          <Button variant="contained" onClick={guardarResponsables}>
            Guardar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditarResponsablesKaizenModal;
