import React from 'react'
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import EditNoteIcon from '@mui/icons-material/EditNote';
import Swal from 'sweetalert2';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Modal, Select, TextField, Tooltip } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid'
import { Chip } from "@mui/material";
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { set } from 'date-fns';

const ProveedoresTable = () => {
    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const initialProveedorData = {
        id_proveedor: '',
        razon_social: '',
        rfc: '',
        correo: '',
        surtido: 1,
        backorder: 1,
        estado: 1,
        sku_proveedor: ''
    };

    const initialNewProveedorData = {
        razon_social: '',
        rfc: '',
        correo: '',
        sku_proveedor: ''
    };

    const [rows, setRows] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [openModalPost, setOpenModalPost] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const [proveedorData, setProveedorData] = useState(initialProveedorData);
    const [newProveedorData, setNewProveedorData] = useState(initialNewProveedorData);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id_proveedor: false,
        estado: false,
    });

    const initialInventariosMRP = {
        inv_seguridad: "1.0",
        inv_maximo: "1.0",
    };

    const [inventariosMRPData, setInventariosMRPData] = useState(initialInventariosMRP);



    const [openModalInventarios, setOpenModalInventarios] = useState(false);
    const handleOpenModalInventarios = (proveedor) => {
        setSelectedProveedor(proveedor);
        setOpenModalInventarios(true);
    };
    const handleCloseModalInventarios = () => {
        setOpenModalInventarios(false);
        setSelectedProveedor(null);
    };

    const styleModalInventarios = {
        fontFamily: "Montserrat",
        fontWeight: "bold",
        position: 'absolute',
        textAlign: 'center',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        bgcolor: 'background.paper',
        border: '2px solid #1e88e5',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

    const seguridadRef = useRef(null);

    useEffect(() => {
        if (openModalInventarios) {
            setInventariosMRPData(initialInventariosMRP);
        }
    }, [openModalInventarios]);

    useEffect(() => {
        if (openModalInventarios) {
            setTimeout(() => {
                seguridadRef.current?.focus();
            }, 100);
        }
    }, [openModalInventarios]);

    const fetchProveedores = async () => {
        try {
            const response = await axios.get(`${apiUrl}/proveedores`);
            if (response.data && Array.isArray(response.data)) {
                setRows(response.data);
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

    useEffect(() => {
        const fetchProveedores = async () => {
            try {
                const response = await axios.get(`${apiUrl}/proveedores`);
                if (response.data && Array.isArray(response.data)) {
                    setRows(response.data);
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
        fetchProveedores();
    }, [apiUrl]);

    const handleOpenModal = (proveedor) => {
        setSelectedProveedor(proveedor);
        setProveedorData({
            ...initialProveedorData,
            ...proveedor,
            estado: proveedor.estado ?? 1,
            surtido: proveedor.surtido ?? 1,
            backorder: proveedor.backorder ?? 1,
        });
        setOpenModal(true);
    }

    const handleCloseModal = () => {
        setOpenModal(false);
        setProveedorData(initialProveedorData);
    };

    const handleOpenModalPost = () => {
        setOpenModalPost(true);
    }

    const handleCloseModalPost = () => {
        setOpenModalPost(false);
    };

    const handleChangeEstado = (e) => {
        setProveedorData({
            ...proveedorData,
            estado: e.target.value,
        });
    };

    const handleChangeSurtido = (e) => {
        setProveedorData({
            ...proveedorData,
            surtido: e.target.value,
        });
    }

    const handleChangeBackOrder = (e) => {
        setProveedorData({
            ...proveedorData,
            backorder: e.target.value,
        });
    };

    const addProveedor = async () => {
        try {
            const response = await axios.post(`${apiUrl}/proveedores/`, {
                razon_social: newProveedorData.razon_social,
                rfc: newProveedorData.rfc,
                correo: newProveedorData.correo,
                sku_proveedor: newProveedorData.sku_proveedor
            });
            if (response.data.ok) {
                handleCloseModalPost();                 // 👈 primero cerrar modal
                setNewProveedorData(initialNewProveedorData);
                Swal.fire({
                    title: 'Proveedor creado',
                    text: 'El nuevo proveedor se ha creado correctamente',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
                fetchProveedores();
            }
        } catch (error) {
            handleCloseModalPost();
            setNewProveedorData(initialNewProveedorData);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al crear el proveedor',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
        }
    }

    const handleSaveChanges = async () => {
        try {
            await axios.put(`${apiUrl}/proveedores/${proveedorData.id_proveedor}`, proveedorData);
            Swal.fire('Actualizado', 'Proveedor actualizado correctamente', 'success');
            fetchProveedores();
            setProveedorData(initialProveedorData);
            setOpenModal(false);
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema al guardar', 'error');
            setProveedorData(initialProveedorData);
        }
    };

    const handleSaveInventariosMRP = async () => {
        try {
            const payload = {
                inv_seguridad: Number(inventariosMRPData.inv_seguridad).toFixed(1),
                inv_maximo: Number(inventariosMRPData.inv_maximo).toFixed(1),
            };

            await axios.put(`${apiUrl}/proveedores/inventariosMRP/${selectedProveedor.id_proveedor}`,
                payload
            );

            setOpenModalInventarios(false);
            Swal.fire('Actualizado', 'Todas las publicaciones se han actualizado correctamente', 'success');
            fetchProveedores();
        } catch (error) {
            setOpenModalInventarios(false);
            Swal.fire('Error', 'Hubo un problema al guardar', 'error');
        }
    };

    const columns = [
        { field: 'id_proveedor', headerName: 'Folio', flex: 1 },
        { field: 'razon_social', headerName: 'Razón Social', flex: 1.5 },
        { field: 'rfc', headerName: 'RFC', flex: 0.5 },
        { field: 'correo', headerName: 'Correo', flex: 1 },
        {
            field: 'estado', headerName: 'Estatus', flex: 0.5,
            renderCell: (params) => (
                params.value === 1
                    ? <Chip label="Activo" color="success" size="small" />
                    : <Chip label="Inactivo" color="default" size="small" />
            )
        },
        {
            field: 'backorder', headerName: 'Back Order', flex: 0.5,
            renderCell: (params) => (
                params.value === 1
                    ? <Chip label="Activo" color="success" size="small" />
                    : <Chip label="Inactivo" color="default" size="small" />
            )
        },
        { field: 'sku_proveedor', headerName: 'SKU', flex: 0.3 },
        {
            field: 'surtido', headerName: 'Tiempo Proveedor', flex: 0.3, align: 'center', renderHeader: () => (
                <Box textAlign="center">
                    Tiempo
                    <br />
                    Proveedor
                </Box>
            ),
        },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', flex: 0.5, getActions: (params) => [
                <Tooltip title='Ver detalles' >
                    <GridActionsCellItem
                        icon={<EditNoteIcon />}
                        label="Editar proveedor"
                        sx={{ color: 'green' }}
                        onClick={() => handleOpenModal(params.row)}
                    />
                </Tooltip>,
                <Tooltip title='Ajustar inventarios' >
                    <GridActionsCellItem
                        icon={<HourglassTopIcon />}
                        label="Inventarios"
                        sx={{ color: 'orange' }}
                        onClick={() => handleOpenModalInventarios(params.row)}
                    />
                </Tooltip>
            ],
        },
    ];

    return (
        <div className='contenido'>
            <div className='encabezado'>
                <h1>Proveedores</h1>
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '500px',
                    width: 'auto',
                    margin: '30px',
                    marginTop: '-30px'
                }}
            >
                {/* Contenedor flex para el TextField y el Button */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center', // Para alinear ambos elementos a la misma altura
                        marginBottom: '10px', // Espacio entre el formulario y el DataGrid
                    }}
                >
                    {/* TextField alineado a la izquierda */}
                    <TextField
                        id="outlined-basic"
                        label="Buscar proveedor"
                        variant="outlined"
                        style={{
                            minWidth: '300px', // Ajusta el tamaño del TextField según sea necesario
                            marginRight: 'auto', // Para que el TextField ocupe todo el espacio posible
                        }}
                    />
                    {/* Botón alineado a la derecha */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenModalPost}
                        style={{
                            marginLeft: 'auto', // Empuja el botón hacia la derecha
                        }}
                    >
                        Agregar Proveedor
                    </Button>
                </div>
                {/* DataGrid */}
                <DataGrid
                    rows={rows}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.id_proveedor}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) =>
                        setColumnVisibilityModel(newModel)
                    }
                    experimentalFeatures={{ newEditingApi: true }}
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                    slots={{ toolbar: GridToolbar }}
                />
                {/* Modal para editar proveedor */}
                <Dialog open={openModal} onClose={handleCloseModal} >
                    <DialogTitle>Editar Proveedor</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Razón social"
                            fullWidth
                            margin="normal"
                            value={proveedorData.razon_social}
                            onChange={(e) =>
                                setProveedorData({ ...proveedorData, razon_social: e.target.value })
                            }
                        />
                        <TextField
                            required
                            id="surtido-field"
                            label="Surtido MRP"
                            fullWidth
                            margin="normal"
                            type="number"
                            value={proveedorData.surtido ?? ""}
                            inputProps={{
                                min: 0,
                                step: 1,
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            }}
                            onChange={(e) => {
                                const value = e.target.value;

                                // Permite vacío para poder borrar
                                if (value === "") {
                                    setProveedorData({ ...proveedorData, surtido: "" });
                                    return;
                                }

                                // Solo enteros positivos
                                if (/^\d+$/.test(value)) {
                                    setProveedorData({
                                        ...proveedorData,
                                        surtido: Number(value),
                                    });
                                }
                            }}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Back Order</InputLabel>
                            <Select
                                value={proveedorData.backorder ?? ''}
                                onChange={handleChangeBackOrder}
                            >
                                <MenuItem value={1}>Activo</MenuItem>
                                <MenuItem value={0}>Inactivo</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Estatus</InputLabel>
                            <Select
                                value={proveedorData.estado ?? ''}
                                onChange={handleChangeEstado}
                            >
                                <MenuItem value={1}>Activo</MenuItem>
                                <MenuItem value={0}>Inactivo</MenuItem>
                            </Select>
                        </FormControl>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={handleCloseModal}>Cancelar</Button>
                        <Button onClick={handleSaveChanges}>Guardar</Button>
                    </DialogActions>
                </Dialog>
                {/* Modal para crear proveedor */}
                < Dialog open={openModalPost} onClose={handleCloseModalPost} >
                    <DialogTitle>Crear Proveedor</DialogTitle>
                    <DialogContent>
                        <TextField
                            label={'Razón social'}
                            fullWidth
                            margin="normal"
                            value={newProveedorData.razon_social}
                            onChange={(e) => setNewProveedorData({ ...newProveedorData, razon_social: e.target.value })}
                        />
                        <TextField
                            label={'RFC'}
                            fullWidth
                            margin="normal"
                            value={newProveedorData.rfc}
                            onChange={(e) => setNewProveedorData({ ...newProveedorData, rfc: e.target.value })}
                        />
                        <TextField
                            label={'Correo'}
                            fullWidth
                            margin="normal"
                            value={newProveedorData.correo}
                            onChange={(e) => setNewProveedorData({ ...newProveedorData, correo: e.target.value })}
                        />
                        <TextField
                            label={'SKU'}
                            fullWidth
                            margin="normal"
                            value={newProveedorData.sku_proveedor}
                            onChange={(e) => setNewProveedorData({ ...newProveedorData, sku_proveedor: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModalPost} color="primary">
                            Cancelar
                        </Button>
                        <Button onClick={addProveedor} color="primary">
                            Guardar
                        </Button>
                    </DialogActions>
                </Dialog >
            </div>
            <Modal
                open={openModalInventarios}
                onClose={handleCloseModalInventarios}
                keepMounted
                disableAutoFocus
                disableEnforceFocus
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={styleModalInventarios}>
                    <h2 id="modal-modal-title">Ajustar inventarios MASIVO MRP- {selectedProveedor?.razon_social ?? ""}</h2>
                    <TextField
                        label="Inventario de seguridad"
                        type="number"
                        fullWidth
                        margin="normal"
                        value={inventariosMRPData.inv_seguridad}
                        inputProps={{
                            min: 0,
                            step: 0.5,
                            inputMode: "decimal",
                        }}
                        onChange={(e) => {
                            const v = e.target.value;

                            // Permite vacío
                            if (v === "") {
                                setInventariosMRPData({
                                    ...inventariosMRPData,
                                    inv_seguridad: "",
                                });
                                return;
                            }

                            // Permite 1 decimal máximo
                            if (/^\d+(\.\d)?$/.test(v)) {
                                setInventariosMRPData({
                                    ...inventariosMRPData,
                                    inv_seguridad: v, // 👈 se guarda como string
                                });
                            }
                        }}
                    />
                    <TextField
                        label="Inventario máximo"
                        type="number"
                        fullWidth
                        margin="normal"
                        value={inventariosMRPData.inv_maximo}
                        inputProps={{
                            min: 0,
                            step: 0.5,
                            inputMode: "decimal",
                        }}
                        onChange={(e) => {
                            const v = e.target.value;

                            if (v === "") {
                                setInventariosMRPData({
                                    ...inventariosMRPData,
                                    inv_maximo: "",
                                });
                                return;
                            }

                            if (/^\d+(\.\d)?$/.test(v)) {
                                setInventariosMRPData({
                                    ...inventariosMRPData,
                                    inv_maximo: v,
                                });
                            }
                        }}
                    />
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                        }}
                    >
                        <Button
                            onClick={handleCloseModalInventarios}
                            variant="contained"
                            color="primary"
                        >
                            Cerrar
                        </Button>
                        <Button
                            onClick={handleSaveInventariosMRP}
                            variant="contained"
                            color="success"
                        >
                            Guardar
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    )
}

export default ProveedoresTable