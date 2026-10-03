// [MULTICUENTA-ML] Pantalla "Stock compartido" (solo administradores).
// Vínculos subcuenta -> producto, disponible contra Mercado Libre por cuenta,
// historial de stock, notificaciones y anomalías.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  GlobalStyles,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";

import { mcGet, mcPatch, mcPost, mensajeError } from "./multicuentaApi";
import {
  GRID_HEIGHT,
  PAGE_SIZE_OPTIONS,
  PAGINACION_INICIAL,
  LOCALE_TEXT_GRID,
  gridSx,
  botonSx,
  SectionCard,
  KpiCard,
  KpiValor,
  kpiGridSx,
  EstadoChip,
  CuentaChip,
} from "./uiMulticuenta";

const ESTADOS_VINCULO = {
  vinculado: { label: "Vinculado", color: "success" },
  sin_sku: { label: "Sin SELLER_SKU", color: "warning" },
  sin_destino: { label: "SKU sin destino", color: "error" },
  full: { label: "Full (no aplica)", color: "default" },
  pendiente: { label: "Pendiente", color: "default" },
};

const RESULTADOS_STOCK = {
  actualizado: { label: "Actualizado", color: "success" },
  simulado: { label: "Simulado", color: "info" },
  sin_cambio: { label: "Sin cambio", color: "default" },
  omitido: { label: "Omitido", color: "warning" },
  error: { label: "Error", color: "error" },
};

const ESTADOS_NOTIF = {
  pendiente: { label: "Pendiente", color: "default" },
  procesando: { label: "Procesando", color: "warning" },
  procesada: { label: "Procesada", color: "success" },
  filtrada: { label: "Filtrada", color: "default" },
  ignorada: { label: "Ignorada", color: "default" },
  sospechosa: { label: "Sospechosa", color: "secondary" },
  error: { label: "Error", color: "error" },
};

const fecha = (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "");

const gridComunProps = {
  showCellVerticalBorder: true,
  showColumnVerticalBorder: true,
  disableRowSelectionOnClick: true,
  hideFooterSelectedRowCount: true,
  density: "compact",
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  initialState: PAGINACION_INICIAL,
  slots: { toolbar: GridToolbar },
  slotProps: { loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" } },
  sx: gridSx,
};

const StockML = ({ dato }) => {
  if (!dato) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const visto = dato.stock_escrito ?? dato.stock_ml_antes;
  return (
    <Tooltip arrow title={`${RESULTADOS_STOCK[dato.resultado]?.label || dato.resultado} · ${fecha(dato.created_at)}${dato.error ? ` · ${dato.error}` : ""}`}>
      <Stack direction="row" gap={0.5} alignItems="center" sx={{ height: "100%" }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{visto ?? "—"}</Typography>
        <EstadoChip valor={dato.resultado} mapa={RESULTADOS_STOCK} />
      </Stack>
    </Tooltip>
  );
};

const StockCompartido = () => {
  const [tab, setTab] = useState(0);
  const [resumen, setResumen] = useState(null);
  const [vinculos, setVinculos] = useState([]);
  const [log, setLog] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [anomalias, setAnomalias] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroNotif, setFiltroNotif] = useState("");
  const [filtroResultado, setFiltroResultado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [r, v, l, n, a] = await Promise.all([
        mcGet("/stock/resumen"),
        mcGet("/stock/vinculos", { estado: filtroEstado || undefined }),
        mcGet("/stock/log", { resultado: filtroResultado || undefined, limite: 1000 }),
        mcGet("/notificaciones", { estado: filtroNotif || undefined }),
        mcGet("/anomalias"),
      ]);
      setResumen(r);
      setVinculos(v.filas || []);
      setLog(l.filas || []);
      setNotifs(n.filas || []);
      setAnomalias(a.filas || []);
    } catch (e) {
      Swal.fire("Error", await mensajeError(e, "No se pudo cargar la información."), "error");
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, filtroNotif, filtroResultado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ejecutar = async (titulo, accion, mensajeOk) => {
    setTrabajando(true);
    try {
      const r = await accion();
      await cargar();
      Swal.fire({ icon: "success", title: titulo, html: mensajeOk(r), width: 600 });
    } catch (e) {
      Swal.fire("Error", await mensajeError(e), "error");
    } finally {
      setTrabajando(false);
    }
  };

  const descubrir = () =>
    ejecutar("Publicaciones revisadas", () => mcPost("/stock/descubrir"), (r) =>
      (r.resultado || [])
        .map(
          (c) =>
            `<b>${c.cuenta}</b>: ${c.publicaciones} publicaciones ` +
            Object.entries(c.por_estado || {})
              .map(([k, v]) => `${ESTADOS_VINCULO[k]?.label || k}: ${v}`)
              .join(", ") +
            (c.error ? ` <span style="color:#d32f2f">(${c.error})</span>` : ""),
        )
        .join("<br/>") || "Sin subcuentas activas.",
    );

  const sincronizar = (productoIds) =>
    ejecutar("Stock sincronizado", () => mcPost("/stock/sincronizar", { productoIds }), (r) => {
      const x = r.resultado;
      return `Modo <b>${x.modo}</b> · revisados ${x.revisados} · actualizados ${x.actualizado} · simulados ${x.simulado} · sin cambio ${x.sin_cambio} · errores ${x.error}`;
    });

  const cicloCompleto = () =>
    ejecutar("Ciclo ejecutado", () => mcPost("/ciclo"), (r) => {
      const v = r.resultado?.ventas;
      const s = r.resultado?.stock;
      return (
        `Ventas: ${(v?.cuentas || []).map((c) => `${c.cuenta} ${c.error ? "error" : `${c.nuevas} nuevas / ${c.actualizadas} actualizadas`}`).join(" · ")}<br/>` +
        `Stock: ${s?.error && !s.modo ? s.error : `revisados ${s?.revisados ?? 0}, actualizados ${s?.actualizado ?? 0}, simulados ${s?.simulado ?? 0}`}`
      );
    });

  const missedFeeds = () =>
    ejecutar("missed_feeds consultado", () => mcPost("/notificaciones/missed-feeds"), (r) =>
      (Array.isArray(r.resultado) ? r.resultado : [])
        .map((c) => `<b>${c.cuenta}</b>: ${c.recuperadas} recuperadas${c.error ? ` (${c.error})` : ""}`)
        .join("<br/>") || JSON.stringify(r.resultado),
    );

  const reintentar = (ids) =>
    ejecutar("Notificaciones reabiertas", () => mcPost("/notificaciones/reintentar", { ids }), (r) => `${r.resultado.reabiertas} notificación(es) en cola.`);

  const cambiarActivo = async (row, activo) => {
    try {
      await mcPatch(`/stock/vinculos/${row.id}`, { activo });
      setVinculos((prev) => prev.map((v) => (v.id === row.id ? { ...v, activo: activo ? 1 : 0 } : v)));
    } catch (e) {
      Swal.fire("Error", await mensajeError(e), "error");
    }
  };

  // ---------------- KPIs
  const cfg = resumen?.config;
  const kpis = useMemo(() => {
    const porEstado = {};
    for (const v of resumen?.vinculos || []) porEstado[v.estado] = (porEstado[v.estado] || 0) + Number(v.total);
    const stock24 = Object.fromEntries((resumen?.stock_24h || []).map((s) => [s.resultado, Number(s.total)]));
    const receptor = (resumen?.receptor || [])[0];
    return { porEstado, stock24, receptor };
  }, [resumen]);

  const problemas = (kpis.porEstado.sin_sku || 0) + (kpis.porEstado.sin_destino || 0);
  const receptor = kpis.receptor;
  const receptorCaido = !receptor || Number(receptor.segundos) > 120;

  // ---------------- Columnas
  const colVinculos = [
    { field: "cuenta", headerName: "Cuenta", width: 150, renderCell: (p) => <CuentaChip nombre={p.value} /> },
    { field: "item_id", headerName: "MLM subcuenta", width: 130 },
    { field: "titulo", headerName: "Publicación", flex: 1, minWidth: 220 },
    { field: "seller_sku", headerName: "SELLER_SKU", width: 140 },
    { field: "producto_id", headerName: "Producto base", width: 115 },
    { field: "producto_sku", headerName: "SKU Aphelios", width: 140 },
    {
      field: "disponible",
      headerName: "Disponible",
      width: 105,
      type: "number",
      renderCell: (p) =>
        p.value == null ? "—" : (
          <Tooltip
            arrow
            placement="top"
            title={
              p.row.calculo
                ? `Existencias ${p.row.calculo.existencias} − reservas ML ${p.row.calculo.reservado_ml} − órdenes ${p.row.calculo.reservado_bodega} − sin reserva ${p.row.calculo.operativas_sin_reserva} − cobradas sin operativa ${p.row.calculo.vendido_sin_operativa} · ${p.row.calculo.opciones?.length || 1} opción(es) de venta`
                : ""
            }
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", height: "100%", fontWeight: 700 }}>{p.value}</Box>
          </Tooltip>
        ),
    },
    { field: "ml_subcuenta", headerName: "ML subcuenta", width: 150, sortable: false, renderCell: (p) => <StockML dato={p.value} /> },
    { field: "ml_principal", headerName: "ML principal", width: 150, sortable: false, renderCell: (p) => <StockML dato={p.value} /> },
    {
      field: "estado",
      headerName: "Estado",
      width: 150,
      renderCell: (p) => (
        <Tooltip arrow title={p.row.detalle || ""}>
          <span>
            <EstadoChip valor={p.value} mapa={ESTADOS_VINCULO} />
          </span>
        </Tooltip>
      ),
    },
    {
      field: "activo",
      headerName: "Sincronizar",
      width: 105,
      renderCell: (p) => (
        <Switch size="small" checked={Number(p.value) === 1} disabled={p.row.estado !== "vinculado"} onChange={(e) => cambiarActivo(p.row, e.target.checked)} />
      ),
    },
    {
      field: "acciones",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (p) =>
        p.row.estado === "vinculado" ? (
          <Tooltip arrow title="Sincronizar este producto ahora">
            <span>
              <IconButton size="small" color="primary" disabled={trabajando} onClick={() => sincronizar([Number(p.row.producto_id)])}>
                <SyncAltOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : null,
    },
  ];

  const colLog = [
    { field: "created_at", headerName: "Fecha", width: 140, valueFormatter: (v) => fecha(v) },
    { field: "producto_id", headerName: "Producto base", width: 115 },
    { field: "cuenta", headerName: "Cuenta", width: 150, renderCell: (p) => <CuentaChip nombre={p.value} principal={Number(p.row.cuenta_ml_id) === Number(resumen?.cuentas?.find((c) => c.tipo === "principal")?.id)} /> },
    { field: "item_id", headerName: "MLM", width: 130 },
    { field: "disponible", headerName: "Disponible", width: 95, type: "number" },
    { field: "stock_ml_antes", headerName: "ML antes", width: 90, type: "number" },
    { field: "stock_escrito", headerName: "Escrito", width: 85, type: "number" },
    { field: "resultado", headerName: "Resultado", width: 120, renderCell: (p) => <EstadoChip valor={p.value} mapa={RESULTADOS_STOCK} /> },
    { field: "modo", headerName: "Modo", width: 100 },
    { field: "motivo", headerName: "Motivo", width: 130 },
    { field: "error", headerName: "Detalle", flex: 1, minWidth: 200 },
  ];

  const colNotif = [
    { field: "fecha_recibida", headerName: "Recibida", width: 140, valueFormatter: (v) => fecha(v) },
    { field: "cuenta", headerName: "Cuenta", width: 150, renderCell: (p) => (p.value ? <CuentaChip nombre={p.value} /> : "—") },
    { field: "resource", headerName: "Recurso", width: 210 },
    { field: "ruta", headerName: "Ruta", width: 70 },
    { field: "estado", headerName: "Estado", width: 120, renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADOS_NOTIF} /> },
    { field: "veces_recibida", headerName: "Veces", width: 70, type: "number" },
    { field: "intentos_proceso", headerName: "Intentos", width: 80, type: "number" },
    { field: "ip", headerName: "IP", width: 120 },
    { field: "motivo", headerName: "Motivo / error", flex: 1, minWidth: 220, valueGetter: (v, row) => row.error || v || "" },
    {
      field: "acciones",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (p) =>
        ["error", "sospechosa"].includes(p.row.estado) ? (
          <Tooltip arrow title="Volver a procesar">
            <IconButton size="small" color="primary" onClick={() => reintentar([p.row.id])}>
              <ReplayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null,
    },
  ];

  const colAnomalias = [
    { field: "updated_at", headerName: "Última vez", width: 140, valueFormatter: (v) => fecha(v) },
    { field: "cuenta", headerName: "Cuenta", width: 150 },
    { field: "order_id", headerName: "Orden", width: 160 },
    { field: "item_id", headerName: "MLM", width: 130 },
    { field: "tipo", headerName: "Tipo", width: 200 },
    { field: "veces", headerName: "Veces", width: 70, type: "number" },
    { field: "detalle", headerName: "Detalle", flex: 1, minWidth: 260 },
  ];

  const filtroSelect = (valor, setValor, opciones, etiqueta) => (
    <TextField
      select
      size="small"
      label={etiqueta}
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      SelectProps={{ displayEmpty: true }}
      InputLabelProps={{ shrink: true }}
      sx={{ minWidth: 170 }}
    >
      <MenuItem value="">Todos</MenuItem>
      {Object.entries(opciones).map(([k, v]) => (
        <MenuItem key={k} value={k}>
          {v.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />

      {/* Encabezado */}
      <Paper elevation={2} sx={{ p: 1.5, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, display: "flex", gap: 1, alignItems: "center" }}>
            <CloudSyncOutlinedIcon color="primary" /> Stock compartido Mercado Libre
            {cfg && (
              <Chip
                size="small"
                label={cfg.stock_modo === "real" ? (cfg.stock_lista_blanca.length ? `Real · lista blanca (${cfg.stock_lista_blanca.length})` : "Real") : "Simulación"}
                color={cfg.stock_modo === "real" ? "success" : "info"}
                sx={{ fontWeight: 700 }}
              />
            )}
            {cfg && !cfg.multicuenta_activo && <Chip size="small" label="Crons apagados" color="warning" sx={{ fontWeight: 700 }} />}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            Un solo stock, calculado desde existencias, en la cuenta principal y sus subcuentas. SELLER_SKU: {cfg?.seller_sku_estrategia === "user_product_principal" ? "MLMU de la principal" : cfg?.seller_sku_estrategia}
          </Typography>
        </Box>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Tooltip arrow title="Lee todas las publicaciones de las subcuentas y actualiza los vínculos por SELLER_SKU">
            <span>
              <Button variant="outlined" size="small" startIcon={<TravelExploreOutlinedIcon />} sx={botonSx} disabled={trabajando} onClick={descubrir}>
                Descubrir publicaciones
              </Button>
            </span>
          </Tooltip>
          <Tooltip arrow title="Recalcula y escribe (o simula) el stock de todos los productos vinculados">
            <span>
              <Button variant="outlined" size="small" startIcon={<SyncAltOutlinedIcon />} sx={botonSx} disabled={trabajando} onClick={() => sincronizar()}>
                Sincronizar stock
              </Button>
            </span>
          </Tooltip>
          <Tooltip arrow title="Ventas de todas las cuentas + ventas de subcuenta a almacén + envíos + stock (lo mismo que el cron de 5 minutos)">
            <span>
              <Button variant="outlined" size="small" startIcon={<PlayCircleOutlineIcon />} sx={botonSx} disabled={trabajando} onClick={cicloCompleto}>
                Ciclo completo
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
        </Stack>
      </Paper>

      {/* Alertas */}
      {resumen && receptorCaido && (
        <Alert severity="error">
          El receptor de notificaciones no ha reportado {receptor ? `en ${Math.round(Number(receptor.segundos) / 60)} min` : "nunca"}. Revisa el proceso
          <b> aphelios-ml-webhooks</b> (pm2 status) y el bloque /webhooks en Nginx.
        </Alert>
      )}
      {receptor?.datos?.alerta_lag && (
        <Alert severity="warning">
          El receptor tuvo un retraso de {receptor.datos.event_loop_lag_ms_max} ms en el último minuto. Mercado Libre exige responder en menos de 500 ms.
        </Alert>
      )}
      {(resumen?.alertas_silencio || []).map((s) => (
        <Alert key={s.cuenta_ml_id} severity="warning">
          <b>{s.cuenta}</b> tiene {s.ventas_2h} venta(s) en las últimas 2 horas y ninguna notificación: los topics pudieron desactivarse. Revisa la app en Mercado
          Libre y vuelve a suscribir orders_v2.
        </Alert>
      ))}

      {/* KPIs */}
      <Box sx={kpiGridSx}>
        <KpiCard icon={LinkOutlinedIcon} color="#2e7d32" label="Publicaciones vinculadas">
          <KpiValor valor={kpis.porEstado.vinculado || 0} detalle={`${kpis.porEstado.full || 0} Full sin sincronizar`} />
        </KpiCard>
        <KpiCard icon={ReportProblemOutlinedIcon} color="#ed6c02" label="Por corregir en ML">
          <KpiValor valor={problemas} detalle={`${kpis.porEstado.sin_sku || 0} sin SELLER_SKU · ${kpis.porEstado.sin_destino || 0} sin destino`} />
        </KpiCard>
        <KpiCard icon={Inventory2OutlinedIcon} color="#1976d2" label="Stock últimas 24 h">
          <KpiValor
            valor={(kpis.stock24.actualizado || 0) + (kpis.stock24.simulado || 0)}
            detalle={`${kpis.stock24.actualizado || 0} escritos · ${kpis.stock24.simulado || 0} simulados · ${kpis.stock24.error || 0} errores`}
          />
        </KpiCard>
        <KpiCard icon={SpeedOutlinedIcon} color={receptorCaido ? "#d32f2f" : "#6a1b9a"} label="Receptor de notificaciones">
          <KpiValor
            valor={receptorCaido ? "Sin latido" : `${receptor?.datos?.respuesta_ms_p95 ?? "—"} ms`}
            detalle={receptor ? `p95 de respuesta · ${receptor.datos?.recibidas ?? 0} recibidas · último latido ${fecha(receptor.ultimo_latido)}` : "Aún no reporta"}
          />
        </KpiCard>
      </Box>

      <Paper elevation={2} sx={{ borderRadius: 3, px: 1 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab label={`Vínculos (${vinculos.length})`} />
          <Tab label="Historial de stock" />
          <Tab label={`Notificaciones (${notifs.length})`} />
          <Tab label={`Anomalías (${anomalias.length})`} />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <SectionCard
          icon={LinkOutlinedIcon}
          title="Publicaciones de subcuenta"
          subtitle="Cada publicación se liga por su SELLER_SKU (MLMU de la principal) al producto base: el producto_id más viejo del MLMU."
          count={vinculos.length}
          actions={filtroSelect(filtroEstado, setFiltroEstado, ESTADOS_VINCULO, "Estado")}
        >
          <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
            <DataGrid
              {...gridComunProps}
              rows={vinculos}
              columns={colVinculos}
              loading={cargando}
              getRowId={(r) => r.id}
              localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Sin publicaciones de subcuenta. Usa «Descubrir publicaciones»." }}
            />
          </Box>
        </SectionCard>
      )}

      {tab === 1 && (
        <SectionCard
          icon={HistoryOutlinedIcon}
          title="Historial de stock"
          subtitle="Cada lectura y escritura hacia Mercado Libre. En simulación se registra lo que se habría escrito."
          count={log.length}
          actions={filtroSelect(filtroResultado, setFiltroResultado, RESULTADOS_STOCK, "Resultado")}
        >
          <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
            <DataGrid
              {...gridComunProps}
              rows={log}
              columns={colLog}
              loading={cargando}
              getRowId={(r) => r.id}
              getRowClassName={(p) => (p.row.resultado === "simulado" && p.row.stock_ml_antes !== p.row.stock_escrito ? "fila-diferencia" : "")}
              sx={{ ...gridSx, "& .fila-diferencia": { bgcolor: "#fff8e1" } }}
              localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Todavía no hay movimientos de stock." }}
            />
          </Box>
        </SectionCard>
      )}

      {tab === 2 && (
        <SectionCard
          icon={NotificationsActiveOutlinedIcon}
          title="Notificaciones orders_v2"
          subtitle="Se responde 200 al instante y se procesan después. Las sospechosas no se procesan hasta revisarlas."
          count={notifs.length}
          actions={
            <>
              {filtroSelect(filtroNotif, setFiltroNotif, ESTADOS_NOTIF, "Estado")}
              <Tooltip arrow title="Consulta en Mercado Libre las notificaciones que no recibieron 200 (guarda 2 días)">
                <span>
                  <Button variant="outlined" size="small" startIcon={<CloudDownloadOutlinedIcon />} sx={botonSx} disabled={trabajando} onClick={missedFeeds}>
                    Recuperar perdidas
                  </Button>
                </span>
              </Tooltip>
              <Button variant="outlined" size="small" startIcon={<ReplayIcon />} sx={botonSx} disabled={trabajando} onClick={() => reintentar()}>
                Reintentar errores
              </Button>
            </>
          }
        >
          <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
            <DataGrid
              {...gridComunProps}
              rows={notifs}
              columns={colNotif}
              loading={cargando}
              getRowId={(r) => r.id}
              localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Sin notificaciones con ese filtro." }}
            />
          </Box>
        </SectionCard>
      )}

      {tab === 3 && (
        <SectionCard
          icon={ReportProblemOutlinedIcon}
          title="Anomalías del sincronizador"
          subtitle="Ventas que no se pudieron ligar a un producto, SKU sin destino, órdenes de otra cuenta…"
          count={anomalias.length}
        >
          <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
            <DataGrid
              {...gridComunProps}
              rows={anomalias}
              columns={colAnomalias}
              loading={cargando}
              getRowId={(r) => r.id}
              localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Sin anomalías pendientes." }}
            />
          </Box>
        </SectionCard>
      )}
    </Box>
  );
};

export default StockCompartido;
