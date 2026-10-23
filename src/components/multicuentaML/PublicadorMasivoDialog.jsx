// [MULTICUENTA-ML] Publicador masivo (dentro de Cuentas Ecommerce).
// Se marcan varias opciones de venta de la principal y se mandan como un
// lote: el backend las publica en segundo plano (unas pocas por minuto) con
// el precio de la principal, SELLER_SKU = MLMU y omite las que ya existen.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Alert,
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  GlobalStyles,
  IconButton,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DoNotDisturbOnOutlinedIcon from "@mui/icons-material/DoNotDisturbOnOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import apiUrl from "../../config";
import { mcGet, mcPost, mensajeError } from "./multicuentaApi";
import {
  GRID_HEIGHT,
  LOCALE_TEXT_GRID,
  gridSx,
  botonSx,
  SectionCard,
  KpiCard,
  KpiValor,
  kpiGridSx,
  EstadoChip,
} from "./uiMulticuenta";

const PAGE_SIZE = 100;
const REFRESCO_MS = 5000;

const TIPOS = [
  { value: "origen", label: "Igual a la principal" },
  { value: "gold_special", label: "Clásica (gold_special)" },
  { value: "gold_pro", label: "Premium (gold_pro)" },
];

const FILTROS_INICIALES = { q: "", proveedor: null, logistica: "todas", estado: "active", ocultarPublicadas: true };

const ESTADOS_LOTE = {
  pendiente: { label: "En cola", color: "default" },
  procesando: { label: "Publicando", color: "warning" },
  terminado: { label: "Terminado", color: "success" },
  cancelado: { label: "Cancelado", color: "secondary" },
};

const ESTADOS_ITEM = {
  pendiente: { label: "En cola", color: "default" },
  procesando: { label: "Publicando", color: "warning" },
  publicado: { label: "Publicada", color: "success" },
  omitido: { label: "Omitida", color: "info" },
  error: { label: "Error", color: "error" },
  cancelado: { label: "Cancelada", color: "secondary" },
};

const formatoFecha = (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "");
const dinero = (v) =>
  v == null || v === "" ? "" : Number(v).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const getThumbnailUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://http2.mlstatic.com/D_${url}-I.jpg`;
};

// Fila seleccionable: no existe en destino, no está en un lote y tiene stock
const esSeleccionable = (r) => !r.item_destino && !r.lote_activo && Number(r.disponible) > 0;

const motivoNoSeleccionable = (r) => {
  if (r.item_destino) return `Ya existe en la cuenta destino (${r.item_destino}).`;
  if (r.lote_activo) return `Ya está en el lote #${r.lote_activo}.`;
  if (!(Number(r.disponible) > 0)) return "Sin piezas disponibles.";
  return "";
};

const ProductoCell = ({ row, titulo, sub }) => (
  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.5, minWidth: 0, width: "100%" }}>
    <Avatar
      variant="rounded"
      src={getThumbnailUrl(row.thumbnail) || undefined}
      sx={{ width: 34, height: 34, bgcolor: "#f5f5f5", border: "1px solid #e0e0e0", flexShrink: 0 }}
    >
      <Inventory2OutlinedIcon sx={{ fontSize: 16, color: "#9e9e9e" }} />
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" noWrap title={titulo} sx={{ fontWeight: 600 }}>
        {titulo || "Sin título"}
      </Typography>
      <Typography variant="caption" noWrap sx={{ color: "text.secondary", display: "block" }}>
        {sub}
      </Typography>
    </Box>
  </Stack>
);

const ProgresoLote = ({ lote }) => {
  const hechos = lote.publicados + lote.omitidos + lote.errores + lote.cancelados;
  const pct = lote.total ? Math.round((hechos / lote.total) * 100) : 0;
  return (
    <Stack direction="row" alignItems="center" gap={1} sx={{ width: "100%", height: "100%" }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={lote.errores ? "warning" : "success"}
        sx={{ height: 8, borderRadius: 4, flex: 1 }}
      />
      <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
        {hechos}/{lote.total}
      </Typography>
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Pestaña 1: seleccionar
// ---------------------------------------------------------------------------
const Seleccion = ({ destino, onLoteCreado, avisar }) => {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [aplicados, setAplicados] = useState(FILTROS_INICIALES);
  const [proveedores, setProveedores] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  // Selección por id de publicación; se conserva entre "Cargar más"
  const [seleccion, setSeleccion] = useState([]);
  const [tipo, setTipo] = useState("origen");
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    axios
      .get(`${apiUrl}/proveedores`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => {
        const lista = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : [];
        setProveedores(lista.filter((p) => p?.id_proveedor));
      })
      .catch(() => setProveedores([]));
  }, []);

  const buscar = useCallback(
    async (f, pagina, acumular) => {
      if (!destino) return;
      if (acumular) setCargandoMas(true);
      else setLoading(true);
      try {
        const params = {
          cuentaDestinoId: destino,
          page: pagina,
          pageSize: PAGE_SIZE,
          logistica: f.logistica,
          estado: f.estado,
          ocultarPublicadas: f.ocultarPublicadas ? 1 : 0,
        };
        if (f.q.trim()) params.q = f.q.trim();
        if (f.proveedor) params.proveedorId = f.proveedor.id_proveedor;
        const r = await mcGet("/publicador/masivo/candidatos", params);
        const lista = r.filas || [];
        setRows((prev) => (acumular ? [...prev, ...lista.filter((x) => !prev.some((p) => p.item_id === x.item_id))] : lista));
        setTotal(Number(r.total) || 0);
        setPage(pagina);
        setAplicados(f);
        if (!acumular) setSeleccion([]);
      } catch (e) {
        avisar("error", await mensajeError(e, "No se pudieron buscar las publicaciones."));
      } finally {
        setLoading(false);
        setCargandoMas(false);
      }
    },
    [destino, avisar],
  );

  useEffect(() => {
    buscar(FILTROS_INICIALES, 1, false);
    setFiltros(FILTROS_INICIALES);
  }, [buscar]);

  const porId = useMemo(() => new Map(rows.map((r) => [r.item_id, r])), [rows]);
  const elegidas = useMemo(() => seleccion.map((id) => porId.get(id)).filter(Boolean), [seleccion, porId]);
  const mlmuRepetidos = useMemo(() => {
    const vistos = new Set();
    let n = 0;
    for (const r of elegidas) {
      if (vistos.has(r.user_product_id)) n++;
      vistos.add(r.user_product_id);
    }
    return n;
  }, [elegidas]);
  // El stock es por MLMU: opciones del mismo MLMU no se suman dos veces
  const piezas = [...new Map(elegidas.map((r) => [r.user_product_id, Number(r.disponible || 0)])).values()].reduce((a, n) => a + n, 0);

  const enviar = async () => {
    setEnviando(true);
    try {
      const r = await mcPost("/publicador/masivo/lotes", { cuentaDestinoId: destino, itemIds: seleccion, tipoPublicacion: tipo });
      setConfirmar(false);
      if (!r.lote_id) {
        avisar("warning", `No se creó el lote: ${r.rechazados?.[0]?.motivo || "ninguna publicación era válida."}`);
        return;
      }
      const extra = r.rechazados?.length ? ` · ${r.rechazados.length} no entraron (ya existen o se repiten).` : "";
      avisar("success", `Lote #${r.lote_id} en cola con ${r.aceptados} publicación(es)${extra}`);
      setSeleccion([]);
      onLoteCreado(r.lote_id);
      buscar(aplicados, 1, false);
    } catch (e) {
      avisar("error", await mensajeError(e, "No se pudo crear el lote."));
    } finally {
      setEnviando(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "title",
        headerName: "Publicación de la principal",
        minWidth: 320,
        flex: 1.6,
        renderCell: (p) => (
          <Tooltip arrow title={motivoNoSeleccionable(p.row)} placement="top-start">
            <Box sx={{ width: "100%", opacity: esSeleccionable(p.row) ? 1 : 0.55 }}>
              <ProductoCell
                row={p.row}
                titulo={p.row.title}
                sub={`${p.row.item_id} · SKU ${p.row.sku || "N/A"} · ML ${p.row.inventory_id || "N/A"}`}
              />
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "user_product_id",
        headerName: "MLMU",
        width: 150,
        renderCell: (p) => (
          <Stack direction="row" gap={0.5} alignItems="center">
            <Typography variant="body2">{p.value}</Typography>
            {p.row.opciones > 1 && (
              <Tooltip arrow title={`${p.row.opciones} opciones de venta comparten este MLMU; en la subcuenta se publica una.`}>
                <Chip size="small" label={`×${p.row.opciones}`} sx={{ height: 20, fontWeight: 700 }} />
              </Tooltip>
            )}
          </Stack>
        ),
      },
      {
        field: "logistic_type",
        headerName: "Logística",
        width: 150,
        renderCell: (p) =>
          p.value === "fulfillment" ? (
            <Tooltip arrow title="En la subcuenta se publica con Mercado Envíos y stock de almacén.">
              <Chip size="small" label="Full" sx={{ fontWeight: 600, bgcolor: "#fff3e0", color: "#e65100" }} />
            </Tooltip>
          ) : (
            <Chip size="small" label="Mercado Envíos" sx={{ fontWeight: 600, bgcolor: "#e3f2fd", color: "#1565c0" }} />
          ),
      },
      { field: "status", headerName: "Estado ML", width: 100 },
      {
        field: "disponible",
        headerName: "Disponible",
        width: 105,
        type: "number",
        headerAlign: "center",
        align: "center",
        renderCell: (p) => {
          const v = Number(p.value || 0);
          const color = v > 0 ? "#2e7d32" : "#d32f2f";
          return (
            <Chip
              size="small"
              label={v}
              sx={{ fontWeight: 700, minWidth: 44, bgcolor: v > 0 ? "#e8f5e9" : "#ffebee", color, border: `1px solid ${color}` }}
            />
          );
        },
      },
      {
        field: "item_destino",
        headerName: "En destino",
        width: 170,
        valueGetter: (value, row) => row.item_destino || (row.lote_activo ? `Lote #${row.lote_activo}` : ""),
        renderCell: (p) =>
          p.row.item_destino ? (
            <Chip size="small" color="success" variant="outlined" label={p.row.item_destino} sx={{ fontWeight: 600 }} />
          ) : p.row.lote_activo ? (
            <Chip size="small" color="warning" variant="outlined" label={`En lote #${p.row.lote_activo}`} sx={{ fontWeight: 600 }} />
          ) : (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Nueva
            </Typography>
          ),
      },
    ],
    [],
  );

  const tipoLabel = TIPOS.find((t) => t.value === tipo)?.label;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <SectionCard
        icon={FilterAltOutlinedIcon}
        title="Filtros"
        subtitle="Publicaciones de la cuenta principal. Por defecto se ocultan las que ya existen en la cuenta destino."
      >
        <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
          <TextField
            size="small"
            label="MLM, MLMU, SKU, ML o título"
            value={filtros.q}
            onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && buscar(filtros, 1, false)}
            sx={{ minWidth: 240, flex: 1 }}
          />
          <Autocomplete
            size="small"
            options={proveedores}
            value={filtros.proveedor}
            onChange={(e, v) => setFiltros((f) => ({ ...f, proveedor: v }))}
            getOptionLabel={(o) => o?.razon_social || ""}
            isOptionEqualToValue={(o, v) => o.id_proveedor === v.id_proveedor}
            renderInput={(params) => <TextField {...params} label="Proveedor" />}
            sx={{ minWidth: 220 }}
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filtros.logistica}
            onChange={(e, v) => v && setFiltros((f) => ({ ...f, logistica: v }))}
            sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, px: 1.5 } }}
          >
            <ToggleButton value="todas">Todas</ToggleButton>
            <ToggleButton value="me">Mercado Envíos</ToggleButton>
            <ToggleButton value="full">Full</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            select
            size="small"
            label="Estado ML"
            value={filtros.estado}
            onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
            sx={{ width: 140 }}
          >
            <MenuItem value="active">Activas</MenuItem>
            <MenuItem value="paused">Pausadas</MenuItem>
            <MenuItem value="todas">Todas</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={filtros.ocultarPublicadas}
                onChange={(e) => setFiltros((f) => ({ ...f, ocultarPublicadas: e.target.checked }))}
              />
            }
            label={<Typography variant="body2">Ocultar las que ya existen</Typography>}
          />
          <Stack direction="row" gap={1} sx={{ ml: { sm: "auto" } }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={() => {
                setFiltros(FILTROS_INICIALES);
                buscar(FILTROS_INICIALES, 1, false);
              }}
              sx={botonSx}
            >
              Limpiar
            </Button>
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={() => buscar(filtros, 1, false)} sx={botonSx}>
              Buscar
            </Button>
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard
        icon={ListAltOutlinedIcon}
        title="Publicaciones"
        subtitle="Marca las que quieres publicar. Las atenuadas no se pueden elegir (pasa el mouse para ver por qué)."
        count={total}
      >
        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            sx={gridSx}
            rows={rows}
            columns={columns}
            getRowId={(r) => r.item_id}
            getRowHeight={() => "auto"}
            loading={loading}
            checkboxSelection
            keepNonExistentRowsSelected
            isRowSelectable={(p) => esSeleccionable(p.row)}
            rowSelectionModel={seleccion}
            onRowSelectionModelChange={(m) => setSeleccion(m)}
            showCellVerticalBorder
            showColumnVerticalBorder
            density="compact"
            pageSizeOptions={[PAGE_SIZE]}
            initialState={{ pagination: { paginationModel: { pageSize: PAGE_SIZE, page: 0 } } }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: { csvOptions: { fileName: "publicador_masivo", utf8WithBom: true } },
              loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" },
            }}
            localeText={{
              ...LOCALE_TEXT_GRID,
              noRowsLabel: "No hay publicaciones con estos filtros (o ya existen todas en la cuenta destino).",
              footerRowSelected: (n) => `${n} seleccionada(s)`,
            }}
          />
        </Box>
        {rows.length < total && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
            <Button variant="outlined" onClick={() => buscar(aplicados, page + 1, true)} disabled={cargandoMas || loading} sx={botonSx}>
              {cargandoMas ? "Cargando…" : `Cargar más (${rows.length} de ${total})`}
            </Button>
          </Box>
        )}
      </SectionCard>

      {/* Barra fija de acción */}
      <Paper
        elevation={6}
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 3,
          p: 1.5,
          borderRadius: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
          border: seleccion.length ? "1px solid #1976d2" : "1px solid transparent",
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {seleccion.length ? `${seleccion.length} publicación(es) seleccionada(s)` : "Ninguna publicación seleccionada"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}>
            Precio = el de la principal al publicar · stock = disponible compartido ({piezas} pzas en total)
          </Typography>
          {mlmuRepetidos > 0 && (
            <Typography variant="caption" sx={{ color: "warning.main", display: "block" }}>
              {mlmuRepetidos} comparten MLMU con otra seleccionada: solo se publicará la primera de cada MLMU.
            </Typography>
          )}
        </Box>
        <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
          <TextField select size="small" label="Tipo de publicación" value={tipo} onChange={(e) => setTipo(e.target.value)} sx={{ width: 230 }}>
            {TIPOS.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          {seleccion.length > 0 && (
            <Button size="small" color="inherit" onClick={() => setSeleccion([])} sx={botonSx}>
              Quitar selección
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<PublishOutlinedIcon />}
            disabled={!seleccion.length || enviando}
            onClick={() => setConfirmar(true)}
            sx={botonSx}
          >
            Publicar {seleccion.length || ""}
          </Button>
        </Stack>
      </Paper>

      <Dialog open={confirmar} onClose={() => !enviando && setConfirmar(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>¿Publicar {seleccion.length} en la cuenta destino?</DialogTitle>
        <DialogContent>
          <Stack gap={1}>
            <Typography variant="body2">
              Se crean publicaciones nuevas en Mercado Libre, en segundo plano. Puedes cerrar esta ventana y seguir el avance
              en la pestaña <b>Lotes</b>.
            </Typography>
            <Typography variant="body2">
              Tipo: <b>{tipoLabel}</b> · precio de la principal · {piezas} piezas en total.
            </Typography>
            <Alert severity="info" sx={{ py: 0 }}>
              Las que ya existan en la cuenta destino o no tengan piezas disponibles se omiten solas.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmar(false)} disabled={enviando} sx={botonSx}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={enviar} disabled={enviando} startIcon={<PublishOutlinedIcon />} sx={botonSx}>
            {enviando ? "Enviando…" : "Sí, publicar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Pestaña 2: lotes
// ---------------------------------------------------------------------------
const Lotes = ({ visible, loteInicial, avisar }) => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loteId, setLoteId] = useState(loteInicial || null);
  const [detalle, setDetalle] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (loteInicial) setLoteId(loteInicial);
  }, [loteInicial]);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setLoading(true);
      try {
        const r = await mcGet("/publicador/masivo/lotes");
        const filas = r.filas || [];
        setLotes(filas);
        setLoteId((actual) => actual || filas[0]?.id || null);
      } catch (e) {
        if (!silencioso) avisar("error", await mensajeError(e, "No se pudieron consultar los lotes."));
      } finally {
        setLoading(false);
      }
    },
    [avisar],
  );

  const cargarDetalle = useCallback(async (id) => {
    if (!id) return setDetalle(null);
    try {
      setDetalle(await mcGet(`/publicador/masivo/lotes/${id}`));
    } catch (e) {
      setDetalle(null);
    }
  }, []);

  useEffect(() => {
    if (visible) cargar();
  }, [visible, cargar]);

  useEffect(() => {
    cargarDetalle(loteId);
  }, [loteId, cargarDetalle]);

  // Refresco automático mientras haya lotes en curso y la pestaña esté a la vista
  const hayActivos = lotes.some((l) => ["pendiente", "procesando"].includes(l.estado));
  useEffect(() => {
    if (!visible || !hayActivos) return undefined;
    const t = setInterval(() => {
      cargar(true);
      cargarDetalle(loteId);
    }, REFRESCO_MS);
    return () => clearInterval(t);
  }, [visible, hayActivos, cargar, cargarDetalle, loteId]);

  const cancelar = async () => {
    setCancelando(true);
    try {
      const r = await mcPost(`/publicador/masivo/lotes/${loteId}/cancelar`);
      avisar("info", `Lote #${loteId} cancelado (${r.cancelados} pendiente(s) detenidas).`);
      cargar(true);
      cargarDetalle(loteId);
    } catch (e) {
      avisar("error", await mensajeError(e, "No se pudo cancelar el lote."));
    } finally {
      setCancelando(false);
    }
  };

  const colLotes = useMemo(
    () => [
      { field: "id", headerName: "Lote", width: 80, renderCell: (p) => <b>#{p.value}</b> },
      { field: "estado", headerName: "Estado", width: 120, renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADOS_LOTE} /> },
      { field: "cuenta_destino", headerName: "Destino", width: 160 },
      { field: "avance", headerName: "Avance", minWidth: 160, flex: 1, sortable: false, renderCell: (p) => <ProgresoLote lote={p.row} /> },
      { field: "publicados", headerName: "Publicadas", width: 100, type: "number" },
      { field: "omitidos", headerName: "Omitidas", width: 95, type: "number" },
      { field: "errores", headerName: "Errores", width: 85, type: "number" },
      { field: "creado_por", headerName: "Creado por", width: 130 },
      { field: "fecha_creado", headerName: "Fecha", width: 140, valueFormatter: (v) => formatoFecha(v) },
    ],
    [],
  );

  const colItems = useMemo(
    () => [
      { field: "estado", headerName: "Estado", width: 115, renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADOS_ITEM} /> },
      {
        field: "titulo",
        headerName: "Origen",
        minWidth: 280,
        flex: 1.4,
        renderCell: (p) => <ProductoCell row={p.row} titulo={p.row.titulo} sub={`${p.row.item_id_origen} · MLMU ${p.row.user_product_id || ""}`} />,
      },
      {
        field: "item_id_destino",
        headerName: "Nueva publicación",
        width: 160,
        renderCell: (p) =>
          p.value && p.row.permalink ? (
            <Link href={p.row.permalink} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>
              {p.value}
            </Link>
          ) : (
            p.value || ""
          ),
      },
      { field: "precio", headerName: "Precio", width: 110, valueFormatter: (v) => dinero(v) },
      { field: "cantidad", headerName: "Stock", width: 75, type: "number" },
      {
        field: "detalle",
        headerName: "Detalle",
        minWidth: 260,
        flex: 1.2,
        renderCell: (p) => (
          <Typography variant="caption" sx={{ whiteSpace: "normal", py: 0.5 }} title={p.value || ""}>
            {p.value}
          </Typography>
        ),
      },
    ],
    [],
  );

  const l = detalle?.lote;
  const activo = l && ["pendiente", "procesando"].includes(l.estado);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <SectionCard
        icon={DynamicFeedOutlinedIcon}
        title="Lotes"
        subtitle={hayActivos ? "Se actualiza solo cada 5 segundos mientras haya lotes en curso." : "Elige un lote para ver su detalle."}
        count={lotes.length}
        actions={
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => cargar()} sx={botonSx}>
            Actualizar
          </Button>
        }
      >
        <Box sx={{ height: 300, width: "100%" }}>
          <DataGrid
            sx={{ ...gridSx, "& .MuiDataGrid-row": { cursor: "pointer" } }}
            rows={lotes}
            columns={colLotes}
            loading={loading}
            onRowClick={(p) => setLoteId(p.row.id)}
            rowSelectionModel={loteId ? [loteId] : []}
            density="compact"
            hideFooterSelectedRowCount
            showColumnVerticalBorder
            pageSizeOptions={[PAGE_SIZE]}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Todavía no hay lotes. Crea uno en la pestaña Seleccionar." }}
          />
        </Box>
      </SectionCard>

      {l && (
        <>
          <Box sx={kpiGridSx}>
            <KpiCard icon={CheckCircleOutlineIcon} color="#2e7d32" label="Publicadas">
              <KpiValor valor={l.publicados} detalle={`de ${l.total} en el lote`} />
            </KpiCard>
            <KpiCard icon={DoNotDisturbOnOutlinedIcon} color="#0288d1" label="Omitidas">
              <KpiValor valor={l.omitidos} detalle="Ya existían o sin disponible" />
            </KpiCard>
            <KpiCard icon={ErrorOutlineIcon} color="#d32f2f" label="Con error">
              <KpiValor valor={l.errores} detalle="Ver el detalle de cada una" />
            </KpiCard>
            <KpiCard icon={HourglassEmptyOutlinedIcon} color="#ed6c02" label="En cola">
              <KpiValor valor={l.pendientes + l.procesando} detalle={activo ? "Se publican unas pocas por minuto" : "—"} />
            </KpiCard>
          </Box>

          <SectionCard
            icon={ListAltOutlinedIcon}
            title={`Lote #${l.id} · ${l.cuenta_destino}`}
            subtitle={`Creado por ${l.creado_por || "—"} el ${formatoFecha(l.fecha_creado)} · tipo ${
              TIPOS.find((t) => t.value === l.tipo_publicacion)?.label || l.tipo_publicacion
            }`}
            count={l.total}
            actions={
              activo && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<CancelOutlinedIcon />}
                  onClick={cancelar}
                  disabled={cancelando}
                  sx={botonSx}
                >
                  Cancelar pendientes
                </Button>
              )
            }
          >
            {activo && <LinearProgress sx={{ mb: 1.5, borderRadius: 4 }} />}
            <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
              <DataGrid
                sx={gridSx}
                rows={detalle.items || []}
                columns={colItems}
                getRowHeight={() => "auto"}
                density="compact"
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                showCellVerticalBorder
                showColumnVerticalBorder
                pageSizeOptions={[PAGE_SIZE]}
                initialState={{ pagination: { paginationModel: { pageSize: PAGE_SIZE, page: 0 } } }}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { csvOptions: { fileName: `lote_${l.id}`, utf8WithBom: true } } }}
                localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Este lote no tiene publicaciones." }}
              />
            </Box>
          </SectionCard>
        </>
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Ventana
// ---------------------------------------------------------------------------
const PublicadorMasivoDialog = ({ open, onClose }) => {
  const [cuentas, setCuentas] = useState([]);
  const [destino, setDestino] = useState("");
  const [tab, setTab] = useState(0);
  const [loteNuevo, setLoteNuevo] = useState(null);
  const [aviso, setAviso] = useState(null);

  const avisar = useCallback((severity, text) => setAviso({ severity, text }), []);

  useEffect(() => {
    if (!open) return;
    mcGet("/publicador/cuentas")
      .then((r) => {
        const subcuentas = (r.filas || []).filter((c) => c.tipo !== "principal");
        setCuentas(subcuentas);
        setDestino((d) => d || subcuentas[0]?.id || "");
      })
      .catch(async (e) => avisar("error", await mensajeError(e, "No se pudieron cargar las cuentas.")));
  }, [open, avisar]);

  return (
    <Dialog fullScreen open={open} onClose={onClose} PaperProps={{ sx: { bgcolor: "#f5f7fa" } }}>
      <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
            <DynamicFeedOutlinedIcon color="primary" /> Publicador masivo
          </Typography>
          <TextField
            select
            size="small"
            label="Publicar en"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {cuentas.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nombre}
              </MenuItem>
            ))}
          </TextField>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600 } }}
          >
            <Tab label="Seleccionar" />
            <Tab label="Lotes" />
          </Tabs>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {!cuentas.length ? (
          <Alert severity="info">No hay subcuentas activas para publicar.</Alert>
        ) : (
          <>
            {tab === 0 && destino && (
              <Seleccion
                key={destino}
                destino={destino}
                avisar={avisar}
                onLoteCreado={(id) => {
                  setLoteNuevo(id);
                  setTab(1);
                }}
              />
            )}
            {tab === 1 && <Lotes visible={open && tab === 1} loteInicial={loteNuevo} avisar={avisar} />}
          </>
        )}
      </Box>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={7000}
        onClose={() => setAviso(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {aviso ? (
          <Alert severity={aviso.severity} onClose={() => setAviso(null)} variant="filled" sx={{ maxWidth: 640 }}>
            {aviso.text}
          </Alert>
        ) : (
          <span />
        )}
      </Snackbar>
    </Dialog>
  );
};

export default PublicadorMasivoDialog;
