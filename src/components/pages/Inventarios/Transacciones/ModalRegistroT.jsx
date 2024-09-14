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


const ModalRegistroT = ({ openModalRegistroT, setOpenModalRegistroT, fetchData }) => {

  const estadoInicial = {
    descripcion: "",
    categoria: "",
    rol_id: ""
  };

  const [data, setData] = React.useState(estadoInicial);

  const handleReset = () => {
    setData(estadoInicial);
  };

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
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3304/inventario/tipoTransaccion", {
        descripcion: data.descripcion,
        categoria: data.categoria,
        rol_id: data.rol_id
      });
      setData(response);
      Swal.fire({
        title: 'Éxito!',
        text: 'Se registro con exito la transacción!!!',
        icon: 'success'
      });
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Hubo un error al registrar la transacción"
      });
    } finally {
      handleClose();
    }
  };


  return (
    <Dialog
      open={openModalRegistroT}
      onClose={handleClose}
    >
      <DialogTitle>Registrar Transaccion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Llena todos los campos requeridos para agregar una nueva transaccion a la base de datos
        </DialogContentText>
        <form onSubmit={handleSubmit}>
          <TextField
            autoFocus
            required
            margin="dense"
            id="descripcion"
            name="descripcion"
            label="Descripcion"
            type="text"
            fullWidth
            variant="standard"
            value={data.descripcion}
            onChange={handleChange}
          />
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="categoria-label">Categoria</InputLabel>
            <Select
              labelId="categoria-label"
              id="categoria"
              name="categoria"
              value={data.categoria}
              onChange={handleChange}
            >
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="salida">Salida</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
              <MenuItem value="conteo ciclico">Conteo ciclico</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="rol-label">Rol</InputLabel>
            <Select
              labelId="rol-label"
              id="rol_id"
              name="rol_id"
              value={data.rol_id}
              onChange={handleChange}
            >
              <MenuItem value={1}>Administrador</MenuItem>
              <MenuItem value={2}>Super Usuario</MenuItem>
              <MenuItem value={3}>Planeador</MenuItem>
              <MenuItem value={4}>Almacenista</MenuItem>
              <MenuItem value={5}>Marketing</MenuItem>
              <MenuItem value={6}>Producción</MenuItem>
            </Select>
          </FormControl>
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

export default ModalRegistroT;