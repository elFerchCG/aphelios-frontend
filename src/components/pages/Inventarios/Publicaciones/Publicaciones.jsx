import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  GlobalStyles,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ModeEditOutlinedIcon from "@mui/icons-material/ModeEditOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import apiUrl from "../../../../config";
import { getThumbnailUrl } from "../../Envios/tablaCompacta";

// [PUBLICACIONES-V2] Estilo Aphelios + búsqueda, filtros y paginación en servidor.

// Roles que pueden encender / apagar FULL (el backend lo valida de nuevo)
const ROLES_CAMBIAR_FULL = ["administrador", "desarrollador", "planeador"];
const puedeCambiarFull = (usuario) =>
  ROLES_CAMBIAR_FULL.includes(String(usuario?.rol_descripcion ?? "").trim().toLowerCase());

const GRID_HEIGHT = 620;
const PAGE_SIZE = 100;
const ROW_HEIGHT = 52;
const ORDEN_INICIAL = [{ field: "producto_id", sort: "desc" }];
const BUSQUEDA_DEBOUNCE_MS = 400;

const LOCALE_TEXT_GRID = {
  toolbarColumns: "Columnas",
  toolbarDensity: "Densidad",
  toolbarDensityCompact: "Compacta",
  toolbarDensityStandard: "Estándar",
  toolbarDensityComfortable: "Cómoda",
  columnsManagementSearchTitle: "Buscar columna",
  columnsManagementShowHideAllText: "Mostrar / ocultar todas",
  columnsManagementReset: "Restablecer",
  noRowsLabel: "No hay publicaciones con esa búsqueda o filtros.",
  MuiTablePagination: {
    labelRowsPerPage: "Filas por página",
    labelDisplayedRows: ({ from, to, count }) =>
      `${from.toLocaleString("es-MX")}–${to.toLocaleString("es-MX")} de ${Number(count).toLocaleString("es-MX")}`,
  },
};

const gridSx = {
  fontFamily: "Montserrat",
  borderRadius: 2,
  "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f7fa", fontWeight: "bold", fontSize: 13 },
  "& .MuiDataGrid-columnHeader": { backgroundColor: "#f5f7fa" },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
  "& .MuiDataGrid-cell": { borderBottom: "1px solid #eee", fontSize: 13, display: "flex", alignItems: "center" },
  "& .MuiDataGrid-cell--textRight": { justifyContent: "flex-end" },
  "& .MuiDataGrid-row:hover": { backgroundColor: "#f9fafb" },
};

const botonSx = { borderRadius: 2, textTransform: "none", fontWeight: 600 };

const ESTATUS = {
  active: { label: "Activa", color: "success" },
  paused: { label: "Pausada", color: "warning" },
  inactive: { label: "Inactiva", color: "default" },
  under_review: { label: "En revisión", color: "info" },
  closed: { label: "Cerrada", color: "error" },
};

const esFull = (logistica) => logistica === "fulfillment";

const FILTROS_INICIALES = {
  estatus: "",
  logistica: "",
  permitirFull: "",
  stock: "",
  obsoleto: "",
  proveedor: "",
};

// Detalle en una línea: SKU · ML · MLM · MLMU · Catálogo
const detallePublicacion = (row) =>
  [
    `SKU: ${row.sku || "N/A"}`,
    `ML: ${row.inventory_id || "N/A"}`,
    `MLM: ${row.id || "N/A"}`,
    row.user_product_id ? `MLMU: ${row.user_product_id}` : null,
    row.catalog_id ? `Catálogo: ${row.catalog_id}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

const OPCIONES_FILTRO = [
  {
    key: "estatus",
    label: "Estatus",
    width: 170,
    opciones: [
      { value: "", label: "Sin cerradas" },
      { value: "active", label: "Activa" },
      { value: "paused", label: "Pausada" },
      { value: "inactive", label: "Inactiva" },
      { value: "under_review", label: "En revisión" },
      { value: "closed", label: "Cerrada" },
      { value: "todas", label: "Todas (incluye cerradas)" },
    ],
  },
  {
    key: "logistica",
    label: "Logística",
    width: 120,
    opciones: [
      { value: "", label: "Todas" },
      { value: "FULL", label: "FULL" },
      { value: "ME", label: "ME" },
    ],
  },
  {
    key: "permitirFull",
    label: "Enviar a FULL",
    width: 155,
    opciones: [
      { value: "", label: "Todos" },
      { value: "1", label: "Sí" },
      { value: "0", label: "No" },
    ],
  },
  {
    key: "stock",
    label: "Stock",
    width: 130,
    opciones: [
      { value: "", label: "Todos" },
      { value: "con", label: "Con stock" },
      { value: "sin", label: "Sin stock" },
    ],
  },
  {
    key: "obsoleto",
    label: "Obsoleto",
    width: 120,
    opciones: [
      { value: "", label: "Todos" },
      { value: "1", label: "Sí" },
      { value: "0", label: "No" },
    ],
  },
];

const fmtNum = (v) => (v == null || v === "" ? "" : Number(v).toLocaleString("es-MX"));

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

const ToolbarPublicaciones = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarDensitySelector />
  </GridToolbarContainer>
);

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// Parámetros del endpoint a partir de búsqueda + filtros
const construirParams = (q, filtros) => {
  const params = {};
  if (q.trim()) params.q = q.trim();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== "") params[k] = v;
  });
  return params;
};

const Publicaciones = () => {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const editableFull = puedeCambiarFull(user);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: PAGE_SIZE });
  const [sortModel, setSortModel] = useState(ORDEN_INICIAL);
  const [recarga, setRecarga] = useState(0);
  const peticionRef = useRef(0);
  const [proveedores, setProveedores] = useState([]);

  // Sin búsqueda ni filtros: solo las últimas 100 (orden y página en el navegador).
  // Con búsqueda o filtros: toda la base, paginada en el servidor.
  const hayFiltros =
    busquedaAplicada.trim() !== "" || Object.entries(filtros).some(([k, v]) => v !== FILTROS_INICIALES[k]);
  const modoRecientes = !hayFiltros;
  const ordenServidor = modoRecientes ? ORDEN_INICIAL[0] : sortModel[0] || ORDEN_INICIAL[0];
  const ordenKey = `${ordenServidor.field}:${ordenServidor.sort || "desc"}`;

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    producto_id: false,
    id: false,
    sku: false,
    inventory_id: false,
    catalog_id: false,
    family_id: false,
    user_product_id: false,
    available_quantity: true,
    status: true,
    costo: false,
    free_shipping: false,
    costo_envio: false,
    costo_fijo: false,
    porcentaje_comision: false,
    permalink: false,
  });

  // Detalle (inventario seguridad / máximo)
  const [detalle, setDetalle] = useState(null); // { producto_id, title }
  const [invSeguridad, setInvSeguridad] = useState("");
  const [invMaximo, setInvMaximo] = useState("");
  const [guardandoDetalle, setGuardandoDetalle] = useState(false);

  // Etiquetas
  const [etiqueta, setEtiqueta] = useState(null); // { inventory_id, title, sku }
  const [cantidadEtiquetas, setCantidadEtiquetas] = useState("");

  // Búsqueda con espera para no consultar en cada tecla
  useEffect(() => {
    const t = setTimeout(() => setBusquedaAplicada(busqueda), BUSQUEDA_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Cualquier cambio de búsqueda / filtros regresa a la primera página
  useEffect(() => {
    setPaginationModel((m) => (m.page === 0 ? m : { ...m, page: 0 }));
  }, [busquedaAplicada, filtros]);

  // Proveedores para el filtro
  useEffect(() => {
    axios
      .get(`${apiUrl}/proveedores`)
      .then(({ data }) => setProveedores(Array.isArray(data) ? data : []))
      .catch(() => setProveedores([]));
  }, []);

  useEffect(() => {
    const id = ++peticionRef.current;
    const [sortField, sortDir] = ordenKey.split(":");
    const cargar = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${apiUrl}/buscador/publicaciones`, {
          headers: authHeaders(),
          params: {
            ...construirParams(busquedaAplicada, filtros),
            page: modoRecientes ? 0 : paginationModel.page,
            pageSize: PAGE_SIZE,
            sortField,
            sortDir,
          },
        });
        if (id !== peticionRef.current) return; // respuesta vieja
        setRows(Array.isArray(data?.rows) ? data.rows : []);
        setTotal(Number(data?.total) || 0);
      } catch (error) {
        if (id !== peticionRef.current) return;
        setRows([]);
        setTotal(0);
        Swal.fire({
          title: "Error",
          text: error.response?.data?.message || "No se pudieron cargar las publicaciones.",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
        });
      } finally {
        if (id === peticionRef.current) setLoading(false);
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaAplicada, filtros, modoRecientes ? 0 : paginationModel.page, ordenKey, recarga]);

  const recargar = useCallback(() => setRecarga((n) => n + 1), []);

  const hayTextoOFiltros = busqueda.trim() !== "" || hayFiltros;

  const limpiarFiltros = () => {
    setBusqueda("");
    setBusquedaAplicada("");
    setFiltros(FILTROS_INICIALES);
  };

  const verTodosLosRegistros = () => {
    setBusqueda("");
    setBusquedaAplicada("");
    setFiltros({ ...FILTROS_INICIALES, estatus: "todas" });
  };

  const actualizarFila = (productoId, cambios) =>
    setRows((prev) => prev.map((r) => (r.producto_id === productoId ? { ...r, ...cambios } : r)));

  // Encender / apagar FULL (aplica desde la siguiente corrida del MRP)
  const handleTogglePermitirFull = async (row, checked) => {
    const valor = checked ? 1 : 0;
    const anterior = Number(row.permitir_full) === 1 ? 1 : 0;
    actualizarFila(row.producto_id, { permitir_full: valor });
    try {
      const response = await axios.put(
        `${apiUrl}/productos/permitir_full/${row.producto_id}`,
        { permitir_full: valor },
        { headers: authHeaders() }
      );
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: response?.data?.message || "Actualizado",
        timer: 3500,
        showConfirmButton: false,
      });
    } catch (error) {
      actualizarFila(row.producto_id, { permitir_full: anterior });
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "No se pudo actualizar FULL",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
      });
    }
  };

  const handleToggleObsoleto = async (row, checked) => {
    const valor = checked ? 1 : 0;
    const anterior = Number(row.producto_obsoleto) === 1 ? 1 : 0;
    actualizarFila(row.producto_id, { producto_obsoleto: valor });
    try {
      const response = await axios.put(`${apiUrl}/productos/marcar_producto_obsoleto/${row.producto_id}`, {
        producto_obsoleto: valor,
      });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: response?.data?.message || "Actualizado",
        timer: 3500,
        showConfirmButton: false,
      });
    } catch (error) {
      actualizarFila(row.producto_id, { producto_obsoleto: anterior });
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message?.messageText || error.response?.data?.message || "No se pudo actualizar",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
      });
    }
  };

  // ---------- Detalle ----------
  const abrirDetalle = async (row) => {
    setDetalle({ producto_id: row.producto_id, title: row.title });
    setInvSeguridad("");
    setInvMaximo("");
    try {
      const { data } = await axios.get(`${apiUrl}/buscador/${row.producto_id}`);
      const producto = Array.isArray(data?.data) ? data.data[0] : null;
      if (!producto) throw new Error("No se encontró la publicación.");
      setInvSeguridad(producto.inv_seguridad ?? "");
      setInvMaximo(producto.inv_maximo ?? "");
    } catch (error) {
      setDetalle(null);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || error.message || "No se pudo cargar el detalle.",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
      });
    }
  };

  const guardarDetalle = async () => {
    if (!detalle) return;
    const seguridad = parseFloat(invSeguridad);
    const maximo = parseFloat(invMaximo);
    if (!Number.isFinite(seguridad) || !Number.isFinite(maximo) || seguridad < 0 || maximo < 0) {
      Swal.fire({ title: "Datos incompletos", text: "Captura seguridad y máximo (0 o más).", icon: "warning" });
      return;
    }
    setGuardandoDetalle(true);
    try {
      const { data } = await axios.put(`${apiUrl}/buscador/actualizarProducto/${detalle.producto_id}`, {
        inv_seguridad: seguridad,
        inv_maximo: maximo,
      });
      actualizarFila(detalle.producto_id, { inv_seguridad: seguridad, inv_maximo: maximo });
      setDetalle(null);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: data?.message || "Publicación actualizada",
        timer: 3500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message?.messageText || error.response?.data?.message || "No se pudo guardar.",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
      });
    } finally {
      setGuardandoDetalle(false);
    }
  };

  // ---------- Etiquetas ----------
  const abrirEtiquetas = (row) => {
    setEtiqueta({ inventory_id: row.inventory_id, title: row.title, sku: row.sku });
    setCantidadEtiquetas("");
  };

  const imprimirEtiquetas = () => {
    const cantidad = parseInt(cantidadEtiquetas, 10);
    if (!etiqueta || !Number.isInteger(cantidad) || cantidad < 1) {
      Swal.fire({ title: "Cantidad inválida", text: "Captura cuántas etiquetas imprimir.", icon: "warning" });
      return;
    }
    const { sku, title, inventory_id } = etiqueta;
    const bloqueInventory = inventory_id
      ? `
            ^FO65,18^BY2^BCN,54,N,N
            ^FD${inventory_id}^FS
            ^FT150,98^A0N,22,22^FH^FD${inventory_id}^FS
            ^FT149,98^A0N,22,22^FH^FD${inventory_id}^FS
            `
      : ``;

    const contenido = `
            ^XA
            ^CI28
            ^LH0,0
            ^FO22,165^A0N,25,25^FDSKU:${sku}^FS
            ^FB350,2,2
            ^FO22,105^A0N,20,20^FD${title}^FS
            ^FT385,105^A0B,22,22^FH^FD${user?.nombre ?? ""}^FS

            ${bloqueInventory}

            ^PQ${cantidad},0,1,Y
            ^XZ
            `;

    const blob = new Blob([contenido], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `archivo_${inventory_id ?? "sin_inventory"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setEtiqueta(null);
  };

  // ---------- Columnas ----------
  const columns = useMemo(
    () => [
      {
        // Toda la publicación en una fila: miniatura + título (link) + SKU · ML · MLM · MLMU · Catálogo
        field: "title",
        headerName: "Publicación",
        flex: 1,
        minWidth: 420,
        renderCell: ({ row }) => {
          const thumb = getThumbnailUrl(row.thumbnail);
          const detalleTxt = detallePublicacion(row);
          const link = row.permalink || undefined;
          return (
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%", minWidth: 0, height: "100%" }}>
              <Tooltip arrow title={link ? "Ver en Mercado Libre" : "Sin enlace"}>
                <Avatar
                  component={link ? "a" : "div"}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="rounded"
                  src={thumb || undefined}
                  alt={row.title}
                  sx={{ width: 38, height: 38, bgcolor: "#f5f5f5", border: "1px solid #e0e0e0", flexShrink: 0 }}
                >
                  <Inventory2OutlinedIcon sx={{ fontSize: 18, color: "#9e9e9e" }} />
                </Avatar>
              </Tooltip>
              <Box sx={{ minWidth: 0, lineHeight: 1.2 }}>
                <Typography
                  component={link ? "a" : "p"}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  noWrap
                  title={row.title}
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                    lineHeight: 1.3,
                    "&:hover": link ? { color: "primary.main", textDecoration: "underline" } : undefined,
                  }}
                >
                  {row.title || "Sin título"}
                </Typography>
                <Typography variant="caption" noWrap title={detalleTxt} sx={{ color: "text.secondary", display: "block" }}>
                  {detalleTxt}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },
      {
        field: "actions",
        headerName: "Acciones",
        type: "actions",
        width: 130,
        getActions: (params) => [
          <GridActionsCellItem
            key="detalle"
            icon={
              <Tooltip arrow title="Inventario de seguridad y máximo">
                <ModeEditOutlinedIcon />
              </Tooltip>
            }
            label="Detalle"
            onClick={() => abrirDetalle(params.row)}
            sx={{ color: "#ed6c02" }}
          />,
          <GridActionsCellItem
            key="link"
            icon={
              <Tooltip arrow title={params.row.permalink ? "Ver publicación en Mercado Libre" : "Sin enlace"}>
                <OpenInNewIcon />
              </Tooltip>
            }
            label="Ver publicación"
            onClick={() => params.row.permalink && window.open(params.row.permalink, "_blank")}
            sx={{ color: params.row.permalink ? "#2e7d32" : "#bdbdbd" }}
          />,
          <GridActionsCellItem
            key="etiquetas"
            icon={
              <Tooltip arrow title={params.row.inventory_id ? "Imprimir etiquetas" : "Sin ML (inventory_id): no se pueden imprimir etiquetas"}>
                <LabelOutlinedIcon />
              </Tooltip>
            }
            label="Imprimir etiquetas"
            onClick={() => params.row.inventory_id && abrirEtiquetas(params.row)}
            sx={{ color: params.row.inventory_id ? "#1976d2" : "#bdbdbd" }}
          />,
        ],
      },
      {
        field: "proveedores",
        headerName: "Proveedor",
        width: 180,
        sortable: false,
        renderCell: (params) =>
          params.value ? (
            <Typography variant="body2" noWrap title={params.value} sx={{ fontSize: 13 }}>
              {params.value}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              Sin billete
            </Typography>
          ),
      },
      {
        field: "available_quantity",
        headerName: "Stock",
        type: "number",
        width: 90,
        valueFormatter: (value) => fmtNum(value),
      },
      {
        field: "status",
        headerName: "Estatus",
        width: 115,
        renderCell: (params) => {
          const e = ESTATUS[params.value];
          if (!params.value) return "";
          return (
            <Chip
              size="small"
              label={e?.label || params.value}
              color={e?.color || "default"}
              variant={params.value === "active" ? "filled" : "outlined"}
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        field: "logistic_type",
        headerName: "Logística ML",
        width: 115,
        renderCell: (params) =>
          esFull(params.value) ? (
            <Chip
              size="small"
              label="FULL"
              sx={{ fontWeight: 700, bgcolor: "#e8f5e9", color: "#2e7d32", border: "1px solid #2e7d32" }}
            />
          ) : (
            <Chip
              size="small"
              label="ME"
              sx={{ fontWeight: 700, bgcolor: "#e3f2fd", color: "#1976d2", border: "1px solid #1976d2" }}
            />
          ),
      },
      {
        // Interruptor FULL: única forma de decidir si el producto se envía a FULL
        field: "permitir_full",
        headerName: "Enviar a FULL",
        width: 130,
        renderCell: (params) => {
          const habilitado = Number(params.value) === 1;
          const estado = habilitado
            ? "Habilitado: el MRP genera cantidad a enviar a FULL."
            : "Deshabilitado: se trata como Mercado Envíos (no se envía a FULL ni entra en retiros).";
          return (
            <Tooltip
              arrow
              title={
                editableFull
                  ? `${estado} ${habilitado ? "Apágalo para tratarlo como Mercado Envíos." : "Enciéndelo para enviarlo a FULL."}`
                  : `${estado} Solo administrador, Desarrollador y Planeador pueden cambiarlo.`
              }
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, height: "100%" }}>
                <Switch
                  size="small"
                  checked={habilitado}
                  disabled={!editableFull}
                  color="success"
                  onChange={(e) => handleTogglePermitirFull(params.row, e.target.checked)}
                />
                <Typography variant="caption" sx={{ fontWeight: 700, color: habilitado ? "success.main" : "text.secondary" }}>
                  {habilitado ? "Sí" : "No"}
                </Typography>
              </Box>
            </Tooltip>
          );
        },
      },
      {
        field: "producto_obsoleto",
        headerName: "Obsoleto",
        width: 110,
        sortable: false,
        renderCell: (params) => {
          const obsoleto = Number(params.value) === 1;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, height: "100%" }}>
              <Switch
                size="small"
                checked={obsoleto}
                color="error"
                onChange={(e) => handleToggleObsoleto(params.row, e.target.checked)}
              />
              <Typography variant="caption" sx={{ fontWeight: 700, color: obsoleto ? "error.main" : "text.secondary" }}>
                {obsoleto ? "Sí" : "No"}
              </Typography>
            </Box>
          );
        },
      },
      { field: "tamaño", headerName: "Tamaño", width: 100, sortable: false },
      // Ocultas por defecto: disponibles en "Columnas" y en la exportación
      { field: "producto_id", headerName: "Folio", width: 90, type: "number" },
      { field: "id", headerName: "MLM", width: 140 },
      { field: "sku", headerName: "SKU", width: 150 },
      { field: "inventory_id", headerName: "ML", width: 120 },
      { field: "user_product_id", headerName: "MLMU", width: 150 },
      { field: "catalog_id", headerName: "Catálogo", width: 140, sortable: false },
      { field: "family_id", headerName: "Familia", width: 140, sortable: false },
      { field: "permalink", headerName: "Permalink", width: 220, sortable: false },
      { field: "costo", headerName: "Costo", type: "number", width: 100, sortable: false },
      {
        field: "free_shipping",
        headerName: "Envío gratis",
        width: 110,
        sortable: false,
        valueFormatter: (value) => (Number(value) === 1 ? "Sí" : "No"),
      },
      { field: "costo_envio", headerName: "Costo de envío", type: "number", width: 120, sortable: false },
      { field: "costo_fijo", headerName: "Costo fijo", type: "number", width: 110, sortable: false },
      { field: "porcentaje_comision", headerName: "% Comisión", type: "number", width: 110, sortable: false },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editableFull]
  );

  // ---------- Exportar ----------
  // Exporta TODO lo que coincide con la búsqueda y filtros (todas las páginas),
  // con las columnas visibles en ese momento.
  const valorExportable = (field, row) => {
    const v = row[field];
    switch (field) {
      case "status":
        return ESTATUS[v]?.label || v || "";
      case "logistic_type":
        return v ? (esFull(v) ? "FULL" : "ME") : "";
      case "permitir_full":
      case "producto_obsoleto":
      case "free_shipping":
        return Number(v) === 1 ? "Sí" : "No";
      default:
        return v ?? "";
    }
  };

  const exportarResultados = async () => {
    setExportando(true);
    try {
      // Sin búsqueda ni filtros la tabla muestra solo las últimas 100: se exportan esas.
      let data = { rows };
      if (!modoRecientes) {
        const orden = sortModel[0] || ORDEN_INICIAL[0];
        ({ data } = await axios.get(`${apiUrl}/buscador/publicaciones`, {
          headers: authHeaders(),
          params: {
            ...construirParams(busquedaAplicada, filtros),
            sortField: orden.field,
            sortDir: orden.sort || "desc",
            exportar: 1,
          },
        }));
      }
      const filas = Array.isArray(data?.rows) ? data.rows : [];
      if (!filas.length) {
        Swal.fire({ title: "Sin datos", text: "No hay publicaciones para exportar.", icon: "info" });
        return;
      }
      // La columna Publicación se exporta separada en título, MLM, SKU, ML, MLMU, catálogo y permalink
      const DETALLE_PUBLICACION = ["id", "sku", "inventory_id", "user_product_id", "catalog_id", "permalink"];
      const visiblesGrid = columns.filter((c) => c.field !== "actions" && columnVisibilityModel[c.field] !== false);
      const visibles = [];
      visiblesGrid.forEach((c) => {
        if (c.field === "title") {
          visibles.push({ ...c, headerName: "Título" });
          DETALLE_PUBLICACION.forEach((f) => {
            const col = columns.find((x) => x.field === f);
            if (col && !visiblesGrid.includes(col)) visibles.push(col);
          });
        } else {
          visibles.push(c);
        }
      });
      const datos = filas.map((row) => {
        const fila = {};
        visibles.forEach((c) => {
          fila[c.headerName] = valorExportable(c.field, row);
        });
        return fila;
      });
      const hoja = XLSX.utils.json_to_sheet(datos);
      hoja["!cols"] = visibles.map((c) => ({ wch: c.field === "title" ? 60 : 16 }));
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Publicaciones");
      XLSX.writeFile(libro, `publicaciones_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
      if (data?.truncado) {
        Swal.fire({
          title: "Exportación parcial",
          text: `Se exportaron ${fmtNum(filas.length)} de ${fmtNum(data.total)} publicaciones (máximo por archivo). Aplica un filtro para exportar el resto.`,
          icon: "warning",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "No se pudo exportar.",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
      });
    } finally {
      setExportando(false);
    }
  };

  const filasVisibles = modoRecientes ? Math.min(total, PAGE_SIZE) : total;

  const subtitulo = useMemo(() => {
    if (modoRecientes)
      return `Últimas ${fmtNum(Math.min(total, PAGE_SIZE))} publicaciones. Busca o filtra para consultar las ${fmtNum(total)} de la base.`;
    if (filtros.estatus === "todas" && Object.entries(filtros).every(([k, v]) => k === "estatus" || v === "") && !busquedaAplicada.trim())
      return "Todos los registros de la base de datos, incluidas las cerradas.";
    return "Resultados de la búsqueda y filtros sobre toda la base.";
  }, [modoRecientes, total, filtros, busquedaAplicada]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />

      {/* Encabezado */}
      <Paper
        elevation={2}
        sx={{ p: 1.5, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <StorefrontOutlinedIcon color="primary" /> Publicaciones
          <Chip size="small" label="Mercado Libre" sx={{ bgcolor: "#e3f2fd", color: "primary.main", fontWeight: 700 }} />
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Tooltip arrow title="Quita la búsqueda y los filtros y muestra todas las publicaciones de la base, incluidas las cerradas">
            <span>
              <Button variant="outlined" size="small" startIcon={<StorageOutlinedIcon />} sx={botonSx} onClick={verTodosLosRegistros}>
                Todos los registros
              </Button>
            </span>
          </Tooltip>
          <Tooltip arrow title="Descarga en Excel todo lo que muestra la tabla (todas las páginas) con las columnas visibles">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadOutlinedIcon />}
                sx={botonSx}
                onClick={exportarResultados}
                disabled={exportando || loading || filasVisibles === 0}
              >
                {exportando ? "Exportando…" : `Exportar ${fmtNum(filasVisibles)}`}
              </Button>
            </span>
          </Tooltip>
          <Tooltip arrow title="Volver a consultar las publicaciones">
            <span>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />} sx={botonSx} onClick={recargar} disabled={loading}>
                Actualizar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Búsqueda y filtros */}
      <SectionCard
        icon={SearchIcon}
        title="Búsqueda y filtros"
        subtitle="Título, SKU, MLM, catálogo, familia, MLMU, ML o Folio. Varias palabras: deben aparecer todas."
        actions={
          <Tooltip arrow title="Quitar búsqueda y filtros">
            <span>
              <Button size="small" startIcon={<RestartAltIcon />} sx={botonSx} onClick={limpiarFiltros} disabled={!hayTextoOFiltros}>
                Limpiar
              </Button>
            </span>
          </Tooltip>
        }
      >
        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="Ej. balata promoto ft150"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ minWidth: { xs: "100%", sm: 320 }, flex: { sm: "1 1 320px" } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          {OPCIONES_FILTRO.map((f) => (
            <FormControl key={f.key} size="small" sx={{ width: { xs: "calc(50% - 6px)", sm: f.width } }}>
              <InputLabel shrink>{f.label}</InputLabel>
              <Select
                label={f.label}
                notched
                displayEmpty
                value={filtros[f.key]}
                onChange={(e) => setFiltros((prev) => ({ ...prev, [f.key]: e.target.value }))}
              >
                {f.opciones.map((o) => (
                  <MenuItem key={o.value || "todos"} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
          <Autocomplete
            size="small"
            options={proveedores}
            getOptionLabel={(o) => o?.razon_social || ""}
            isOptionEqualToValue={(o, v) => String(o.id_proveedor) === String(v.id_proveedor)}
            value={proveedores.find((p) => String(p.id_proveedor) === String(filtros.proveedor)) || null}
            onChange={(_, v) => setFiltros((prev) => ({ ...prev, proveedor: v ? String(v.id_proveedor) : "" }))}
            noOptionsText="Sin proveedores"
            sx={{ width: { xs: "100%", sm: 260 } }}
            renderInput={(params) => (
              <TextField {...params} label="Proveedor" placeholder="Todos" InputLabelProps={{ shrink: true }} />
            )}
          />
        </Stack>
      </SectionCard>

      {/* Tabla */}
      <SectionCard icon={ListAltOutlinedIcon} title="Publicaciones" count={fmtNum(filasVisibles)} subtitle={subtitulo}>
        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            sx={gridSx}
            rows={rows}
            columns={columns}
            getRowId={(row) => row.producto_id}
            loading={loading}
            rowHeight={ROW_HEIGHT}
            {...(modoRecientes
              ? { paginationMode: "client", sortingMode: "client" }
              : { paginationMode: "server", sortingMode: "server", rowCount: total })}
            paginationModel={modoRecientes ? { page: 0, pageSize: PAGE_SIZE } : paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[PAGE_SIZE]}
            sortModel={sortModel}
            onSortModelChange={(m) => setSortModel(m.length ? m : ORDEN_INICIAL)}
            disableColumnFilter
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={setColumnVisibilityModel}
            showCellVerticalBorder
            showColumnVerticalBorder
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
                        slots={{ toolbar: ToolbarPublicaciones }}
            slotProps={{ loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" } }}
            localeText={LOCALE_TEXT_GRID}
          />
        </Box>
      </SectionCard>

      {/* Detalle: inventario de seguridad y máximo */}
      <Dialog open={Boolean(detalle)} onClose={() => !guardandoDetalle && setDetalle(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <ModeEditOutlinedIcon color="primary" /> Inventarios de la publicación
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {detalle?.title}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
            Folio {detalle?.producto_id}. Semanas que usa el MRP para seguridad y máximo.
          </Typography>
          <Stack direction="row" gap={2}>
            <TextField
              size="small"
              fullWidth
              label="Inventario seguridad"
              type="number"
              value={invSeguridad}
              onChange={(e) => setInvSeguridad(e.target.value)}
              inputProps={{ step: "0.1", min: 0 }}
            />
            <TextField
              size="small"
              fullWidth
              label="Inventario máximo"
              type="number"
              value={invMaximo}
              onChange={(e) => setInvMaximo(e.target.value)}
              inputProps={{ step: "0.1", min: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button sx={botonSx} onClick={() => setDetalle(null)} disabled={guardandoDetalle}>
            Cerrar
          </Button>
          <Button variant="contained" color="success" sx={botonSx} onClick={guardarDetalle} disabled={guardandoDetalle}>
            {guardandoDetalle ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Etiquetas */}
      <Dialog open={Boolean(etiqueta)} onClose={() => setEtiqueta(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <LabelOutlinedIcon color="primary" /> Imprimir etiquetas
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
            {etiqueta?.title}
          </Typography>
          <Stack direction="row" gap={2}>
            <TextField
              size="small"
              fullWidth
              label="ML"
              value={etiqueta?.inventory_id || ""}
              disabled
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <QrCodeScannerIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="small"
              label="Cantidad"
              type="number"
              value={cantidadEtiquetas}
              onChange={(e) => setCantidadEtiquetas(e.target.value)}
              inputProps={{ min: 1 }}
              sx={{ width: 130 }}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button sx={botonSx} onClick={() => setEtiqueta(null)}>
            Cerrar
          </Button>
          <Button variant="contained" color="success" sx={botonSx} onClick={imprimirEtiquetas}>
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Publicaciones;
