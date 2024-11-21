import React from 'react'
import { DataGrid, GridActionsCellItem, GridDeleteIcon } from '@mui/x-data-grid';
import { Preview } from '@mui/icons-material';
import { useState } from 'react';
import DetalleLineas from '../Lineas/DetalleLineas';
import { getLineas } from '../../../actions/getUsers';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect } from 'react';
import { Tooltip } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import apiUrl from '../../../../config';


const DataGridL = ({ filter }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const url = `${apiUrl}/inventario/lineasOrden`;

    const [selectedLinea, setSelectedLinea] = useState(null);
    const [openDetalleLinea, setOpenDetalleLinea] = useState(false);


    const columns = [
        { field: 'id', headerName: 'Folio', type: 'number', width: 50 },
        { field: 'orden_id', headerName: 'Orden', width: 250 },
        { field: 'producto_id', headerName: 'Producto', width: 200 },
        { field: 'cantidad', headerName: 'Cantidad', type: 'id', width: 200 },
        { field: 'confirmacion_salida', headerName: 'Confirmacion de salida', width: 200 },
        { field: 'confirmacion_entrada', headerName: 'Confirmacion de entrada', width: 200 },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', width: 150, getActions: (params) => [
                <Tooltip title='Ver detalles' >
                <GridActionsCellItem
                    icon={<EditNoteIcon />}
                    sx={{ color: 'green' }}
                    onClick={() => handleOpen(params.row)}
                />
                </Tooltip>,
                <Tooltip title='Eliminar traspaso'>
                    <GridActionsCellItem
                    icon={<GridDeleteIcon />}
                    sx={{ color: 'red' }}
                    onClick={(e) => deleteLinea(params.row.id, e)}
                /></Tooltip>,
            ],
        },
    ];

    const filteredRows = data.filter(row =>
    (row.id && row.id.toString().includes(filter)) ||
    (row.orden_id && row.orden_id.toString().includes(filter)) ||
    (row.producto_id && row.producto_id.toString().includes(filter)) ||
    (row.cantidad && row.cantidad.toString().includes(filter)) 
    )

    const fetchData = async () => {
        setLoading(true);
        const result = await getLineas(url);
        setData(result.data);
        setError(result.error);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [refresh]);

    const handleOpen = (linea) => {
        setSelectedLinea(linea);
        setOpenDetalleLinea(true);
    };

    const handleClose = () => {
        setOpenDetalleLinea(false);
        setSelectedLinea(null);
    };

    const deleteLinea = (id, e) => {
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
                axios.delete(`${apiUrl}/inventario/lineasOrden/${id}`)
                    .then(response => {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'El traspaso ha sido eliminado.',
                            icon: 'success'
                        });
                        setRefresh(!refresh);
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Hubo un error al eliminar el traspaso.'
                        });
                        console.error('Error al eliminar el traspaso:', error);
                    });
            }
        });

    };

    return (
        <div className='contenido'  >
            <div id='contenidoUsuarios' style={{ height: 500, width: '70%' }}>
                <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={filteredRows}
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
            <DetalleLineas
                openDetalleLinea={openDetalleLinea}
                setOpenDetalleLinea={setOpenDetalleLinea}
                handleClose={handleClose}
                selectedLinea={selectedLinea}
            ></DetalleLineas>
        </div>
    )
}

export default DataGridL;