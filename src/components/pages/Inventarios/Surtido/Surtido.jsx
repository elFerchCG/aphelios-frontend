import { Box, Button, FormControl, InputAdornment, InputLabel, MenuItem, Modal, Select, TextField, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { DataGrid, GridActionsCellItem, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import axios from 'axios';


const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const Surtido = () => {
    const [data, setData] = useState([]);
    const [sku, setSku] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [selectedUsuario, setSelectedUsuario] = useState('');
    const [selectedUsuarioNombre, setSelectedUsuarioNombre] = useState('');
    const [openAsignar, setOpenAsignar] = useState(false);
    const [selectedOrdenId, setSelectedOrdenId] = useState(null);
    const [selectedDetalleId, setSelectedDetalleId] = useState(null);
    const [skuEtiqueta, setSkuEtiqueta] = useState('');
    const [titleEtiqueta, setTitleEtiqueta] = useState('');
    const [inventoryIdEtiqueta, setInventoryIdEtiqueta] = useState('');
    const [skuPuroEtiqueta, setSkuPuroEtiqueta] = useState('');
    const [cantidadRecibida, setCantidadRecibida] = useState('');
    const [cantidadTicket, setCantidadTicket] = useState('');
    const [cantidadEtiquetas, setCantidadEtiquetas] = useState('');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))
    const [dateTime, setDateTime] = useState(getCurrentDateTime());

    const inputRef = useRef(null);

    useEffect(() => {
        console.log('🟢 Montado Surtido');
        return () => {
            console.log('🔴 Desmontado Surtido');
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setDateTime(getCurrentDateTime());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        unique_id: false,
        id_orden: true,
        id_detalle_orden: false,
        cantidad_recibida: false,
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

    // Estilos del modal
    const styleModalAsignar = {
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

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await axios.get(`${apiUrl}/usuarios`);
                if (response.data && Array.isArray(response.data)) {
                    setUsuarios(response.data);
                } else {
                    Swal.fire({
                        title: '!Usuarios no encontrados!',
                        text: 'No se encontraron usuarios',
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
                    });
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
        };

        if (openAsignar === true) {
            fetchUsuarios();
        }
    }, [apiUrl, openAsignar])

    const handleSelectedUsuario = (e) => {
        const selectedId = e.target.value;
        const usuario = usuarios.find((u) => u.id_usuario === selectedId);
        setSelectedUsuario(usuario); // ahora es un objeto { id_usuario, nombre }

    }

    const fetchOrdenProduccion = async (sku) => {
        try {
            console.log("Este es el sku que se manda en la busqueda:", sku);
            const response = await axios.get(`${apiUrl}/mrp/${sku}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setData(response.data.data);
            } else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length === 0) {
                Swal.fire({
                    title: 'Error',
                    text: `Error: No se encontraron datos sobre ese sku`,
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true,
                });
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
        }
    }

    const handleInputChange = (e) => {
        setSku(e.target.value);
    };

    const handleSearch = () => {
        if (sku.trim() !== "") {
            fetchOrdenProduccion(sku);
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Ingrese un SKU válido antes de buscar',
                icon: 'warning',
                timer: 3000,
                showCloseButton: true,
                allowEscapeKey: true
            });
        }
    };

    const handleOpenAsignar = (ordenId, detalleId) => {
        setSelectedOrdenId(ordenId);
        setSelectedDetalleId(detalleId);
        setOpenAsignar(true);
    };

    const handleCloseAsignar = () => {
        setOpenAsignar(false);
        setSelectedOrdenId(null); // Resetear el ID cuando se cierre
        setSelectedDetalleId(null); // Resetear id_detalle_orden también
    };

    const generarYDescargarTXT = async (data) => {
        const { sku, title, inventory_id, cantidadEtiquetas } = data; // Extrae los valores desde la respuesta

        // Estructura del contenido del TXT con los valores reemplazados
        const contenido = `^XA
    ^CI28
    ^LH0,0
    ^FO22,165^A0N,25,25^FDSKU:${sku}^FS
    ^FO22,165^A0N,25,25^FD^FS
    ^FB350,2,2
    ^FO22,145^A0N,18,18^FD^FS
    ^FO21,145^A0N,18,18^FD^FS
    ^FB350,2,2
    ^FO22,105^A0N,20,20^FD${title}^FS
    ^FT385,105^A0B,22,22^FH\^FD${selectedUsuario.nombre}/env^FS
    ^FO65,18^BY2^BCN,54,N,N
    ^FD${inventory_id}^FS
^FT150,98^A0N,22,22^FH\^FD${inventory_id}^FS
^FT149,98^A0N,22,22^FH\^FD${inventory_id}^FS
    ^PQ${cantidadEtiquetas},0,1,Y^XZ`;

        // Crear un Blob con el contenido del archivo
        const blob = new Blob([contenido], { type: "text/plain" });

        // Crear un enlace de descarga
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `archivo_${inventory_id}.txt`;

        // Simular clic para iniciar la descarga
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchValoresOrden = async () => {
        try {
            const response = await axios.get(`${apiUrl}/mrp/fetchOrden/${selectedOrdenId}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                const result = response.data.data[0];
                setSkuEtiqueta(result.sku);
                setTitleEtiqueta(result.title);
                setInventoryIdEtiqueta(result.inventory_id);
                setSkuPuroEtiqueta(result.sku_componente);
                //setCantidadTicket(parseInt(result.cantidad_ticket));
                // Calcula la cantidad de etiquetas necesarias
                const cantidadEtiquetas = cantidadRecibida / result.cantidad_ticket;
                setCantidadTicket(cantidadEtiquetas);
                // Llamada correcta a generarYDescargarTXT pasando los datos necesarios
                await generarYDescargarTXT({
                    sku: result.sku,
                    title: result.title,
                    inventory_id: result.inventory_id,  // Usa el campo correcto según tu lógica
                    cantidadEtiquetas: cantidadEtiquetas // Asegura que se pase correctamente
                });
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
        }
    }

    const updateDetalleOrden = async () => {
        try {
            const data = {
                cantidad_surtida: cantidadRecibida
            }
            console.log("Esto es lo que se manda al put:", data);
            const response = await axios.put(`${apiUrl}/mrp/actualizarDetalleOrden/${selectedDetalleId}`, data);
            if (response.data) {
                const message = response.data.message;
                Swal.fire({
                    title: 'Se actualizó la cantidad surtida!',
                    text: message,
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
        }
    }

    const asignarLinea = async () => {
        try {
            const data = {
                cantidad_surtida: cantidadRecibida,
                operador: selectedUsuario.id_usuario
            }
            const response = await axios.post(`${apiUrl}/mrp/asignarLineaProduccion/${selectedDetalleId}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data) {
                const message = response.data.message;
                Swal.fire({
                    title: 'Registrado!',
                    text: message,
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
            await updateDetalleOrden();
            await fetchValoresOrden();
            setSku('');
            setData([]); // <- limpia los datos mostrados en el DataGrid
            handleCloseAsignar();
            inputRef.current?.focus();
        } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            handleCloseAsignar();
        }
    }

    const processRowUpdate = async (newRow, oldRow) => {
        try {
            // Enviar la actualización al backend
            const response = await axios.put(`${apiUrl}/mrp/actualizarCantidad/${newRow.id_detalle_orden}`, {
                cantidad_recibida: newRow.cantidad_recibida,
            });

            if (response.data.ok) {
                Swal.fire({
                    title: 'Actualizado!',
                    text: response.data.message,
                    icon: 'success',
                    showCloseButton: true,
                    allowEscapeKey: true
                });
                return newRow; // Devuelve la fila actualizada
            }
        } catch (error) {
            // Capturar errores del backend
            const errorMessage = error.response?.data?.message || 'Error desconocido';

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                showCloseButton: true,
                allowEscapeKey: true
            });

            return oldRow; // Revertir cambios en la UI
        }
    };

    const asignarOrdenUsuario = async () => {
        if (!selectedOrdenId) return; // Evita llamadas con un ID nulo
        console.log("Asignando orden con ID:", selectedOrdenId);
        // Aquí puedes hacer la llamada a la API con idOrden
    }

    // useEffect(() => {
    //     if (cantidadTicket > 0) { // Evitar división por 0
    //         setCantidadEtiquetas(cantidadRecibida / cantidadTicket);
    //     } else {
    //         setCantidadEtiquetas(0);
    //     }
    //     console.log("Esta es la cantidad de etiquetas a imprimir:", cantidadEtiquetas);
    // }, [cantidadRecibida, cantidadTicket, cantidadEtiquetas]); // Se ejecuta cuando cambia alguno de los valores


    const handleCantidadRecibida = (event) => {
        setCantidadRecibida(parseInt(event.target.value));
    }

    const columns = [
        { field: "unique_id", headerName: "Folio linea", type: "text", flex: 1 },
        { field: 'id_orden', headerName: "# Orden", type: "number", flex: 1 },
        { field: 'id_detalle_orden', headerName: "# Detalle orden", type: "number", flex: 1 },
        { field: "componente_sku", headerName: "SKU Componente", type: "text", flex: 2 },
        { field: "descripcion", headerName: "Descripcion", type: "text", flex: 2 },
        {
            field: "cantidad_recibida", headerName: "Cantidad Recibida", type: "number", flex: 1
        },
        { field: "tipo", headerName: "Tipo", type: "text", flex: 1 },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => [
                <Tooltip title="Asignar" key={`asignar-${params.row.id_orden}`}>
                    <GridActionsCellItem
                        icon={<AssignmentIndIcon />}
                        sx={{ color: "orange" }}
                        onClick={() => handleOpenAsignar(params.row.id_orden, params.row.id_detalle_orden)}
                        label='Asignar'
                    />
                </Tooltip>
            ]
        }
    ]

    return (
        <div>
            <div className='DataG' style={{ height: 500, width: "90%" }}>
                <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h1>Surtido</h1>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <TextField
                        inputRef={inputRef}
                        id="outlined-basic"
                        label="Buscar componente"
                        variant='outlined'
                        sx={{
                            fontFamily: "Montserrat",
                            width: '20rem',
                            marginTop: "-20px",
                            marginBottom: '10px',
                            backgroundColor: "white",
                        }}
                        value={sku}
                        onChange={handleInputChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <SearchIcon
                                        style={{
                                            cursor: 'pointer',
                                            color: 'blue',
                                        }}
                                        onClick={handleSearch}
                                    />
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{
                            style: {
                                width: "20rem",
                                height: '5px', // Altura interna del input
                                backgroundColor: 'white',
                                color: 'black',
                            },
                        }}
                    />
                </div>
                <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }} sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
                    rows={data}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.unique_id}
                    processRowUpdate={processRowUpdate}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    experimentalFeatures={{ newEditingApi: true }}
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                    slots={{ toolbar: CustomToolbar }}
                />
            </div>
            <Modal id={'modal-asignar'} open={openAsignar} onClose={handleCloseAsignar}>
                <Box sx={styleModalAsignar}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Asignar orden
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
                        <TextField
                            className='input'
                            label="Cantidad"
                            variant='outlined'
                            type='number'
                            value={cantidadRecibida}
                            onChange={handleCantidadRecibida}
                            inputProps={{
                                min: 0,
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Usuario</InputLabel>
                            <Select
                                label="Usuario:"
                                value={selectedUsuario ? selectedUsuario.id_usuario : ''}
                                onChange={handleSelectedUsuario}
                                style={{ backgroundColor: "white" }}
                            >
                                {usuarios.map((usuario) => (
                                    <MenuItem key={usuario.id_usuario} value={usuario.id_usuario}>
                                        {usuario.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "50px" }}>
                        <Button onClick={handleCloseAsignar} variant="contained" color="primary" sx={{ width: 80 }}>Cerrar</Button>
                        <Button onClick={asignarLinea} variant="contained" color="success" sx={{ width: 190 }}>Asignar e Imprimir</Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    )
}

export default Surtido