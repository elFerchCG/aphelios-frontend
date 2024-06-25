import * as React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Swal from 'sweetalert2';

const ProveedoresActions = ({ openProveedoresActions, selectedProveedor, handleClose, fetchData }) => {
  const [formData, setFormData] = useState({
    id_proveedor: '',
    razon_social: '',
    rfc: '',
    correo: '',
    estado: '',
    sku_proveedor: ''
  });

  useEffect(() => {
    if (selectedProveedor) {
      setFormData({
        id_proveedor: selectedProveedor.id_proveedor || '',
        razon_social: selectedProveedor.razon_social || '',
        rfc: selectedProveedor.rfc || '',
        correo: selectedProveedor.correo || '',
        estado: selectedProveedor.estado || '',
        sku_proveedor: selectedProveedor.sku_proveedor || ''
      });
    }
  }, [selectedProveedor]);

  useEffect(() => {
    if (openProveedoresActions && selectedProveedor) {
      setFormData({
        id_proveedor: selectedProveedor.id_proveedor || '',
        razon_social: selectedProveedor.razon_social || '',
        rfc: selectedProveedor.rfc || '',
        correo: selectedProveedor.correo || '',
        estado: selectedProveedor.estado || '',
        sku_proveedor: selectedProveedor.sku_proveedor || ''
      });
    }
  }, [openProveedoresActions, selectedProveedor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    try {
      e.preventDefault();
      console.log("Datos enviados:", formData);
      const response = await axios.put('http://localhost:3304/proveedores/', {
        id_proveedor: formData.id_proveedor,
        razon_social: formData.razon_social,
        rfc: formData.rfc,
        correo: formData.correo,
        estado: formData.estado,
        sku_proveedor: formData.sku_proveedor
      })
      setFormData(response);
      Swal.fire({
        title: 'Éxito!',
        text: 'Proveedor actualizado correctamente!!!',
        icon: 'success'
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Hubo un error"
      });
    }
    fetchData();
    handleClose();
  };

  return (
    <Dialog
      open={openProveedoresActions}
      onClose={handleClose}
    >
      <DialogTitle>Detalles del proveedor</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Se muestran todos los datos del proveedor
        </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            name="razon_social"
            label="Razón social"
            type="text"
            fullWidth
            variant="standard"
            value={formData.razon_social}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="rfc"
            label="RFC"
            type="text"
            fullWidth
            variant="standard"
            value={formData.rfc}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="correo"
            label="Correo electronico"
            type="text"
            fullWidth
            variant="standard"
            value={formData.correo}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="estado"
            label="Estado"
            type="text"
            fullWidth
            variant="standard"
            value={formData.estado}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="sku_proveedor"
            label="SKU"
            type="text"
            fullWidth
            variant="standard"
            value={formData.sku_proveedor}
            onChange={handleChange}
          />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProveedoresActions;