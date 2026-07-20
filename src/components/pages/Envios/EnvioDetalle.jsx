import React, { useRef } from 'react'
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport } from "@mui/x-data-grid";
import { GridToolbarColumnsButton } from '@mui/x-data-grid';
import { GridToolbarFilterButton } from '@mui/x-data-grid';
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
import dayjs from 'dayjs';
import { Button, TextField, Box, Typography, CircularProgress, Tooltip, Collapse, Paper, Table, TableCell, TableBody, TableRow, TableHead, IconButton, Grid, Card, CardContent, LinearProgress } from '@mui/material';


const EnvioDetalle = () => {
    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const { envioId } = useParams(); // 👈 obtenemos el id de la URL
    const location = useLocation();
    const [estatusEnvio, setEstatusEnvio] = useState(location.state?.estatusEnvio || '');
    const [descripcionEnvio, setDescripcionEnvio] = useState(location.state?.descripcionEnvio || '');

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


    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: false,
        estatus: true
    });

    const CustomToolbar = () => (
        <GridToolbarContainer>
            {/* Mantener solo los botones necesarios */}
            <GridToolbarColumnsButton />  {/* Botón de Columnas */}
            <GridToolbarFilterButton />   {/* Botón de Filtros */}
            <GridToolbarDensitySelector />{/* Botón de Densidad */}
            <GridToolbarExport
                csvOptions={{
                    fileName: "exported_data",
                    utf8WithBom: true, // 👈 Esto garantiza que la codificación sea UTF-8
                }}
            />
        </GridToolbarContainer>
    );

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

    useEffect(() => {
        if (envioId) {
            fetchPiezasYFacturas();
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
        { field: "visual_id", headerName: "# Tarima", type: "number", flex: 0.2, justifyContent: "start" },
        { field: "cajas_ids", headerName: "Cajas", type: "text", flex: 0.5, justifyContent: "center" },
        { field: "estatus", headerName: "Estatus", type: "text", flex: 0.2 },
        {
            field: "actions",
            headerName: "Acciones",
            flex: 0.5,
            type: "actions",
            getActions: (params) => [
                <Tooltip title="Cerrar Tarima" key={`tarimas-${params.row.id}`}>
                    <>
                        <GridActionsCellItem
                            icon={
                                <Box display="flex" flexDirection="column" alignItems="center">
                                    <CheckCircleOutlineIcon sx={{ color: params.row.estatus === 'cerrada' || loading ? '#ccc' : 'green', fontSize: "2rem" }} />

                                    <Typography variant='caption' sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                                        Cerrar
                                    </Typography>
                                </Box>
                            }
                            label="Cerrar Tarima"
                            disabled={params.row.estatus === 'cerrada' || loading}
                            onClick={() => cerrarTarima(envioId, params.row.id)}
                        />
                    </>
                </Tooltip>,
                <Tooltip title="Reabrir tarima" key={`tarimas-${params.row.id}`}>
                    <>
                        <GridActionsCellItem
                            icon={
                                <Box display="flex" flexDirection="column" alignItems="center">
                                    <AutorenewIcon sx={{
                                        color: estatusEnvio === 'finalizado' || loading
                                            ? '#ccc'
                                            : (params.row.estatus === 'cerrada' ? 'orange' : '#ccc'),
                                        fontSize: "2rem"
                                    }} />
                                    <Typography variant='caption' sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                                        Reabrir
                                    </Typography>
                                </Box>
                            }
                            label="Reabrir tarima"
                            disabled={estatusEnvio === 'finalizado' || params.row.estatus === 'abierta' || loading}
                            onClick={() => reabrirTarima(params.row.id)}
                        />
                    </>
                </Tooltip>,
                <Tooltip title="Mostrar Cajas" key={`tarimas-${params.row.id}`}>
                    <>
                        <GridActionsCellItem
                            icon={
                                <Box display="flex" flexDirection="column" alignItems="center">
                                    {expandedRowId === params.row.id || params.row.estatus === 'abierta' ? (
                                        <KeyboardArrowDownIcon sx={{ color: "blue", fontSize: "2rem" }} />
                                    ) : (
                                        <KeyboardArrowRightIcon sx={{ color: "blue", fontSize: "2rem" }} />
                                    )}
                                    <Typography variant='caption' sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                                        Cajas
                                    </Typography>
                                </Box>
                            }
                            label='Mostrar Cajas'
                            disabled={loading}
                            onClick={() => handleMostrarCajas(params.row.id)}
                        />
                    </>
                </Tooltip>
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

    // Validamos primero que 'user' exista para evitar errores si está cargando
    const puederVerBotonProgeso = user && (
        user.rol_descripcion === 'administrador' ||
        (user.rol_descripcion === 'Produccion' && user.permisos === 'supervisor')
    );

    const puedeVerBotonCerrarEnvio = user && (user.rol_descripcion === 'administrador');

    return (
        <Box p={3}>

            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            boxShadow: 2,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Envío
                            </Typography>
                            <Typography variant="h6">{descripcionEnvio || `ID: ${envioId}`}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            boxShadow: 2,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Progreso del envío
                            </Typography>
                            <Typography variant="h6">
                                {totalPiezas > 0
                                    ? Math.round((totalPiezasEmpacadas / totalPiezas) * 100)
                                    : 0}
                                %
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={
                                    totalPiezas > 0
                                        ? (totalPiezasEmpacadas / totalPiezas) * 100
                                        : 0
                                }
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            boxShadow: 2,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Resumen
                            </Typography>
                            <Typography>Total piezas: {totalPiezas}</Typography>
                            <Typography>Empacadas: {totalPiezasEmpacadas}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 🔑 BOTÓN PROGRESO: Posicionado exactamente aquí con margen inferior */}
            {puederVerBotonProgeso && (
                <Box sx={{ mt: 1.5, mb: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant='contained'
                        color="success"
                        disabled={loading}
                        onClick={() => navigate(`/envios/detalle/${envioId}/progresoEmpaque`, {
                            state: { descripcionEnvio }
                        })}
                        sx={{ textTransform: "none" }}
                    >
                        Progreso
                    </Button>
                </Box>
            )}

            {/* Muestra el CircularProgress mientras cargan los datos */}
            <Box>
                <Box key={tarimas.id} sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                    {/* DataGrid a la izquierda */}
                    <Box
                        sx={{
                            width: "40%",
                            height: 350,              // <-- altura fija
                            boxShadow: 4,
                            borderRadius: 4,
                            p: 2,
                            border: "3px solid #1e88e5",
                            fontFamily: "Montserrat",
                            fontWeight: "bold",
                            display: "flex",
                            flexDirection: "column", // 🔑 Asegura que el botón y DataGrid se apilen
                            overflowX: 'auto',
                            overflowY: 'auto',
                        }}
                    >
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                                variant="contained"
                                onClick={abrirTarima}
                                disabled={tarimas.some(t => t.estatus === 'abierta') || estatusEnvio === 'finalizado' || loading}
                                sx={{ mb: 1 }}
                            >
                                {loading ? "Abriendo..." : "Abrir Nueva Tarima"}
                            </Button>
                        </Box>
                        <DataGrid
                            rows={tarimas}
                            rowHeight={55}
                            columns={columns}
                            loading={loadingTarimas}
                            showCellVerticalBorder
                            showColumnVerticalBorder
                            getRowId={(row) => row.id}
                            columnVisibilityModel={columnVisibilityModel}
                            onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                            disableRowSelectionOnClick
                        />
                    </Box>
                    {/* Tabla expandida a la derecha */}
                    {tarimas.map((tarima) => (
                        <Collapse
                            key={tarima.id}
                            in={expandedRowId === tarima.id}
                            timeout="auto"
                            unmountOnExit
                            sx={{ width: "60%" }}
                        >
                            <Paper sx={{
                                borderRadius: 4,
                                boxShadow: 4,
                                border: "3px solid #1e88e5",
                                backgroundColor: "#f9f9f9",
                                p: 2,
                                fontFamily: "Montserrat",
                                fontWeight: "bold",
                                maxHeight: 350,     // Altura visible antes del scroll
                                overflowX: 'auto',  // Scroll horizontal
                                overflowY: 'auto',  // Scroll vertical si hay muchas filas
                            }}>
                                {loadingCajas ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <>
                                        <Box sx={{
                                            display: "flex",
                                            flexDirection: "row", // 🔑 Asegura que el botón y DataGrid se apilen
                                            gap: 1, // Espacio entre botón y tabla
                                        }}>
                                            <Typography variant="h6" sx={{ mb: 1 }}>
                                                Cajas de la tarima #{tarima.visual_id}
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                onClick={() => abrirCaja(tarima.id, envioId)}
                                                disabled={tarima.estatus === 'cerrada' || loading}
                                                sx={{ mb: 1, ml: "auto" }}
                                            >
                                                {loading ? "Abriendo..." : "Abrir Nueva Caja"}
                                            </Button>
                                        </Box>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', display: 'none' }}># Caja</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}># Caja</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>Creado Por</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>Fecha Creación</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>Piezas</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>Estatus</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', textAlign: "center" }}>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(cajas[tarima.id] || [])
                                                    .sort((a, b) => Number(b.visual_id) - Number(a.visual_id))
                                                    .map((caja, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', display: 'none' }}>{caja.id}</TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{caja.visual_id}</TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{caja.nombre_usuario}</TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{formatFecha(caja.fecha_recepcion)}</TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{caja.total_cantidad}</TableCell>
                                                            <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{caja.estatus}</TableCell>
                                                            <TableCell>
                                                                <Box display="flex" flexDirection="row" justifyContent="center" gap={2}>
                                                                    <Box display="flex" flexDirection="column" alignItems="center">
                                                                        <IconButton
                                                                            color="primary"
                                                                            onClick={() => handleEntrarCajaCerrada(envioId, caja.id, caja.visual_id)}
                                                                            disabled={caja.estatus !== 'cerrada' || loading}
                                                                        >
                                                                            <ListAltIcon sx={{ fontSize: "2rem" }} />
                                                                        </IconButton>
                                                                        <Typography variant='caption' sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                                                                            Registros
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box display="flex" flexDirection="column" alignItems="center">
                                                                        <IconButton
                                                                            onClick={() => revertirCaja(caja.id, tarima.id)}
                                                                            disabled={tarima.estatus === 'cerrada' || caja.estatus !== 'cerrada' || loading}
                                                                        >
                                                                            <AutorenewIcon sx={{
                                                                                color: tarima.estatus === 'cerrada' || loading
                                                                                    ? 'gray'
                                                                                    : (caja.estatus === 'cerrada' ? 'orange' : undefined),
                                                                                fontSize: "2rem"
                                                                            }}
                                                                            />
                                                                        </IconButton>
                                                                        <Typography variant='caption' sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                                                                            Reabrir
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box display="flex" flexDirection="column" alignItems="center">
                                                                        <IconButton
                                                                            onClick={() => handleEntrarCajaAbierta(envioId, caja.id, caja.visual_id)}
                                                                            disabled={tarima.estatus === 'cerrada' || caja.estatus === 'cerrada' || loading}
                                                                        >
                                                                            <QrCodeScannerIcon sx={{ color: caja.estatus === 'abierta' && !loading ? "rebeccapurple" : 'gray', fontSize: "2rem" }} />
                                                                        </IconButton>
                                                                        <Typography variant='caption' sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                                                                            Escanear
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </>
                                )}
                            </Paper>
                        </Collapse>
                    ))}
                </Box>
                <Box
                    sx={{ display: "flex", flexDirection: "row" }}
                >
                    {puedeVerBotonCerrarEnvio && (
                        <Button
                            variant="contained"
                            onClick={() => cerrarEnvio(envioId)}
                            disabled={estatusEnvio === 'finalizado' || loading}
                            sx={{ mt: 2, ml: "auto" }}
                        >
                            Cerrar Envio
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    )
}

export default EnvioDetalle