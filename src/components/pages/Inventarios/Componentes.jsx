import React, { useEffect, useState } from 'react'
import '../../../estilos/billetes.css';
import { DataGrid, GridActionsCellItem, GridDeleteIcon, GridToolbar } from '@mui/x-data-grid';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import axios from 'axios';
import Swal from 'sweetalert2';
import { Box, Button, FormControl, InputLabel, MenuItem, Modal, Select, TextField, Tooltip, Typography } from '@mui/material';

const Componentes = () => {
    const [proveedores, setProveedores] = useState([]);
    const [productoIdComponent, setProductoIdComponent] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [proveedorId, setProveedorId] = useState('');
    const [multiplo, setMultiplo] = useState(1);
    const [factorConversion, setFactorConversion] = useState(1);
    const [productoSkuComponente, setProductoSkuComponente] = useState('');
    const [filteredProductsComponente, setFilteredProductsComponente] = useState([]);
    const [rowsComponentes, setRowsComponentes] = useState([]);
    const [searchTermComponente, setSearchTermComponente] = useState('');
    const [openAddComponent, setOpenAddComponent] = useState(false);
    const [openDetailsComponente, setOpenDetailsComponente] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        componente_id: false,
        multiplo: false,
        factor_conversion: false
    });

    const [componenteSku, setComponenteSku] = useState('');
    const [componenteDescripcion, setComponenteDescripcion] = useState('');
    const [componenteMultiplo, setComponenteMultiplo] = useState('');
    const [componenteConversion, setComponenteConversion] = useState('');

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

    // Estilos del modal ADD componente
    const styleAddComponent = {
        position: 'absolute',
        width: "30%",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    // Estilos del modal
    const styleDetailsComponente = {
        position: 'absolute',
        width: "30%",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    const handleOpenAddComponent = async () => {
        setOpenAddComponent(true);
    }

    const handleCloseAddComponent = () => {
        setOpenAddComponent(false);
        setProductoIdComponent('');
        setProductoSkuComponente('');
        setProductoSkuComponente('');
        setDescripcion('');
        setProveedorId('');
        setMultiplo(1);
        setFactorConversion(1);
    }

    const handleComponenteSku = (event) => {
        const skuComponente = event.target.value;
        setProductoSkuComponente(skuComponente);
    };

    const handleDetailSku = (event) => {
        const detailSku = event.target.value;
        setComponenteSku(detailSku);
    }

    const handleComponenteDesc = (event) => {
        const descComponente = event.target.value;
        setDescripcion(descComponente);
    }

    const handleDetailDesc = (event) => {
        const detailDesc = event.target.value;
        setComponenteDescripcion(detailDesc);
    }

    useEffect(() => {
        // Filtra los productos en base al término de búsqueda
        let filtered = rowsComponentes;

        if (searchTermComponente) {
            const searchWords = searchTermComponente.toLowerCase().split(' ').filter(word => word);

            filtered = filtered.filter(component => {
                const productTitle = component.descripcion ? component.descripcion.toLowerCase() : '';
                const productSku = component.sku ? component.sku.toLowerCase() : '';
                const productProveedor = component.razon_social ? component.razon_social.toLowerCase() : '';
                const productTipo = component.tipo ? component.tipo.toLowerCase() : '';

                // Verifica si todas las palabras están en el título
                const titleMatch = searchWords.every(word => productTitle.includes(word));

                // Verifica si el término de búsqueda está en otras columnas
                const otherColumnsMatch = (
                    productSku.includes(searchTermComponente.toLowerCase()) ||
                    productProveedor.includes(searchTermComponente.toLowerCase()) ||
                    productTipo.includes(searchTermComponente.toLowerCase())
                );

                // El producto debe coincidir en el título o en alguna de las otras columnas
                return titleMatch || otherColumnsMatch;
            });
        }

        setFilteredProductsComponente(filtered);
    }, [searchTermComponente, rowsComponentes]);

    const addComponent = async () => {
        try {
            const data = {
                sku: productoSkuComponente,
                descripcion: descripcion,
                proveedor_id: proveedorId,
                multiplo: multiplo,
                factor_conversion: factorConversion
            }
            console.log("Esto es lo que se manda al post:", data);
            const response = await axios.post(`${apiUrl}/componentes/agregarComponente`, data);
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
            fetchComponentesTodos();
            handleCloseAddComponent();
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
            handleCloseAddComponent();
        }
    }

    const fetchComponentesTodos = async () => {
        try {
            const response = await axios.get(`${apiUrl}/componentes/todos`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setRowsComponentes(response.data.data);
                setFilteredProductsComponente(response.data.data);
            } else {
                Swal.fire({
                    title: '!Componentes no encontrados!',
                    text: 'No se encontraron componentes',
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                const { messageText } = error.response.data.message;
                Swal.fire({
                    title: 'Error',
                    text: `Error: ${messageText}`,
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        }
    }

    useEffect(() => {
        const fetchComponentesTodos = async () => {
            try {
                const response = await axios.get(`${apiUrl}/componentes/todos`);
                if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    setRowsComponentes(response.data.data);
                    setFilteredProductsComponente(response.data.data);
                } else {
                    Swal.fire({
                        title: '!Componentes no encontrados!',
                        text: 'No se encontraron componentes',
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
                    });
                }
            } catch (error) {
                if (error.response && error.response.data && error.response.data.message) {
                    const { messageText } = error.response.data.message;
                    Swal.fire({
                        title: 'Error',
                        text: `Error: ${messageText}`,
                        icon: 'error',
                        timer: 5000,
                        showCloseButton: true,
                        allowEscapeKey: true
                    });
                }
            }
        }
        fetchComponentesTodos();
    }, [apiUrl]);

    const deleteComponent = async (componente_id) => {
        try {
            Swal.fire({
                title: '¿Estás seguro?',
                text: '¡No podrás revertir esto!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminarlo'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        console.log("Este es el id del billete a eliminar:", componente_id);
                        await axios.delete(`${apiUrl}/componentes/${componente_id}`)
                        fetchComponentesTodos();
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'Tu componente ha sido eliminado.',
                            icon: 'success'
                        });
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
                } else if (result.isDenied) {
                    Swal.fire("¡No se ha eliminado el componente!", "", "info");
                }
            })

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

    const fetchComponente = async (componente_id) => {
        try {
            const response = await axios.get(`${apiUrl}/componentes/getComponente/${componente_id}`);
            if (response.data.ok && response.data.data) {
                const componente = response.data.data;
                console.log("Esta es la respuesta del componente:", componente);
                setComponenteSku(componente.sku);
                setComponenteDescripcion(componente.descripcion);
                setComponenteMultiplo(componente.multiplo);
                setComponenteConversion(componente.factor_conversion);
            } else {
                Swal.fire({
                    title: '!Componente no encontrado!',
                    text: 'No se encontraron componentes',
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                const { messageText } = error.response.data.message;
                Swal.fire({
                    title: 'Error',
                    text: `Error: ${messageText}`,
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        }
    }

    const updateDetailComponente = async (componente_id) => {
        try {
            Swal.fire({
                title: '¿Estás seguro?',
                text: '¡No podrás revertir esto!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, actualizarlo!',
                target: document.getElementById("modal-details"),
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const data = {
                            sku: componenteSku,
                            descripcion: componenteDescripcion,
                            multiplo: componenteMultiplo,
                            factor_conversion: componenteConversion
                        }

                        await axios.put(`${apiUrl}/componentes/updateComponente/${componente_id}`, data);
                        fetchComponentesTodos();

                        Swal.fire({
                            title: 'Actualizado!',
                            text: 'Tu componente ha sido actualizado.',
                            icon: 'success',
                        });
                        setOpenDetailsComponente(false);
                    } catch (error) {
                        const errorMessage = error.response.data.message;
                        Swal.fire({
                            title: 'Error',
                            text: errorMessage,
                            icon: 'error',
                            timer: 5000,
                            showCloseButton: true,
                            allowEscapeKey: true,
                            target: document.getElementById("modal-details"),
                        });
                    }
                } else if (result.isDismissed) {
                    Swal.fire({
                        title: "¡Revertido!",
                        text: "¡No se ha actualizado el componente!",
                        icon: "info",
                    });
                    setOpenDetailsComponente(false);
                }
            })

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

    const handleMultiplo = (event) => {
        setMultiplo(parseInt(event.target.value) || 0);
    }

    const handleConversion = (event) => {
        setFactorConversion(parseInt(event.target.value) || 0);
    }

    const handleOpenDetailsComponente = (componente_id) => {
        console.log("Abriendo modal para el componente:", componente_id);
        setOpenDetailsComponente(true);
        setProductoIdComponent(componente_id);
        fetchComponente(componente_id);
    }

    const handleCloseDetailsComponente = () => {
        setOpenDetailsComponente(false);
    }

    const handleUpdateDetailComponente = (productoIdComponent) => {
        console.log("actualizando componente:", productoIdComponent);
        updateDetailComponente(productoIdComponent);
    }

    const handleDetailMultiplo = (event) => {
        setComponenteMultiplo(parseInt(event.target.value) || 0);
    }

    const handleDetailConversion = (event) => {
        setComponenteConversion(parseInt(event.target.value) || 0);
    }

    useEffect(() => {
        const fetchProveedores = async () => {
            try {
                const response = await axios.get(`${apiUrl}/proveedores`);
                if (response.data && Array.isArray(response.data)) {
                    setProveedores(response.data);
                } else {
                    Swal.fire({
                        title: '!Proveedores no encontrados!',
                        text: 'No se encontraron proveedores',
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
        if (openAddComponent) {
            fetchProveedores();
        }
    }, [apiUrl, openAddComponent])

    const handleProveedor = (event) => {
        const selectedProveedorId = event.target.value;
        setProveedorId(selectedProveedorId);

        const selectedProveedor = proveedores.find(proveedor => proveedor.id_proveedor === selectedProveedorId);
        console.log("Esto se esta guardando al seleccionar un proveedor:", proveedorId);
    }

    const columnsProductsComponentes = [
        { field: 'componente_id', headerName: 'ID Componente', type: 'number', flex: 1 },
        { field: 'sku', headerName: 'SKU Componente', type: 'text', flex: 1, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'descripcion', headerName: 'Descripcion', type: 'text', flex: 3 },
        { field: 'multiplo', headerName: 'Multiplo', type: 'number', flex: 1 },
        { field: 'factor_conversion', headerName: 'F Conversión', type: 'number', flex: 1 },
        { field: 'razon_social', headerName: 'Proveedor', type: 'text', flex: 1 },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => [
                <Tooltip title="Borrar componente" key={`delete-${params.row.componente_id}`}>
                    <GridActionsCellItem
                        icon={<GridDeleteIcon />}
                        sx={{ color: "red" }}
                        onClick={() => deleteComponent(params.row.componente_id)}
                        label="Eliminar"
                    />
                </Tooltip>,
                <Tooltip title="Abrir modal" key={`modal-${params.row.componente_id}`}>
                    <GridActionsCellItem
                        icon={<OpenInNewIcon />}
                        sx={{ color: "blue" }}
                        onClick={() => handleOpenDetailsComponente(params.row.componente_id)}
                        label="Abrir Modal"
                    />
                </Tooltip>
            ]
        }
    ]

    return (
        <div>
            <div className='DataG' style={{ height: 500, width: "90%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <TextField
                        label="Buscar componente"
                        variant='outlined'
                        sx={{
                            fontFamily: "Montserrat",
                            width: '20rem',
                            marginBottom: '10px',
                            marginTop: "10px",
                            backgroundColor: "white"
                        }}
                        value={searchTermComponente}
                        onChange={(e) => setSearchTermComponente(e.target.value)}
                    />
                    <Button variant='contained' style={{
                        marginLeft: 'auto',
                        marginBottom: '10px',
                        marginTop: "10px"
                    }}
                        onClick={handleOpenAddComponent}
                    >Agregar componente</Button>
                </div>
                <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }} sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
                    rows={filteredProductsComponente}
                    columns={columnsProductsComponentes}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.componente_id}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    experimentalFeatures={{ newEditingApi: true }}
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                    slots={{ toolbar: GridToolbar }}
                />
            </div>
            {/* Ventana Modal ADD Componente*/}
            <Modal open={openAddComponent} onClose={handleCloseAddComponent}>
                <Box sx={styleAddComponent}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Agregar nuevo componente
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
                        <TextField
                            className='input'
                            label="SKU"
                            variant='outlined'
                            value={productoSkuComponente}
                            onChange={handleComponenteSku}
                            inputProps={{
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <TextField
                            className='input'
                            label="Descripción"
                            variant='outlined'
                            value={descripcion}
                            onChange={handleComponenteDesc}
                            inputProps={{
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <FormControl>
                            <InputLabel id='select-proveedor-label'>Proveedor</InputLabel>
                            <Select
                                labelId='select-proveedor-label'
                                id='select-proveedor'
                                label="Proveedor"
                                value={proveedorId}
                                onChange={handleProveedor}
                                sx={{ width: "222px" }}
                                inputProps={{
                                    style: {
                                        backgroundColor: 'white',
                                        color: 'black',
                                    },
                                }}
                            >
                                {proveedores.map(proveedor => (
                                    <MenuItem key={proveedor.id_proveedor} value={proveedor.id_proveedor}>
                                        {proveedor.razon_social}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            className='input'
                            label="Múltiplo"
                            variant='outlined'
                            type='number'
                            value={multiplo}
                            onChange={handleMultiplo}
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
                            label="Factor Conversión"
                            variant='outlined'
                            type='number'
                            value={factorConversion}
                            onChange={handleConversion}
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
                        <Button onClick={handleCloseAddComponent} variant="contained" color="primary">Cerrar</Button>
                        <Button onClick={addComponent} variant="contained" color="success">Guardar</Button>
                    </Box>
                </Box>
            </Modal>
            {/* Ventana Modal Details Componente*/}
            <Modal id="modal-details" open={openDetailsComponente} onClose={handleCloseDetailsComponente}>
                <Box sx={styleDetailsComponente}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Componente
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
                        <TextField
                            className='input'
                            label="SKU"
                            variant='outlined'
                            value={componenteSku}
                            onChange={handleDetailSku}
                            inputProps={{
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <TextField
                            className='input'
                            label="Descripción"
                            variant='outlined'
                            value={componenteDescripcion}
                            onChange={handleDetailDesc}
                            inputProps={{
                                style: {
                                    backgroundColor: 'white',
                                    color: 'black',
                                },
                            }}
                        />
                        <TextField
                            className='input'
                            label="Múltiplo"
                            variant='outlined'
                            type='number'
                            value={componenteMultiplo}
                            onChange={handleDetailMultiplo}
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
                            label="Factor Conversión"
                            variant='outlined'
                            type='number'
                            value={componenteConversion}
                            onChange={handleDetailConversion}
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
                        <Button onClick={handleCloseDetailsComponente} variant="contained" color="primary">Cerrar</Button>
                        <Button onClick={() => handleUpdateDetailComponente(productoIdComponent)} variant="contained" color="success">Guardar</Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    )
}

export default Componentes