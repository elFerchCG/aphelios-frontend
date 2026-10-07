import React, { useRef } from 'react'
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { GridActionsCellItem } from "@mui/x-data-grid";
import AppDataGrid from '../../common/AppDataGrid';
import { DATA_GRID_LOCALE_ES } from '../../../config/dataGridLocale';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import {
    Button,
    Box,
    Typography,
    CircularProgress,
    Tooltip,
    Paper,
    IconButton,
    Chip,
    Stack,
    GlobalStyles,
} from '@mui/material';
import EnvioKpis, { calcularContenidoEnvio } from './EnvioKpis';

// ============================================================
// Constantes y piezas de layout (estilo aphelios-ui-style)
// ============================================================

// Tablas: componente estándar AppDataGrid (common/AppDataGrid.jsx, ver
// "Manual de Componentes Visuales APHELIOS", sección 6). Por props solo se
// pasa lo propio de esta pantalla: altura fija (las dos columnas quedan
// alineadas y el scroll queda dentro), 100 registros por página, alto de
// fila para los iconos con texto y el mensaje de "sin registros".
const GRID_HEIGHT = 520;
const GRID_PAGE_SIZE = 100;
const GRID_PAGE_SIZE_OPTIONS = [100];
const ROW_HEIGHT_ACCIONES = 64;

const localeSinRegistros = (noRowsLabel) => ({ ...DATA_GRID_LOCALE_ES, noRowsLabel });

// Estatus de tarima y caja (abierta = en proceso, cerrada = terminada).
const ESTATUS_EMPAQUE = {
    abierta: { label: "Abierta", color: "warning" },
    cerrada: { label: "Cerrada", color: "success" },
};
const EstatusChip = ({ value }) => {
    const info = ESTATUS_EMPAQUE[value] || { label: value || "—", color: "default" };
    return <Chip size="small" label={info.label} color={info.color} sx={{ fontWeight: 600 }} />;
};

// Botón de acción con icono + texto debajo (mismo formato que ya se usaba).
const AccionIcono = ({ icon, texto }) => (
    <Box display="flex" flexDirection="column" alignItems="center">
        {icon}
        <Typography variant='caption' sx={{ fontSize: "0.75rem", fontWeight: "bold", lineHeight: 1.1 }}>
            {texto}
        </Typography>
    </Box>
);

const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children }) => (
    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, minWidth: 0 }}>
        <Stack
            direction="row"
            flexWrap="wrap"
            gap={1.5}
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    variant="subtitle1"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}
                >
                    <Icon color="primary" /> {title}
                    {count != null && (
                        <Chip
                            size="small"
                            label={count}
                            sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main', height: 22 }}
                        />
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

const ESTATUS_ENVIO = {
    abierto: { label: "Abierto", color: "warning" },
    finalizado: { label: "Finalizado", color: "success" },
};

const EnvioDetalle = () => {
    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const { envioId } = useParams(); // 👈 obtenemos el id de la URL
    const location = useLocation();
    const [estatusEnvio, setEstatusEnvio] = useState(location.state?.estatusEnvio || '');
    const [descripcionEnvio, setDescripcionEnvio] = useState(location.state?.descripcionEnvio || '');
    const [folioInternoEnvio, setFolioInternoEnvio] = useState(location.state?.folioInternoEnvio || '');

    //console.log("Estatus envio:", estatusEnvio);

    const [expandedRowId, setExpandedRowId] = useState(null);
    const [cajas, setCajas] = useState([]);
    const [tarimas, setTarimas] = useState([]);
    const [tarimaId, setTarimaId] = useState('');
    const [cajaId, setCajaId] = useState('');
    const [tarimaIdVisual, setTarimaIdVisual] = useState('');
    const [cajaIdVisual, setCajaIdVisual] = useState('');
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredTarimas, setFilteredTarimas] = useState([]);
    const [loadingTarimas, setLoadingTarimas] = useState(true);
    const [loadingCajas, setLoadingCajas] = useState(false);
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [totalPiezas, setTotalPiezas] = useState(0);
    const [totalPiezasEmpacadas, setTotalPiezasEmpacadas] = useState(0);
    const [loading, setLoading] = useState(true);

    const formatFecha = (fechaISO) => {
        if (!fechaISO) return '';
        const date = new Date(fechaISO);
        if (isNaN(date.getTime())) {
            console.log("Fecha inválida:", fechaISO);
            return '';
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`; // o agrega `:${seconds}` si quieres
    };

    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('token'));
            setUser(JSON.parse(localStorage.getItem('user')));
        };

        // Añadir un listener para el evento `storage`
        window.addEventListener('storage', handleStorageChange);

        // Limpieza al desmontar el componente
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [apiUrl]);


    // Datos para la tarjeta "Contenido del envío" (mismo cálculo que el
    // dashboard EnviosProgresoEmpaque.jsx).
    const [ordenesFacturas, setOrdenesFacturas] = useState([]);
    const [ordenesRetiros, setOrdenesRetiros] = useState([]);
    const [retirosEnvio, setRetirosEnvio] = useState([]);
    const [agrupaciones, setAgrupaciones] = useState(null);

    // Columnas ocultas por defecto (AppDataGrid: initialColumnVisibilityModel)
    const columnasOcultasTarimas = {
        id: false,
    };

    useEffect(() => {
        if (envioId && apiUrl) {
            fetchTarimas();
        }
    }, [apiUrl, envioId]);

    const fetchPiezasYFacturas = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiUrl}/empaque/getPiezasYFacturas/${envioId}`);
            setTotalPiezas(Number(response.data.total_piezas || []));
            setTotalPiezasEmpacadas(Number(response.data.total_piezas_empacadas || []));
            setOrdenesFacturas(response.data.ordenesProduccionFacturas || []);
            setOrdenesRetiros(response.data.ordenesProduccionRetiros || []);
            setRetirosEnvio(response.data.totalOrdenRetiro || []);
            // Folio, descripción y estatus: si no llegaron por la navegación
            // (al regresar de una caja con navigate sin state, o al recargar
            // la página) se toman del backend. Sin esto se mostraba el ID
            // interno dos veces y el estatus quedaba vacío.
            const envio = response.data.envio;
            if (envio) {
                setFolioInternoEnvio((prev) => prev || envio.folio_interno || '');
                setDescripcionEnvio((prev) => prev || envio.descripcion || '');
                setEstatusEnvio((prev) => prev || envio.estatus || '');
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            const errorMessage = error.response?.data?.message || 'Error al cargar los datos';
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        } finally {
            setLoading(false); // 🔓 Asegura la liberación centralizada del loader
        }
    };

    // Solo alimenta el conteo de proformas/facturas de la tarjeta de
    // contenido: si falla no se interrumpe al usuario con una alerta.
    const fetchAgrupaciones = async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/envio/${envioId}/agrupaciones`);
            setAgrupaciones(response.data?.data || []);
        } catch (error) {
            console.error("Error al cargar agrupaciones del envío:", error);
            setAgrupaciones(null);
        }
    };

    useEffect(() => {
        if (envioId) {
            fetchPiezasYFacturas();
            fetchAgrupaciones();
        }
    }, [envioId]);

    const fetchTarimas = async () => {
        setLoadingTarimas(true);
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchTarimas/${envioId}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setTarimas(response.data.data);
            }
        } catch (error) {
        } finally {
            setLoadingTarimas(false); // Detiene la carga
        }
    }

    const abrirTarima = async () => {
        if (loading) return; // 🛑 Guarda de seguridad: evita ejecuciones simultáneas si dan doble clic veloz
        setLoading(true);
        try {
            const response = await axios.post(`${apiUrl}/empaque/abrirTarima/${envioId}`,
                {},
            );
            if (response.data) {
                setTarimaId(response.data.id);
                setTarimaIdVisual(response.data.visual_id);
                fetchTarimas();
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        } finally {
            setLoading(false); // 🔓 Se libera el estado de carga pase lo que pase
        }
    }

    const abrirCaja = async (tarimaId, envioIdParam) => {
        if (loading) return; // 🛑 Evita ejecuciones duplicadas si el usuario presiona rápido
        setLoading(true);
        try {
            const response = await axios.post(`${apiUrl}/empaque/abrirCaja/${tarimaId}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            if (response.data.ok) {
                await fetchCajas(tarimaId);
                setCajaId(response.data.id);
                setCajaIdVisual(response.data.visual_id);
                handleEntrarCajaAbierta(envioIdParam, response.data.id, response.data.visual_id); // ✅ no se colapsa
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 2000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        } finally {
            setLoading(false); // 🔓 Se libera el estado pase lo que pase
        }
    }

    const revertirCaja = async (cajaIdParam, tarimaId) => {
        if (loading) return; // 🛑 Evita ejecuciones duplicadas si el usuario presiona rápido
        setLoading(true);
        try {
            const response = await axios.post(`${apiUrl}/empaque/revertirCaja/caja/${cajaIdParam}`,
                {},
            );
            if (response.data.ok) {
                await fetchCajas(tarimaId); // ✅ no se colapsa
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        } finally {
            setLoading(false); // 🔓 Se libera el estado pase lo que pase
        }
    }

    const cerrarTarima = async (envioId, tarimaId) => {
        if (loading) return; // 🛑 Evita ejecuciones duplicadas si el usuario presiona rápido
        setLoading(true);
        try {
            const response = await axios.put(`${apiUrl}/empaque/cerrarTarima/tarima/${tarimaId}`,
                {},
            );
            if (response.data.ok) {
                const message = response.data.message;
                Swal.fire({
                    title: "¡Exito!",
                    text: message,
                    icon: "success",
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true,
                })
                await fetchTarimas(envioId); // ✅ no se colapsa
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        } finally {
            setLoading(false); // 🔓 Se libera el estado pase lo que pase
        }
    }

    const cerrarEnvio = async (envioId) => {
        if (loading) return; // 🛑 Evita ejecuciones duplicadas si el usuario presiona rápido
        setLoading(true);
        try {
            const result = await Swal.fire({
                title: "¿Estás seguro de cerrar el envío? También se cerrarán las órdenes asignadas",
                icon: "warning",
                showDenyButton: true,
                confirmButtonColor: "#44be39",
                confirmButtonText: "Cerrar",
                denyButtonText: `Cancelar`,
                reverseButtons: true
            });

            if (result.isConfirmed) {
                // El request se ejecuta aquí manteniendo el "loading" activo en la interfaz
                const response = await axios.put(`${apiUrl}/empaque/cerrarEnvio/envio/${envioId}`, {});

                if (response.data.ok) {
                    Swal.fire("¡Envío cerrado!", "", "success");
                    navigate('/envios');
                }
            } else if (result.isDenied) {
                Swal.fire("Operación cancelada", "", "info");
            }

        } catch (error) {
            console.error("Error al cerrar envío:", error);
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        } finally {
            setLoading(false); // 🔓 Se libera el estado pase lo que pase
        }
    }

    const reabrirTarima = async (tarimaId) => {
        if (loading) return; // 🛑 Evita ejecuciones duplicadas si el usuario presiona rápido
        setLoading(true);
        try {
            const response = await axios.put(`${apiUrl}/empaque/reabrirTarima/tarima/${tarimaId}`,
                {},
            );
            if (response.data.ok) {
                await fetchTarimas(envioId); // ✅ no se colapsa
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        } finally {
            setLoading(false); // 🔓 Se libera el estado pase lo que pase
        }
    }

    const handleEntrarCajaCerrada = (envioId, cajaId, cajaIdVisual) => {
        navigate(`/empaque/envio/${envioId}/caja/${cajaId}/visual/${cajaIdVisual}`)
    };

    const handleEntrarCajaAbierta = (envioId, cajaId, cajaIdVisual) => {
        navigate(`/empaqueCajaAbierta/envio/${envioId}/caja/${cajaId}/visual/${cajaIdVisual}`)
    }

    const fetchCajas = async (tarimaId) => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchCajas/${tarimaId}`);
            if (response.data.data && Array.isArray(response.data.data)) {
                setCajas(prev => ({
                    ...prev,
                    [tarimaId]: response.data.data // asegúrate que aquí sea tarimaId
                }));
            }
        } catch (error) {
            console.error("Error al traer cajas:", error);
        }
    };

    const handleMostrarCajas = async (tarimaId) => {
        if (expandedRowId === tarimaId) {
            setExpandedRowId(null);
            return;
        }

        // Si hay un collapse abierto, lo cerramos antes de abrir el nuevo
        setExpandedRowId(null);  // Cierra cualquier collapse activo

        setTimeout(async () => {
            setLoadingCajas(true);
            await fetchCajas(tarimaId);
            setExpandedRowId(tarimaId);  // Abre el nuevo collapse
            setLoadingCajas(false);
        }, 300);
    };

    // 1. Añadimos un ref para controlar si ya auto-expandimos la tarima abierta al cargar
    const hasInitialAutoExpand = useRef(false);

    useEffect(() => {
        // Buscamos si existe alguna tarima abierta en la lista actual
        const tarimaAbierta = tarimas.find(t => t.estatus === 'abierta');

        // Solo auto-expandimos si hay una tarima abierta Y aún no hemos inicializado 
        // O si actualmente no hay ninguna tarima expandida (expandedRowId === null)
        if (tarimaAbierta && (!hasInitialAutoExpand.current || !expandedRowId)) {
            setLoadingCajas(true);

            fetchCajas(tarimaAbierta.id).finally(() => {
                setLoadingCajas(false);
            });

            setExpandedRowId(tarimaAbierta.id);
            hasInitialAutoExpand.current = true; // Marcamos que la auto-apertura inicial ya se hizo
        }
    }, [tarimas, expandedRowId]);

    const columns = [
        { field: "id", headerName: "# Tarima", type: "number", flex: 0.2, justifyContent: "start" },
        { field: "visual_id", headerName: "# Tarima", type: "number", flex: 0.25, minWidth: 80, headerAlign: "left", align: "left" },
        { field: "cajas_ids", headerName: "Cajas", type: "string", flex: 0.5, minWidth: 100 },
        {
            field: "estatus",
            headerName: "Estatus",
            type: "string",
            flex: 0.3,
            minWidth: 100,
            renderCell: (params) => <EstatusChip value={params.value} />
        },
        {
            field: "actions",
            headerName: "Acciones",
            flex: 0.6,
            minWidth: 210,
            type: "actions",
            // Las acciones y sus condiciones de habilitado son las mismas de
            // siempre. Se devuelven directamente los GridActionsCellItem (el
            // grid les inyecta sus props de foco/teclado) con key propia cada
            // uno, y el Tooltip va dentro del icono. Antes se envolvían en
            // <Tooltip><></></Tooltip>: el tooltip nunca se mostraba y las 3
            // acciones compartían la misma key.
            getActions: (params) => [
                <GridActionsCellItem
                    key={`cerrar-${params.row.id}`}
                    icon={
                        <Tooltip title="Cerrar Tarima" arrow>
                            <span>
                                <AccionIcono
                                    texto="Cerrar"
                                    icon={<CheckCircleOutlineIcon sx={{ color: params.row.estatus === 'cerrada' || loading ? '#ccc' : 'green', fontSize: "1.8rem" }} />}
                                />
                            </span>
                        </Tooltip>
                    }
                    label="Cerrar Tarima"
                    disabled={params.row.estatus === 'cerrada' || loading}
                    onClick={() => cerrarTarima(envioId, params.row.id)}
                />,
                <GridActionsCellItem
                    key={`reabrir-${params.row.id}`}
                    icon={
                        <Tooltip title="Reabrir tarima" arrow>
                            <span>
                                <AccionIcono
                                    texto="Reabrir"
                                    icon={
                                        <AutorenewIcon sx={{
                                            color: estatusEnvio === 'finalizado' || loading
                                                ? '#ccc'
                                                : (params.row.estatus === 'cerrada' ? 'orange' : '#ccc'),
                                            fontSize: "1.8rem"
                                        }} />
                                    }
                                />
                            </span>
                        </Tooltip>
                    }
                    label="Reabrir tarima"
                    disabled={estatusEnvio === 'finalizado' || params.row.estatus === 'abierta' || loading}
                    onClick={() => reabrirTarima(params.row.id)}
                />,
                <GridActionsCellItem
                    key={`cajas-${params.row.id}`}
                    icon={
                        <Tooltip title="Mostrar Cajas" arrow>
                            <span>
                                <AccionIcono
                                    texto="Cajas"
                                    icon={
                                        expandedRowId === params.row.id || params.row.estatus === 'abierta' ? (
                                            <KeyboardArrowDownIcon sx={{ color: "#1976d2", fontSize: "1.8rem" }} />
                                        ) : (
                                            <KeyboardArrowRightIcon sx={{ color: "#1976d2", fontSize: "1.8rem" }} />
                                        )
                                    }
                                />
                            </span>
                        </Tooltip>
                    }
                    label='Mostrar Cajas'
                    disabled={loading}
                    onClick={() => handleMostrarCajas(params.row.id)}
                />
            ]
        }
    ];

    useEffect(() => {
        // Filtra los envios en base al término de búsqueda
        let filtered = tarimas;

        if (searchTerm) {
            //const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word);

            filtered = filtered.filter(tarima => {
                const tarimaId = tarima.id ? tarima.id.toString() : '';
                const tarimaEstatus = tarima.estatus ? tarima.estatus.toLowerCase() : '';

                // Verifica si todas las palabras están en el título
                //const titleMatch = searchWords.every(word => productTitle.includes(word));

                // Verifica si el término de búsqueda está en otras columnas
                const otherColumnsMatch = (
                    tarimaId.includes(searchTerm.toString()) ||
                    tarimaEstatus.includes(searchTerm.toLowerCase())
                );

                // El producto debe coincidir en el título o en alguna de las otras columnas
                return otherColumnsMatch;
            });
        }

        setFilteredTarimas(filtered);
    }, [searchTerm, tarimas]);

    const puedeVerBotonCerrarEnvio = user && (user.rol_descripcion === 'administrador');

    // Recarga todo lo de la pantalla: tarjetas, tarimas y, si hay una
    // tarima desplegada, sus cajas.
    const handleActualizar = () => {
        fetchTarimas();
        fetchPiezasYFacturas();
        fetchAgrupaciones();
        if (expandedRowId) fetchCajas(expandedRowId);
    };

    const contenidoEnvio = useMemo(() => calcularContenidoEnvio({
        ordenesFacturas,
        ordenesRetiros,
        retiros: retirosEnvio,
        agrupaciones,
    }), [ordenesFacturas, ordenesRetiros, retirosEnvio, agrupaciones]);

    const tarimaExpandida = tarimas.find((t) => t.id === expandedRowId) || null;

    // Copia antes de ordenar: .sort() sobre el arreglo del estado lo mutaba.
    const cajasTarimaExpandida = tarimaExpandida
        ? [...(cajas[tarimaExpandida.id] || [])].sort((a, b) => Number(b.visual_id) - Number(a.visual_id))
        : [];

    const piezasTarimaExpandida = cajasTarimaExpandida.reduce(
        (s, c) => s + (Number(c.total_cantidad) || 0),
        0
    );

    // Columnas de la tabla de cajas. Las 3 acciones (Registros, Reabrir,
    // Escanear) llaman a los mismos handlers y con las mismas condiciones
    // de habilitado que la tabla anterior.
    const columnasCajas = [
        { field: "visual_id", headerName: "# Caja", type: "number", flex: 0.4, minWidth: 80, headerAlign: "left", align: "left" },
        { field: "nombre_usuario", headerName: "Creado Por", flex: 1, minWidth: 130 },
        {
            field: "fecha_recepcion",
            headerName: "Fecha Creación",
            flex: 0.9,
            minWidth: 150,
            valueFormatter: (value) => formatFecha(value),
        },
        { field: "total_cantidad", headerName: "Piezas", type: "number", flex: 0.5, minWidth: 80, headerAlign: "center", align: "center" },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 0.6,
            minWidth: 100,
            renderCell: (params) => <EstatusChip value={params.value} />,
        },
        {
            field: "acciones",
            headerName: "Acciones",
            flex: 1.2,
            minWidth: 240,
            sortable: false,
            filterable: false,
            disableExport: true,
            headerAlign: "center",
            align: "center",
            renderCell: ({ row: caja }) => (
                <Box display="flex" flexDirection="row" justifyContent="center" gap={1.5} sx={{ width: '100%' }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleEntrarCajaCerrada(envioId, caja.id, caja.visual_id)}
                            disabled={caja.estatus !== 'cerrada' || loading}
                        >
                            <ListAltIcon sx={{ fontSize: "1.8rem" }} />
                        </IconButton>
                        <Typography variant='caption' sx={{ fontSize: "0.75rem", fontWeight: "bold", lineHeight: 1.1 }}>
                            Registros
                        </Typography>
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <IconButton
                            size="small"
                            onClick={() => revertirCaja(caja.id, tarimaExpandida.id)}
                            disabled={tarimaExpandida.estatus === 'cerrada' || caja.estatus !== 'cerrada' || loading}
                        >
                            <AutorenewIcon sx={{
                                color: tarimaExpandida.estatus === 'cerrada' || loading
                                    ? 'gray'
                                    : (caja.estatus === 'cerrada' ? 'orange' : undefined),
                                fontSize: "1.8rem"
                            }}
                            />
                        </IconButton>
                        <Typography variant='caption' sx={{ fontSize: "0.75rem", fontWeight: "bold", lineHeight: 1.1 }}>
                            Reabrir
                        </Typography>
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <IconButton
                            size="small"
                            onClick={() => handleEntrarCajaAbierta(envioId, caja.id, caja.visual_id)}
                            disabled={tarimaExpandida.estatus === 'cerrada' || caja.estatus === 'cerrada' || loading}
                        >
                            <QrCodeScannerIcon sx={{ color: caja.estatus === 'abierta' && !loading ? "rebeccapurple" : 'gray', fontSize: "1.8rem" }} />
                        </IconButton>
                        <Typography variant='caption' sx={{ fontSize: "0.75rem", fontWeight: "bold", lineHeight: 1.1 }}>
                            Escanear
                        </Typography>
                    </Box>
                </Box>
            ),
        },
    ];

    const tarimasAbiertas = tarimas.filter((t) => t.estatus === 'abierta').length;
    const estatusEnvioInfo = ESTATUS_ENVIO[estatusEnvio] || (estatusEnvio ? { label: estatusEnvio, color: "default" } : null);

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* El panel de Columnas/Filtros del DataGrid se renderiza en un
                Popper propio sin z-index alto. */}
            <GlobalStyles
                styles={(theme) => ({
                    '.MuiDataGrid-panel': { zIndex: theme.zIndex.modal + 100 },
                })}
            />

            {/* ---------- Encabezado ---------- */}
            <Paper
                elevation={2}
                sx={{
                    p: 1.5,
                    borderRadius: 3,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, mr: 1 }}
                    >
                        <LocalShippingOutlinedIcon color="primary" /> Empaque del Envío
                    </Typography>
                    <Chip
                        size="small"
                        label={folioInternoEnvio || `ID: ${envioId}`}
                        sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main' }}
                    />
                    {estatusEnvioInfo && (
                        <Chip size="small" label={estatusEnvioInfo.label} color={estatusEnvioInfo.color} sx={{ fontWeight: 600 }} />
                    )}
                    {descripcionEnvio && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap title={descripcionEnvio}>
                            {descripcionEnvio}
                        </Typography>
                    )}
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                    <Tooltip title="Vuelve a consultar tarimas, cajas y el avance del envío." arrow>
                        <span>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={handleActualizar}
                                disabled={loading || loadingTarimas}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                                Actualizar
                            </Button>
                        </span>
                    </Tooltip>
                    {puedeVerBotonCerrarEnvio && (
                        <Tooltip title="Cierra el envío y las órdenes asignadas." arrow>
                            <span>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<TaskAltOutlinedIcon />}
                                    onClick={() => cerrarEnvio(envioId)}
                                    disabled={estatusEnvio === 'finalizado' || loading}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    Cerrar Envío
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Stack>
            </Paper>

            {/* ---------- Indicadores (compartidos con el dashboard) ---------- */}
            <EnvioKpis
                envioId={envioId}
                folioInternoEnvio={folioInternoEnvio}
                totalPiezas={totalPiezas}
                totalPiezasEmpacadas={totalPiezasEmpacadas}
                contenido={contenidoEnvio}
            />

            {/* ---------- Tarimas | Cajas ---------- */}
            <Box
                sx={{
                    display: 'grid',
                    gap: 2.5,
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 5fr) minmax(0, 7fr)' },
                    alignItems: 'start',
                }}
            >
                <SectionCard
                    icon={LayersOutlinedIcon}
                    title="Tarimas"
                    subtitle={tarimasAbiertas > 0 ? `${tarimasAbiertas} tarima abierta` : 'Sin tarimas abiertas'}
                    count={tarimas.length}
                    actions={
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddBoxOutlinedIcon />}
                            onClick={abrirTarima}
                            disabled={tarimas.some(t => t.estatus === 'abierta') || estatusEnvio === 'finalizado' || loading}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                            {loading ? "Abriendo..." : "Abrir Nueva Tarima"}
                        </Button>
                    }
                >
                    <AppDataGrid
                        rows={tarimas}
                        columns={columns}
                        getRowId={(row) => row.id}
                        loading={loadingTarimas}
                        height={GRID_HEIGHT}
                        rowHeight={ROW_HEIGHT_ACCIONES}
                        pageSize={GRID_PAGE_SIZE}
                        pageSizeOptions={GRID_PAGE_SIZE_OPTIONS}
                        exportFileName={`envio_${folioInternoEnvio || envioId}_tarimas`}
                        initialColumnVisibilityModel={columnasOcultasTarimas}
                        localeText={localeSinRegistros('Este envío aún no tiene tarimas.')}
                        getRowClassName={(params) => (params.id === expandedRowId ? 'fila-expandida' : '')}
                        sx={{
                            '& .fila-expandida': { backgroundColor: '#e3f2fd' },
                            '& .fila-expandida:hover': { backgroundColor: '#d6ebfb' },
                        }}
                    />
                </SectionCard>

                <SectionCard
                    icon={ViewInArOutlinedIcon}
                    title={tarimaExpandida ? `Cajas de la tarima #${tarimaExpandida.visual_id}` : 'Cajas'}
                    subtitle={
                        tarimaExpandida
                            ? (loadingCajas ? 'Cargando cajas…' : `${piezasTarimaExpandida} pieza(s) en la tarima`)
                            : 'Selecciona "Cajas" en una tarima para ver su contenido.'
                    }
                    count={tarimaExpandida && !loadingCajas ? cajasTarimaExpandida.length : null}
                    actions={
                        tarimaExpandida && (
                            <>
                                <EstatusChip value={tarimaExpandida.estatus} />
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddBoxOutlinedIcon />}
                                    onClick={() => abrirCaja(tarimaExpandida.id, envioId)}
                                    disabled={tarimaExpandida.estatus === 'cerrada' || loading}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    {loading ? "Abriendo..." : "Abrir Nueva Caja"}
                                </Button>
                            </>
                        )
                    }
                >
                    {!tarimaExpandida ? (
                        <Box
                            sx={{
                                height: GRID_HEIGHT,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                color: 'text.secondary',
                                px: 2,
                                textAlign: 'center',
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                            }}
                        >
                            <ViewInArOutlinedIcon sx={{ fontSize: 40, color: '#bdbdbd' }} />
                            <Typography variant="body2">
                                Ninguna tarima seleccionada.
                            </Typography>
                        </Box>
                    ) : (
                        <AppDataGrid
                            rows={cajasTarimaExpandida}
                            columns={columnasCajas}
                            getRowId={(row) => row.id}
                            loading={loadingCajas}
                            height={GRID_HEIGHT}
                            rowHeight={ROW_HEIGHT_ACCIONES}
                            pageSize={GRID_PAGE_SIZE}
                            pageSizeOptions={GRID_PAGE_SIZE_OPTIONS}
                            exportFileName={`envio_${folioInternoEnvio || envioId}_tarima_${tarimaExpandida.visual_id}_cajas`}
                            localeText={localeSinRegistros('Esta tarima aún no tiene cajas.')}
                        />
                    )}
                </SectionCard>
            </Box>
        </Box>
    )
}

export default EnvioDetalle
