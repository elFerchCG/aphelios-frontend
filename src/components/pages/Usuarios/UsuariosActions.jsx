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


const UsuariosActions = ({ openUsuariosActions, setOpenUsuariosActions, selectedUser, handleClose}) => {
    const [formData, setFormData] = useState({
        id_usuario: '',
        nombre: '',
        password: '',
        rol: '',
        permisos: '',
        estado: ''
    });

    useEffect(() => {
        if (selectedUser) {
            setFormData({
                id_usuario: selectedUser.id_usuario || '',
                nombre: selectedUser.nombre || '',
                password: selectedUser.password || '',
                rol: selectedUser.rol || '',
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
                rol: selectedUser.rol || '',
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
            <DialogTitle>Detalles Usuario</DialogTitle>
            <DialogContent>
                <DialogContentText>
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
                    <TextField
                        margin="dense"
                        id="rol"
                        name="rol"
                        label="Rol"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.rol}
                        onChange={handleChange}
                    />
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
                    <TextField
                        margin="dense"
                        id="estado"
                        name="estado"
                        label="Estado"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.estado}
                        onChange={handleChange}
                    />
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