import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select } from '@mui/material';


const ModalRegistroTI = ({ openModalRegistroT, setOpenModalRegistroT }) => {

    const estadoInicial = {
        linea_orden_id: 0,
        tipo: "",
        producto_id: "",
        localidad_id: 0,
        cantidad: 0,
        inventario_inicial: 0,
        inventario_final: 0,
        fecha_transaccion: "",
        costo_unitario: 0
    };

    const [data, setData] = React.useState(estadoInicial);

    const handleClose = () => {
        setOpenModalRegistroT(false);
    };


    const handleChange = (e) => {
        const value = e.target.value;
        setData({
            ...data,
            [e.target.name]: value
        });
    };


    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            console.log(data);
            const response = await axios.post("http://localhost:3304/inventario/transacciones", {
                linea_orden_id: data.linea_orden_id,
                tipo: data.tipo,
                producto_id: data.producto_id,
                localidad_id: data.localidad_id,
                cantidad: data.cantidad,
                inventario_inicial: data.inventario_inicial,
                inventario_final: data.inventario_final,
                fecha_transaccion: data.fecha_transaccion,
                costo_unitario: data.costo_unitario
            });
            setData(response);
            //Mostrar alerta exito
            Swal.fire({
                title: 'Éxito!',
                text: 'Se registro con exito la transacción!!!',
                icon: 'success'
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Hubo un error al registrar la transacción"
            });
        }
        handleClose();
    };

    const handleReset = () => {
        setData(estadoInicial);
    };


    const handleButtonClick = () => {

        console.log("Botón clickeado!");
    };


    return (
        <Dialog
            open={openModalRegistroT}
            onClose={handleClose}
        >
            <DialogTitle>Registrar Transacción de inventario</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Llena todos los campos requeridos para agregar una nueva transacción de inventario a la base de datos
                </DialogContentText>
                <form onSubmit={handleSubmit}>
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
                        value={data.linea_orden_id}
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
                        value={data.tipo}
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
                        value={data.producto_id}
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
                        value={data.localidad_id}
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
                        value={data.cantidad}
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
                        value={data.inventario_inicial}
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
                        value={data.inventario_final}
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
                        value={data.fecha_transaccion}
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
                        value={data.costo_unitario}
                        onChange={handleChange}
                    />
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleReset}>Borrar</Button>
                <Button onClick={() => setOpenModalRegistroT(false)}>Cancelar</Button>
                <Button type='submit' onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalRegistroTI;