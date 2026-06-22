import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Chip,
} from "@mui/material";

import NuevaAccionKaizenModal from "./NuevaAccionKaizenModal";

const HistorialKaizenModal = ({
  open,
  onClose,
  producto,
  soloLectura = false,
  onAccionRegistrada,
}) => {
  const [historial, setHistorial] = useState([]);
  const [razones, setRazones] = useState([]);
  const [openNuevaAccion, setOpenNuevaAccion] = useState(false);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const obtenerFechaLocal = (fecha) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const obtenerHistorial = async () => {
    if (!producto?.producto_id) return;

    const resp = await axios.get(
      `${apiUrl}/kaizen/historial/${producto.producto_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (resp.data.ok) {
      setHistorial(resp.data.data);
    }
  };

  const obtenerRazones = async () => {
    const resp = await axios.get(`${apiUrl}/kaizen/razones`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (resp.data.ok) {
      setRazones(resp.data.data);
    }
  };

  const abrirNuevaAccion = () => {
    setOpenNuevaAccion(true);
  };

  useEffect(() => {
    if (open && producto) {
      obtenerHistorial();
      obtenerRazones();
      setOpenNuevaAccion(false);
    }
  }, [open, producto]);

  if (!producto) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Historial Kaizen</DialogTitle>

      <DialogContent>
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            backgroundColor: "#fafafa",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Producto
          </Typography>

          <Typography
            variant="h6"
            fontWeight="bold"
            mb={2}
            component={producto.permalink ? "a" : "div"}
            href={producto.permalink || undefined}
            target={producto.permalink ? "_blank" : undefined}
            rel={producto.permalink ? "noopener noreferrer" : undefined}
            sx={{
              display: "block",
              color: producto.permalink ? "#1976d2" : "inherit",
              textDecoration: "none",
              cursor: producto.permalink ? "pointer" : "default",
              "&:hover": {
                textDecoration: producto.permalink ? "underline" : "none",
              },
            }}
          >
            {producto.title}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption">SKU</Typography>
              <Typography fontWeight="bold">{producto.sku}</Typography>
            </Box>

            <Box>
              <Typography variant="caption">Ventas</Typography>
              <Typography fontWeight="bold">
                {producto.ventas_reales ?? producto.ventas ?? 0}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption">Pronóstico</Typography>
              <Typography fontWeight="bold">{producto.pronostico}</Typography>
            </Box>

            <Box>
              <Typography variant="caption">Diferencia</Typography>
              <Typography fontWeight="bold" color="error">
                {producto.diferencia}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="h6" fontWeight="bold" mb={1}>
          Historial
        </Typography>

        {historial.length === 0 ? (
          <Box
            sx={{
              p: 3,
              mb: 2,
              border: "1px dashed #bdbdbd",
              borderRadius: 2,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            Este producto aún no tiene acciones Kaizen registradas.
          </Box>
        ) : (
          historial.map((item) => {
            const estaCerrado = item.estatus === "cerrado";

            return (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  mb: 2,
                  border: estaCerrado
                    ? "1px solid #d6d6d6"
                    : "1px solid #e0e0e0",
                  borderRadius: 2,
                  backgroundColor: estaCerrado ? "#f5f5f5" : "#fff",
                  opacity: estaCerrado ? 0.75 : 1,
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography fontWeight="bold">
                    Razón {item.razon_codigo}: {item.razon_descripcion}
                  </Typography>

                  <Chip
                    label={estaCerrado ? "Cerrado" : "Activo"}
                    color={estaCerrado ? "default" : "primary"}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" mt={1}>
                  {item.acciones_mejora}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Fecha Kaizen: {obtenerFechaLocal(item.fecha_kaizen)} |{" "}
                  Seguimiento: {obtenerFechaLocal(item.fecha_seguimiento)} |{" "}
                  Responsables: {item.responsables || "Sin responsables"}
                </Typography>

                {estaCerrado && (
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Cierre: {item.tipo_cierre || "No especificado"} | Fecha
                      cierre: {obtenerFechaLocal(item.fecha_cierre)}
                    </Typography>

                    {item.motivo_cierre && (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: "#eeeeee",
                          color: "text.secondary",
                        }}
                      >
                        <strong>Motivo de cierre:</strong> {item.motivo_cierre}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>

        {!soloLectura && (
          <Button variant="contained" onClick={abrirNuevaAccion}>
            Nueva acción
          </Button>
        )}
      </DialogActions>

      {!soloLectura && (
        <NuevaAccionKaizenModal
          open={openNuevaAccion}
          onClose={() => setOpenNuevaAccion(false)}
          producto={producto}
          razones={razones}
          onSaved={() => {
            obtenerHistorial();

            if (onAccionRegistrada) {
              onAccionRegistrada(producto.producto_id);
            }
          }}
          onRazonCreada={async (nuevaRazon) => {
            await obtenerRazones();

            if (nuevaRazon?.id) {
              setRazones((prev) => {
                const existe = prev.some((item) => item.id === nuevaRazon.id);
                return existe ? prev : [...prev, nuevaRazon];
              });
            }
          }}
        />
      )}
    </Dialog>
  );
};

export default HistorialKaizenModal;
