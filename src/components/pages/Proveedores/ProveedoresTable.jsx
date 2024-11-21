import React from 'react'
import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from 'axios';
import EditNoteIcon from '@mui/icons-material/EditNote';
import Swal from 'sweetalert2';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Tooltip } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid'


const ProveedoresTable = () => {
    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const theme = createTheme({
        palette: {
            primary: { main: '#1976d2' },
        },
    });

    const [rows, setRows] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [openModalPost, setOpenModalPost] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState('');


    const [proveedorData, setProveedorData] = useState({ // Datos del usuario en los campos
        id_proveedor: '',
        razon_social: '',
        rfc: '',
        correo: '',
        estado: '',
        sku_proveedor: ''
    });

    const [newProveedorData, setNewProveedorData] = useState({
        id_proveedor: '',
        razon_social: "",
        rfc: "",
        correo: "",
        estado: "",
        sku_proveedor: ""
    })

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
            ...proveedor
        })
        setOpenModal(true);
    }

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleOpenModalPost = () => {
        setOpenModalPost(true);
    }

    const handleCloseModalPost = () => {
        setOpenModalPost(false);
    };

    const handleChangeEstado = (e) => {
        const selectedEstado = e.target.value;
        const descripcionEstado = selectedEstado === 1 ? 'Activo' : 'Inactivo';
        setProveedorData({
            ...proveedorData,
            estado: selectedEstado,
            estado_descripcion: descripcionEstado,
        });
    };

    const addProveedor = async () => {
        try {
            const response = await axios.post(`${apiUrl}/proveedores/`, {
                razon_social: newProveedorData.razon_social,
                rfc: newProveedorData.rfc,
                correo: newProveedorData.correo,
                estado: newProveedorData.estado,
                sku_proveedor: newProveedorData.sku_proveedor
            });
            if (response.data.ok) {
                Swal.fire({
                    title: 'Proveedor creado',
                    text: 'El nuevo proveedor se ha creado correctamente',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
                fetchProveedores();
                setNewProveedorData('');
                handleCloseModalPost();
            }
        } catch (error) {
            setNewProveedorData('');
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
            const response = await axios.put(`${apiUrl}/proveedores/${proveedorData.id_proveedor}`, {
                razon_social: proveedorData.razon_social,
                rfc: proveedorData.rfc,
                correo: proveedorData.correo,
                estado: proveedorData.estado,
                sku_proveedor: proveedorData.sku_proveedor
            });
            if (response.status === 200) {
                Swal.fire({
                    title: 'Proveedor actualizado',
                    text: 'Los cambios se guardaron correctamente',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
                setProveedorData('');
                fetchProveedores();
                setOpenModal(false);
            }
        } catch (error) {
            setProveedorData('');
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al guardar los cambios',
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
        }
    };

    const columns = [
        { field: 'id_proveedor', headerName: 'Folio', flex: 1 },
        { field: 'razon_social', headerName: 'Razón Social', flex: 1 },
        { field: 'rfc', headerName: 'RFC', flex: 1 },
        { field: 'correo', headerName: 'Correo', flex: 1 },
        { field: 'estado', headerName: 'Estatus', flex: 1 },
        { field: 'sku_proveedor', headerName: 'SKU', flex: 1 },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', flex: 1, getActions: (params) => [
                <Tooltip title='Ver detalles' >
                    <GridActionsCellItem
                        icon={<EditNoteIcon />}
                        sx={{ color: 'green' }}
                        onClick={() => handleOpenModal(params.row)}
                    />
                </Tooltip>],
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
                            maxWidth: '300px', // Ajusta el tamaño del TextField según sea necesario
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
                <ThemeProvider theme={theme}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        pageSize={5}
                        disableColumnResize={false}
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        getRowId={(row) => row.id_proveedor}
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={{
                            id_proveedor: false,
                            estado: false
                        }}
                    />
                </ThemeProvider>
                {/* Modal para editar proveedor */}
                < Dialog open={openModal} onClose={handleCloseModal} >
                    <DialogTitle>Editar Proveedor</DialogTitle>
                    <DialogContent>
                        <TextField
                            label={'Razón social'}
                            fullWidth
                            margin="normal"
                            value={proveedorData.razon_social}
                            onChange={(e) => setProveedorData({ ...proveedorData, razon_social: e.target.value })}
                        />
                        <TextField
                            label={'RFC'}
                            fullWidth
                            margin="normal"
                            value={proveedorData.rfc}
                            onChange={(e) => setProveedorData({ ...proveedorData, rfc: e.target.value })}
                        />
                        <TextField
                            label={'Correo'}
                            fullWidth
                            margin="normal"
                            value={proveedorData.correo}
                            onChange={(e) => setProveedorData({ ...proveedorData, correo: e.target.value })}
                        />
                        <TextField
                            label={'SKU'}
                            fullWidth
                            margin="normal"
                            value={proveedorData.sku_proveedor}
                            onChange={(e) => setProveedorData({ ...proveedorData, sku_proveedor: e.target.value })}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>{'Estatus'}</InputLabel>
                            <Select
                                value={proveedorData.estado}
                                onChange={handleChangeEstado}
                            >
                                <MenuItem value={1}>Activo</MenuItem>
                                <MenuItem value={0}>Inactivo</MenuItem>
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal} color="primary">
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveChanges} color="primary">
                            Guardar
                        </Button>
                    </DialogActions>
                </Dialog >
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
                        <FormControl fullWidth margin="normal">
                            <InputLabel>{'Estatus'}</InputLabel>
                            <Select
                                value={newProveedorData.estado}
                                onChange={(e) => setNewProveedorData({ ...newProveedorData, estado: e.target.value })}
                            >
                                <MenuItem value={1}>Activo</MenuItem>
                                <MenuItem value={0}>Inactivo</MenuItem>
                            </Select>
                        </FormControl>
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
        </div>
    )
}

export default ProveedoresTable