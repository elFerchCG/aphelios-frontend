// [MULTICUENTA-ML] Pantalla "Colecta subcuenta": envíos Mercado Envíos de las
// subcuentas (Refaccionaria AP), etiquetas con el token de su cuenta y
// "Procesar recolectados" -> orden de salida tipo 28, origen ventas_me_refa.
// La colecta de la principal (VentasME) no cambia.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  GlobalStyles,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import { mcDescargar, mcGet, mcPost, mensajeError } from "./multicuentaApi";
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

const ESTADO_ML = {
  ready_to_print: { label: "Por imprimir", color: "warning" },
  etiqueta_impresa: { label: "Etiqueta impresa", color: "info" },
  listo_para_recolectar: { label: "Lista para recolectar", color: "info" },
  en_procesamiento: { label: "En procesamiento", color: "default" },
  recolectado: { label: "Recolectado", color: "success" },
  en_camino: { label: "En camino", color: "success" },
  entregado: { label: "Entregado", color: "success" },
  no_entregado: { label: "No entregado", color: "error" },
  cancelado: { label: "Cancelado", color: "error" },
  pendiente: { label: "Pendiente", color: "default" },
};

const ESTADO_RESERVA = {
  reservado: { label: "Reservado", color: "success" },
  parcialmente_reservado: { label: "Reserva parcial", color: "warning" },
  sin_stock: { label: "Sin reserva", color: "error" },
  cancelado: { label: "Cancelado", color: "default" },
};

const FILTROS = {
  por_imprimir: { label: "Por imprimir", fn: (s) => s.estado_operativo === "ready_to_print" },
  listas: { label: "Listas para enviar", fn: (s) => ["etiqueta_impresa", "listo_para_recolectar"].includes(s.estado_operativo) },
  recolectadas: { label: "Recolectadas", fn: (s) => s.mostrar_en_recolectados },
  canceladas: { label: "Canceladas", fn: (s) => s.estado_operativo === "cancelado" },
  todas: { label: "Todas", fn: () => true },
};

const fecha = (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "");

const ColectaSubcuenta = () => {
  const [envios, setEnvios] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaId, setCuentaId] = useState("");
  const [filtro, setFiltro] = useState("por_imprimir");
  const [dia, setDia] = useState("todos");
  const [seleccion, setSeleccion] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await mcGet("/colecta", { cuentaMlId: cuentaId || undefined });
      setEnvios(r.data || []);
      const ctas = new Map((r.data || []).map((s) => [s.cuenta_ml_id, s.cuenta]));
      setCuentas((prev) => {
        const m = new Map(prev.map((c) => [c.id, c.nombre]));
        for (const [id, nombre] of ctas) m.set(id, nombre);
        return [...m.entries()].map(([id, nombre]) => ({ id, nombre }));
      });
    } catch (e) {
      Swal.fire("Error", await mensajeError(e, "No se pudo cargar la colecta."), "error");
    } finally {
      setCargando(false);
    }
  }, [cuentaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hoy = dayjs().format("YYYY-MM-DD");
  const manana = dayjs().add(1, "day").format("YYYY-MM-DD");

  const pasaDia = useCallback(
    (s) => {
      if (dia === "hoy") return !s.fecha_colecta_key || s.fecha_colecta_key <= hoy;
      if (dia === "manana") return s.fecha_colecta_key === manana;
      if (dia === "proximos") return s.fecha_colecta_key > hoy;
      return true;
    },
    [dia, hoy, manana],
  );

  const visibles = useMemo(() => envios.filter((s) => FILTROS[filtro].fn(s) && pasaDia(s)), [envios, filtro, pasaDia]);

  const kpi = useMemo(
    () => ({
      porImprimir: envios.filter(FILTROS.por_imprimir.fn).length,
      listas: envios.filter(FILTROS.listas.fn).length,
      recolectadas: envios.filter(FILTROS.recolectadas.fn).length,
      atrasadas: envios.filter((s) => s.pendiente_procesar_bodega).length,
      sinStock: envios.filter((s) => s.estado_operativo_interno === "sin_stock" && s.estado_operativo !== "cancelado").length,
      piezas: envios.filter((s) => s.estado_operativo !== "cancelado").reduce((t, s) => t + Number(s.cantidad_piezas || 0), 0),
    }),
    [envios],
  );

  useEffect(() => setSeleccion([]), [filtro, dia, cuentaId]);

  const objetivo = (predicado) => {
    const base = seleccion.length ? visibles.filter((s) => seleccion.includes(s.shipment_id)) : visibles;
    return base.filter(predicado);
  };

  const imprimir = async () => {
    const lista = objetivo((s) => s.estado_operativo !== "cancelado");
    if (!lista.length) return Swal.fire("Sin envíos", "No hay envíos para imprimir con este filtro.", "info");
    const cuentasLista = new Set(lista.map((s) => s.cuenta_ml_id));
    if (cuentasLista.size > 1) return Swal.fire("Varias cuentas", "Selecciona una cuenta a la vez para imprimir etiquetas.", "warning");
    if (lista.length > 50) return Swal.fire("Demasiados envíos", "Máximo 50 etiquetas por descarga; selecciona menos.", "warning");

    setTrabajando(true);
    try {
      await mcDescargar(
        "/colecta/etiquetas",
        { shipmentIds: lista.map((s) => s.shipment_id).join(",") },
        `etiquetas_${lista[0].cuenta.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmm")}.zip`,
      );
      setTimeout(cargar, 3000);
    } catch (e) {
      Swal.fire("Error", await mensajeError(e, "No se pudieron descargar las etiquetas."), "error");
    } finally {
      setTrabajando(false);
    }
  };

  const procesar = async () => {
    const lista = objetivo((s) => s.mostrar_en_recolectados);
    if (!lista.length) return Swal.fire("Sin recolectados", "No hay envíos recolectados pendientes de procesar.", "info");
    if (new Set(lista.map((s) => s.cuenta_ml_id)).size > 1) {
      return Swal.fire("Varias cuentas", "Selecciona una cuenta a la vez: se genera una orden de salida por cuenta.", "warning");
    }

    const piezas = lista.reduce((t, s) => t + Number(s.cantidad_piezas || 0), 0);
    const conf = await Swal.fire({
      icon: "warning",
      title: "Procesar recolectados",
      html: `Se generará y procesará una <b>orden de salida</b> (origen <b>ventas_me_refa</b>) de <b>${lista[0].cuenta}</b> por <b>${lista.length}</b> envío(s) y <b>${piezas}</b> pieza(s).<br/><br/>Esto descuenta existencias y no se puede deshacer desde aquí.`,
      showCancelButton: true,
      confirmButtonText: "Procesar",
      cancelButtonText: "Cancelar",
    });
    if (!conf.isConfirmed) return;

    setTrabajando(true);
    try {
      const r = await mcPost("/colecta/procesar", { shipmentIds: lista.map((s) => s.shipment_id) });
      await cargar();
      Swal.fire("Listo", `Orden de salida ${r.orden_id} generada y procesada.`, "success");
    } catch (e) {
      Swal.fire("Error", await mensajeError(e, "No se pudo procesar."), "error");
    } finally {
      setTrabajando(false);
    }
  };

  const columnas = [
    { field: "shipment_id", headerName: "Envío", width: 130 },
    { field: "cuenta", headerName: "Cuenta", width: 150, renderCell: (p) => <CuentaChip nombre={p.value} /> },
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
                  SKU {i.sku} · producto {i.producto_id} · {i.item_subcuenta}
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
        row.items
          .flatMap((i) => i.localidades)
          .map((l) => `${l.descripcion} (${l.cantidad_reservada})`)
          .join(", "),
      renderCell: (p) =>
        p.value ? (
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "normal" }}>
            {p.value}
          </Typography>
        ) : (
          <Typography variant="caption" color="error">
            Sin reserva
          </Typography>
        ),
    },
    {
      field: "fecha_colecta_key",
      headerName: "Colecta",
      width: 120,
      renderCell: (p) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2">{p.row.expected_date ? dayjs(p.row.expected_date).format("DD/MM HH:mm") : "—"}</Typography>
          {p.row.pendiente_procesar_bodega && <Chip size="small" color="error" label="Atrasado" sx={{ height: 18, fontWeight: 600 }} />}
        </Box>
      ),
    },
    { field: "estado_operativo", headerName: "Estado ML", width: 160, renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADO_ML} /> },
    { field: "estado_operativo_interno", headerName: "Reserva", width: 140, renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADO_RESERVA} /> },
    { field: "fecha_venta", headerName: "Venta", width: 140, valueFormatter: (v) => fecha(v) },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />

      <Paper elevation={2} sx={{ p: 1.5, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, display: "flex", gap: 1, alignItems: "center" }}>
            <LocalShippingOutlinedIcon color="primary" /> Colecta subcuenta
            <Chip size="small" label="Mercado Envíos" sx={{ bgcolor: "#e3f2fd", color: "primary.main", fontWeight: 700 }} />
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            Ventas de subcuentas surtidas desde nuestro almacén. La colecta de la cuenta principal sigue en su pantalla.
          </Typography>
        </Box>
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          <TextField
            select
            size="small"
            label="Cuenta"
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            SelectProps={{ displayEmpty: true }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="">Todas las subcuentas</MenuItem>
            {cuentas.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nombre}
              </MenuItem>
            ))}
          </TextField>
          <Tooltip arrow title="Actualizar">
            <span>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />} sx={botonSx} disabled={cargando} onClick={cargar}>
                Actualizar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      <Box sx={kpiGridSx}>
        <KpiCard icon={PrintOutlinedIcon} color="#ed6c02" label="Etiquetas por imprimir">
          <KpiValor valor={kpi.porImprimir} detalle={`${kpi.listas} listas para enviar`} />
        </KpiCard>
        <KpiCard icon={AssignmentReturnOutlinedIcon} color="#2e7d32" label="Recolectadas por procesar">
          <KpiValor valor={kpi.recolectadas} detalle={`${kpi.atrasadas} de colectas anteriores`} />
        </KpiCard>
        <KpiCard icon={ReportProblemOutlinedIcon} color="#d32f2f" label="Sin reserva de stock">
          <KpiValor valor={kpi.sinStock} detalle="Revisar existencias del producto" />
        </KpiCard>
        <KpiCard icon={Inventory2OutlinedIcon} color="#1976d2" label="Piezas en la lista">
          <KpiValor valor={kpi.piezas} detalle={`${envios.length} envíos`} />
        </KpiCard>
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
              <MenuItem value="todos">Todas las fechas</MenuItem>
              <MenuItem value="hoy">Hoy y atrasadas</MenuItem>
              <MenuItem value="manana">Mañana</MenuItem>
              <MenuItem value="proximos">Próximos días</MenuItem>
            </TextField>
            <Tooltip arrow title="Descarga las etiquetas (ZPL) con el token de la subcuenta">
              <span>
                <Button variant="outlined" size="small" startIcon={<PrintOutlinedIcon />} sx={botonSx} disabled={trabajando || !visibles.length} onClick={imprimir}>
                  Imprimir etiquetas
                </Button>
              </span>
            </Tooltip>
            <Tooltip arrow title="Genera y procesa la orden de salida de los envíos ya recolectados">
              <span>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AssignmentReturnOutlinedIcon />}
                  sx={botonSx}
                  disabled={trabajando || !visibles.some((s) => s.mostrar_en_recolectados)}
                  onClick={procesar}
                >
                  Procesar recolectados
                </Button>
              </span>
            </Tooltip>
          </>
        }
      >
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
            density="compact"
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            initialState={PAGINACION_INICIAL}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" } }}
            loading={cargando}
            sx={{ ...gridSx, "& .MuiDataGrid-cell": { ...gridSx["& .MuiDataGrid-cell"], display: "flex", alignItems: "center", py: 0.5 } }}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: `No hay envíos de subcuenta en «${FILTROS[filtro].label}».` }}
          />
        </Box>
      </SectionCard>
    </Box>
  );
};

export default ColectaSubcuenta;
