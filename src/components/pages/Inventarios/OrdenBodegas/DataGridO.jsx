import React, { useState, useEffect } from 'react';
import { DataGrid, GridActionsCellItem, GridDeleteIcon } from '@mui/x-data-grid';
import { Tooltip } from '@mui/material';
import axios from 'axios';
import Swal from 'sweetalert2';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DetalleOrdenB from '../OrdenBodegas/DetalleOrdenB';
import { getOrdenB } from '../../../actions/getUsers';
import { formatISO } from 'date-fns'; // Importar formatISO de date-fns

const DataGridO = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const url = 'http://localhost:3304/inventario/ordenBodegas';

    const [selectedOrden, setSelectedOrden] = useState(null);
    const [openDetalleOrden, setOpenDetalleOrden] = useState(false);

    const fetchAndFormatData = async () => {
        setLoading(true);
        try {
            const result = await getOrdenB(url);
            const formattedData = result.data.map(row => ({
                ...row,
                fecha: formatISO(new Date(row.fecha), { representation: 'date' })
            }));
            setData(formattedData);
            setError(null);
        } catch (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAndFormatData();
    }, [refresh]);

    const handleOpen = (orden) => {
        setSelectedOrden(orden);
        setOpenDetalleOrden(true);
    };

    const handleClose = () => {
        setOpenDetalleOrden(false);
        setSelectedOrden(null);
    };

    const deleteOrden = (id, e) => {
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
                axios.delete(`http://localhost:3304/inventario/ordenBodegas/${id}`)
                    .then(response => {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'Tu orden ha sido eliminada.',
                            icon: 'success' 
                        });
                        setRefresh(!refresh);
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Hubo un error al eliminar la orden.'
                        });
                        console.error('Error al eliminar la orden:', error);
                    });
            }
        });

    };

    const columns = [
        { field: 'id', headerName: 'Folio', width: 50 },
        { 
            field: 'fecha', 
            headerName: 'Fecha', 
            width: 150,
        },
        { field: 'tipo_transaccion_id', headerName: 'Tipo de transacción', type: 'number', width: 200 },
        { field: 'estatus', headerName: 'Estado', type: 'string', width: 200 },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', width: 150, getActions: (params) => [
                <Tooltip title='Ver detalles' key='view'>
                    <GridActionsCellItem
                        icon={<EditNoteIcon />}
                        sx={{ color: 'green' }}
                        onClick={() => handleOpen(params.row)}
                    />
                </Tooltip>,
                <Tooltip title='Eliminar Orden' key='delete'>
                    <GridActionsCellItem
                        icon={<GridDeleteIcon />}
                        sx={{ color: 'red' }}
                        onClick={(e) => deleteOrden(params.row.id, e)}
                    />
                </Tooltip>,
            ],
        },
    ];

    return (
        <div className='contenido'>
            <div id='contenidoUsuarios' style={{ height: 500, width: '70%' }}>
                <DataGrid
                    rows={data}
                    columns={columns}
                    getRowId={(row) => row.id}
                    pageSize={10}
                    rowsPerPageOptions={[10, 20, 50]}
                    checkboxSelection
                />
            </div>
            <DetalleOrdenB
                openDetalleOrden={openDetalleOrden}
                setOpenDetalleOrden={setOpenDetalleOrden}
                handleClose={handleClose}
                selectedOrden={selectedOrden}
            />
        </div>
    );
}

export default DataGridO;
