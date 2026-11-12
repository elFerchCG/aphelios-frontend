// [FULL-CROSSDOCK] Panel del RPA Full -> cross_docking: candidatos, cómo se procesaron, cuándo y por qué.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplayIcon from "@mui/icons-material/Replay";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";

import apiUrl from "../../../config";

// ---------- API ----------
const base = () => `${apiUrl}/rpaFull`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const rfGet = (ruta, params) => axios.get(`${base()}${ruta}`, { headers: headers(), params }).then((r) => r.data);
const rfPost = (ruta, body) => axios.post(`${base()}${ruta}`, body || {}, { headers: headers() }).then((r) => r.data);
const mensajeError = (e, porDefecto = "Ocurrió un error.") => e?.response?.data?.message || e?.message || porDefecto;

// ---------- Estilo estándar ----------
const GRID_HEIGHT = 520;
const PAGE_SIZE_OPTIONS = [100];
const PAGINACION_INICIAL = { pagination: { paginationModel: { pageSize: 100, page: 0 } } };
const LOCALE_TEXT_GRID = {
  toolbarColumns: "Columnas",
  toolbarDensity: "Densidad",
  toolbarExport: "Exportar",
  toolbarFilters: "Filtros",
  filterPanelOperator: "Operador",
  toolbarFiltersTooltipHide: "Ocultar filtros",
  toolbarFiltersTooltipShow: "Mostrar filtros",
  footerTotalVisibleRows: (visibleCount, totalCount) => `${visibleCount} de ${totalCount}`,
  footerPaginationRowsPerPage: "Filas por página",
};
const gridSx = {
  fontFamily: "Montserrat",
  borderRadius: 2,
  "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f7fa", fontWeight: "bold", fontSize: 13 },
  "& .MuiDataGrid-columnHeader": { backgroundColor: "#f5f7fa" },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
  "& .MuiDataGrid-cell": { borderBottom: "1px solid #eee", fontSize: 13 },
  "& .MuiDataGrid-row:hover": { backgroundColor: "#f9fafb" },
};
const botonSx = { borderRadius: 2, textTransform: "none", fontWeight: 600 };
const gridComunProps = {
  showCellVerticalBorder: true,
  showColumnVerticalBorder: true,
  disableRowSelectionOnClick: true,
  hideFooterSelectedRowCount: true,
  density: "compact",
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  initialState: PAGINACION_INICIAL,
  slots: { toolbar: GridToolbar },
  slotProps: { loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" } },
  sx: gridSx,
};

const ESTADOS = {
  pendiente: { label: "Pendiente", color: "default" },
  en_proceso: { label: "En proceso", color: "warning" },
  verificando: { label: "Verificando", color: "info" },
  hecho: { label: "Hecho", color: "success" },
  fallido: { label: "Fallido", color: "error" },
  descartado: { label: "Descartado", color: "secondary" },
};
const RESULTADOS = {
  ok: { label: "OK", color: "success" },
  error: { label: "Error", color: "error" },
  timeout: { label: "Sin respuesta", color: "warning" },
  sesion_cerrada: { label: "Sesión cerrada", color: "warning" },
};

const fecha = (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "");
const FILTROS_INICIALES = { estado: "", buscar: "", desde: "", hasta: "" };

// ---------- Piezas visuales (fuera del componente) ----------
const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children }) => (
  <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
    <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <Icon color="primary" /> {title}
          {count != null && (
            <Chip size="small" label={count} sx={{ fontWeight: 700, bgcolor: "#e3f2fd", color: "primary.main", height: 22 }} />
          )}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", ml: 4 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          {actions}
        </Stack>
      )}
    </Stack>
    {children}
  </Paper>
);

const KpiCard = ({ icon: Icon, color, label, valor, detalle }) => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: 3, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: 2,
        bgcolor: `${color}1A`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
        {valor}
      </Typography>
      {detalle && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {detalle}
        </Typography>
      )}
    </Box>
  </Paper>
);

const EstadoChip = ({ mapa, valor }) => {
  const e = mapa[valor] || { label: valor || "-", color: "default" };
  return <Chip size="small" label={e.label} color={e.color} sx={{ fontWeight: 600 }} />;
};

const Dato = ({ label, children }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
      {children ?? "-"}
    </Typography>
  </Box>
);

// ---------- Pantalla ----------
export default function RpaFullCrossDocking() {
  const [dias, setDias] = useState(7);
  const [resumen, setResumen] = useState(null);
  const [cola, setCola] = useState([]);
  const [corridas, setCorridas] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = Object.fromEntries(Object.entries(filtrosAplicados).filter(([, v]) => v));
      const [r, c, k] = await Promise.all([
        rfGet("/resumen", { dias }),
        rfGet("/cola", params),
        rfGet("/corridas", { limite: 200 }),
      ]);
      setResumen(r);
      setCola(c.filas || []);
      setCorridas(k.filas || []);
    } catch (e) {
      Swal.fire("Error", mensajeError(e, "No se pudo cargar la información."), "error");
    } finally {
      setCargando(false);
    }
  }, [dias, filtrosAplicados]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const buscarCandidatos = async () => {
    setBuscando(true);
    try {
      const r = await rfPost("/corridas");
      Swal.fire({
        icon: "success",
        title: "Búsqueda terminada",
        html: `Revisados con almacén: <b>${r.revisados}</b><br/>Encolados para el bot: <b>${r.encolados}</b><br/>Descartados: <b>${r.descartados}</b><br/>Regresaron a Full: <b>${r.regresados_full}</b>`,
      });
      cargar();
    } catch (e) {
      Swal.fire("Error", mensajeError(e), "error");
    } finally {
      setBuscando(false);
    }
  };

  const reencolar = useCallback(async (fila) => {
    const ok = await Swal.fire({
      icon: "question",
      title: "¿Reencolar este MLMU?",
      html: `<b>${fila.user_product_id}</b><br/>${fila.titulo || ""}<br/><br/>El bot lo volverá a intentar con los intentos en 0.`,
      showCancelButton: true,
      confirmButtonText: "Reencolar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await rfPost(`/cola/${fila.id}/reencolar`);
      cargar();
    } catch (e) {
      Swal.fire("Error", mensajeError(e), "error");
    }
  }, [cargar]);

  const verDetalle = useCallback(async (id) => {
    try {
      setDetalle(await rfGet(`/cola/${id}`));
    } catch (e) {
      Swal.fire("Error", mensajeError(e), "error");
    }
  }, []);

  const pe = resumen?.porEstado || {};
  const abiertos = (pe.pendiente || 0) + (pe.en_proceso || 0) + (pe.verificando || 0);
  const ultima = resumen?.ultimaCorrida;

  const columnasCola = useMemo(
    () => [
      {
        field: "acciones",
        headerName: "",
        width: 84,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack direction="row">
            <Tooltip arrow title="Ver detalle e intentos">
              <IconButton size="small" color="primary" onClick={() => verDetalle(row.id)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {["fallido", "descartado"].includes(row.estado) && (
              <Tooltip arrow title="Reencolar">
                <IconButton size="small" color="warning" onClick={() => reencolar(row)}>
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
      { field: "user_product_id", headerName: "MLMU", width: 150 },
      { field: "item_id", headerName: "MLM", width: 130 },
      { field: "titulo", headerName: "Título", flex: 1, minWidth: 220 },
      {
        field: "estado",
        headerName: "Estado",
        width: 120,
        renderCell: ({ value }) => <EstadoChip mapa={ESTADOS} valor={value} />,
      },
      { field: "motivo", headerName: "Motivo / resultado", flex: 1.2, minWidth: 260 },
      {
        field: "intentos",
        headerName: "Intentos",
        width: 85,
        align: "center",
        headerAlign: "center",
        valueGetter: (value, row) => `${value}/${row.max_intentos}`,
      },
      { field: "disponible_almacen", headerName: "Disp. almacén", type: "number", width: 110 },
      { field: "stock_sincronizado", headerName: "Stock puesto", type: "number", width: 105 },
      { field: "fecha_creado", headerName: "Encolado", width: 135, valueFormatter: (v) => fecha(v) },
      { field: "fecha_terminado", headerName: "Terminado", width: 135, valueFormatter: (v) => fecha(v) },
      { field: "fecha_regreso_full", headerName: "Regresó a Full", width: 135, valueFormatter: (v) => fecha(v) },
      { field: "bot_id", headerName: "Bot", width: 110 },
      { field: "id", headerName: "Folio", width: 75 },
    ],
    [verDetalle, reencolar],
  );

  const columnasCorridas = useMemo(
    () => [
      { field: "id", headerName: "Folio", width: 75 },
      {
        field: "origen",
        headerName: "Origen",
        width: 100,
        renderCell: ({ value }) => (
          <Chip size="small" label={value === "manual" ? "Manual" : "Automática"} variant="outlined" sx={{ fontWeight: 600 }} />
        ),
      },
      { field: "ejecutado_por", headerName: "Ejecutó", width: 140 },
      { field: "revisados", headerName: "Con almacén", type: "number", width: 105 },
      { field: "encolados", headerName: "Encolados", type: "number", width: 95 },
      { field: "descartados", headerName: "Descartados", type: "number", width: 100 },
      { field: "regresados_full", headerName: "Regresaron a Full", type: "number", width: 135 },
      { field: "fecha_inicio", headerName: "Inicio", width: 135, valueFormatter: (v) => fecha(v) },
      { field: "fecha_fin", headerName: "Fin", width: 135, valueFormatter: (v) => fecha(v) },
      { field: "error", headerName: "Error", flex: 1, minWidth: 200 },
    ],
    [],
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />

      {/* Encabezado */}
      <Paper elevation={2} sx={{ p: 1.5, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography variant="subtitle1" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
            <SmartToyOutlinedIcon color="primary" /> Full a Cross Docking
          </Typography>
          {resumen && (
            <Chip
              size="small"
              label={resumen.activo ? "Bot activo" : "Bot apagado (RPA_FC_ACTIVO=off)"}
              color={resumen.activo ? "success" : "default"}
              sx={{ fontWeight: 700 }}
            />
          )}
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            MLMU Full pausados sin stock que el bot pasa a cross docking con stock de almacén
          </Typography>
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <TextField select size="small" label="Periodo" value={dias} onChange={(e) => setDias(Number(e.target.value))} sx={{ minWidth: 130 }}>
            <MenuItem value={1}>Hoy</MenuItem>
            <MenuItem value={7}>Últimos 7 días</MenuItem>
            <MenuItem value={30}>Últimos 30 días</MenuItem>
            <MenuItem value={90}>Últimos 90 días</MenuItem>
          </TextField>
          <Tooltip arrow title="Busca candidatos ahora sin esperar al cron">
            <span>
              <Button variant="outlined" size="small" startIcon={<TravelExploreOutlinedIcon />} sx={botonSx} onClick={buscarCandidatos} disabled={buscando}>
                {buscando ? "Buscando…" : "Buscar candidatos ahora"}
              </Button>
            </span>
          </Tooltip>
          <Tooltip arrow title="Recargar todo">
            <span>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />} sx={botonSx} onClick={cargar} disabled={cargando}>
                Actualizar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      {/* KPIs */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
        <KpiCard
          icon={PendingActionsOutlinedIcon}
          color="#1976d2"
          label="En cola"
          valor={abiertos}
          detalle={`${pe.pendiente || 0} pendientes · ${(pe.en_proceso || 0) + (pe.verificando || 0)} en proceso`}
        />
        <KpiCard icon={TaskAltOutlinedIcon} color="#2e7d32" label="Pasados a cross docking" valor={pe.hecho || 0} detalle="en el periodo" />
        <KpiCard
          icon={ErrorOutlineOutlinedIcon}
          color="#ed6c02"
          label="Fallidos"
          valor={pe.fallido || 0}
          detalle={`${pe.descartado || 0} descartados (ya no cumplían)`}
        />
        <KpiCard icon={LocalShippingOutlinedIcon} color="#0288d1" label="Regresaron a Full" valor={resumen?.regresadosFull || 0} detalle="ML los regresó al llegar envío" />
      </Box>

      {/* Cola */}
      <SectionCard
        icon={ListAltOutlinedIcon}
        title="MLMU procesados"
        subtitle="Cada candidato con su estado, el motivo y cuándo se procesó"
        count={cola.length}
        actions={
          <>
            <TextField select size="small" label="Estado" value={filtros.estado} onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))} sx={{ minWidth: 140 }}>
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(ESTADOS).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }} value={filtros.desde} onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))} />
            <TextField size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }} value={filtros.hasta} onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))} />
            <TextField
              size="small"
              label="MLMU, MLM o título"
              value={filtros.buscar}
              onChange={(e) => setFiltros((f) => ({ ...f, buscar: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && setFiltrosAplicados(filtros)}
              sx={{ minWidth: 200 }}
            />
            <Button variant="outlined" size="small" startIcon={<SearchIcon />} sx={botonSx} onClick={() => setFiltrosAplicados(filtros)}>
              Buscar
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              startIcon={<RestartAltIcon />}
              sx={botonSx}
              onClick={() => {
                setFiltros(FILTROS_INICIALES);
                setFiltrosAplicados(FILTROS_INICIALES);
              }}
            >
              Limpiar
            </Button>
          </>
        }
      >
        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            {...gridComunProps}
            rows={cola}
            columns={columnasCola}
            loading={cargando}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "No hay MLMU con estos filtros" }}
          />
        </Box>
      </SectionCard>

      {/* Corridas */}
      <SectionCard
        icon={HistoryOutlinedIcon}
        title="Búsquedas de candidatos"
        subtitle={ultima ? `Última: ${fecha(ultima.fecha_inicio)} (${ultima.origen === "manual" ? "manual" : "automática"})` : "Aún no se ha buscado"}
        count={corridas.length}
      >
        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            {...gridComunProps}
            rows={corridas}
            columns={columnasCorridas}
            loading={cargando}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Aún no hay búsquedas registradas" }}
          />
        </Box>
      </SectionCard>

      {/* Detalle */}
      <Dialog open={!!detalle} onClose={() => setDetalle(null)} maxWidth="md" fullWidth>
        {detalle && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
              {detalle.fila.user_product_id}
              <EstadoChip mapa={ESTADOS} valor={detalle.fila.estado} />
            </DialogTitle>
            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
                <Dato label="MLM">{detalle.fila.item_id}</Dato>
                <Dato label="Producto (base)">{detalle.fila.producto_id}</Dato>
                <Dato label="Disponible en almacén">{detalle.fila.disponible_almacen}</Dato>
                <Dato label="Logística antes → después">
                  {detalle.fila.logistic_antes || "-"} → {detalle.fila.logistic_despues || "-"}
                </Dato>
                <Dato label="Stock puesto">{detalle.fila.stock_sincronizado}</Dato>
                <Dato label="Bot">{detalle.fila.bot_id}</Dato>
                <Dato label="Encolado">{fecha(detalle.fila.fecha_creado)}</Dato>
                <Dato label="Tomado por el bot">{fecha(detalle.fila.fecha_tomado)}</Dato>
                <Dato label="Terminado">{fecha(detalle.fila.fecha_terminado)}</Dato>
              </Box>
              <Dato label="Título">{detalle.fila.titulo}</Dato>
              <Dato label="Motivo / resultado">{detalle.fila.motivo}</Dato>

              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Intentos ({detalle.intentos.length})
              </Typography>
              {!detalle.intentos.length && (
                <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
                  El bot todavía no lo ha intentado
                </Typography>
              )}
              {detalle.intentos.map((i) => (
                <Paper key={i.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Stack direction="row" gap={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        #{i.numero}
                      </Typography>
                      <EstadoChip mapa={RESULTADOS} valor={i.resultado} />
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {fecha(i.fecha_inicio)}
                        {i.duracion_ms != null ? ` · ${(i.duracion_ms / 1000).toFixed(1)} s` : ""}
                      </Typography>
                    </Stack>
                    {i.paso && (
                      <Typography variant="caption">
                        Paso: <b>{i.paso}</b>
                      </Typography>
                    )}
                    {i.error && (
                      <Typography variant="body2" sx={{ color: "error.main", wordBreak: "break-word" }}>
                        {i.error}
                      </Typography>
                    )}
                  </Box>
                  {i.captura_url && (
                    <Link href={i.captura_url} target="_blank" rel="noopener noreferrer" sx={{ display: "block" }}>
                      <Box
                        component="img"
                        src={i.captura_url}
                        alt={`Captura intento ${i.numero}`}
                        sx={{ width: 220, maxHeight: 140, objectFit: "cover", borderRadius: 1, border: "1px solid #ddd" }}
                      />
                      <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <ImageOutlinedIcon fontSize="inherit" /> Abrir captura
                      </Typography>
                    </Link>
                  )}
                </Paper>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetalle(null)} sx={botonSx}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
