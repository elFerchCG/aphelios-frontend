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
  const [roles, setRoles] = useState([]);
  const [selectedRol, setSelectedRol] = useState('');

  const apiUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    tipo: '',
    neteable: null,
    rol_id: selectedRol
  });

  useEffect(() => {
    const obtenerRoles = async () => {
      try {
        const response = await axios.get(`${apiUrl}/inventario/bodegas/roles`);
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setRoles(response.data);
        } else {
          Swal.fire({
            title: '!Productos no encontrados!',
            text: 'No se encontraron productos',
            icon: 'error',
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true
          });
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          const { messageText } = error.response.data.message;
          Swal.fire({
            title: 'Error',
            text: `Error: ${messageText}`,
            icon: 'error',
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true
          });
        }
      }
    }
    obtenerRoles();
  }, [openDetalleBodega]);

  useEffect(() => {
    if (selectedBodega) {
      setFormData({
        id: selectedBodega.id || '',
        nombre: selectedBodega.Nombre || '',
        tipo: selectedBodega.Tipo || '',
        neteable: selectedBodega.Neteable || '',
        rol_id: selectedBodega.rol_id || ''
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
      await axios.put(`${apiUrl}/inventario/bodegas/${selectedBodega.id}`, formData);
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
          await axios.delete(`${apiUrl}/inventario/bodegas/${selectedBodega.id}`);
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

  const handleSelectedRol = (e) => {
    const rolId = parseInt(e.target.value, 10);
    setSelectedRol(rolId);

    const selectedRolId = roles.find(role => role.id === parseInt(selectedRolId));
    console.log("Este es el rol que se manda en el update", rolId);
  }

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
              type="number"
              fullWidth
              variant="standard"
              value={formData.neteable}
              onChange={handleChange}
            >
              <MenuItem value={1}>Disponible</MenuItem>
              <MenuItem value={0}>No disponible</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="rol_id-label">Rol</InputLabel>
            <Select
              labelId="rol_id-label"
              margin="dense"
              id="rol_id"
              name="rol_id"
              label="Rol"
              type="number"
              fullWidth
              variant="standard"
              value={selectedRol}
              onChange={handleSelectedRol}
            >
              <MenuItem value="">Seleccione...</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.descripcion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
