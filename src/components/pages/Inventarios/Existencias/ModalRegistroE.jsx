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


const ModalRegistroE = ({ openModalRegistroE, setOpenModalRegistroE }) => {


    const estadoInicial = {
        producto_id: '',
        localidad_id: '',
        cantidad: '',
        inventario_inicial: '',
        inventario_final: '',
        transaccion_id: ''
    };

    const [data, setData] = React.useState(estadoInicial);

    const handleClose = () => {
        setOpenModalRegistroE(false);
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
            const response = await axios.post("http://localhost:3304/inventario/existencias", {
                producto_id: data.producto_id,
                localidad_id: data.localidad_id,
                cantidad: data.cantidad,
                inventario_inicial: data.inventario_inicial,
                inventario_final: data.inventario_final,
                transaccion_id: data.transaccion_id
            });
            setData(response);
            //Mostrar alerta exito
            Swal.fire({
                title: 'Éxito!',
                text: 'Se registro con exito el producto!!!',
                icon: 'success'
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Hubo un error al registrar el producto"
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
            open={openModalRegistroE}
            onClose={handleClose}
        >
            <DialogTitle>Registrar productos</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Llena todos los campos requeridos para agregar un nuevo producto a la base de datos
                </DialogContentText>
                <form onSubmit={handleSubmit}>
                    <TextField
                        margin="dense"
                        id="producto_id"
                        name="producto_id"
                        label="MLM"
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
                        id="localidad_id"
                        name="localidad_id"
                        label="Localidad"
                        type="text"
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
                        id="inventario_inicial"
                        name="inventario_inicial"
                        label="Inventario inicial"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={data.inventario_inicial}
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
                        value={data.inventario_final}
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
                        value={data.transaccion_id}
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
                <Button onClick={handleReset}>Borrar</Button>
                <Button onClick={() => setOpenModalRegistroE(false)}>Cancelar</Button>
                <Button type='submit' onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalRegistroE;