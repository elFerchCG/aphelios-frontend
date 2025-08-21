import { Box, Button, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Modal, OutlinedInput, Select, TextField, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useRef, useState, useMemo } from 'react'
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { DataGrid, GridActionsCellItem, GridEditInputCell, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import axios from 'axios';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";


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
    const [componentes, setComponentes] = useState([]);
    const [sku, setSku] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [habilitarAsignar, setHabilitarAsignar] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState('');
    const [openAsignar, setOpenAsignar] = useState(false);
    const [openImprimir, setOpenImprimir] = useState(false);
    const [ml, setMl] = useState("");
    const [titleEtiquetasModal, setTitleEtiquetasModal] = useState("");
    const [skuEtiquetasModal, setSkuEtiquetasModal] = useState("");
    const [cantidadEtiquetasModal, setCantidadEtiquetasModal] = useState("");
    const [cantidadEtiquetas, setCantidadEtiquetas] = useState("");
    const [selectedOrdenId, setSelectedOrdenId] = useState(null);
    const [selectedDetalleId, setSelectedDetalleId] = useState(null);
    const [skuEtiqueta, setSkuEtiqueta] = useState('');
    const [titleEtiqueta, setTitleEtiqueta] = useState('');
    const [inventoryIdEtiqueta, setInventoryIdEtiqueta] = useState('');
    const [skuPuroEtiqueta, setSkuPuroEtiqueta] = useState('');
    const [cantidadRecibida, setCantidadRecibida] = useState('');
    const [cantidadTicket, setCantidadTicket] = useState('');
    //const [cantidadEtiquetas, setCantidadEtiquetas] = useState('');
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
        width: "70%",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    // Estilos del modal etiquetas
    const styleModalEtiquetas = {
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
        const todasContadas = componentes.every(comp => Number(comp.cantidad_contada) > 0);
        setHabilitarAsignar(todasContadas);
    }, [componentes]);


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
            const response = await axios.get(`${apiUrl}/mrp/${sku}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setData(response.data.data);
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

    const handleOpenAsignar = async (ordenId, detalleId) => {
        setSelectedOrdenId(ordenId);
        setSelectedDetalleId(detalleId);
        await validarPaquete(ordenId);
        setOpenAsignar(true);
    };

    const handleCloseAsignar = () => {
        setOpenAsignar(false);
        setSelectedOrdenId(null); // Resetear el ID cuando se cierre
        setSelectedDetalleId(null); // Resetear id_detalle_orden también
        setCantidadRecibida("");
        setSelectedUsuario("");
    };

    const handleOpenImprimir = () => {
        setOpenImprimir(true);
    }

    const handleCloseImprimir = () => {
        setOpenImprimir(false);
        setMl("");
        setCantidadEtiquetasModal("");
    };

    const generarYDescargarTXT = async (data) => {
        const { sku, title, inventory_id, cantidadEtiquetas } = data; // Extrae los valores desde la respuesta

        // Estructura del contenido del TXT con los valores reemplazados
        const contenido =
            `^XA
            ^CI28
            ^LH0,0
            ^FO22,165^A0N,25,25^FDSKU:${sku}^FS
            ^FO22,165^A0N,25,25^FD^FS
            ^FB350,2,2
            ^FO22,145^A0N,18,18^FD^FS
            ^FO21,145^A0N,18,18^FD^FS
            ^FB350,2,2
            ^FO22,105^A0N,20,20^FD${title}^FS
            ^FT385,105^A0B,22,22^FHFD${selectedUsuario.nombre || user.nombre}/env^FS
            ^FO65,18^BY2^BCN,54,N,N
            ^FD${inventory_id}^FS
        ^FT150,98^A0N,22,22^FHFD${inventory_id}^FS
        ^FT149,98^A0N,22,22^FHFD${inventory_id}^FS
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

    const asignarLinea = async () => {
        try {
            const data = {
                operador: selectedUsuario.id_usuario,
                orden_id: componentes[0]?.orden_id
            }
            const response = await axios.post(`${apiUrl}/mrp/asignarLineaProduccion`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.ok) {
                setCantidadTicket();
                //await updateDetalleOrden();
                await fetchValoresOrden(response.data.cantidadEtiquetas);
                setSku('');
                setData([]); // <- limpia los datos mostrados en el DataGrid
                handleCloseAsignar();
                inputRef.current?.focus();
            }
        } catch (error) {
            const errorMessage =
                error?.response?.data?.message || 'Ocurrió un error inesperado';

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

    const imprimirEtiquetas = async () => {
        try {
            const response = await axios.post(`${apiUrl}/mrp/imprimirEtiquetas`, {
                inventory_id: ml
            });
            if (response.data.ok) {
                setTitleEtiquetasModal(response.data.title);
                setSkuEtiquetasModal(response.data.sku);
                await generarYDescargarTXT({
                    title: response.data.title,
                    sku: response.data.sku,
                    inventory_id: ml,
                    cantidadEtiquetas: cantidadEtiquetasModal
                });
            }
            handleCloseImprimir();
        } catch (error) {
            const errorMessage =
                error?.response?.data?.message || 'Ocurrió un error inesperado';

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            handleCloseImprimir();
        }
    }

    const fetchValoresOrden = async (cantidadEtiquetas) => {
        try {
            const response = await axios.get(`${apiUrl}/mrp/fetchOrden/${selectedOrdenId}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                const result = response.data.data[0];
                setSkuEtiqueta(result.sku);
                setTitleEtiqueta(result.title);
                setInventoryIdEtiqueta(result.inventory_id);
                setSkuPuroEtiqueta(result.sku_componente);
                // Llamada correcta a generarYDescargarTXT pasando los datos necesarios
                await generarYDescargarTXT({
                    sku: result.sku,
                    title: result.title,
                    inventory_id: result.inventory_id,  // Usa el campo correcto según tu lógica
                    cantidadEtiquetas
                });
                console.log("Esta es la cantidad a imprimir de etiquetas:", cantidadEtiquetas);
            }
        } catch (error) {
            const errorMessage =
                error?.response?.data?.message || 'Ocurrió un error inesperado';

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

    const ordenesRepetidas = useMemo(() => {
        const counts = {};
        data.forEach(row => {
            if (row.id_orden != null) {
                counts[row.id_orden] = (counts[row.id_orden] || 0) + 1;
            }
        });

        return new Set(
            Object.entries(counts)
                .filter(([_, count]) => count > 1)
                .map(([id_orden]) => Number(id_orden))
        );
    }, [data]);

    const validarPaquete = async (id) => {
        try {
            const response = await axios.get(`${apiUrl}/mrp/validarPaquete/${id}`);
            if (response.data.ok) {
                setComponentes(response.data.paqueteCheck);
                console.log("Este es el response:", response.data);
            }
        } catch (error) {
            console.log("Ocurrio un error en validarPaquete:", error);
        }
    }

    const contarComponenteSurtido = async (row) => {
        const response = await axios.put(`${apiUrl}/mrp/contarComponenteSurtido/${row.id}`, {
            cantidad_contada: row.cantidad_a_contar
        });
        await validarPaquete(row.orden_id);

        const message = response.data.message;
        Swal.fire({
            icon: 'success',
            title: 'Cantidad actualizada',
            text: message,
            timer: 1000,
            showConfirmButton: false,
            target: document.getElementById("modal-asignar"),
        });
    }

    const processRowUpdate = async (updatedRow, oldRow) => {
        try {
            // Llamar a handleUpdateLinea para realizar la actualización en la base de datos
            await contarComponenteSurtido(updatedRow);

            // Si todo sale bien, devolver la fila actualizada
            return updatedRow;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
            Swal.fire({
                title: '¡No se pudo actualizar la linea!',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
                target: document.getElementById("modal-asignar"),
            });
            return oldRow;
        }
    };

    // Manejador de errores global en DataGrid
    const handleProcessRowUpdateError = (error) => {
        const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
        Swal.fire({
            title: "Error Global",
            text: errorMessage,
            icon: "error",
            showCloseButton: true,
            allowEscapeKey: true,
        });
    };

    const isCellEditable = (params) => {
        return (
            params.field === 'cantidad_a_contar' &&
            typeof params.row.sku === 'string' &&
            params.row.sku.trim() !== ''
        );
    };

    const columns = [
        { field: "unique_id", headerName: "Folio linea", type: "text", flex: 1 },
        { field: 'id_orden', headerName: "# Orden", type: "number", flex: 1 },
        { field: 'id_detalle_orden', headerName: "# Detalle orden", type: "number", flex: 1 },
        { field: "componente_sku", headerName: "SKU Componente", type: "text", flex: 2 },
        {
            field: "descripcion", headerName: "Descripcion", type: "text", flex: 2, renderCell: (params) => (
                params.value ?? "Sin descripción"
            )
        },
        {
            field: "cantidad_recibida", headerName: "Cantidad Recibida", type: "number", flex: 1
        },
        { field: "tipo", headerName: "Tipo", type: "text", flex: 1 },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => {
                // Solo mostrar si esta es la PRIMERA fila con este id_orden
                const isFirstInstance = !data.some((row, index) =>
                    row.id_orden === params.row.id_orden && row.unique_id < params.row.unique_id
                );

                if (!isFirstInstance) return [];

                return [
                    <Tooltip title="Asignar" key={`asignar-${params.row.id_orden}`}>
                        <GridActionsCellItem
                            icon={<AssignmentIndIcon />}
                            sx={{ color: "orange" }}
                            onClick={() => handleOpenAsignar(params.row.id_orden, params.row.id_detalle_orden)}
                            label='Asignar'
                        />
                    </Tooltip>,
                    <Tooltip title="Ver publicación" key={`link-${params.row.permalink}`}>
                        <GridActionsCellItem
                            icon={<OpenInNewIcon />}
                            sx={{ color: "green" }}
                            onClick={() => window.open(params.row.permalink, "_blank")}
                            label="Ver publicación"
                            disabled={!params.row.permalink} // por si el campo viene nulo
                        />
                    </Tooltip>
                ];
            }
        }
    ]

    return (
        <div>
            <div className='DataG' style={{ height: 500, width: "90%" }}>
                <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h1>Surtido</h1>
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontFamily: "Montserrat",
                        fontWeight: "bold",
                        marginBottom: "10px",
                    }}
                >
                    <TextField
                        inputRef={inputRef}
                        id="outlined-basic"
                        label="Ingresar SKU"
                        variant="outlined"
                        sx={{
                            fontFamily: "Montserrat",
                            width: "20rem",
                            backgroundColor: "white",
                        }}
                        value={sku}
                        onChange={handleInputChange}
                        onBlur={handleSearch}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSearch(); // 👈 llama al presionar Enter
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon
                                        style={{
                                            cursor: "pointer",
                                            color: "blue",
                                        }}
                                        onClick={handleSearch}
                                    />
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{
                            style: {
                                width: "20rem",
                                height: "5px", // Altura interna del input
                                backgroundColor: "white",
                                color: "black",
                            },
                        }}
                    />
                    {['administrador'].includes(user?.rol_descripcion) && (
                        <Button
                            variant="contained"
                            onClick={handleOpenImprimir}
                        >
                            Imprimir Etiqueta
                        </Button>
                    )}
                </div>
                <DataGrid
                    sx={{
                        fontFamily: "Montserrat",
                        fontWeight: "bold",
                        borderRadius: 4,
                        boxShadow: 24,
                        borderWidth: 3,
                        borderColor: "#1e88e5",
                        '& .fila-repetida': {
                            backgroundColor: '#FFF9C4',
                        }
                    }}
                    rows={data}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.unique_id}
                    //processRowUpdate={processRowUpdate}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    disableRowSelectionOnClick
                    experimentalFeatures={{ newEditingApi: true }}
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                    slots={{ toolbar: CustomToolbar }}
                    getRowClassName={(params) =>
                        ordenesRepetidas.has(Number(params.row.id_orden)) ? 'fila-repetida' : ''
                    }
                />
            </div>
            <Modal id={'modal-asignar'} open={openAsignar} onClose={handleCloseAsignar}>
                <Box sx={styleModalAsignar}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Asignar orden
                    </Typography>
                    <DataGrid
                        rows={componentes}
                        columns={[
                            { field: "id", headerName: "Folio detalle orden", flex: 1 },
                            { field: "orden_id", headerName: "Folio orden", flex: 1 },
                            { field: "sku", headerName: "SKU Componente", flex: 1 },
                            { field: "descripcion", headerName: "Descripción", flex: 2 },
                            {
                                field: "cantidad_contada",
                                headerName: "Cantidad contada",
                                flex: 1,
                                type: "number",

                            },
                            {
                                field: "cantidad_a_contar",
                                headerName: "Cantidad a surtir",
                                type: "number",
                                flex: 1,
                                editable: true,
                                cellClassName: 'celdaEditable',
                                renderEditCell: (params) => {
                                    return (
                                        <GridEditInputCell
                                            {...params}
                                            type="number"
                                            inputProps={{
                                                min: 0, // Establecer el mínimo permitido en el input
                                            }}
                                            onWheel={(e) => e.target.blur()} // Evitar cambios accidentales con la rueda del mouse
                                        />
                                    );
                                },
                                preProcessEditCellProps: (params) => {
                                    const { props } = params;

                                    // Asegurar que el valor sea al menos 0
                                    const value = Math.max(0, props.value);

                                    const isValid = /^[0-9]+$/.test(value);

                                    return {
                                        ...props,
                                        value, // Forzar el valor a 0 si es menor
                                        error: !isValid,  // Marca la celda con error si la validación falla
                                    };
                                }
                            },
                        ]}
                        getRowId={(row) => row.id}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        density="compact"
                        disableRowSelectionOnClick
                        onProcessRowUpdateError={handleProcessRowUpdateError} // Aquí añadimos el manejador global
                        processRowUpdate={processRowUpdate}
                        isCellEditable={isCellEditable}
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={{
                            // Hide columns status and traderName, the other columns will remain visible
                            id: false,
                            orden_id: false,
                        }}
                        sx={{
                            fontFamily: "Montserrat",
                            fontWeight: "bold",
                            mb: 5
                        }}
                    />

                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
                        <FormControl fullWidth sx={{ width: 223, ml: "auto" }}>
                            <InputLabel id="operador-label">Operador</InputLabel>
                            <Select
                                labelId="operador-label"
                                id="operador"
                                value={selectedUsuario ? selectedUsuario.id_usuario : ''}
                                label="Operador"
                                onChange={handleSelectedUsuario}
                                disabled={!habilitarAsignar}
                                sx={{
                                    backgroundColor: !habilitarAsignar ? '#f0f0f0' : 'white',
                                    '.MuiSelect-select': {
                                        color: !habilitarAsignar ? '#9e9e9e' : 'black',
                                    },
                                }}
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
                        <Button onClick={asignarLinea} variant="contained" color="success" disabled={!habilitarAsignar} sx={{ width: 190 }}>Asignar e Imprimir</Button>
                    </Box>
                </Box>
            </Modal>
            <Modal id={'modal-imprimir'} open={openImprimir} onClose={handleCloseImprimir}>
                <Box sx={styleModalEtiquetas}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Imprimir Etiquetas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: "wrap", gap: 2 }}>
                        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                            <InputLabel>ML</InputLabel>
                            <OutlinedInput
                                type={'text'}
                                label="ML"
                                value={ml}
                                onChange={(e) => setMl(e.target.value)}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <QrCodeScannerIcon />
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        <FormControl sx={{ ml: 1, width: '15ch' }} variant="outlined">
                            <InputLabel>Cantidad</InputLabel>
                            <OutlinedInput
                                type={'number'}
                                label="Cantidad"
                                value={cantidadEtiquetasModal}
                                onChange={(e) => setCantidadEtiquetasModal(e.target.value)}
                            />
                        </FormControl>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "50px" }}>
                        <Button onClick={handleCloseImprimir} variant="contained" color="primary" sx={{ width: 80 }}>Cerrar</Button>
                        <Button onClick={imprimirEtiquetas} variant="contained" color="success" sx={{ width: 190 }}>Imprimir</Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    )
}

export default Surtido