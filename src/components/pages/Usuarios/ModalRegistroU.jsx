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


const ModalRegistroU = ({ openModalRegistroU, setOpenModalRegistroU}) => {


  const [data, setData] = React.useState({
    nombre: "",
    password: "",
    rol: "",
    permisos: "",
    estado: ""
  });

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
      const response = await axios.post("http://localhost:3304/usuarios", {
        nombre: data.nombre,
        password: data.password,
        rol: data.rol,
        permisos: data.permisos,
        estado: data.estado
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
          <TextField
            margin="dense"
            id="rol"
            name="rol"
            label="Rol"
            type="text"
            fullWidth
            variant="standard"
            value={data.rol}
            onChange={handleChange}
          />
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
          <TextField
            margin="dense"
            id="estado"
            name="estado"
            label="Estado"
            type="text"
            fullWidth
            variant="standard"
            value={data.estado}
            onChange={handleChange}

          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenModalRegistroU(false)}>Cancelar</Button>
        <Button type='submit' onClick={handleSubmit}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRegistroU;