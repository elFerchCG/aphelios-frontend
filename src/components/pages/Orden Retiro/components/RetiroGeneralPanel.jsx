import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
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
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import HistoryIcon from "@mui/icons-material/History";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import UndoIcon from "@mui/icons-material/Undo";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import MoveToInboxOutlinedIcon from "@mui/icons-material/MoveToInboxOutlined";

import AppDataGrid from "../../../common/AppDataGrid";
import PageToolbarCard from "../../../common/PageToolbarCard";
import { toolbarButtonSx } from "../../../common/formStyles";
import {
  modalActionsSx,
  modalContentSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
  modalTitleSx,
} from "../../../common/modalStyles";
import { handleApiError } from "../../../../helpers/apiErrorHandler";
import apiUrl from "../../../../config";

// Fases del retiro general (mismo orden que MRP/retiroGeneral.js).
const FASES = [
  { paso: "CALCULOS", label: "Actualizar cálculos de todas las publicaciones" },
  { paso: "RETIRO", label: "Generar orden de retiro y órdenes de producción" },
  { paso: "DOCUMENTOS", label: "Generar Excel de la orden de retiro" },
];

const ESTADO_EJECUCION = {
  PENDIENTE: { label: "Pendiente", color: "default" },
  PROCESANDO: { label: "Procesando", color: "info" },
  COMPLETADO: { label: "Completado", color: "success" },
  COMPLETADO_CON_ADVERTENCIAS: { label: "Completado con advertencias", color: "warning" },
  SIN_EXCEDENTES: { label: "Sin excedentes", color: "default" },
  ERROR: { label: "Error", color: "error" },
};

const EN_CURSO = ["PENDIENTE", "PROCESANDO"];
const POLLING_MS = 1500;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const formatFechaHora = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuracion = (ms) => {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1000) return `${n} ms`;
  const seg = Math.round(n / 1000);
  if (seg < 60) return `${seg} s`;
  return `${Math.floor(seg / 60)} min ${seg % 60} s`;
};

const fmtNum = (v) => Number(v ?? 0).toLocaleString("es-MX");

const EstadoChip = ({ estado, size = "small" }) => {
  const info = ESTADO_EJECUCION[estado] || { label: estado || "—", color: "default" };
  return <Chip label={info.label} color={info.color} size={size} sx={{ fontWeight: 600 }} />;
};

const IconoPaso = ({ estado, activo }) => {
  if (estado === "OK") return <CheckCircleIcon sx={{ color: "#2e7d32" }} />;
  if (estado === "ERROR") return <ErrorIcon sx={{ color: "#d32f2f" }} />;
  if (estado === "REVERTIDO") return <UndoIcon sx={{ color: "#ed6c02" }} />;
  if (estado === "OMITIDO") return <RemoveCircleOutlineIcon sx={{ color: "#9e9e9e" }} />;
  if (activo || estado === "INICIADO") return <CircularProgress size={20} />;
  return <RadioButtonUncheckedIcon sx={{ color: "#bdbdbd" }} />;
};

// =====================================================================
// Panel de retiro general (va arriba de la tabla en "Órdenes de retiro").
// `onFinalizado` se llama al terminar una ejecución para refrescar la tabla.
// =====================================================================
const RetiroGeneralPanel = ({ onFinalizado }) => {
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [iniciando, setIniciando] = useState(false);

  // Seguimiento en vivo
  const [ejecucionId, setEjecucionId] = useState(null);
  const [seguimiento, setSeguimiento] = useState(null); // { ejecucion, pasos, archivos }
  const [openProgreso, setOpenProgreso] = useState(false);
  const pollingRef = useRef(null);

  // Historial y detalle
  const [openHistorial, setOpenHistorial] = useState(false);
  const [detalle, setDetalle] = useState({ open: false, ejecucionId: null, rows: [], loading: false });

  const ultimo = historial[0] || null;

  const fetchHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    try {
      const { data } = await axios.get(`${apiUrl}/mrp/retiro-general/ejecuciones`, {
        ...getAuthHeaders(),
        params: { limit: 10 },
      });
      const lista = Array.isArray(data?.data) ? data.data : [];
      setHistorial(lista);
      return lista;
    } catch (error) {
      setHistorial([]);
      handleApiError(error, { defaultMessage: "No se pudo consultar el historial de retiros generales." });
      return [];
    } finally {
      setLoadingHistorial(false);
    }
  }, []);

  const detenerPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const consultarEjecucion = useCallback(
    async (id, erroresSeguidos = 0) => {
      try {
        const { data } = await axios.get(`${apiUrl}/mrp/ejecuciones/${id}`, getAuthHeaders());
        setSeguimiento(data);

        if (EN_CURSO.includes(data?.ejecucion?.estado)) {
          pollingRef.current = setTimeout(() => consultarEjecucion(id, 0), POLLING_MS);
          return;
        }

        // Terminó: refrescar historial y la tabla de órdenes de retiro.
        await fetchHistorial();
        if (onFinalizado) onFinalizado();
      } catch (error) {
        if (erroresSeguidos + 1 >= 5) {
          handleApiError(error, {
            defaultMessage: "Se perdió la conexión durante el seguimiento del retiro general.",
          });
          return;
        }
        pollingRef.current = setTimeout(
          () => consultarEjecucion(id, erroresSeguidos + 1),
          POLLING_MS
        );
      }
    },
    [fetchHistorial, onFinalizado]
  );

  const abrirSeguimiento = useCallback(
    (id) => {
      detenerPolling();
      setEjecucionId(id);
      setSeguimiento(null);
      setOpenProgreso(true);
      consultarEjecucion(id);
    },
    [consultarEjecucion]
  );

  // Carga inicial: si hay un retiro en curso (p. ej. se recargó la página),
  // se retoma su seguimiento automáticamente.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const lista = await fetchHistorial();
      if (!cancelado && lista[0] && EN_CURSO.includes(lista[0].estado)) {
        abrirSeguimiento(Number(lista[0].id));
      }
    })();
    return () => {
      cancelado = true;
      detenerPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIniciar = async () => {
    const confirm = await Swal.fire({
      title: "¿Generar retiro general?",
      html:
        "Se recalculará el MRP de <b>todas</b> las publicaciones y se generará una orden de retiro " +
        "con el excedente de bodega de todos los productos FULL.<br/><br/>" +
        "Puede tardar varios minutos. Si algo falla, no se guarda ningún cambio.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, generar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    setIniciando(true);
    try {
      const { data } = await axios.post(
        `${apiUrl}/mrp/retiro-general/iniciar`,
        {},
        getAuthHeaders()
      );
      abrirSeguimiento(Number(data.mrpEjecucionId));
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudo iniciar el retiro general.",
        warningTitle: "No se pudo iniciar",
      });
    } finally {
      setIniciando(false);
    }
  };

  const handleDescargar = async (archivoId) => {
    if (!archivoId) return;
    try {
      const { data } = await axios.get(
        `${apiUrl}/mrp/descargarArchivoMRP/${archivoId}/descargar`,
        getAuthHeaders()
      );
      if (data?.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      handleApiError(error, { defaultMessage: "No se pudo descargar el archivo." });
    }
  };

  const handleVerDetalle = async (id) => {
    setDetalle({ open: true, ejecucionId: id, rows: [], loading: true });
    try {
      const { data } = await axios.get(
        `${apiUrl}/mrp/retiro-general/${id}/productos`,
        getAuthHeaders()
      );
      setDetalle({ open: true, ejecucionId: id, rows: data?.data || [], loading: false });
    } catch (error) {
      setDetalle((prev) => ({ ...prev, loading: false }));
      handleApiError(error, { defaultMessage: "No se pudo consultar el detalle del retiro." });
    }
  };

  const cerrarProgreso = () => {
    detenerPolling();
    setOpenProgreso(false);
  };

  // ---------- datos derivados del seguimiento ----------
  const ejecucionSeguida = seguimiento?.ejecucion || null;
  const enCurso = EN_CURSO.includes(ejecucionSeguida?.estado);
  const pasosPorNombre = useMemo(() => {
    const mapa = {};
    (seguimiento?.pasos || []).forEach((p) => {
      mapa[p.paso] = p;
    });
    return mapa;
  }, [seguimiento]);
  const archivoSeguido = (seguimiento?.archivos || []).find((a) => a.tipo === "RETIRO");

  const columnasDetalle = useMemo(
    () => [
      { field: "mlm", headerName: "MLM", minWidth: 130, flex: 0.8 },
      { field: "title", headerName: "Título", minWidth: 260, flex: 2 },
      { field: "sku", headerName: "SKU", minWidth: 120, flex: 0.8 },
      { field: "inventory_id", headerName: "ML", minWidth: 110, flex: 0.7 },
      { field: "pedido_calculado", headerName: "Pedido", type: "number", width: 100, valueFormatter: (v) => fmtNum(v) },
      { field: "excedente_calculado", headerName: "Excedente", type: "number", width: 110, valueFormatter: (v) => fmtNum(v) },
      { field: "cantidad_retirada", headerName: "Retirado", type: "number", width: 110, valueFormatter: (v) => fmtNum(v) },
      {
        field: "faltante_sin_cubrir",
        headerName: "Faltante",
        description: "Pedido − retirado: lo que el excedente no alcanzó a cubrir y se pedirá al proveedor.",
        type: "number",
        width: 110,
        renderCell: (params) => {
          const v = Number(params.value ?? 0);
          return v > 0 ? (
            <Chip label={fmtNum(v)} size="small" color="warning" sx={{ fontWeight: 600 }} />
          ) : (
            "0"
          );
        },
      },
      { field: "producto_id", headerName: "# Producto", width: 110 },
    ],
    []
  );

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <>
      <PageToolbarCard>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <MoveToInboxOutlinedIcon sx={{ color: "#1e88e5", fontSize: 32, mt: 0.25 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a237e" }}>
                Retiro general de excedentes
              </Typography>
              {loadingHistorial ? (
                <Typography variant="body2" sx={{ color: "#78909c" }}>
                  Consultando último retiro…
                </Typography>
              ) : ultimo ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" sx={{ color: "#546e7a" }}>
                    Último: {formatFechaHora(ultimo.finalizado_en || ultimo.iniciado_en || ultimo.fecha_ejecucion)}
                    {ultimo.usuario ? ` · ${ultimo.usuario}` : ""}
                  </Typography>
                  <EstadoChip estado={ultimo.estado} />
                  {ultimo.orden_bodega_id && (
                    <Chip
                      label={`Orden bodega #${ultimo.orden_bodega_id}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {ultimo.resumen?.productosRetirados > 0 && (
                    <Typography variant="body2" sx={{ color: "#546e7a" }}>
                      {fmtNum(ultimo.resumen.productosRetirados)} productos ·{" "}
                      {fmtNum(ultimo.resumen.piezasRetiradas)} piezas
                    </Typography>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: "#78909c" }}>
                  Aún no se ha ejecutado ningún retiro general. Genéralo antes de los pedidos del día.
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            {ultimo?.archivo_id && (
              <Tooltip title="Descargar Excel del último retiro" arrow>
                <IconButton onClick={() => handleDescargar(ultimo.archivo_id)}>
                  <DownloadOutlinedIcon />
                </IconButton>
              </Tooltip>
            )}
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setOpenHistorial(true)}
              sx={{ ...modalSecondaryButtonSx, height: 48 }}
            >
              Historial
            </Button>
            <Button
              variant="contained"
              startIcon={iniciando ? <CircularProgress size={18} color="inherit" /> : <PlayCircleOutlineIcon />}
              onClick={handleIniciar}
              disabled={iniciando || (ultimo && EN_CURSO.includes(ultimo.estado))}
              sx={toolbarButtonSx}
            >
              Generar retiro general
            </Button>
          </Stack>
        </Stack>
      </PageToolbarCard>

      {/* ---------------- Seguimiento en vivo ---------------- */}
      <Dialog
        open={openProgreso}
        onClose={enCurso ? undefined : cerrarProgreso}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={modalTitleSx}>
          Retiro general {ejecucionId ? `#${ejecucionId}` : ""}
        </DialogTitle>
        <DialogContent sx={modalContentSx}>
          {!ejecucionSeguida ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <EstadoChip estado={ejecucionSeguida.estado} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a237e" }}>
                  {Number(ejecucionSeguida.progreso || 0)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Number(ejecucionSeguida.progreso || 0)}
                sx={{ height: 8, borderRadius: 4 }}
              />

              <Stack spacing={1.25} sx={{ pt: 1 }}>
                {FASES.map((fase) => {
                  const paso = pasosPorNombre[fase.paso];
                  const activo = enCurso && ejecucionSeguida.fase_actual === fase.paso;
                  return (
                    <Stack key={fase.paso} direction="row" spacing={1.5} alignItems="flex-start">
                      <Box sx={{ pt: 0.25 }}>
                        <IconoPaso estado={paso?.estado} activo={activo} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {fase.label}
                          {paso?.duracion_ms ? (
                            <Typography component="span" variant="caption" sx={{ color: "#78909c", ml: 1 }}>
                              {formatDuracion(paso.duracion_ms)}
                            </Typography>
                          ) : null}
                        </Typography>
                        {paso?.mensaje && (
                          <Typography variant="caption" sx={{ color: "#546e7a", display: "block" }}>
                            {paso.mensaje}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>

              {ejecucionSeguida.estado === "ERROR" && (
                <Alert severity="error">
                  {ejecucionSeguida.mensaje_error || "Ocurrió un error en el retiro general."}
                  {Number(ejecucionSeguida.revertido) === 1 && (
                    <Box sx={{ mt: 0.5, fontWeight: 600 }}>
                      No se guardó ningún cambio: la orden de retiro se revirtió por completo.
                    </Box>
                  )}
                </Alert>
              )}
              {ejecucionSeguida.estado === "COMPLETADO_CON_ADVERTENCIAS" && (
                <Alert severity="warning">{ejecucionSeguida.mensaje_error}</Alert>
              )}
              {ejecucionSeguida.estado === "SIN_EXCEDENTES" && (
                <Alert severity="info">
                  No hay productos FULL con excedente disponible en bodega. No se generó orden de retiro.
                </Alert>
              )}
              {["COMPLETADO", "COMPLETADO_CON_ADVERTENCIAS"].includes(ejecucionSeguida.estado) &&
                ejecucionSeguida.resumen && (
                  <Alert severity="success">
                    Orden de bodega #{ejecucionSeguida.resumen.ordenBodegaId}:{" "}
                    {fmtNum(ejecucionSeguida.resumen.productosRetirados)} producto(s),{" "}
                    {fmtNum(ejecucionSeguida.resumen.piezasRetiradas)} pieza(s).
                    {ejecucionSeguida.resumen.productosConFaltante > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        {fmtNum(ejecucionSeguida.resumen.productosConFaltante)} producto(s) no se cubrieron
                        completos con el excedente ({fmtNum(ejecucionSeguida.resumen.piezasFaltantes)} piezas);
                        ese faltante se pedirá al proveedor en el MRP manual.
                      </Box>
                    )}
                  </Alert>
                )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={modalActionsSx}>
          {!enCurso && ejecucionId && ejecucionSeguida && ejecucionSeguida.estado !== "ERROR" && (
            <Button
              variant="outlined"
              startIcon={<ListAltOutlinedIcon />}
              onClick={() => handleVerDetalle(ejecucionId)}
              sx={modalSecondaryButtonSx}
            >
              Ver detalle
            </Button>
          )}
          {archivoSeguido && (
            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => handleDescargar(archivoSeguido.archivo_id)}
              sx={modalSecondaryButtonSx}
            >
              Excel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={cerrarProgreso}
            disabled={enCurso}
            sx={modalPrimaryButtonSx}
          >
            {enCurso ? "Procesando…" : "Cerrar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- Historial ---------------- */}
      <Dialog open={openHistorial} onClose={() => setOpenHistorial(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={modalTitleSx}>Historial de retiros generales</DialogTitle>
        <DialogContent sx={modalContentSx}>
          {historial.length === 0 ? (
            <Typography variant="body2" sx={{ color: "#78909c", py: 2 }}>
              No hay retiros generales registrados.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />} spacing={1.5}>
              {historial.map((h) => (
                <Stack
                  key={h.id}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        #{h.id}
                      </Typography>
                      <EstadoChip estado={h.estado} />
                      {h.orden_bodega_id && (
                        <Chip label={`Orden bodega #${h.orden_bodega_id}`} size="small" variant="outlined" />
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ color: "#546e7a", display: "block", mt: 0.5 }}>
                      {formatFechaHora(h.iniciado_en || h.fecha_ejecucion)}
                      {h.usuario ? ` · ${h.usuario}` : ""}
                      {h.resumen?.productosRetirados > 0
                        ? ` · ${fmtNum(h.resumen.productosRetirados)} productos, ${fmtNum(h.resumen.piezasRetiradas)} piezas`
                        : ""}
                    </Typography>
                    {h.estado === "ERROR" && h.mensaje_error && (
                      <Typography variant="caption" sx={{ color: "#d32f2f", display: "block" }}>
                        {h.mensaje_error}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5} flexShrink={0}>
                    <Tooltip title="Ver bitácora" arrow>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setOpenHistorial(false);
                          abrirSeguimiento(Number(h.id));
                        }}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {h.orden_bodega_id && (
                      <Tooltip title="Ver productos retirados" arrow>
                        <IconButton size="small" onClick={() => handleVerDetalle(Number(h.id))}>
                          <ListAltOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {h.archivo_id && (
                      <Tooltip title="Descargar Excel" arrow>
                        <IconButton size="small" onClick={() => handleDescargar(h.archivo_id)}>
                          <DownloadOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={modalActionsSx}>
          <Button variant="contained" onClick={() => setOpenHistorial(false)} sx={modalPrimaryButtonSx}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- Detalle por producto ---------------- */}
      <Dialog
        open={detalle.open}
        onClose={() => setDetalle({ open: false, ejecucionId: null, rows: [], loading: false })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={modalTitleSx}>
          Productos del retiro general #{detalle.ejecucionId}
        </DialogTitle>
        <DialogContent sx={modalContentSx}>
          <AppDataGrid
            rows={detalle.rows}
            columns={columnasDetalle}
            loading={detalle.loading}
            getRowId={(row) => row.id}
            exportFileName={`retiro_general_${detalle.ejecucionId}`}
            height={520}
          />
        </DialogContent>
        <DialogActions sx={modalActionsSx}>
          <Button
            variant="contained"
            onClick={() => setDetalle({ open: false, ejecucionId: null, rows: [], loading: false })}
            sx={modalPrimaryButtonSx}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RetiroGeneralPanel;
