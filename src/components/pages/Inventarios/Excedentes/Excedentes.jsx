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
    const res = await fetch(`${apiUrl}/inventario/existencias/generar-salida-excedentes`, {
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
                    String(r.ml || '').toLowerCase().includes(q) 
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
                    String(m.usuario || '').toLowerCase().includes(q) ||
                    String(m.origen_nombre || '').toLowerCase().includes(q) ||
                    String(m.destino_nombre || '').toLowerCase().includes(q)
            );
        }
        data.sort((a, b) => {
            let av = a[orderByMov];
            let bv = b[orderByMov];
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
                            placeholder="Buscar por Título, SKU, MLM o ID..."
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
                            placeholder="Buscar por Título, SKU, MLM, ID, Usuario..."
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
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Typography variant="body2" sx={{ color: tokens.slate }}>
                                    <strong>{resumenSeleccion.count}</strong> seleccionados · {fmtNum(resumenSeleccion.totalUnidades)} unidades
                                    {resumenSeleccion.bodegaNombre ? ` → ${resumenSeleccion.bodegaNombre}` : ''}
                                </Typography>
                                <Button
                                    variant="contained"
                                    disableElevation
                                    startIcon={<PlaylistAddCheckIcon />}
                                    onClick={abrirGenerarOrden}
                                    sx={{ textTransform: 'none', fontWeight: 600, bgcolor: tokens.amber, '&:hover': { bgcolor: '#2E7D5B' } }}
                                >
                                    Generar orden de salida
                                </Button>
                            </Stack>
                        )}
                    </Box>

                    <Divider sx={{ borderColor: tokens.line }} />

                    <TableContainer>
                        <Table size="medium">
                            <TableHead>
                                <TableRow sx={{ '& th': { bgcolor: tokens.canvas, borderColor: tokens.line, fontWeight: 700, color: tokens.slate, fontSize: 12, textTransform: 'uppercase' } }}>
                                    <TableCell padding="checkbox" />

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
                                                        {mov.localidad_origen_descripcion || 'N/A'} → {mov.localidad_destino_descripcion || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: tokens.slateLight }}>

                                                        {mov.bodega_destino_nombre}

                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.ink }}>
                                                        {fmtNum(mov.cantidad)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: tokens.slate }}>
                                                        {mov.usuario}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: tokens.slate }}>
                                                        {fmtDateTime(mov.fecha_movimiento)}
                                                    </Typography>

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

            {/* Modal Generar orden de salida */}
            <Dialog open={openGenerarDialog} onClose={() => !generando && setOpenGenerarDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
                        Generar orden de bodega de salida
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