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


const ModalRegistroU = ({ openModalRegistroU, setOpenModalRegistroU }) => {


  const estadoInicial = {
    nombre: "",
    password: "",
    rol_id: "",
    permisos: "",
    estado: ""
  };

  const [data, setData] = React.useState(estadoInicial);

  const handleClose = () => {
    setOpenModalRegistroU(false);
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
      const response = await axios.post("http://localhost:3304/auth/register", {
        nombre: data.nombre,
        password: data.password,
        permisos: data.permisos,
        estado: data.estado,
        rol_id: data.rol_id,
      });
      setData(response);
      //Mostrar alerta exito
      Swal.fire({
        title: 'Éxito!',
        text: 'Se registro con existo el usuario!!!',
        icon: 'success'
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Hubo un error al registrar el usuario"
      });
    }
    handleClose();
  };

  const handleReset = () => {
    setData(estadoInicial);
  };

  return (
    <Dialog
      open={openModalRegistroU}
      onClose={handleClose}
    >
      <DialogTitle>Registrar Usuario</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Llena todos los campos requeridos para agregar un nuevo usuario a la base de datos
        </DialogContentText>
        <form onSubmit={handleSubmit}>
          <TextField
            autoFocus
            required
            margin="dense"
            id="nombre"
            name="nombre"
            label="Nombre"
            type="text"
            fullWidth
            variant="standard"
            value={data.nombre}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            id="password"
            name="password"
            label="Contraseña"
            type="password"
            fullWidth
            variant="standard"
            value={data.password}
            onChange={handleChange}
          />
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="rol-label">Rol</InputLabel>
            <Select
              labelId="rol-label"
              id="rol_id"
              name="rol_id"
              type='number'
              value={data.rol_id}
              onChange={handleChange}
            >
              <MenuItem value={1}>Administrador</MenuItem>
              <MenuItem value={2}>Super Usuario</MenuItem>
              <MenuItem value={3}>Jefe Planeacion</MenuItem>
              <MenuItem value={4}>Jefe Almacen</MenuItem>
              <MenuItem value={5}>Empleado Almacen</MenuItem>
              <MenuItem value={6}>Jefe Marketing</MenuItem>
              <MenuItem value={7}>Empleado Marketing</MenuItem>
              <MenuItem value={8}>Jefe Produccion</MenuItem>
              <MenuItem value={9}>Empleado Produccion</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            id="permisos"
            name="permisos"
            label="Permisos"
            type="text"
            fullWidth
            variant="standard"
            value={data.permisos}
            onChange={handleChange}
          />
          <FormControl fullWidth margin='dense' variant='standard'>
            <InputLabel id="estado-label">Estado</InputLabel>
            <Select
              labelId="estado-label"
              id="estado"
              name="estado"
              value={data.estado}
              onChange={handleChange}
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Inactivo">Inactivo</MenuItem>
            </Select>
          </FormControl>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>Borrar</Button>
        <Button onClick={() => setOpenModalRegistroU(false)}>Cancelar</Button>
        <Button type='submit' onClick={handleSubmit}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRegistroU;