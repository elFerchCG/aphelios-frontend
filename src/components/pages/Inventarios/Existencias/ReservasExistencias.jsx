import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import LockClockOutlinedIcon from '@mui/icons-material/LockClockOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import StoreMallDirectoryOutlinedIcon from '@mui/icons-material/StoreMallDirectoryOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import apiUrl from '../../../../config';

// ---------------------------------------------------------------------------
// Constantes y helpers
// ---------------------------------------------------------------------------
const PAGE_SIZE = 100;
const GRID_HEIGHT = 520;
const URL_RESERVAS = `${apiUrl}/inventario/existencias/reservas`;

const LOCALE_TEXT_GRID = {
  toolbarColumns: 'Columnas',
  toolbarDensity: 'Densidad',
  toolbarExport: 'Exportar',
  toolbarFilters: 'Filtros',
  filterPanelOperator: 'Operador',
  toolbarFiltersTooltipHide: 'Ocultar filtros',
  toolbarFiltersTooltipShow: 'Mostrar filtros',
  footerTotalVisibleRows: (visibleCount, totalCount) => `${visibleCount} de ${totalCount}`,
  footerPaginationRowsPerPage: 'Filas por página',
};

const gridSx = {
  fontFamily: 'Montserrat',
  borderRadius: 2,
  '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f7fa', fontWeight: 'bold', fontSize: 13 },
  '& .MuiDataGrid-columnHeader': { backgroundColor: '#f5f7fa' },
  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
  '& .MuiDataGrid-cell': { borderBottom: '1px solid #eee', fontSize: 13 },
  '& .MuiDataGrid-row:hover': { backgroundColor: '#f9fafb' },
};

const FILTROS_INICIALES = { producto: '', localidad: null, tipo: 'todas' };

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getThumbnailUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://http2.mlstatic.com/D_${url}-I.jpg`;
};

const formatoFecha = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '');

const TIPOS = {
  ml: { label: 'Venta ML', color: '#0288d1', bg: '#e1f5fe' },
  bodega: { label: 'Orden de bodega', color: '#6a1b9a', bg: '#f3e5f5' },
};

const ESTADOS = {
  reservado: { label: 'Reservado', color: 'warning' },
  confirmado: { label: 'Confirmado', color: 'info' },
  abierto: { label: 'Abierta', color: 'default' },
};

const ORIGEN_BODEGA = {
  manual: 'Manual',
  mrp: 'MRP',
  ventas_me: 'Ventas ME',
  ventas_me_refa: 'Ventas ME Refa',
};

const etiquetaOrigen = (row) =>
  row.tipo === 'bodega' ? ORIGEN_BODEGA[row.origen] || row.origen || 'Manual' : row.origen || '—';

const etiquetaEnvio = (v) => (v ? String(v).replace(/_/g, ' ') : '');

// Texto de referencia legible: orden ML / pack / envío, u orden de bodega.
const referenciaDe = (row) => {
  if (row.tipo === 'bodega') return `Orden #${row.referencia}`;
  const partes = [];
  if (row.referencia) partes.push(`Orden ${row.referencia}`);
  if (row.pack_id) partes.push(`Pack ${row.pack_id}`);
  if (row.shipment_id) partes.push(`Envío ${row.shipment_id}`);
  return partes.join(' · ') || 'Sin referencia';
};

// ---------------------------------------------------------------------------
// Piezas de UI (fuera del componente para no remontarlas en cada render)
// ---------------------------------------------------------------------------
const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children }) => (
  <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
    <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <Icon color="primary" /> {title}
          {count != null && (
            <Chip size="small" label={count} sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main', height: 22 }} />
          )}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 4 }}>
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

const KpiCard = ({ icon: Icon, color, label, onClick, activo, children }) => (
  <Paper
    elevation={2}
    onClick={onClick}
    sx={{
      p: 2,
      borderRadius: 3,
      display: 'flex',
      gap: 1.5,
      alignItems: 'flex-start',
      cursor: onClick ? 'pointer' : 'default',
      outline: activo ? `2px solid ${color}` : 'none',
      transition: 'box-shadow .15s',
      '&:hover': onClick ? { boxShadow: 6 } : undefined,
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: 2,
        bgcolor: `${color}1A`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  </Paper>
);

const TipoChip = ({ tipo }) => {
  const t = TIPOS[tipo] || TIPOS.ml;
  return (
    <Chip
      size="small"
      label={t.label}
      sx={{ fontWeight: 600, bgcolor: t.bg, color: t.color, border: `1px solid ${t.color}` }}
    />
  );
};

const EstadoChip = ({ estado }) => {
  const e = ESTADOS[estado] || { label: estado || '—', color: 'default' };
  return <Chip size="small" label={e.label} color={e.color} variant="outlined" sx={{ fontWeight: 600 }} />;
};

const ProductoCell = ({ row }) => (
  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.5, minWidth: 0, width: '100%' }}>
    <Avatar
      variant="rounded"
      src={getThumbnailUrl(row.thumbnail) || undefined}
      alt={row.title}
      sx={{ width: 34, height: 34, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0', flexShrink: 0 }}
    >
      <Inventory2OutlinedIcon sx={{ fontSize: 16, color: '#9e9e9e' }} />
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" noWrap title={row.title} sx={{ fontWeight: 600 }}>
        {row.title || 'Sin título'}
      </Typography>
      <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
        SKU: {row.sku || 'N/A'} · ML: {row.inventory_id || 'N/A'} · MLM: {row.mlm || 'N/A'}
      </Typography>
    </Box>
  </Stack>
);

// Resume la respuesta del backend en las 4 tarjetas KPI.
const calcularKpis = (resumen = []) => {
  const kpi = {
    total: { piezas: 0, registros: 0 },
    aphelios: { piezas: 0, registros: 0 },
    subcuentas: { piezas: 0, registros: 0, cuentas: [] },
    bodega: { piezas: 0, registros: 0 },
  };
  for (const r of resumen) {
    const destino =
      r.tipo === 'bodega' ? kpi.bodega : r.origen === 'Aphelios' ? kpi.aphelios : kpi.subcuentas;
    destino.piezas += toNumber(r.piezas);
    destino.registros += toNumber(r.registros);
    if (destino === kpi.subcuentas && r.origen) kpi.subcuentas.cuentas.push(r.origen);
    kpi.total.piezas += toNumber(r.piezas);
    kpi.total.registros += toNumber(r.registros);
  }
  return kpi;
};

// ---------------------------------------------------------------------------
// Panel lateral: reservas de UN producto en UNA ubicación (desde la tabla)
// ---------------------------------------------------------------------------
export const ReservasDrawer = ({ fila, onClose, onVerTodas }) => {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fila) return undefined;
    let vigente = true;
    setCargando(true);
    setError('');
    setItems([]);
    axios
      .get(URL_RESERVAS, {
        ...getAuthHeaders(),
        params: { producto_id: fila.producto_id, localidad_id: fila.localidad_id, pageSize: PAGE_SIZE },
      })
      .then((r) => vigente && setItems(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => vigente && setError('No se pudieron consultar las reservas.'))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [fila]);

  const existencia = toNumber(fila?.existencia_actual);
  const reservado = toNumber(fila?.total_reservado);
  const pct = existencia > 0 ? Math.min(100, Math.round((reservado / existencia) * 100)) : reservado > 0 ? 100 : 0;
  const sumaListada = items.reduce((acc, x) => acc + toNumber(x.cantidad), 0);

  return (
    <Drawer anchor="right" open={Boolean(fila)} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 460 } } }}>
      {fila && (
        <Stack sx={{ height: '100%' }}>
          <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockClockOutlinedIcon color="primary" /> ¿De dónde sale lo reservado?
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }} noWrap title={fila.title}>
                {fila.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Ubicación: <b>{fila.localidad_descripcion || '—'}</b> · Producto ID {fila.producto_id}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" aria-label="Cerrar">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Resumen de la ubicación */}
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1.5 }}>
              {[
                ['Existencia', existencia, 'text.primary'],
                ['Reservado', reservado, '#ed6c02'],
                ['Disponible', toNumber(fila.disponible), toNumber(fila.disponible) > 0 ? '#2e7d32' : '#d32f2f'],
              ].map(([label, valor, color]) => (
                <Paper key={label} variant="outlined" sx={{ p: 1, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color }}>
                    {valor}
                  </Typography>
                </Paper>
              ))}
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {pct}% de la existencia está comprometida · Ventas ML {toNumber(fila.reservado_ml)} · Órdenes{' '}
              {toNumber(fila.reservado_ordenes)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={pct}
              color={pct >= 100 ? 'error' : 'warning'}
              sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
            />
          </Box>
          <Divider />

          {/* Detalle */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {cargando && <LinearProgress />}
            {error && (
              <Typography variant="body2" color="error" sx={{ textAlign: 'center', py: 2 }}>
                {error}
              </Typography>
            )}
            {!cargando && !error && items.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                No hay reservas activas para este producto en esta ubicación.
              </Typography>
            )}
            {items.map((r) => (
              <Paper
                key={r.row_id}
                variant="outlined"
                sx={{ p: 1.25, borderRadius: 2, borderLeft: `4px solid ${(TIPOS[r.tipo] || TIPOS.ml).color}` }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
                    <TipoChip tipo={r.tipo} />
                    <Chip size="small" label={etiquetaOrigen(r)} sx={{ fontWeight: 600 }} />
                    <EstadoChip estado={r.estado} />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }} title="Piezas reservadas">
                    {toNumber(r.cantidad)}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 600, wordBreak: 'break-all' }}>
                  {referenciaDe(r)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {formatoFecha(r.fecha)}
                  {r.estado_envio ? ` · Envío: ${etiquetaEnvio(r.estado_envio)}` : ''}
                  {r.tipo === 'bodega' && r.tipo_transaccion ? ` · ${r.tipo_transaccion}` : ''}
                </Typography>
                {r.descripcion && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }} title={r.descripcion}>
                    {r.descripcion}
                  </Typography>
                )}
              </Paper>
            ))}
            {!cargando && items.length > 0 && sumaListada !== reservado && (
              <Typography variant="caption" sx={{ color: 'warning.main', textAlign: 'center' }}>
                Lo listado suma {sumaListada} pza(s) y la tabla muestra {reservado}. Pulsa Actualizar en Existencias por si
                cambió algo.
              </Typography>
            )}
          </Box>

          <Divider />
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              onClick={() => onVerTodas(fila)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Ver todas las ubicaciones del producto
            </Button>
          </Box>
        </Stack>
      )}
    </Drawer>
  );
};

// ---------------------------------------------------------------------------
// Pestaña "Reservas"
// ---------------------------------------------------------------------------
// `filtroProducto` = { producto_id, title } cuando se llega desde la tabla de
// Existencias (el padre remonta con `key` al cambiarlo); `recarga` cambia al
// pulsar Actualizar arriba.
const ReservasExistencias = ({ localidades, filtroProducto, onQuitarFiltroProducto, recarga }) => {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [aplicados, setAplicados] = useState(FILTROS_INICIALES);
  const [rows, setRows] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);

  const productoId = filtroProducto?.producto_id || null;

  const fetchReservas = useCallback(
    async (f, pagina, acumular) => {
      if (acumular) setCargandoMas(true);
      else setLoading(true);
      try {
        const params = { page: pagina, pageSize: PAGE_SIZE };
        if (f.producto.trim()) params.producto = f.producto.trim();
        if (f.localidad) params.localidad_id = f.localidad.id;
        if (f.tipo !== 'todas') params.tipo = f.tipo;
        if (productoId) params.producto_id = productoId;

        const { data } = await axios.get(URL_RESERVAS, { ...getAuthHeaders(), params });
        const lista = Array.isArray(data?.data) ? data.data : [];
        setRows((prev) => (acumular ? [...prev, ...lista] : lista));
        setTotal(toNumber(data?.total));
        setResumen(Array.isArray(data?.resumen) ? data.resumen : []);
        setPage(pagina);
        setAplicados(f);
      } catch (error) {
        console.error(error);
        if (!acumular) {
          setRows([]);
          setTotal(0);
          setResumen([]);
        }
        Swal.fire({ title: 'Error', text: 'No se pudieron consultar las reservas.', icon: 'error', timer: 5000, showCloseButton: true });
      } finally {
        setLoading(false);
        setCargandoMas(false);
      }
    },
    [productoId]
  );

  // Se consulta al montar y al pulsar Actualizar (con los filtros aplicados).
  useEffect(() => {
    fetchReservas(aplicados, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReservas, recarga]);

  const kpi = useMemo(() => calcularKpis(resumen), [resumen]);

  const aplicarTipo = (tipo) => {
    const f = { ...filtros, tipo };
    setFiltros(f);
    fetchReservas(f, 1, false);
  };

  const handleBuscar = () => fetchReservas(filtros, 1, false);
  const handleLimpiar = () => {
    setFiltros(FILTROS_INICIALES);
    if (productoId) onQuitarFiltroProducto();
    else fetchReservas(FILTROS_INICIALES, 1, false);
  };
  const handleEnter = (e) => {
    if (e.key === 'Enter') handleBuscar();
  };

  const columns = useMemo(
    () => [
      { field: 'tipo', headerName: 'Tipo', width: 165, renderCell: (p) => <TipoChip tipo={p.value} /> },
      {
        field: 'origen',
        headerName: 'Origen',
        width: 150,
        valueGetter: (value, row) => etiquetaOrigen(row),
        renderCell: (p) => <Chip size="small" label={p.value} sx={{ fontWeight: 600 }} />,
      },
      {
        field: 'referencia',
        headerName: 'Referencia',
        minWidth: 230,
        flex: 1,
        valueGetter: (value, row) => referenciaDe(row),
        renderCell: (p) => (
          <Box sx={{ minWidth: 0, py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={p.value}>
              {p.value}
            </Typography>
            {(p.row.descripcion || p.row.estado_envio) && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap title={p.row.descripcion || ''}>
                {p.row.tipo === 'bodega' ? p.row.descripcion : `Envío: ${etiquetaEnvio(p.row.estado_envio)}`}
              </Typography>
            )}
          </Box>
        ),
      },
      { field: 'estado', headerName: 'Estado', width: 125, renderCell: (p) => <EstadoChip estado={p.value} /> },
      {
        field: 'title',
        headerName: 'Producto',
        minWidth: 320,
        flex: 1.6,
        renderCell: (p) => <ProductoCell row={p.row} />,
      },
      { field: 'localidad_descripcion', headerName: 'Ubicación', width: 140 },
      {
        field: 'cantidad',
        headerName: 'Piezas',
        type: 'number',
        width: 90,
        headerAlign: 'center',
        align: 'center',
        valueGetter: (value) => toNumber(value),
        renderCell: (p) => <Typography sx={{ fontWeight: 700 }}>{p.value}</Typography>,
      },
      { field: 'fecha', headerName: 'Fecha', width: 140, valueFormatter: (value) => formatoFecha(value) },
      { field: 'producto_id', headerName: 'Producto ID', width: 110 },
      { field: 'mlm', headerName: 'MLM', width: 140 },
      { field: 'sku', headerName: 'SKU', width: 130 },
      { field: 'pack_id', headerName: 'Pack', width: 160 },
      { field: 'shipment_id', headerName: 'Envío', width: 140 },
    ],
    []
  );

  const hayMas = rows.length < total;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ---------- KPIs (clic = filtrar por tipo) ---------- */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
        <KpiCard icon={LockClockOutlinedIcon} color="#ed6c02" label="Piezas reservadas" onClick={() => aplicarTipo('todas')} activo={aplicados.tipo === 'todas'}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {kpi.total.piezas}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {kpi.total.registros} reserva(s) activas
          </Typography>
        </KpiCard>
        <KpiCard icon={StorefrontOutlinedIcon} color="#1976d2" label="Ventas Aphelios" onClick={() => aplicarTipo('ml')} activo={aplicados.tipo === 'ml'}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {kpi.aphelios.piezas}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {kpi.aphelios.registros} venta(s) de la cuenta principal
          </Typography>
        </KpiCard>
        <KpiCard icon={StoreMallDirectoryOutlinedIcon} color="#2e7d32" label="Ventas subcuentas" onClick={() => aplicarTipo('ml')} activo={aplicados.tipo === 'ml'}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {kpi.subcuentas.piezas}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap title={kpi.subcuentas.cuentas.join(', ')}>
            {kpi.subcuentas.registros} venta(s){kpi.subcuentas.cuentas.length ? ` · ${kpi.subcuentas.cuentas.join(', ')}` : ''}
          </Typography>
        </KpiCard>
        <KpiCard icon={SwapHorizOutlinedIcon} color="#6a1b9a" label="Órdenes de bodega" onClick={() => aplicarTipo('bodega')} activo={aplicados.tipo === 'bodega'}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {kpi.bodega.piezas}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {kpi.bodega.registros} línea(s) de salida o transferencia
          </Typography>
        </KpiCard>
      </Box>

      {/* ---------- Filtros ---------- */}
      <SectionCard
        icon={FilterAltOutlinedIcon}
        title="Filtros"
        subtitle="Solo reservas que hoy restan al disponible: ventas ML reservadas o confirmadas y órdenes de bodega abiertas o confirmadas."
      >
        <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
          {filtroProducto && (
            <Chip
              color="primary"
              label={`Producto: ${filtroProducto.title || filtroProducto.producto_id}`}
              onDelete={onQuitarFiltroProducto}
              sx={{ fontWeight: 600, maxWidth: 360 }}
            />
          )}
          <TextField
            label="Producto, SKU, ML, MLM u orden/pack"
            size="small"
            value={filtros.producto}
            onChange={(e) => setFiltros((prev) => ({ ...prev, producto: e.target.value }))}
            onKeyDown={handleEnter}
            sx={{ minWidth: 260, flex: 1 }}
          />
          <Autocomplete
            size="small"
            options={localidades}
            value={filtros.localidad}
            onChange={(e, v) => setFiltros((prev) => ({ ...prev, localidad: v }))}
            getOptionLabel={(o) => o?.descripcion || ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(params) => <TextField {...params} label="Ubicación" />}
            sx={{ minWidth: 200 }}
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filtros.tipo}
            onChange={(e, v) => v && setFiltros((prev) => ({ ...prev, tipo: v }))}
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, px: 1.5 } }}
          >
            <ToggleButton value="todas">Todas</ToggleButton>
            <ToggleButton value="ml">Ventas ML</ToggleButton>
            <ToggleButton value="bodega">Órdenes de bodega</ToggleButton>
          </ToggleButtonGroup>
          <Stack direction="row" gap={1} sx={{ ml: { sm: 'auto' } }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={handleLimpiar}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Limpiar
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SearchIcon />}
              onClick={handleBuscar}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Buscar
            </Button>
          </Stack>
        </Stack>
      </SectionCard>

      {/* ---------- Detalle ---------- */}
      <SectionCard
        icon={ListAltOutlinedIcon}
        title="Origen de las reservas"
        subtitle="Cada fila es una reserva: qué la generó, de qué ubicación sale y cuántas piezas aparta."
        count={total}
      >
        <Box sx={{ height: GRID_HEIGHT, width: '100%' }}>
          <DataGrid
            sx={gridSx}
            rows={rows}
            columns={columns}
            getRowId={(r) => r.row_id}
            getRowHeight={() => 'auto'}
            loading={loading}
            showCellVerticalBorder
            showColumnVerticalBorder
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            density="compact"
            pageSizeOptions={[PAGE_SIZE]}
            initialState={{
              pagination: { paginationModel: { pageSize: PAGE_SIZE, page: 0 } },
              columns: { columnVisibilityModel: { producto_id: false, mlm: false, sku: false, pack_id: false, shipment_id: false } },
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: { csvOptions: { fileName: 'reservas_existencias', utf8WithBom: true } },
              loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
            }}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: 'No hay reservas activas con estos filtros.' }}
          />
        </Box>
        {hayMas && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => fetchReservas(aplicados, page + 1, true)}
              disabled={cargandoMas || loading}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {cargandoMas ? 'Cargando…' : `Cargar más (${rows.length} de ${total})`}
            </Button>
          </Box>
        )}
      </SectionCard>
    </Box>
  );
};

export default ReservasExistencias;
