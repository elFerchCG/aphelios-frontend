import { Box, Button, TextField, Tooltip, CircularProgress } from '@mui/material'
import { DataGrid, GridActionsCellItem, GridToolbarColumnsButton, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { GridToolbarContainer } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DetailsIcon from '@mui/icons-material/Details';

const Envios = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envioId, setEnvioId] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEnvios, setFilteredEnvios] = useState([]);
  const navigate = useNavigate();
  const [expandedRowId, setExpandedRowId] = useState(null);

  const apiUrl = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport csvOptions={{ fileName: "exported_data", utf8WithBom: true }} />
    </GridToolbarContainer>
  );

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: true,
    descripcion: true,
    estatus: true
  });

  useEffect(() => {
    fetchEnvios();
  }, [apiUrl]);

  const fetchEnvios = async () => {
    try {
      const response = await axios.get(`${apiUrl}/empaque/fetchEnvios`);
      if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        setData(response.data.data);
        setFilteredEnvios(response.data.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al cargar los datos';
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    } finally {
      setLoading(false);
    }
  };


  const abrirEnvio = async () => {
    Swal.fire({
      title: `¿Estás seguro de abrir un nuevo envio?`,
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
        const envioDescripcion = envio.descripcion ? envio.descripcion.toLowerCase() : '';
        const envioEstatus = envio.estatus ? envio.estatus.toLowerCase() : '';

        // Verifica si todas las palabras están en el título
        //const titleMatch = searchWords.every(word => productTitle.includes(word));

        // Verifica si el término de búsqueda está en otras columnas
        const otherColumnsMatch = (
          envioId.includes(searchTerm.toString()) ||
          envioDescripcion.includes(searchTerm.toLowerCase()) ||
          envioEstatus.includes(searchTerm.toLowerCase())
        );

        // El producto debe coincidir en el título o en alguna de las otras columnas
        return otherColumnsMatch;
      });
    }

    setFilteredEnvios(filtered);
  }, [searchTerm, data]);

  const handleDetallesEnvio = (envioId) => {
    navigate(`/empaque/${envioId}/detalle`)
};

  const columns = [
    { field: "id", headerName: "# Envío", type: "number", flex: 1 },
    { field: "descripcion", headerName: "Descrpción", type: "text", flex: 1 },
    { field: 'estatus', headerName: "Estatus", type: "text", flex: 1 },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => [
        <Tooltip title="Detalles" key={`envios-${params.row.id}`}>
          <GridActionsCellItem
            icon={<DetailsIcon />}
            sx={{ color: "blue" }}
            label='Detalles'
            onClick={() => handleDetallesEnvio(params.row.id)}
          />
        </Tooltip>
      ]
    }
  ];

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
            onClick={abrirEnvio}
          >Nuevo envío</Button>
        </div>
        {/* Muestra el CircularProgress mientras cargan los datos */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold" }} sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
            rows={filteredEnvios}
            columns={columns}
            showCellVerticalBorder
            showColumnVerticalBorder
            getRowId={(row) => row.id}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
            experimentalFeatures={{ newEditingApi: true }}
            density="compact" // Establece el tamaño de las filas en compacto por defecto
            slots={{ toolbar: CustomToolbar }}
          />
        )}
      </div>
    </div>
  );
};

export default Envios;
