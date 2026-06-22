import React, { useEffect, useState } from "react";
import axios from "axios";
import CancelarTareaModal from "./CancelarTareaModal";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";

const DetalleTareaPublicacionModal = ({
  open,
  onClose,
  tarea,
  onActualizado,
}) => {
  const [usuarios, setUsuarios] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [modoReasignar, setModoReasignar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [openCancelar, setOpenCancelar] = useState(false);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("user"));

  const rolesPermitidosReasignar = [
    "administrador",
    "Coordinador comercial",
    "Lider Marketing",
  ];

  const puedeReasignar = rolesPermitidosReasignar.includes(
    usuario?.rol_descripcion,
  );

  const obtenerResponsables = async () => {
    try {
      const resp = await axios.get(
        `${apiUrl}/publicacionesMejoras/responsablesMarketing`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        const data = resp.data.data || [];
        setUsuarios(data);

        const idsActuales = String(tarea?.responsables_ids || "")
          .split(",")
          .map((id) => Number(id))
          .filter(Boolean);

        const seleccionados = data.filter((u) =>
          idsActuales.includes(Number(u.id_usuario)),
        );

        setResponsables(seleccionados);
      }
    } catch (error) {
      console.error("Error al obtener responsables:", error);
    }
  };

  const cambiarEstatus = async (estatus) => {
    if (!tarea?.id) return;

    try {
      setGuardando(true);
      setError("");

      const resp = await axios.patch(
        `${apiUrl}/publicacionesMejoras/${tarea.id}/estatus`,
        { estatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        onActualizado();
      }
    } catch (error) {
      console.error("Error al cambiar estatus:", error);
      setError("No se pudo cambiar el estatus de la tarea.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarResponsables = async () => {
    if (!tarea?.id) return;

    try {
      setGuardando(true);
      setError("");

      const responsablesIds = responsables.map((u) => u.id_usuario);

      const resp = await axios.patch(
        `${apiUrl}/publicacionesMejoras/${tarea.id}/responsables`,
        {
          responsables: responsablesIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        setModoReasignar(false);
        onActualizado();
      }
    } catch (error) {
      console.error("Error al reasignar responsables:", error);
      setError(
        error.response?.data?.message ||
          "No se pudieron reasignar los responsables.",
      );
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    if (open && tarea) {
      setModoReasignar(false);
      setError("");
      obtenerResponsables();
    }
  }, [open, tarea]);

  const obtenerChipEstatus = (estatus) => {
    const map = {
      pendiente: { label: "Pendiente", color: "warning" },
      en_proceso: { label: "En proceso", color: "info" },
      realizado: { label: "Realizado", color: "success" },
      cancelado: { label: "Cancelado", color: "error" },
    };

    return (
      map[estatus] || { label: estatus || "Sin estatus", color: "default" }
    );
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const estatus = obtenerChipEstatus(tarea?.estatus);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: "bold" }}>Detalle de tarea</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {tarea?.title || "Sin publicación"}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            SKU: {tarea?.sku || "Sin SKU"} | Publicación:{" "}
            {tarea?.publicacion_id || "Sin ID"}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Chip label={estatus.label} color={estatus.color} />
          <Chip
            label={`Compromiso: ${formatoFecha(tarea?.fecha_compromiso)}`}
            variant="outlined"
          />
          <Chip
            label={`Creada: ${formatoFecha(tarea?.created_at)}`}
            variant="outlined"
          />
        </Box>

        <Typography variant="subtitle2" fontWeight="bold">
          Descripción de la tarea
        </Typography>

        <Typography variant="body2" sx={{ mb: 2, whiteSpace: "pre-line" }}>
          {tarea?.descripcion_mejora || "Sin descripción"}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" fontWeight="bold">
          Responsables
        </Typography>

        {!modoReasignar ? (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {tarea?.responsables || "Sin asignar"}
          </Typography>
        ) : (
          <Autocomplete
            multiple
            options={usuarios}
            value={responsables}
            onChange={(event, newValue) => setResponsables(newValue)}
            getOptionLabel={(option) =>
              `${option.nombre} (${option.rol_descripcion})`
            }
            isOptionEqualToValue={(option, value) =>
              option.id_usuario === value.id_usuario
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Responsables"
                placeholder="Selecciona responsables"
              />
            )}
            sx={{ mb: 2 }}
          />
        )}

        <Typography variant="body2" color="text.secondary">
          Creado por: {tarea?.creado_por || "Sin registro"}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Asignado por: {tarea?.asignado_por || "Sin registro"}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {puedeReasignar && !modoReasignar && (
            <Button
              variant="outlined"
              onClick={() => setModoReasignar(true)}
              disabled={guardando}
            >
              Reasignar responsables
            </Button>
          )}

          {puedeReasignar && modoReasignar && (
            <>
              <Button
                variant="contained"
                onClick={guardarResponsables}
                disabled={guardando}
              >
                Guardar responsables
              </Button>

              <Button
                variant="outlined"
                onClick={() => setModoReasignar(false)}
                disabled={guardando}
              >
                Cancelar reasignación
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {tarea?.estatus === "pendiente" && (
            <Button
              variant="outlined"
              onClick={() => cambiarEstatus("en_proceso")}
              disabled={guardando}
            >
              Iniciar
            </Button>
          )}

          {tarea?.estatus !== "realizado" && tarea?.estatus !== "cancelado" && (
            <Button
              variant="contained"
              color="success"
              onClick={() => cambiarEstatus("realizado")}
              disabled={guardando}
            >
              Finalizar
            </Button>
          )}

          {tarea?.estatus !== "realizado" && tarea?.estatus !== "cancelado" && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setOpenCancelar(true)}
              disabled={guardando}
            >
              Cancelar tarea
            </Button>
          )}

          <Button onClick={onClose} disabled={guardando}>
            Cerrar
          </Button>
        </Box>
      </DialogActions>

      <CancelarTareaModal
        open={openCancelar}
        onClose={() => setOpenCancelar(false)}
        tarea={tarea}
        onActualizado={onActualizado}
      />
    </Dialog>
  );
};

export default DetalleTareaPublicacionModal;
