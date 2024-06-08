import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';


export default function UsuariosActions(props) {

    const { openUsuariosActions, setOpenUsuariosActions } = props;

    const handleClose = () => {
        setOpenUsuariosActions(false);
    };


    return (
        <Dialog
      open={openUsuariosActions}
      onClose={handleClose}
      >
        <DialogTitle>Detalles Usuario</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se muestran todos los datos del usuario
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
          <Button onClick={() => setOpenUsuariosActions(false)}>Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </DialogActions>
      </Dialog>
    );
}