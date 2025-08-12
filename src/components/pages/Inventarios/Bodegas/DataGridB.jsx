import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Modal, Select, TextField, Tooltip } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid'
import axios from 'axios';
import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

const DataGridB = () => {
  const apiUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const theme = createTheme({
    palette: {
      primary: { main: '#1976d2' },
    },
  });

  // Estilos del modal de ubicaciones
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    borderRadius: 6,
    boxShadow: 24,
    p: 4,
  };

  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rowsUbicaciones, setRowsUbicaciones] = useState([]);
  const [filteredUbicaciones, setFilteredUbicaciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodega, setSelectedBodega] = useState(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openModalPost, setOpenModalPost] = useState(false);
  const [openModalUbicaciones, setOpenModalUbicaciones] = useState(false);
  const [openModalUbicacionesPost, setOpenModalUbicacionesPost] = useState(false);
  const [openModalUbicacionesUpdate, setOpenModalUbicacionesUpdate] = useState(false);

  const [bodegaData, setBodegaData] = useState({
    id: "",
    Nombre: '',
    Tipo: "",
    Neteable: "",
    rol_id: "",
    activo: "",
  })

  const [newBodegaData, setNewBodegaData] = useState({
    Nombre: '',
    Tipo: "",
    Neteable: "",
    rol_id: "",
    activo: 1
  })

  const [ubicacionData, setUbicacionData] = useState({
    id: '',
    descripcion: "",
    disponible: "",
    bodega_id: "",
    activo: ""
  })

  const [newUbicacionData, setNewUbicacionData] = useState({
    descripcion: '',
    disponible: "",
    bodega_id: "",
    activo: 1
  })

  const fetchUbicaciones = async () => {
    try {
      console.log("Esta es la bodega que se manda: ", selectedBodega);
      const response = await axios.get(`${apiUrl}/inventario/localidades/${selectedBodega}`);
      if (response.data && Array.isArray(response.data)) {
        setRowsUbicaciones(response.data);
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las ubicaciones',
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true
      });
    }
  };

  const fetchBodegas = async () => {
    try {
      const response = await axios.get(`${apiUrl}/inventario/bodegas`);
      if (response.data && Array.isArray(response.data)) {
        setRows(response.data);
      } else {
        Swal.fire({
          title: '!Bodegas no encontradas!',
          text: 'No se encontraron bodegas',
          icon: 'error',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `Error: ${error.message}`,
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true
      });
    }
  };

  useEffect(() => {
    const fetchBodegas = async () => {
      try {
        const response = await axios.get(`${apiUrl}/inventario/bodegas`);
        if (response.data && Array.isArray(response.data)) {
          setRows(response.data);
        } else {
          Swal.fire({
            title: '!Bodegas no encontradas!',
            text: 'No se encontraron bodegas',
            icon: 'error',
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true
          });
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: `Error: ${error.message}`,
          icon: 'error',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
        });
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${apiUrl}/usuarios/roles`);
        if (response.data && Array.isArray(response.data)) {
          setRoles(response.data);
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los roles',
          icon: 'error',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
        });
      }
    };

    fetchBodegas();
    if (selectedBodega || openModalPost) {
      fetchRoles();
    }

    const fetchUbicaciones = async () => {
      try {
        console.log("Esta es la bodega que se manda: ", selectedBodega);
        const response = await axios.get(`${apiUrl}/inventario/localidades/${selectedBodega}`);
        if (response.data && Array.isArray(response.data)) {
          setRowsUbicaciones(response.data);
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar las ubicaciones',
          icon: 'error',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
        });
      }
    };

    if (selectedBodega && openModalUbicaciones) {
      fetchUbicaciones();
    }

    fetchBodegas();
  }, [apiUrl, selectedBodega, openModalPost, openModalUbicaciones]);

  const addBodega = async () => {
    try {
      const response = await axios.post(`${apiUrl}/inventario/bodegas/`, {
        nombre: newBodegaData.Nombre,
        tipo: newBodegaData.Tipo,
        neteable: newBodegaData.Neteable,
        rol_id: newBodegaData.rol_id,
        activo: newBodegaData.activo
      });
      if (response.data.ok) {
        Swal.fire({
          title: 'Bodega creada',
          text: 'La nueva bodega se ha creado correctamente',
          icon: 'success',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
        });
        fetchBodegas();
        setNewBodegaData('');
        handleCloseModalPost();
      }
    } catch (error) {
      setNewBodegaData('');
      const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true
      });
      handleCloseModalPost();
    }
  }

  const getRolDescripcion = (rolId) => {
    const rol = roles.find(role => role.id === rolId);
    return rol ? rol.descripcion : 'Desconocido';
  };

  const handleOpenModal = (bodega) => {
    setSelectedBodega(bodega);
    setBodegaData({
      ...bodega,
      rol_descripcion: getRolDescripcion(bodega.rol_id),
    });
    setOpenModal(true);
  };

  const handleOpenModalUbicaciones = (row) => {
    // Obtener el id directamente de la fila seleccionada
    const selectedBodegaId = row.id;  // `row.id` ya contiene el ID de la bodega
    setSelectedBodega(selectedBodegaId);

    // Ahora puedes abrir la modal si has encontrado la bodega
    if (selectedBodegaId) {
      setOpenModalUbicaciones(true);
    }
  }

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenModalPost = () => {
    setOpenModalPost(true);
  }

  const handleOpenModalPostUbicacion = () => {
    setOpenModalUbicacionesPost(true);
  }

  const handleCloseModalPost = () => {
    setOpenModalPost(false);
  };

  const handleChangeNeteable = (e) => {
    const selectedNeteable = e.target.value;
    const descripcionNeteable = selectedNeteable === 1 ? 'Disponible para ventas' : 'No disponible';
    setBodegaData({
      ...bodegaData,
      Neteable: selectedNeteable,
      Neteable_descripcion: descripcionNeteable,
    });
  };

  const handleChangeActivo = (e) => {
    const selectedActivo = e.target.value;
    const descripcionActivo = selectedActivo === 1 ? 'Disponible para ventas' : 'No disponible';
    setBodegaData({
      ...bodegaData,
      activo: selectedActivo,
      activo_descripcion: descripcionActivo,
    });
  };

  const handleCloseModalUbicaciones = () => {
    // Restablecer el searchTerm cuando se cierra la modal
    setSearchTerm('');
    setOpenModalUbicaciones(false);
  };

  const handleSaveChanges = async () => {
    try {
      const response = await axios.put(`${apiUrl}/inventario/bodegas/${bodegaData.id}`, {
        nombre: bodegaData.Nombre,
        tipo: bodegaData.Tipo,
        neteable: bodegaData.Neteable, // Enviar el ID del rol
        activo: bodegaData.activo, // Enviar permisos como string
        rol_id: bodegaData.rol_id // Enviar el estado (1 o 0)
      });
      if (response.data.ok) {
        Swal.fire({
          title: 'Bodega actualizada',
          text: 'Los cambios se guardaron correctamente',
          icon: 'success',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
        });
        setBodegaData('');
        fetchBodegas();
        setOpenModal(false);
      }
    } catch (error) {
      setBodegaData('');
      const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
      Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true
      });
      setOpenModal(false);
    }
  };

  const handleCloseModalPostUbicaciones = () => {
    setOpenModalUbicacionesPost(false);
  };

  const handleCloseModalUpdateUbicaciones = () => {
    setOpenModalUbicacionesUpdate(false);
  };

  const handleSaveChangesUbicacion = async () => {
    try {
      const response = await axios.put(`${apiUrl}/inventario/localidades/${ubicacionData.id}`, {
        descripcion: ubicacionData.descripcion,
        disponible: ubicacionData.disponible,
        bodega_id: ubicacionData.bodega_id,
        activo: ubicacionData.activo
      });
      if (response.data.ok) {
        Swal.fire({
          title: 'Ubicación actualizada',
          text: 'Los cambios se guardaron correctamente',
          icon: 'success',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
          timerProgressBar: true,
          target: document.getElementById('modal-consultaUbi'),
        });
        setUbicacionData('');
        fetchUbicaciones();
        setOpenModalUbicacionesUpdate(false);
      }
    } catch (error) {
      setUbicacionData('');
      const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
        target: document.getElementById('modal-consultaUbi'),
      });
      setOpenModalUbicacionesUpdate(false);
    }
  };

  const addUbicación = async () => {
    try {
      const response = await axios.post(`${apiUrl}/inventario/localidades/`, {
        descripcion: newUbicacionData.descripcion,
        disponible: newUbicacionData.disponible,
        bodega_id: selectedBodega
      });
      if (response.data.ok) {
        Swal.fire({
          title: 'Ubicación creada',
          text: 'La nueva ubicación se ha creado correctamente',
          icon: 'success',
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
          target: document.getElementById('modal-consultaUbi'),
        });
        fetchUbicaciones();
        setNewUbicacionData('');
        handleCloseModalPostUbicaciones();
      }
    } catch (error) {
      setNewUbicacionData('');
      const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
        target: document.getElementById('modal-consultaUbi'),
      });
      handleCloseModalPostUbicaciones();
    }
  }

  const handleOpenModalUpdateUbicaciones = (ubicacion) => {
    setSelectedUbicacion(ubicacion);
    setUbicacionData({
      ...ubicacion,
    });
    setOpenModalUbicacionesUpdate(true);
  };

  useEffect(() => {
    // Filtra las órdenes en base al término de búsqueda y otros filtros
    let filtered = rowsUbicaciones;

    // Aplica el filtro de búsqueda
    if (searchTerm) {
        filtered = filtered.filter(ubicacion =>
          ubicacion.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) 
        );
    }

    setFilteredUbicaciones(filtered);
}, [searchTerm, rowsUbicaciones]);

  const columns = [
    { field: 'id', headerName: 'Folio', flex: 1 },
    { field: 'Nombre', headerName: 'Nombre', flex: 1 },
    { field: 'Tipo', headerName: 'Tipo', flex: 1 },
    { field: 'Neteable', headerName: 'Estado', flex: 1 },
    { field: 'activo', headerName: 'Rol ID', flex: 1 },
    { field: 'rol_id', headerName: 'Rol', flex: 1 },
    { field: 'rol_descripcion', headerName: 'Rol', flex: 1 },
    {
      field: 'actions', headerName: 'Acciones', type: 'actions', flex: 1, getActions: (params) => [
        <Tooltip title='Ver detalles' >
          <GridActionsCellItem
            icon={<EditNoteIcon />}
            sx={{ color: 'green' }}
            onClick={() => handleOpenModal(params.row)}
          />
        </Tooltip>,
        <Tooltip title='Ver ubicaciones' >
          <GridActionsCellItem
            icon={<LocationOnOutlinedIcon />}
            sx={{ color: 'blue' }}
            onClick={() => handleOpenModalUbicaciones(params.row)}
          />
        </Tooltip>
      ],

    },
  ];

  //Columnas del DataGrid de ubicaciones
  const columnsUbicaciones = [
    { field: 'id', headerName: 'Folio', flex: 1 },
    { field: 'descripcion', headerName: 'Descripción', flex: 1 },
    { field: 'disponible', headerName: 'Disponible para venta', flex: 1 },
    { field: 'bodega_id', headerName: 'Bodega ID', flex: 1 },
    { field: 'activo', headerName: 'Activo', flex: 1 },
    {
      field: 'actions', headerName: 'Acciones', type: 'actions', flex: 1, getActions: (params) => [
        <Tooltip title='Ver detalles' >
          <GridActionsCellItem
            icon={<EditNoteIcon />}
            sx={{ color: 'green' }}
            onClick={() => handleOpenModalUpdateUbicaciones(params.row)}
          />
        </Tooltip>
      ],

    },
  ];

  return (
    <div className='contenido'>
      <div className='encabezado'>
        <h1>Bodegas</h1>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '500px',
          width: 'auto',
          margin: '30px',
        }}>
        {/* Contenedor flex para el TextField y el Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center', // Para alinear ambos elementos a la misma altura
            marginBottom: '10px', // Espacio entre el formulario y el DataGrid
          }}
        >
          {/* TextField alineado a la izquierda */}
          <TextField
            id="outlined-basic"
            label="Buscar bodega"
            variant="outlined"
            style={{
              maxWidth: '300px', // Ajusta el tamaño del TextField según sea necesario
              marginRight: 'auto', // Para que el TextField ocupe todo el espacio posible
            }}
          />
          {/* Botón alineado a la derecha */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenModalPost}
            style={{
              marginLeft: 'auto', // Empuja el botón hacia la derecha
            }}
          >
            Agregar Bodega
          </Button>
        </div>
        {/* DataGrid */}
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            disableColumnResize={false}
            showCellVerticalBorder
            showColumnVerticalBorder
            getRowId={(row) => row.id}
            experimentalFeatures={{ newEditingApi: true }}
            columnVisibilityModel={{
              id: false,
              rol_id: false,
              Neteable: false,
              activo: false
            }}
          />
      </div>
      {/* Modal para editar bodega */}
      < Dialog open={openModal} onClose={handleCloseModal} >
        <DialogTitle>Editar Bodega</DialogTitle>
        <DialogContent>
          <TextField
            label={'Nombre'}
            fullWidth
            margin="normal"
            value={bodegaData.Nombre}
            onChange={(e) => setBodegaData({ ...bodegaData, Nombre: e.target.value })}
          />
          <TextField
            label={'Tipo'}
            fullWidth
            margin="normal"
            value={bodegaData.Tipo}
            onChange={(e) => setBodegaData({ ...bodegaData, Tipo: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{'Neteable'}</InputLabel>
            <Select
              value={bodegaData.Neteable}
              onChange={handleChangeNeteable}
            >
              <MenuItem value={1}>Disponible para ventas</MenuItem>
              <MenuItem value={0}>No disponible</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{'Rol'}</InputLabel>
            <Select
              value={bodegaData.rol_id}
              onChange={(e) => {
                const selectedRol = e.target.value;
                const descripcion = getRolDescripcion(selectedRol);
                setBodegaData({
                  ...bodegaData,
                  rol_id: selectedRol,
                  rol_descripcion: descripcion,
                });
              }}
            >
              <MenuItem value="">
                <em>Seleccionar rol</em>
              </MenuItem>
              {roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  {role.descripcion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{'Estatus'}</InputLabel>
            <Select
              value={bodegaData.activo}
              onChange={handleChangeActivo}
            >
              <MenuItem value={1}>Activo</MenuItem>
              <MenuItem value={0}>Inactivo</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSaveChanges} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog >
      {/* Modal para crear bodega */}
      < Dialog open={openModalPost} onClose={handleCloseModalPost} >
        <DialogTitle>Crear Bodega</DialogTitle>
        <DialogContent>
          <TextField
            label={'Nombre'}
            fullWidth
            margin="normal"
            value={newBodegaData.Nombre}
            onChange={(e) => setNewBodegaData({ ...newBodegaData, Nombre: e.target.value })}
          />
          <TextField
            label={'Tipo'}
            fullWidth
            margin="normal"
            value={newBodegaData.Tipo}
            onChange={(e) => setNewBodegaData({ ...newBodegaData, Tipo: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{'Disponible para ventas'}</InputLabel>
            <Select
              value={newBodegaData.Neteable}
              onChange={(e) => setNewBodegaData({ ...newBodegaData, Neteable: e.target.value })}
            >
              <MenuItem value={1}>Disponible para ventas</MenuItem>
              <MenuItem value={0}>No disponible</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{'Rol'}</InputLabel>
            <Select
              value={newBodegaData.rol_id} // El valor de 'rol_id' debe coincidir con los valores de los roles
              onChange={(e) => {
                const selectedRol = e.target.value;
                const descripcion = getRolDescripcion(selectedRol);
                setNewBodegaData({
                  ...newBodegaData,
                  rol_id: selectedRol,
                  rol_descripcion: descripcion, // Aquí puedes también almacenar la descripción si lo necesitas
                });
              }}
            >
              <MenuItem value="">
                <em>Seleccionar rol</em>
              </MenuItem>
              {roles.length > 0 ? (
                roles.map(role => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.descripcion}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No hay roles disponibles</MenuItem>
              )}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{'Estatus'}</InputLabel>
            <Select
              value={newBodegaData.activo}
              onChange={(e) => setNewBodegaData({ ...newBodegaData, activo: e.target.value })}
            >
              <MenuItem value={1}>Activo</MenuItem>
              <MenuItem value={0}>Inactivo</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalPost} color="primary">
            Cancelar
          </Button>
          <Button onClick={addBodega} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog >
      {/* Ventana Modal Para Consultar Ubicaciones Por bodega*/}
      <Modal id='modal-consultaUbi' open={openModalUbicaciones} onClose={handleCloseModalUbicaciones}>
        <Box sx={modalStyle}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '500px',
              width: 'auto',
              margin: '30px',
            }}>
            {/* Contenedor flex para el TextField y el Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center', // Para alinear ambos elementos a la misma altura
                marginBottom: '10px', // Espacio entre el formulario y el DataGrid
              }}
            >
              <TextField
                label="Buscador..."
                color='primary'
                focused
                sx={{ width: '20rem', marginBottom: '10px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {/* Botón alineado a la derecha */}
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenModalPostUbicacion}
                style={{
                  marginLeft: 'auto', // Empuja el botón hacia la derecha
                }}
              >
                Agregar Ubicación
              </Button>
            </div>
            {/* DataGrid */}
            <ThemeProvider theme={theme}>
              <DataGrid style={{ fontFamily: "Montserrat", fontWeight: "bold", width: 1300, height: 500 }}
                rows={filteredUbicaciones}
                columns={columnsUbicaciones}
                pageSize={5}
                showCellVerticalBorder
                showColumnVerticalBorder
                getRowId={(row) => row.id}
                experimentalFeatures={{ newEditingApi: true }}
                columnVisibilityModel={{
                  id: false,
                  disponible: false,
                  bodega_id: false,
                  activo: false
                }}
              />
            </ThemeProvider>
            <Button onClick={handleCloseModalUbicaciones} variant="contained" color="primary"
              sx={{
                marginTop: '10px',
                marginLeft: '93%'
              }}
            >Cerrar</Button>
          </div>
        </Box>
      </Modal>
      {/* Modal para crear ubicación en una bodega */}
      < Dialog open={openModalUbicacionesPost} onClose={handleCloseModalPostUbicaciones} >
        <DialogTitle>Crear Ubicación</DialogTitle>
        <DialogContent>
          <TextField
            label={'Descripción'}
            fullWidth
            margin="normal"
            value={newUbicacionData.descripcion}
            onChange={(e) => setNewUbicacionData({ ...newUbicacionData, descripcion: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{'Disponible para ventas'}</InputLabel>
            <Select
              value={newUbicacionData.disponible}
              onChange={(e) => setNewUbicacionData({ ...newUbicacionData, disponible: e.target.value })}
            >
              <MenuItem value={1}>Disponible para ventas</MenuItem>
              <MenuItem value={0}>No disponible</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalPostUbicaciones} color="primary">
            Cancelar
          </Button>
          <Button onClick={addUbicación} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog >
      {/* Modal para editar ubicación */}
      < Dialog open={openModalUbicacionesUpdate} onClose={handleCloseModalUpdateUbicaciones} >
        <DialogTitle>Editar Ubicación</DialogTitle>
        <DialogContent>
          <TextField
            label={'Descripción'}
            fullWidth
            margin="normal"
            value={ubicacionData.descripcion}
            onChange={(e) => setUbicacionData({ ...ubicacionData, descripcion: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{'Disponible para ventas'}</InputLabel>
            <Select
              value={ubicacionData.disponible}
              onChange={(e) => setUbicacionData({ ...ubicacionData, disponible: e.target.value })}
            >
              <MenuItem value={1}>Disponible para ventas</MenuItem>
              <MenuItem value={0}>No disponible</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{'Estatus'}</InputLabel>
            <Select
              value={ubicacionData.activo}
              onChange={(e) => setUbicacionData({ ...ubicacionData, activo: e.target.value })}
            >
              <MenuItem value={1}>Activo</MenuItem>
              <MenuItem value={0}>Inactivo</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalUpdateUbicaciones} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSaveChangesUbicacion} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog >
    </div>
  )
}

export default DataGridB
