import React from 'react';
import dayjs from 'dayjs';
import {
    Box, Button, Chip, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import apiUrl from '../../../config';

// Kit visual compartido del módulo Dirección (tableros para directivos).

export const API_DIRECCION = `${apiUrl}/direccion`;
export const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export const COLORES = {
    azul: '#1976d2', azulOscuro: '#1565c0', azulClaro: '#90caf9', celeste: '#0288d1',
    verde: '#2e7d32', naranja: '#ed6c02', morado: '#6a1b9a', rojo: '#d32f2f', ambar: '#ffb74d',
};

export const cardSx = { p: { xs: 1.5, sm: 2 }, borderRadius: 3 };
const botonSx = { borderRadius: 2, textTransform: 'none', fontWeight: 600 };

// ---------- Formatos ----------
export const fmtFecha = (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '');
export const fmtFechaHora = (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '');
export const fmtNumero = (v) => (v == null ? '—' : Number(v).toLocaleString('es-MX'));
export const fmtPct = (v) => (v == null ? '—' : `${Number(v).toLocaleString('es-MX', { maximumFractionDigits: 1 })} %`);

// Minutos legibles: 38 min · 1 h 40 min · 2 d 4 h
export const fmtMinutos = (m) => {
    if (m == null) return '—';
    if (m < 60) return `${m} min`;
    if (m < 1440) {
        const h = Math.floor(m / 60), r = m % 60;
        return r ? `${h} h ${r} min` : `${h} h`;
    }
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
    return h ? `${d} d ${h} h` : `${d} d`;
};

// Segundos legibles: 45 s · 3 min 20 s · 1 h 5 min
export const fmtSegundos = (s) => {
    if (s == null) return '—';
    if (s < 60) return `${s} s`;
    if (s < 3600) {
        const m = Math.floor(s / 60), r = s % 60;
        return r ? `${m} min ${r} s` : `${m} min`;
    }
    return fmtMinutos(Math.round(s / 60));
};

// Colores por usuario (orden de la lista que manda el backend).
export const PALETA_USUARIOS = ['#1565c0', '#ed6c02', '#2e7d32', '#6a1b9a', '#0288d1', '#c2185b', '#5d4037', '#455a64', '#f9a825', '#00897b'];

// ---------- Periodo ----------
export const PRESETS = [
    { valor: '7', label: '7 días' },
    { valor: '30', label: '30 días' },
    { valor: 'mes', label: 'Mes actual' },
    { valor: 'custom', label: 'Personalizado' },
];

export const periodoDePreset = (preset, actual) => {
    const hoy = dayjs();
    if (preset === '7') return { preset, desde: hoy.subtract(6, 'day').format('YYYY-MM-DD'), hasta: hoy.format('YYYY-MM-DD') };
    if (preset === 'mes') return { preset, desde: hoy.startOf('month').format('YYYY-MM-DD'), hasta: hoy.format('YYYY-MM-DD') };
    if (preset === 'custom') return { ...actual, preset };
    return { preset: '30', desde: hoy.subtract(29, 'day').format('YYYY-MM-DD'), hasta: hoy.format('YYYY-MM-DD') };
};

export const PERIODO_INICIAL = periodoDePreset('30');

// ---------- Variación contra el periodo anterior ----------
// mejor: 'sube' | 'baja' | null (neutro). unidad 'pts' para porcentajes.
export const variacion = (actual, anterior, { mejor = 'sube', unidad = '%' } = {}) => {
    if (actual == null || anterior == null) return null;
    const diff = unidad === 'pts' ? actual - anterior : anterior ? ((actual - anterior) / anterior) * 100 : null;
    if (diff == null) return null;
    const redondeo = Math.round(diff * 10) / 10;
    const flecha = redondeo > 0 ? '▲' : redondeo < 0 ? '▼' : '=';
    const tipo = !mejor || redondeo === 0 ? 'neutro' : (redondeo > 0) === (mejor === 'sube') ? 'bien' : 'mal';
    return { texto: `${flecha} ${Math.abs(redondeo).toLocaleString('es-MX')} ${unidad}`, tipo };
};

const COLOR_TIPO = {
    bien: { bgcolor: '#e8f5e9', color: '#1b5e20' },
    mal: { bgcolor: '#fdecea', color: '#b71c1c' },
    neutro: { bgcolor: '#f1f3f5', color: '#374151' },
};

export const ChipVariacion = ({ v }) =>
    v ? <Chip size="small" label={v.texto} sx={{ height: 20, fontSize: 11, fontWeight: 700, ...COLOR_TIPO[v.tipo] }} /> : null;

// ---------- Piezas ----------
export const KpiCard = ({ icon: Icon, color, label, valor, variacionKpi, detalle, progreso }) => (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: `${color}1A`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{valor}</Typography>
            <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
                <ChipVariacion v={variacionKpi} />
                {detalle && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{detalle}</Typography>}
            </Stack>
            {progreso != null && (
                <Box sx={{ mt: 0.75, height: 8, borderRadius: 4, bgcolor: '#e8eef5', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${Math.min(progreso, 100)}%`, bgcolor: color, borderRadius: 4 }} />
                </Box>
            )}
        </Box>
    </Paper>
);

// Caja de gráfica con "¿Cómo se calcula?".
export const ChartCard = ({ title, subtitle, ayuda, actions, children, sx }) => (
    <Paper elevation={2} sx={{ ...cardSx, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5, ...sx }}>
        <Stack direction="row" gap={1} alignItems="flex-start">
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{title}</Typography>
                {subtitle && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>}
            </Box>
            {actions}
            {ayuda && (
                <Tooltip arrow title={<Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>{ayuda}</Typography>}>
                    <IconButton size="small" aria-label="Cómo se calcula"><HelpOutlineOutlinedIcon fontSize="small" /></IconButton>
                </Tooltip>
            )}
        </Stack>
        {children}
    </Paper>
);

export const Leyenda = ({ items }) => (
    <Stack direction="row" gap={1.5} flexWrap="wrap">
        {items.map(({ label, color, linea }) => (
            <Stack key={label} direction="row" gap={0.75} alignItems="center">
                <Box sx={{ width: linea ? 14 : 10, height: linea ? 3 : 10, borderRadius: linea ? 0 : 0.5, bgcolor: color }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
            </Stack>
        ))}
    </Stack>
);

export const SinDatos = ({ texto = 'Sin datos en el periodo seleccionado.' }) => (
    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>{texto}</Typography>
);

// Encabezado de página con periodo y Actualizar.
export const EncabezadoDireccion = ({ icon: Icon, titulo, descripcion, periodo, onPeriodo, onActualizar, loading, children }) => {
    const cambiarPreset = (_, v) => v && onPeriodo(periodoDePreset(v, periodo));
    const cambiarFecha = (campo) => (v) => v && v.isValid() && onPeriodo({ ...periodo, preset: 'custom', [campo]: v.format('YYYY-MM-DD') });
    return (
        <Paper elevation={2} sx={{ p: 1.5, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Icon color="primary" /> {titulo}
                        <Chip size="small" label={`${fmtFecha(periodo.desde)} – ${fmtFecha(periodo.hasta)}`} sx={{ bgcolor: '#e3f2fd', color: 'primary.main', fontWeight: 700 }} />
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 4 }}>{descripcion}</Typography>
                </Box>
                <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                    <ToggleButtonGroup size="small" exclusive color="primary" value={periodo.preset} onChange={cambiarPreset}>
                        {PRESETS.map((p) => (
                            <ToggleButton key={p.valor} value={p.valor} sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}>{p.label}</ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    {periodo.preset === 'custom' && (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker label="Desde" format="DD/MM/YYYY" disableFuture value={dayjs(periodo.desde)} maxDate={dayjs(periodo.hasta)}
                                onChange={cambiarFecha('desde')} slotProps={{ textField: { size: 'small', sx: { width: 160 } } }} />
                            <DatePicker label="Hasta" format="DD/MM/YYYY" disableFuture value={dayjs(periodo.hasta)} minDate={dayjs(periodo.desde)}
                                onChange={cambiarFecha('hasta')} slotProps={{ textField: { size: 'small', sx: { width: 160 } } }} />
                        </LocalizationProvider>
                    )}
                    <Tooltip arrow title="Recargar los datos del tablero">
                        <span>
                            <Button variant="outlined" size="small" startIcon={<RefreshIcon />} sx={botonSx} onClick={onActualizar} disabled={loading}>
                                Actualizar
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            </Stack>
            {children}
        </Paper>
    );
};
