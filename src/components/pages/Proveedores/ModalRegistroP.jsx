import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function ModalRegistroP(props) {
  const {openModalRegistroP, setOpenModalRegistroP} = props;
  const handleClose = () => {
    setOpenModalRegistroP(false);
  };

  return (
      <Dialog
      open={openModalRegistroP}
      onClose={handleClose}
      >
        <DialogTitle>Registrar Proveedor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Llena todos los campos requeridos para agregar un nuevo proveedor a la base de datos
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="razon_social"
            name="razon social"
            label="Razón social"
            type="text"
            fullWidth
            variant="standard"
          />
          <TextField
            margin="dense"
            id="rfc"
            name="rfc"
            label="RFC"
            type="text"
            fullWidth
            variant="standard"
          />
          <TextField
            margin="dense"
            id="email"
            name="email"
            label="Correo electronico"
            type="text"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModalRegistroP(false)}>Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </DialogActions>
      </Dialog>
  );
}