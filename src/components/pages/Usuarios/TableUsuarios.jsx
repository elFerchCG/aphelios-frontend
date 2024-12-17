import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Tooltip } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid'
import axios from 'axios';
import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const TableUsuarios = () => {
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
    const [roles, setRoles] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [openModalPost, setOpenModalPost] = useState(false);
    const [userData, setUserData] = useState({ // Datos del usuario en los campos
        id_usuario: '',
        nombre: '',
        password: '',
        estado: '',
        rol_id: '',
        rol_descripcion: ''
    });

    const [newUserData, setNewUserData] = useState({
        nombre: '',
        password: "",
        estado: 1,
        rol_id: ""
    })

    const fetchUsuarios = async () => {
        try {
            const response = await axios.get(`${apiUrl}/usuarios`);
            if (response.data && Array.isArray(response.data)) {
                setRows(response.data);
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

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await axios.get(`${apiUrl}/usuarios`);
                if (response.data && Array.isArray(response.data)) {
                    setRows(response.data);
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

        const fetchRoles = async () => {
            try {
                const response = await axios.get(`${apiUrl}/usuarios/roles`);
                if (response.data && Array.isArray(response.data)) {
                    setRoles(response.data);
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudieron cargar los roles',
                    icon: 'error',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
        };

        fetchUsuarios();
        if (selectedUser || openModalPost) {
            fetchRoles();
        }
    }, [apiUrl, selectedUser, openModalPost]);

    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setUserData({
            ...user,
            password: '',
            rol_descripcion: getRolDescripcion(user.rol_id),
        });
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleOpenModalPost = () => {
        setOpenModalPost(true);
    }

    const handleCloseModalPost = () => {
        setOpenModalPost(false);
    };

    const getRolDescripcion = (rolId) => {
        const rol = roles.find(role => role.id === rolId);
        return rol ? rol.descripcion : 'Desconocido';
    };

    const handleChangeEstado = (e) => {
        const selectedEstado = e.target.value;
        const descripcionEstado = selectedEstado === 1 ? 'Activo' : 'Inactivo';
        setUserData({
            ...userData,
            estado: selectedEstado,
            estado_descripcion: descripcionEstado,
        });
    };

    const handleSaveChanges = async () => {
        try {
            const response = await axios.put(`${apiUrl}/usuarios/actualizar/${userData.id_usuario}`, {
                nombre: userData.nombre,
                password: userData.password,
                rol: parseInt(userData.rol_id, 10), // Convertir a número entero
                estado: userData.estado // Enviar el estado (1 o 0)
            });
            if (response.status === 200) {
                Swal.fire({
                    title: 'Usuario actualizado',
                    text: 'Los cambios se guardaron correctamente',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
                setUserData('');
                fetchUsuarios();
                setOpenModal(false);
            }
        } catch (error) {
            setUserData('');
            const errorMessage = error.response?.data?.message || "Hubo un error desconocido";
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            setOpenModal(false);
        }
    };

    const addUser = async () => {
        try {
            const response = await axios.post(`${apiUrl}/auth/register`, {
                nombre: newUserData.nombre,
                password: newUserData.password,
                rol_id: newUserData.rol_id,
                estado: newUserData.estado
            });
            if (response.data.ok) {
                Swal.fire({
                    title: 'Usuario creado',
                    text: 'El nuevo usuario se ha creado correctamente',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
                fetchUsuarios();
                setNewUserData('');
                handleCloseModalPost();
            }
        } catch (error) {
            setNewUserData('');
            const errorMessage = error.response?.data?.message || "Hubo un error desconocido";
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            setOpenModalPost(false);
        }
    }

    const columns = [
        { field: 'id_usuario', headerName: 'Folio', flex: 1 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'password', headerName: 'Password', flex: 1 },
        { field: 'estado', headerName: 'Estado', flex: 1 },
        { field: 'rol_id', headerName: 'Rol ID', flex: 1 },
        { field: 'rol_descripcion', headerName: 'Rol', flex: 1 },
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
                <h1>Usuarios</h1>
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
                        label="Buscar usuario"
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
                        Agregar Usuario
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
                        getRowId={(row) => row.id_usuario}
                        experimentalFeatures={{ newEditingApi: true }}
                        columnVisibilityModel={{
                            id_usuario: false,
                            password: false,
                            estado: false,
                            rol_id: false,
                        }}
                    />
                </ThemeProvider>
            </div>
            {/* Modal para editar usuario */}
            < Dialog open={openModal} onClose={handleCloseModal} >
                <DialogTitle>Editar Usuario</DialogTitle>
                <DialogContent>
                    <TextField
                        label={'Nombre'}
                        fullWidth
                        margin="normal"
                        type='text'
                        value={userData.nombre}
                        onChange={(e) => setUserData({ ...userData, nombre: e.target.value })}
                    />
                    <TextField
                        label={'Password'}
                        fullWidth
                        margin="normal"
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>{'Rol'}</InputLabel>
                        <Select
                            value={userData.rol_id || ''}
                            onChange={(e) => {
                                const selectedRol = e.target.value;
                                const descripcion = getRolDescripcion(selectedRol);
                                setUserData({
                                    ...userData,
                                    rol_id: parseInt(selectedRol, 10),  // Convertir el rol seleccionado a número
                                    rol_descripcion: descripcion,
                                });
                            }}
                        >
                            <MenuItem value="">
                                <em>Seleccionar rol</em>
                            </MenuItem>
                            {roles.length > 0 ? (
                                roles.map(role => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {role.descripcion}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>No hay roles disponibles</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>{'Estatus'}</InputLabel>
                        <Select
                            value={userData.estado !== undefined ? userData.estado : ''}
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
            {/* Modal para crear usuario */}
            < Dialog open={openModalPost} onClose={handleCloseModalPost} >
                <DialogTitle>Crear Usuario</DialogTitle>
                <DialogContent>
                    <TextField
                        label={'Nombre'}
                        fullWidth
                        margin="normal"
                        value={newUserData.nombre}
                        onChange={(e) => setNewUserData({ ...newUserData, nombre: e.target.value })}
                    />
                    <TextField
                        label={'Password'}
                        fullWidth
                        margin="normal"
                        type='password'
                        value={newUserData.password}
                        onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>{'Rol'}</InputLabel>
                        <Select
                            value={newUserData.rol_id || ''} // El valor de 'rol_id' debe coincidir con los valores de los roles
                            onChange={(e) => {
                                const selectedRol = e.target.value;
                                const descripcion = getRolDescripcion(selectedRol);
                                setNewUserData({
                                    ...newUserData,
                                    rol_id: selectedRol,
                                    rol_descripcion: descripcion, // Aquí puedes también almacenar la descripción si lo necesitas
                                });
                            }}
                        >
                            <MenuItem defaultValue="">
                                <em>Seleccionar rol</em>
                            </MenuItem>
                            {roles.length > 0 ? (
                                roles.map(role => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {role.descripcion}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem defaultValue="" disabled>No hay roles disponibles</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>{'Estatus'}</InputLabel>
                        <Select
                            value={newUserData.estado !== undefined ? newUserData.estado : ''}
                            onChange={(e) => setNewUserData({ ...newUserData, estado: e.target.value })}
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
                    <Button onClick={addUser} color="primary">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog >
        </div >
    )
}


export default TableUsuarios;
