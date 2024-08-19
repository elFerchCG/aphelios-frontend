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
import { FormControl, IconButton, InputLabel, MenuItem, Select } from '@mui/material';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';


const DetalleTransacciones = ({ openDetalleTransaccion, setOpenDetalleTransaccion, selectedTransaccion, fetchData }) => {

    const [formData, setFormData] = useState({
        id: '',
        descripcion: '',
        categoria: '',
        responsable: ''
    });

    useEffect(() => {
        if (selectedTransaccion) {
            setFormData({
                id: selectedTransaccion.id || '',
                descripcion: selectedTransaccion.descripcion || '',
                categoria: selectedTransaccion.categoria || '',
                responsable: selectedTransaccion.responsable || ''
            });
        }
    }, [selectedTransaccion]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleClose = () => {
        setOpenDetalleTransaccion(false);
    }

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            await axios.put(`http://localhost:3304/inventario/tipoTransaccion/${selectedTransaccion.id}`, formData)
            Swal.fire({
                title: 'Éxito!',
                text: 'Transaccion actualizada correctamente!!!',
                icon: 'success'
            });
            fetchData();
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Hubo un error"
            });
        } finally {
            handleClose();
        }
    };

    const deleteTransaccion = async (e) => {
        e.preventDefault();
        handleClose();
        Swal.fire({
            title: '¿Estás seguro de desactivar la transacción actual?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo'
        }).then(async (result) => {
            if (result.isConfirmed) {

                try {
                    await axios.delete(`http://localhost:3304/inventario/tipoTransaccion/${selectedTransaccion.id}`)

                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Tu transaccion ha sido eliminada.',
                        icon: 'success'
                    });
                    fetchData();
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Hubo un error al eliminar la transaccion.'
                    });
                    console.error('Error al eliminar la transaccion:', error);
                } finally {
                    handleClose();
                }
            }
        });
    };

    return (
        <Dialog
            open={openDetalleTransaccion}
            onClose={handleClose}
        >
            <DialogTitle>Detalles Transacción</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Se muestran todos los datos de la transacción seleccionada
                </DialogContentText>
                <form onSubmit={handleSave}>
                    <TextField
                        margin="dense"
                        id="descripcion"
                        name="descripcion"
                        label="Descripción"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.descripcion}
                        onChange={handleChange}
                    />
                    <FormControl fullWidth margin='dense' variant='standard'>
                        <InputLabel id="categoria-label">Categoria</InputLabel>
                        <Select
                            labelId="categoria-label"
                            id="categoria"
                            name="categoria"
                            label="Categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                        >
                            <MenuItem value="entrada">Entrada</MenuItem>
                            <MenuItem value="salida">Salida</MenuItem>
                            <MenuItem value="transferencia">Transferencia</MenuItem>
                            <MenuItem value="conteo ciclico">Conteo ciclico</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        margin="dense"
                        id="responsable"
                        name="responsable"
                        label="Responsable"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.responsable}
                        onChange={handleChange}
                    />
                </form>
            </DialogContent>
            <DialogActions>
                <IconButton title='Deshabilitar' onClick={deleteTransaccion}>
                    Deshabilitar<DoNotDisturbOnIcon />
                </IconButton>
                <Button onClick={handleClose}>Cerrar</Button>
                <Button type="submit" onClick={handleSave}>Guardar</Button>
            </DialogActions>
        </Dialog>
    )
}

export default DetalleTransacciones;