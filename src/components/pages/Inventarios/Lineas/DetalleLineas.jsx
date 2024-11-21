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
import { IconButton, InputAdornment } from '@mui/material';
import apiUrl from '../../../../config';


const DetalleLineas = ({ openDetalleLinea, setOpenDetalleLinea, handleClose, selectedLinea, fetchData }) => {

    const [formData, setFormData] = useState({
        id: '',
        orden_id: '',
        producto_id: '',
        cantidad: '',
        confirmacion_salida: '',
        confirmacion_entrada: ''
    });

    useEffect(() => {
        if (selectedLinea) {
            setFormData({
                id: selectedLinea.id || '',
                orden_id: selectedLinea.orden_id || '',
                producto_id: selectedLinea.producto_id || '',
                cantidad: selectedLinea.cantidad || '',
                confirmacion_salida: selectedLinea.confirmacion_salida || '',
                confirmacion_entrada: selectedLinea.confirmacion_entrada || '',
            });
        }
    }, [selectedLinea]);

    useEffect(() => {
        if (openDetalleLinea && selectedLinea) {
            setFormData({
                orden_id: selectedLinea.orden_id || '',
                producto_id: selectedLinea.producto_id || '',
                cantidad: selectedLinea.cantidad || '',
                confirmacion_salida: selectedLinea.confirmacion_salida || '',
                confirmacion_entrada: selectedLinea.confirmacion_entrada || '',
            });
        }
    }, [openDetalleLinea, selectedLinea]);

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
            const response = await axios.put(`${apiUrl}/inventario/lineasOrden/${selectedLinea.id}`, formData)
            setFormData(response);
            Swal.fire({
                title: 'Éxito!',
                text: 'Traspaso actualizado correctamente!!!',
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

    const handleButtonClick = () => {

        console.log("Botón clickeado!");
      };

    return (
        <Dialog
            open={openDetalleLinea}
            onClose={handleClose}
        >
            <DialogTitle>Detalles traspaso</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Se muestran todos los datos del traspaso seleccionado
                </DialogContentText>
                <form onSubmit={handleSave}>
                    <TextField
                        margin="dense"
                        id="orden_id"
                        name="orden_id"
                        label="Orden"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.orden_id}
                        onChange={handleChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='Buscar orden'
                                        onClick={handleButtonClick}
                                    >
                                        <Button>Buscar</Button>
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        margin="dense"
                        id="producto_id"
                        name="producto_id"
                        label="Pruducto ID"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.producto_id}
                        onChange={handleChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='Buscar producto'
                                        onClick={handleButtonClick}
                                    >
                                        <Button>Buscar</Button>
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        margin="dense"
                        id="cantidad"
                        name="cantidad"
                        label="Cantidad"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.cantidad}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        id="confirmacion_salida"
                        name="confirmacion_salida"
                        label="Confirmacion salida"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.confirmacion_salida}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        id="confirmacion_entrada"
                        name="confirmacion_entrada"
                        label="Confirmacion entrada"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.confirmacion_entrada}
                        onChange={handleChange}
                    />
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cerrar</Button>
                <Button type="submit" onClick={handleSave}>Guardar</Button>
            </DialogActions>
        </Dialog>
    )
}

export default DetalleLineas;