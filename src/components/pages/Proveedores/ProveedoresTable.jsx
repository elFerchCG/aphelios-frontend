import { Preview } from '@mui/icons-material';
import { DataGrid, GridDeleteIcon, GridActionsCellItem } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'
import ProveedoresActions from './ProveedoresActions';
import axios from 'axios';
import Swal from 'sweetalert2';


export const ProveedoresTable = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const [openProveedoresActions, setOpenProveedoresActions] = useState(false)

    const columns = [
        { field: 'id_proveedor', headerName: 'ID', width: 10 },
        { field: 'razon_social', headerName: 'Razón social', width: 250 },
        { field: 'rfc', headerName: 'RFC', width: 180 },
        { field: 'correo', headerName: 'Correo', width: 280 },
        { field: 'estado', headerName: 'Estado', width: 100 },
        { field: 'sku_proveedor', headerName: 'SKU', width: 100},
        {
            field: 'actions', headerName: 'Actions', type: 'actions', width: 150, getActions: (params) => [
                <GridActionsCellItem
                    icon={<Preview />}
                    label="Ver detalles"
                    onClick={() => handleOpen(params.row)}
                />,
                <GridActionsCellItem
                    icon={<GridDeleteIcon />}
                    label="Eliminar Proveedor"
                    onClick={(e) => deleteProveedor(params.row.id_proveedor, e)}
                />,
            ],

        },

    ];

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:3304/proveedores');
            setData(response.data);
            console.log(response.data);
            setLoading(false);
        } catch (error) {
            setError(error);
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = (proveedor) => {
        setSelectedProveedor(proveedor);
        setOpenProveedoresActions(true);
    };

    const handleClose = () => {
        setOpenProveedoresActions(false);
        setSelectedProveedor(null);
    };

    //Function delete proveedor
    const deleteProveedor = (id_proveedor, e) => {
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
            axios.delete(`http://localhost:3304/proveedores/${id_proveedor}`)
              .then(response => {
                fetchData(); // Actualizar la lista de proveedores después de la eliminación
                Swal.fire({
                  title: '¡Eliminado!',
                  text: 'Tu proveedor ha sido eliminado.',
                  icon: 'success'
                });
              })
              .catch(error => {
                Swal.fire({
                  icon: 'error',
                  title: 'Oops...',
                  text: 'Hubo un error al eliminar el proveedor.'
                });
                console.error('Error al eliminar proveedor:', error);
              });
          }
        });
      };

    return (
        <div className='contenido' >
            <div id='contenidoProveedores' style={{ height: 500, width: '70%' }}>
                {data.length === 0 ? (
                    <div>No hay datos disponibles.</div>
                ) : (
                    <DataGrid
                        rows={data}
                        columns={columns}
                        getRowId={(row) => row.id_proveedor}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 20 },
                            },
                        }}
                        pageSizeOptions={[10, 20]}
                        checkboxSelection
                    />
                )}
           </div>
            <ProveedoresActions
                openProveedoresActions={openProveedoresActions}
                setOpenProveedoresActions={setOpenProveedoresActions}
                selectedProveedor={selectedProveedor}
                handleClose={handleClose}
                fetchData={fetchData}
            >

            </ProveedoresActions>
        </div>
    );
}