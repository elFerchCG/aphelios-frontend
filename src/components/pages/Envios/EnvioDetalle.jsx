import React from 'react'
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
import { Button, TextField, Box, Typography, CircularProgress, Tooltip, Collapse, Paper, Table, TableCell, TableBody, TableRow, TableHead, IconButton } from '@mui/material';


const EnvioDetalle = () => {
    const { envioId } = useParams(); // 👈 obtenemos el id de la URL
    const location = useLocation();
    const [estatusEnvio, setEstatusEnvio] = useState(location.state?.estatusEnvio || '');

    //console.log("Estatus envio:", estatusEnvio);

    const [expandedRowId, setExpandedRowId] = useState(null);
    const [cajas, setCajas] = useState([]);
    const [tarimas, setTarimas] = useState([]);
    const [tarimaId, setTarimaId] = useState('');
    const [cajaId, setCajaId] = useState('');
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredTarimas, setFilteredTarimas] = useState([]);
    const [loadingTarimas, setLoadingTarimas] = useState(true);
    const [loadingCajas, setLoadingCajas] = useState(false);
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))

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
    }, []);

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: true,
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
        fetchTarimas();
    }, [apiUrl]);

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
        try {
            const response = await axios.post(`${apiUrl}/empaque/abrirTarima/${envioId}`,
                {},
            );
            if (response.data) {
                setTarimaId(response.data.id);
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
        }
    }

    const abrirCaja = async (tarimaId, envioIdParam) => {
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
                setCajaId(response.data.id);
                handleEntrarCajaAbierta(envioIdParam, response.data.id); // ✅ no se colapsa
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
        }
    }

    const revertirCaja = async (cajaIdParam, tarimaId) => {
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
        }
    }

    const cerrarTarima = async (envioId, tarimaId) => {
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
        }
    }

    const cerrarEnvio = async (envioId) => {
        try {
            const response = await axios.put(`${apiUrl}/empaque/cerrarEnvio/envio/${envioId}`,
                {},
            );
            if (response.data.ok) {
                navigate('/envios');
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
        }
    }

    const reabrirTarima = async (tarimaId) => {
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
        }
    }

    const handleEntrarCajaCerrada = (envioId, cajaId) => {
        navigate(`/empaque/envio/${envioId}/caja/${cajaId}`)
    };

    const handleEntrarCajaAbierta = (envioId, cajaId) => {
        navigate(`/empaqueCajaAbierta/envio/${envioId}/caja/${cajaId}`)
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

    const columns = [
        { field: "id", headerName: "# Tarima", type: "number", flex: 0.2, justifyContent: "start" },
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
                                    <CheckCircleOutlineIcon sx={{ color: params.row.estatus === 'cerrada' ? undefined : 'green', fontSize: "2rem" }} />

                                    <Typography variant='caption' sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                                        Cerrar
                                    </Typography>
                                </Box>
                            }
                            label="Cerrar Tarima"
                            onClick={() => cerrarTarima(envioId, params.row.id)}
                            disabled={params.row.estatus === 'cerrada'}
                        />
                    </>
                </Tooltip>,
                <Tooltip title="Reabrir tarima" key={`tarimas-${params.row.id}`}>
                    <>
                        <GridActionsCellItem
                            icon={
                                <Box display="flex" flexDirection="column" alignItems="center">
                                    <AutorenewIcon sx={{
                                        color: estatusEnvio === 'cerrado'
                                            ? undefined
                                            : (params.row.estatus === 'cerrada' ? 'orange' : undefined), fontSize: "2rem"
                                    }} />
                                    <Typography variant='caption' sx={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                                        Reabrir
                                    </Typography>
                                </Box>
                            }
                            label="Reabrir tarima"
                            onClick={() => reabrirTarima(params.row.id)}
                            disabled={estatusEnvio === 'cerrado' || params.row.estatus === 'abierta'}
                        />
                    </>
                </Tooltip>,
                <Tooltip title="Mostrar Cajas" key={`tarimas-${params.row.id}`}>
                    <>
                        <GridActionsCellItem
                            icon={
                                <Box display="flex" flexDirection="column" alignItems="center">
                                    {expandedRowId === params.row.id ? (
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

    return (
        <div>
            <div style={{ margin: "auto", width: "90%" }}>
                <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h1>Detalle Envio {envioId}</h1>
                </div>
                {/* <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Montserrat", fontWeight: "bold", marginTop: "-40px" }}>
                    <TextField
                        id="outlined-basic"
                        label="Buscar tarima"
                        variant='outlined'
                        sx={{
                            fontFamily: "Montserrat",
                            width: '20rem',
                            marginBottom: '10px',
                            backgroundColor: "white",
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div> */}
            </div>
            {/* Muestra el CircularProgress mientras cargan los datos */}
            <Box sx={{ px: 4 }}>

                <Box key={tarimas.id} sx={{ display: "flex", flexDirection: "row", gap: 2, mt: -2 }}>
                    {/* DataGrid a la izquierda */}
                    <Box
                        sx={{
                            width: "40%",
                            height: 480,              // <-- altura fija
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
                                disabled={tarimas.length.estatus === 'abierta' || estatusEnvio === 'cerrado'}
                                sx={{ mb: 1 }}
                            >
                                Abrir Nueva Tarima
                            </Button>
                        </Box>
                        <DataGrid
                            rows={tarimas}
                            rowHeight={55}
                            columns={columns}
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
                                maxHeight: 480,     // Altura visible antes del scroll
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
                                                Cajas de la tarima #{tarima.id}
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                onClick={() => abrirCaja(tarima.id, envioId)}
                                                disabled={tarima.estatus === 'cerrada'}
                                                sx={{ mb: 1, ml: "auto" }}
                                            >
                                                Abrir Nueva Caja
                                            </Button>
                                        </Box>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}># Caja</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>Creado Por</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>Fecha Creación</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>Piezas</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>Estatus</TableCell>
                                                    <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', textAlign: "center" }}>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(cajas[tarima.id] || []).map((caja, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{caja.id}</TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{caja.nombre_usuario}</TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{formatFecha(caja.fecha_recepcion)}</TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{caja.total_cantidad}</TableCell>
                                                        <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>{caja.estatus}</TableCell>
                                                        <TableCell>
                                                            <Box display="flex" flexDirection="row" justifyContent="center" gap={2}>
                                                                <Box display="flex" flexDirection="column" alignItems="center">
                                                                    <IconButton
                                                                        color="primary"
                                                                        onClick={() => handleEntrarCajaCerrada(envioId, caja.id)}
                                                                        disabled={caja.estatus !== 'cerrada'}
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
                                                                        disabled={tarima.estatus === 'cerrada' || caja.estatus !== 'cerrada'}
                                                                    >
                                                                        <AutorenewIcon sx={{
                                                                            color: tarima.estatus === 'cerrada'
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
                                                                        onClick={() => handleEntrarCajaAbierta(envioId, caja.id)}
                                                                        disabled={tarima.estatus === 'cerrada' || caja.estatus === 'cerrada'}
                                                                    >
                                                                        <QrCodeScannerIcon sx={{ color: caja.estatus === 'abierta' ? "rebeccapurple" : undefined, fontSize: "2rem" }} />
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
                    <Button
                        variant="contained"
                        onClick={() => cerrarEnvio(envioId)}
                        disabled={estatusEnvio === 'cerrado'}
                        sx={{ mt: 2, ml: "auto" }}
                    >
                        Cerrar Envio
                    </Button>
                </Box>
            </Box>
        </div>
    )
}

export default EnvioDetalle