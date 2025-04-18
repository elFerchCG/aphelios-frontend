import React from 'react'
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { DataGrid, GridActionsCellItem, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport } from "@mui/x-data-grid";
import { GridToolbarColumnsButton } from '@mui/x-data-grid';
import { GridToolbarFilterButton } from '@mui/x-data-grid';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Button, TextField, Box, Typography, CircularProgress, Alert, Tooltip, Collapse, Paper, Table, TableCell, TableBody, TableRow, TableHead } from '@mui/material';

const EnvioDetalle = () => {
    const { envioId } = useParams(); // 👈 obtenemos el id de la URL
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [cajas, setCajas] = useState([]);
    const [tarimas, setTarimas] = useState([]);
    const [tarimaId, setTarimaId] = useState('');
    const [cajaId, setCajaId] = useState('');
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredTarimas, setFilteredTarimas] = useState([]);
    const [loadingTarimas, setLoadingTarimas] = useState(true);
    const [loadingCajas, setLoadingCajas] = useState(false);
    const [error, setError] = useState(null); // <-- para capturar errores
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))

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
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: '¡Sin datos!',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        } finally {
            setLoadingTarimas(false); // Detiene la carga
        }
    }

    // useEffect(() => {
    //     fetchCajas();
    // }, [apiUrl]);

    // const fetchCajas = async () => {
    //     setLoadingCajas(true);
    //     try {
    //         const response = await axios.get(`${apiUrl}/empaque/fetchCajas/${envioId}`);
    //         if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
    //             setCajas(response.data.data);
    //         }
    //     } catch (error) {
    //         const errorMessage = error.response.data.message;
    //         Swal.fire({
    //             title: '¡Sin datos!',
    //             text: errorMessage,
    //             icon: 'warning',
    //             timer: 5000,
    //             showCloseButton: true,
    //             allowEscapeKey: true,
    //         });
    //     } finally {
    //         setLoadingCajas(false); // Detiene la carga
    //     }
    // }

    const abrirTarima = async () => {
        Swal.fire({
            title: `¿Estás seguro de abrir una nueva caja en el envio ${envioId}?`,
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, abrir nueva caja!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axios.post(`${apiUrl}/empaque/abrirTarima/${envioId}`,
                        {},
                    );
                    if (response.data) {
                        setTarimaId(response.data.id);
                        const message = response.data.message;
                        Swal.fire({
                            title: "¡Exito!",
                            text: message,
                            icon: "success",
                            timer: 5000,
                            showCloseButton: true,
                            allowEscapeKey: true,
                        })
                        fetchTarimas();
                    }
                } catch (error) {
                    const errorMessage = error.response.data.message;
                    Swal.fire({
                        title: 'Error',
                        text: errorMessage,
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true,
                    });
                }
            } else if (result.isDismissed) {
                Swal.fire({
                    title: "¡Revertido!",
                    text: "¡No se ha abierto una nueva caja!",
                    icon: "info",
                });
            }
        })
    }

    const handleEntrarCaja = (envioId, cajaId) => {
        navigate(`/empaque/${envioId}/${cajaId}`)
        console.log("Este es el idEnvio y cajaId:", envioId, cajaId);
    };

    const handleMostrarCajas = async (tarimaId) => {
        if (expandedRowId === tarimaId) {
            setExpandedRowId(null);
            return;
        }

        setLoadingCajas(true);
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchCajas/${tarimaId}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setCajas(prev => ({
                    ...prev,
                    [envioId]: response.data.data
                }));
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        } finally {
            setExpandedRowId(tarimaId);
            setLoadingCajas(false);
        }
    };

    const columns = [
        { field: "id", headerName: "# Tarima", type: "number", flex: 1 },
        { field: "estatus", headerName: "Estatus", type: "text", flex: 1 },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => [
                <Tooltip title="Mostrar cajas" key={`cajas-${params.row.id}`}>
                    <GridActionsCellItem
                        icon={
                            expandedRowId === params.row.id ? (
                                <KeyboardArrowDownIcon />
                            ) : (
                                <KeyboardArrowRightIcon />
                            )
                        }
                        sx={{ color: "orange" }}
                        label='Mostrar cajas'
                        onClick={() => handleMostrarCajas(params.row.id)}
                    />
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
            <div className='DataG' style={{ height: 500, width: "90%" }}>
                <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h1>Detalle Envio {envioId}</h1>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Montserrat", fontWeight: "bold", marginTop: "-40px" }}>
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
                    <Button variant='contained' style={{
                        marginLeft: 'auto',
                        marginBottom: '10px',
                        marginTop: "10px"
                    }}
                        onClick={abrirTarima}
                    >Abrir Nueva Tarima</Button>
                </div>
                {/* Muestra el CircularProgress mientras cargan los datos */}
                <Box>
                    {filteredTarimas.map((row) => (
                        <Box key={row.id} sx={{ mb: 1 }}>
                            <DataGrid sx={{ height: 300, borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5", fontFamily: "Montserrat", fontWeight: "bold" }}
                                rows={filteredTarimas}
                                columns={columns}
                                showCellVerticalBorder
                                showColumnVerticalBorder
                                getRowId={(row) => row.id}
                                columnVisibilityModel={columnVisibilityModel}
                                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                                experimentalFeatures={{ newEditingApi: true }}
                                density="compact" // Establece el tamaño de las filas en compacto por defecto
                                slots={{ toolbar: CustomToolbar }}
                                disableRowSelectionOnClick
                            />
                            <Collapse in={expandedRowId === row.id}
                                timeout="auto" unmountOnExit
                            >
                                <Paper
                                    sx={{
                                        mt: 2,
                                        borderRadius: 4,
                                        boxShadow: 24,
                                        border: '3px solid #1e88e5',
                                        backgroundColor: '#f9f9f9',
                                        p: 2,
                                        fontFamily: "Montserrat",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {loadingCajas ? (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                my: 2
                                            }}
                                        >
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <>
                                            <Typography variant="h6" sx={{ mb: 1 }}>Cajas de la tarima #{row.id}</Typography>
                                            <Table size='small'>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell># Caja</TableCell>
                                                        <TableCell>Creado Por</TableCell>
                                                        <TableCell>Fecha Recepción</TableCell>
                                                        <TableCell>Estatus</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {(cajas[row.id] || []).map((caja, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{caja.id}</TableCell>
                                                            <TableCell>{caja.nombre_usuario}</TableCell>
                                                            <TableCell>{caja.fecha_recepcion}</TableCell>
                                                            <TableCell>{caja.estatus}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </>
                                    )}
                                </Paper>
                            </Collapse>
                        </Box>
                    ))}
                </Box>
            </div>
        </div>
    )
}

export default EnvioDetalle