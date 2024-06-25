import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from 'axios';


const DetalleVentas = ({ openDetalleVentas, setOpenDetalleVentas, handleClose, selectedVentas, }) => {


    const [formData, setFormData] = useState({
        sale_id: '',
        title: '',
        seller_sku: '',
        quantity: '',
        unit_price: '',
        full_unit_price: ''
    });

    const getDetalle = async (sale_id) => {
        const url = `http://localhost:3304/detalleVentas/${sale_id}`;
        console.log(`Fetching details from: ${url}`);

        try {
            const response = await axios.get(url);
            const data = response.data;
            console.log('Data received:', data); // Log datos recibidos

            if (data && data.length > 0) {
                const ventaDetalle = data[0];
                setFormData({
                    sale_id: ventaDetalle.sale_id || '',
                    title: ventaDetalle.title || '',
                    seller_sku: ventaDetalle.seller_sku || '',
                    quantity: ventaDetalle.quantity || '',
                    unit_price: ventaDetalle.unit_price || '',
                    full_unit_price: ventaDetalle.full_unit_price || ''
                });
            } else {
                console.warn('No data received');
            }
        } catch (error) {
            console.error('Error fetching sale details:', error);
        }
    };

    useEffect(() => {
        if (selectedVentas && openDetalleVentas) {
            console.log(selectedVentas);
            if (selectedVentas.id) {
                getDetalle(selectedVentas.id);
            } else {
                console.warn('Selected sale ID is empty'); // Advertencia si el ID está vacío
            }
        }
    }, [selectedVentas, openDetalleVentas]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));

    };


    return (
        <Dialog
            open={openDetalleVentas}
            onClose={handleClose}
        >
            <DialogTitle>Detalles Ventas</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Se muestran todos los datos de la venta seleccionada
                </DialogContentText>
                <TextField
                    required
                    margin="dense"
                    id="sale_id"
                    name="sale_id"
                    label="ID"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={formData.sale_id}
                    onChange={handleChange}
                />
                <TextField
                    margin="dense"
                    id="title"
                    name="title"
                    label="Titulo"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={formData.title}
                    onChange={handleChange}
                />
                <TextField
                    margin="dense"
                    id="seller_sku"
                    name="seller_sku"
                    label="SKU"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={formData.seller_sku}
                    onChange={handleChange}
                />
                <TextField
                    margin="dense"
                    id="quantity"
                    name="quantity"
                    label="Cantidad"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={formData.quantity}
                    onChange={handleChange}
                />
                <TextField
                    margin="dense"
                    id="unit_price"
                    name="unit_price"
                    label="Precio unidad"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={formData.unit_price}
                    onChange={handleChange}
                />
                <TextField
                    margin="dense"
                    id="full_unit_price"
                    name="full_unit_price"
                    label="Precio final"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={formData.full_unit_price}
                    onChange={handleChange}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}

export default DetalleVentas