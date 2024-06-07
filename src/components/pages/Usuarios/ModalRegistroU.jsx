import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function ModalRegistroU(props) {
  const {openModalRegistroU, setOpenModalRegistroU} = props;
  const handleClose = () => {
    setOpenModalRegistroU(false);
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
          />
          <TextField
            margin="dense"
            id="password"
            name="password"
            label="Contraseña"
            type="password"
            fullWidth
            variant="standard"
          />
          <TextField
            margin="dense"
            id="rol"
            name="rol"
            label="Rol"
            type="text"
            fullWidth
            variant="standard"
          />
          <TextField
            margin="dense"
            id="permissions"
            name="permissions"
            label="Permisos"
            type="text"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModalRegistroU(false)}>Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </DialogActions>
      </Dialog>
  );
}