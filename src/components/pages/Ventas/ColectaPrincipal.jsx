// Colecta Mercado Envíos de la cuenta principal (Aphelios), mostrada igual que la
// colecta de subcuenta. Mismos endpoints de siempre: /pedidos/sync-mercado-envios,
// /pedidos/imprimir-etiqueta y /pedidos/procesarRecolectados.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { FiltroColecta, claveColecta, formatoFecha } from "./colectaUI";

import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";

// ---------- Estilo Aphelios ----------
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
  "& .MuiDataGrid-cell": { borderBottom: "1px solid #eee", fontSize: 13, display: "flex", alignItems: "center", py: 0.5 },
  "& .MuiDataGrid-row:hover": { backgroundColor: "#f9fafb" },
};
const botonSx = { borderRadius: 2, textTransform: "none", fontWeight: 600 };

const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children }) => (
  <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
    <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <Icon color="primary" /> {title}
          {count != null && <Chip size="small" label={count} sx={{ fontWeight: 700, bgcolor: "#e3f2fd", color: "primary.main", height: 22 }} />}
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

const KpiCard = ({ icon: Icon, color, label, valor, detalle }) => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: 3, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
    <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: `${color}1A`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
        {valor}
      </Typography>
      {detalle && (
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
          {detalle}
        </Typography>
      )}
    </Box>
  </Paper>
);

const EstadoChip = ({ valor, mapa }) => {
  const e = mapa[valor] || { label: valor || "—", color: "default" };
  return <Chip size="small" label={e.label} color={e.color} sx={{ fontWeight: 600 }} />;
};

// ---------- Reglas de la colecta (mismas que la pantalla anterior) ----------
const ESTADO_ML = {
  ready_to_print: { label: "Por imprimir", color: "warning" },
  etiqueta_impresa: { label: "Lista para enviar", color: "info" },
  listo_para_recolectar: { label: "Lista para recolectar", color: "info" },
  recolectado: { label: "Recolectado", color: "success" },
  en_camino: { label: "En camino", color: "success" },
  entregado: { label: "Entregado", color: "success" },
  no_entregado: { label: "No entregado", color: "error" },
  procesado: { label: "Procesado", color: "default" },
  cancelado: { label: "Cancelado", color: "error" },
};

const ESTADO_RESERVA = {
  reservado: { label: "Reservado", color: "success" },
  parcialmente_reservado: { label: "Reserva parcial", color: "warning" },
  sin_stock: { label: "Sin stock", color: "error" },
  orden_generada: { label: "Orden generada", color: "default" },
};

const FILTROS = {
  por_imprimir: { label: "Por imprimir", fn: (s) => s.estado_operativo === "ready_to_print" },
  listas: { label: "Listas para enviar", fn: (s) => ["etiqueta_impresa", "listo_para_recolectar"].includes(s.estado_operativo) },
  recolectadas: { label: "Recolectadas", fn: (s) => s.mostrar_en_recolectados === true },
  canceladas: { label: "Canceladas", fn: (s) => s.estado_operativo === "cancelado" },
  todas: { label: "Todas", fn: () => true },
};

const ESTADOS_IMPRIMIBLES = ["ready_to_print", "etiqueta_impresa", "listo_para_recolectar"];
const ESTADOS_COLECTA = ["ready_to_print", "etiqueta_impresa", "listo_para_recolectar", "recolectado", "en_camino", "entregado"];

const apiUrl = process.env.NODE_ENV === "production" ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const claveDia = (f) => (f ? dayjs(f).format("YYYY-MM-DD") : null);
const tieneReserva = (s) => (s.items || []).some((i) => i.localidades?.length > 0);
const diasRetraso = (f) => (f ? dayjs().startOf("day").diff(dayjs(f).startOf("day"), "day") : 0);

const pasos = (s) => [
  { label: "Venta creada", completed: true },
  { label: "Stock reservado", completed: s.estado_operativo_interno === "reservado" || s.estado_operativo === "procesado" },
  { label: "Recolectado", completed: s.mostrar_en_recolectados === true || ["recolectado", "procesado"].includes(s.estado_operativo) },
  { label: "Orden de bodega generada", completed: s.estado_operativo_interno === "orden_generada", current: s.pendiente_procesar_bodega === true },
];

const ColectaPrincipal = () => {
  const [envios, setEnvios] = useState([]);
  const [filtro, setFiltro] = useState("por_imprimir");
  const [dia, setDia] = useState("hoy");
  const [colecta, setColecta] = useState("todas");
  const [seleccion, setSeleccion] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await axios.get(`${apiUrl}/pedidos/sync-mercado-envios`, { headers: authHeaders() });
      setEnvios(r.data?.data || []);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudo cargar la colecta de la cuenta principal.", "error");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hoy = dayjs().format("YYYY-MM-DD");
  const manana = dayjs().add(1, "day").format("YYYY-MM-DD");

  // Hoy = hoy + atrasadas; los recolectados sin fecha o sin procesar nunca se ocultan
  const pasaDia = useCallback(
    (s) => {
      const k = claveDia(s.expected_date);
      if (dia === "hoy") {
        if (s.mostrar_en_recolectados === true) return !k || s.pendiente_procesar_bodega === true || k <= hoy;
        return !!k && k <= hoy;
      }
      if (dia === "manana") return k === manana;
      if (dia === "proximos") return !!k && k > hoy;
      return true;
    },
    [dia, hoy, manana],
  );

  const filtrados = useMemo(() => envios.filter((s) => FILTROS[filtro].fn(s) && pasaDia(s)), [envios, filtro, pasaDia]);
  const visibles = useMemo(
    () => (colecta === "todas" ? filtrados : filtrados.filter((s) => claveColecta(s.expected_date) === colecta)),
    [filtrados, colecta],
  );

  const kpi = useMemo(() => {
    const r = { imprimirHoy: 0, imprimirManana: 0, listasHoy: 0, listasManana: 0, recolectadas: 0, atrasadas: 0, sinStock: 0, piezas: 0 };
    for (const s of envios) {
      if (s.estado_operativo !== "cancelado") {
        r.piezas += (s.items || []).reduce((t, i) => t + Number(i.cantidad || 0), 0);
        if (s.estado_operativo_interno === "sin_stock") r.sinStock++;
      }
      if (s.mostrar_en_recolectados === true) {
        r.recolectadas++;
        if (s.pendiente_procesar_bodega === true) r.atrasadas++;
        continue;
      }
      const k = claveDia(s.expected_date);
      if (!ESTADOS_COLECTA.includes(s.estado_operativo) || !k) continue;
      const lista = ["etiqueta_impresa", "listo_para_recolectar"].includes(s.estado_operativo);
      if (k <= hoy) {
        if (s.estado_operativo === "ready_to_print") r.imprimirHoy++;
        if (lista) r.listasHoy++;
      } else if (k === manana) {
        if (s.estado_operativo === "ready_to_print") r.imprimirManana++;
        if (lista) r.listasManana++;
      }
    }
    return r;
  }, [envios, hoy, manana]);

  useEffect(() => {
    setSeleccion([]);
    setColecta("todas");
  }, [filtro, dia]);

  useEffect(() => setSeleccion([]), [colecta]);

  const objetivo = (predicado) => {
    const base = seleccion.length ? visibles.filter((s) => seleccion.includes(s.shipment_id)) : visibles;
    return base.filter(predicado);
  };

  // Descarga con la sesión del usuario (la ruta exige token; window.open no lo manda)
  const abrirEtiquetas = async (ids) => {
    setTrabajando(true);
    try {
      const r = await axios.get(`${apiUrl}/pedidos/imprimir-etiqueta/${ids.join(",")}`, { headers: authHeaders(), responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiquetas_aphelios_${dayjs().format("YYYYMMDD_HHmm")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      let msg = "No se pudieron descargar las etiquetas.";
      try {
        msg = JSON.parse(await e.response.data.text())?.message || msg;
      } catch (_) {}
      Swal.fire("Error", msg, "error");
    } finally {
      setTrabajando(false);
    }
  };

  const imprimir = async () => {
    const candidatos = objetivo((s) => ESTADOS_IMPRIMIBLES.includes(s.estado_operativo));
    const lista = candidatos.filter(tieneReserva);
    if (!lista.length) {
      return Swal.fire("Sin envíos", candidatos.length ? "Los envíos de la lista no tienen stock reservado." : "No hay envíos para imprimir con este filtro.", "info");
    }
    if (lista.length > 50) return Swal.fire("Demasiados envíos", "Máximo 50 etiquetas por descarga; selecciona menos.", "warning");
    await abrirEtiquetas(lista.map((s) => s.shipment_id));
    if (candidatos.length > lista.length) {
      Swal.fire("Etiquetas descargadas", `${candidatos.length - lista.length} envío(s) sin stock reservado se omitieron.`, "info");
    }
  };

  const procesar = async () => {
    const lista = objetivo((s) => s.mostrar_en_recolectados === true);
    if (!lista.length) return Swal.fire("Sin recolectados", "No hay envíos recolectados pendientes de procesar.", "info");

    const productos = lista.reduce((t, s) => t + s.items.reduce((st, i) => st + Number(i.cantidad || 0), 0), 0);
    const reservas = lista.reduce(
      (t, s) => t + s.items.reduce((st, i) => st + (i.localidades || []).reduce((lt, l) => lt + Number(l.cantidad_reservada || 0), 0), 0),
      0,
    );

    const conf = await Swal.fire({
      icon: "warning",
      title: "Procesar recolectados",
      html: `Se generará y procesará una <b>orden de bodega de salida</b> por <b>${lista.length}</b> envío(s), <b>${productos}</b> producto(s) y <b>${reservas}</b> pieza(s) reservadas.<br/><br/>Esto descuenta existencias y no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Generar y procesar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2e7d32",
    });
    if (!conf.isConfirmed) return;

    setTrabajando(true);
    try {
      const r = await axios.post(
        `${apiUrl}/pedidos/procesarRecolectados`,
        { shipmentIds: lista.map((s) => s.shipment_id) },
        { headers: authHeaders() },
      );
      if (r.data.ok) Swal.fire("Listo", `Orden ${r.data.orden_id} generada y procesada.`, "success");
    } catch (error) {
      const msg = error.response?.data?.message;
      if (msg) {
        // Errores de stock que manda el backend
        const errores = msg.errores || [];
        const detalleErrores = errores
          .map(
            (e) =>
              `<div style="text-align:left;font-size:14px;margin-bottom:8px">• <b>SKU:</b> ${e.sku} · <b>ML:</b> ${e.inventory_id} · <b>Localidad:</b> ${e.localidad}<br/>&nbsp;&nbsp;Disponible <b style="color:#dc2626">${e.cantidad_disponible}</b> · Requerido <b style="color:#16a34a">${e.cantidad_requerida}</b></div>`,
          )
          .join("");
        Swal.fire({
          icon: "error",
          title: "Stock insuficiente",
          width: 650,
          html: `<div style="text-align:left;margin-bottom:12px"><b>${msg.messageText || "Error al procesar la orden"}</b></div>${
            detalleErrores ? `<div style="max-height:300px;overflow-y:auto;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #cbd5e1">${detalleErrores}</div>` : ""
          }`,
        });
      } else {
        Swal.fire("Error al procesar", error.response?.data?.mensaje || error.message || "Ocurrió un error inesperado.", "error");
      }
    } finally {
      setTrabajando(false);
      await cargar();
    }
  };

  const columnas = [
    { field: "shipment_id", headerName: "Envío", width: 130 },
    {
      field: "orden_id",
      headerName: "Orden / pack",
      width: 170,
      renderCell: (p) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2">{p.value}</Typography>
          {p.row.pack_id && (
            <Typography variant="caption" color="text.secondary">
              Pack {p.row.pack_id}
            </Typography>
          )}
        </Box>
      ),
    },
    { field: "buyer_nickname", headerName: "Comprador", width: 140 },
    {
      field: "items",
      headerName: "Producto",
      flex: 1,
      minWidth: 320,
      sortable: false,
      valueGetter: (v) => (v || []).map((i) => `${i.sku} ${i.title}`).join(" | "),
      renderCell: (p) => (
        <Stack gap={0.75} sx={{ py: 0.75 }}>
          {p.row.items.map((i) => (
            <Stack key={i.venta_operativa_id} direction="row" gap={1} alignItems="center">
              <Avatar variant="rounded" src={i.thumbnail || undefined} sx={{ width: 36, height: 36 }}>
                <Inventory2OutlinedIcon fontSize="small" />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "normal", lineHeight: 1.25 }}>
                  {i.cantidad} × {i.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  SKU {i.sku}
                  {i.permalink && (
                    <>
                      {" · "}
                      <a href={i.permalink} target="_blank" rel="noreferrer">
                        Ver publicación
                      </a>
                    </>
                  )}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      ),
    },
    {
      field: "ubicacion",
      headerName: "Ubicación reservada",
      width: 170,
      sortable: false,
      valueGetter: (v, row) =>
        (row.items || [])
          .flatMap((i) => i.localidades || [])
          .map((l) => `${l.descripcion} (${l.cantidad_reservada})`)
          .join(", "),
      renderCell: (p) =>
        p.value ? (
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "normal" }}>
            {p.value}
          </Typography>
        ) : (
          <Typography variant="caption" color="error">
            Sin stock disponible
          </Typography>
        ),
    },
    {
      field: "expected_date",
      headerName: "Colecta",
      width: 190,
      valueFormatter: (v) => formatoFecha(v, true),
      renderCell: (p) => {
        const retraso = diasRetraso(p.value);
        return (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2">{p.value ? formatoFecha(p.value, true) : "—"}</Typography>
            {p.row.pendiente_procesar_bodega === true ? (
              <Tooltip arrow title="Mercado Libre ya se llevó el paquete, pero el stock aún no se descuenta. Procésalo en Recolectadas.">
                <Chip size="small" color="warning" label="Sin procesar" sx={{ height: 18, fontWeight: 600 }} />
              </Tooltip>
            ) : (
              retraso > 0 &&
              p.row.mostrar_en_recolectados !== true && (
                <Chip size="small" color="error" label={`Atrasado ${retraso} día${retraso > 1 ? "s" : ""}`} sx={{ height: 18, fontWeight: 600 }} />
              )
            )}
          </Box>
        );
      },
    },
    {
      field: "estado_operativo",
      headerName: "Estado",
      width: 160,
      valueGetter: (v, row) => (row.mostrar_en_recolectados === true ? "recolectado" : v),
      renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADO_ML} />,
    },
    { field: "estado_operativo_interno", headerName: "Reserva", width: 140, renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADO_RESERVA} /> },
    { field: "date_created", headerName: "Venta", width: 180, valueFormatter: (v) => formatoFecha(v, true) },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 110,
      sortable: false,
      filterable: false,
      disableExport: true,
      renderCell: (p) => (
        <Stack direction="row" gap={0.5}>
          {ESTADOS_IMPRIMIBLES.includes(p.row.estado_operativo) && tieneReserva(p.row) && (
            <Tooltip arrow title={p.row.estado_operativo === "ready_to_print" ? "Imprimir etiqueta" : "Reimprimir etiqueta"}>
              <IconButton size="small" color="primary" onClick={() => abrirEtiquetas([p.row.shipment_id])}>
                <PrintOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip arrow title="Ver proceso">
            <IconButton size="small" onClick={() => setDetalle(p.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
        <KpiCard icon={PrintOutlinedIcon} color="#ed6c02" label="Etiquetas por imprimir" valor={kpi.imprimirHoy} detalle={`Hoy y atrasadas · ${kpi.imprimirManana} para mañana`} />
        <KpiCard icon={LocalShippingOutlinedIcon} color="#0288d1" label="Listas para enviar" valor={kpi.listasHoy} detalle={`Hoy y atrasadas · ${kpi.listasManana} para mañana`} />
        <KpiCard icon={AssignmentReturnOutlinedIcon} color="#2e7d32" label="Recolectadas por procesar" valor={kpi.recolectadas} detalle={`${kpi.atrasadas} de colectas anteriores`} />
        <KpiCard icon={ReportProblemOutlinedIcon} color="#d32f2f" label="Sin stock reservado" valor={kpi.sinStock} detalle={`${kpi.piezas} piezas en ${envios.length} envíos`} />
      </Box>

      <SectionCard
        icon={TaskAltOutlinedIcon}
        title={FILTROS[filtro].label}
        subtitle={seleccion.length ? `${seleccion.length} seleccionado(s): las acciones aplican solo a ellos.` : "Sin selección: las acciones aplican a todos los envíos visibles."}
        count={visibles.length}
        actions={
          <>
            <ToggleButtonGroup size="small" exclusive value={filtro} onChange={(e, v) => v && setFiltro(v)} sx={{ flexWrap: "wrap" }}>
              {Object.entries(FILTROS).map(([k, f]) => (
                <ToggleButton key={k} value={k} sx={{ textTransform: "none", fontWeight: 600, px: 1.5 }}>
                  {f.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField select size="small" label="Colecta" value={dia} onChange={(e) => setDia(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="hoy">Hoy y atrasadas</MenuItem>
              <MenuItem value="manana">Mañana</MenuItem>
              <MenuItem value="proximos">Próximos días</MenuItem>
              <MenuItem value="todos">Todas las fechas</MenuItem>
            </TextField>
            <Tooltip arrow title="Abre las etiquetas de los envíos con stock reservado">
              <span>
                <Button variant="outlined" size="small" startIcon={<PrintOutlinedIcon />} sx={botonSx} disabled={trabajando || !visibles.length} onClick={imprimir}>
                  Imprimir etiquetas
                </Button>
              </span>
            </Tooltip>
            <Tooltip arrow title="Genera y procesa la orden de bodega de salida de los envíos ya recolectados">
              <span>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AssignmentReturnOutlinedIcon />}
                  sx={botonSx}
                  disabled={trabajando || !visibles.some((s) => s.mostrar_en_recolectados === true)}
                  onClick={procesar}
                >
                  Procesar recolectados
                </Button>
              </span>
            </Tooltip>
            <Tooltip arrow title="Actualizar">
              <span>
                <Button variant="outlined" size="small" startIcon={<RefreshIcon />} sx={botonSx} disabled={cargando} onClick={cargar}>
                  Actualizar
                </Button>
              </span>
            </Tooltip>
          </>
        }
      >
        <FiltroColecta envios={filtrados} etiquetaEstado={FILTROS[filtro].label} valor={colecta} onChange={setColecta} />
        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            rows={visibles}
            columns={columnas}
            getRowId={(r) => r.shipment_id}
            getRowHeight={() => "auto"}
            checkboxSelection
            rowSelectionModel={seleccion}
            onRowSelectionModelChange={(m) => setSeleccion(m)}
            showCellVerticalBorder
            showColumnVerticalBorder
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            density="compact"
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            initialState={PAGINACION_INICIAL}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" } }}
            loading={cargando}
            sx={gridSx}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: `No hay envíos de Aphelios en «${FILTROS[filtro].label}».` }}
          />
        </Box>
      </SectionCard>

      <Dialog open={!!detalle} onClose={() => setDetalle(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <TimelineOutlinedIcon color="primary" /> Proceso del envío
          <Chip size="small" label={detalle?.shipment_id} sx={{ bgcolor: "#e3f2fd", color: "primary.main", fontWeight: 700 }} />
        </DialogTitle>
        <DialogContent dividers>
          {detalle && (
            <Stack gap={2}>
              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, 1fr)" }}>
                {[
                  ["Cliente", detalle.buyer_nickname],
                  ["Estado interno", ESTADO_RESERVA[detalle.estado_operativo_interno]?.label || detalle.estado_operativo_interno],
                  ["Productos", detalle.total_productos],
                  ["Reservados", detalle.productos_reservados],
                  ["Sin reserva", detalle.productos_sin_reserva],
                  ["Orden de bodega", detalle.items?.[0]?.orden_bodega_id || "N/A"],
                ].map(([k, v]) => (
                  <Box key={k}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase" }}>
                      {k}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {v ?? "—"}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Stepper orientation="vertical" activeStep={-1}>
                {pasos(detalle).map((paso) => (
                  <Step key={paso.label} completed={paso.completed}>
                    <StepLabel error={false} sx={paso.current ? { "& .MuiStepLabel-label": { color: "warning.main", fontWeight: 700 }, "& .MuiStepIcon-root": { color: "warning.main" } } : undefined}>
                      {paso.label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button sx={botonSx} onClick={() => setDetalle(null)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ColectaPrincipal;
