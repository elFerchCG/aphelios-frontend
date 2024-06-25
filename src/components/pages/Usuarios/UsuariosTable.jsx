import React, { useState, useEffect } from 'react';
import { DataGrid, GridActionsCellItem, GridDeleteIcon } from '@mui/x-data-grid';
import UsuariosActions from './UsuariosActions';
import { Preview } from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import { getUsers } from '../../actions/getUsers';



export const UsuariosTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const url = 'http://localhost:3304/usuarios';

    const [selectedUser, setSelectedUser] = useState(null);
    const [openUsuariosActions, setOpenUsuariosActions] = useState(false);

    const columns = [
        { field: 'id_usuario', headerName: 'ID', width: 10 },
        { field: 'nombre', headerName: 'Nombre', width: 200 },
        { field: 'rol', headerName: 'Rol', width: 150 },
        { field: 'permisos', headerName: 'Permisos', width: 170 },
        { field: 'estado', headerName: 'Estado', width: 100 },
        {
            field: 'actions', headerName: 'Actions', type: 'actions', width: 150, getActions: (params) => [
                <GridActionsCellItem
                    icon={<Preview />}
                    label="Ver detalles"
                    onClick={() => handleOpen(params.row)}
                />,
                <GridActionsCellItem
                    icon={<GridDeleteIcon />}
                    label="Eliminar Usuario"
                    onClick={(e) => deleteUser(params.row.id_usuario, e)}
                />,
            ],
        },
    ];

    const fetchData = async () => {
        setLoading(true);
        const result = await getUsers(url);
        setData(result.data);
        setError(result.error);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [refresh]);

    const handleOpen = (user) => {
        setSelectedUser(user);
        setOpenUsuariosActions(true);
    };

    const handleClose = () => {
        setOpenUsuariosActions(false);
        setSelectedUser(null);
    };

    const deleteUser = (id_usuario, e) => {
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
                axios.delete(`http://localhost:3304/usuarios/${id_usuario}`)
                    .then(response => {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'Tu usuario ha sido eliminado.',
                            icon: 'success'
                        });
                        setRefresh(!refresh);
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Hubo un error al eliminar el usuario.'
                        });
                        console.error('Error al eliminar usuario:', error);
                    });
            }
        });

    };

    return (
        <div className='contenido'  >
            <div id='contenidoUsuarios' style={{ height: 500, width: '70%' }}>
                <DataGrid
                    rows={data}
                    columns={columns}
                    getRowId={(row) => row.id_usuario}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 20 },
                        },
                    }}
                    pageSizeOptions={[10, 20]}
                    checkboxSelection
                />
            </div>
            <UsuariosActions
                openUsuariosActions={openUsuariosActions}
                setOpenUsuariosActions={setOpenUsuariosActions}
                selectedUser={selectedUser}
                handleClose={handleClose}
            >
            </UsuariosActions>
        </div>

    );
} 