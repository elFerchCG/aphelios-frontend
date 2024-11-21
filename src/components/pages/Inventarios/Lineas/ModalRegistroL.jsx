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
import { IconButton, InputAdornment } from '@mui/material';
import apiUrl from '../../../../config';


const ModalRegistroL = ({ openModalRegistroL, setOpenModalRegistroL }) => {


    const estadoInicial = {
        orden_id: '',
        producto_id: '',
        cantidad: '',
        confirmacion_salida: '',
        confirmacion_entrada: ''
    };

    const [data, setData] = React.useState(estadoInicial);

    const handleClose = () => {
        setOpenModalRegistroL(false);
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
            const response = await axios.post(`${apiUrl}/inventario/lineasOrden`, {
                orden_id: data.orden_id,
                producto_id: data.producto_id,
                cantidad: data.cantidad,
                confirmacion_salida: data.confirmacion_salida,
                confirmacion_entrada: data.confirmacion_entrada
            });
            setData(response);
            //Mostrar alerta exito
            Swal.fire({
                title: 'Éxito!',
                text: 'Se registro con exito la linea!!!',
                icon: 'success'
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Hubo un error al registrar la linea"
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
            open={openModalRegistroL}
            onClose={handleClose}
        >
            <DialogTitle>Registrar Linea</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Llena todos los campos requeridos para agregar una nueva linea a la base de datos
                </DialogContentText>
                <form onSubmit={handleSubmit}>
                    <TextField
                        margin="dense"
                        id="orden_id"
                        name="orden_id"
                        label="Orden"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={data.orden_id}
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
                        margin="dense"
                        id="confirmacion_salida"
                        name="confirmacion_salida"
                        label="Confirmacion salida"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={data.confirmacion_salida}
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
                        value={data.confirmacion_entrada}
                        onChange={handleChange}
                    />
                </form>
            </DialogContent>
            <DialogActions>
            <Button onClick={handleReset}>Borrar</Button>
                <Button onClick={() => setOpenModalRegistroL(false)}>Cancelar</Button>
                <Button type='submit' onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalRegistroL;