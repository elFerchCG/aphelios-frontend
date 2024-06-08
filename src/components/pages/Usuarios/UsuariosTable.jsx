import React, { useState } from 'react';
import { DataGrid, GridActionsCellItem, GridDeleteIcon } from '@mui/x-data-grid';
import UsuariosActions from './UsuariosActions';
import { Preview } from '@mui/icons-material';


export const UsuariosTable = () => {

    const [openUsuariosActions, setOpenUsuariosActions] = useState(false)

const columns = [
    { field: 'id_usuario', headerName: 'ID', width: 10 },
    { field: 'nombre', headerName: 'Nombre', width: 200 },
    { field: 'password', headerName: 'Contraseña', width: 170 },
    { field: 'rol', headerName: 'Rol', width: 170 },
    { field: 'permissions', headerName: 'Permisos', width: 170 },
    { field: 'status', headerName: 'Estado', width: 100 },
    {
        field: 'actions', headerName: 'Actions', type: 'actions', width: 150, getActions: (params) => [
            <GridActionsCellItem
              icon={<Preview />}
              label="Ver detalles"
              onClick={() => setOpenUsuariosActions(true)}
            />,
            <GridActionsCellItem
            icon={<GridDeleteIcon />}
            label="Eliminar Usuario"
            onClick={""}    
          />,
        ],
    },
];

const rows = [
    { id_usuario: 1, nombre: 'Fernando Castorena', password: '123456', rol: 'Marketing', permissions: 'Administrador', status: 'Activo' },
    { id_usuario: 2, nombre: 'Abraham Salvador', password: '666999', rol: 'Planeación', permissions: 'Empleado', status: 'Inactivo' },
];


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
            <UsuariosActions
            openUsuariosActions = {openUsuariosActions}
            setOpenUsuariosActions = {setOpenUsuariosActions}
            >

            </UsuariosActions>
        </div>
    );
}