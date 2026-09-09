import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  GlobalStyles,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DataGridTInventario from './DataGridTInventario';
import apiUrl from '../../../../config';

const TIPOS_TRANSACCION = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'transferencia_entrada', label: 'Transferencia (entrada)' },
  { value: 'transferencia_salida', label: 'Transferencia (salida)' },
];

const FILTROS_INICIALES = {
  producto: '',
  localidad: null, // objeto { id, descripcion } completo para el Autocomplete
  fecha_inicio: '',
  fecha_fin: '',
  usuario: '',
  tipos: [],
  orden_id: '',
};

// Tamaño de página usado contra /inventario/transacciones/buscar. Con esto
// y el botón "Cargar más" se evita traer de golpe los 52k+ registros que
// puede llegar a tener la tabla.
const PAGE_SIZE_BUSQUEDA = 100;

// Fecha de hoy en formato YYYY-MM-DD (zona horaria del navegador de quien
// consulta). Esta pantalla es solo historial — no puede haber transacciones
// con fecha futura — así que se usa como tope máximo en "Fecha desde" y
// "Fecha hasta".
const getHoyISO = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TransaccionesI = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localidades, setLocalidades] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [modoFiltrado, setModoFiltrado] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    transaccion_id: false,
    sku: false,
    inventory_id: false,
    producto_id: false,
    localidad_id: false,
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  // Listado principal: los últimos 100 movimientos (ver get_transacciones en
  // el backend). Es la vista por defecto, rápida, sin filtros.
  const fetchDefault = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiUrl}/inventario/transacciones`,
        getAuthHeaders()
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(data);
      setTotal(data.length);
      setModoFiltrado(false);
      setPage(1);
    } catch (error) {
      console.error(error);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Búsqueda con filtros contra /inventario/transacciones/buscar, paginada
  // en el servidor. `acumular` controla si la página nueva reemplaza las
  // filas actuales (nueva búsqueda) o se agrega al final ("Cargar más").
  const fetchFiltrado = useCallback(
    async (paginaSolicitada, acumular) => {
      if (!acumular) setLoading(true);
      else setCargandoMas(true);

      try {
        const params = { page: paginaSolicitada, pageSize: PAGE_SIZE_BUSQUEDA };
        if (filtros.producto) params.producto = filtros.producto;
        if (filtros.localidad) params.localidad_id = filtros.localidad.id;
        if (filtros.fecha_inicio) params.fecha_inicio = filtros.fecha_inicio;
        if (filtros.fecha_fin) params.fecha_fin = filtros.fecha_fin;
        if (filtros.usuario) params.usuario = filtros.usuario;
        if (filtros.tipos.length) params.tipo = filtros.tipos.join(',');
        if (filtros.orden_id) params.orden_id = filtros.orden_id;

        const response = await axios.get(`${apiUrl}/inventario/transacciones/buscar`, {
          ...getAuthHeaders(),
          params,
        });

        const { data, total: totalRecibido } = response.data;
        setRows((prev) => (acumular ? [...prev, ...data] : data));
        setTotal(totalRecibido);
        setModoFiltrado(true);
        setPage(paginaSolicitada);
      } catch (error) {
        console.error(error);
        if (!acumular) {
          setRows([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setCargandoMas(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtros]
  );

  const fetchLocalidades = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/inventario/localidades`);
      setLocalidades(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchDefault();
    fetchLocalidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuscar = () => {
    fetchFiltrado(1, false);
  };

  const handleLimpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    fetchDefault();
  };

  const handleActualizar = () => {
    if (modoFiltrado) fetchFiltrado(1, false);
    else fetchDefault();
  };

  const handleCargarMas = () => {
    fetchFiltrado(page + 1, true);
  };

  // Solo enteros positivos: se descartan letras, signos y ceros a la
  // izquierda, así "0", "-5" o "3.5" nunca llegan a filtros.orden_id.
  const handleOrdenIdChange = (e) => {
    const soloDigitos = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
    setFiltros((prev) => ({ ...prev, orden_id: soloDigitos }));
  };

  const handleTipoChange = (e) => {
    const { value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      tipos: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  // Bloquea cualquier fecha futura en los dos calendarios, tanto si la
  // eligen del picker (max en inputProps) como si la escriben/pegan a mano
  // (el navegador no siempre respeta `max` con teclado, así que además se
  // recorta aquí).
  const hoyISO = getHoyISO();

  const handleFechaInicioChange = (e) => {
    const valor = e.target.value;
    setFiltros((prev) => ({ ...prev, fecha_inicio: valor > hoyISO ? hoyISO : valor }));
  };

  const handleFechaFinChange = (e) => {
    const valor = e.target.value;
    setFiltros((prev) => ({ ...prev, fecha_fin: valor > hoyISO ? hoyISO : valor }));
  };

  const hayMasResultados = modoFiltrado && rows.length < total;

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Mismo fix que en TableOrdenes.jsx: el panel de Columnas/Filtros del
          DataGrid se renderiza en un Popper propio sin z-index alto. */}
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
            <Inventory2OutlinedIcon color="primary" /> Transacciones de Inventario
          </Typography>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          {modoFiltrado && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
              {total} resultado(s) para tu búsqueda
            </Typography>
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
              Mostrando los 100 movimientos más recientes. Usa los filtros para buscar en todo
              el historial.
            </Typography>
          )}
          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start">
            <TextField
              label="Producto (SKU, ML, MLM o título)"
              size="small"
              value={filtros.producto}
              onChange={(e) => setFiltros((prev) => ({ ...prev, producto: e.target.value }))}
              sx={{ minWidth: 240, flex: 1 }}
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
              label="# Orden de bodega"
              size="small"
              type="text"
              inputMode="numeric"
              value={filtros.orden_id}
              onChange={handleOrdenIdChange}
              inputProps={{ pattern: '[0-9]*' }}
              helperText="Solo números enteros positivos"
              sx={{ minWidth: 180 }}
            />
            <TextField
              label="Usuario"
              size="small"
              value={filtros.usuario}
              onChange={(e) => setFiltros((prev) => ({ ...prev, usuario: e.target.value }))}
              sx={{ minWidth: 160 }}
            />
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start">
            <TextField
              label="Fecha desde"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filtros.fecha_inicio}
              onChange={handleFechaInicioChange}
              inputProps={{ max: hoyISO }}
              sx={{ minWidth: 170 }}
            />
            <TextField
              label="Fecha hasta"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filtros.fecha_fin}
              onChange={handleFechaFinChange}
              inputProps={{ max: hoyISO }}
              sx={{ minWidth: 170 }}
            />
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel id="tipo-transaccion-label">Tipo de transacción</InputLabel>
              <Select
                labelId="tipo-transaccion-label"
                multiple
                value={filtros.tipos}
                onChange={handleTipoChange}
                input={<OutlinedInput label="Tipo de transacción" />}
                renderValue={(selected) => (
                  <Stack direction="row" gap={0.5} flexWrap="wrap">
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        size="small"
                        label={TIPOS_TRANSACCION.find((t) => t.value === value)?.label || value}
                      />
                    ))}
                  </Stack>
                )}
              >
                {TIPOS_TRANSACCION.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    <Checkbox checked={filtros.tipos.indexOf(tipo.value) > -1} />
                    <ListItemText primary={tipo.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
      <DataGridTInventario
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
            disabled={cargandoMas}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {cargandoMas ? 'Cargando…' : `Cargar más (${rows.length} de ${total})`}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default TransaccionesI;
