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

const DetalleBodegas = ({ openDetalleBodega, setOpenDetalleBodega, selectedBodega, fetchData }) => {

  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    tipo: '',
    neteable: '',
    responsable: ''
  });

  useEffect(() => {
    if (selectedBodega) {
      setFormData({
        id: selectedBodega.id || '',
        nombre: selectedBodega.Nombre || '',
        tipo: selectedBodega.Tipo || '',
        neteable: selectedBodega.Neteable || '',
        responsable: selectedBodega.Responsable || ''
      });
    }
  }, [selectedBodega]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleClose = () => {
    setOpenDetalleBodega(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`http://localhost:3304/inventario/bodegas/${selectedBodega.id}`, formData);
      Swal.fire({
        title: 'Éxito!',
        text: 'Bodega actualizada correctamente!!!',
        icon: 'success'
      });
      fetchData(); // Asegurarse de que fetchData se llama después de cerrar el diálogo
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Hubo un error'
      });
    } finally {
      handleClose();
    }
  };

  const deleteBodega = async (e) => {
    e.preventDefault();
    handleClose();
    Swal.fire({
      title: '¿Estás seguro de desactivar la bodega actual?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo'
    }).then(async (result) => {
      if (result.isConfirmed) {

        try {
          await axios.delete(`http://localhost:3304/inventario/bodegas/${selectedBodega.id}`);
          Swal.fire({
            title: '¡Eliminado!',
            text: 'Tu bodega ha sido desactivada.',
            icon: 'success'
          });
          fetchData();
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Hubo un error al desactivar la bodega.'
          });
        } finally {
          handleClose();
        }
      }
    });
  };

  return (
    <Dialog open={openDetalleBodega} onClose={handleClose}>
      <DialogTitle>Detalles Bodegas</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Se muestran todos los datos de la bodega seleccionada
        </DialogContentText>
        <form onSubmit={handleSave}>
          <TextField
            margin="dense"
            id="nombre"
            name="nombre"
            label="Descripción"
            type="text"
            fullWidth
            variant="standard"
            value={formData.nombre}
            onChange={handleChange}
          />
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="tipo-label">Tipo</InputLabel>
            <Select
              labelId="tipo-label"
              id="tipo"
              name="tipo"
              label="Tipo"
              value={formData.tipo}
              onChange={handleChange}
            >
              <MenuItem value="Almacén">Almacén</MenuItem>
              <MenuItem value="Mercadolibre FULL">MercadoLibre FULL</MenuItem>
              <MenuItem value="Producción">Producción</MenuItem>
              <MenuItem value="Indirectos">Indirectos</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="neteable-label">Disponible para retiro</InputLabel>
            <Select
              labelId="neteable-label"
              margin="dense"
              id="neteable"
              name="neteable"
              label="Disponible para retiro"
              type="text"
              fullWidth
              variant="standard"
              value={formData.neteable}
              onChange={handleChange}
            >
              <MenuItem value="Disponible">Disponible</MenuItem>
              <MenuItem value="No disponible">No disponible</MenuItem>
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
        <IconButton title='Deshabilitar' onClick={deleteBodega}>
          Deshabilitar<DoNotDisturbOnIcon />
        </IconButton>
        <Button onClick={handleClose}>Cerrar</Button>
        <Button onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetalleBodegas;
