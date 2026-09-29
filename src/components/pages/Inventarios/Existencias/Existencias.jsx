import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Autocomplete,
  Box,
  Button,
  GlobalStyles,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DataGridE from './DataGridE';
import CircularProgressWithLabel from './circularProgress';
import useAuthStore from '../../../../store/authStore';
import apiUrl from '../../../../config';

const FILTROS_INICIALES = {
  producto: '',
  localidad: null, // objeto { id, descripcion } completo para el Autocomplete
  cantidad_min: '',
  cantidad_max: '',
};

// Tamaño de página contra /inventario/existencias/buscar. Sin filtros el
// backend devuelve las existencias con mayor stock primero, así que la
// primera página son "las 100 existencias con más piezas". El resto se trae
// bajo demanda con "Cargar más".
const PAGE_SIZE = 100;

// Solo enteros >= 0 (sin signos, decimales ni letras). Se quitan los ceros a
// la izquierda pero se permite el "0" solo (ej. buscar existencias en cero).
const sanearEntero = (valor) => {
  const soloDigitos = String(valor).replace(/\D/g, '');
  if (soloDigitos === '') return '';
  return soloDigitos.replace(/^0+(?=\d)/, '');
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.66)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const Existencias = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localidades, setLocalidades] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  // Filtros con los que se hizo la última consulta: "Cargar más" y
  // "Actualizar" reutilizan estos (no lo que esté escrito sin buscar aún).
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);
  const [modoFiltrado, setModoFiltrado] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: false,
    producto_id: false,
    localidad_id: false,
    mlm: false,
    catalog_id: false,
    sku: false,
    inventory_id: false,
  });

  const { user } = useAuthStore();
  const esAdministrador = ['administrador'].includes(user?.rol_descripcion);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const hayFiltros = (f) =>
    Boolean(f.producto.trim() || f.localidad || f.cantidad_min !== '' || f.cantidad_max !== '');

  // Consulta paginada. `acumular` indica si la página nueva reemplaza las
  // filas actuales (búsqueda nueva) o se agrega al final ("Cargar más").
  const fetchExistencias = useCallback(async (filtrosConsulta, paginaSolicitada, acumular) => {
    if (acumular) setCargandoMas(true);
    else setLoading(true);

    try {
      const params = { page: paginaSolicitada, pageSize: PAGE_SIZE };
      if (filtrosConsulta.producto.trim()) params.producto = filtrosConsulta.producto.trim();
      if (filtrosConsulta.localidad) params.localidad_id = filtrosConsulta.localidad.id;
      if (filtrosConsulta.cantidad_min !== '') params.cantidad_min = filtrosConsulta.cantidad_min;
      if (filtrosConsulta.cantidad_max !== '') params.cantidad_max = filtrosConsulta.cantidad_max;

      const response = await axios.get(`${apiUrl}/inventario/existencias/buscar`, {
        ...getAuthHeaders(),
        params,
      });

      const { data, total: totalRecibido } = response.data;
      const lista = Array.isArray(data) ? data : [];
      setRows((prev) => (acumular ? [...prev, ...lista] : lista));
      setTotal(Number(totalRecibido) || 0);
      setPage(paginaSolicitada);
      setFiltrosAplicados(filtrosConsulta);
      setModoFiltrado(hayFiltros(filtrosConsulta));
    } catch (error) {
      console.error(error);
      if (!acumular) {
        setRows([]);
        setTotal(0);
      }
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron consultar las existencias.',
        icon: 'error',
        timer: 5000,
        showCloseButton: true,
      });
    } finally {
      setLoading(false);
      setCargandoMas(false);
    }
  }, []);

  const fetchLocalidades = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/inventario/localidades`);
      setLocalidades(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchExistencias(FILTROS_INICIALES, 1, false);
    fetchLocalidades();
  }, [fetchExistencias, fetchLocalidades]);

  const handleBuscar = () => fetchExistencias(filtros, 1, false);

  const handleLimpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    fetchExistencias(FILTROS_INICIALES, 1, false);
  };

  const handleActualizar = () => fetchExistencias(filtrosAplicados, 1, false);

  const handleCargarMas = () => fetchExistencias(filtrosAplicados, page + 1, true);

  const handleEnter = (e) => {
    if (e.key === 'Enter') handleBuscar();
  };

  const handleCantidadChange = (campo) => (e) => {
    const valor = sanearEntero(e.target.value);
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  // ---------- Carga masiva de existencias (solo administrador) ----------
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setSubiendoArchivo(true);
    setProgress(0);

    // Progreso simulado: no llega a 100 hasta que responde el backend.
    const interval = setInterval(() => {
      setProgress((old) => (old >= 95 ? 95 : old + 5));
    }, 300);

    try {
      const response = await axios.post(
        `${apiUrl}/inventario/existencias/ajustarExistencias`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setSubiendoArchivo(false), 300);

      if (response.data?.ok) {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Las existencias se han ajustado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });
        fetchExistencias(filtrosAplicados, 1, false);
      }
    } catch (error) {
      clearInterval(interval);
      setSubiendoArchivo(false);
      Swal.fire({
        title: '¡Error!',
        text: error.response?.data?.message || 'Hubo un problema al cargar el archivo Excel.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const hayMasResultados = rows.length < total;

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Mismo fix que en TableOrdenes.jsx / TransaccionesI.jsx: el panel de
          Columnas/Filtros del DataGrid se renderiza en un Popper propio sin
          z-index alto. */}
      <GlobalStyles
        styles={(theme) => ({
          '.MuiDataGrid-panel': { zIndex: theme.zIndex.modal + 100 },
        })}
      />

      {/* ---------- Barra de acciones ---------- */}
      <Paper
        elevation={2}
        sx={{
          p: 1.5,
          borderRadius: 3,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          <Typography
            variant="subtitle1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, mr: 1 }}
          >
            <WarehouseOutlinedIcon color="primary" /> Existencias
          </Typography>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
            {modoFiltrado
              ? `${total} resultado(s) para tu búsqueda`
              : `${total} existencias en total`}
          </Typography>
          {esAdministrador && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Tooltip title="Ajusta existencias de forma masiva desde un archivo .xlsx o .csv." arrow>
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    onClick={handleUploadClick}
                    disabled={subiendoArchivo}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Cargar Existencias
                  </Button>
                </span>
              </Tooltip>
            </>
          )}
          <Tooltip title="Vuelve a consultar los datos." arrow>
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleActualizar}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Actualizar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      {/* ---------- Filtros ---------- */}
      <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          {!modoFiltrado && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Mostrando las existencias con mayor stock ({PAGE_SIZE} por página). Usa los
              filtros para buscar en todo el inventario.
            </Typography>
          )}
          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start">
            <TextField
              label="Producto (MLM, catálogo, título, SKU o ML)"
              size="small"
              value={filtros.producto}
              onChange={(e) => setFiltros((prev) => ({ ...prev, producto: e.target.value }))}
              onKeyDown={handleEnter}
              sx={{ minWidth: 280, flex: 1 }}
            />
            <Autocomplete
              size="small"
              options={localidades}
              value={filtros.localidad}
              onChange={(e, newValue) => setFiltros((prev) => ({ ...prev, localidad: newValue }))}
              getOptionLabel={(option) => option?.descripcion || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label="Ubicación" />}
              sx={{ minWidth: 220 }}
            />
            <TextField
              label="Cantidad desde"
              size="small"
              type="text"
              value={filtros.cantidad_min}
              onChange={handleCantidadChange('cantidad_min')}
              onKeyDown={handleEnter}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              sx={{ width: 150 }}
            />
            <TextField
              label="Cantidad hasta"
              size="small"
              type="text"
              value={filtros.cantidad_max}
              onChange={handleCantidadChange('cantidad_max')}
              onKeyDown={handleEnter}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              helperText="Mismo valor en ambos = cantidad exacta"
              sx={{ width: 150 }}
            />

            <Stack direction="row" gap={1} sx={{ ml: { sm: 'auto' } }}>
              <Tooltip title="Quita todos los filtros y vuelve al listado por defecto." arrow>
                <span>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    startIcon={<RestartAltIcon />}
                    onClick={handleLimpiarFiltros}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Limpiar
                  </Button>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                size="small"
                startIcon={<SearchIcon />}
                onClick={handleBuscar}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Buscar
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* ---------- Resultados ---------- */}
      <DataGridE
        rows={rows}
        loading={loading}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={setColumnVisibilityModel}
      />

      {hayMasResultados && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleCargarMas}
            disabled={cargandoMas || loading}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {cargandoMas ? 'Cargando…' : `Cargar más (${rows.length} de ${total})`}
          </Button>
        </Box>
      )}

      {subiendoArchivo && (
        <div style={overlayStyle}>
          <CircularProgressWithLabel value={progress} />
        </div>
      )}
    </Box>
  );
};

export default Existencias;
