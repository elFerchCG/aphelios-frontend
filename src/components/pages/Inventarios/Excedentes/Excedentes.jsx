import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TablePagination,
    Avatar,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    FormHelperText,
    Snackbar,
    Alert,
    Skeleton,
    Divider,
    Stack,
    CircularProgress,
    IconButton,
    Autocomplete,
    createFilterOptions,
    Tabs,
    Tab,
    Checkbox,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    SwapHoriz as SwapHorizIcon,
    Inventory2 as Inventory2Icon,
    WarningAmber as WarningAmberIcon,
    Inbox as InboxIcon,
    Close as CloseIcon,
    ArrowForward as ArrowForwardIcon,
    PlaylistAddCheck as PlaylistAddCheckIcon,
    Block as BlockIcon,
    ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';

// ---------------------------------------------------------------------------
// Tokens de diseño
// ---------------------------------------------------------------------------
const tokens = {
    ink: '#1C1E22',
    slate: '#5B6470',
    slateLight: '#8A93A0',
    line: '#E4E7EC',
    surface: '#FFFFFF',
    canvas: '#F7F8FA',
    amber: '#B7791F',
    amberBg: '#FEF3E2',
    amberBorder: '#F3D9A4',
    danger: '#C0392B',
    dangerBg: '#FBEAE8',
    success: '#2E7D5B',
    successBg: '#E7F5EE',
};

const fmtNum = (n) => new Intl.NumberFormat('es-MX').format(n ?? 0);
const fmtDateTime = (d) => {
    if (!d) return '—';
    try {
        return new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(d));
    } catch {
        return d;
    }
};

// NUEVO: lo realmente disponible para reubicar (contado físicamente),
// con fallback a existencia_actual para registros viejos sin el cálculo.
const getDisponible = (row) => {
    if (!row) return 0;
    const disponible = Number(row.excedente_disponible);
    if (Number.isFinite(disponible)) return disponible;
    return Number(row.existencia_actual) || 0;
};

const apiUrl =
    process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_API_URL
        : process.env.REACT_APP_API_URL_LOCAL;

const getThumbnailUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://http2.mlstatic.com/D_${url}-I.jpg`;
};

// ---------------------------------------------------------------------------
// Servicios de API
// ---------------------------------------------------------------------------
async function fetchExcedentes() {
    const res = await fetch(`${apiUrl}/inventario/existencias/nuevos-excedentes`);
    if (!res.ok) throw new Error('Error al obtener el inventario de excedentes');
    return res.json();
}

async function fetchBodegas() {
    const res = await fetch(`${apiUrl}/inventario/bodegas/`);
    if (!res.ok) throw new Error('Error al obtener el catálogo de bodegas');
    return res.json();
}

// Mismo endpoint que usa "Órdenes de bodega" para el select de "Ubicación de
// entrada": trae, por ubicación de la bodega destino, la existencia actual
// del producto (cantidad) y lo que tiene pendiente de ingreso
// (pendiente_ingreso, de órdenes de bodega abiertas/confirmadas tipo
// entrada/transferencia hacia esa ubicación) — para poder priorizar esas
// ubicaciones en vez de mostrarlas en orden alfabético plano.
async function fetchLocalidadesEntradaPorProducto(productoId, bodegaId) {
    const res = await fetch(
        `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoId}/bodega/${bodegaId}/tipo/entrada/localidades`
    );
    if (res.status === 404) {
        // La bodega destino no tiene ubicaciones activas: no es un error real,
        // simplemente no hay nada que priorizar.
        return [];
    }
    if (!res.ok) throw new Error('Error al obtener las ubicaciones del producto en la bodega destino');
    const json = await res.json();
    return Array.isArray(json?.data?.existencias) ? json.data.existencias : [];
}

async function postMovimiento(payload) {
    const res = await fetch(`${apiUrl}/inventario/existencias/movimiento-excedente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data?.message?.messageText || data?.error || 'Error al procesar el movimiento');
    }
    return data;
}

async function fetchMovimientos(estatus) {
    const qs = estatus ? `?estatus=${estatus}` : '';
    const res = await fetch(`${apiUrl}/inventario/existencias/movimientos-excedentes${qs}`);
    if (!res.ok) throw new Error('Error al obtener los movimientos');
    return res.json();
}

async function postGenerarOrden(payload) {
    const res = await fetch(`${apiUrl}/inventario/existencias/generar-transferencia-excedentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data?.message?.messageText || data?.error || 'Error al generar la orden');
    }
    return data;
}

// Cancela total o parcialmente un excedente 'sin_procesar'. Requiere token:
// descuenta existencias con una orden de bodega de salida.
async function postCancelarExcedente(movimientoId, payload, token) {
    const res = await fetch(`${apiUrl}/inventario/existencias/movimientos-excedentes/${movimientoId}/cancelar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            throw new Error(data?.message && typeof data.message === 'string'
                ? data.message
                : 'No tienes permisos para cancelar excedentes (administrador o almacenista supervisor).');
        }
        const errores = data?.message?.errores || [];
        const detalles = data?.message?.detalles || [];
        const extra = [...errores.map((e) => e.mensaje), ...detalles].filter(Boolean).join(' · ');
        throw new Error(
            `${data?.message?.messageText || data?.error || 'Error al cancelar el excedente'}${extra ? `: ${extra}` : ''}`
        );
    }
    return data;
}

// ---------------------------------------------------------------------------
// Cancelación de excedentes
// ---------------------------------------------------------------------------
const MOTIVOS_CANCELACION = [
    { value: 'conteo_erroneo', label: 'Conteo erróneo / sobre-conteo' },
    { value: 'no_llego', label: 'No llegó físicamente' },
    { value: 'merma_danado', label: 'Merma o producto dañado' },
    { value: 'error_captura', label: 'Error de captura' },
    { value: 'otro', label: 'Otro (especificar)' },
];

const etiquetaMotivo = (valor) =>
    MOTIVOS_CANCELACION.find((m) => m.value === valor)?.label || valor || '—';

// Solo se cancela lo que sigue sin procesar y nunca se reubicó
const esCancelable = (row) =>
    Boolean(row) &&
    row.localidad_destino_id == null &&
    row.bodega_destino_id == null &&
    row.orden_id == null &&
    row.linea_orden_id == null;

// ---------------------------------------------------------------------------
// Componentes auxiliares
// ---------------------------------------------------------------------------
function KpiCard({ icon, label, value, tone = 'default' }) {
    const toneStyles = {
        danger: { bg: tokens.dangerBg, fg: tokens.danger },
        amber: { bg: tokens.amberBg, fg: tokens.amber },
        success: { bg: tokens.successBg, fg: tokens.success },
        default: { bg: tokens.canvas, fg: tokens.slate },
    };
    const t = toneStyles[tone];
    return (
        <Paper
            variant="outlined"
            sx={{ p: 2.25, borderRadius: 2, borderColor: tokens.line, display: 'flex', alignItems: 'center', gap: 1.75, height: '100%' }}
        >
            <Box sx={{ width: 42, height: 42, borderRadius: 1.5, bgcolor: t.bg, color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: tokens.slateLight, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                    {label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.ink, lineHeight: 1.2 }}>
                    {value}
                </Typography>
            </Box>
        </Paper>
    );
}

function EstadoVacio({ mensaje, detalle }) {
    return (
        <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <InboxIcon sx={{ fontSize: 40, color: tokens.slateLight }} />
            <Typography sx={{ fontWeight: 600, color: tokens.ink }}>{mensaje}</Typography>
            {detalle && (
                <Typography variant="body2" sx={{ color: tokens.slateLight, textAlign: 'center', maxWidth: 360 }}>
                    {detalle}
                </Typography>
            )}
        </Box>
    );
}

const estatusChipStyle = {
    pendiente: { bg: tokens.amberBg, fg: tokens.amber, label: 'Pendiente' },
    asociado: { bg: tokens.successBg, fg: tokens.success, label: 'Asociado a orden' },
    cancelado: { bg: tokens.dangerBg, fg: tokens.danger, label: 'Cancelado' },
};

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------
export default function ExcedentesMonitor() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const [activeTab, setActiveTab] = useState(0); // 0 = disponibles, 1 = movimientos

    // ---- Tab "Excedentes disponibles" ----
    const [rows, setRows] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [localidades, setLocalidades] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingLocalidades, setLoadingLocalidades] = useState(false);

    const [search, setSearch] = useState('');
    const [orderBy, setOrderBy] = useState('existencia_actual');
    const [order, setOrder] = useState('desc');

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [moveTarget, setMoveTarget] = useState(null);
    const [selectedBodega, setSelectedBodega] = useState('');
    const [selectedLocalidad, setSelectedLocalidad] = useState('');
    const [moveCantidad, setMoveCantidad] = useState('');
    const [moveErrors, setMoveErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // ---- Tab "Movimientos" ----
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientos, setLoadingMovimientos] = useState(false);
    const [estatusFiltro, setEstatusFiltro] = useState('pendiente');
    const [seleccionados, setSeleccionados] = useState([]); // array de ids
    const [openGenerarDialog, setOpenGenerarDialog] = useState(false);
    const [descripcionOrden, setDescripcionOrden] = useState('');
    const [generando, setGenerando] = useState(false);

    const [searchMov, setSearchMov] = useState('');
    const [pageMov, setPageMov] = useState(0);
    const [rowsPerPageMov, setRowsPerPageMov] = useState(10);
    const [orderByMov, setOrderByMov] = useState('fecha');
    const [orderMov, setOrderMov] = useState('desc');

    // ---- Cancelación de excedentes ----
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelTipo, setCancelTipo] = useState('total'); // 'total' | 'parcial'
    const [cancelCantidad, setCancelCantidad] = useState('');
    const [cancelMotivo, setCancelMotivo] = useState('');
    const [cancelComentario, setCancelComentario] = useState('');
    const [cancelErrors, setCancelErrors] = useState({});
    const [cancelando, setCancelando] = useState(false);

    // ---- Auditoría (detalle de un cancelado) ----
    const [auditTarget, setAuditTarget] = useState(null);

    const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('token'));
            setUser(JSON.parse(localStorage.getItem('user')));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Carga inicial (excedentes + bodegas)
    const cargarInicial = useCallback(async () => {
        setLoading(true);
        try {
            const [excedentesData, bodegasData] = await Promise.all([fetchExcedentes(), fetchBodegas()]);
            setRows(Array.isArray(excedentesData) ? excedentesData : []);
            setBodegas(Array.isArray(bodegasData) ? bodegasData : []);
        } catch (e) {
            setSnack({ open: true, severity: 'error', message: e.message || 'Error al conectar con los servicios' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarInicial();
    }, [cargarInicial]);

    // Carga de movimientos (al entrar al tab o cambiar el filtro de estatus)
    const cargarMovimientos = useCallback(async () => {
        setLoadingMovimientos(true);
        try {
            const data = await fetchMovimientos(estatusFiltro);
            setMovimientos(Array.isArray(data) ? data : []);
        } catch (e) {
            setSnack({ open: true, severity: 'error', message: e.message });
        } finally {
            setLoadingMovimientos(false);
        }
    }, [estatusFiltro]);

    useEffect(() => {
        if (activeTab === 1) {
            cargarMovimientos();
            setSeleccionados([]);
        }
    }, [activeTab, cargarMovimientos]);

    // Localidades en modal de movimiento — con existencia/pendiente de
    // ingreso del producto seleccionado, igual que el select "Ubicación de
    // entrada" de Órdenes de bodega.
    useEffect(() => {
        if (!selectedBodega || !moveTarget) {
            setLocalidades([]);
            setSelectedLocalidad('');
            return;
        }
        async function getLocalidades() {
            setLoadingLocalidades(true);
            try {
                const data = await fetchLocalidadesEntradaPorProducto(moveTarget.producto_id, selectedBodega);
                setLocalidades(Array.isArray(data) ? data : []);
            } catch (e) {
                setSnack({ open: true, severity: 'error', message: e.message });
            } finally {
                setLoadingLocalidades(false);
            }
        }
        getLocalidades();
    }, [selectedBodega, moveTarget]);

    // Métricas
    const kpis = useMemo(() => {
        const totalSkus = rows.length;
        const totalUnidades = rows.reduce((acc, r) => acc + (Number(r.existencia_actual) || 0), 0);
        const totalDisponible = rows.reduce((acc, r) => acc + getDisponible(r), 0);
        return { totalSkus, totalUnidades, totalDisponible };
    }, [rows]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const filasFiltradas = useMemo(() => {
        let data = [...rows];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            data = data.filter(
                (r) =>
                    String(r.producto_id || '').toLowerCase().includes(q) ||
                    String(r.title || '').toLowerCase().includes(q) ||
                    String(r.sku || '').toLowerCase().includes(q) ||
                    String(r.mlm || '').toLowerCase().includes(q) ||
                    String(r.ml || '').toLowerCase().includes(q) ||
                    String(r.folio_interno || '').toLowerCase().includes(q) ||
                    String(r.proforma_titulo || '').toLowerCase().includes(q)
            );
        }
        data.sort((a, b) => {
            let av = a[orderBy];
            let bv = b[orderBy];
            if (typeof av === 'string') {
                return order === 'asc' ? av.localeCompare(bv || '') : (bv || '').localeCompare(av);
            }
            return order === 'asc' ? (av ?? 0) - (bv ?? 0) : (bv ?? 0) - (av ?? 0);
        });
        return data;
    }, [rows, search, orderBy, order]);

    const filasPaginadas = useMemo(
        () => filasFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filasFiltradas, page, rowsPerPage]
    );

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSort = (campo) => {
        if (orderBy === campo) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setOrderBy(campo);
            setOrder('desc');
        }
    };

    const abrirMovimiento = (row) => {
        setMoveTarget(row);
        // NUEVO: se sugiere por default lo realmente disponible, no el total pendiente
        setMoveCantidad(String(getDisponible(row)));
        setSelectedBodega('');
        setSelectedLocalidad('');
        setMoveErrors({});
    };

    const cerrarMovimiento = () => {
        if (saving) return;
        setMoveTarget(null);
    };

    const validarMovimiento = () => {
        const errs = {};
        const cantidadNum = Number(moveCantidad);
        const disponible = getDisponible(moveTarget);

        if (!moveCantidad || Number.isNaN(cantidadNum) || cantidadNum <= 0) {
            errs.cantidad = 'Ingresa una cantidad entera positiva mayor a 0';
        } else if (moveTarget && cantidadNum > disponible) {
            errs.cantidad = `No puede exceder lo realmente disponible (${fmtNum(disponible)})`;
        }
        if (!selectedBodega) errs.bodega = 'Selecciona una bodega destino';
        if (!selectedLocalidad) errs.localidad = 'Selecciona una localidad destino';
        setMoveErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const confirmarMovimiento = async () => {
        if (!validarMovimiento()) return;
        setSaving(true);
        const payload = {
            movimiento_id: Number(moveTarget.movimiento_id),
            localidad_destino_id: Number(selectedLocalidad),
            cantidad: Number(moveCantidad),
            usuario: user?.nombre,
        };
        try {
            await postMovimiento(payload);
            setSnack({
                open: true,
                severity: 'success',
                message: `Movimiento de ${fmtNum(payload.cantidad)} unidades realizado con éxito.`,
            });
            cerrarMovimiento();
            await cargarInicial();
            if (activeTab === 1) await cargarMovimientos();
        } catch (e) {
            setSnack({ open: true, severity: 'error', message: e.message });
        } finally {
            setSaving(false);
        }
    };

    // ---- Cancelación ---------------------------------------------------------
    const abrirCancelacion = (row) => {
        setCancelTarget(row);
        setCancelTipo('total');
        setCancelCantidad(String(Number(row.existencia_actual) || ''));
        setCancelMotivo('');
        setCancelComentario('');
        setCancelErrors({});
    };

    const cerrarCancelacion = () => {
        if (cancelando) return;
        setCancelTarget(null);
    };

    const cantidadACancelar = cancelTarget
        ? cancelTipo === 'total'
            ? Number(cancelTarget.existencia_actual) || 0
            : Number(cancelCantidad) || 0
        : 0;

    const validarCancelacion = () => {
        const errs = {};
        const total = Number(cancelTarget?.existencia_actual) || 0;

        if (cancelTipo === 'parcial') {
            const n = Number(cancelCantidad);
            if (!cancelCantidad || !Number.isInteger(n) || n <= 0) {
                errs.cantidad = 'Ingresa una cantidad entera mayor a 0';
            } else if (n > total) {
                errs.cantidad = `No puede exceder el excedente (${fmtNum(total)})`;
            } else if (n === total) {
                errs.cantidad = 'Es el total del excedente: usa "Cancelar todo"';
            }
        }
        if (!cancelMotivo) errs.motivo = 'Selecciona un motivo';
        if (cancelMotivo === 'otro' && !cancelComentario.trim()) {
            errs.comentario = 'Describe el motivo de la cancelación';
        }
        setCancelErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const confirmarCancelacion = async () => {
        if (!validarCancelacion()) return;
        setCancelando(true);
        try {
            const resultado = await postCancelarExcedente(
                cancelTarget.movimiento_id,
                {
                    cantidad: cantidadACancelar,
                    motivo: cancelMotivo,
                    comentario: cancelComentario.trim() || null,
                },
                token
            );
            setSnack({
                open: true,
                severity: 'success',
                message: `${resultado.message}. Orden de salida #${resultado.data.orden_id}.`,
            });
            setCancelando(false);
            setCancelTarget(null);
            await cargarInicial();
            if (activeTab === 1) await cargarMovimientos();
        } catch (e) {
            setSnack({ open: true, severity: 'error', message: e.message });
            setCancelando(false);
        }
    };

    const filterOptions = createFilterOptions({
        limit: 5,
        matchFrom: 'any',
        stringify: (option) => option.descripcion || '',
    });

    // Mismo criterio de orden que el select "Ubicación de entrada" en
    // Órdenes de bodega: primero las ubicaciones con existencia del
    // producto (de mayor a menor cantidad), luego por lo pendiente de
    // ingreso, y al final alfabético.
    const localidadesOrdenadas = useMemo(() => {
        if (!localidades) return [];
        return [...localidades].sort((a, b) => {
            const aCantidad = a.cantidad || 0;
            const bCantidad = b.cantidad || 0;

            const aPendiente = a.pendiente_ingreso || 0;
            const bPendiente = b.pendiente_ingreso || 0;

            // 1. Prioriza ubicaciones con cantidad > 0
            if (bCantidad > 0 && aCantidad === 0) return 1;
            if (aCantidad > 0 && bCantidad === 0) return -1;

            // 2. Si ambos tienen cantidad > 0, ordenar por cantidad descendente
            if (aCantidad > 0 && bCantidad > 0 && bCantidad !== aCantidad) {
                return bCantidad - aCantidad;
            }

            // 3. Priorizar por pendiente de ingreso
            if (bPendiente !== aPendiente) {
                return bPendiente - aPendiente;
            }

            // 4. Finalmente alfabético
            return (a.descripcion || '').localeCompare(b.descripcion || '', 'es', { sensitivity: 'base' });
        });
    }, [localidades]);

    const columnas = [
        { id: 'title', label: 'Publicación', sortable: true },
        { id: 'sku', label: 'SKU / ML', sortable: true },
        { id: 'logistic_type', label: 'Logística', sortable: true },
        { id: 'usuario', label: 'Usuario', sortable: true, align: 'center' },
        { id: 'fecha_excedente', label: 'Fecha / Envío', sortable: true, align: 'center' },
        { id: 'existencia_actual', label: 'Excedente', sortable: true, align: 'right' },
        { id: 'acciones', label: 'Acción', sortable: false, align: 'right' },
    ];

    // ---- Lógica de selección de movimientos (tab "Movimientos") --------------
    // Todos los seleccionados deben ir a la MISMA bodega destino, porque una
    // orden_de_bodega solo admite una bodega_entrada_id.
    const bodegaDestinoSeleccion = useMemo(() => {
        if (seleccionados.length === 0) return null;
        const primero = movimientos.find((m) => m.id === seleccionados[0]);
        return primero ? primero.bodega_destino_id : null;
    }, [seleccionados, movimientos]);

    const puedeSeleccionar = (mov) => {
        if (mov.estatus !== 'pendiente') return false;
        if (bodegaDestinoSeleccion === null) return true;
        return mov.bodega_destino_id === bodegaDestinoSeleccion;
    };

    const toggleSeleccion = (mov) => {
        setSeleccionados((prev) => {
            if (prev.includes(mov.id)) {
                const next = prev.filter((id) => id !== mov.id);
                return next;
            }
            return [...prev, mov.id];
        });
    };

    const resumenSeleccion = useMemo(() => {
        const movs = movimientos.filter((m) => seleccionados.includes(m.id));
        const totalUnidades = movs.reduce((acc, m) => acc + (Number(m.cantidad) || 0), 0);
        const bodegaNombre = movs[0]?.bodega_destino_nombre || '';
        return { count: movs.length, totalUnidades, bodegaNombre };
    }, [movimientos, seleccionados]);

    const abrirGenerarOrden = () => {
        setDescripcionOrden('');
        setOpenGenerarDialog(true);
    };

    const confirmarGenerarOrden = async () => {
        setGenerando(true);
        try {
            const resultado = await postGenerarOrden({
                movimiento_ids: seleccionados,
                descripcion: descripcionOrden || undefined,
                usuario: user?.nombre,
            });
            setSnack({
                open: true,
                severity: 'success',
                message: `Orden de bodega #${resultado.data.orden_id} generada con ${resultado.data.movimientos_asociados} movimiento(s).`,
            });
            setOpenGenerarDialog(false);
            setSeleccionados([]);
            await cargarMovimientos();
        } catch (e) {
            setSnack({ open: true, severity: 'error', message: e.message });
        } finally {
            setGenerando(false);
        }
    };

    const handleSearchMovChange = (e) => {
        setSearchMov(e.target.value);
        setPageMov(0);
    };

    const handleChangePageMov = (event, newPage) => setPageMov(newPage);

    const handleChangeRowsPerPageMov = (event) => {
        setRowsPerPageMov(parseInt(event.target.value, 10));
        setPageMov(0);
    };

    const handleSortMov = (campo) => {
        if (orderByMov === campo) {
            setOrderMov(orderMov === 'asc' ? 'desc' : 'asc');
        } else {
            setOrderByMov(campo);
            setOrderMov('desc');
        }
    };

    const movimientosFiltrados = useMemo(() => {
        let data = [...movimientos];
        if (searchMov.trim()) {
            const q = searchMov.trim().toLowerCase();
            data = data.filter(
                (m) =>
                    String(m.producto_id || '').toLowerCase().includes(q) ||
                    String(m.title || '').toLowerCase().includes(q) ||
                    String(m.sku || '').toLowerCase().includes(q) ||
                    String(m.mlm || '').toLowerCase().includes(q) ||
                    String(m.ml || '').toLowerCase().includes(q) || // inventory_id (ML)
                    String(m.usuario || '').toLowerCase().includes(q) ||
                    String(m.cancelado_por || '').toLowerCase().includes(q) ||
                    (m.motivo_cancelacion ? etiquetaMotivo(m.motivo_cancelacion) : '').toLowerCase().includes(q) ||
                    String(m.comentario_cancelacion || '').toLowerCase().includes(q) ||
                    String(m.orden_id || '').toLowerCase().includes(q) ||
                    String(m.origen_nombre || '').toLowerCase().includes(q) ||
                    String(m.destino_nombre || '').toLowerCase().includes(q) ||
                    String(m.folio_interno || '').toLowerCase().includes(q) ||
                    String(m.envio_id || '').toLowerCase().includes(q) ||
                    String(m.proforma_titulo || '').toLowerCase().includes(q)
            );
        }
        // 'fecha' no es un campo real: en cancelados ordena por fecha de
        // cancelación y en el resto por fecha del movimiento.
        const valorOrden = (m) => {
            if (orderByMov === 'fecha') {
                const f = m.fecha_cancelacion || m.fecha_movimiento;
                return f ? new Date(f).getTime() : 0;
            }
            return m[orderByMov];
        };
        data.sort((a, b) => {
            let av = valorOrden(a);
            let bv = valorOrden(b);
            if (typeof av === 'string') {
                return orderMov === 'asc' ? av.localeCompare(bv || '') : (bv || '').localeCompare(av);
            }
            return orderMov === 'asc' ? (av ?? 0) - (bv ?? 0) : (bv ?? 0) - (av ?? 0);
        });
        return data;
    }, [movimientos, searchMov, orderByMov, orderMov]);

    const movimientosPaginados = useMemo(
        () => movimientosFiltrados.slice(pageMov * rowsPerPageMov, pageMov * rowsPerPageMov + rowsPerPageMov),
        [movimientosFiltrados, pageMov, rowsPerPageMov]
    );

    // ---- Resumen de auditoría (sub-tab "Cancelados") -------------------------
    // Se calcula sobre lo filtrado por el buscador, así se puede auditar por
    // usuario, motivo, producto, envío, etc.
    const resumenCancelados = useMemo(() => {
        if (estatusFiltro !== 'cancelado') return null;
        const conAuditoria = movimientosFiltrados.filter((m) => m.motivo_cancelacion);
        const unidades = movimientosFiltrados.reduce((acc, m) => acc + (Number(m.cantidad) || 0), 0);
        const parciales = conAuditoria.filter((m) => m.movimiento_origen_id).length;

        const porMotivo = {};
        const porUsuario = {};
        for (const m of conAuditoria) {
            porMotivo[m.motivo_cancelacion] = (porMotivo[m.motivo_cancelacion] || 0) + (Number(m.cantidad) || 0);
            const u = m.cancelado_por || '—';
            porUsuario[u] = (porUsuario[u] || 0) + (Number(m.cantidad) || 0);
        }
        const ordenar = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);

        return {
            registros: movimientosFiltrados.length,
            unidades,
            parciales,
            totales: conAuditoria.length - parciales,
            sinAuditoria: movimientosFiltrados.length - conAuditoria.length,
            porMotivo: ordenar(porMotivo),
            porUsuario: ordenar(porUsuario),
        };
    }, [estatusFiltro, movimientosFiltrados]);

    // ---- Selección masiva "por hoja" (página actual de la tabla) --------------
    // Solo entran los movimientos seleccionables de la página visible (mismo
    // criterio que la selección individual: estatus 'pendiente' + misma bodega
    // destino que el resto de la selección ya hecha, si la hay).
    const seleccionablesPagina = useMemo(
        () => movimientosPaginados.filter(puedeSeleccionar),
        [movimientosPaginados, bodegaDestinoSeleccion]
    );

    const idsSeleccionablesPagina = useMemo(
        () => seleccionablesPagina.map((m) => m.id),
        [seleccionablesPagina]
    );

    const todosSeleccionadosPagina =
        idsSeleccionablesPagina.length > 0 && idsSeleccionablesPagina.every((id) => seleccionados.includes(id));

    const algunosSeleccionadosPagina =
        !todosSeleccionadosPagina && idsSeleccionablesPagina.some((id) => seleccionados.includes(id));

    const toggleSeleccionTodosPagina = () => {
        setSeleccionados((prev) => {
            if (todosSeleccionadosPagina) {
                // Deseleccionar solo los de esta página, respetar el resto
                return prev.filter((id) => !idsSeleccionablesPagina.includes(id));
            }
            // Agregar los seleccionables de esta página que aún no estén marcados
            const nuevos = idsSeleccionablesPagina.filter((id) => !prev.includes(id));
            return [...prev, ...nuevos];
        });
    };

    const limpiarSeleccion = () => setSeleccionados([]);

    return (
        <Box sx={{ bgcolor: tokens.canvas, minHeight: '100vh', p: { xs: 2, md: 2 } }}>
            {/* Header */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} spacing={1.5}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.ink }}>
                        Control de Excedentes
                    </Typography>
                    <Typography variant="body2" sx={{ color: tokens.slateLight }}>
                        Monitoreo y reubicación de productos almacenados en la ubicación de Excedentes.
                    </Typography>
                </Box>
                <Button
                    onClick={activeTab === 0 ? cargarInicial : cargarMovimientos}
                    disabled={activeTab === 0 ? loading : loadingMovimientos}
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    sx={{ borderColor: tokens.line, color: tokens.ink, textTransform: 'none', fontWeight: 600, bgcolor: tokens.surface }}
                >
                    Actualizar
                </Button>
            </Stack>

            {/* KPIs */}
            <Box sx={{ p: { md: 3 } }}>
                <Grid container spacing={2} sx={{ mb: 1 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard
                            icon={<Inventory2Icon />}
                            label="Publicaciones en Excedente"
                            value={loading ? <Skeleton width={40} /> : fmtNum(kpis.totalSkus)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard
                            icon={<WarningAmberIcon />}
                            label="Total Unidades Detenidas"
                            value={loading ? <Skeleton width={60} /> : fmtNum(kpis.totalUnidades)}
                            tone={kpis.totalUnidades > 0 ? 'amber' : 'default'}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard
                            icon={<PlaylistAddCheckIcon />}
                            label="Confirmadas, Listas para Reubicar"
                            value={loading ? <Skeleton width={60} /> : fmtNum(kpis.totalDisponible)}
                            tone={kpis.totalDisponible > 0 ? 'success' : 'default'}
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
            >
                <Tab label="Excedentes disponibles" />
                <Tab label="Movimientos" />
            </Tabs>

            {/* ================= TAB 0: Excedentes disponibles ================= */}
            {activeTab === 0 && (
                <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: tokens.line, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder="Buscar por Título, SKU, MLM, ID, Envío o Proforma..."
                            value={search}
                            onChange={handleSearchChange}
                            sx={{ minWidth: 300, flex: 1, bgcolor: tokens.surface }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 20, color: tokens.slateLight }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Divider sx={{ borderColor: tokens.line }} />

                    <TableContainer>
                        <Table size="medium">
                            <TableHead>
                                <TableRow sx={{ '& th': { bgcolor: tokens.canvas, borderColor: tokens.line, fontWeight: 700, color: tokens.slate, fontSize: 12, textTransform: 'uppercase' } }}>
                                    {columnas.map((col) => (
                                        <TableCell key={col.movimiento_id} align={col.align || 'left'}>
                                            {col.sortable ? (
                                                <TableSortLabel
                                                    active={orderBy === col.movimiento_id}
                                                    direction={orderBy === col.movimiento_id ? order : 'desc'}
                                                    onClick={() => handleSort(col.movimiento_id)}
                                                >
                                                    {col.label}
                                                </TableSortLabel>
                                            ) : (
                                                col.label
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading &&
                                    Array.from({ length: rowsPerPage }).map((_, i) => (
                                        <TableRow key={i}>
                                            {columnas.map((c) => (
                                                <TableCell key={c.id}>
                                                    <Skeleton />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}

                                {!loading && filasFiltradas.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={columnas.length}>
                                            <EstadoVacio
                                                mensaje={search ? 'Sin coincidencia para la búsqueda' : 'No hay existencias excedentes'}
                                                detalle={search ? 'Intenta buscando por otro parámetro' : 'La localidad "Excedentes" está libre de stock.'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading &&
                                    filasPaginadas.map((row) => {
                                        const thumbSrc = getThumbnailUrl(row.thumbnail || row.thumbnail_url || row.pictures?.[0]?.url);
                                        const disponible = getDisponible(row);
                                        const sinConfirmar = disponible <= 0;
                                        return (
                                            <TableRow key={row.movimiento_id} hover sx={{ '& td': { borderColor: tokens.line } }}>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar
                                                            component={row.permalink ? 'a' : 'div'}
                                                            href={row.permalink || undefined}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            variant="rounded"
                                                            src={thumbSrc || undefined}
                                                            alt={row.title}
                                                            sx={{ width: 44, height: 44, bgcolor: tokens.canvas, border: `1px solid ${tokens.line}` }}
                                                        >
                                                            <Inventory2Icon sx={{ fontSize: 20, color: tokens.slateLight }} />
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography
                                                                component={row.permalink ? 'a' : 'p'}
                                                                href={row.permalink || undefined}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                variant="body2"
                                                                noWrap
                                                                title={row.title}
                                                                sx={{ fontWeight: 600, color: tokens.ink, maxWidth: 450, textDecoration: 'none', display: 'block' }}
                                                            >
                                                                {row.title || 'Sin Título'}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: tokens.slateLight }}>
                                                                Producto ID: {row.producto_id} | MLM: {row.mlm || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.ink }}>
                                                        {row.sku || 'SIN SKU'}
                                                    </Typography>
                                                    {row.ml && (
                                                        <Typography variant="caption" sx={{ color: tokens.slateLight, display: 'block' }}>
                                                            ML: {row.ml}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Chip label={row.logistic_type || 'Estándar'} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 600 }} />
                                                        {row.permitir_full === 1 && <Chip label="Full" size="small" color="primary" sx={{ fontSize: 10, height: 20 }} />}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: tokens.slate }}>
                                                        {row.usuario}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: tokens.slate }}>
                                                        {fmtDateTime(row.fecha_excedente)}
                                                    </Typography>

                                                    {(row.folio_interno || row.envio_id) && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: tokens.slateLight,
                                                                display: 'block',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            Envío: {row.folio_interno || row.envio_id}
                                                        </Typography>
                                                    )}
                                                    {row.proforma_titulo && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: tokens.slateLight,
                                                                display: 'block',
                                                            }}
                                                        >
                                                            Proforma: {row.proforma_titulo}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip
                                                        title={
                                                            sinConfirmar
                                                                ? 'Todavía no se confirma físicamente ningún excedente de esta orden'
                                                                : `${fmtNum(disponible)} confirmadas de ${fmtNum(row.existencia_actual)} pendientes`
                                                        }
                                                    >
                                                        <Box sx={{ display: 'inline-block' }}>
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{ fontWeight: 700, color: sinConfirmar ? tokens.slateLight : tokens.success }}
                                                            >
                                                                {fmtNum(disponible)}
                                                                <Typography component="span" variant="body2" sx={{ color: tokens.slateLight, fontWeight: 600 }}>
                                                                    {' / '}{fmtNum(row.existencia_actual)}
                                                                </Typography>
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: tokens.slateLight, display: 'block' }}>
                                                                {row.localidad_descripcion}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Tooltip
                                                            title={sinConfirmar ? 'Aún no hay excedente confirmado físicamente para reubicar' : ''}
                                                            disableHoverListener={!sinConfirmar}
                                                        >
                                                            <span>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    disableElevation
                                                                    disabled={sinConfirmar}
                                                                    startIcon={<SwapHorizIcon />}
                                                                    onClick={() => abrirMovimiento(row)}
                                                                    sx={{ textTransform: 'none', fontWeight: 600, bgcolor: tokens.amber, '&:hover': { bgcolor: '#2E7D5B' } }}
                                                                >
                                                                    Mover
                                                                </Button>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip
                                                            title={
                                                                esCancelable(row)
                                                                    ? 'Cancelar todo o parte de este excedente (se descuenta de existencias)'
                                                                    : 'Ya tiene destino u orden de bodega: no se puede cancelar'
                                                            }
                                                        >
                                                            <span>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    disabled={!esCancelable(row)}
                                                                    startIcon={<BlockIcon />}
                                                                    onClick={() => abrirCancelacion(row)}
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        fontWeight: 600,
                                                                        color: tokens.danger,
                                                                        borderColor: tokens.dangerBg,
                                                                        '&:hover': { borderColor: tokens.danger, bgcolor: tokens.dangerBg },
                                                                    }}
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                            </span>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filasFiltradas.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Filas por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
                        sx={{ borderTop: `1px solid ${tokens.line}` }}
                    />
                </Paper>
            )}

            {/* ================= TAB 1: Movimientos ================= */}
            {activeTab === 1 && (
                <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: tokens.line, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Tabs
                            value={estatusFiltro}
                            onChange={(_, v) => {
                                setEstatusFiltro(v);
                                setPageMov(0); // Reiniciar página al cambiar de estatus
                            }}
                            sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600, fontSize: 13 } }}
                        >
                            <Tab value="pendiente" label="Pendientes" />
                            <Tab value="asociado" label="Asociados a orden" />
                            <Tab value="cancelado" label="Cancelados" />
                        </Tabs>

                        <TextField
                            size="small"
                            placeholder={
                                estatusFiltro === 'cancelado'
                                    ? 'Buscar por Título, SKU, ML, MLM, Usuario, Motivo, Envío, Proforma u Orden...'
                                    : 'Buscar por Título, SKU, ML (inventory_id), MLM, ID, Usuario, Envío o Proforma...'
                            }
                            value={searchMov}
                            onChange={handleSearchMovChange}
                            sx={{ minWidth: 280, flex: 1, bgcolor: tokens.surface }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 20, color: tokens.slateLight }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {seleccionados.length > 0 && (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                <Chip
                                    size="small"
                                    label={`${resumenSeleccion.count} ${resumenSeleccion.count === 1 ? 'seleccionado' : 'seleccionados'}`}
                                    sx={{ bgcolor: tokens.amberBg, color: tokens.amber, fontWeight: 700 }}
                                />
                                <Typography variant="body2" sx={{ color: tokens.slate }}>
                                    {fmtNum(resumenSeleccion.totalUnidades)} unidades
                                    {resumenSeleccion.bodegaNombre ? ` → ${resumenSeleccion.bodegaNombre}` : ''}
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={limpiarSeleccion}
                                    sx={{ textTransform: 'none', fontWeight: 600, color: tokens.slate }}
                                >
                                    Limpiar selección
                                </Button>
                                <Button
                                    variant="contained"
                                    disableElevation
                                    startIcon={<PlaylistAddCheckIcon />}
                                    onClick={abrirGenerarOrden}
                                    sx={{ textTransform: 'none', fontWeight: 600, bgcolor: tokens.amber, '&:hover': { bgcolor: '#2E7D5B' } }}
                                >
                                    Generar orden de transferencia
                                </Button>
                            </Stack>
                        )}
                    </Box>

                    {/* Resumen de auditoría de cancelaciones */}
                    {resumenCancelados && !loadingMovimientos && resumenCancelados.registros > 0 && (
                        <Box sx={{ px: 2, pb: 2 }}>
                            <Paper
                                variant="outlined"
                                sx={{ p: 1.75, borderRadius: 2, borderColor: tokens.line, bgcolor: tokens.canvas }}
                            >
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} divider={<Divider orientation="vertical" flexItem />}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: tokens.slateLight, fontWeight: 700, textTransform: 'uppercase' }}>
                                            {searchMov ? 'Cancelado (filtrado)' : 'Total cancelado'}
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.danger, lineHeight: 1.3 }}>
                                            {fmtNum(resumenCancelados.unidades)} u.
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: tokens.slate }}>
                                            {fmtNum(resumenCancelados.registros)} registros · {fmtNum(resumenCancelados.totales)} totales · {fmtNum(resumenCancelados.parciales)} parciales
                                        </Typography>
                                        {resumenCancelados.sinAuditoria > 0 && (
                                            <Typography variant="caption" sx={{ color: tokens.slateLight, display: 'block' }}>
                                                {fmtNum(resumenCancelados.sinAuditoria)} anteriores sin datos de auditoría
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ color: tokens.slateLight, fontWeight: 700, textTransform: 'uppercase' }}>
                                            Por motivo
                                        </Typography>
                                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75, mt: 0.5 }}>
                                            {resumenCancelados.porMotivo.length === 0 && (
                                                <Typography variant="body2" sx={{ color: tokens.slateLight }}>—</Typography>
                                            )}
                                            {resumenCancelados.porMotivo.map(([motivo, unidades]) => (
                                                <Chip
                                                    key={motivo}
                                                    size="small"
                                                    label={`${etiquetaMotivo(motivo)}: ${fmtNum(unidades)}`}
                                                    onClick={() => { setSearchMov(etiquetaMotivo(motivo)); setPageMov(0); }}
                                                    sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.line}`, fontWeight: 600, fontSize: 12 }}
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ color: tokens.slateLight, fontWeight: 700, textTransform: 'uppercase' }}>
                                            Por usuario
                                        </Typography>
                                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75, mt: 0.5 }}>
                                            {resumenCancelados.porUsuario.length === 0 && (
                                                <Typography variant="body2" sx={{ color: tokens.slateLight }}>—</Typography>
                                            )}
                                            {resumenCancelados.porUsuario.map(([usuario, unidades]) => (
                                                <Chip
                                                    key={usuario}
                                                    size="small"
                                                    label={`${usuario}: ${fmtNum(unidades)}`}
                                                    onClick={() => { setSearchMov(usuario === '—' ? '' : usuario); setPageMov(0); }}
                                                    sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.line}`, fontWeight: 600, fontSize: 12 }}
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Box>
                    )}

                    <Divider sx={{ borderColor: tokens.line }} />

                    <TableContainer>
                        <Table size="medium">
                            <TableHead>
                                <TableRow sx={{ '& th': { bgcolor: tokens.canvas, borderColor: tokens.line, fontWeight: 700, color: tokens.slate, fontSize: 12, textTransform: 'uppercase' } }}>
                                    <TableCell padding="checkbox">
                                        <Tooltip
                                            title={
                                                idsSeleccionablesPagina.length === 0
                                                    ? 'No hay movimientos pendientes seleccionables en esta página'
                                                    : todosSeleccionadosPagina
                                                        ? 'Deseleccionar todos los de esta página'
                                                        : 'Seleccionar todos los pendientes de esta página (misma bodega destino)'
                                            }
                                        >
                                            <span>
                                                <Checkbox
                                                    checked={todosSeleccionadosPagina}
                                                    indeterminate={algunosSeleccionadosPagina}
                                                    disabled={idsSeleccionablesPagina.length === 0}
                                                    onChange={toggleSeleccionTodosPagina}
                                                />
                                            </span>
                                        </Tooltip>
                                    </TableCell>

                                    <TableCell>
                                        <TableSortLabel
                                            active={orderByMov === 'title'}
                                            direction={orderByMov === 'title' ? orderMov : 'asc'}
                                            onClick={() => handleSortMov('title')}
                                        >
                                            Publicación
                                        </TableSortLabel>
                                    </TableCell>

                                    <TableCell>Origen → Destino</TableCell>

                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={orderByMov === 'cantidad'}
                                            direction={orderByMov === 'cantidad' ? orderMov : 'desc'}
                                            onClick={() => handleSortMov('cantidad')}
                                        >
                                            Cantidad
                                        </TableSortLabel>
                                    </TableCell>

                                    <TableCell>
                                        <TableSortLabel
                                            active={orderByMov === 'usuario'}
                                            direction={orderByMov === 'usuario' ? orderMov : 'asc'}
                                            onClick={() => handleSortMov('usuario')}
                                        >
                                            Usuario
                                        </TableSortLabel>
                                    </TableCell>

                                    <TableCell>
                                        <TableSortLabel
                                            active={orderByMov === 'fecha'}
                                            direction={orderByMov === 'fecha' ? orderMov : 'desc'}
                                            onClick={() => handleSortMov('fecha')}
                                        >
                                            Fecha
                                        </TableSortLabel>
                                    </TableCell>

                                    <TableCell>Estatus</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {loadingMovimientos &&
                                    Array.from({ length: rowsPerPageMov }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}

                                {!loadingMovimientos && movimientosFiltrados.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <EstadoVacio
                                                mensaje={searchMov ? 'Sin coincidencia para la búsqueda' : 'No hay movimientos en este estatus'}
                                                detalle={searchMov ? 'Intenta buscando por otro parámetro' : 'Los movimientos que hagas desde la pestaña de Excedentes aparecerán aquí.'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loadingMovimientos &&
                                    movimientosPaginados.map((mov) => {
                                        const chip = estatusChipStyle[mov.estatus] || estatusChipStyle.pendiente;
                                        const seleccionable = puedeSeleccionar(mov);
                                        const checked = seleccionados.includes(mov.id);
                                        const thumbSrc = getThumbnailUrl(mov.thumbnail || mov.thumbnail_url || mov.pictures?.[0]?.url);

                                        return (
                                            <TableRow key={mov.id} hover sx={{ '& td': { borderColor: tokens.line } }}>
                                                <TableCell padding="checkbox">
                                                    <Tooltip
                                                        title={
                                                            mov.estatus !== 'pendiente'
                                                                ? 'Solo se pueden seleccionar movimientos pendientes'
                                                                : !seleccionable
                                                                    ? 'Debe tener la misma bodega destino que el resto de la selección'
                                                                    : ''
                                                        }
                                                        disableHoverListener={seleccionable}
                                                    >
                                                        <span>
                                                            <Checkbox
                                                                checked={checked}
                                                                disabled={!seleccionable && !checked}
                                                                onChange={() => toggleSeleccion(mov)}
                                                            />
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar
                                                            component={mov.permalink ? 'a' : 'div'}
                                                            href={mov.permalink || undefined}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            variant="rounded"
                                                            src={thumbSrc || undefined}
                                                            alt={mov.title}
                                                            sx={{ width: 44, height: 44, bgcolor: tokens.canvas, border: `1px solid ${tokens.line}` }}
                                                        >
                                                            <Inventory2Icon sx={{ fontSize: 20, color: tokens.slateLight }} />
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography
                                                                component={mov.permalink ? 'a' : 'p'}
                                                                href={mov.permalink || undefined}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                variant="body2"
                                                                noWrap
                                                                title={mov.title}
                                                                sx={{ fontWeight: 600, color: tokens.ink, maxWidth: 450, textDecoration: 'none', display: 'block' }}
                                                            >
                                                                {mov.title || 'Sin Título'}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: tokens.slateLight }}>
                                                                Producto ID: {mov.producto_id} | MLM: {mov.mlm || 'N/A'}
                                                            </Typography>
                                                            <Box>

                                                                <Typography variant="caption" sx={{ color: tokens.slateLight }}>

                                                                    SKU: {mov.sku || 'N/A'} | ML: {mov.ml || 'N/A'}

                                                                </Typography>

                                                            </Box>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: tokens.slate }}>
                                                        {mov.localidad_origen_descripcion || 'N/A'} →{' '}
                                                        {mov.localidad_destino_descripcion ||
                                                            (mov.estatus === 'cancelado' && mov.motivo_cancelacion
                                                                ? 'Salida por cancelación'
                                                                : 'N/A')}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: tokens.slateLight }}>

                                                        {mov.bodega_destino_nombre}

                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{ fontWeight: 700, color: mov.estatus === 'cancelado' ? tokens.danger : tokens.ink }}
                                                    >
                                                        {mov.estatus === 'cancelado' ? '−' : ''}{fmtNum(mov.cantidad)}
                                                    </Typography>
                                                    {mov.estatus === 'cancelado' && mov.cantidad_previa_cancelacion != null && (
                                                        <Typography variant="caption" sx={{ color: tokens.slateLight, display: 'block' }}>
                                                            {Number(mov.cantidad) === Number(mov.cantidad_previa_cancelacion)
                                                                ? 'Total'
                                                                : `Parcial, de ${fmtNum(mov.cantidad_previa_cancelacion)}`}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {mov.estatus === 'cancelado' && mov.cancelado_por ? (
                                                        <>
                                                            <Typography variant="body2" sx={{ color: tokens.ink, fontWeight: 600 }}>
                                                                {mov.cancelado_por}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: tokens.slateLight, display: 'block' }}>
                                                                Generó: {mov.usuario || '—'}
                                                            </Typography>
                                                        </>
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: tokens.slate }}>
                                                            {mov.usuario}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: tokens.slate }}>
                                                        {fmtDateTime(mov.fecha_cancelacion || mov.fecha_movimiento)}
                                                    </Typography>
                                                    {mov.fecha_cancelacion && (
                                                        <Typography variant="caption" sx={{ color: tokens.slateLight, display: 'block' }}>
                                                            Excedente del {fmtDateTime(mov.fecha_movimiento)}
                                                        </Typography>
                                                    )}

                                                    {(mov.folio_interno || mov.envio_id) && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: tokens.slateLight,
                                                                display: 'block',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            Envío: {mov.folio_interno || mov.envio_id}
                                                        </Typography>
                                                    )}
                                                    {mov.proforma_titulo && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: tokens.slateLight,
                                                                display: 'block',
                                                            }}
                                                        >
                                                            Proforma: {mov.proforma_titulo}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={mov.orden_id ? `${chip.label} (#${mov.orden_id})` : chip.label}
                                                        sx={{ bgcolor: chip.bg, color: chip.fg, fontWeight: 600, fontSize: 12 }}
                                                    />
                                                    {mov.estatus === 'cancelado' && (
                                                        <Box sx={{ mt: 0.5 }}>
                                                            <Typography
                                                                variant="caption"
                                                                title={mov.comentario_cancelacion || ''}
                                                                sx={{ color: tokens.slate, display: 'block', maxWidth: 220 }}
                                                                noWrap
                                                            >
                                                                {mov.motivo_cancelacion
                                                                    ? etiquetaMotivo(mov.motivo_cancelacion)
                                                                    : 'Sin datos de auditoría'}
                                                            </Typography>
                                                            {mov.motivo_cancelacion && (
                                                                <Button
                                                                    size="small"
                                                                    startIcon={<ReceiptLongIcon sx={{ fontSize: 16 }} />}
                                                                    onClick={() => setAuditTarget(mov)}
                                                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, p: 0, minWidth: 0, color: tokens.slate }}
                                                                >
                                                                    Ver auditoría
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={movimientosFiltrados.length}
                        rowsPerPage={rowsPerPageMov}
                        page={pageMov}
                        onPageChange={handleChangePageMov}
                        onRowsPerPageChange={handleChangeRowsPerPageMov}
                        labelRowsPerPage="Filas por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
                        sx={{ borderTop: `1px solid ${tokens.line}` }}
                    />
                </Paper>
            )}

            {/* Modal Reubicación de Excedentes */}
            <Dialog open={Boolean(moveTarget)} onClose={cerrarMovimiento} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
                        Reubicar Excedente
                    </Typography>
                    <IconButton size="small" onClick={cerrarMovimiento} disabled={saving}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2.5 }}>
                    {moveTarget && (
                        <Stack spacing={2}>
                            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: tokens.canvas, border: `1px solid ${tokens.line}` }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar
                                        variant="rounded"
                                        src={getThumbnailUrl(moveTarget.thumbnail || moveTarget.thumbnail_url || moveTarget.pictures?.[0]?.url) || undefined}
                                        sx={{ width: 40, height: 40, bgcolor: tokens.surface, border: `1px solid ${tokens.line}` }}
                                    >
                                        <Inventory2Icon sx={{ fontSize: 20, color: tokens.slateLight }} />
                                    </Avatar>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography variant="caption" sx={{ color: tokens.slateLight, fontWeight: 600 }}>
                                            PRODUCTO SELECCIONADO
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.ink }} noWrap>
                                            {moveTarget.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: tokens.slate, display: 'block' }}>
                                            SKU: {moveTarget.sku} | Disponibles: <strong>{fmtNum(getDisponible(moveTarget))}</strong>
                                            {' '}de <strong>{fmtNum(moveTarget.existencia_actual)}</strong> pendientes
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <FormControl fullWidth size="small" error={Boolean(moveErrors.bodega)}>
                                <InputLabel>Bodega Destino</InputLabel>
                                <Select value={selectedBodega} label="Bodega Destino" onChange={(e) => setSelectedBodega(e.target.value)} disabled={saving}>
                                    {bodegas.map((b) => (
                                        <MenuItem key={b.id} value={b.id}>
                                            {b.Nombre} {b.rol_descripcion ? `(${b.rol_descripcion})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {moveErrors.bodega && <FormHelperText>{moveErrors.bodega}</FormHelperText>}
                            </FormControl>

                            <Autocomplete
                                size="small"
                                options={localidadesOrdenadas}
                                disabled={!selectedBodega || loadingLocalidades || saving}
                                loading={loadingLocalidades}
                                filterOptions={filterOptions}
                                getOptionLabel={(option) =>
                                    `${option.descripcion || ''} : ${option.cantidad ?? 0} (${option.pendiente_ingreso ?? 0} Por ingresar)`
                                }
                                isOptionEqualToValue={(option, value) => option.id === (value?.id || value)}
                                value={localidadesOrdenadas.find((loc) => loc.id === selectedLocalidad) || null}
                                onChange={(event, newValue) => setSelectedLocalidad(newValue ? newValue.id : '')}
                                renderOption={(props, option) => (
                                    <li
                                        {...props}
                                        style={{
                                            backgroundColor: option.cantidad > 0 ? '#FFF59D' : 'white',
                                            fontWeight: option.cantidad > 0 ? 'bold' : 'normal',
                                            borderBottom: '1px solid #eee',
                                            padding: '4px 8px',
                                        }}
                                    >
                                        {`${option.descripcion} : ${option.cantidad ?? 0} (${option.pendiente_ingreso ?? 0} Por ingresar)`}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={loadingLocalidades ? 'Cargando ubicaciones...' : 'Localidad / Ubicación Destino'}
                                        error={Boolean(moveErrors.localidad)}
                                        helperText={moveErrors.localidad}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loadingLocalidades ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />

                            <TextField
                                label="Cantidad a transferir"
                                type="number"
                                size="small"
                                fullWidth
                                value={moveCantidad}
                                onChange={(e) => setMoveCantidad(e.target.value)}
                                error={Boolean(moveErrors.cantidad)}
                                helperText={moveErrors.cantidad || `Máximo: ${fmtNum(getDisponible(moveTarget))} (lo ya confirmado físicamente)`}
                                disabled={saving}
                                inputProps={{ min: 1, max: getDisponible(moveTarget) }}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={cerrarMovimiento} disabled={saving} color="inherit" sx={{ textTransform: 'none' }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={confirmarMovimiento}
                        disabled={saving}
                        variant="contained"
                        disableElevation
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: tokens.amber, '&:hover': { bgcolor: '#2E7D5B' } }}
                    >
                        {saving ? 'Procesando...' : 'Confirmar Movimiento'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Generar orden de transferencia */}
            <Dialog open={openGenerarDialog} onClose={() => !generando && setOpenGenerarDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
                        Generar orden de bodega de transferencia
                    </Typography>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2.5 }}>
                    <Stack spacing={2}>
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: tokens.canvas, border: `1px solid ${tokens.line}` }}>
                            <Typography variant="body2" sx={{ color: tokens.slate }}>
                                Se generará una orden con <strong>{resumenSeleccion.count}</strong> movimiento(s), por un total de{' '}
                                <strong>{fmtNum(resumenSeleccion.totalUnidades)}</strong> unidades, hacia{' '}
                                <strong>{resumenSeleccion.bodegaNombre}</strong>.
                            </Typography>
                        </Box>
                        <TextField
                            label="Descripción de la orden (opcional)"
                            size="small"
                            fullWidth
                            value={descripcionOrden}
                            onChange={(e) => setDescripcionOrden(e.target.value)}
                            placeholder="Ej. Reubicación de excedentes envio 0320"
                            disabled={generando}
                        />
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenGenerarDialog(false)} disabled={generando} color="inherit" sx={{ textTransform: 'none' }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={confirmarGenerarOrden}
                        disabled={generando}
                        variant="contained"
                        disableElevation
                        startIcon={generando ? <CircularProgress size={16} color="inherit" /> : <PlaylistAddCheckIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: tokens.amber, '&:hover': { bgcolor: '#2E7D5B' } }}
                    >
                        {generando ? 'Generando...' : 'Confirmar y generar orden'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Cancelar Excedente */}
            <Dialog open={Boolean(cancelTarget)} onClose={cerrarCancelacion} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
                        Cancelar excedente
                    </Typography>
                    <IconButton size="small" onClick={cerrarCancelacion} disabled={cancelando}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2.5 }}>
                    {cancelTarget && (
                        <Stack spacing={2.25}>
                            {/* Producto */}
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: tokens.line, bgcolor: tokens.canvas }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.ink }} noWrap title={cancelTarget.title}>
                                    {cancelTarget.title || 'Sin título'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: tokens.slateLight, display: 'block' }}>
                                    SKU: {cancelTarget.sku || 'N/A'} · ML: {cancelTarget.ml || 'N/A'} · Excedente #{cancelTarget.movimiento_id}
                                </Typography>
                                <Typography variant="caption" sx={{ color: tokens.slateLight, display: 'block' }}>
                                    Envío: {cancelTarget.folio_interno || cancelTarget.envio_id || '—'} · Proforma: {cancelTarget.proforma_titulo || '—'}
                                </Typography>
                                <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: tokens.slateLight }}>Excedente</Typography>
                                        <Typography sx={{ fontWeight: 700, color: tokens.ink }}>{fmtNum(cancelTarget.existencia_actual)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: tokens.slateLight }}>Confirmado físicamente</Typography>
                                        <Typography sx={{ fontWeight: 700, color: tokens.success }}>{fmtNum(getDisponible(cancelTarget))}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: tokens.slateLight }}>Ubicación</Typography>
                                        <Typography sx={{ fontWeight: 600, color: tokens.slate }}>{cancelTarget.localidad_descripcion}</Typography>
                                    </Box>
                                </Stack>
                            </Paper>

                            {/* Total / parcial */}
                            <ToggleButtonGroup
                                exclusive
                                fullWidth
                                size="small"
                                value={cancelTipo}
                                onChange={(_, v) => {
                                    if (!v) return;
                                    setCancelTipo(v);
                                    setCancelErrors({});
                                    if (v === 'parcial') setCancelCantidad('');
                                }}
                                disabled={cancelando}
                            >
                                <ToggleButton value="total" sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    Cancelar todo ({fmtNum(cancelTarget.existencia_actual)})
                                </ToggleButton>
                                <ToggleButton
                                    value="parcial"
                                    disabled={Number(cancelTarget.existencia_actual) <= 1}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Cancelar una cantidad
                                </ToggleButton>
                            </ToggleButtonGroup>

                            {cancelTipo === 'parcial' && (
                                <TextField
                                    label="Cantidad a cancelar"
                                    type="number"
                                    size="small"
                                    value={cancelCantidad}
                                    onChange={(e) => setCancelCantidad(e.target.value)}
                                    inputProps={{ min: 1, max: Number(cancelTarget.existencia_actual) - 1, step: 1 }}
                                    error={Boolean(cancelErrors.cantidad)}
                                    helperText={
                                        cancelErrors.cantidad ||
                                        (Number(cancelCantidad) > 0 && Number(cancelCantidad) < Number(cancelTarget.existencia_actual)
                                            ? `Quedarán ${fmtNum(Number(cancelTarget.existencia_actual) - Number(cancelCantidad))} en el excedente`
                                            : `Máximo ${fmtNum(Number(cancelTarget.existencia_actual) - 1)}`)
                                    }
                                    disabled={cancelando}
                                    fullWidth
                                />
                            )}

                            <FormControl size="small" fullWidth error={Boolean(cancelErrors.motivo)} disabled={cancelando}>
                                <InputLabel>Motivo *</InputLabel>
                                <Select
                                    label="Motivo *"
                                    value={cancelMotivo}
                                    onChange={(e) => setCancelMotivo(e.target.value)}
                                >
                                    {MOTIVOS_CANCELACION.map((m) => (
                                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                                    ))}
                                </Select>
                                {cancelErrors.motivo && <FormHelperText>{cancelErrors.motivo}</FormHelperText>}
                            </FormControl>

                            <TextField
                                label={cancelMotivo === 'otro' ? 'Comentario *' : 'Comentario (opcional)'}
                                multiline
                                minRows={2}
                                size="small"
                                value={cancelComentario}
                                onChange={(e) => setCancelComentario(e.target.value.slice(0, 500))}
                                error={Boolean(cancelErrors.comentario)}
                                helperText={cancelErrors.comentario || `${cancelComentario.length}/500 — queda en el historial de auditoría`}
                                disabled={cancelando}
                                fullWidth
                            />

                            <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                                Se descontarán <b>{fmtNum(cantidadACancelar)}</b> unidades de existencias en{' '}
                                <b>{cancelTarget.localidad_descripcion}</b> con una orden de bodega de salida
                                ("Cancelación de excedentes"). Esta acción no se puede deshacer; quedará registrada con
                                tu usuario en <b>Movimientos → Cancelados</b>.
                            </Alert>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={cerrarCancelacion} disabled={cancelando} sx={{ textTransform: 'none', fontWeight: 600, color: tokens.slate }}>
                        Volver
                    </Button>
                    <Button
                        variant="contained"
                        disableElevation
                        onClick={confirmarCancelacion}
                        disabled={cancelando}
                        startIcon={cancelando ? <CircularProgress size={16} color="inherit" /> : <BlockIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: tokens.danger, '&:hover': { bgcolor: '#962D22' } }}
                    >
                        {cancelando ? 'Cancelando...' : `Cancelar ${fmtNum(cantidadACancelar)} unidades`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Auditoría de cancelación */}
            <Dialog open={Boolean(auditTarget)} onClose={() => setAuditTarget(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
                        Auditoría de cancelación
                    </Typography>
                    <IconButton size="small" onClick={() => setAuditTarget(null)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2.5 }}>
                    {auditTarget && (() => {
                        const previa = Number(auditTarget.cantidad_previa_cancelacion);
                        const cancelada = Number(auditTarget.cantidad);
                        const esParcial = Boolean(auditTarget.movimiento_origen_id);
                        const filas = [
                            ['Producto', auditTarget.title || '—'],
                            ['SKU / ML', `${auditTarget.sku || 'N/A'} / ${auditTarget.ml || 'N/A'}`],
                            ['Producto ID / MLM', `${auditTarget.producto_id} / ${auditTarget.mlm || 'N/A'}`],
                            ['Envío', auditTarget.folio_interno || auditTarget.envio_id || '—'],
                            ['Proforma', auditTarget.proforma_titulo || '—'],
                            ['Orden de producción', auditTarget.orden_produccion_id ? `#${auditTarget.orden_produccion_id}` : '—'],
                            null,
                            ['Tipo', esParcial ? 'Cancelación parcial' : 'Cancelación total'],
                            ['Cantidad cancelada', `${fmtNum(cancelada)} u.`],
                            ['Excedente antes de cancelar', Number.isFinite(previa) ? `${fmtNum(previa)} u.` : '—'],
                            ['Quedó en el excedente', Number.isFinite(previa) ? `${fmtNum(Math.max(previa - cancelada, 0))} u.` : '—'],
                            ['Registro de origen', esParcial ? `Excedente #${auditTarget.movimiento_origen_id}` : `Excedente #${auditTarget.id} (mismo registro)`],
                            ['Ubicación descontada', auditTarget.localidad_origen_descripcion || '—'],
                            ['Orden de bodega (salida)', auditTarget.orden_id
                                ? `#${auditTarget.orden_id}${auditTarget.orden_estatus ? ` · ${auditTarget.orden_estatus}` : ''}`
                                : '—'],
                            null,
                            ['Motivo', etiquetaMotivo(auditTarget.motivo_cancelacion)],
                            ['Comentario', auditTarget.comentario_cancelacion || '—'],
                            ['Canceló', auditTarget.cancelado_por || '—'],
                            ['Fecha de cancelación', fmtDateTime(auditTarget.fecha_cancelacion)],
                            ['Excedente generado por', `${auditTarget.usuario || '—'} · ${fmtDateTime(auditTarget.fecha_movimiento)}`],
                        ];
                        return (
                            <Stack spacing={1}>
                                {filas.map((f, i) =>
                                    f === null ? (
                                        <Divider key={`d-${i}`} sx={{ borderColor: tokens.line, my: 0.5 }} />
                                    ) : (
                                        <Stack key={f[0]} direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
                                            <Typography variant="body2" sx={{ color: tokens.slateLight, flexShrink: 0 }}>
                                                {f[0]}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: tokens.ink, fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}
                                            >
                                                {f[1]}
                                            </Typography>
                                        </Stack>
                                    )
                                )}
                            </Stack>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setAuditTarget(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notificaciones */}
            <Snackbar
                open={snack.open}
                autoHideDuration={5000}
                onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snack.severity} onClose={() => setSnack((prev) => ({ ...prev, open: false }))} variant="filled">
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}