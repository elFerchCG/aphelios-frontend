import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
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
  Divider,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";

// =====================================================================
// Diálogo "Generar pedidos": elige qué ventas se usan para la tendencia
// (3 modos) y si es una simulación. El backend vuelve a validar todo
// (GET /mrp/ventana-ventas y POST /mrp/iniciar).
// =====================================================================

export const MODOS_VENTAS = {
  SEMANAS_COMPLETAS: "SEMANAS_COMPLETAS",
  RANGO_PERSONALIZADO: "RANGO_PERSONALIZADO",
  ULTIMOS_35_DIAS: "ULTIMOS_35_DIAS",
};

// Deben coincidir con RANGO_MIN_DIAS / RANGO_MAX_DIAS del backend
// (mercadoLibreRequests/tendenciaVentas.js); el backend manda los suyos
// en `limites` y esos tienen prioridad.
const MIN_DIAS_DEFAULT = 35;
const MAX_DIAS_DEFAULT = 63;
const DIAS_BLOQUE = 7;
const DIAS_AVISO_ANTIGUEDAD = 28;

const OPCIONES = [
  {
    value: MODOS_VENTAS.SEMANAS_COMPLETAS,
    titulo: "Últimas 5 semanas completas",
    descripcion:
      "Las 5 semanas completas de lunes a domingo anteriores a la semana actual. Es la forma en que se ha calculado hasta ahora.",
  },
  {
    value: MODOS_VENTAS.RANGO_PERSONALIZADO,
    titulo: "Rango de fechas personalizado",
    descripcion: "Tú eliges las fechas de ventas a considerar (de 35 a 63 días).",
  },
  {
    value: MODOS_VENTAS.ULTIMOS_35_DIAS,
    titulo: "Últimos 35 días",
    descripcion:
      "Del día de ayer hacia atrás 35 días, en 5 bloques de 7 días. Incluye las ventas de los días de esta semana que ya terminaron.",
  },
];

const fmt = (f) => (f ? dayjs(f).format("DD/MM/YYYY") : "—");

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Validación inmediata en pantalla (la definitiva la hace el backend).
function validarRangoLocal(desde, hasta, minDias, maxDias) {
  if (!desde || !hasta) return { ok: false, error: "Selecciona la fecha inicial y la fecha final." };
  const d = dayjs(desde);
  const h = dayjs(hasta);
  if (!d.isValid() || !h.isValid()) return { ok: false, error: "Fecha no válida." };
  const ayer = dayjs().startOf("day").subtract(1, "day");
  if (h.isBefore(d, "day")) return { ok: false, error: "La fecha final no puede ser anterior a la inicial." };
  if (h.isAfter(ayer, "day")) {
    return {
      ok: false,
      error: `La fecha final debe ser como máximo ayer (${ayer.format("DD/MM/YYYY")}): las ventas de hoy aún no están completas.`,
    };
  }
  const dias = h.diff(d, "day") + 1;
  if (dias < minDias) {
    return { ok: false, dias, error: `Seleccionaste ${dias} días; el mínimo es ${minDias} (5 semanas).` };
  }
  if (dias > maxDias) {
    return { ok: false, dias, error: `Seleccionaste ${dias} días; el máximo es ${maxDias} (9 semanas).` };
  }
  return { ok: true, dias, bloques: Math.floor(dias / DIAS_BLOQUE), sobrantes: dias % DIAS_BLOQUE };
}

export default function GenerarPedidoDialog({ open, onClose, onConfirm, apiUrl, proveedor, backorder }) {
  const ayer = dayjs().startOf("day").subtract(1, "day");

  const [modo, setModo] = useState(MODOS_VENTAS.SEMANAS_COMPLETAS);
  const [desde, setDesde] = useState(ayer.subtract(MIN_DIAS_DEFAULT - 1, "day").format("YYYY-MM-DD"));
  const [hasta, setHasta] = useState(ayer.format("YYYY-MM-DD"));
  const [simulacion, setSimulacion] = useState(false);

  const [limites, setLimites] = useState({ minDias: MIN_DIAS_DEFAULT, maxDias: MAX_DIAS_DEFAULT });
  const [previas, setPrevias] = useState({}); // modo -> ventana (fijos)
  const [previaRango, setPreviaRango] = useState(null);
  const [errorRango, setErrorRango] = useState(null);
  const [cargandoRango, setCargandoRango] = useState(false);

  // Al abrir: reinicia y trae las fechas de las opciones 1 y 3.
  useEffect(() => {
    if (!open) return;
    const base = dayjs().startOf("day").subtract(1, "day");
    setModo(MODOS_VENTAS.SEMANAS_COMPLETAS);
    setSimulacion(false);
    setDesde(base.subtract(MIN_DIAS_DEFAULT - 1, "day").format("YYYY-MM-DD"));
    setHasta(base.format("YYYY-MM-DD"));

    let cancel = false;
    (async () => {
      const resultado = {};
      for (const m of [MODOS_VENTAS.SEMANAS_COMPLETAS, MODOS_VENTAS.ULTIMOS_35_DIAS]) {
        try {
          const { data } = await axios.get(`${apiUrl}/mrp/ventana-ventas`, {
            ...getAuthHeaders(),
            params: { modo: m },
          });
          resultado[m] = data?.ventana || null;
          if (data?.limites) setLimites(data.limites);
        } catch (e) {
          resultado[m] = null;
        }
      }
      if (!cancel) setPrevias(resultado);
    })();
    return () => {
      cancel = true;
    };
  }, [open, apiUrl]);

  const validacionLocal = useMemo(
    () => validarRangoLocal(desde, hasta, limites.minDias, limites.maxDias),
    [desde, hasta, limites],
  );

  // Rango personalizado: confirma con el backend (con pausa para no pedir en cada tecla).
  useEffect(() => {
    if (!open || modo !== MODOS_VENTAS.RANGO_PERSONALIZADO) return;
    setPreviaRango(null);
    setErrorRango(null);
    if (!validacionLocal.ok) return;

    let cancel = false;
    setCargandoRango(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/mrp/ventana-ventas`, {
          ...getAuthHeaders(),
          params: { modo, desde, hasta },
        });
        if (!cancel) setPreviaRango(data?.ventana || null);
      } catch (e) {
        if (!cancel) setErrorRango(e?.response?.data?.message || "No se pudo validar el rango.");
      } finally {
        if (!cancel) setCargandoRango(false);
      }
    }, 400);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [open, modo, desde, hasta, validacionLocal.ok, apiUrl]);

  const ventanaElegida =
    modo === MODOS_VENTAS.RANGO_PERSONALIZADO ? previaRango : previas[modo] || null;

  const puedeConfirmar =
    modo === MODOS_VENTAS.RANGO_PERSONALIZADO
      ? validacionLocal.ok && !!previaRango && !errorRango && !cargandoRango
      : true;

  const rangoAntiguo =
    modo === MODOS_VENTAS.RANGO_PERSONALIZADO &&
    validacionLocal.ok &&
    dayjs().startOf("day").diff(dayjs(hasta), "day") > DIAS_AVISO_ANTIGUEDAD;

  const confirmar = () => {
    onConfirm({
      modo_ventas: modo,
      ventas_desde: modo === MODOS_VENTAS.RANGO_PERSONALIZADO ? desde : null,
      ventas_hasta: modo === MODOS_VENTAS.RANGO_PERSONALIZADO ? hasta : null,
      simulacion,
      descripcion: ventanaElegida?.descripcion || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="subtitle1" component="div" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <ShoppingCartOutlinedIcon color="primary" /> Generar pedido
          {proveedor && (
            <Chip size="small" label={proveedor} sx={{ fontWeight: 700, bgcolor: "#e3f2fd", color: "primary.main" }} />
          )}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", ml: 4 }}>
          Backorder: {backorder ? "Sí (se mantienen los pendientes abiertos)" : "No (se cierran los pendientes antes de generar)"}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Ventas a considerar */}
          <Box>
            <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, mb: 1 }}>
              <InsightsOutlinedIcon color="primary" fontSize="small" /> Ventas a considerar para la tendencia
            </Typography>

            <RadioGroup value={modo} onChange={(e) => setModo(e.target.value)}>
              <Stack spacing={1}>
                {OPCIONES.map((op) => {
                  const activa = modo === op.value;
                  const previa = previas[op.value];
                  return (
                    <Paper
                      key={op.value}
                      variant="outlined"
                      onClick={() => setModo(op.value)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        cursor: "pointer",
                        borderColor: activa ? "primary.main" : "divider",
                        bgcolor: activa ? "#f5f9ff" : "background.paper",
                      }}
                    >
                      <FormControlLabel
                        value={op.value}
                        control={<Radio size="small" />}
                        sx={{ m: 0, alignItems: "flex-start", width: "100%" }}
                        label={
                          <Box sx={{ pt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {op.titulo}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                              {op.descripcion}
                            </Typography>
                            {previa && (
                              <Typography variant="caption" sx={{ display: "block", fontWeight: 600, color: "primary.main", mt: 0.5 }}>
                                Se usarán del {fmt(previa.fechaInicio)} al {fmt(previa.fechaFin)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />

                      {op.value === MODOS_VENTAS.RANGO_PERSONALIZADO && activa && (
                        <Box sx={{ mt: 1.5, ml: 4 }} onClick={(e) => e.stopPropagation()}>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                            <TextField
                              type="date"
                              size="small"
                              label="Desde"
                              value={desde}
                              onChange={(e) => setDesde(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              inputProps={{ max: hasta || ayer.format("YYYY-MM-DD") }}
                            />
                            <TextField
                              type="date"
                              size="small"
                              label="Hasta"
                              value={hasta}
                              onChange={(e) => setHasta(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              inputProps={{ min: desde || undefined, max: ayer.format("YYYY-MM-DD") }}
                            />
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              {validacionLocal.dias != null && (
                                <Chip
                                  size="small"
                                  label={`${validacionLocal.dias} días`}
                                  color={validacionLocal.ok ? "success" : "error"}
                                  sx={{ fontWeight: 700 }}
                                />
                              )}
                              {validacionLocal.ok && (
                                <Chip size="small" label={`${validacionLocal.bloques} bloques de 7 días`} sx={{ fontWeight: 600 }} />
                              )}
                              {cargandoRango && <CircularProgress size={18} />}
                            </Box>
                          </Stack>

                          <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
                            <strong>¿Por qué de {limites.minDias} a {limites.maxDias} días?</strong> La tendencia se
                            calcula con una regresión lineal sobre las ventas agrupadas en bloques de 7 días. Con menos
                            de 5 bloques ({limites.minDias} días), una sola semana atípica (una promoción, un agotado,
                            un día festivo) cambia por completo la tendencia y el pedido sale muy alto o muy bajo. Con
                            más de 9 bloques ({limites.maxDias} días), las ventas viejas pesan igual que las recientes y
                            la tendencia deja de reflejar cómo se está vendiendo hoy.
                          </Alert>

                          {!validacionLocal.ok && validacionLocal.error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {validacionLocal.error}
                            </Alert>
                          )}
                          {errorRango && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {errorRango}
                            </Alert>
                          )}
                          {validacionLocal.ok && validacionLocal.sobrantes > 0 && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                              Los bloques de 7 días se cuentan hacia atrás desde la fecha final. Los primeros{" "}
                              <strong>{validacionLocal.sobrantes} día(s)</strong> del rango no completan un bloque y{" "}
                              <strong>no se usarán</strong>
                              {previaRango ? ` (se usará del ${fmt(previaRango.fechaInicio)} al ${fmt(previaRango.fechaFin)})` : ""}.
                            </Alert>
                          )}
                          {rangoAntiguo && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                              El rango termina hace más de {DIAS_AVISO_ANTIGUEDAD} días: vas a pronosticar con ventas de
                              hace más de un mes.
                            </Alert>
                          )}
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            </RadioGroup>
          </Box>

          <Divider />

          {/* Simulación */}
          <Box>
            <FormControlLabel
              control={<Switch checked={simulacion} onChange={(e) => setSimulacion(e.target.checked)} color="warning" />}
              label={
                <Typography variant="body2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                  <ScienceOutlinedIcon fontSize="small" color={simulacion ? "warning" : "action"} /> Modo simulación
                </Typography>
              }
            />
            {simulacion && (
              <Alert severity="warning" variant="outlined" sx={{ mt: 1 }}>
                Se ejecuta el pedido completo para calcular la orden de compra, se genera el Excel y se guarda en S3
                (lo puedes descargar al terminar o después desde <strong>Procesos → Archivos MRP</strong>). Al final{" "}
                <strong>se revierte todo</strong>: no se crean pedidos, líneas de pedido, órdenes de compra ni órdenes de
                producción, no se cierran pendientes y los cálculos del MRP quedan como estaban.
              </Alert>
            )}
          </Box>

          {ventanaElegida && (
            <Alert severity={simulacion ? "warning" : "success"} icon={false}>
              <strong>{simulacion ? "Simulación" : "Pedido"}:</strong> {ventanaElegida.descripcion}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={simulacion ? "warning" : "primary"}
          disabled={!puedeConfirmar}
          onClick={confirmar}
          startIcon={simulacion ? <ScienceOutlinedIcon /> : <ShoppingCartOutlinedIcon />}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {simulacion ? "Ejecutar simulación" : "Generar pedido"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
