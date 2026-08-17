import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import NuevaAccionKaizenModal from "./NuevaAccionKaizenModal";

const HistorialKaizenModal = ({
  open,
  onClose,
  producto,
  soloLectura = false,
  onAccionRegistrada,
}) => {
  const [kaizens, setKaizens] = useState([]);
  const [mejorasPublicacion, setMejorasPublicacion] = useState([]);

  const [tabHistorial, setTabHistorial] = useState(0);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");

  const [razones, setRazones] = useState([]);
  const [openNuevaAccion, setOpenNuevaAccion] = useState(false);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const obtenerFechaLocal = (fecha, incluirHora = false) => {
    if (!fecha) {
      return "";
    }

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return "";
    }

    return fechaConvertida.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...(incluirHora
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    });
  };

  const obtenerColorEstatus = (estatus) => {
    switch (estatus) {
      case "activo":
      case "en_proceso":
        return "primary";

      case "cerrado":
      case "realizado":
        return "success";

      case "pendiente":
        return "warning";

      case "cancelado":
        return "error";

      default:
        return "default";
    }
  };

  const obtenerEtiquetaEstatus = (estatus) => {
    switch (estatus) {
      case "activo":
        return "Activo";

      case "cerrado":
        return "Cerrado";

      case "pendiente":
        return "Pendiente";

      case "en_proceso":
        return "En proceso";

      case "realizado":
        return "Realizado";

      case "cancelado":
        return "Cancelado";

      default:
        return estatus || "Sin estatus";
    }
  };

  const obtenerHistorial = async () => {
    const productoId = Number(producto?.producto_id);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      setKaizens([]);
      setMejorasPublicacion([]);
      setErrorHistorial(
        "No se pudo identificar el producto seleccionado.",
      );

      return;
    }

    try {
      setLoadingHistorial(true);
      setErrorHistorial("");

      const resp = await axios.get(
        `${apiUrl}/kaizen/historial/${productoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!resp.data?.ok) {
        setKaizens([]);
        setMejorasPublicacion([]);

        setErrorHistorial(
          resp.data?.message ||
            "No fue posible cargar el historial.",
        );

        return;
      }

      const data = resp.data.data || {};

      setKaizens(
        Array.isArray(data.kaizens)
          ? data.kaizens
          : [],
      );

      setMejorasPublicacion(
        Array.isArray(data.mejorasPublicacion)
          ? data.mejorasPublicacion
          : [],
      );
    } catch (error) {
      console.error(
        "Error al obtener el historial completo:",
        error,
      );

      setKaizens([]);
      setMejorasPublicacion([]);

      setErrorHistorial(
        error.response?.data?.message ||
          "Ocurrió un error al cargar el historial del producto.",
      );
    } finally {
      setLoadingHistorial(false);
    }
  };

  const obtenerRazones = async () => {
    try {
      const resp = await axios.get(
        `${apiUrl}/kaizen/razones`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        setRazones(resp.data.data || []);
      }
    } catch (error) {
      console.error(
        "Error al obtener razones Kaizen:",
        error,
      );
    }
  };

  const abrirNuevaAccion = () => {
    setOpenNuevaAccion(true);
  };

  const historialUnificado = useMemo(() => {
    const registrosKaizen = kaizens.map((item) => ({
      ...item,
      tipoHistorial: "kaizen",
      keyHistorial: `kaizen-${item.id}`,
      fechaOrden:
        item.fecha_cierre ||
        item.fecha_kaizen ||
        item.fecha_seguimiento ||
        null,
    }));

    const registrosMejoras = mejorasPublicacion.map(
      (item) => ({
        ...item,
        tipoHistorial: "mejora",
        keyHistorial: `mejora-${item.id}`,
        fechaOrden:
          item.updated_at ||
          item.fecha_realizado ||
          item.created_at ||
          null,
      }),
    );

    return [
      ...registrosKaizen,
      ...registrosMejoras,
    ].sort((a, b) => {
      const fechaA = a.fechaOrden
        ? new Date(a.fechaOrden).getTime()
        : 0;

      const fechaB = b.fechaOrden
        ? new Date(b.fechaOrden).getTime()
        : 0;

      return fechaB - fechaA;
    });
  }, [kaizens, mejorasPublicacion]);

  const registrosVisibles = useMemo(() => {
    if (tabHistorial === 1) {
      return kaizens.map((item) => ({
        ...item,
        tipoHistorial: "kaizen",
        keyHistorial: `kaizen-${item.id}`,
      }));
    }

    if (tabHistorial === 2) {
      return mejorasPublicacion.map((item) => ({
        ...item,
        tipoHistorial: "mejora",
        keyHistorial: `mejora-${item.id}`,
      }));
    }

    return historialUnificado;
  }, [
    tabHistorial,
    kaizens,
    mejorasPublicacion,
    historialUnificado,
  ]);

  useEffect(() => {
    if (open && producto?.producto_id) {
      setTabHistorial(0);
      setOpenNuevaAccion(false);

      obtenerHistorial();
      obtenerRazones();
    }
  }, [open, producto?.producto_id]);

  useEffect(() => {
    if (!open) {
      setKaizens([]);
      setMejorasPublicacion([]);
      setErrorHistorial("");
      setTabHistorial(0);
      setOpenNuevaAccion(false);
    }
  }, [open]);

  if (!producto) {
    return null;
  }

  const renderKaizen = (item) => {
    const estaCerrado = item.estatus === "cerrado";

    return (
      <Box
        key={item.keyHistorial || `kaizen-${item.id}`}
        sx={{
          p: 2,
          mb: 2,
          border: estaCerrado
            ? "1px solid #d6d6d6"
            : "1px solid #e0e0e0",
          borderLeft: "5px solid",
          borderLeftColor: estaCerrado
            ? "grey.400"
            : "warning.main",
          borderRadius: 2,
          backgroundColor: estaCerrado
            ? "#f5f5f5"
            : "#fff",
          opacity: estaCerrado ? 0.8 : 1,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={2}
        >
          <Box>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              flexWrap="wrap"
            >
              <Typography fontWeight="bold">
                Razón {item.razon_codigo}:{" "}
                {item.razon_descripcion}
              </Typography>

              <Chip
                label="Kaizen Ventas"
                color="warning"
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          <Chip
            label={obtenerEtiquetaEstatus(item.estatus)}
            color={obtenerColorEstatus(item.estatus)}
            size="small"
          />
        </Box>

        <Typography variant="body2" mt={1}>
          {item.acciones_mejora ||
            "Sin acciones de mejora registradas"}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1}
        >
          Fecha Kaizen:{" "}
          {obtenerFechaLocal(item.fecha_kaizen) ||
            "Sin fecha"}{" "}
          | Seguimiento:{" "}
          {obtenerFechaLocal(item.fecha_seguimiento) ||
            "Sin fecha"}{" "}
          | Responsables:{" "}
          {item.responsables || "Sin responsables"}
        </Typography>

        {estaCerrado && (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Cierre:{" "}
              {item.tipo_cierre || "No especificado"}{" "}
              | Fecha cierre:{" "}
              {obtenerFechaLocal(item.fecha_cierre) ||
                "Sin fecha"}
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
                <strong>Motivo de cierre:</strong>{" "}
                {item.motivo_cierre}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const renderMejoraPublicacion = (item) => {
    const estaCancelada = item.estatus === "cancelado";
    const estaRealizada = item.estatus === "realizado";

    return (
      <Box
        key={item.keyHistorial || `mejora-${item.id}`}
        sx={{
          p: 2,
          mb: 2,
          border: "1px solid #e0e0e0",
          borderLeft: "5px solid",
          borderLeftColor: estaCancelada
            ? "error.main"
            : estaRealizada
              ? "success.main"
              : "info.main",
          borderRadius: 2,
          backgroundColor: estaCancelada
            ? "#fff5f5"
            : estaRealizada
              ? "#f5fff7"
              : "#fff",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={2}
        >
          <Box>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              flexWrap="wrap"
            >
              <Typography fontWeight="bold">
                Mejora #{item.id}
              </Typography>

              <Chip
                label="Mejora de publicación"
                color="info"
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          <Chip
            label={obtenerEtiquetaEstatus(item.estatus)}
            color={obtenerColorEstatus(item.estatus)}
            size="small"
          />
        </Box>

        <Typography variant="body2" mt={1}>
          {item.descripcion_mejora ||
            "Sin descripción de mejora"}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1}
        >
          Creado:{" "}
          {obtenerFechaLocal(item.created_at, true) ||
            "Sin fecha"}{" "}
          | Compromiso:{" "}
          {obtenerFechaLocal(item.fecha_compromiso) ||
            "Sin fecha"}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
        >
          Responsables:{" "}
          {item.responsables || "Sin responsables"}
        </Typography>

        {item.creado_por && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            Creado por: {item.creado_por}
          </Typography>
        )}

        {item.asignado_por && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            Asignado por: {item.asignado_por}
          </Typography>
        )}

        {item.fecha_realizado && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            Fecha realizado:{" "}
            {obtenerFechaLocal(
              item.fecha_realizado,
              true,
            )}
          </Typography>
        )}

        {item.motivo_cancelacion && (
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              p: 1,
              borderRadius: 1,
              backgroundColor: "#ffebee",
              color: "error.dark",
            }}
          >
            <strong>Motivo de cancelación:</strong>{" "}
            {item.motivo_cancelacion}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: "bold" }}>
        Historial del producto
      </DialogTitle>

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
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Producto
          </Typography>

          <Typography
            variant="h6"
            fontWeight="bold"
            mb={2}
            component={
              producto.permalink ? "a" : "div"
            }
            href={producto.permalink || undefined}
            target={
              producto.permalink
                ? "_blank"
                : undefined
            }
            rel={
              producto.permalink
                ? "noopener noreferrer"
                : undefined
            }
            sx={{
              display: "block",
              color: producto.permalink
                ? "#1976d2"
                : "inherit",
              textDecoration: "none",
              cursor: producto.permalink
                ? "pointer"
                : "default",
              "&:hover": {
                textDecoration: producto.permalink
                  ? "underline"
                  : "none",
              },
            }}
          >
            {producto.title}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption">
                SKU
              </Typography>

              <Typography fontWeight="bold">
                {producto.sku}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption">
                Ventas
              </Typography>

              <Typography fontWeight="bold">
                {producto.ventas_reales ??
                  producto.ventas ??
                  0}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption">
                Pronóstico
              </Typography>

              <Typography fontWeight="bold">
                {producto.pronostico ?? 0}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption">
                Diferencia
              </Typography>

              <Typography
                fontWeight="bold"
                color="error"
              >
                {producto.diferencia ?? 0}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Tabs
          value={tabHistorial}
          onChange={(_, nuevoValor) =>
            setTabHistorial(nuevoValor)
          }
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Tab
            label={`Todos (${
              kaizens.length +
              mejorasPublicacion.length
            })`}
          />

          <Tab
            label={`Kaizen Ventas (${kaizens.length})`}
          />

          <Tab
            label={`Mejoras de publicación (${mejorasPublicacion.length})`}
          />
        </Tabs>

        {loadingHistorial && (
          <Box
            sx={{
              py: 5,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {!loadingHistorial && errorHistorial && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorHistorial}
          </Alert>
        )}

        {!loadingHistorial &&
          !errorHistorial &&
          registrosVisibles.length === 0 && (
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
              Este producto aún no tiene registros
              en esta sección.
            </Box>
          )}

        {!loadingHistorial &&
          !errorHistorial &&
          registrosVisibles.map((item) =>
            item.tipoHistorial === "kaizen"
              ? renderKaizen(item)
              : renderMejoraPublicacion(item),
          )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          Cerrar
        </Button>

        {!soloLectura && (
          <Button
            variant="contained"
            onClick={abrirNuevaAccion}
          >
            Nueva acción
          </Button>
        )}
      </DialogActions>

      {!soloLectura && (
        <NuevaAccionKaizenModal
          open={openNuevaAccion}
          onClose={() =>
            setOpenNuevaAccion(false)
          }
          producto={producto}
          razones={razones}
          onSaved={() => {
            obtenerHistorial();

            if (onAccionRegistrada) {
              onAccionRegistrada(
                producto.producto_id,
              );
            }
          }}
          onRazonCreada={async (nuevaRazon) => {
            await obtenerRazones();

            if (nuevaRazon?.id) {
              setRazones((prev) => {
                const existe = prev.some(
                  (item) =>
                    item.id === nuevaRazon.id,
                );

                return existe
                  ? prev
                  : [...prev, nuevaRazon];
              });
            }
          }}
        />
      )}
    </Dialog>
  );
};

export default HistorialKaizenModal;