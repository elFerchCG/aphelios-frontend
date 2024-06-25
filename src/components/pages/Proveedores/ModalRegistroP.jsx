import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useState, useEffect } from 'react';

const ModalRegistroP = ({ openModalRegistroP, setOpenModalRegistroP, fetchData }) => {

  const [data, setData] = React.useState({
    razon_social: "",
    rfc: "",
    correo: "",
    estado: "",
    sku_proveedor: ""
  });

  const handleClose = () => {
    setOpenModalRegistroP(false);
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
      const response = await axios.post("http://localhost:3304/proveedores", {
        razon_social: data.razon_social,
        rfc: data.rfc,
        correo: data.correo,
        estado: data.estado,
        sku_proveedor: data.sku_proveedor
      });
      setData(response);
      //Mostrar alerta exito
      Swal.fire({
        title: 'Éxito!',
        text: 'Se registro con existo el proveedor!!!',
        icon: 'success'
      });
      //fetchData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Hubo un error al registrar el proveedor"
      });
    }
    fetchData();
    handleClose();
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
        <form onSubmit={handleSubmit}>
          <TextField
            autoFocus
            required
            margin="dense"
            id="razon_social"
            name="razon_social"
            label="Razón social"
            type="text"
            fullWidth
            variant="standard"
            value={data.razon_social}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            id="rfc"
            name="rfc"
            label="RFC"
            type="text"
            fullWidth
            variant="standard"
            value={data.rfc}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            id="correo"
            name="correo"
            label="Correo electronico"
            type="text"
            fullWidth
            variant="standard"
            value={data.correo}
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
          <TextField
            margin="dense"
            id="sku_proveedor"
            name="sku_proveedor"
            label="SKU"
            type="text"
            fullWidth
            variant="standard"
            value={data.sku_proveedor}
            onChange={handleChange}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenModalRegistroP(false)}>Cancelar</Button>
        <Button type="submit" onClick={handleSubmit}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRegistroP;