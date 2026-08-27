import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Tooltip,
  CircularProgress,
  Modal,
  Typography,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Envios.css';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';

// ---------------------------------------------------------------------------
// Configuración estática de estatus: color e ícono por cada valor del enum
// `estatus` de la tabla `envios`. Centralizado aquí para no repetir lógica
// de estilos en la columna de la grilla ni en el modal.
// ---------------------------------------------------------------------------
const ESTATUS_CONFIG = {
  abierto: { label: 'Abierto', color: '#1e88e5', bg: '#e3f2fd' },
  en_proceso: { label: 'En proceso', color: '#f9a825', bg: '#fff8e1' },
  en_camino: { label: 'En camino', color: '#8e24aa', bg: '#f3e5f5' },
  finalizado: { label: 'Finalizado', color: '#2e7d32', bg: '#e8f5e9' },
};

const ESTATUS_OPCIONES = Object.keys(ESTATUS_CONFIG);

const formatearFecha = (valor, { conHora = false } = {}) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const EstatusChip = ({ estatus }) => {
  const config = ESTATUS_CONFIG[estatus] || { label: estatus || 'Sin estatus', color: '#616161', bg: '#eeeeee' };
  return (
    <Chip
      size="small"
      label={config.label}
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 700,
        fontSize: '0.72rem',
        letterSpacing: 0.2,
      }}
    />
  );
};

// Textos en español para la grilla. Se definen a mano en lugar de usar
// el paquete de localización `esES` para no depender de una versión
// específica de @mui/x-data-grid.
const LOCALE_TEXT_ES = {
  noRowsLabel: 'No se encontraron envíos',
  footerRowSelected: (count) => `${count} fila${count !== 1 ? 's' : ''} seleccionada${count !== 1 ? 's' : ''}`,
  footerTotalRows: 'Total de filas:',
  columnMenuLabel: 'Menú',
  columnMenuShowColumns: 'Mostrar columnas',
  columnMenuFilter: 'Filtrar',
  columnMenuHideColumn: 'Ocultar',
  columnMenuUnsort: 'Quitar orden',
  columnMenuSortAsc: 'Ordenar ascendente',
  columnMenuSortDesc: 'Ordenar descendente',
  toolbarColumns: 'Columnas',
  toolbarFilters: 'Filtros',
  toolbarDensity: 'Densidad',
  toolbarDensityCompact: 'Compacta',
  toolbarDensityStandard: 'Estándar',
  toolbarDensityComfortable: 'Cómoda',
  toolbarExport: 'Exportar',
  toolbarExportCSV: 'Descargar como CSV',
  MuiTablePagination: {
    labelRowsPerPage: 'Filas por página',
    labelDisplayedRows: ({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`,
  },
};

const FORM_INICIAL = {
  descripcion: '',
  fechaProgramada: null,
  estatus: 'abierto',
  numeroMercadoLibre: '',
  folioInterno: '',
};

const Envios = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  // --- Modal de creación / edición ------------------------------------
  const [openModal, setOpenModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [envioEnEdicion, setEnvioEnEdicion] = useState(null); // id del envío que se edita
  const [form, setForm] = useState(FORM_INICIAL);
  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: true,
    folio_interno: true,
    descripcion: true,
    estatus: true,
  });

  const apiUrl =
    process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;

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
  }, [apiUrl]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEnvios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  // --- Data fetching -----------------------------------------------------
  // Mismo endpoint que la versión anterior: no se modifica el contrato.
  const fetchEnvios = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/empaque/fetchEnvios`);
      if (response.data.data && Array.isArray(response.data.data)) {
        setData(response.data.data);
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

  // --- Filtro de búsqueda (cliente) --------------------------------------
  const enviosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const termino = searchTerm.trim().toLowerCase();
    return data.filter((envio) => {
      const id = String(envio.id ?? '');
      const folio = String(envio.folio_interno ?? '');
      const descripcion = (envio.descripcion ?? '').toLowerCase();
      const estatus = (ESTATUS_CONFIG[envio.estatus]?.label ?? envio.estatus ?? '').toLowerCase();
      const numeroML = String(envio.numero_mercado_libre ?? '');
      return (
        id.includes(termino) ||
        folio.includes(termino) ||
        descripcion.includes(termino) ||
        estatus.includes(termino) ||
        numeroML.includes(termino)
      );
    });
  }, [searchTerm, data]);

  // --- Helpers de formulario ----------------------------------------------
  const validarFormulario = () => {
    const nuevosErrores = {
      descripcion: !form.descripcion.trim(),
      folioInterno: !form.folioInterno,
      fechaProgramada: !form.fechaProgramada
    };
    setErrors(nuevosErrores);
    return !Object.values(nuevosErrores).some(Boolean);
  };

  const handleAbrirCreacion = () => {
    setModoEdicion(false);
    setEnvioEnEdicion(null);
    setForm(FORM_INICIAL);
    setErrors({});
    setOpenModal(true);
  };

  const handleAbrirEdicion = (envio) => {
    setModoEdicion(true);
    setEnvioEnEdicion(envio.id);
    setForm({
      descripcion: envio.descripcion || '',
      folioInterno: envio.folio_interno || '',
      fechaProgramada: envio.fecha_programada ? new Date(envio.fecha_programada) : null,
      estatus: envio.estatus || 'abierto',
      numeroMercadoLibre: envio.numero_mercado_libre ?? ''
    });
    setErrors({});
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setForm(FORM_INICIAL);
    setErrors({});
  };

  // --- Crear / editar envío ------------------------------------------------
  const handleGuardarEnvio = async () => {
    if (!validarFormulario()) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Completa los campos obligatorios antes de continuar.',
        icon: 'warning',
        target: document.getElementById('modal-focus'),
      });
      return;
    }

    const soloFecha = form.fechaProgramada.toISOString().split('T')[0];
    setGuardando(true);

    try {
      if (modoEdicion) {
        // NOTA: este endpoint es nuevo y aún no existe en el backend actual.
        // Se deja preparado para que el equipo de backend lo implemente
        // (PUT /empaque/modificarEnvio/:id) sin tocar los endpoints existentes.
        await axios.put(`${apiUrl}/empaque/modificarEnvio/${envioEnEdicion}`, {
          descripcion: form.descripcion,
          fecha_programada: soloFecha,
          numero_mercado_libre: form.numeroMercadoLibre || null,
          folio_interno: form.folioInterno,
        });
        Swal.fire({ title: 'Envío actualizado', icon: 'success', timer: 2000, showConfirmButton: false });
      } else {
        await axios.post(`${apiUrl}/empaque/nuevoEnvio`, {
          descripcion: form.descripcion,
          folio_interno: form.folioInterno,
          fecha_programada: soloFecha
        });
        Swal.fire({ title: 'Envío creado', icon: 'success', timer: 2000, showConfirmButton: false });
      }
      await fetchEnvios();
      handleCloseModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ocurrió un error al guardar el envío';
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'warning',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
        target: document.getElementById('modal-focus'),
      });
    } finally {
      setGuardando(false);
    }
  };

  // --- Acciones de la grilla ------------------------------------------------
  const handleDetallesEnvio = (envio) => {
    navigate(`/empaque/${envio.id}/detalle`, {
      state: {
        estatusEnvio: envio.estatus,
        descripcionEnvio: envio.descripcion,
        folioInternoEnvio: envio.folio_interno,
      },
    });
  };

  const cambiarEstatusAbiertoEnvio = async (envio) => {
    const confirmacion = await Swal.fire({
      title: '¿Reabrir este envío?',
      text: `El envío #${envio.id} volverá al estatus "Abierto".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reabrir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e88e5',
    });
    if (!confirmacion.isConfirmed) return;

    try {
      // Mismo endpoint que la versión anterior.
      const response = await axios.put(`${apiUrl}/empaque/estatusAbiertoEnvio/${envio.id}`, {});
      if (response.data.ok) {
        await fetchEnvios();
        Swal.fire({ title: 'Envío reabierto', icon: 'success', timer: 1800, showConfirmButton: false });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'No se pudo reabrir el envío';
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'warning',
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
        target: document.getElementById('modal-focus'),
      });
    }
  };

  // --- Toolbar personalizada -------------------------------------------------
  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ px: 1, py: 1 }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport csvOptions={{ fileName: 'envios', utf8WithBom: true }} />
    </GridToolbarContainer>
  );

  const puedeVerBotonProgreso = user && (
    user.rol_descripcion === 'administrador' ||
    (user.rol_descripcion === 'Produccion' && user.permisos === 'supervisor') ||
    user.rol_descripcion === 'Produccion'
  );

  // --- Definición de columnas ------------------------------------------------
  const columns = [
    { field: 'id', headerName: '# Envío', type: 'number', width: 100, align: 'left', headerAlign: 'left' },
    {
      field: 'folio_interno',
      headerName: 'Folio interno',
      type: 'string',
      width: 130,
      align: 'left',
      headerAlign: 'left',
      renderCell: ({ value }) => value ?? <em style={{ color: '#9e9e9e' }}>Sin asignar</em>,
    },
    { field: 'descripcion', headerName: 'Descripción', flex: 1.4, minWidth: 200, headerAlign: 'left' },
    {
      field: 'fecha_creacion',
      headerName: 'Fecha creación',
      flex: 0.8,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value) => (value ? new Date(value) : null),
      renderCell: ({ value }) => formatearFecha(value),
    },
    {
      field: 'fecha_programada',
      headerName: 'Fecha programada',
      flex: 0.8,
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value) => (value ? new Date(value) : null),
      renderCell: ({ value }) => formatearFecha(value),
    },
    {
      field: 'fecha_finalizado',
      headerName: 'Fecha finalización',
      flex: 0.8,
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value) => (value ? new Date(value) : null),
      renderCell: ({ value }) => (value ? formatearFecha(value) : <em style={{ color: '#9e9e9e' }}>Pendiente</em>),
    },
    {
      field: 'numero_mercado_libre',
      headerName: '# Mercado Libre',
      flex: 0.7,
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ value }) => (value ? value : <em style={{ color: '#9e9e9e' }}>Sin asignar</em>),
    },
    {
      field: 'estatus',
      headerName: 'Estatus',
      flex: 0.6,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ value }) => <EstatusChip estatus={value} />,
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      type: 'actions',
      minWidth: 170,
      align: 'right',
      getActions: (params) => [
        <GridActionsCellItem
          key={`editar-${params.row.id}`}
          icon={
            <Tooltip title="Editar envío">
              <EditOutlinedIcon sx={{ color: '#1e88e5' }} />
            </Tooltip>
          }
          label="Editar"
          onClick={() => handleAbrirEdicion(params.row)}
        />,
        <GridActionsCellItem
          key={`tarimas-${params.row.id}`}
          icon={
            <Tooltip title="Tarimas y cajas">
              <VisibilityOutlinedIcon sx={{ color: '#2e7d32' }} />
            </Tooltip>
          }
          label="Tarimas"
          onClick={() => handleDetallesEnvio(params.row)}
        />,
        <GridActionsCellItem
          key={`progreso-${params.row.id}`}
          icon={
            <Tooltip
              title={
                puedeVerBotonProgreso
                  ? "Progreso de empaque"
                  : "No tienes permisos para ver el progreso"
              }
            >
              <DashboardCustomizeOutlinedIcon
                sx={{
                  color: puedeVerBotonProgreso
                    ? '#2e7d32'
                    : '#bdbdbd',
                }}
              />
            </Tooltip>
          }
          label="Progreso"
          disabled={!puedeVerBotonProgreso}
          onClick={() => {
            navigate(
              `/envios/detalle/${params.row.id}/progresoEmpaque`,
              {
                state: {
                  descripcionEnvio: params.row.descripcion,
                  folioInternoEnvio: params.row.folio_interno,
                },
              }
            );
          }}
        />,
        <GridActionsCellItem
          key={`reabrir-${params.row.id}`}
          icon={
            <Tooltip title="Reabrir envío">
              <AutorenewIcon
                sx={{ color: params.row.estatus === 'en_proceso' || params.row.estatus === 'abierto' ? '#bdbdbd' : '#f9a825' }}
              />
            </Tooltip>
          }
          label="Reabrir"
          onClick={() => cambiarEstatusAbiertoEnvio(params.row)}
          disabled={params.row.estatus === 'en_proceso' || params.row.estatus === 'abierto'}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, fontFamily: 'Montserrat' }}>
      {/* Encabezado */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <LocalShippingOutlinedIcon sx={{ color: '#1e88e5', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#1a237e' }}>
          Envíos
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: '#78909c', mb: 3 }}>
        Administra la creación, edición y seguimiento de los envíos.
      </Typography>

      {/* Barra de herramientas: búsqueda + acción principal */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar por folio, descripción o estatus..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: '32rem' }, backgroundColor: 'white', borderRadius: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#90a4ae' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAbrirCreacion}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
        >
          Nuevo envío
        </Button>
      </Paper>

      {/* Grilla de datos */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <Box sx={{ height: 560, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Cargando envíos...
                </Typography>
              </Stack>
            </Box>
          ) : (
            <DataGrid
              localeText={LOCALE_TEXT_ES}
              sx={{
                border: 'none',
                fontFamily: 'Montserrat',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f7fa',
                  fontWeight: 700,
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f1f7fe',
                },
              }}
              rows={enviosFiltrados}
              columns={columns}
              getRowId={(row) => row.id}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
              density="comfortable"
              slots={{ toolbar: CustomToolbar }}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
            />
          )}
        </Box>
      </Paper>

      {/* Modal de creación / edición */}
      <Modal
        id="modal-focus"
        open={openModal}
        onClose={guardando ? undefined : handleCloseModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 1.5, sm: 3 },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 520,
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            bgcolor: '#fff',
            borderRadius: 4,
            boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
            outline: 'none',
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              px: { xs: 2.5, sm: 3.5 },
              py: 2.5,
              borderBottom: '1px solid #e2e8f0',
              background:
                modoEdicion
                  ? 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)'
                  : 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
            }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: modoEdicion ? '#dbeafe' : '#dcfce7',
                      color: modoEdicion ? '#2563eb' : '#16a34a',
                    }}
                  >
                    {modoEdicion ? (
                      <EditOutlinedIcon />
                    ) : (
                      <Inventory2OutlinedIcon />
                    )}
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Montserrat',
                        fontWeight: 800,
                        color: '#0f172a',
                        lineHeight: 1.2,
                      }}
                    >
                      {modoEdicion ? 'Editar envío' : 'Nuevo envío'}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748b',
                        fontWeight: 500,
                      }}
                    >
                      {modoEdicion
                        ? `Envío #${envioEnEdicion}`
                        : 'Registro de un nuevo envío'}
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748b',
                    mt: 2,
                    lineHeight: 1.6,
                  }}
                >
                  {modoEdicion
                    ? 'Actualiza la información y configuración del envío.'
                    : 'Completa la información para abrir un nuevo envío.'}
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={handleCloseModal}
                disabled={guardando}
                sx={{
                  mt: -0.5,
                  bgcolor: '#fff',
                  border: '1px solid #e2e8f0',
                  '&:hover': {
                    bgcolor: '#fef2f2',
                    color: '#dc2626',
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* CONTENIDO */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Stack spacing={2.5}>
              {/* DESCRIPCIÓN */}
              <TextField
                fullWidth
                label="Descripción"
                placeholder="Ej. Envío de pedidos semana 32"
                variant="outlined"
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    descripcion: e.target.value,
                  }))
                }
                error={!!errors.descripcion}
                helperText={
                  errors.descripcion
                    ? 'La descripción es obligatoria'
                    : 'Usa un nombre fácil de identificar.'
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionOutlinedIcon
                        sx={{ color: '#94a3b8' }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#64748b',
                      },
                    },
                    '&.Mui-focused': {
                      boxShadow:
                        '0 0 0 4px rgba(37, 99, 235, 0.10)',
                    },
                  },
                }}
              />
              {/* Folio interno */}
              <TextField
                fullWidth
                label="Folio interno"
                placeholder="Ej. 0311"
                value={form.folioInterno ?? ''}
                onChange={(e) => {
                  const valor = e.target.value;

                  // Solo números
                  if (/^\d*$/.test(valor)) {
                    setForm((f) => ({
                      ...f,
                      folioInterno: valor,
                    }));
                  }
                }}
                error={!!errors.folioInterno}
                helperText={
                  errors.folioInterno
                    ? errors.folioInterno
                    : 'Puedes comenzar con cero. Ejemplo: 0311.'
                }
                inputProps={{
                  inputMode: 'numeric',
                  maxLength: 20,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ConfirmationNumberOutlinedIcon
                        sx={{ color: '#94a3b8' }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',

                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#64748b',
                      },
                    },

                    '&.Mui-focused': {
                      boxShadow:
                        '0 0 0 4px rgba(37, 99, 235, 0.10)',
                    },
                  },

                  '& .MuiInputLabel-root': {
                    bgcolor: '#fff',
                    px: 0.5,
                  },
                }}
              />
              {/* FECHA */}
              <FormControl fullWidth error={!!errors.fechaProgramada}>
                <Box
                  sx={{
                    position: 'relative',
                    height: 56,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: errors.fechaProgramada
                      ? '#d32f2f'
                      : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                    gap: 1,
                    bgcolor: '#fff',
                    transition: 'all 0.2s ease',

                    '&:hover': {
                      borderColor: '#64748b',
                    },

                    '&:focus-within': {
                      borderColor: '#2563eb',
                      boxShadow:
                        '0 0 0 4px rgba(37, 99, 235, 0.10)',
                    },
                  }}
                >
                  <EventOutlinedIcon
                    sx={{
                      color: errors.fechaProgramada
                        ? '#d32f2f'
                        : '#94a3b8',
                      flexShrink: 0,
                    }}
                  />

                  <DatePicker
                    selected={form.fechaProgramada}
                    onChange={(date) =>
                      setForm((f) => ({
                        ...f,
                        fechaProgramada: date,
                      }))
                    }
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    maxDate={
                      new Date(
                        new Date().setDate(
                          new Date().getDate() + 90
                        )
                      )
                    }
                    placeholderText="Selecciona una fecha"
                    className="datepicker-custom"
                    wrapperClassName="datepicker-wrapper"
                    popperPlacement="bottom-start"
                    popperProps={{
                      strategy: 'fixed',
                    }}
                    popperClassName="datepicker-popper"
                    portalId="datepicker-portal"
                    showPopperArrow={false}
                    isClearable={false}
                  />

                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: -9,
                      left: 40,
                      px: 0.5,
                      bgcolor: '#fff',
                      color:
                        errors.fechaProgramada
                          ? '#d32f2f'
                          : '#64748b',
                      fontWeight: 600,
                      zIndex: 1,
                    }}
                  >
                    Fecha programada
                  </Typography>
                </Box>

                {errors.fechaProgramada && (
                  <FormHelperText sx={{ ml: 1.75 }}>
                    La fecha programada es obligatoria
                  </FormHelperText>
                )}
              </FormControl>

              {/* CAMPOS SOLO EN EDICIÓN */}
              {modoEdicion && (
                <>
                  <Divider sx={{ borderColor: '#e2e8f0' }} />

                  <Typography
                    variant="overline"
                    sx={{
                      color: '#64748b',
                      fontWeight: 800,
                      letterSpacing: 1,
                      mb: -1,
                    }}
                  >
                    CONFIGURACIÓN DEL ENVÍO
                  </Typography>

                  {/* NÚMERO MERCADO LIBRE */}
                  <TextField
                    fullWidth
                    label="Número Mercado Libre"
                    placeholder="Opcional"
                    type="number"
                    value={form.numeroMercadoLibre}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        numeroMercadoLibre: e.target.value,
                      }))
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Inventory2OutlinedIcon
                            sx={{ color: '#94a3b8' }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Ingresa el número de envío asociado, si aplica."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,

                        '&.Mui-focused': {
                          boxShadow:
                            '0 0 0 4px rgba(37, 99, 235, 0.10)',
                        },
                      },

                      '& .MuiInputLabel-root': {
                        bgcolor: '#fff',
                        px: 0.5,
                      },
                    }}
                  />
                </>
              )}
            </Stack>

            {/* FOOTER */}
            <Divider
              sx={{
                mt: 3.5,
                mb: 2.5,
                borderColor: '#e2e8f0',
              }}
            />

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              justifyContent="flex-end"
              spacing={1.5}
            >
              <Button
                onClick={handleCloseModal}
                disabled={guardando}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#64748b',
                  px: 2.5,
                }}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleGuardarEnvio}
                variant="contained"
                color={modoEdicion ? 'primary' : 'success'}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  minWidth: 165,
                  borderRadius: 2,
                  boxShadow: 'none',

                  '&:hover': {
                    boxShadow:
                      '0 8px 20px rgba(37, 99, 235, 0.25)',
                  },
                }}
                disabled={guardando}
                startIcon={
                  guardando ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : null
                }
              >
                {guardando
                  ? 'Guardando...'
                  : modoEdicion
                    ? 'Guardar cambios'
                    : 'Abrir envío'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Modal>
      <div id="datepicker-portal" />
    </Box>
  );
};

export default Envios;