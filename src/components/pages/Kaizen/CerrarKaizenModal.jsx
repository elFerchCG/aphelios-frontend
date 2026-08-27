import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";

import {
  swalError,
  swalSuccess,
  swalWarning,
} from "../../../helpers/sweetAlert";

const CerrarKaizenModal = ({ open, onClose, producto, onSaved }) => {
  const [accionesActivas, setAccionesActivas] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState("");

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const usuarioLocal = JSON.parse(localStorage.getItem("user") || "{}");
  const rolDescripcion = usuarioLocal?.rol_descripcion;

  const usuarioId =
    usuarioLocal?.id_usuario || usuarioLocal?.id || usuarioLocal?.usuario_id;

  const puedeCerrarTodo =
    rolDescripcion === "administrador" ||
    rolDescripcion === "coordinador comercial" ||
    rolDescripcion === "Coordinador Comercial" ||
    rolDescripcion === "Lider Marketing" ||
    rolDescripcion === "Líder Marketing";

  const motivoValido = motivoCierre.trim().length > 0;

  const puedeCerrarAccion = (item) => {
    if (puedeCerrarTodo) return true;

    const responsablesIds = String(item.responsables_ids || "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter(Boolean);

    return responsablesIds.includes(Number(usuarioId));
  };

  const accionesPermitidas = accionesActivas.filter(puedeCerrarAccion);

  const obtenerFechaLocal = (fecha) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const obtenerAccionesActivas = async () => {
    if (!producto?.producto_id) return;

    try {
      setLoading(true);

      const resp = await axios.get(
        `${apiUrl}/kaizen/historial/${producto.producto_id}`,
        authConfig,
      );

      if (resp.data.ok) {
        const kaizens = Array.isArray(resp.data.data?.kaizens)
          ? resp.data.data.kaizens
          : [];

        const activas = kaizens.filter((item) => item.estatus === "activo");

        setAccionesActivas(activas);
        setSeleccionados([]);
        setMotivoCierre("");
      }
    } catch (error) {
      console.error("Error al obtener acciones activas:", error);

      setAccionesActivas([]);
      setSeleccionados([]);

      swalError("Error", "No se pudieron cargar las acciones Kaizen");
    } finally {
      setLoading(false);
    }
  };

  const toggleSeleccion = (kaizenId) => {
    const accion = accionesActivas.find((item) => item.id === kaizenId);

    if (!accion || !puedeCerrarAccion(accion)) return;

    setSeleccionados((prev) =>
      prev.includes(kaizenId)
        ? prev.filter((id) => id !== kaizenId)
        : [...prev, kaizenId],
    );
  };

  const seleccionarTodas = () => {
    setSeleccionados(accionesPermitidas.map((item) => item.id));
  };

  const limpiarSeleccion = () => {
    setSeleccionados([]);
  };

  const cerrarSeleccionadas = async () => {
    try {
      if (seleccionados.length === 0) {
        swalWarning(
          "Sin selección",
          "Selecciona al menos una acción Kaizen para cerrar",
        );
        return;
      }

      if (!motivoValido) {
        swalWarning(
          "Motivo requerido",
          "Escribe el motivo o propósito del cierre",
        );
        return;
      }

      const resp = await axios.patch(
        `${apiUrl}/kaizen/cerrarSeleccionados`,
        {
          kaizenIds: seleccionados,
          motivo_cierre: motivoCierre.trim(),
        },
        authConfig,
      );

      if (resp.data.ok) {
        swalSuccess(
          "Acciones cerradas",
          resp.data.message || "Acciones Kaizen cerradas correctamente",
        );

        if (onSaved) onSaved();
        onClose();
      }
    } catch (error) {
      console.error("Error al cerrar seleccionadas:", error);

      swalError(
        "Error",
        error.response?.data?.message ||
          "Error al cerrar acciones seleccionadas",
      );
    }
  };

  const cerrarTodas = async () => {
    try {
      if (!producto?.producto_id) return;

      if (!motivoValido) {
        swalWarning(
          "Motivo requerido",
          "Escribe el motivo o propósito del cierre",
        );
        return;
      }

      const idsPermitidos = accionesPermitidas.map((item) => item.id);

      if (idsPermitidos.length === 0) {
        swalWarning(
          "Sin permisos",
          "No tienes acciones Kaizen asignadas para cerrar.",
        );
        return;
      }

      const resp = await axios.patch(
        `${apiUrl}/kaizen/cerrarSeleccionados`,
        {
          kaizenIds: idsPermitidos,
          motivo_cierre: motivoCierre.trim(),
        },
        authConfig,
      );

      if (resp.data.ok) {
        swalSuccess(
          "Acciones cerradas",
          resp.data.message || "Todas tus acciones Kaizen fueron cerradas",
        );

        if (onSaved) onSaved();
        onClose();
      }
    } catch (error) {
      console.error("Error al cerrar todas:", error);

      swalError(
        "Error",
        error.response?.data?.message || "Error al cerrar todas las acciones",
      );
    }
  };

  useEffect(() => {
    if (open && producto?.producto_id) {
      obtenerAccionesActivas();
    }

    if (!open) {
      setAccionesActivas([]);
      setSeleccionados([]);
      setMotivoCierre("");
    }
  }, [open, producto?.producto_id]);

  if (!producto) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight="bold">Cerrar acciones Kaizen</DialogTitle>

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

          <Typography fontWeight="bold">{producto.title}</Typography>

          <Typography variant="caption" color="text.secondary">
            SKU
          </Typography>

          <Typography fontWeight="bold">{producto.sku}</Typography>
        </Box>

        <Typography fontWeight="bold" mb={1}>
          Acciones activas
        </Typography>

        {loading ? (
          <Typography color="text.secondary">Cargando acciones...</Typography>
        ) : accionesActivas.length === 0 ? (
          <Box
            sx={{
              p: 3,
              border: "1px dashed #bdbdbd",
              borderRadius: 2,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            No hay acciones activas para cerrar.
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Button
                size="small"
                onClick={seleccionarTodas}
                disabled={accionesPermitidas.length === 0}
              >
                Seleccionar todas permitidas
              </Button>

              <Button size="small" onClick={limpiarSeleccion}>
                Limpiar selección
              </Button>
            </Box>

            {accionesActivas.map((item) => {
              const checked = seleccionados.includes(item.id);
              const puedeCerrar = puedeCerrarAccion(item);

              return (
                <Card
                  key={item.id}
                  variant="outlined"
                  sx={{
                    mb: 1.5,
                    backgroundColor: !puedeCerrar
                      ? "#f5f5f5"
                      : checked
                        ? "#e3f2fd"
                        : "#fff",
                    borderColor: checked ? "#1976d2" : "#e0e0e0",
                    opacity: puedeCerrar ? 1 : 0.55,
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      alignItems: "flex-start",
                      py: 1.5,
                      "&:last-child": { pb: 1.5 },
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!puedeCerrar}
                      onChange={() => toggleSeleccion(item.id)}
                    />

                    <Box sx={{ flex: 1 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Typography fontWeight="bold">
                          Razón {item.razon_codigo}: {item.razon_descripcion}
                        </Typography>

                        <Chip
                          label={puedeCerrar ? "Activo" : "Solo lectura"}
                          color={puedeCerrar ? "primary" : "default"}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" mb={0.5}>
                        {item.acciones_mejora}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Seguimiento: {obtenerFechaLocal(item.fecha_seguimiento)}{" "}
                        | Responsables:{" "}
                        {item.responsables || "Sin responsables"}
                      </Typography>

                      {!puedeCerrar && (
                        <Typography
                          variant="caption"
                          color="error"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          No eres responsable de esta acción, solo puedes verla.
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}

            <Divider sx={{ mt: 3, mb: 3 }} />

            <Box>
              <TextField
                label="Motivo de cierre"
                value={motivoCierre}
                onChange={(e) => setMotivoCierre(e.target.value)}
                fullWidth
                multiline
                rows={4}
                required
                placeholder="Escribe el motivo o propósito del cierre de las acciones seleccionadas..."
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Este campo es obligatorio para continuar.
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>

        <Button
          variant="outlined"
          color="error"
          onClick={cerrarSeleccionadas}
          disabled={
            accionesPermitidas.length === 0 ||
            seleccionados.length === 0 ||
            !motivoValido
          }
        >
          Cerrar seleccionadas
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={cerrarTodas}
          disabled={accionesPermitidas.length === 0 || !motivoValido}
        >
          Cerrar todas permitidas
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CerrarKaizenModal;
