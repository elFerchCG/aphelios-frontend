import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    GlobalStyles,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import Swal from 'sweetalert2';
import { formatISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import { useProcess } from '../../../loaders/UseProcess';

import 'react-datepicker/dist/react-datepicker.css';
import './DatePickerStyles.css'; // Archivo CSS personalizado
import apiUrl from '../../../../config';

// Misma paleta que usa TableOrdenes.jsx para el Chip de estatus de la
// cabecera de la orden: se duplica aquí (a propósito, sin importarla desde
// TableOrdenes.jsx) para que este componente siga siendo independiente y no
// obligue a tocar TableOrdenes.jsx solo para compartir esta constante.
const ESTATUS_CONFIG = {
    abierto: { label: 'Abierto', color: '#2e7d32', bg: '#e8f5e9' },
    confirmado: { label: 'Confirmado', color: '#ed6c02', bg: '#fff3e0' },
    procesado: { label: 'Procesado', color: '#0288d1', bg: '#e1f5fe' },
    cancelada: { label: 'Cancelada', color: '#d32f2f', bg: '#ffebee' },
};

const getEstatusInfo = (status) =>
    ESTATUS_CONFIG[status] || { label: status || 'Sin estatus', color: '#616161', bg: '#f5f5f5' };

const ORIGEN_LABELS = {
    manual: 'Manual',
    mrp: 'MRP',
    ventas_me: 'Ventas ME',
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '—');

const BuscarOrdenes = ({ selectedOrder, openModal, setOpenModal }) => {
    // Últimas 50 órdenes (sin canceladas, sin líneas) que trae el buscador
    // por defecto al abrir la modal.
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loadingGrid, setLoadingGrid] = useState(false);

    // Resultados de una búsqueda explícita en el historial completo
    // (endpoint /buscar), para folios fuera de las últimas 50 o para
    // consultar canceladas.
    const [historyMode, setHistoryMode] = useState(false);
    const [historyResults, setHistoryResults] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [estatusFilter, setEstatusFilter] = useState('');
    const [categoriaFilter, setCategoriaFilter] = useState('');
    const [origenFilter, setOrigenFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { execute } = useProcess();

    const resetFiltersState = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setEstatusFilter('');
        setCategoriaFilter('');
        setOrigenFilter('');
        setHistoryMode(false);
        setHistoryResults([]);
    };

    const handleCloseModal = () => {
        resetFiltersState();
        setOpenModal(false);
    };

    const fetchUltimasOrdenes = () => {
        execute(
            async () => {
                setLoadingGrid(true);
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (response.data.ok) {
                        const formattedData = response.data.data.map((row) => ({
                            ...row,
                            fecha_abierto: row.fecha_abierto
                                ? formatISO(new Date(row.fecha_abierto), { representation: 'date' })
                                : '',
                        }));
                        setOrders(formattedData);
                    }
                } finally {
                    setLoadingGrid(false);
                }
            },
            {
                loadingText: 'Obteniendo órdenes...',
                onError: (error) => {
                    console.error('Error al obtener las órdenes', error);
                    setLoadingGrid(false);
                    if (error?.response?.status === 404) {
                        // No hay órdenes abiertas/confirmadas/procesadas todavía: no es
                        // un error real, solo una lista vacía.
                        setOrders([]);
                        return;
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'No se pudieron obtener las órdenes',
                        text: 'Ocurrió un problema al consultar el buscador de órdenes.',
                    });
                },
            },
        );
    };

    useEffect(() => {
        if (openModal) {
            fetchUltimasOrdenes();
        }
    }, [openModal]);

    // Filtro instantáneo (sin red) sobre las últimas 50 órdenes ya cargadas.
    useEffect(() => {
        let filtered = orders;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (order) =>
                    (order.descripcion || '').toLowerCase().includes(term) ||
                    order.id.toString().includes(term) ||
                    (order.estatus || '').toLowerCase().includes(term) ||
                    (order.fecha_abierto || '').toLowerCase().includes(term) ||
                    (order.categoria || '').toLowerCase().includes(term),
            );
        }

        if (estatusFilter) {
            filtered = filtered.filter((order) => order.estatus === estatusFilter);
        }

        if (categoriaFilter) {
            filtered = filtered.filter((order) => order.categoria === categoriaFilter);
        }

        if (origenFilter) {
            filtered = filtered.filter((order) => (order.origen || 'manual') === origenFilter);
        }

        if (startDate && endDate) {
            filtered = filtered.filter((order) => {
                const orderDate = new Date(order.fecha_abierto);
                return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
            });
        }

        setFilteredOrders(filtered);
    }, [searchTerm, estatusFilter, categoriaFilter, origenFilter, startDate, endDate, orders]);

    // Arma los query params para el endpoint /buscar a partir de los filtros
    // actuales. Acepta "overrides" para poder disparar la búsqueda con un
    // valor que todavía no llegó al estado (p. ej. al elegir "Cancelada" en
    // el Select, ver handleEstatusChange) sin depender de un closure viejo.
    const buildBuscarParams = (overrides = {}) => {
        const state = {
            searchTerm,
            estatusFilter,
            categoriaFilter,
            origenFilter,
            startDate,
            endDate,
            ...overrides,
        };

        const params = {};
        const term = (state.searchTerm || '').trim();
        if (term) {
            if (/^\d+$/.test(term)) {
                params.id = term;
            } else {
                params.descripcion = term;
            }
        }
        if (state.estatusFilter) params.estatus = state.estatusFilter;
        if (state.categoriaFilter) params.categoria = state.categoriaFilter;
        if (state.origenFilter) params.origen = state.origenFilter;
        if (state.startDate)
            params.fecha_inicio = formatISO(new Date(state.startDate), { representation: 'date' });
        if (state.endDate) params.fecha_fin = formatISO(new Date(state.endDate), { representation: 'date' });
        return params;
    };

    const handleBuscarHistorial = (overrides = {}) => {
        execute(
            async () => {
                setLoadingHistory(true);
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get(
                        `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/buscar`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            params: buildBuscarParams(overrides),
                        },
                    );

                    if (response.data.ok) {
                        const formattedData = response.data.data.map((row) => ({
                            ...row,
                            fecha_abierto: row.fecha_abierto
                                ? formatISO(new Date(row.fecha_abierto), { representation: 'date' })
                                : '',
                        }));
                        setHistoryResults(formattedData);
                        setHistoryMode(true);
                        if (formattedData.length === 0) {
                            Swal.fire({
                                icon: 'info',
                                title: 'Sin resultados',
                                text: 'No se encontró ninguna orden con esos filtros.',
                            });
                        }
                    }
                } finally {
                    setLoadingHistory(false);
                }
            },
            {
                loadingText: 'Buscando en el historial de órdenes...',
                onError: (error) => {
                    console.error('Error al buscar en el historial de órdenes', error);
                    setLoadingHistory(false);
                    Swal.fire({
                        icon: 'error',
                        title: 'No se pudo completar la búsqueda',
                        text: 'Intenta nuevamente en unos segundos.',
                    });
                },
            },
        );
    };

    const handleEstatusChange = (e) => {
        const value = e.target.value;
        setEstatusFilter(value);
        if (value === 'cancelada') {
            // Las últimas 50 órdenes nunca incluyen canceladas (así las regresa
            // el backend por diseño), así que filtrar en automático sobre la
            // lista local siempre daría "sin resultados". Se busca directo en
            // el historial completo.
            handleBuscarHistorial({ estatusFilter: value });
        } else if (historyMode) {
            setHistoryMode(false);
        }
    };

    const handleRowClick = (params) => {
        const selectedOrderId = params.row.id;
        if (typeof selectedOrder === 'function') {
            selectedOrder(selectedOrderId);
        } else {
            console.error('selectedOrder no es una función');
        }
        handleCloseModal();
    };

    const displayedRows = historyMode ? historyResults : filteredOrders;

    const columns = [
        { field: 'id', headerName: 'Folio', width: 90 },
        { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 220 },
        {
            field: 'categoria',
            headerName: 'Tipo de movimiento',
            width: 160,
            renderCell: (params) => capitalize(params.value),
        },
        {
            field: 'estatus',
            headerName: 'Estatus',
            width: 140,
            renderCell: (params) => {
                const info = getEstatusInfo(params.value);
                return (
                    <Chip
                        size="small"
                        label={info.label}
                        sx={{
                            bgcolor: info.bg,
                            color: info.color,
                            fontWeight: 700,
                            border: `1px solid ${info.color}`,
                        }}
                    />
                );
            },
        },
        {
            field: 'origen',
            headerName: 'Origen',
            width: 120,
            renderCell: (params) => ORIGEN_LABELS[params.value] || capitalize(params.value) || 'Manual',
        },
        { field: 'fecha_abierto', headerName: 'Fecha', width: 130 },
    ];

    return (
        <>
            {/* SweetAlert2 monta su propio contenedor al final del <body> con un
                z-index (1060 por defecto) menor que el del Dialog de MUI (1300),
                así que sus alertas ("Sin resultados", errores, etc.) quedaban
                tapadas detrás de esta modal. Se sube por encima con el mismo
                truco de GlobalStyles que ya se usa para el panel de columnas del
                DataGrid en TableOrdenes.jsx. */}
            <GlobalStyles
                styles={(theme) => ({
                    '.swal2-container': { zIndex: theme.zIndex.modal + 200 },
                    // El calendario de react-datepicker (fecha inicio / fecha fin) se
                    // renderiza dentro de un "portal" propio (ver prop portalId más
                    // abajo) para escapar del recorte de overflow del DialogContent.
                    // Ese portal, al no tener z-index explícito, queda por defecto
                    // por debajo del Dialog (z-index 1300) y se ve "mocho"/tapado sin
                    // importar el zoom. Se sube igual que el panel del DataGrid y el
                    // contenedor de SweetAlert2.
                    '.react-datepicker-popper': { zIndex: theme.zIndex.modal + 200 },
                })}
            />
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="xl"
                fullWidth
                disableEnforceFocus
                sx={{
                    '& .MuiDialog-paper': {
                        height: '90vh',
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Buscar orden de bodega
                    <IconButton onClick={handleCloseModal} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Paper
                        elevation={0}
                        variant="outlined"
                        sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, mb: 2, flexShrink: 0 }}
                    >
                        <Stack spacing={2}>
                            <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
                                <TextField
                                    label="Folio o descripción"
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{ minWidth: 220, flex: '1 1 220px' }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <FormControl size="small" sx={{ minWidth: 190 }}>
                                    <InputLabel>Estatus</InputLabel>
                                    <Select
                                        label="Estatus"
                                        value={estatusFilter}
                                        onChange={handleEstatusChange}
                                    >
                                        <MenuItem value="">Todas (sin canceladas)</MenuItem>
                                        <MenuItem value="abierto">Abierto</MenuItem>
                                        <MenuItem value="confirmado">Confirmado</MenuItem>
                                        <MenuItem value="procesado">Procesado</MenuItem>
                                        <MenuItem value="cancelada">Cancelada</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                    <InputLabel>Tipo de movimiento</InputLabel>
                                    <Select
                                        label="Tipo de movimiento"
                                        value={categoriaFilter}
                                        onChange={(e) => setCategoriaFilter(e.target.value)}
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="entrada">Entrada</MenuItem>
                                        <MenuItem value="salida">Salida</MenuItem>
                                        <MenuItem value="transferencia">Transferencia</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Origen</InputLabel>
                                    <Select
                                        label="Origen"
                                        value={origenFilter}
                                        onChange={(e) => setOrigenFilter(e.target.value)}
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="manual">Manual</MenuItem>
                                        <MenuItem value="mrp">MRP</MenuItem>
                                        <MenuItem value="ventas_me">Ventas ME</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>

                            <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    dateFormat="yyyy-MM-dd"
                                    minDate={new Date(2024, 0, 1)}
                                    maxDate={new Date()}
                                    placeholderText="Fecha inicio"
                                    className="custom-datepicker"
                                    // Escapa del recorte del DialogContent (ver comentario del
                                    // GlobalStyles de arriba): el calendario se monta en un
                                    // <div id="buscar-ordenes-datepicker-portal"> que
                                    // react-datepicker crea solo si no existe, al final del
                                    // <body>, en vez de quedar anidado (y recortado) dentro
                                    // de esta modal.
                                    portalId="buscar-ordenes-datepicker-portal"
                                />
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    dateFormat="yyyy-MM-dd"
                                    minDate={new Date(2024, 0, 1)}
                                    maxDate={new Date()}
                                    placeholderText="Fecha fin"
                                    className="custom-datepicker"
                                    portalId="buscar-ordenes-datepicker-portal"
                                />

                                <Box sx={{ flex: '1 1 auto' }} />

                                {historyMode && (
                                    <Chip
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        label={`Historial: ${historyResults.length} resultado(s)`}
                                    />
                                )}

                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        resetFiltersState();
                                    }}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                    Limpiar filtros
                                </Button>

                                {historyMode && (
                                    <Button
                                        variant="outlined"
                                        onClick={() => setHistoryMode(false)}
                                        sx={{ borderRadius: 2, textTransform: 'none' }}
                                    >
                                        Ver últimas 50
                                    </Button>
                                )}

                                <Tooltip title="Busca en todas las órdenes registradas (no solo en las últimas 50); incluye canceladas si eliges ese estatus">
                                    <Button
                                        variant="contained"
                                        onClick={() => handleBuscarHistorial()}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                    >
                                        Buscar en todo el historial
                                    </Button>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Paper>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1, display: 'block', flexShrink: 0 }}
                    >
                        {historyMode
                            ? 'Resultados de la búsqueda en el historial completo de órdenes.'
                            : 'Mostrando las últimas 50 órdenes registradas (no se incluyen canceladas). Usa "Buscar en todo el historial" para folios más antiguos o para ver canceladas.'}
                    </Typography>

                    <Box sx={{ width: '100%', flex: 1, minHeight: 0 }}>
                        <DataGrid
                            sx={{ fontFamily: 'Montserrat', fontWeight: 'bold' }}
                            rows={displayedRows}
                            columns={columns}
                            loading={historyMode ? loadingHistory : loadingGrid}
                            pageSize={10}
                            showCellVerticalBorder
                            showColumnVerticalBorder
                            onRowClick={handleRowClick}
                            getRowId={(row) => row.id}
                            experimentalFeatures={{ newEditingApi: true }}
                            slots={{ toolbar: GridToolbar }}
                            density="compact"
                            localeText={{
                                noRowsLabel: 'No se encontraron órdenes que coincidan con tu búsqueda.',
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={handleCloseModal}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default BuscarOrdenes;