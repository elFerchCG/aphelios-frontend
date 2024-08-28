import React from 'react'
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { Tooltip } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';


const DataGridT = ({ data, fetchData, setSelectedTransaccion, openDetalleTransaccion, setOpenDetalleTransaccion, filter }) => {

const handleOpen = (transaccion) => {
    setSelectedTransaccion(transaccion);
    setOpenDetalleTransaccion(true);
}

    const columns = [
        { field: 'id', headerName: 'Folio', width: 50 },
        { field: 'descripcion', headerName: 'Descripción', width: 250 },
        { field: 'categoria', headerName: 'Categoria', width: 200 },
        { field: 'responsable', headerName: 'Responsable', width: 200 },
        {
            field: 'actions', headerName: 'Acciones', type: 'actions', width: 150, getActions: (params) => [
                <Tooltip title='Ver detalles' >
                <GridActionsCellItem
                    icon={<EditNoteIcon />}
                    sx={{ color: 'green' }}
                    onClick={() => handleOpen(params.row)}
                />
                </Tooltip>,
            ],
        },
    ];

    const filteredRows = data.filter(row =>
    (row.id && row.id.toString().includes(filter)) ||
    (row.descripcion && row.descripcion.toLowerCase().includes(filter.toLowerCase())) ||
    (row.categoria && row.categoria.toLowerCase().includes(filter.toLowerCase())) ||
    (row.responsable && row.responsable.toLowerCase().includes(filter.toLowerCase()))
    )

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
                />
            </div>
        </div>
    )
}

export default DataGridT