import React from 'react'
import { DataGrid, GridActionsCellItem, GridDeleteIcon } from '@mui/x-data-grid';
import { Preview } from '@mui/icons-material';
import { useState } from 'react';
import DetalleTransaccionesI from '../TransaccionesInventarios/DetalleTransaccionesI';
import { getTransaccionesI } from '../../../actions/getUsers';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect } from 'react';


const DataGridTInventario = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const url = 'http://localhost:3304/inventario/transacciones';

    const [selectedTransaccion, setSelectedTransaccion] = useState(null);
    const [openDetalleTransaccion, setOpenDetalleTransaccion] = useState(false);


    const columns = [
        { field: 'id', headerName: 'ID', width: 50 },
        { field: 'linea_orden_id', headerName: 'Linea de orden', type: 'number', width: 250 },
        { field: 'tipo', headerName: 'Tipo de transacción', type: 'string', width: 200 },
        { field: 'producto_id', headerName: 'Producto ID', type: 'string', width: 200 },
        { field: 'localidad_id', headerName: 'Localidad ID', type: 'number', width: 200 },
        { field: 'cantidad', headerName: 'Cantidad', type: 'number', width: 200 },
        { field: 'inventario_inicial', headerName: 'Inventario Inicial', type: 'number', width: 200 },
        { field: 'inventario_final', headerName: 'Inventario Final', type: 'number', width: 200 },
        { field: 'fecha_transaccion', headerName: 'Fecha de transacción', type: 'Date', width: 200 },
        { field: 'costo_unitario', headerName: 'Costo unitario', type: 'number', width: 200 },
        { field: 'estatus', headerName: 'Estado', type: 'string', width: 200 },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', width: 150, getActions: (params) => [
                <GridActionsCellItem
                    icon={<Preview />}
                    label="Ver detalles"
                    onClick={() => handleOpen(params.row)}
                />,
                <GridActionsCellItem
                icon={<GridDeleteIcon />}
                label="Eliminar localidad"
                onClick={(e) => deleteTransaccion(params.row.id, e)}
            />,
            ],
        },
    ];

    const fetchData = async () => {
        setLoading(true);
        const result = await getTransaccionesI(url);
        setData(result.data);
        setError(result.error);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [refresh]);

    const handleOpen = (transaccion) => {
        setSelectedTransaccion(transaccion);
        setOpenDetalleTransaccion(true);
    };

    const handleClose = () => {
        setOpenDetalleTransaccion(false);
        setSelectedTransaccion(null);
    };

    const deleteTransaccion = (id, e) => {
        e.preventDefault();

        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`http://localhost:3304/inventario/transacciones/${id}`)
                    .then(response => {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'Tu transacción de bodega ha sido eliminada.',
                            icon: 'success' 
                        });
                        setRefresh(!refresh);
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Hubo un error al eliminar la transacción.'
                        });
                        console.error('Error al eliminar la transacción:', error);
                    });
            }
        });

    };

    return (
        <div className='contenido'  >
            <div id='contenidoUsuarios' style={{ height: 500, width: '70%' }}>
                <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={data}
                    columns={columns}
                    getRowId={(row) => row.id}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 20 },
                        },
                    }}
                    pageSizeOptions={[10, 20]}
                    checkboxSelection
                />
            </div>
            <DetalleTransaccionesI
                openDetalleTransaccion={openDetalleTransaccion}
                setOpenDetalleTransaccion={setOpenDetalleTransaccion}
                handleClose={handleClose}
                selectedTransaccion={selectedTransaccion}
            ></DetalleTransaccionesI>
        </div>
    )
}

export default DataGridTInventario;