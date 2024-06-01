import React from 'react';
import { DataGrid } from '@mui/x-data-grid';

const columns = [
    { field: 'id_usuario', headerName: 'ID', width: 10 },
    { field: 'nombre', headerName: 'Nombre', width: 200 },
    { field: 'password', headerName: 'Contraseña', width: 170 },
    { field: 'rol', headerName: 'Rol', width: 170 },
    { field: 'permissions', headerName: 'Permisos', width: 170 },
    { field: 'status', headerName: 'Estado', type: 'number', width: 100 },
];

const rows = [
    { id_usuario: 1, nombre: 'Fernando Castorena', password: '123456', rol: 'Marketing', permissions: 'Administrador', status: 2 },
    { id_usuario: 2, nombre: 'Abraham Salvador', password: '666999', rol: 'Planeación', permissions: 'Empleado', status: 1 },
];

export const UsuariosTable = () => {
    return (
        <div className='contenido'  >
            <div id='contenidoUsuarios' style={{ height: 600, width: '70%' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(row) => row.id_usuario}
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