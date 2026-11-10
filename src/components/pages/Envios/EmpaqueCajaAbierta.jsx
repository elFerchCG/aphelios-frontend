import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    DialogActions,
    DialogContent,
    DialogTitle,
    GlobalStyles,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined';
import AppDataGrid from '../../common/AppDataGrid';
import { DATA_GRID_LOCALE_ES } from '../../../config/dataGridLocale';
import { COLOR_APOYO, esResponsableCaja, folioCaja, tomarCajaConAutorizacion } from './tomarCaja';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';

// ============================================================
// Constantes y piezas de layout (estilo aphelios-ui-style)
// ============================================================
const GRID_HEIGHT = 520;
const GRID_PAGE_SIZE = 100;
const GRID_PAGE_SIZE_OPTIONS = [100];

const ESTATUS_CAJA = {
    abierta: { label: 'Abierta', color: 'warning' },
    cerrada: { label: 'Cerrada', color: 'success' },
};

const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children }) => (
    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, minWidth: 0 }}>
        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                    <Icon color="primary" /> {title}
                    {count != null && (
                        <Chip size="small" label={count} sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main', height: 22 }} />
                    )}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 4 }}>{subtitle}</Typography>
                )}
            </Box>
            {actions && <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">{actions}</Stack>}
        </Stack>
        {children}
    </Paper>
);

const botonSx = { borderRadius: 2, textTransform: 'none', fontWeight: 600 };

// Tabla compacta: filas bajas y letra chica. AppDataGrid mezcla su sx de forma
// superficial, por eso se repite el centrado vertical de la celda.
const ROW_HEIGHT_COMPACTA = 34;
const HEADER_HEIGHT_COMPACTO = 42;
const gridCompactoSx = {
    '& .MuiDataGrid-cell': { fontSize: 13, display: 'flex', alignItems: 'center' },
    '& .MuiDataGrid-columnHeaderTitle': { fontSize: 13, fontWeight: 600 },
};

// Medidas: solo números positivos con hasta 2 decimales
const REGEX_MEDIDA = /^\d*\.?\d{0,2}$/;

const EmpaqueCajaAbierta = () => {
    const { envioId, cajaId, visualIdCaja } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [loadingEscaneos, setLoadingEscaneos] = useState(false);
    const [infoCaja, setInfoCaja] = useState(null);
    const [inventoryId, setInventoryId] = useState('');
    const [tipoEmpaque, setTipoEmpaque] = useState('factura');
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openCerrarCaja, setOpenCerrarCaja] = useState(false);
    const [largoCaja, setLargoCaja] = useState('');
    const [anchoCaja, setAnchoCaja] = useState('');
    const [altoCaja, setAltoCaja] = useState('');
    const [pesoCaja, setPesoCaja] = useState('');
    const [errors, setErrors] = useState({ largo: false, ancho: false, alto: false, peso: false });
    const [tarimasAbiertas, setTarimasAbiertas] = useState([]);
    const [tarimaDestino, setTarimaDestino] = useState('');
    const inputRef = useRef(null);

    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const soundError = useMemo(() => {
        const audio = new Audio('/sounds/sound-error-scan.mp3');
        audio.volume = 1;
        return audio;
    }, []);
    const soundBusy = useMemo(() => {
        const audio = new Audio('/sounds/beep.mp3');
        audio.volume = 1;
        return audio;
    }, []);

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('token'));
            setUser(JSON.parse(localStorage.getItem('user')));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // ---------- Datos ----------
    const fetchEscaneos = useCallback(async () => {
        setLoadingEscaneos(true);
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchEscaneosAbierta/${cajaId}`);
            const result = response.data.data;
            setData(Array.isArray(result) ? [...result].sort((a, b) => b.id - a.id) : []);
        } catch (error) {
            // 404 = caja sin escaneos
            setData([]);
        } finally {
            setLoadingEscaneos(false);
        }
    }, [apiUrl, cajaId]);

    const fetchInfoCaja = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/consultarCaja/caja/${cajaId}`);
            const result = response.data.cajaCheck;
            const caja = Array.isArray(result) && result.length > 0 ? result[0] : null;
            setInfoCaja(caja);
            return caja;
        } catch (error) {
            setInfoCaja(null);
            return null;
        }
    }, [apiUrl, cajaId]);

    useEffect(() => {
        if (cajaId) {
            fetchEscaneos();
            fetchInfoCaja();
        }
    }, [cajaId, fetchEscaneos, fetchInfoCaja]);

    const enfocarEscaner = () => {
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 50);
    };

    const handleActualizar = async () => {
        await Promise.all([fetchEscaneos(), fetchInfoCaja()]);
        enfocarEscaner();
    };

    // ---------- Responsable ----------
    const cajaAbierta = infoCaja ? infoCaja.estatus === 'abierta' : true;
    const esResponsable = infoCaja ? esResponsableCaja(infoCaja, user) : true;
    const puedeEscanear = cajaAbierta && esResponsable;

    // Caja del equipo de apoyo: folio APOYO-###, acento morado y regreso a su pestaña
    const esApoyo = infoCaja?.tipo === 'apoyo' || String(visualIdCaja || '').startsWith('APOYO-');
    const folioMostrar = infoCaja ? folioCaja(infoCaja) : (esApoyo ? visualIdCaja : `#${visualIdCaja}`);
    const rutaDetalle = `/empaque/${envioId}/detalle${esApoyo ? '?tab=apoyo' : ''}`;
    const colorAcento = esApoyo ? COLOR_APOYO : '#1976d2';

    const handleTomarCaja = async () => {
        if (!infoCaja) return;
        const respuesta = await tomarCajaConAutorizacion({ apiUrl, token, user, caja: { ...infoCaja, id: cajaId } });
        if (respuesta) {
            await fetchInfoCaja();
            enfocarEscaner();
        }
    };

    // ---------- Escaneo ----------
    const mostrarErrorEscaneo = (mensaje) => {
        soundError.currentTime = 0;
        soundError.play().catch(() => { });
        Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Revisado',
            showCloseButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
        });
    };

    const handleScan = async () => {
        // Se toma el código y se limpia el campo de inmediato
        const idAProcesar = inventoryId.trim();
        setInventoryId('');

        if (!idAProcesar || isScanning) return;

        try {
            setIsScanning(true);
            const response = await axios.post(
                `${apiUrl}/empaque/agregarEscaneo/inventory_id/${idAProcesar}/caja/${cajaId}/envio/${envioId}/tipo/${tipoEmpaque}`,
                {},
                authHeaders
            );

            const newRow = {
                id: response.data.id,
                producto_id: response.data.producto_id,
                inventory_id: idAProcesar,
                cantidad: 1,
                sku: response.data.sku,
                title: response.data.title,
            };
            setData((prevData) => [newRow, ...prevData]);
        } catch (error) {
            const status = error.response?.status;
            let mensaje = error.response?.data?.message;
            if (!mensaje && (status === 401 || status === 403)) {
                mensaje = 'Tu sesión expiró. Vuelve a iniciar sesión para seguir escaneando.';
            }
            mostrarErrorEscaneo(mensaje || 'Error al procesar el escaneo');
            // Si la caja ya no es suya o se cerró, se actualiza el aviso en pantalla
            if (error.response?.data?.cajaAjena || status === 400) {
                fetchInfoCaja();
            }
        } finally {
            setIsScanning(false);
            enfocarEscaner();
        }
    };

    const handleKeyDown = (e) => {
        // La mayoría de los escáneres mandan 'Enter' al final
        if (e.key !== 'Enter') return;
        e.preventDefault();

        // Escaneo mientras se procesa el anterior: bip de espera y se descarta
        if (isScanning) {
            soundBusy.currentTime = 0;
            soundBusy.play().catch(() => { });
            setInventoryId('');
            return;
        }
        if (inventoryId.trim()) handleScan();
    };

    const eliminarEscaneo = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed) return;

        try {
            const response = await axios.delete(`${apiUrl}/empaque/eliminarEscaneo/${id}`, authHeaders);
            await fetchEscaneos();
            Swal.fire({ title: '¡Eliminado!', text: response.data.message, icon: 'success', timer: 2000, showConfirmButton: false });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.message || 'No se pudo eliminar el escaneo',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
            if (error.response?.data?.cajaAjena) fetchInfoCaja();
        } finally {
            enfocarEscaner();
        }
    };

    // ---------- Cerrar caja ----------
    const generarYDescargarTXT = async ({ envio, numeroCaja, textoGrande = numeroCaja }) => {
        const contenido =
            `^XA	
            ^CI28	 
            ^LH0,0	 
            ^FO50,105^A0N,90,90^FD${textoGrande}^FS
            ^FO50,105^A0N,25,25^FD^FS	 
            ^FB350,2,2	 
            ^FO22,145^A0N,18,18^FD^FS
            ^FO21,145^A0N,18,18^FD^FS
            ^FB350,2,2	 
            ^FT344,152^A0N,22,22^FH\^FD${user.nombre}^FS	
            ^FO65,18^BY3^BCN,54,N,N	 
            ^FD${envio}/${numeroCaja}^FS
            ^FT207,105^A0N,30,30^FH\^FDENVIO:${envio}/${numeroCaja}
            ^FT206,105^A0N,30,30^FH\^FDENVIO:${envio}/${numeroCaja}
            ^PQ1,0,1,Y^XZ`;

        const blob = new Blob([contenido], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `archivo_caja_numero:${numeroCaja}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const consultarDimensiones = async () => {
        const caja = await fetchInfoCaja();
        if (caja) {
            setLargoCaja(caja.largo ?? '');
            setAnchoCaja(caja.ancho ?? '');
            setAltoCaja(caja.alto ?? '');
            setPesoCaja(caja.peso ?? '');
        }
    };

    const consultarTarimasAbiertas = async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchTarimas/${envioId}`);
            const abiertas = (response.data.data || []).filter((t) => t.estatus === 'abierta');
            setTarimasAbiertas(abiertas);
            setTarimaDestino(abiertas.length === 1 ? abiertas[0].id : '');
        } catch (error) {
            setTarimasAbiertas([]);
            setTarimaDestino('');
        }
    };

    const handleAbrirModalCaja = () => {
        setOpenCerrarCaja(true);
        consultarDimensiones();
        if (esApoyo) consultarTarimasAbiertas();
    };

    const handleCloseCerrarCaja = () => {
        setOpenCerrarCaja(false);
        setLargoCaja('');
        setAnchoCaja('');
        setAltoCaja('');
        setPesoCaja('');
        setErrors({ largo: false, ancho: false, alto: false, peso: false });
        enfocarEscaner();
    };

    const handleMedida = (setter) => (e) => {
        if (REGEX_MEDIDA.test(e.target.value)) setter(e.target.value);
    };

    const handleGuardarCerrarCaja = async () => {
        if (isSubmitting) return;
        const newErrors = {
            largo: !largoCaja || parseFloat(largoCaja) <= 0,
            ancho: !anchoCaja || parseFloat(anchoCaja) <= 0,
            alto: !altoCaja || parseFloat(altoCaja) <= 0,
            peso: !pesoCaja || parseFloat(pesoCaja) <= 0,
        };

        if (Object.values(newErrors).some(Boolean)) {
            setErrors(newErrors);
            Swal.fire({
                title: 'Campos incompletos',
                text: 'Completa todos los campos con valores mayores a cero.',
                icon: 'warning',
                target: document.getElementById('modal-details'),
            });
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await axios.post(
                `${apiUrl}/empaque/consolidar/caja/${cajaId}`,
                {
                    largo: largoCaja,
                    ancho: anchoCaja,
                    alto: altoCaja,
                    peso: pesoCaja,
                    ...(esApoyo && tarimaDestino ? { tarima_id: Number(tarimaDestino) } : {}),
                },
                authHeaders
            );
            if (response.data.ok) {
                if (esApoyo) {
                    const numero = String(infoCaja?.visual_id ?? '').padStart(3, '0');
                    await generarYDescargarTXT({ envio: envioId, numeroCaja: folioMostrar, textoGrande: `A-${numero}` });
                } else {
                    await generarYDescargarTXT({ envio: envioId, numeroCaja: visualIdCaja });
                }
                handleCloseCerrarCaja();
                if (esApoyo) {
                    Swal.fire({ icon: 'success', title: 'Caja cerrada', text: response.data.message, timer: 2500, showConfirmButton: false });
                }
                navigate(rutaDetalle);
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.message || 'No se pudo cerrar la caja',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
            handleCloseCerrarCaja();
            if (error.response?.data?.cajaAjena) fetchInfoCaja();
        } finally {
            setIsSubmitting(false);
        }
    };

    // ---------- Tabla ----------
    const totalesPorProducto = useMemo(() => {
        const totales = {};
        data.forEach((item) => {
            totales[item.producto_id] = (totales[item.producto_id] || 0) + Number(item.cantidad || 0);
        });
        return totales;
    }, [data]);

    const totalCantidad = data.reduce((acc, row) => acc + Number(row.cantidad || 0), 0);

    // Se arma en cada render: depende de los totales y de si el usuario puede escanear
    const columns = [
        { field: 'id', headerName: '# Escaneo', type: 'number', flex: 0.6, minWidth: 100, headerAlign: 'left', align: 'left' },
        { field: 'inventory_id', headerName: 'ML', flex: 0.9, minWidth: 120 },
        { field: 'sku', headerName: 'SKU', flex: 1.2, minWidth: 140 },
        { field: 'title', headerName: 'Descripción', flex: 1.6, minWidth: 180 },
        { field: 'cantidad', headerName: 'Cantidad', type: 'number', flex: 0.5, minWidth: 90, headerAlign: 'center', align: 'center' },
        {
            field: 'total_producto_caja',
            headerName: 'Suma producto',
            renderHeader: () => (
                <Box sx={{ lineHeight: 1.15, textAlign: 'center', fontWeight: 600, fontSize: 13, whiteSpace: 'normal' }}>
                    Suma<br />producto
                </Box>
            ),
            type: 'number',
            flex: 0.6,
            minWidth: 120,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (value, row) => totalesPorProducto[row?.producto_id] || 0,
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            minWidth: 90,
            flex: 0.4,
            sortable: false,
            filterable: false,
            disableExport: true,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Tooltip arrow title={puedeEscanear ? 'Eliminar escaneo' : 'Solo el responsable de la caja puede eliminar escaneos'}>
                    <span>
                        <IconButton size="small" color="error" disabled={!puedeEscanear} onClick={() => eliminarEscaneo(params.row.id)}>
                            <DeleteForeverRoundedIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            ),
        },
    ];

    // ---------- Render ----------
    const estatusInfo = ESTATUS_CAJA[infoCaja?.estatus] || null;
    const folioEnvio = infoCaja?.folio_interno || envioId;
    const nombreResponsable = infoCaja?.nombre_responsable || '—';

    return (
        <Box
            sx={{
                p: { xs: 1, sm: 2 },
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                minHeight: '100vh',
                // Durante el escaneo se tiñe el fondo para la visión periférica
                backgroundColor: isScanning ? '#fff9c4' : 'transparent',
                transition: 'background-color 0.15s ease',
            }}
        >
            <GlobalStyles styles={(theme) => ({ '.MuiDataGrid-panel': { zIndex: theme.zIndex.modal + 100 } })} />

            {/* ---------- Encabezado ---------- */}
            <Paper
                elevation={2}
                sx={{
                    p: 1.5,
                    borderRadius: 3,
                    borderLeft: esApoyo ? `6px solid ${COLOR_APOYO}` : undefined,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, mr: 1 }}>
                        {esApoyo
                            ? <><GroupsOutlinedIcon sx={{ color: COLOR_APOYO }} /> Equipo de apoyo</>
                            : <><ViewInArOutlinedIcon color="primary" /> Empaque de caja</>}
                    </Typography>
                    <Chip
                        size="small"
                        label={`Caja ${folioMostrar}`}
                        sx={{ fontWeight: 700, bgcolor: `${colorAcento}1A`, color: colorAcento, border: esApoyo ? `1px solid ${COLOR_APOYO}` : undefined }}
                    />
                    <Chip size="small" variant="outlined" label={`Envío ${folioEnvio}`} sx={{ fontWeight: 600 }} />
                    {infoCaja?.tarima_visual_id != null && (
                        <Chip size="small" variant="outlined" label={`Tarima #${infoCaja.tarima_visual_id}`} sx={{ fontWeight: 600 }} />
                    )}
                    {esApoyo && infoCaja && infoCaja.tarima_visual_id == null && (
                        <Tooltip arrow title="Las cajas de apoyo se asignan a una tarima al cerrarlas">
                            <Chip size="small" variant="outlined" label="Sin tarima" sx={{ fontWeight: 600 }} />
                        </Tooltip>
                    )}
                    {estatusInfo && <Chip size="small" label={estatusInfo.label} color={estatusInfo.color} sx={{ fontWeight: 600 }} />}
                    {infoCaja && (
                        <Tooltip arrow title={`Creada por ${infoCaja.nombre_usuario || '—'}`}>
                            <Chip
                                size="small"
                                icon={<PersonOutlineOutlinedIcon />}
                                label={esResponsable ? `${nombreResponsable} (tú)` : nombreResponsable}
                                color={esResponsable ? 'success' : 'warning'}
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                            />
                        </Tooltip>
                    )}
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                    <Tooltip title="Regresa a las tarimas y cajas del envío." arrow>
                        <span>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => navigate(rutaDetalle)}
                                disabled={isScanning || isSubmitting}
                                sx={botonSx}
                            >
                                Regresar al envío
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Vuelve a consultar los escaneos y el responsable de la caja." arrow>
                        <span>
                            <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleActualizar} disabled={isScanning} sx={botonSx}>
                                Actualizar
                            </Button>
                        </span>
                    </Tooltip>
                    {cajaAbierta && !esResponsable && (
                        <Tooltip title="Pasa la caja a tu cargo. Se necesita autorización de un administrador o supervisor." arrow>
                            <span>
                                <Button variant="outlined" size="small" color="warning" startIcon={<PanToolOutlinedIcon />} onClick={handleTomarCaja} sx={botonSx}>
                                    Tomar caja
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                    <Tooltip title={puedeEscanear ? 'Captura medidas y peso, cierra la caja y descarga su etiqueta.' : 'Solo el responsable puede cerrar la caja.'} arrow>
                        <span>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<TaskAltOutlinedIcon />}
                                onClick={handleAbrirModalCaja}
                                disabled={isScanning || !puedeEscanear}
                                sx={esApoyo ? { ...botonSx, bgcolor: COLOR_APOYO, '&:hover': { bgcolor: '#4a148c' } } : botonSx}
                            >
                                Cerrar caja
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            </Paper>

            {/* ---------- Avisos de responsable / estatus ---------- */}
            {infoCaja && !cajaAbierta && (
                <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>
                    Esta caja está cerrada. Para agregar o quitar piezas, reábrela desde el detalle del envío.
                </Alert>
            )}
            {infoCaja && cajaAbierta && !esResponsable && (
                <Alert
                    severity="warning"
                    variant="outlined"
                    sx={{ borderRadius: 3, alignItems: 'center' }}
                    action={
                        <Button color="warning" size="small" variant="outlined" startIcon={<PanToolOutlinedIcon />} onClick={handleTomarCaja} sx={botonSx}>
                            Tomar caja
                        </Button>
                    }
                >
                    Esta caja está a cargo de <b>{nombreResponsable}</b>. Solo esa persona puede escanear, borrar escaneos o cerrarla.
                    Si vas a continuarla tú, usa <b>Tomar caja</b>; si no, regresa al envío y abre una caja nueva.
                </Alert>
            )}

            {/* ---------- Escanear ---------- */}
            <SectionCard
                icon={QrCodeScannerIcon}
                title="Escanear"
                subtitle="Elige si lo que empacas viene de factura o de retiro y escanea el código ML de cada pieza."
                actions={
                    <ToggleButtonGroup
                        value={tipoEmpaque}
                        exclusive
                        size="small"
                        onChange={(e, newValue) => {
                            if (newValue !== null) setTipoEmpaque(newValue);
                            enfocarEscaner();
                        }}
                    >
                        <ToggleButton value="factura" sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}>
                            <ReceiptLongOutlinedIcon color="success" fontSize="small" sx={{ mr: 0.75 }} /> Factura
                        </ToggleButton>
                        <ToggleButton value="retiro" sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}>
                            <AssignmentReturnOutlinedIcon color="primary" fontSize="small" sx={{ mr: 0.75 }} /> Retiro
                        </ToggleButton>
                    </ToggleButtonGroup>
                }
            >
                <TextField
                    fullWidth
                    autoFocus
                    inputRef={inputRef}
                    label={isScanning ? 'Procesando código...' : puedeEscanear ? 'Escanear código ML' : 'Escaneo bloqueado'}
                    placeholder={puedeEscanear ? 'Escanea o escribe el código y presiona Enter' : ''}
                    value={inventoryId}
                    onChange={(e) => setInventoryId(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isScanning || !puedeEscanear}
                    sx={esApoyo ? {
                        '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: COLOR_APOYO },
                        '& .MuiInputLabel-root.Mui-focused': { color: COLOR_APOYO },
                    } : undefined}
                    InputProps={{
                        sx: { fontSize: 20, fontWeight: 600 },
                        endAdornment: (
                            <InputAdornment position="end">
                                {isScanning ? <CircularProgress size={22} color="inherit" /> : <QrCodeScannerIcon color={puedeEscanear ? 'primary' : 'disabled'} />}
                            </InputAdornment>
                        ),
                    }}
                />
            </SectionCard>

            {/* ---------- Escaneos ---------- */}
            <SectionCard
                icon={FormatListBulletedOutlinedIcon}
                title="Escaneos de la caja"
                count={data.length}
                subtitle={`Total en la caja: ${totalCantidad} pieza(s)`}
            >
                <AppDataGrid
                    rows={data}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loadingEscaneos}
                    height={GRID_HEIGHT}
                    rowHeight={ROW_HEIGHT_COMPACTA}
                    columnHeaderHeight={HEADER_HEIGHT_COMPACTO}
                    sx={gridCompactoSx}
                    pageSize={GRID_PAGE_SIZE}
                    pageSizeOptions={GRID_PAGE_SIZE_OPTIONS}
                    exportFileName={`envio_${folioEnvio}_caja_${visualIdCaja}_escaneos`}
                    initialColumnVisibilityModel={{ id: false }}
                    localeText={{ ...DATA_GRID_LOCALE_ES, noRowsLabel: 'Aún no hay escaneos en esta caja.' }}
                />
            </SectionCard>

            {/* ---------- Cerrar caja ---------- */}
            <Dialog
                id="modal-details"
                open={openCerrarCaja}
                onClose={isSubmitting ? undefined : handleCloseCerrarCaja}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                    <TaskAltOutlinedIcon sx={{ color: colorAcento }} /> Cerrar caja {folioMostrar}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Captura las medidas y el peso. Al guardar se cierra la caja con {totalCantidad} pieza(s) y se descarga su etiqueta.
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                        {[
                            { key: 'largo', label: 'Largo', value: largoCaja, setter: setLargoCaja, unidad: 'cm' },
                            { key: 'ancho', label: 'Ancho', value: anchoCaja, setter: setAnchoCaja, unidad: 'cm' },
                            { key: 'alto', label: 'Alto', value: altoCaja, setter: setAltoCaja, unidad: 'cm' },
                            { key: 'peso', label: 'Peso', value: pesoCaja, setter: setPesoCaja, unidad: 'kg' },
                        ].map((campo) => (
                            <TextField
                                key={campo.key}
                                label={campo.label}
                                type="number"
                                size="small"
                                disabled={isSubmitting}
                                value={campo.value}
                                onChange={handleMedida(campo.setter)}
                                error={!!errors[campo.key]}
                                helperText={errors[campo.key] ? 'Requerido (> 0)' : ' '}
                                InputProps={{ endAdornment: <InputAdornment position="end">{campo.unidad}</InputAdornment> }}
                                inputProps={{ min: 0, step: 0.1 }}
                            />
                        ))}
                    </Box>
                    {esApoyo && (
                        <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: `${COLOR_APOYO}0D`, border: `1px solid ${COLOR_APOYO}33` }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: COLOR_APOYO }}>¿A qué tarima va esta caja?</Typography>
                            <FormControl fullWidth size="small" disabled={isSubmitting}>
                                <InputLabel id="tarima-destino-cierre">Tarima destino</InputLabel>
                                <Select
                                    labelId="tarima-destino-cierre"
                                    label="Tarima destino"
                                    value={tarimaDestino}
                                    onChange={(e) => setTarimaDestino(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">Asignar después (queda en "Cerradas sin tarima")</MenuItem>
                                    {tarimasAbiertas.map((t) => (
                                        <MenuItem key={t.id} value={t.id}>Tarima #{t.visual_id}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {tarimasAbiertas.length === 0 && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
                                    No hay tarimas abiertas en este envío; podrás asignarla después desde la pestaña Equipo de apoyo.
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={handleCloseCerrarCaja} disabled={isSubmitting} sx={botonSx}>Cancelar</Button>
                    <Button onClick={handleGuardarCerrarCaja} variant="contained" color="success" disabled={isSubmitting} sx={botonSx}>
                        {isSubmitting ? 'Guardando...' : 'Guardar y cerrar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmpaqueCajaAbierta;
