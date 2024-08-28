import React from 'react'
import { DataGrid, GridActionsCellItem, GridDeleteIcon } from '@mui/x-data-grid';
import { Preview } from '@mui/icons-material';
import { useState } from 'react';
import DetalleExistencias from '../Existencias/DetalleExistencias';
import { getExistencias } from '../../../actions/getUsers';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useEffect } from 'react';
import { Tooltip } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';


const DataGridE = ({ filter }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const url = 'http://localhost:3304/inventario/existencias';

    const [selectedExistencia, setSelectedExistencia] = useState(null);
    const [openDetalleExistencia, setOpenDetalleExistencia] = useState(false);


    const columns = [
        { field: 'id', headerName: 'Folio', type: 'number', width: 50 },
        { field: 'producto_id', headerName: 'Producto',  width: 250 },
        { field: 'localidad_id', headerName: 'Localidad', width: 250 },
        { field: 'cantidad', headerName: 'Cantidad', type: 'number', width: 200 },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', width: 150, getActions: (params) => [
                <Tooltip title='Ver detalles' >
                <GridActionsCellItem
                    icon={<EditNoteIcon />}
                    sx={{ color: 'green' }}
                    onClick={() => handleOpen(params.row)}
                />
                </Tooltip>,
                <Tooltip title='Eliminar producto'>
                    <GridActionsCellItem
                    icon={<GridDeleteIcon />}
                    sx={{ color: 'red' }}
                    onClick={(e) => deleteExistencia(params.row.id, e)}
                /></Tooltip>,
            ],
        },
    ];

    const filteredRows = data.filter(row => 
    (row.id && row.id.toString().includes(filter)) ||
    (row.producto_id && row.producto_id.toLowerCase().includes(filter.toLowerCase())) ||
    (row.cantidad && row.cantidad.toString().includes(filter))
    );

    const fetchData = async () => {
        setLoading(true);
        const result = await getExistencias(url);
        setData(result.data);
        setError(result.error);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [refresh]);

    const handleOpen = (existencia) => {
        setSelectedExistencia(existencia);
        setOpenDetalleExistencia(true);
    };

    const handleClose = () => {
        setOpenDetalleExistencia(false);
        setSelectedExistencia(null);
    };

    const deleteExistencia = (id, e) => {
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
                axios.delete(`http://localhost:3304/inventario/existencia/${id}`)
                    .then(response => {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'Tu producto ha sido eliminado.',
                            icon: 'success'
                        });
                        setRefresh(!refresh);
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Hubo un error al eliminar el producto.'
                        });
                        console.error('Error al eliminar el producto:', error);
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
            <DetalleExistencias
                openDetalleExistencia={openDetalleExistencia}
                setOpenDetalleExistencia={setOpenDetalleExistencia}
                handleClose={handleClose}
                selectedExistencia={selectedExistencia}
            ></DetalleExistencias>
        </div>
    )
}

export default DataGridE;