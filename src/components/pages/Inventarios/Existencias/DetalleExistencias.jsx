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


const DetalleExistencias = ({ openDetalleExistencia, setOpenDetalleExistencia, handleClose, selectedExistencia, fetchData }) => {

    const [formData, setFormData] = useState({
        id: '',
        producto_id: '',
        localidad_id: '',
        cantidad: '',
        inventario_inicial: '',
        inventario_final: '',
        transaccion_id: ''
    });

    useEffect(() => {
        if (selectedExistencia) {
            setFormData({
                id: selectedExistencia.id || '',
                producto_id: selectedExistencia.producto_id || '',
                localidad_id: selectedExistencia.localidad_id || '',
                cantidad: selectedExistencia.cantidad || '',
                inventario_inicial: selectedExistencia.inventario_inicial || '',
                inventario_final: selectedExistencia.inventario_final || '',
                transaccion_id: selectedExistencia.transaccion_id || ''
            });
        }
    }, [selectedExistencia]);

    useEffect(() => {
        if (openDetalleExistencia && selectedExistencia) {
            setFormData({
                producto_id: selectedExistencia.producto_id || '',
                localidad_id: selectedExistencia.localidad_id || '',
                cantidad: selectedExistencia.cantidad || '',
                inventario_inicial: selectedExistencia.inventario_inicial || '',
                inventario_final: selectedExistencia.inventario_final || '',
                transaccion_id: selectedExistencia.transaccion_id || ''
            });
        }
    }, [openDetalleExistencia, selectedExistencia]);

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
            const response = await axios.put(`${apiUrl}/inventario/existencias/${selectedExistencia.id}`, formData)
            setFormData(response);
            Swal.fire({
                title: 'Éxito!',
                text: 'Producto actualizado correctamente!!!',
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
            open={openDetalleExistencia}
            onClose={handleClose}
        >
            <DialogTitle>Detalles del producto</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Se muestran todos los datos del producto seleccionado
                </DialogContentText>
                <form onSubmit={handleSave}>
                    <TextField
                        margin="dense"
                        id="producto_id"
                        name="producto_id"
                        label="MLM"
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
                        id="localidad_id"
                        name="localidad_id"
                        label="Localidad"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.localidad_id}
                        onChange={handleChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='Buscar localidad'
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
                        id="inventario_inicial"
                        name="inventario_inicial"
                        label="Inventario inicial"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.inventario_inicial}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        id="inventario_final"
                        name="inventario_final"
                        label="Inventario final"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.inventario_final}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        id="transaccion_id"
                        name="transaccion_id"
                        label="Transacción"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.transaccion_id}
                        onChange={handleChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='Buscar transacción'
                                        onClick={handleButtonClick}
                                    >
                                        <Button>Buscar</Button>
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
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

export default DetalleExistencias;