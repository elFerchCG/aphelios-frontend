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
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useState, useEffect } from 'react';

const ModalRegistroL = ({ openModalRegistroL, setOpenModalRegistroL, fetchData }) => {
    const [bodegas, setBodegas] = useState([]);
    const [selectedBodega, setSelectedBodega] = useState('');

    const [data, setData] = useState({
        descripcion: "",
        responsable: "",
        disponible: "", // Valor por defecto para "Disponible"
        bodega_id: 0,
    });


    useEffect(() => {
        const fetchBodegas = async () => {
            try {
                const response = await axios.get('http://localhost:3304/inventario/bodegas_y_localidades/nombres/bodegas');
                setBodegas(response.data);
            } catch (error) {
                console.error('Error fetching bodegas:', error);
            }
        };

        fetchBodegas();
    }, []);

    const handleSelectChange = (e) => {
        const selectedId = e.target.value;
        setData({
            ...data,
            bodega_id: selectedId
        });
    };

    const handleClose = () => {
        setOpenModalRegistroL(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData({
            ...data,
            [name]: value
        });
    };

    const handleReset = () => {
        setData({
            descripcion: "",
            responsable: "",
            disponible: "",
            bodega_id: 0,
        });
        setSelectedBodega('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:3304/inventario/localidades", data);
            console.log("Submit response:", response.data);
            Swal.fire({
                title: 'Éxito!',
                text: 'Se registró con éxito la ubicación!!!',
                icon: 'success'
            });
            fetchData();
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Hubo un error al registrar la ubicación"
            });
        } finally {
            handleClose();
        }
    };

    return (
        <Dialog open={openModalRegistroL} onClose={handleClose}>
            <DialogTitle>Registrar ubicación</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Llena todos los campos requeridos para agregar una nueva ubicación a la base de datos
                </DialogContentText>
                <form onSubmit={handleSubmit}>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="descripcion"
                        name="descripcion"
                        label="Nombre"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={data.descripcion}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        id="responsable"
                        name="responsable"
                        label="Responsable"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={data.responsable}
                        onChange={handleChange}
                    />
                    <FormControl fullWidth margin='dense' variant='standard'>
                        <InputLabel >Disponible para retiro</InputLabel>
                        <Select
                            id="disponible"
                            name="disponible"
                            value={data.disponible}
                            onChange={handleChange}
                        >
                            <MenuItem value={1}>Disponible</MenuItem>
                            <MenuItem value={0}>No disponible</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin='dense' variant='standard'>
                        <InputLabel htmlFor="bodegaSelect">Bodega:</InputLabel>
                        <Select
                            id="bodegaSelect"
                            name='bodega_id'
                            value={data.bodega_id}
                            onChange={handleSelectChange}
                        >
                            <MenuItem value={0}>Seleccione...</MenuItem>
                            {bodegas.map((bodega) => (
                                <MenuItem key={bodega.id} value={bodega.id}>
                                    {bodega.Nombre}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <DialogActions>
                        <Button onClick={handleReset}>Borrar</Button>
                        <Button onClick={handleClose}>Cancelar</Button>
                        <Button type='submit' onClick={handleSubmit}>Guardar</Button>
                    </DialogActions>
                </form>
            </DialogContent>

        </Dialog>
    );
};

export default ModalRegistroL;
