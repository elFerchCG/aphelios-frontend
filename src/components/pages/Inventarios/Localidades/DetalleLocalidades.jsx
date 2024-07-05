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
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { IconButton, InputAdornment } from '@mui/material';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';

const DetalleLocalidades = ({ openDetalleLocalidad, setOpenDetalleLocalidad, selectedLocalidad, fetchData }) => {
    const [bodegas, setBodegas] = useState([]);

    const [formData, setFormData] = useState({
        id: '',
        descripcion: '',
        responsable: '',
        disponible: '',
        bodega_id: 0
    });

    useEffect(() => {
        if (selectedLocalidad) {
            setFormData({
                id: selectedLocalidad.id || '',
                descripcion: selectedLocalidad.descripcion || '',
                responsable: selectedLocalidad.responsable || '',
                disponible: selectedLocalidad.disponible || '',
                bodega_id: selectedLocalidad.bodega_id || '',
            });
        }
    }, [selectedLocalidad]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleClose = () => {
        setOpenDetalleLocalidad(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            await axios.put(`http://localhost:3304/inventario/localidades/${selectedLocalidad.id}`, formData);
            Swal.fire({
                title: 'Éxito!',
                text: 'Ubicación actualizada correctamente!!!',
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

    const deleteLocalidad = (e) => {
        e.preventDefault();
        handleClose();
        Swal.fire({
            title: '¿Estás seguro de descativar la bodega?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://localhost:3304/inventario/localidades/${selectedLocalidad.id}`);
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Tu ubicación ha sido eliminada.',
                        icon: 'success'
                    });
                    fetchData();
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Hubo un error al eliminar la ubicación.'
                    });
                } finally {
                    handleClose();
                }
            }
        });
    };

    useEffect(() => {
        const fetchBodegas = async () => {
            try {
                const response = await axios.get('http://localhost:3304/inventario/bodegas_y_localidades/nombres/bodegas');
                setBodegas(response.data);  // Correctly set the bodegas data
            } catch (error) {
                console.error('Error fetching bodegas:', error);
            }
        };

        fetchBodegas();
    }, []);

    const handleSelectChange = (e) => {
        const selectedId = e.target.value;
        setFormData({
            ...formData,
            bodega_id: selectedId
        });
    };

    return (
        <Dialog
            open={openDetalleLocalidad}
            onClose={handleClose}
        >
            <DialogTitle>Detalles de la ubicación</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Se muestran todos los datos de la ubicación seleccionada
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
                    <FormControl fullWidth margin='dense' variant='standard'>
                        <InputLabel id="disponible-label"></InputLabel>
                        <Select
                            labelId="disponible-label"
                            id="disponible"
                            name="disponible"
                            value={formData.disponible}
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
                            value={formData.bodega_id}
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
                        <IconButton title='Deshabilitar' onClick={deleteLocalidad}>
                            Deshabilitar<DoNotDisturbOnIcon />
                        </IconButton>
                        <Button onClick={handleClose}>Cerrar</Button>
                        <Button type="submit" onClick={handleSave}>Guardar</Button>
                    </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DetalleLocalidades;
