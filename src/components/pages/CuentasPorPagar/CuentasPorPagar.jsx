import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  GlobalStyles,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import AddIcon from "@mui/icons-material/Add";

import { handleApiError } from "../../../helpers/apiErrorHandler";
import { swalSuccess } from "../../../helpers/sweetAlert";
import apiUrl from "../../../config";
import RegistrarPagoDialog from "./RegistrarPagoDialog";
import DetallePagoDialog from "./DetallePagoDialog";
import MovimientosFacturaDialog from "./MovimientosFacturaDialog";
import TerminosProveedorDialog from "./TerminosProveedorDialog";
import NotaCreditoDialog from "./NotaCreditoDialog";
import DetalleNotaDialog from "./DetalleNotaDialog";
import {
  chipSuaveSx,
  ESTATUS_PAGO,
  FILTROS_FACTURA,
  FILTROS_NOTAS,
  fmtFecha,
  fmtFechaHora,
  fmtMoneda,
  getAuthHeaders,
  getEstadoFactura,
  getEstatusNota,
  getEstatusPago,
  getMetodoPago,
  getUsuarioSesion,
  METODOS_PAGO,
  hoyMexico,
  nombreFactura,
  puedeEscribirCxP,
  sumarDias,
} from "./cxpUtils";

// ---------------------------------------------------------------------
// Constantes de grids (estilo Aphelios)
// ---------------------------------------------------------------------
const GRID_HEIGHT = 520;
const PAGE_SIZE_OPTIONS = [100];
const PAGINACION_INICIAL = { pagination: { paginationModel: { pageSize: 100, page: 0 } } };
const LOCALE_TEXT_GRID = {
  toolbarColumns: "Columnas",
  toolbarDensity: "Densidad",
  toolbarExport: "Exportar",
  toolbarFilters: "Filtros",
  filterPanelOperator: "Operador",
  toolbarFiltersTooltipHide: "Ocultar filtros",
  toolbarFiltersTooltipShow: "Mostrar filtros",
  footerTotalVisibleRows: (visibleCount, totalCount) => `${visibleCount} de ${totalCount}`,
  footerPaginationRowsPerPage: "Filas por página",
};
const gridSx = {
  fontFamily: "Montserrat",
  borderRadius: 2,
  "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f7fa", fontWeight: "bold", fontSize: 13 },
  "& .MuiDataGrid-columnHeader": { backgroundColor: "#f5f7fa" },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
  "& .MuiDataGrid-cell": { borderBottom: "1px solid #eee", fontSize: 13, display: "flex", alignItems: "center" },
  "& .MuiDataGrid-row:hover": { backgroundColor: "#f9fafb" },
};
const gridComunProps = {
  showCellVerticalBorder: true,
  showColumnVerticalBorder: true,
  disableRowSelectionOnClick: true,
  hideFooterSelectedRowCount: true,
  density: "compact",
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  initialState: PAGINACION_INICIAL,
  slots: { toolbar: GridToolbar },
  sx: gridSx,
};
const slotPropsGrid = (archivo) => ({
  toolbar: { csvOptions: { fileName: archivo, utf8WithBom: true } },
  loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" },
});
const botonSx = { borderRadius: 2, textTransform: "none", fontWeight: 600 };

const KPI_COLORES = { azul: "#1976d2", rojo: "#d32f2f", naranja: "#ed6c02", verde: "#2e7d32", morado: "#6a1b9a" };

// ---------------------------------------------------------------------
// Componentes de presentación
// ---------------------------------------------------------------------
const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children }) => (
  <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
    <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <Icon color="primary" /> {title}
          {count != null && (
            <Chip size="small" label={count} sx={{ fontWeight: 700, bgcolor: "#e3f2fd", color: "primary.main", height: 22 }} />
          )}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", ml: 4 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          {actions}
        </Stack>
      )}
    </Stack>
    {children}
  </Paper>
);

// KPI que también funciona como filtro de la tabla de facturas.
const KpiCard = ({ icon: Icon, color, label, activo, onClick, children }) => (
  <Paper
    elevation={activo ? 4 : 2}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    sx={{
      p: 2,
      borderRadius: 3,
      display: "flex",
      gap: 1.5,
      alignItems: "flex-start",
      cursor: "pointer",
      outline: activo ? `2px solid ${color}` : "2px solid transparent",
      transition: "outline-color .15s, box-shadow .15s",
      "&:hover": { outline: `2px solid ${color}66` },
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: 2,
        bgcolor: `${color}1A`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  </Paper>
);

const ValorKpi = ({ valor, detalle }) => (
  <>
    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
      {valor}
    </Typography>
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {detalle}
    </Typography>
  </>
);

const Vacio = () => (
  <Typography variant="body2" sx={{ color: "text.disabled" }}>
    —
  </Typography>
);

// =====================================================================
// Cuentas por pagar (pagos de facturas a proveedores)
// =====================================================================
const CuentasPorPagar = () => {
  const usuario = getUsuarioSesion();
  const puedeEscribir = puedeEscribirCxP(usuario);

  const [hoy, setHoy] = useState(hoyMexico());
  const [proveedores, setProveedores] = useState([]);
  const [proveedorFiltro, setProveedorFiltro] = useState(null);
  const [resumen, setResumen] = useState(null);

  const [estadoFacturas, setEstadoFacturas] = useState("abiertas");
  const [facturas, setFacturas] = useState([]);
  const [cargandoFacturas, setCargandoFacturas] = useState(true);
  const [seleccion, setSeleccion] = useState([]);

  const [filtrosPagos, setFiltrosPagos] = useState({ desde: sumarDias(hoyMexico(), -90), hasta: hoyMexico(), estatus: "", metodo: "" });
  const [pagos, setPagos] = useState([]);
  const [cargandoPagos, setCargandoPagos] = useState(true);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);

  const [dialogoPago, setDialogoPago] = useState(false);
  const [pagoDetalleId, setPagoDetalleId] = useState(null);
  const [facturaMovId, setFacturaMovId] = useState(null);
  const [proveedorTerminos, setProveedorTerminos] = useState(null);

  const [estatusNotas, setEstatusNotas] = useState("disponibles");
  const [notas, setNotas] = useState([]);
  const [cargandoNotas, setCargandoNotas] = useState(true);
  const [dialogoNota, setDialogoNota] = useState(false);
  const [notaDetalleId, setNotaDetalleId] = useState(null);
  const seccionNotasRef = useRef(null);

  const proveedorId = proveedorFiltro?.id_proveedor || null;

  // ---------------- Carga de datos ----------------
  const cargarResumen = useCallback(async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/cuentasPorPagar/resumen`, {
        ...getAuthHeaders(),
        params: { proveedor_id: proveedorId || undefined },
      });
      setResumen(data.resumen);
      if (data.hoy) setHoy(data.hoy);
    } catch (error) {
      handleApiError(error, { defaultMessage: "No se pudo consultar el resumen." });
    }
  }, [proveedorId]);

  const cargarFacturas = useCallback(async () => {
    setCargandoFacturas(true);
    setSeleccion([]);
    try {
      const { data } = await axios.get(`${apiUrl}/cuentasPorPagar/facturas`, {
        ...getAuthHeaders(),
        params: { estado: estadoFacturas, proveedor_id: proveedorId || undefined },
      });
      setFacturas(Array.isArray(data?.facturas) ? data.facturas : []);
    } catch (error) {
      setFacturas([]);
      handleApiError(error, { defaultMessage: "No se pudieron consultar las facturas." });
    } finally {
      setCargandoFacturas(false);
    }
  }, [estadoFacturas, proveedorId]);

  const cargarPagos = useCallback(async () => {
    setCargandoPagos(true);
    try {
      const { data } = await axios.get(`${apiUrl}/cuentasPorPagar/pagos`, {
        ...getAuthHeaders(),
        params: {
          proveedor_id: proveedorId || undefined,
          desde: filtrosPagos.desde || undefined,
          hasta: filtrosPagos.hasta || undefined,
          estatus: filtrosPagos.estatus || undefined,
          metodo: filtrosPagos.metodo || undefined,
        },
      });
      setPagos(Array.isArray(data?.pagos) ? data.pagos : []);
    } catch (error) {
      setPagos([]);
      handleApiError(error, { defaultMessage: "No se pudieron consultar los pagos." });
    } finally {
      setCargandoPagos(false);
    }
  }, [proveedorId, filtrosPagos]);

  const cargarProveedores = useCallback(async () => {
    setCargandoProveedores(true);
    try {
      const { data } = await axios.get(`${apiUrl}/cuentasPorPagar/proveedores`, getAuthHeaders());
      setProveedores(Array.isArray(data?.proveedores) ? data.proveedores : []);
    } catch (error) {
      handleApiError(error, { defaultMessage: "No se pudieron consultar los proveedores." });
    } finally {
      setCargandoProveedores(false);
    }
  }, []);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);
  useEffect(() => { cargarFacturas(); }, [cargarFacturas]);
  useEffect(() => { cargarPagos(); }, [cargarPagos]);
  const cargarNotas = useCallback(async () => {
    setCargandoNotas(true);
    try {
      const { data } = await axios.get(`${apiUrl}/cuentasPorPagar/notas-credito`, {
        ...getAuthHeaders(),
        params: { estatus: estatusNotas, proveedor_id: proveedorId || undefined },
      });
      setNotas(Array.isArray(data?.notas) ? data.notas : []);
    } catch (error) {
      setNotas([]);
      handleApiError(error, { defaultMessage: "No se pudieron consultar las notas de crédito." });
    } finally {
      setCargandoNotas(false);
    }
  }, [estatusNotas, proveedorId]);

  useEffect(() => { cargarProveedores(); }, [cargarProveedores]);
  useEffect(() => { cargarNotas(); }, [cargarNotas]);

  const recargarTodo = () => {
    cargarResumen();
    cargarFacturas();
    cargarPagos();
    cargarProveedores();
    cargarNotas();
  };

  const irANotas = () => {
    setEstatusNotas("disponibles");
    seccionNotasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---------------- KPIs como filtro ----------------
  const filtrarPorKpi = (estado) => setEstadoFacturas((actual) => (actual === estado ? "abiertas" : estado));

  // ---------------- Selección para pago ----------------
  const facturasPorId = useMemo(() => new Map(facturas.map((f) => [f.id, f])), [facturas]);
  const facturasSeleccionadas = useMemo(
    () => seleccion.map((id) => facturasPorId.get(id)).filter(Boolean),
    [seleccion, facturasPorId]
  );
  const proveedorSeleccionId = facturasSeleccionadas[0]?.proveedor_id || null;
  const proveedorPago = proveedores.find((p) => p.id_proveedor === proveedorSeleccionId) || null;
  const totalSeleccion = facturasSeleccionadas.reduce((s, f) => s + Number(f.saldo || 0), 0);

  const esPagable = useCallback(
    (row) =>
      puedeEscribir &&
      ["por_pagar", "parcial"].includes(row.estatus_pago) &&
      Number(row.saldo) > 0 &&
      (!proveedorSeleccionId || row.proveedor_id === proveedorSeleccionId),
    [puedeEscribir, proveedorSeleccionId]
  );

  // ---------------- Columnas ----------------
  const columnasFacturas = useMemo(
    () => [
      {
        field: "proveedor",
        headerName: "Proveedor",
        flex: 1.2,
        minWidth: 190,
      },
      {
        field: "numero_factura",
        headerName: "Factura",
        width: 160,
        valueGetter: (value, row) => nombreFactura(row),
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a237e" }} noWrap title={params.value}>
            {params.value}
          </Typography>
        ),
      },
      { field: "fecha_factura", headerName: "Emisión", width: 105, valueFormatter: (value) => fmtFecha(value) },
      {
        field: "fecha_pronto_pago",
        headerName: "Pronto pago",
        width: 115,
        renderCell: (params) =>
          params.value ? (
            <Typography
              variant="body2"
              sx={{ color: params.row.estado === "pronto_pago" ? "#2e7d32" : "inherit", fontWeight: params.row.estado === "pronto_pago" ? 700 : 400 }}
            >
              {fmtFecha(params.value)}
            </Typography>
          ) : (
            <Vacio />
          ),
      },
      {
        field: "fecha_vencimiento",
        headerName: "Vencimiento",
        width: 180,
        renderCell: (params) => {
          if (!params.value) return <Vacio />;
          const dias = params.row.dias_para_vencer;
          const abierta = ["por_pagar", "parcial"].includes(params.row.estatus_pago);
          const texto = !abierta || dias == null ? "" : dias < 0 ? `hace ${-dias} día(s)` : dias === 0 ? "hoy" : `en ${dias} día(s)`;
          return (
            <Box sx={{ lineHeight: 1.2 }}>
              <Typography variant="body2" component="span" sx={{ color: abierta && dias < 0 ? "#d32f2f" : "inherit", fontWeight: abierta && dias < 0 ? 700 : 400 }}>
                {fmtFecha(params.value)}
              </Typography>
              {texto && (
                <Typography variant="caption" component="span" sx={{ color: "text.secondary", ml: 0.75 }}>
                  {texto}
                </Typography>
              )}
            </Box>
          );
        },
      },
      { field: "total", headerName: "Total", width: 120, type: "number", valueFormatter: (value) => fmtMoneda(value) },
      {
        field: "total_pagado",
        headerName: "Pagado",
        width: 120,
        type: "number",
        valueFormatter: (value) => fmtMoneda(value),
      },
      {
        field: "total_descuento",
        headerName: "Desc. pronto pago",
        width: 135,
        type: "number",
        renderCell: (params) =>
          params.value > 0 ? (
            <Typography variant="body2" sx={{ color: "#2e7d32", fontWeight: 600 }}>{fmtMoneda(params.value)}</Typography>
          ) : params.row.descuento_disponible > 0 && params.row.estado === "pronto_pago" ? (
            <Tooltip title="Descuento disponible si se liquida antes de la fecha de pronto pago" arrow>
              <Typography variant="caption" sx={{ color: "#2e7d32" }}>
                Disp. {fmtMoneda(params.row.descuento_disponible)}
              </Typography>
            </Tooltip>
          ) : (
            <Vacio />
          ),
      },
      {
        field: "saldo",
        headerName: "Saldo",
        width: 125,
        type: "number",
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {fmtMoneda(params.value)}
          </Typography>
        ),
      },
      {
        field: "estado",
        headerName: "Estado",
        width: 150,
        valueGetter: (value) => getEstadoFactura(value).label,
        renderCell: (params) => {
          const info = getEstadoFactura(params.row.estado);
          return (
            <Stack direction="row" gap={0.5} alignItems="center">
              <Chip size="small" label={info.label} sx={chipSuaveSx(info)} />
              {params.row.estatus_pago === "parcial" && (
                <Chip size="small" label="Parcial" variant="outlined" sx={{ fontWeight: 600, height: 22 }} />
              )}
            </Stack>
          );
        },
      },
      {
        field: "acciones",
        headerName: "Movimientos",
        width: 110,
        sortable: false,
        filterable: false,
        disableExport: true,
        renderCell: (params) => (
          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setFacturaMovId(params.row.id)} sx={botonSx}>
            Ver
          </Button>
        ),
      },
    ],
    []
  );

  const columnasPagos = useMemo(
    () => [
      {
        field: "id",
        headerName: "# Pago",
        width: 85,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a237e" }}>#{params.value}</Typography>
        ),
      },
      { field: "fecha_pago", headerName: "Fecha de pago", width: 120, valueFormatter: (value) => fmtFecha(value) },
      { field: "proveedor", headerName: "Proveedor", flex: 1, minWidth: 180 },
      {
        field: "metodo_pago",
        headerName: "Método",
        width: 140,
        valueGetter: (value) => getMetodoPago(value).label,
        renderCell: (params) => {
          const info = getMetodoPago(params.row.metodo_pago);
          return <Chip size="small" label={info.label} sx={chipSuaveSx(info)} />;
        },
      },
      { field: "referencia", headerName: "Referencia / nota", width: 170 },
      { field: "facturas", headerName: "Facturas", flex: 1, minWidth: 160 },
      { field: "monto_total", headerName: "Monto", width: 125, type: "number", valueFormatter: (value) => fmtMoneda(value) },
      {
        field: "monto_descuento",
        headerName: "Descuento",
        width: 110,
        type: "number",
        valueFormatter: (value) => (value > 0 ? fmtMoneda(value) : "—"),
      },
      {
        field: "estatus",
        headerName: "Estatus",
        width: 115,
        valueGetter: (value) => getEstatusPago(value).label,
        renderCell: (params) => {
          const info = getEstatusPago(params.row.estatus);
          return (
            <Tooltip title={params.row.motivo_cancelacion || ""} arrow>
              <Chip size="small" label={info.label} sx={chipSuaveSx(info)} />
            </Tooltip>
          );
        },
      },
      {
        field: "creado_por_nombre",
        headerName: "Registró",
        width: 170,
        valueGetter: (value, row) => `${value || "—"} · ${fmtFechaHora(row.creado_en)}`,
      },
      {
        field: "acciones",
        headerName: "Detalle",
        width: 95,
        sortable: false,
        filterable: false,
        disableExport: true,
        renderCell: (params) => (
          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setPagoDetalleId(params.row.id)} sx={botonSx}>
            Ver
          </Button>
        ),
      },
    ],
    []
  );

  const columnasProveedores = useMemo(
    () => [
      { field: "razon_social", headerName: "Proveedor", flex: 1.2, minWidth: 200 },
      {
        field: "dias_pronto_pago",
        headerName: "Días pronto pago",
        width: 130,
        type: "number",
        valueFormatter: (value, row) => (row.dias_credito == null ? "—" : Number(value || 0)),
      },
      {
        field: "dias_credito",
        headerName: "Días crédito",
        width: 130,
        type: "number",
        renderCell: (params) =>
          params.value == null ? (
            <Chip size="small" label="Sin capturar" sx={chipSuaveSx({ color: "#ed6c02", bg: "#fff3e0" })} />
          ) : (
            params.value
          ),
      },
      {
        field: "descuento_pronto_pago",
        headerName: "% Desc.",
        width: 90,
        type: "number",
        valueFormatter: (value) => (value > 0 ? `${value}%` : "—"),
      },
      { field: "banco", headerName: "Banco", width: 140, valueFormatter: (value) => value || "—" },
      {
        field: "clabe",
        headerName: "CLABE",
        width: 190,
        renderCell: (params) =>
          params.value ||
          (params.row.numero_cuenta ? <Vacio /> : <Chip size="small" label="Sin cuenta" sx={chipSuaveSx({ color: "#d32f2f", bg: "#ffebee" })} />),
      },
      { field: "numero_cuenta", headerName: "No. cuenta", width: 140, valueFormatter: (value) => value || "—" },
      { field: "facturas_abiertas", headerName: "Facturas abiertas", width: 135, type: "number" },
      { field: "saldo_abierto", headerName: "Saldo abierto", width: 135, type: "number", valueFormatter: (value) => fmtMoneda(value) },
      {
        field: "saldo_favor",
        headerName: "Saldo a favor",
        width: 130,
        type: "number",
        renderCell: (params) =>
          params.value > 0 ? (
            <Typography variant="body2" sx={{ color: "#6a1b9a", fontWeight: 700 }}>{fmtMoneda(params.value)}</Typography>
          ) : (
            <Vacio />
          ),
      },
      ...(puedeEscribir
        ? [
          {
            field: "acciones",
            headerName: "Editar",
            width: 95,
            sortable: false,
            filterable: false,
            disableExport: true,
            renderCell: (params) => (
              <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setProveedorTerminos(params.row)} sx={botonSx}>
                Editar
              </Button>
            ),
          },
        ]
        : []),
    ],
    [puedeEscribir]
  );

  const columnasNotas = useMemo(
    () => [
      {
        field: "folio",
        headerName: "Folio",
        width: 130,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a237e" }} noWrap title={params.value}>
            {params.value}
          </Typography>
        ),
      },
      { field: "fecha_nota", headerName: "Fecha", width: 105, valueFormatter: (value) => fmtFecha(value) },
      { field: "proveedor", headerName: "Proveedor", flex: 1, minWidth: 180 },
      { field: "concepto", headerName: "Concepto", flex: 1.2, minWidth: 200 },
      { field: "monto", headerName: "Monto", width: 120, type: "number", valueFormatter: (value) => fmtMoneda(value) },
      { field: "usado", headerName: "Usado", width: 120, type: "number", valueFormatter: (value) => fmtMoneda(value) },
      {
        field: "saldo",
        headerName: "Disponible",
        width: 125,
        type: "number",
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 700, color: params.value > 0 ? "#6a1b9a" : "text.disabled" }}>
            {fmtMoneda(params.value)}
          </Typography>
        ),
      },
      {
        field: "estatus",
        headerName: "Estatus",
        width: 150,
        valueGetter: (value, row) => getEstatusNota(row).label,
        renderCell: (params) => {
          const info = getEstatusNota(params.row);
          return <Chip size="small" label={info.label} sx={chipSuaveSx(info)} />;
        },
      },
      {
        field: "acciones",
        headerName: "Detalle",
        width: 95,
        sortable: false,
        filterable: false,
        disableExport: true,
        renderCell: (params) => (
          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setNotaDetalleId(params.row.id)} sx={botonSx}>
            Ver
          </Button>
        ),
      },
    ],
    []
  );

  const proveedoresVisibles = useMemo(
    () => (proveedorId ? proveedores.filter((p) => p.id_proveedor === proveedorId) : proveedores),
    [proveedores, proveedorId]
  );

  // ---------------- Acciones ----------------
  const alGuardarPago = (data) => {
    setDialogoPago(false);
    swalSuccess("Pago registrado", data?.message);
    recargarTodo();
  };

  const alCancelarPago = (data) => {
    setPagoDetalleId(null);
    swalSuccess("Pago cancelado", data?.message);
    recargarTodo();
  };

  const alGuardarNota = (data) => {
    setDialogoNota(false);
    swalSuccess("Nota de crédito registrada", data?.message);
    recargarTodo();
  };

  const alCancelarNota = (data) => {
    setNotaDetalleId(null);
    swalSuccess("Nota de crédito cancelada", data?.message);
    recargarTodo();
  };

  const alGuardarTerminos = (data) => {
    setProveedorTerminos(null);
    swalSuccess("Proveedor actualizado", data?.message);
    recargarTodo();
  };

  const r = resumen || {};
  const etiquetaFiltro = FILTROS_FACTURA.find((f) => f.value === estadoFacturas)?.label;

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />

      {/* ---------- Encabezado ---------- */}
      <Paper
        elevation={2}
        sx={{ p: 1.5, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <AccountBalanceWalletOutlinedIcon color="primary" /> Cuentas por pagar
          <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>
            Hoy {fmtFecha(hoy)}
          </Typography>
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          {!puedeEscribir && <Chip size="small" label="Solo consulta" variant="outlined" />}
          <Autocomplete
            size="small"
            options={proveedores}
            value={proveedorFiltro}
            onChange={(e, v) => setProveedorFiltro(v)}
            getOptionLabel={(o) => o?.razon_social || ""}
            isOptionEqualToValue={(o, v) => o.id_proveedor === v.id_proveedor}
            renderInput={(params) => <TextField {...params} label="Proveedor" />}
            sx={{ width: 280 }}
          />
          <Tooltip title="Vuelve a consultar resumen, facturas, pagos y proveedores." arrow>
            <span>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={recargarTodo} sx={botonSx}>
                Actualizar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      {/* ---------- KPIs (filtran la tabla de facturas) ---------- */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" } }}>
        <KpiCard icon={AccountBalanceWalletOutlinedIcon} color={KPI_COLORES.azul} label="Total por pagar" activo={estadoFacturas === "abiertas"} onClick={() => setEstadoFacturas("abiertas")}>
          <ValorKpi valor={fmtMoneda(r.saldo_abierto)} detalle={`${r.abiertas ?? 0} factura(s) abiertas`} />
        </KpiCard>
        <KpiCard icon={EventBusyOutlinedIcon} color={KPI_COLORES.rojo} label="Vencido" activo={estadoFacturas === "vencidas"} onClick={() => filtrarPorKpi("vencidas")}>
          <ValorKpi valor={fmtMoneda(r.saldo_vencido)} detalle={`${r.vencidas ?? 0} factura(s) vencidas`} />
        </KpiCard>
        <KpiCard icon={ScheduleOutlinedIcon} color={KPI_COLORES.naranja} label="Por vencer (7 días)" activo={estadoFacturas === "por_vencer"} onClick={() => filtrarPorKpi("por_vencer")}>
          <ValorKpi valor={fmtMoneda(r.saldo_por_vencer)} detalle={`${r.por_vencer ?? 0} factura(s) vencen hasta el ${fmtFecha(sumarDias(hoy, 7))}`} />
        </KpiCard>
        <KpiCard icon={SavingsOutlinedIcon} color={KPI_COLORES.verde} label="Ahorro por pronto pago" activo={estadoFacturas === "pronto_pago"} onClick={() => filtrarPorKpi("pronto_pago")}>
          <ValorKpi valor={fmtMoneda(r.ahorro_pronto_pago)} detalle={`${r.pronto_pago ?? 0} factura(s) aún con descuento`} />
        </KpiCard>
        <KpiCard icon={RequestQuoteOutlinedIcon} color={KPI_COLORES.morado} label="Saldo a favor (notas)" activo={false} onClick={irANotas}>
          <ValorKpi valor={fmtMoneda(r.saldo_favor)} detalle={`${r.notas_con_saldo ?? 0} nota(s) de crédito con saldo`} />
        </KpiCard>
      </Box>

      {r.sin_terminos > 0 && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => setEstadoFacturas("sin_terminos")} sx={botonSx}>
              Ver facturas
            </Button>
          }
        >
          {r.sin_terminos} factura(s) abiertas sin fechas: su proveedor no tiene días de crédito capturados.
        </Alert>
      )}

      {/* ---------- Facturas ---------- */}
      <SectionCard
        icon={ReceiptLongOutlinedIcon}
        title="Facturas"
        subtitle={
          puedeEscribir
            ? "Selecciona una o varias facturas del mismo proveedor y registra el pago. Solo aparecen facturas XML timbradas."
            : "Solo aparecen facturas XML timbradas."
        }
        count={facturas.length}
        actions={
          <>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="cxp-estado-label">Mostrar</InputLabel>
              <Select labelId="cxp-estado-label" label="Mostrar" value={estadoFacturas} onChange={(e) => setEstadoFacturas(e.target.value)}>
                {FILTROS_FACTURA.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {puedeEscribir && (
              <Tooltip
                title={
                  facturasSeleccionadas.length
                    ? `${facturasSeleccionadas.length} factura(s) · saldo ${fmtMoneda(totalSeleccion)}`
                    : "Selecciona facturas por pagar en la tabla"
                }
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PaymentsOutlinedIcon />}
                    disabled={!facturasSeleccionadas.length || cargandoProveedores}
                    onClick={() => setDialogoPago(true)}
                    sx={botonSx}
                  >
                    Registrar pago{facturasSeleccionadas.length ? ` (${facturasSeleccionadas.length})` : ""}
                  </Button>
                </span>
              </Tooltip>
            )}
          </>
        }
      >
        {facturasSeleccionadas.length > 0 && (
          <Alert severity="info" icon={false} sx={{ mb: 1.5 }}>
            {facturasSeleccionadas.length} factura(s) de <strong>{facturasSeleccionadas[0].proveedor}</strong> · saldo{" "}
            <strong>{fmtMoneda(totalSeleccion)}</strong>. Solo puedes agregar facturas del mismo proveedor.
          </Alert>
        )}
        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            {...gridComunProps}
            rows={facturas}
            columns={columnasFacturas}
            loading={cargandoFacturas}
            checkboxSelection={puedeEscribir}
            isRowSelectable={(params) => esPagable(params.row)}
            rowSelectionModel={seleccion}
            onRowSelectionModelChange={(modelo) => setSeleccion(modelo)}
            slotProps={slotPropsGrid("cuentas_por_pagar_facturas")}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: `No hay facturas en “${etiquetaFiltro}”.` }}
          />
        </Box>
      </SectionCard>

      {/* ---------- Pagos ---------- */}
      <SectionCard
        icon={PaymentsOutlinedIcon}
        title="Pagos registrados"
        subtitle="Transferencias aplicadas a facturas; los cancelados quedan en el historial."
        count={pagos.length}
        actions={
          <>
            <TextField
              label="Desde"
              type="date"
              size="small"
              value={filtrosPagos.desde}
              onChange={(e) => setFiltrosPagos((p) => ({ ...p, desde: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: hoy }}
              sx={{ width: 160 }}
            />
            <TextField
              label="Hasta"
              type="date"
              size="small"
              value={filtrosPagos.hasta}
              onChange={(e) => setFiltrosPagos((p) => ({ ...p, hasta: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: hoy }}
              sx={{ width: 160 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="cxp-estatus-pago-label">Estatus</InputLabel>
              <Select
                labelId="cxp-estatus-pago-label"
                label="Estatus"
                value={filtrosPagos.estatus}
                onChange={(e) => setFiltrosPagos((p) => ({ ...p, estatus: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(ESTATUS_PAGO).map(([valor, info]) => (
                  <MenuItem key={valor} value={valor}>{info.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="cxp-metodo-pago-label">Método</InputLabel>
              <Select
                labelId="cxp-metodo-pago-label"
                label="Método"
                value={filtrosPagos.metodo}
                onChange={(e) => setFiltrosPagos((p) => ({ ...p, metodo: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(METODOS_PAGO).map(([valor, info]) => (
                  <MenuItem key={valor} value={valor}>{info.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Últimos 90 días, todos los estatus y métodos" arrow>
              <span>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<RestartAltIcon />}
                  onClick={() => setFiltrosPagos({ desde: sumarDias(hoy, -90), hasta: hoy, estatus: "", metodo: "" })}
                  sx={botonSx}
                >
                  Limpiar
                </Button>
              </span>
            </Tooltip>
          </>
        }
      >
        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            {...gridComunProps}
            rows={pagos}
            columns={columnasPagos}
            loading={cargandoPagos}
            getRowClassName={(params) => (params.row.estatus === "cancelado" ? "fila-cancelada" : "")}
            sx={{ ...gridSx, "& .fila-cancelada": { color: "text.disabled" } }}
            slotProps={slotPropsGrid("cuentas_por_pagar_pagos")}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "No hay pagos registrados en el periodo." }}
          />
        </Box>
      </SectionCard>

      {/* ---------- Notas de crédito ---------- */}
      <Box ref={seccionNotasRef} sx={{ scrollMarginTop: 16 }}>
        <SectionCard
          icon={RequestQuoteOutlinedIcon}
          title="Notas de crédito"
          subtitle="Saldo a favor con proveedores, sin vencimiento. Se aplica a facturas desde “Registrar pago” con el método Nota de crédito."
          count={notas.length}
          actions={
            <>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="cxp-notas-label">Mostrar</InputLabel>
                <Select labelId="cxp-notas-label" label="Mostrar" value={estatusNotas} onChange={(e) => setEstatusNotas(e.target.value)}>
                  {FILTROS_NOTAS.map((f) => (
                    <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {puedeEscribir && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  disabled={cargandoProveedores}
                  onClick={() => setDialogoNota(true)}
                  sx={botonSx}
                >
                  Registrar nota
                </Button>
              )}
            </>
          }
        >
          <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
            <DataGrid
              {...gridComunProps}
              rows={notas}
              columns={columnasNotas}
              loading={cargandoNotas}
              getRowClassName={(params) => (params.row.estatus === "cancelada" ? "fila-cancelada" : "")}
              sx={{ ...gridSx, "& .fila-cancelada": { color: "text.disabled" } }}
              slotProps={slotPropsGrid("cuentas_por_pagar_notas_credito")}
              localeText={{
                ...LOCALE_TEXT_GRID,
                noRowsLabel: `No hay notas de crédito en “${FILTROS_NOTAS.find((f) => f.value === estatusNotas)?.label}”.`,
              }}
            />
          </Box>
        </SectionCard>
      </Box>

      {/* ---------- Términos y cuenta de proveedores ---------- */}
      <SectionCard
        icon={AccountBalanceOutlinedIcon}
        title="Términos y cuenta de proveedores"
        subtitle="Días contados desde la emisión de la factura. Sin CLABE ni número de cuenta no se pueden registrar pagos."
        count={proveedoresVisibles.length}
      >
        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            {...gridComunProps}
            rows={proveedoresVisibles}
            columns={columnasProveedores}
            loading={cargandoProveedores}
            getRowId={(row) => row.id_proveedor}
            slotProps={slotPropsGrid("cuentas_por_pagar_proveedores")}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "No hay proveedores registrados." }}
          />
        </Box>
      </SectionCard>

      {/* ---------- Diálogos ---------- */}
      {puedeEscribir && (
        <RegistrarPagoDialog
          open={dialogoPago}
          facturas={facturasSeleccionadas}
          proveedor={proveedorPago}
          hoy={hoy}
          onClose={() => setDialogoPago(false)}
          onGuardado={alGuardarPago}
        />
      )}
      <DetallePagoDialog
        open={Boolean(pagoDetalleId)}
        pagoId={pagoDetalleId}
        puedeEscribir={puedeEscribir}
        onClose={() => setPagoDetalleId(null)}
        onCancelado={alCancelarPago}
      />
      <MovimientosFacturaDialog
        open={Boolean(facturaMovId)}
        facturaId={facturaMovId}
        onClose={() => setFacturaMovId(null)}
        onVerPago={(id) => {
          setFacturaMovId(null);
          setPagoDetalleId(id);
        }}
      />
      {puedeEscribir && (
        <NotaCreditoDialog
          open={dialogoNota}
          proveedores={proveedores}
          proveedorInicial={proveedorFiltro}
          hoy={hoy}
          onClose={() => setDialogoNota(false)}
          onGuardado={alGuardarNota}
        />
      )}
      <DetalleNotaDialog
        open={Boolean(notaDetalleId)}
        notaId={notaDetalleId}
        puedeEscribir={puedeEscribir}
        onClose={() => setNotaDetalleId(null)}
        onCancelada={alCancelarNota}
        onVerPago={(id) => {
          setNotaDetalleId(null);
          setPagoDetalleId(id);
        }}
      />
      {puedeEscribir && (
        <TerminosProveedorDialog
          open={Boolean(proveedorTerminos)}
          proveedor={proveedorTerminos}
          onClose={() => setProveedorTerminos(null)}
          onGuardado={alGuardarTerminos}
        />
      )}
    </Box>
  );
};

export default CuentasPorPagar;
