import * as React from 'react';
import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';


const UsuariosActions = ({ openUsuariosActions, setOpenUsuariosActions, selectedUser, handleClose }) => {
    const [formData, setFormData] = useState({
        id_usuario: '',
        nombre: '',
        password: '',
        rol_id: '',
        permisos: '',
        estado: ''
    });

    useEffect(() => {
        if (selectedUser) {
            setFormData({
                id_usuario: selectedUser.id_usuario || '',
                nombre: selectedUser.nombre || '',
                password: selectedUser.password || '',
                rol_id: selectedUser.rol_id || '',
                permisos: selectedUser.permisos || '',
                estado: selectedUser.estado || ''
            });
        }
    }, [selectedUser]);

    useEffect(() => {
        if (openUsuariosActions && selectedUser) {
            setFormData({
                nombre: selectedUser.nombre || '',
                password: selectedUser.password || '',
                rol_id: selectedUser.rol_id || '',
                permisos: selectedUser.permisos || '',
                estado: selectedUser.estado || ''
            });
        }
    }, [openUsuariosActions, selectedUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        try {
            e.preventDefault();
            console.log("Datos enviados:", formData);
            const response = await axios.put(`http://localhost:3304/usuarios/${selectedUser.id_usuario}`, formData)
            setFormData(response);
            Swal.fire({
                title: 'Éxito!',
                text: 'Usuario actualizado correctamente!!!',
                icon: 'success'
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Hubo un error"
            });
        }
        handleClose();
    };

    return (
        <Dialog
            open={openUsuariosActions}
            onClose={handleClose}
        >
            <DialogTitle style={{ fontFamily: "Montserrat", fontWeight: "bold" }}>Detalles Usuario</DialogTitle>
            <DialogContent>
                <DialogContentText style={{ fontFamily: "Montserrat" }}>
                    Se muestran todos los datos del usuario
                </DialogContentText>
                <form onSubmit={handleSave}>
                    <TextField
                        required
                        margin="dense"
                        id="nombre"
                        name="nombre"
                        label="Nombre"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.nombre}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        id="password"
                        name="password"
                        label="Contraseña"
                        type="password"
                        fullWidth
                        variant="standard"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <FormControl fullWidth margin='dense' variant='standard'>
                        <InputLabel id="rol-label">Rol</InputLabel>
                        <Select
                            labelId="rol-label"
                            id="rol_id"
                            name="rol_id"
                            value={formData.rol_id}
                            onChange={handleChange}
                        >
                            <MenuItem value={1}>Administrador</MenuItem>
                            <MenuItem value={2}>Super Usuario</MenuItem>
                            <MenuItem value={3}>Jefe Planeacion</MenuItem>
                            <MenuItem value={4}>Jefe Almacen</MenuItem>
                            <MenuItem value={5}>Empleado Almacen</MenuItem>
                            <MenuItem value={6}>Jefe Marketing</MenuItem>
                            <MenuItem value={7}>Empleado Marketing</MenuItem>
                            <MenuItem value={8}>Jefe Produccion</MenuItem>
                            <MenuItem value={9}>Empleado Produccion</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        margin="dense"
                        id="permisos"
                        name="permisos"
                        label="Permisos"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.permisos}
                        onChange={handleChange}
                    />
                    <FormControl fullWidth margin='dense' variant='standard'>
                        <InputLabel id="estado-label">Estado</InputLabel>
                        <Select
                            labelId="estado-label"
                            id="estado"
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                        >
                            <MenuItem value="Activo">Activo</MenuItem>
                            <MenuItem value="Inactivo">Inactivo</MenuItem>
                        </Select>
                    </FormControl>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button type="submit" onClick={handleSave}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UsuariosActions;