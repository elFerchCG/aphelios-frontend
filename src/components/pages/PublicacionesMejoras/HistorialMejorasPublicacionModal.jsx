import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

const HistorialMejorasPublicacion = ({ open, onClose, publicacion }) => {
  const [mejoras, setMejoras] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const obtenerHistorial = async () => {
    if (!publicacion?.producto_id) return;

    try {
      setLoading(true);

      const resp = await axios.get(
        `${apiUrl}/publicacionesMejoras/publicaciones/historial/${publicacion.producto_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (resp.data.ok) {
        setMejoras(resp.data.data || []);
      }
    } catch (error) {
      console.error("Error al obtener historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstatus = async (mejoraId, estatus) => {
    try {
      await axios.put(
         `${apiUrl}/publicacionesMejoras/${mejoraId}/estatus`,
        { estatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      obtenerHistorial();
    } catch (error) {
      console.error("Error al cambiar estatus:", error);
    }
  };

  useEffect(() => {
    if (open) {
      obtenerHistorial();
    }
  }, [open, publicacion]);

  const formatoFechaHora = (fecha) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerChipEstatus = (estatus) => {
    const map = {
      pendiente: { label: "Pendiente", color: "warning" },
      en_proceso: { label: "En proceso", color: "info" },
      realizado: { label: "Realizado", color: "success" },
      cancelado: { label: "Cancelado", color: "error" },
    };

    return map[estatus] || { label: estatus || "Sin estatus", color: "default" };
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: "bold" }}>
        Historial de mejoras
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {publicacion?.title}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            SKU: {publicacion?.sku || "Sin SKU"} | Publicación:{" "}
            {publicacion?.publicacion_id || "Sin ID"}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : mejoras.length === 0 ? (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            Esta publicación todavía no tiene mejoras registradas.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {mejoras.map((mejora) => {
              const estatus = obtenerChipEstatus(mejora.estatus);

              return (
                <Paper
                  key={mejora.id}
                  elevation={3}
                  sx={{
                    p: 2,
                    borderLeft: "6px solid #1e88e5",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Typography fontWeight="bold">
                      Mejora #{mejora.id}
                    </Typography>

                    <Chip
                      label={estatus.label}
                      color={estatus.color}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {mejora.descripcion_mejora}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Responsables: {mejora.responsables || "Sin asignar"}
                  </Typography>

                  <br />

                  <Typography variant="caption" color="text.secondary">
                    Creado por: {mejora.creado_por || "Sin registro"} | Asignado
                    por: {mejora.asignado_por || "Sin registro"}
                  </Typography>

                  <br />

                  <Typography variant="caption" color="text.secondary">
                    Fecha compromiso:{" "}
                    {formatoFechaHora(mejora.fecha_compromiso)} | Creado:{" "}
                    {formatoFechaHora(mejora.created_at)}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                      mt: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    {mejora.estatus === "pendiente" && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          cambiarEstatus(mejora.id, "en_proceso")
                        }
                      >
                        Iniciar
                      </Button>
                    )}

                    {mejora.estatus !== "realizado" &&
                      mejora.estatus !== "cancelado" && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() =>
                            cambiarEstatus(mejora.id, "realizado")
                          }
                        >
                          Finalizar
                        </Button>
                      )}

                    {mejora.estatus !== "cancelado" &&
                      mejora.estatus !== "realizado" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            cambiarEstatus(mejora.id, "cancelado")
                          }
                        >
                          Cancelar
                        </Button>
                      )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistorialMejorasPublicacion;