import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    TextField,
    Autocomplete,
    InputAdornment,
    Grid,
    Alert,
    CircularProgress,
    Avatar,
    IconButton,
    Tooltip,
    TablePagination,
    createFilterOptions,
    FormControl,
    Select,
    MenuItem
} from '@mui/material';
import {
    Search as SearchIcon,
    BuildCircle as BuildCircleIcon,
    CheckCircle as CheckCircleIcon,
    HourglassEmpty as PendingIcon,
    Inventory2 as InventoryIcon,
    ReceiptLong as InvoiceIcon,
    InfoOutlined as InfoIcon,
    OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
});

export default function NuevosSKUsManager() {
    const [items, setItems] = useState([]);
    const [publicaciones, setPublicaciones] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [kpiFilter, setKpiFilter] = useState('ALL');

    // Estados de Carga
    const [loadingData, setLoadingData] = useState(true);
    const [loadingPublicaciones, setLoadingPublicaciones] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Estados de Paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    // 1. OBTENER SKUs NUEVOS
    const fetchNuevosSkus = useCallback(async () => {
        setLoadingData(true);
        try {
            const response = await axios.get(`${apiUrl}/facturas/nuevos-skus`);
            if (response.data?.ok) {
                const dataMapped = response.data.data.map((item) => ({
                    ...item,
                    producto_id_asignado: item.producto_id_asignado || null
                }));
                setItems(dataMapped);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setItems([]);
            } else {
                console.error('Error al obtener SKUs nuevos:', err);
                Toast.fire({
                    icon: 'error',
                    title: 'Error al cargar SKUs nuevos'
                });
            }
        } finally {
            setLoadingData(false);
        }
    }, [apiUrl]);

    // 2. OBTENER TODAS LAS PUBLICACIONES (+10K Registros)
    const fetchPublicaciones = useCallback(async () => {
        setLoadingPublicaciones(true);
        try {
            const response = await axios.get(`${apiUrl}/buscador/productos/todo`);
            if (Array.isArray(response.data)) {
                setPublicaciones(response.data);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setPublicaciones([]);
            } else {
                console.error('Error al cargar publicaciones:', err);
                Toast.fire({
                    icon: 'warning',
                    title: 'Error al obtener catálogo de publicaciones'
                });
            }
        } finally {
            setLoadingPublicaciones(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchNuevosSkus();
        fetchPublicaciones();
    }, [fetchNuevosSkus, fetchPublicaciones]);

    // Cambios de Paginación
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Reseteo de Paginación al filtrar
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(0);
    };

    const handleFilterKpi = (type) => {
        setKpiFilter(type);
        setPage(0);
    };

    // 3. SELECCIÓN LOCAL DE PUBLICACIÓN
    const handleSelectProducto = (facturaDetalleId, nuevoProductoId) => {
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.factura_detalle_id === facturaDetalleId
                    ? { ...item, producto_id_asignado: nuevoProductoId }
                    : item
            )
        );
    };

    // PROCESAR Y ENVIAR AL BACKEND
    const handleProcesarBilletes = async () => {
        const asignadosIncompletos = items.filter(
            (i) => (i.producto_id_asignado)
        );

        if (asignadosIncompletos.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Asignación incompleta',
                text: 'Asegúrate de seleccionar la Publicación para cada fila que deseas procesar.',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        const listosParaProcesar = items
            .filter((i) => i.producto_id_asignado !== null && i.proveedor_id_asignado !== null)
            .map((i) => ({
                factura_detalle_id: i.factura_detalle_id,
                sku: i.sku,
                descripcion: i.descripcion_factura || 'sin descripción',
                cantidad: Number(i.cantidad),
                producto_id: i.producto_id_asignado
            }));

        if (listosParaProcesar.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin elementos listos',
                text: 'Asigna una publicación y un proveedor a al menos un SKU antes de continuar.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const confirmResult = await Swal.fire({
            title: '¿Confirmar generación?',
            text: `Se crearán componentes, billetes y la trazabilidad de pedidos para ${listosParaProcesar.length} registro(s).`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, generar todo',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmResult.isConfirmed) return;

        setProcessing(true);

        try {
            const response = await axios.post(`${apiUrl}/facturas/nuevos-skus/procesar-billetes`, {
                items: listosParaProcesar
            });

            if (response.data?.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Proceso Completado!',
                    text: response.data.message || 'Componentes, billetes y la trazabilidad de pedidos fueron generados con éxito.',
                    confirmButtonColor: '#10b981'
                });
                await fetchNuevosSkus();
            }
        } catch (err) {
            console.error('Error al procesar:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error de Procesamiento',
                text: err.response?.data?.message || 'Ocurrió un error en el servidor al generar las entidades.',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setProcessing(false);
        }
    };

    // FILTRADO DE ITEMS TABLA
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const estaAsignado = Boolean(item.producto_id_asignado);
            if (kpiFilter === 'PENDING' && estaAsignado) return false;
            if (kpiFilter === 'READY' && !estaAsignado) return false;

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();

            return (
                item.sku?.toLowerCase().includes(term) ||
                item.descripcion_factura?.toLowerCase().includes(term) ||
                item.numero_factura?.toLowerCase().includes(term) ||
                String(item.envio_id || '').toLowerCase().includes(term) ||
                String(item.proforma_id || '').toLowerCase().includes(term)
            );
        });
    }, [items, searchTerm, kpiFilter]);

    // ITEMS PAGINADOS PARA MOSTRAR
    const paginatedItems = useMemo(() => {
        return filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredItems, page, rowsPerPage]);

    const totalPendientes = useMemo(() => items.filter((i) => !i.producto_id_asignado).length, [items]);
    const totalListos = useMemo(
        () => items.filter((i) => i.producto_id_asignado).length,
        [items]
    );

    // FILTRO PARA AUTOCOMPLETE (+10K REGISTROS)
    const autocompleteFilterOptions = createFilterOptions({
        limit: 50,
        stringify: (option) => `${option.producto_id} ${option.id || ''} ${option.sku || ''} ${option.title || ''} ${option.inventory_id || ''}`
    });

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            {/* HEADER */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
                        Monitoreo y Alta de SKUs Nuevos
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                        Asigne Publicación y Proveedor para generar automáticamente Componente, Billete y Cadena de Pedidos.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    disabled={totalListos === 0 || processing || loadingData}
                    onClick={handleProcesarBilletes}
                    startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <BuildCircleIcon />}
                    sx={{
                        px: 3,
                        py: 1.2,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    {processing ? 'Generando Billetes...' : `Generar Billetes y Trazabilidad (${totalListos})`}
                </Button>
            </Box>

            {/* KPIS */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card
                        onClick={() => handleFilterKpi('ALL')}
                        sx={{
                            cursor: 'pointer',
                            border: kpiFilter === 'ALL' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                Total SKUs Nuevos
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                                {items.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Card
                        onClick={() => handleFilterKpi('PENDING')}
                        sx={{
                            cursor: 'pointer',
                            border: kpiFilter === 'PENDING' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600, textTransform: 'uppercase' }}>
                                Pendientes de Publicación
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#b45309' }}>
                                    {totalPendientes}
                                </Typography>
                                <PendingIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Card
                        onClick={() => handleFilterKpi('READY')}
                        sx={{
                            cursor: 'pointer',
                            border: kpiFilter === 'READY' ? '2px solid #10b981' : '1px solid #e2e8f0',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, textTransform: 'uppercase' }}>
                                Listos para Alta
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#047857' }}>
                                    {totalListos}
                                </Typography>
                                <CheckCircleIcon sx={{ color: '#10b981', fontSize: 28 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* BÚSQUEDA Y AVISOS */}
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Buscar por SKU, Factura, Envío o Proforma..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{ width: { xs: '100%', sm: 380 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#94a3b8' }} />
                            </InputAdornment>
                        ),
                    }}
                />

                {totalListos > 0 && (
                    <Alert severity="info" icon={<InfoIcon />} sx={{ py: 0, px: 2, borderRadius: 1.5, flexGrow: 1, display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                        Tienes <strong>{totalListos}</strong> SKU(s) listos con publicación asignada.
                    </Alert>
                )}
            </Paper>

            {/* TABLA PRINCIPAL CON STICKY HEADER Y SCROLL INTERNO */}
            <Paper sx={{ borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: '65vh' }}>
                    <Table stickyHeader sx={{ minWidth: 400 }}>
                        <TableHead>
                            <TableRow sx={{ '& th': { backgroundColor: '#f1f5f9', fontWeight: 700, color: '#334155' } }}>
                                <TableCell>SKU Factura / Descripción</TableCell>
                                <TableCell>Factura / Envío / Proforma</TableCell>
                                <TableCell align="center">Cantidad</TableCell>
                                <TableCell>Publicación Mercado Libre</TableCell>
                                <TableCell align="center">Estatus</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loadingData ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={32} />
                                        <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                                            Cargando SKUs nuevos...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                            No se encontraron SKUs nuevos pendientes.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedItems.map((row) => {
                                    const estaAsignado = Boolean(row.producto_id_asignado);
                                    const productoSeleccionado = publicaciones.find((p) => p.producto_id === row.producto_id_asignado) || null;

                                    return (
                                        <TableRow
                                            key={row.factura_detalle_id}
                                            hover
                                            sx={{
                                                backgroundColor: estaAsignado ? '#f0fdf4' : '#ffffff',
                                                transition: 'background-color 0.2s ease'
                                            }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <InventoryIcon sx={{ color: '#64748b', fontSize: 20 }} />
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                                            {row.sku}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                            {row.descripcion_factura || 'Sin descripción'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Chip
                                                        icon={<InvoiceIcon sx={{ fontSize: '14px !important' }} />}
                                                        label={`Factura: ${row.numero_factura}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ borderRadius: '4px', width: 'fit-content', height: '22px', fontSize: '11px' }}
                                                    />
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                                                            Envío: #{row.envio_id}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>|</Typography>
                                                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                                                            Proforma: #{row.proforma_id}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                                    {row.cantidad} pzs
                                                </Typography>
                                            </TableCell>

                                            {/* AUTOCOMPLETE OPTIMIZADO CON UI THUMBNAIL Y PERMALINK */}
                                            <TableCell sx={{ minWidth: 400 }}>
                                                <Autocomplete
                                                    size="small"
                                                    loading={loadingPublicaciones}
                                                    options={publicaciones}
                                                    filterOptions={autocompleteFilterOptions}
                                                    getOptionLabel={(option) => `${option.title || ''} [ID: ${option.producto_id}]`}
                                                    value={productoSeleccionado}
                                                    isOptionEqualToValue={(option, value) => option.producto_id === value.producto_id}
                                                    onChange={(event, newValue) => {
                                                        handleSelectProducto(row.factura_detalle_id, newValue ? newValue.producto_id : null);
                                                    }}
                                                    renderOption={(props, option) => (
                                                        <Box
                                                            component="li"
                                                            {...props}
                                                            key={option.producto_id}
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid #f1f5f9' }}
                                                        >
                                                            <Avatar
                                                                src={option.thumbnail}
                                                                alt={option.title}
                                                                variant="rounded"
                                                                sx={{ width: 40, height: 40, backgroundColor: '#e2e8f0' }}
                                                            />
                                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }} noWrap>
                                                                    {option.title}
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                        ID: <strong>{option.producto_id}</strong>
                                                                    </Typography>
                                                                    {option.id && (
                                                                        <Typography variant="caption" sx={{ color: '#2563eb' }}>
                                                                            {option.id}
                                                                        </Typography>
                                                                    )}
                                                                    {option.sku && (
                                                                        <Typography variant="caption" sx={{ color: '#475569' }}>
                                                                            SKU: {option.sku}
                                                                        </Typography>
                                                                    )}
                                                                    {option.sku && (
                                                                        <Typography variant="caption" sx={{ color: '#475569' }}>
                                                                            |  ML: {option.inventory_id}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                            {option.permalink && (
                                                                <Tooltip title="Abrir en Mercado Libre">
                                                                    <IconButton
                                                                        size="small"
                                                                        component="a"
                                                                        href={option.permalink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <OpenInNewIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    )}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder={loadingPublicaciones ? "Cargando +10k publicaciones..." : "Buscar por ID, MLM Code, SKU o Título..."}
                                                            variant="outlined"
                                                            InputProps={{
                                                                ...params.InputProps,
                                                                endAdornment: (
                                                                    <React.Fragment>
                                                                        {loadingPublicaciones ? <CircularProgress color="inherit" size={18} /> : null}
                                                                        {params.InputProps.endAdornment}
                                                                    </React.Fragment>
                                                                ),
                                                            }}
                                                            sx={{
                                                                backgroundColor: '#ffffff',
                                                                borderRadius: '6px',
                                                                '& .MuiOutlinedInput-root': { fontSize: '13px' }
                                                            }}
                                                        />
                                                    )}
                                                />

                                                {/* VISTA PREVIA ASIGNADA */}
                                                {productoSeleccionado && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, px: 0.5 }}>
                                                        <Avatar
                                                            src={productoSeleccionado.thumbnail}
                                                            sx={{ width: 24, height: 24, borderRadius: '4px' }}
                                                        />
                                                        <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }} noWrap>
                                                            {productoSeleccionado.title}
                                                        </Typography>
                                                        {productoSeleccionado.permalink && (
                                                            <a
                                                                href={productoSeleccionado.permalink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                                                            >
                                                                <OpenInNewIcon sx={{ fontSize: 14, color: '#15803d', ml: 0.5 }} />
                                                            </a>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {estaAsignado ? (
                                                    <Chip
                                                        label="Listo"
                                                        color="success"
                                                        size="small"
                                                        icon={<CheckCircleIcon />}
                                                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Sin Asignar"
                                                        color="warning"
                                                        size="small"
                                                        variant="outlined"
                                                        icon={<PendingIcon />}
                                                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* COMPONENTE DE PAGINACIÓN */}
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredItems.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
                    sx={{
                        borderTop: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff'
                    }}
                />
            </Paper>
        </Box>
    );
}