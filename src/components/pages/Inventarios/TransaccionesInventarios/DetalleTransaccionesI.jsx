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


const DetalleTransacciones = ({ openDetalleTransaccion, setOpenDetalleTransaccion, handleClose, selectedTransaccion, fetchData }) => {

    const apiUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

    const [formData, setFormData] = useState({
        id: "",
        linea_orden_id: 0,
        tipo: "",
        producto_id: "",
        localidad_id: 0,
        cantidad: 0,
        inventario_inicial: 0,
        inventario_final: 0,
        fecha_transaccion: "",
        costo_unitario: 0
    });

    useEffect(() => {
        if (selectedTransaccion) {
            setFormData({
                id: selectedTransaccion.id || '',
                linea_orden_id: selectedTransaccion.linea_orden_id || '',
                tipo: selectedTransaccion.tipo || '',
                producto_id: selectedTransaccion.producto_id || '',
                localidad_id: selectedTransaccion.localidad_id || '',
                cantidad: selectedTransaccion.cantidad || '',
                inventario_inicial: selectedTransaccion.inventario_inicial || '',
                inventario_final: selectedTransaccion.inventario_final || '',
                fecha_transaccion: selectedTransaccion.fecha_transaccion || '',
                costo_unitario: selectedTransaccion.costo_unitario || ''
            });
        }
    }, [selectedTransaccion]);

    useEffect(() => {
        if (openDetalleTransaccion && selectedTransaccion) {
            setFormData({
                linea_orden_id: selectedTransaccion.linea_orden_id || '',
                tipo: selectedTransaccion.tipo || '',
                producto_id: selectedTransaccion.producto_id || '',
                localidad_id: selectedTransaccion.localidad_id || '',
                cantidad: selectedTransaccion.cantidad || '',
                inventario_inicial: selectedTransaccion.inventario_inicial || '',
                inventario_final: selectedTransaccion.inventario_final || '',
                fecha_transaccion: selectedTransaccion.fecha_transaccion || '',
                costo_unitario: selectedTransaccion.costo_unitario || ''
            });
        }
    }, [openDetalleTransaccion, selectedTransaccion]);

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
            const response = await axios.put(`${apiUrl}/inventario/transacciones/${selectedTransaccion.id}`, formData)
            setFormData(response);
            Swal.fire({
                title: 'Éxito!',
                text: 'Transacción actualizada correctamente!!!',
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
            open={openDetalleTransaccion}
            onClose={handleClose}
        >
            <DialogTitle>Detalles Transacciones</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Se muestran todos los datos de la transacción seleccionada
                </DialogContentText>
                <form onSubmit={handleSave}>
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="linea_orden_id"
                        name="linea_orden_id"
                        label="Linea de orden"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.linea_orden_id}
                        onChange={handleChange}
                    />
                    <TextField
                        required
                        margin="dense"
                        id="tipo"
                        name="tipo"
                        label="Tipo"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={formData.tipo}
                        onChange={handleChange}
                    />
                    <TextField
                        required
                        margin="dense"
                        id="producto_id"
                        name="producto_id"
                        label="Producto ID"
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
                        required
                        margin="dense"
                        id="localidad_id"
                        name="localidad_id"
                        label="Localidad ID"
                        type="number"
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
                        autoFocus
                        required
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
                        autoFocus
                        required
                        margin="dense"
                        id="inventario_inicial"
                        name="inventario_inicial"
                        label="Inventario Inicial"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.inventario_inicial}
                        onChange={handleChange}
                    />
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="inventario_final"
                        name="inventario_final"
                        label="Inventario Final"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.inventario_final}
                        onChange={handleChange}
                    />
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="fecha_transaccion"
                        name="fecha_transaccion"
                        type="date"
                        fullWidth
                        variant="standard"
                        value={formData.fecha_transaccion}
                        onChange={handleChange}
                    />
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="costo_unitario"
                        name="costo_unitario"
                        label="Costo Unitario"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={formData.costo_unitario}
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

export default DetalleTransacciones;