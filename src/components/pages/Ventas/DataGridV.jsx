import React from 'react'
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { Preview } from '@mui/icons-material';
import DetalleVentas from './DetalleVentas';
import { useState } from 'react';


const DataGridV = ({ data, setData }) => {
    const [selectedVentas, setSelectedVentas] = useState(null);
    const [openDetalleVentas, setOpenDetalleVentas] = useState(false);


    const columns = [
        { field: 'id', headerName: 'ID', width: 200 },
        { field: 'total_amount', headerName: 'Total', width: 120 },
        { field: 'date_created', headerName: 'Fecha inicio', width: 200 },
        { field: 'date_closed', headerName: 'Fecha termino', width: 200 },
        { field: 'status', headerName: 'Estado', width: 120 },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', width: 150, getActions: (params) => [
                <GridActionsCellItem
                    icon={<Preview />}
                    label="Ver detalles"
                    onClick={() => handleOpen(params.row)}
                />,
            ],
        },
    ];

    const handleOpen = (venta) => {
        setSelectedVentas(venta);
        setOpenDetalleVentas(true);
    };

    const handleClose = () => {
        setOpenDetalleVentas(false);
        setSelectedVentas(null);
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
            <DetalleVentas
                openDetalleVentas={openDetalleVentas}
                setOpenDetalleVentas={setOpenDetalleVentas}
                handleClose={handleClose}
                selectedVentas={selectedVentas}
            ></DetalleVentas>
        </div>
    )
}

export default DataGridV