import { Box, Button, TextField, Tooltip, CircularProgress, Modal, Typography, FormControl, FormHelperText } from '@mui/material'
import { DataGrid, GridActionsCellItem, GridToolbarColumnsButton, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { GridToolbarContainer } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import DetailsIcon from '@mui/icons-material/Details';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DatePicker from 'react-datepicker';
import DataThresholdingOutlinedIcon from '@mui/icons-material/DataThresholdingOutlined';


const Envios = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envioId, setEnvioId] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  //const [filteredEnvios, setFilteredEnvios] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState(null);
  const [errors, setErrors] = useState({
    descripcionError: false,
    fechaProgramadaError: false
  });
  const navigate = useNavigate();

  const apiUrl = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport csvOptions={{ fileName: "exported_data", utf8WithBom: true }} />
    </GridToolbarContainer>
  );

  // Estilos del modal
  const styleModal = {
    position: 'absolute',
    width: "40%",
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    borderRadius: 4,
    boxShadow: 24,
    p: 4,
  };

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
        //setFilteredEnvios(response.data.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al cargar los datos';
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'warning',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    } finally {
      setLoading(false);
    }
  };


  const abrirEnvio = async () => {
    // validación de campos vacíos o cero
    const newErrors = {
      descripcionError: !descripcion,
      fechaProgramadaError: !fechaProgramada
    };

    // Si hay algún error, no continuar
    if (Object.values(newErrors).some(error => error)) {
      setErrors(newErrors);
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Completa todos los campos.',
        icon: 'warning',
        target: document.getElementById("modal-focus"),
      });
      return;
    }

    // Si no hay errores, continuar con la petición
    try {
      const soloFecha = fechaProgramada.toISOString().split('T')[0]; // 'yyyy-MM-dd'
      const response = await axios.post(`${apiUrl}/empaque/nuevoEnvio`,
        {
          descripcion: descripcion,
          fecha_programada: soloFecha
        },
      );
      if (response.data) {
        setEnvioId(response.data.id);
        fetchEnvios();
        setOpenModal(false);
      }
    } catch (error) {
      const errorMessage = error.response.data.message;
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'warning',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
      setOpenModal(false);
    }
  }

  // useEffect(() => {
  //   // Filtra los envios en base al término de búsqueda
  //   let filtered = data;

  //   if (searchTerm) {
  //     //const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word);

  //     filtered = filtered.filter(envio => {
  //       const envioId = envio.id ? envio.id.toString() : '';
  //       const envioDescripcion = envio.descripcion ? envio.descripcion.toLowerCase() : '';
  //       const envioEstatus = envio.estatus ? envio.estatus.toLowerCase() : '';

  //       // Verifica si todas las palabras están en el título
  //       //const titleMatch = searchWords.every(word => productTitle.includes(word));

  //       // Verifica si el término de búsqueda está en otras columnas
  //       const otherColumnsMatch = (
  //         envioId.includes(searchTerm.toString()) ||
  //         envioDescripcion.includes(searchTerm.toLowerCase()) ||
  //         envioEstatus.includes(searchTerm.toLowerCase())
  //       );

  //       // El producto debe coincidir en el título o en alguna de las otras columnas
  //       return otherColumnsMatch;
  //     });
  //   }

  //   setFilteredEnvios(filtered);
  // }, [searchTerm, data]);

  const handleDetallesEnvio = (envio) => {
    navigate(`/empaque/${envio.id}/detalle`, {
      state: { estatusEnvio: envio.estatus }
    });
  };

  const handleResumenEnvio = (envio) => {
    navigate(`/resumenEnvio/envio/${envio.id}`)
    console.log("envio:", envio.id);
  }

  const handleCloseModal = () => {
    setOpenModal(false);
    setDescripcion("");
    setFechaProgramada("");
    setErrors({
      descripcionError: "",
      fechaProgramadaError: ""
    });
  }

  const handleOpenModal = () => {
    setOpenModal(true);
  }

  const handleDescripcion = (e) => {
    const descripcionEnvio = e.target.value;
    setDescripcion(descripcionEnvio);
  }

  const cambiarEstatusAbiertoEnvio = async (envioId) => {
    try {
      const response = await axios.put(`${apiUrl}/empaque/estatusAbiertoEnvio/${envioId}`,
        {},
      );
      if (response.data.ok) {
        await fetchEnvios();
      }
    } catch (error) {
      const errorMessage = error.response.data.message;
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'warning',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  }

  const today = new Date();
  const minDate = today;

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 90);

  const handleFechaProgramada = (date) => {
    setFechaProgramada(date); // Almacena la fecha como cadena
  };

  const columns = [
    { field: "id", headerName: "# Envío", type: "number", flex: 0.3, align: "left", headerAlign: "left" },
    { field: "descripcion", headerName: "Descripción", type: "text", flex: 1, align: "center", headerAlign: "center" },
    {
      field: "fecha_creacion",
      headerName: "Fecha Creación",
      type: 'Date',
      flex: 0.5,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "fecha_programada",
      headerName: "Fecha Programada",
      type: 'Date',
      flex: 0.5,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "fecha_finalizado",
      headerName: "Fecha finalización",
      type: 'Date',
      flex: 0.5,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "numero_mercado_libre",
      headerName: "# ML",
      type: 'text',
      flex: 0.5,
      align: "center",
      headerAlign: "center",
      renderCell: ({ value }) =>
        value ? `${value}` : <em>Sin asignar</em>,
    },
    { field: 'estatus', headerName: "Estatus", type: "text", flex: 0.5, align: "center", headerAlign: "center" },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      minWidth: 200,
      flex: 0,
      getActions: (params) => [
        <Tooltip title="Detalles" key={`envios-${params.row.id}`}>
          <>
            <GridActionsCellItem
              icon={
                <Box display="flex" flexDirection="column" alignItems="center">
                  <DetailsIcon sx={{ color: 'blue' }} />
                  <Typography variant='caption' sx={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                    Detalles
                  </Typography>
                </Box>
              }
              label='Detalles'
              onClick={() => handleDetallesEnvio(params.row)}
            />
          </>
        </Tooltip>,
        <Tooltip title="Resumen" key={`envios-${params.row.id}`}>
          <>
            <GridActionsCellItem
              icon={
                <Box display="flex" flexDirection="column" alignItems="center">
                  <DataThresholdingOutlinedIcon sx={{ color: 'green' }} />
                  <Typography variant='caption' sx={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                    Resumen
                  </Typography>
                </Box>
              }
              label='Detalles'
              onClick={() => handleResumenEnvio(params.row)}
            />
          </>
        </Tooltip>,
        <Tooltip title="Revertir estatus" key={`envios-${params.row.id}`}>
          <>
            <GridActionsCellItem
              icon={
                <Box display="flex" flexDirection="column" alignItems="center">
                  <AutorenewIcon sx={{ color: params.row.estatus === "en_proceso" || params.row.estatus === "abierto" ? undefined : 'orange' }} />

                  <Typography variant='caption' sx={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                    Reabrir
                  </Typography>
                </Box>
              }
              label="Abrir envío"
              onClick={() => cambiarEstatusAbiertoEnvio(params.row.id)}
              disabled={params.row.estatus === 'en_proceso' || params.row.estatus === 'abierto'}
            />
          </>
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
          //value={searchTerm}
          //onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant='contained' style={{
            marginLeft: 'auto',
            marginBottom: '10px',
            marginTop: "10px"
          }}
            onClick={handleOpenModal}
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
            rows={data}
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
      {/* Modal de nuevo envío */}
      <Modal id="modal-focus" open={openModal} onClose={handleCloseModal}>
        <Box sx={styleModal}>
          <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
            Nuevo envío
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: "wrap", gap: 2 }}>
            <TextField
              fullWidth
              className='input'
              label="Descripción"
              variant='outlined'
              type='text'
              value={descripcion}
              onChange={handleDescripcion}
              error={errors.descripcionError}
              helperText={errors.descripcionError ? "Requerido*" : ""}
              inputProps={{
                min: 0,
                style: {
                  backgroundColor: 'white',
                  color: 'black',
                },
              }}
            />
            <FormControl fullWidth error={!!errors.fechaProgramadaError}>
              <DatePicker
                selected={fechaProgramada}
                onChange={handleFechaProgramada}
                dateFormat="yyyy-MM-dd"
                minDate={minDate}
                maxDate={maxDate}
                placeholderText='Fecha Programada'
                className={`datepicker-custom ${errors.fechaProgramadaError ? 'datepicker-error' : ''}`}
              />
              {errors.fechaProgramadaError && (
                <FormHelperText>Requerido*</FormHelperText>
              )}
            </FormControl>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "50px" }}>
            <Button onClick={handleCloseModal} variant="contained" color="primary" sx={{ width: 80 }}>Cerrar</Button>
            <Button onClick={abrirEnvio} variant="contained" color="success" sx={{ width: 190 }}>Abrir Envío</Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Envios;
