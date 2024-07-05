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
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';


const DetalleLocalidades = ({ openDetalleOrden, setOpenDetalleOrden, handleClose, selectedOrden, fetchData }) => {

    const [formData, setFormData] = useState({
        id: "",
        fecha: "",
        tipo_transaccion_id: 0,
        localidad_salida_id: 0,
        localidad_entrada_id: 0,
        estatus: "",
    });

    useEffect(() => {
        if (selectedOrden) {
            setFormData({
                id: selectedOrden.id || '',
                fecha: selectedOrden.fecha || '',
                tipo_transaccion_id: selectedOrden.tipo_transaccion_id || '',
                localidad_salida_id: selectedOrden.localidad_salida_id || '',
                localidad_entrada_id: selectedOrden.localidad_entrada_id || '',
                estatus: selectedOrden.estatus || ''
            });
        }
    }, [selectedOrden]);

    useEffect(() => {
        if (openDetalleOrden && selectedOrden) {
            setFormData({
                fecha: selectedOrden.fecha || '',
                tipo_transaccion_id: selectedOrden.tipo_transaccion_id || '',
                localidad_salida_id: selectedOrden.localidad_salida_id || '',
                localidad_entrada_id: selectedOrden.localidad_entrada_id || '',
                estatus: selectedOrden.estatus || ''
            });
        }
    }, [openDetalleOrden, selectedOrden]);

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
            const response = await axios.put(`http://localhost:3304/inventario/ordenBodegas/${selectedOrden.id}`, formData)
            setFormData(response);
            Swal.fire({
                title: 'Éxito!',
                text: 'Orden actualizada correctamente!!!',
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
            open={openDetalleOrden}
            onClose={handleClose}
        >
            <DialogTitle>Detalles de Orden</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Se muestran todos los datos de la orden seleccionada
                </DialogContentText>
                <form onSubmit={handleSave}>
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="fecha"
                        name="fecha"
                        label="Fecha"
                        type="date"
                        fullWidth
                        variant="standard"
                        value={formData.fecha}
                        onChange={handleChange}
                    />
                    <TextField
                        required
                        margin="dense"
                        id="tipo_transaccion_id"
                        name="tipo_transaccion_id"
                        label="Tipo de transacción"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.tipo_transaccion_id}
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
                    <TextField
                        required
                        margin="dense"
                        id="localidad_salida_id"
                        name="localidad_salida_id"
                        label="Localidad de salida"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.localidad_salida_id}
                        onChange={handleChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='Buscar localidad de salida'
                                        onClick={handleButtonClick}
                                    >
                                        <Button>Buscar</Button>
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        required
                        margin="dense"
                        id="localidad_entrada_id"
                        name="localidad_entrada_id"
                        label="Localidad de entrada"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.localidad_entrada_id}
                        onChange={handleChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='Buscar localidad de entrada'
                                        onClick={handleButtonClick}
                                    >
                                        <Button>Buscar</Button>
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <FormControl fullWidth margin='dense' variant='standard'>
                        <InputLabel id="estatus-label">Estado</InputLabel>
                        <Select
                            labelId="estatus-label"
                            id="estatus"
                            name="estatus"
                            value={formData.estatus}
                            onChange={handleChange}
                        >
                            <MenuItem value="Activo">Activo</MenuItem>
                            <MenuItem value="Inactivo">Inactivo</MenuItem>
                        </Select>
                    </FormControl>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cerrar</Button>
                <Button type="submit" onClick={handleSave}>Guardar</Button>
            </DialogActions>
        </Dialog>
    )
}

export default DetalleLocalidades;