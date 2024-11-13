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


const ModalRegistroB = ({ openModalRegistroB, setOpenModalRegistroB, fetchData }) => {

  const estadoInicial = {
    nombre: "",
    tipo: "",
    neteable: null,
    rol_id: null
  };

  const [data, setData] = React.useState(estadoInicial);

  const handleReset = () => {
    setData(estadoInicial);
  };

  const handleClose = () => {
    setOpenModalRegistroB(false);
  };


  const handleChange = (e) => {
    const value = e.target.value;
    setData({
      ...data,
      [e.target.name]: value
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3304/inventario/bodegas", {
        nombre: data.nombre,
        tipo: data.tipo,
        neteable: data.neteable,
        rol_id: data.rol_id
      });
      setData(response);
      Swal.fire({
        title: 'Éxito!',
        text: 'Se registro con exito la bodega!!!',
        icon: 'success'
      });
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Hubo un error al registrar la bodega"
      });
    } finally {
      handleClose();
    }
  };


  return (
    <Dialog
      open={openModalRegistroB}
      onClose={handleClose}
    >
      <DialogTitle>Registrar Bodega</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Llena todos los campos requeridos para agregar una nueva bodega a la base de datos
        </DialogContentText>
        <form onSubmit={handleSubmit}>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            name="nombre"
            label="Nombre"
            type="text"
            fullWidth
            variant="standard"
            value={data.nombre ?? ""}
            onChange={handleChange}
          />
          <FormControl fullWidth margin='dense' required variant='standard'>
            <InputLabel id="tipo-label">Tipo</InputLabel>
            <Select
              labelId="tipo-label"
              id="tipo"
              name="tipo"
              label="Tipo"
              type='text'
              value={data.tipo ?? ""}
              onChange={handleChange}
            >
              <MenuItem value="Almacén">Almacén</MenuItem>
              <MenuItem value="Mercadolibre FULL">MercadoLibre FULL</MenuItem>
              <MenuItem value="Producción">Producción</MenuItem>
              <MenuItem value="Indirectos">Indirectos</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="disponible-label">Disponible para retiro</InputLabel>
            <Select
              labelId="disponible-label"
              id="neteable"
              name="neteable"
              label="Disponible para retiro"
              type="number"
              fullWidth
              variant="standard"
              value={data.neteable ?? ""}
              onChange={handleChange}
            >
              <MenuItem value={1}>Disponible</MenuItem>
              <MenuItem value={0}>No disponible</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="rol_id-label">Rol</InputLabel>
            <Select
              id="rol_id"
              name="rol_id"
              label="Rol"
              type="number"
              fullWidth
              variant="standard"
              value={data.rol_id ?? ""}
              onChange={handleChange}
            >
              <MenuItem value={1}>Administrador</MenuItem>
              <MenuItem value={3}>Planeador</MenuItem>
              <MenuItem value={4}>Almacenista</MenuItem>
              <MenuItem value={6}>Marketing</MenuItem>
              <MenuItem value={8}>Producción</MenuItem>
            </Select>
          </FormControl>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>Borrar</Button>
        <Button onClick={() => setOpenModalRegistroB(false)}>Cancelar</Button>
        <Button type='submit' onClick={handleSubmit}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRegistroB;