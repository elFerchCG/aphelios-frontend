import { Button, FormControl, Input, InputAdornment, InputLabel, Modal, TextField, Typography } from '@mui/material';
import { GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Box } from '@mui/system';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../Inventarios/estilosPrueba.css'
import { useParams } from 'react-router-dom';

const Empaque = () => {
    const { envioId, cajaId } = useParams();  // Aquí obtienes ambos parámetros
    const [data, setData] = useState([]);
    const [openCerrarCaja, setOpenCerrarCaja] = useState(false);
    const [inventoryId, setInventoryId] = useState('');
    const [pesoCaja, setPesoCaja] = useState('');
    const [largoCaja, setLargoCaja] = useState('');
    const [anchoCaja, setAnchoCaja] = useState('');
    const [altoCaja, setAltoCaja] = useState('');
    const [habilitarCaja, setHabilitarCaja] = useState(true);
    const [habilitarTarima, setHabilitarTarima] = useState(true);
    const [habilitarEnvio, setHabilitarEnvio] = useState(true);
    const [tarimaId, setTarimaId] = useState('');
    //const [cajaId, setCajaId] = useState('');
    //const [envioId, setEnvioId] = useState('');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: true,
        inventory_id: true,
        orden: false,
        cantidad: true,
        sku: true,
        title: true,
    });

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

    // Estilos del modal
    const styleModalCerrarCaja = {
        position: 'absolute',
        width: "30%",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'white',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

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

    const handleOpenCerrarCaja = () => {
        setOpenCerrarCaja(true);
    }

    const handleCloseCerrarCaja = () => {
        setOpenCerrarCaja(false);
    }

    const handleDetailCaja = (event) => {
        const detailCajaPeso = event.target.value;
        setPesoCaja(detailCajaPeso);
    }

    const handleDetailLargoCaja = (event) => {
        const detailCajaLargo = event.target.value;
        setLargoCaja(detailCajaLargo);
    }

    const handleDetailAnchoCaja = (event) => {
        const detailCajaAncho = event.target.value;
        setAnchoCaja(detailCajaAncho);
    }

    const handleDetailAltoCaja = (event) => {
        const detailCajaAlto = event.target.value;
        setAltoCaja(detailCajaAlto);
    }

    // const fetchProducto = async () => {
    //     try {
    //         const response = await axios.get(`${apiUrl}/empaque/obtenerProducto/${inventoryId}`);
    //         if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
    //             const producto = response.data.data[0]; // Tomamos el primer elemento del array
    //             return producto; // Devuelves el producto directamente
    //         }
    //     } catch (error) {
    //         Swal.fire({
    //             title: 'Error',
    //             text: `Error: ${error.message}`,
    //             icon: 'error',
    //             timer: 5000,
    //             showCloseButton: true,
    //             allowEscapeKey: true
    //         });
    //     }
    // }

    const handleScan = async () => {
        try {
            const data = {
                cantidad: 1
            };
            const response = await axios.post(`${apiUrl}/empaque/agregarEscaneo/${inventoryId}/envio/${envioId}/caja/${cajaId}`, data,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const newRow = {
                id: response.data.id,
                inventory_id: inventoryId,
                orden: response.data.orden || "",
                cantidad: response.data.cantidad || 1,
                sku: response.data.sku,
                title: response.data.title,
            };

            setData((prevData) => [newRow, ...prevData]); // agrega al inicio
            setInventoryId(""); // Limpiar input
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: `Error: ${error.message}`,
                icon: "error",
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
            setInventoryId("");
        }
    };


    useEffect(() => {
        const timeout = setTimeout(() => {
            if (inventoryId.length === 9) { // Puedes ajustar la longitud mínima esperada
                handleScan();
            }
        }, 150); // Pequeño delay para dejar que el escáner termine de escribir

        return () => clearTimeout(timeout); // Limpiar timeout si el usuario sigue escribiendo
    }, [inventoryId]);


    // const abrirTarima = async () => {
    //     try {
    //         const response = await axios.post(
    //             `${apiUrl}/empaque/abrirTarima`,
    //             {},
    //             {
    //                 headers: {
    //                     'Authorization': `Bearer ${token}`
    //                 }
    //             }
    //         );
    //         if (response.data) {
    //             const message = response.data.message;
    //             setTarimaId(response.data.id);
    //             Swal.fire({
    //                 title: "¡Exito!",
    //                 text: message,
    //                 icon: "success",
    //                 timer: 5000,
    //                 showCloseButton: true,
    //                 allowEscapeKey: true,
    //             })
    //         }
    //     } catch (error) {
    //         const errorMessage = error.response.data.message;
    //         Swal.fire({
    //             title: 'Error',
    //             text: errorMessage,
    //             icon: 'error',
    //             showCloseButton: true,
    //             allowEscapeKey: true
    //         });
    //         setTarimaId('');
    //     }
    // }

    // const abrirCaja = async () => {
    //     try {
    //         const response = await axios.post(
    //             `${apiUrl}/empaque/abrirCaja`,
    //             {},
    //             {
    //                 headers: {
    //                     'Authorization': `Bearer ${token}`
    //                 }
    //             }
    //         );
    //         if (response.data) {
    //             const message = response.data.message;
    //             setCajaId(response.data.id);
    //             Swal.fire({
    //                 title: "¡Exito!",
    //                 text: message,
    //                 icon: "success",
    //                 timer: 5000,
    //                 showCloseButton: true,
    //                 allowEscapeKey: true,
    //             })
    //         }
    //     } catch (error) {
    //         const errorMessage = error.response.data.message;
    //         Swal.fire({
    //             title: 'Error',
    //             text: errorMessage,
    //             icon: 'error',
    //             showCloseButton: true,
    //             allowEscapeKey: true
    //         });
    //         setCajaId('');
    //     }
    // }

    // const nuevoEnvio = async () => {
    //     try {
    //         const response = await axios.post(
    //             `${apiUrl}/empaque/nuevoEnvio`,
    //             {},
    //             {
    //                 headers: {
    //                     'Authorization': `Bearer ${token}`
    //                 }
    //             }
    //         );
    //         if (response.data) {
    //             const message = response.data.message;
    //             setEnvioId(response.data.id);
    //             Swal.fire({
    //                 title: "¡Exito!",
    //                 text: message,
    //                 icon: "success",
    //                 timer: 5000,
    //                 showCloseButton: true,
    //                 allowEscapeKey: true,
    //             })
    //         }
    //     } catch (error) {
    //         const errorMessage = error.response.data.message;
    //         Swal.fire({
    //             title: 'Error',
    //             text: errorMessage,
    //             icon: 'error',
    //             showCloseButton: true,
    //             allowEscapeKey: true
    //         });
    //         setCajaId('');
    //     }
    // }

    // useEffect(() => {
    //     if (tarimaId) {
    //         setHabilitarTarima(false);
    //     } else {
    //         setHabilitarTarima(true);
    //     }
    // }, [tarimaId]);

    // useEffect(() => {
    //     if (cajaId) {
    //         setHabilitarCaja(false);
    //     } else {
    //         setHabilitarCaja(true);
    //     }
    // }, [cajaId]);

    // useEffect(() => {
    //     if (envioId) {
    //         setHabilitarEnvio(false);
    //     } else {
    //         setHabilitarEnvio(true);
    //     }
    // }, [envioId]);

    const columns = [
        { field: "id", headerName: "# Registro", type: "number", flex: 1 },
        { field: "inventory_id", headerName: "ML", type: "text", flex: 2 },
        { field: "orden", headerName: "# Orden", type: "text", flex: 1 },
        { field: "cantidad", headerName: "Cantidad", type: "number", flex: 1 },
        { field: "sku", headerName: "SKU", type: "text", flex: 2 },
        { field: "title", headerName: "Descripción", type: "text", flex: 3 }
        //{ field: "actions", headerName: "Acciones", type: "actions" }
    ]

    return (
        <div>
            {/* <div className="gestorOrdenes">
                <div className="left-actions">
                    <div className="action-item">
                        <Button
                            variant='contained'
                            disabled={!habilitarTarima}
                            onClick={abrirTarima}
                            sx={{
                                width: "90px",
                                height: "40px",
                                backgroundColor: "orange", "&:hover": { backgroundColor: "darkorange" }
                            }}
                        >
                            Tarima</Button>
                    </div>
                    <div className='action-item'>
                        <Button
                            variant='contained'
                            disabled={!habilitarCaja}
                            onClick={abrirCaja}
                            sx={{
                                width: "90px",
                                height: "40px",
                                marginTop: "5px",
                                backgroundColor: "green", "&:hover": { backgroundColor: "darkgreen" }
                            }}
                        >Caja</Button>
                    </div>
                </div>
            </div> */}
            <div className='DataG' style={{ height: 500, width: "90%", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h1>Empaque</h1>
                </div>
                {/* <div style={{ display: "flex", justifyContent: "flex-start", fontFamily: "Montserrat", fontWeight: "bold", marginTop: "-60px" }}>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", marginTop: "5px" }}># Envio:</Typography>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", marginTop: "5px", marginLeft: "20px", color: "purple" }}>{envioId}</Typography>
                    <Button
                        variant='contained'
                        disabled={!habilitarEnvio}
                        onClick={nuevoEnvio}
                        sx={{
                            width: "90px",
                            height: "40px",
                            marginLeft: "20px",
                            backgroundColor: "darkcyan", "&:hover": { backgroundColor: "cyan" }
                        }}
                    >
                        Envio</Button>
                </div> */}
                <div style={{ position: "absolute", top: "20px", right: "0", display: "flex", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}># Envio:</Typography>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", color: "red" }}>{envioId}</Typography>
                </div>
                <div style={{ position: "absolute", top: "60px", right: "0", display: "flex", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", marginTop: "10px" }}># Caja:</Typography>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", color: "blue", marginTop: "10px" }}>{cajaId}</Typography>
                </div>
                <div style={{ position: "absolute", top: "60px", display: "flex", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <FormControl variant='outlined'>
                        <InputLabel>
                            Escanear...
                        </InputLabel>
                        <Input
                            value={inventoryId}
                            onChange={(e) => setInventoryId(e.target.value)}
                            //onKeyDown={handleKeyDown} // Detectar Enter o Tab
                            endAdornment={
                                <InputAdornment position='end'>
                                    <QrCodeScannerIcon />
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                </div>
                <DataGrid sx={{ marginTop: 8, borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5", fontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={data}
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
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h3>TOTAL CAJA: {1}</h3>
                    <Button
                        variant='contained'
                        sx={{
                            width: "150px",
                            height: "40px",
                            marginTop: "10px",
                            backgroundColor: "blue", "&:hover": { backgroundColor: "darkblue" }
                        }}
                        onClick={handleOpenCerrarCaja}
                    >Cerrar Caja</Button>
                </div>
            </div>
            {/* Ventana Modal Details Componente*/}
            <Modal id="modal-details" open={openCerrarCaja} onClose={handleCloseCerrarCaja}>
                <Box sx={styleModalCerrarCaja}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Caja
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
                        <TextField
                            className='input'
                            label="Peso"
                            variant='outlined'
                            value={pesoCaja}
                            onChange={handleDetailCaja}
                            inputProps={{
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <TextField
                            className='input'
                            label="Largo"
                            variant='outlined'
                            value={largoCaja}
                            onChange={handleDetailLargoCaja}
                            inputProps={{
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <TextField
                            className='input'
                            label="Ancho"
                            variant='outlined'
                            type='number'
                            value={anchoCaja}
                            onChange={handleDetailAnchoCaja}
                            inputProps={{
                                min: 0,
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <TextField
                            className='input'
                            label="Alto"
                            variant='outlined'
                            type='number'
                            value={altoCaja}
                            onChange={handleDetailAltoCaja}
                            inputProps={{
                                min: 0,
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "50px" }}>
                        <Button onClick={handleCloseCerrarCaja} variant="contained" color="primary">Cerrar</Button>
                        <Button onClick={handleOpenCerrarCaja} variant="contained" color="success">Guardar</Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    )
}

export default Empaque