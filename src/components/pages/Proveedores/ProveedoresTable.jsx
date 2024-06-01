import { DataGrid } from '@mui/x-data-grid';
import React from 'react'
import ProveedoresActions from './ProveedoresActions';

export const ProveedoresTable = () => {

    const columns = [
        { field: 'id_proveedor', headerName: 'ID', width: 10 },
        { field: 'razon_social', headerName: 'Razón social', width: 170 },
        { field: 'rfc', headerName: 'RFC', width: 150 },
        { field: 'correo', headerName: 'Correo', width: 250 },
        { field: 'status', headerName: 'Estado', type: 'number', width: 100 },
        { field: 'actions', headerName: 'Actions', type: 'actions', width: 150, renderCell: (params) => (
            <ProveedoresActions {...{ params }} />
        ),
     },
     
    ];
    
    const rows = [
        { id_proveedor: 1, razon_social: 'Masuda', rfc: 'RAFC2614879', correo: 'ejemplo@hotmail.com', status: 2 },
        { id_proveedor: 2, razon_social: 'Vame', rfc: 'VAMS8987897', correo: 'ejemplo@hotmail.com', status: 1 },
    ];

    return (
        <div className='contenido' >
           <div id='contenidoProveedores' style={{ height: 600, width: '70%' }}>
                <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id_proveedor}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 5 },
                    },
                }}
                pageSizeOptions={[5, 10]}
                checkboxSelection
                />
           </div>
        </div>
    );
}