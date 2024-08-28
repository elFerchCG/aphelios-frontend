import React from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { Tooltip } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';


const DataGridB = ({ data, setSelectedBodega, setOpenDetalleBodega, setOpenUbicaciones, filter }) => {

  const handleOpen = (bodega) => {
    setSelectedBodega(bodega);
    setOpenDetalleBodega(true);
  };

  const handleOpenUbicaciones = (bodega) => {
    setSelectedBodega(bodega);
    setOpenUbicaciones(true);
  };

  const columns = [
    { field: 'id', headerName: 'Folio', type: 'number', width: 50 },
    { field: 'Nombre', headerName: 'Descripción', type: 'string', width: 250 },
    { field: 'Tipo', headerName: 'Tipo', type: 'string', width: 200 },
    { field: 'Neteable', headerName: 'Disponible para retiro', width: 200 },
    {
      field: 'actions', headerName: 'Acciones', type: 'actions', width: 150, getActions: (params) => [
        <Tooltip title='Ver detalles'>
          <GridActionsCellItem
            icon={<EditNoteIcon />}
            sx={{ color: 'green' }}
            onClick={() => handleOpen(params.row)}
          />
        </Tooltip>,
      ],
    },
    {
      field: 'Ubicaciones', headerName: 'Ubicaciones', type: 'actions', width: 150, getActions: (params) => [
        <Tooltip title='Ver ubicaciones registradas en esta bodega'>
          <GridActionsCellItem
            icon={<AddLocationAltIcon />}
            sx={{ color: 'blue' }}
            onClick={() => handleOpenUbicaciones(params.row)}
          />
        </Tooltip>,
      ],
    },
  ];

  const filteredRows = data.filter(row =>
    (row.id && row.id.toString().includes(filter)) ||
    (row.Nombre && row.Nombre.toLowerCase().includes(filter.toLowerCase())) ||
    (row.Tipo && row.Tipo.toLowerCase().includes(filter.toLowerCase()))

);

  return (
    <div className='contenido'>
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
  );
};

export default DataGridB;
