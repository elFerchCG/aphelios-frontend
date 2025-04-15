import { Box, Button, Modal, TextField, Typography } from '@mui/material'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2';

const Facturas = () => {
    const [data, setData] = useState([]);
    const [openModal, setOpenModal] = useState(true);
    const [rfc, setRfc] = useState('');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))
    const [fileName, setFileName] = useState("Ningún archivo seleccionado");
    const fileInputRef = useRef(null);
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        sku: true,
        title: true,
        cantidad: true,
        precio: true,
        total: true,
        orden_id: true,
        linea_id: true,
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

    // Estilos del modal
    const styleModal = {
        position: 'absolute',
        width: "20%",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    }

    const handleRfc = (event) => {
        const rfcVar = event.target.value;
        setRfc(rfcVar);
    }

    const fetchRfc = async () => {
        setOpenModal(false);
        try {
            const response = await axios.get(`${apiUrl}/facturas/rfc/${rfc}`);
            if (response.data && Array.isArray(response.data.facturas)) {
                // Extraer los detalles de cada factura y unirlos en un solo array
                const detalles = response.data.facturas.flatMap(factura => factura.detalles);
                setData(detalles);
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: `Error: ${error.message}`,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
        }
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0];

        if (!file || !file.name.endsWith(".xml")) {
            alert("Por favor, selecciona un archivo XML válido.");
            return;
        }

        setFileName(file.name);

        // Crear FormData para enviar el archivo al backend
        const formData = new FormData();
        formData.append("archivo_xml", file);

        try {
            const response = await axios.post(`${apiUrl}/facturas/cargarFactura`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("Archivo subido con éxito:", response.data);
            alert("Archivo subido con éxito");
        } catch (error) {
            console.error("Error al subir el archivo:", error);
            alert("Error al subir el archivo");
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const columns = [
        { field: "id", headerName: "Folio Linea", type: "number" },
        { field: "sku", headerName: "SKU", type: "text", flex: 2 },
        { field: "title", headerName: "Descripción", type: "text", flex: 3 },
        { field: "cantidad", headerName: "Cantidad", type: "number", flex: 1 },
        { field: "precio", headerName: "Precio", type: "number", flex: 1 },
        { field: "total", headerName: "Total", type: "number", flex: 1 },
        { field: "orden_id", headerName: "# Orden", type: "number", },
        { field: "linea_id", headerName: "# Linea", type: "number" }
    ]

    return (
        <div>
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={styleModal}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        RFC
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
                        <TextField
                            fullWidth
                            className='input'
                            label="RFC"
                            variant='outlined'
                            value={rfc}
                            onChange={handleRfc}
                            inputProps={{
                                min: 0,
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        {/* <FormControl fullWidth>
                            <InputLabel>Usuario</InputLabel>
                            <Select
                                label="Usuario:"
                                value={selectedUsuario}
                                onChange={handleSelectedUsuario}
                                style={{ backgroundColor: "white" }}
                            >
                                {usuarios.map((usuario) => (
                                    <MenuItem key={usuario.id_usuario} value={usuario.id_usuario}>
                                        {usuario.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl> */}
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "50px" }}>
                        <Button onClick={handleCloseModal} variant="contained" color="primary" sx={{ width: 80 }}>Cerrar</Button>
                        <Button onClick={fetchRfc} variant="contained" color="success" sx={{ width: 190 }}>Enviar</Button>
                    </Box>
                </Box>
            </Modal>
            {!openModal && (
                <div className='DataG' style={{ height: 500, width: "90%", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
                        <h1>Facturas</h1>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-start", fontFamily: "Montserrat", fontWeight: "bold", marginTop: "-60px" }}>
                        <Typography variant='h5' sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}>Archivo: {fileName}</Typography>
                        <input
                            type="file"
                            accept=".xml"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        <Button
                            variant='contained'
                            sx={{
                                width: "90px",
                                height: "40px",
                                backgroundColor: "orange", "&:hover": { backgroundColor: "darkorange" }
                            }}
                            onClick={handleButtonClick}
                        >
                            Cargar
                        </Button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", marginTop: "40px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                        <Typography variant='h5' sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}>RFC: ${`prueba`}</Typography>
                        <Typography variant='h5' sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}>Nombre: ${`prueba`}</Typography>
                        <Typography variant='h5' sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}>Total: ${`prueba`}</Typography>
                    </div>
                    <DataGrid sx={{ marginTop: 4, borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5", fontFamily: "Montserrat", fontWeight: "bold" }}
                        rows={data}
                        columns={columns}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        getRowId={(row) => row.id}
                        //processRowUpdate={processRowUpdate}
                        columnVisibilityModel={columnVisibilityModel}
                        onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                        experimentalFeatures={{ newEditingApi: true }}
                        density="compact" // Establece el tamaño de las filas en compacto por defecto
                        slots={{ toolbar: CustomToolbar }}
                    />
                </div>
            )}
        </div>
    )
}

export default Facturas