import { useState, useEffect } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Dialog, DialogContent, DialogContentText, DialogTitle } from '@mui/material';


const DetalleLocalidades = ({ openDetalleOrden, setOpenDetalleOrden, handleClose, selectedOrden }) => {

    const [formData, setFormData] = useState([]);

    useEffect(() => {
        const fetchOrdenes = async () => {
            try {
                const response = await axios.get(`http://localhost:3304/inventario/ordenBodegas_y_lineasBodegas`);
                setFormData(response.data);
                console.log("datos", response.data.orden.lineas)
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchOrdenes();
    }, []);

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'fecha', headerName: 'Fecha', width: 150, },
        { field: 'tipo_transaccion_id', headerName: 'Tipo Transacción ID', width: 150 },
        { field: 'localidad_salida_id', headerName: 'Localidad Salida ID', width: 150 },
        { field: 'localidad_entrada_id', headerName: 'Localidad Entrada ID', width: 150 },
        { field: 'estatus', headerName: 'Estatus', width: 150 },
        { field: 'producto_id', headerName: 'Producto ID', width: 150 },
        { field: 'cantidad', headerName: 'Cantidad', width: 150 },
        { field: 'confirmacion_salida', headerName: 'Confirmación Salida', width: 150 },
        { field: 'confirmacion_entrada', headerName: 'Confirmación Entrada', width: 150 }
    ];

    const rows = formData.flatMap((orden) => orden.lineas.map((linea) =>  ({
        id: orden.orden_id,
        fecha: orden.fecha,
        tipo_transaccion_id: orden.tipo_transaccion_id,
        localidad_salida_id: orden.localidad_salida_id,
        localidad_entrada_id: orden.localidad_entrada_id,
        estatus: orden.estatus,
        producto_id: linea.producto_id,
        cantidad: linea.cantidad,
        confirmacion_salida: linea.confirmacion_salida ? 'Sí' : 'No',
        confirmacion_entrada: linea.confirmacion_entrada ? 'Sí' : 'No'
    })));


    return (
        <Dialog
            open={openDetalleOrden}
            onClose={handleClose}
        >
            <DialogTitle> Detalles de las ordenes y sus lineas</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Se muestran todos los detalles de la orden
                </DialogContentText>
                <div className='contenido'>
                    <div id='contenidoUsuarios' style={{ height: 500, width: '70%' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            getRowId={(row) => row.id}
                            pageSize={10}
                            rowsPerPageOptions={[10, 20, 50]}
                            checkboxSelection
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>

    );
}

export default DetalleLocalidades;