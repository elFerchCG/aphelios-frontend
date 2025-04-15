import { Box, Button, InputAdornment, Modal, TextField, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridActionsCellItem, GridToolbarColumnsButton, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import axios from 'axios';
import { GridToolbarContainer } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const Envios = () => {
  const [data, setData] = useState([]);
  const [cajasData, setCajasData] = useState([]);
  const [envioId, setEnvioId] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEnvios, setFilteredEnvios] = useState([]);
  const [openModalCajas, setOpenModalCajas] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
      setUser(JSON.parse(localStorage.getItem('user')));
    };

    // Añadir un listener para el evento `storage`
    window.addEventListener('storage', handleStorageChange);

    // Limpieza al desmontar el componente
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const apiUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: true,
    usuario_id: false,
    nombre_usuario: true,
    estatus: true
  });

  const CustomToolbar = () => (
    <GridToolbarContainer>
      {/* Mantener solo los botones necesarios */}
      <GridToolbarColumnsButton />  {/* Botón de Columnas */}
      <GridToolbarFilterButton />   {/* Botón de Filtros */}
      <GridToolbarDensitySelector />{/* Botón de Densidad */}
      <GridToolbarExport
        csvOptions={{
          fileName: "exported_data",
          utf8WithBom: true, // 👈 Esto garantiza que la codificación sea UTF-8
        }}
      />
    </GridToolbarContainer>
  );

  // Estilos del modal ADD envio
  // const styleAddEnvio = {
  //   position: 'absolute',
  //   width: "30%",
  //   top: '50%',
  //   left: '50%',
  //   transform: 'translate(-50%, -50%)',
  //   bgcolor: 'background.paper',
  //   borderRadius: 4,
  //   boxShadow: 24,
  //   p: 4,
  // };

  useEffect(() => {
    const fetchEnvios = async () => {
      try {
        const response = await axios.get(`${apiUrl}/empaque/fetchEnvios`);
        if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          setData(response.data.data);
          setFilteredEnvios(response.data.data);
        } else {
          Swal.fire({
            title: '¡Sin Datos!',
            text: "No se encontraron envios registrados actualmente en la base de datos",
            icon: 'error',
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true
          });
        }
      } catch (error) {
        const errorMessage = error.response.data.message;
        Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
        });
      }
    };
    fetchEnvios();
  }, [apiUrl])

  const fetchEnvios = async () => {
    try {
      const response = await axios.get(`${apiUrl}/empaque/fetchEnvios`);
      if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        setData(response.data.data);
        setFilteredEnvios(response.data.data);
      } else {
        Swal.fire({
          title: '¡Sin Datos!',
          text: "No se encontraron envios registrados actualmente en la base de datos",
          icon: 'error',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
        });
      }
    } catch (error) {
      const errorMessage = error.response.data.message;
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true
      });
    }
  };

  const handleAddEnvio = async () => {
    Swal.fire({
      title: '¿Estás seguro de abrir un nuevo envío?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, abrir nuevo envío!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.post(`${apiUrl}/empaque/nuevoEnvio`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (response.data) {
            setEnvioId(response.data.id);
            const message = response.data.message;
            Swal.fire({
              title: "¡Exito!",
              text: message,
              icon: "success",
              timer: 5000,
              showCloseButton: true,
              allowEscapeKey: true,
            })
            fetchEnvios();
          }
        } catch (error) {
          const errorMessage = error.response.data.message;
          Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error',
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true,
          });
        }
      } else if (result.isDismissed) {
        Swal.fire({
          title: "¡Revertido!",
          text: "¡No se ha abierto un nuevo envío!",
          icon: "info",
        });
      }
    })
  }

  useEffect(() => {
    // Filtra los envios en base al término de búsqueda
    let filtered = data;

    if (searchTerm) {
      //const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word);

      filtered = filtered.filter(envio => {
        const envioId = envio.id ? envio.id.toString() : '';
        const envioUsuario = envio.nombre_usuario ? envio.nombre_usuario.toLowerCase() : '';
        const envioEstatus = envio.estatus ? envio.estatus.toLowerCase() : '';

        // Verifica si todas las palabras están en el título
        //const titleMatch = searchWords.every(word => productTitle.includes(word));

        // Verifica si el término de búsqueda está en otras columnas
        const otherColumnsMatch = (
          envioId.includes(searchTerm.toString()) ||
          envioUsuario.includes(searchTerm.toLowerCase()) ||
          envioEstatus.includes(searchTerm.toLowerCase())
        );

        // El producto debe coincidir en el título o en alguna de las otras columnas
        return otherColumnsMatch;
      });
    }

    setFilteredEnvios(filtered);
  }, [searchTerm, data]);

  const handleMostrarCajas = (envioId) => {
    navigate(`/cajas/${envioId}`)
    console.log("Este es el idEnvio:", envioId);
  };


  const columns = [
    { field: "id", headerName: "# Envío", type: "number", flex: 1 },
    { field: 'usuario_id', headerName: "Creado Por", type: "text", flex: 1 },
    { field: "nombre_usuario", headerName: "Creado Por", type: "text", flex: 1 },
    { field: 'estatus', headerName: "Estatus", type: "text", flex: 1 },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => [
        <Tooltip title="Mostrar Cajas" key={`cajas-${params.row.id}`}>
          <GridActionsCellItem
            icon={<AssignmentIndIcon />}
            sx={{ color: "orange" }}
            label='Mostrar Cajas'
            onClick={() => handleMostrarCajas(params.row.id)}
          />
        </Tooltip>
      ]
    }
  ]

  return (
    <div>
      <div className='DataG' style={{ height: 500, width: "90%" }}>
        <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
          <h1>Envíos</h1>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Montserrat", fontWeight: "bold", marginTop: "-40px" }}>
          <TextField
            id="outlined-basic"
            label="Buscar envio"
            variant='outlined'
            sx={{
              fontFamily: "Montserrat",
              width: '20rem',
              marginBottom: '10px',
              backgroundColor: "white",
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant='contained' style={{
            marginLeft: 'auto',
            marginBottom: '10px',
            marginTop: "10px"
          }}
            onClick={handleAddEnvio}
          >Nuevo envío</Button>
        </div>
        <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }} sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
          rows={filteredEnvios}
          columns={columns}
          showCellVerticalBorder
          showColumnVerticalBorder
          getRowId={(row) => row.id}
          //processRowUpdate={processRowUpdate}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
          experimentalFeatures={{ newEditingApi: true }}
          density="compact" // Establece el tamaño de las filas en compacto por defecto
          slots={{ toolbar: CustomToolbar }}
        />
      </div>
      {/* <Modal id="modal-detailsCaja" open={openModalCajas} onClose={() => setOpenModalCajas(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 4,
        }}>
          <Typography variant="h6" mb={2}>Cajas del Envío {envioId}</Typography>
          <DataGrid
            rows={cajasData}
            columns={[
              { field: 'id', headerName: '# Caja', type: "number", flex: 1 },
              { field: 'usuario_id', headerName: 'Creado Por', type: "number", flex: 1 },
              { field: "nombre_usuario", headerName: "Creado Por", type: "text", flex: 1 },
              { field: 'estatus', headerName: 'Estatus', type: "text", flex: 1 },
              // agrega aquí las columnas necesarias
            ]}
            getRowId={(row) => row.id}
            sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}
          />
        </Box>
      </Modal> */}
    </div>
  )
}

export default Envios