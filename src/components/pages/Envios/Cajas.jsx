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
import { Button, TextField, Box, Typography, CircularProgress, Alert, Tooltip } from '@mui/material';

const Cajas = () => {
    const { envioId } = useParams(); // 👈 obtenemos el id de la URL
    const [cajas, setCajas] = useState([]);
    const [cajaId, setCajaId] = useState('');
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredCajas, setFilteredCajas] = useState([]);
    const [loading, setLoading] = useState(true);
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
        usuario_id: false,
        nombre_usuario: true,
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
        const fetchCajas = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${apiUrl}/empaque/fetchCajas/${envioId}`);
                if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    setCajas(response.data.data);
                } else {
                    Swal.fire({
                        title: '¡Sin Datos!',
                        text: `No se encontraron cajas registradas en el envio: ${envioId} actualmente en la base de datos`,
                        icon: 'warning',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
                    });
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
                setLoading(false); // Detiene la carga
            }
        }
        fetchCajas();
    }, [envioId])

    const fetchCajas = async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchCajas/${envioId}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setCajas(response.data.data);
            } else {
                Swal.fire({
                    title: '¡Sin Datos!',
                    text: `No se encontraron cajas registradas en el envio: ${envioId} actualmente en la base de datos`,
                    icon: 'warning',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
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
            setLoading(false); // Detiene la carga
        }
    }

    const abrirCaja = async () => {
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
                    const response = await axios.post(`${apiUrl}/empaque/abrirCaja/${envioId}`,
                        {},
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                    if (response.data) {
                        setCajaId(response.data.id);
                        const message = response.data.message;
                        Swal.fire({
                            title: "¡Exito!",
                            text: message,
                            icon: "success",
                            timer: 5000,
                            showCloseButton: true,
                            allowEscapeKey: true,
                        })
                        fetchCajas();
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

    const columns = [
        { field: "id", headerName: "# Caja", type: "number", flex: 1 },
        { field: "usuario_id", headerName: "Creada Por", type: "number", flex: 1 },
        { field: "nombre_usuario", headerName: "Creada Por", type: "text", flex: 1 },
        { field: "estatus", headerName: "Estatus", type: "text", flex: 1 },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => [
                <Tooltip title="Entrar en caja" key={`cajas-${params.row.id}`}>
                    <GridActionsCellItem
                        icon={<AssignmentIndIcon />}
                        sx={{ color: "orange" }}
                        label='Entrar en caja'
                        onClick={() => handleEntrarCaja(envioId, params.row.id)}
                    />
                </Tooltip>
            ]
        }
    ];

    useEffect(() => {
        // Filtra los envios en base al término de búsqueda
        let filtered = cajas;

        if (searchTerm) {
            //const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word);

            filtered = filtered.filter(caja => {
                const envioId = caja.id ? caja.id.toString() : '';
                const envioUsuario = caja.nombre_usuario ? caja.nombre_usuario.toLowerCase() : '';
                const envioEstatus = caja.estatus ? caja.estatus.toLowerCase() : '';

                // Verifica si todas las palabras están en el título
                //const titleMatch = searchWords.every(word => productTitle.includes(word));

                // Verifica si el término de búsqueda está en otras columnas
                const otherColumnsMatch = (
                    envioId.includes(searchTerm.toString()) ||
                    envioUsuario.includes(searchTerm.toLowerCase()) ||
                    envioEstatus.includes(searchTerm.toLowerCase())
                );

                // El producto debe coincidir en el título o en alguna de las otras columnas
                return otherColumnsMatch;
            });
        }

        setFilteredCajas(filtered);
    }, [searchTerm, cajas]);

    return (
        <div>
            <div className='DataG' style={{ height: 500, width: "90%" }}>
                <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h1>Cajas Envio {envioId}</h1>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Montserrat", fontWeight: "bold", marginTop: "-40px" }}>
                    <TextField
                        id="outlined-basic"
                        label="Buscar caja"
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
                        onClick={abrirCaja}
                    >Nueva caja</Button>
                </div>
                {/* Muestra el CircularProgress mientras cargan los datos */}
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }} sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
                        rows={filteredCajas}
                        columns={columns}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        getRowId={(row) => row.id}
                        columnVisibilityModel={columnVisibilityModel}
                        onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                        experimentalFeatures={{ newEditingApi: true }}
                        density="compact" // Establece el tamaño de las filas en compacto por defecto
                        slots={{ toolbar: CustomToolbar }}
                    />
                )}
            </div>
        </div>
    )
}

export default Cajas