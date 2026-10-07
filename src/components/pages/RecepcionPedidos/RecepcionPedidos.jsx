import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
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
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";

import { handleApiError } from "../../../helpers/apiErrorHandler";
import apiUrl from "../../../config";
import DetallePedidoRecepcionDialog from "./DetallePedidoRecepcionDialog";
import {
  compromisoVencido,
  ESTATUS_RECEPCION,
  fmtNum,
  formatFecha,
  formatFechaHora,
  getAuthHeaders,
  getEstatusInfo,
  getUsuarioSesion,
  hoyISO,
  puedeEditarPedido as puedeEditarPedidoFn,
  puedeRegistrarRecepcion,
  TIPOS_DOCUMENTO,
} from "./recepcionUtils";

const PAGE_SIZE = 50;

const FILTROS_INICIALES = {
  q: "",
  proveedor: null,
  estatus: ["pendiente", "en_recepcion"],
  fecha_inicio: "",
  fecha_fin: "",
};

// =====================================================================
// Recepción de pedidos (almacén)
// Mismo diseño que Transacciones de inventario / Existencias.
// =====================================================================
const RecepcionPedidos = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [proveedores, setProveedores] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);

  const [pedidoDetalleId, setPedidoDetalleId] = useState(null);

  const usuario = getUsuarioSesion();
  const puedeRegistrar = puedeRegistrarRecepcion(usuario);
  const puedeEditarPedido = puedeEditarPedidoFn(usuario);
  const hoy = hoyISO();

  const fetchPedidos = useCallback(async (filtrosConsulta, paginaSolicitada, acumular) => {
    if (acumular) setCargandoMas(true);
    else setLoading(true);

    try {
      const params = { page: paginaSolicitada, pageSize: PAGE_SIZE };
      if (filtrosConsulta.q.trim()) params.q = filtrosConsulta.q.trim();
      if (filtrosConsulta.proveedor) params.proveedor_id = filtrosConsulta.proveedor.id_proveedor;
      if (filtrosConsulta.estatus.length) params.estatus = filtrosConsulta.estatus.join(",");
      if (filtrosConsulta.fecha_inicio) params.fecha_inicio = filtrosConsulta.fecha_inicio;
      if (filtrosConsulta.fecha_fin) params.fecha_fin = filtrosConsulta.fecha_fin;

      const { data } = await axios.get(`${apiUrl}/pedidos/recepcion`, { ...getAuthHeaders(), params });
      const lista = Array.isArray(data?.data) ? data.data : [];
      setRows((prev) => (acumular ? [...prev, ...lista] : lista));
      setTotal(Number(data?.total) || 0);
      setPage(paginaSolicitada);
      setFiltrosAplicados(filtrosConsulta);
    } catch (error) {
      if (!acumular) {
        setRows([]);
        setTotal(0);
      }
      handleApiError(error, { defaultMessage: "No se pudieron consultar los pedidos." });
    } finally {
      setLoading(false);
      setCargandoMas(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos(FILTROS_INICIALES, 1, false);
    (async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/proveedores`);
        setProveedores(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando proveedores", error);
      }
    })();
  }, [fetchPedidos]);

  const recargar = () => fetchPedidos(filtrosAplicados, 1, false);
  const handleBuscar = () => fetchPedidos(filtros, 1, false);
  const handleLimpiar = () => {
    setFiltros(FILTROS_INICIALES);
    fetchPedidos(FILTROS_INICIALES, 1, false);
  };
  const handleEnter = (e) => {
    if (e.key === "Enter") handleBuscar();
  };

  const handleFecha = (campo) => (e) => {
    const valor = e.target.value;
    setFiltros((prev) => ({ ...prev, [campo]: valor && valor > hoy ? hoy : valor }));
  };

  const columns = useMemo(
    () => [
      {
        field: "pedido_id",
        headerName: "# Pedido",
        width: 100,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a237e" }}>
            #{params.value}
          </Typography>
        ),
      },
      {
        field: "numeros_proveedor",
        headerName: "# Pedidos proveedor",
        width: 180,
        renderCell: (params) =>
          params.value ? (
            <Typography variant="body2" sx={{ fontWeight: 700, py: 0.75, whiteSpace: "normal" }}>
              {params.value}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: "#ed6c02" }}>
              Sin capturar
            </Typography>
          ),
      },
      {
        field: "proveedor_nombre",
        headerName: "Proveedor",
        flex: 1.3,
        minWidth: 200,
        renderCell: (params) => (
          <Box sx={{ minWidth: 0, py: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={params.value}>
              {params.value || `Proveedor ${params.row.proveedor_id}`}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Creado {formatFechaHora(params.row.fecha_creacion)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "estatus_recepcion",
        headerName: "Estatus",
        width: 135,
        renderCell: (params) => {
          const info = getEstatusInfo(params.value);
          return (
            <Chip
              label={info.label}
              size="small"
              sx={{ bgcolor: info.bg, color: info.color, border: `1px solid ${info.color}`, fontWeight: 600 }}
            />
          );
        },
      },
      {
        field: "fecha_compromiso",
        headerName: "Compromiso",
        width: 135,
        renderCell: (params) => {
          const vencido = compromisoVencido(params.row);
          return (
            <Typography variant="body2" sx={{ color: vencido ? "#d32f2f" : "inherit", fontWeight: vencido ? 700 : 400 }}>
              {formatFecha(params.value)}
            </Typography>
          );
        },
      },
      {
        field: "documentos",
        headerName: "Notas / Facturas",
        width: 150,
        sortable: false,
        valueGetter: (v, row) =>
          `Notas: ${Number(row.num_notas_recibidas || 0)}/${Number(row.num_notas || 0)} · Facturas: ${Number(
            row.num_facturas || 0
          )}`,
        renderCell: (params) => {
          const total = Number(params.row.num_notas || 0);
          const recibidas = Number(params.row.num_notas_recibidas || 0);
          const facturas = Number(params.row.num_facturas || 0);
          const completo = total > 0 && recibidas >= total;
          return (
            <Box sx={{ py: 0.75, lineHeight: 1.5 }}>
              <Typography variant="body2" sx={{ color: TIPOS_DOCUMENTO.nota_entrega.color }}>
                Notas:{" "}
                {total ? (
                  <Box component="strong" sx={{ color: completo ? "#2e7d32" : "inherit" }}>
                    {fmtNum(recibidas)} / {fmtNum(total)}
                  </Box>
                ) : (
                  <Box component="span" sx={{ color: "#ed6c02" }}>
                    sin notas
                  </Box>
                )}
              </Typography>
              <Typography variant="body2" sx={{ color: TIPOS_DOCUMENTO.factura.color }}>
                Facturas: <strong>{facturas ? fmtNum(facturas) : "—"}</strong>
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "bultos",
        headerName: "Tarimas / Cajas",
        width: 130,
        sortable: false,
        valueGetter: (v, row) => `Tarimas: ${Number(row.tarimas || 0)} · Cajas: ${Number(row.cajas || 0)}`,
        renderCell: (params) => (
          <Box sx={{ py: 0.75, lineHeight: 1.5 }}>
            <Typography variant="body2">
              Tarimas: <strong>{fmtNum(params.row.tarimas)}</strong>
            </Typography>
            <Typography variant="body2">
              Cajas: <strong>{fmtNum(params.row.cajas)}</strong>
            </Typography>
          </Box>
        ),
      },
      {
        field: "notas_planeacion",
        headerName: "Notas del pedido",
        flex: 1.2,
        minWidth: 200,
        sortable: false,
        renderCell: (params) =>
          params.value ? (
            <Tooltip title={<Box sx={{ whiteSpace: "pre-wrap" }}>{params.value}</Box>} arrow placement="top-start">
              <Typography
                variant="body2"
                sx={{
                  py: 0.75,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {params.value}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              —
            </Typography>
          ),
      },
      {
        field: "fecha_ultima_recepcion",
        headerName: "Última llegada",
        flex: 1,
        minWidth: 180,
        renderCell: (params) =>
          params.value ? (
            <Box sx={{ py: 0.75 }}>
              <Typography variant="body2">{formatFechaHora(params.value)}</Typography>
              {params.row.ultimo_recibido_por && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {params.row.ultimo_recibido_por}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              —
            </Typography>
          ),
      },
      {
        field: "acciones",
        headerName: "Acciones",
        width: 140,
        sortable: false,
        filterable: false,
        disableExport: true,
        renderCell: (params) => (
          <Button
            size="small"
            variant={puedeRegistrar || puedeEditarPedido ? "contained" : "outlined"}
            startIcon={puedeRegistrar || puedeEditarPedido ? <ManageSearchIcon /> : <VisibilityOutlinedIcon />}
            onClick={() => setPedidoDetalleId(params.row.pedido_id)}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            {puedeRegistrar || puedeEditarPedido ? "Gestionar" : "Ver"}
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [puedeRegistrar, puedeEditarPedido]
  );

  const hayMas = rows.length < total;

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: 2 }}>
      <GlobalStyles
        styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })}
      />

      {/* ---------- Barra de acciones ---------- */}
      <Paper
        elevation={2}
        sx={{
          p: 1.5,
          borderRadius: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}
        >
          <AssignmentTurnedInOutlinedIcon color="primary" /> Recepción de pedidos
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          <Typography variant="caption" sx={{ color: "text.secondary", mr: 1 }}>
            {total} pedido(s)
          </Typography>
          {!puedeRegistrar && !puedeEditarPedido && (
            <Chip size="small" label="Solo consulta" variant="outlined" />
          )}
          <Tooltip title="Vuelve a consultar los datos." arrow>
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={recargar}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
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
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Planeación captura en cada pedido MRP sus # de pedido del proveedor, notas de entrega y facturas;
            almacén marca como recibida cada nota de entrega cuando llega la mercancía. Por defecto se muestran
            los pedidos pendientes y en recepción.
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start">
            <TextField
              label="Buscar # pedido, # pedido proveedor, nota o factura"
              size="small"
              value={filtros.q}
              onChange={(e) => setFiltros((prev) => ({ ...prev, q: e.target.value }))}
              onKeyDown={handleEnter}
              inputProps={{ maxLength: 100 }}
              sx={{ minWidth: 320, flex: 1.2 }}
            />
            <Autocomplete
              size="small"
              options={proveedores}
              value={filtros.proveedor}
              onChange={(e, v) => setFiltros((prev) => ({ ...prev, proveedor: v }))}
              getOptionLabel={(o) => o?.razon_social || ""}
              isOptionEqualToValue={(o, v) => o.id_proveedor === v.id_proveedor}
              renderInput={(params) => <TextField {...params} label="Proveedor" />}
              sx={{ minWidth: 260, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="estatus-recepcion-label">Estatus</InputLabel>
              <Select
                labelId="estatus-recepcion-label"
                multiple
                value={filtros.estatus}
                onChange={(e) => {
                  const v = e.target.value;
                  setFiltros((prev) => ({ ...prev, estatus: typeof v === "string" ? v.split(",") : v }));
                }}
                input={<OutlinedInput label="Estatus" />}
                renderValue={(selected) => (
                  <Stack direction="row" gap={0.5} flexWrap="wrap">
                    {selected.map((v) => (
                      <Chip key={v} size="small" label={getEstatusInfo(v).label} />
                    ))}
                  </Stack>
                )}
              >
                {Object.entries(ESTATUS_RECEPCION).map(([valor, info]) => (
                  <MenuItem key={valor} value={valor}>
                    <Checkbox checked={filtros.estatus.includes(valor)} />
                    <ListItemText primary={info.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Creado desde"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filtros.fecha_inicio}
              onChange={handleFecha("fecha_inicio")}
              inputProps={{ max: hoy }}
              sx={{ width: 170 }}
            />
            <TextField
              label="Creado hasta"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filtros.fecha_fin}
              onChange={handleFecha("fecha_fin")}
              inputProps={{ max: hoy }}
              sx={{ width: 170 }}
            />
            <Stack direction="row" gap={1} sx={{ ml: { sm: "auto" } }}>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={handleLimpiar}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, height: 40 }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<SearchIcon />}
                onClick={handleBuscar}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, height: 40 }}
              >
                Buscar
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* ---------- Resultados ---------- */}
      <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 }, borderRadius: 3 }}>
        <Box sx={{ height: { xs: 480, md: 560 }, width: "100%" }}>
          <DataGrid
            sx={{ fontFamily: "Montserrat" }}
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.pedido_id}
            getRowHeight={() => "auto"}
            showCellVerticalBorder
            showColumnVerticalBorder
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              columns: { columnVisibilityModel: { pedido_id: false } },
            }}
            pageSizeOptions={[25, 50, 100]}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: { csvOptions: { fileName: "recepcion_pedidos", utf8WithBom: true } },
            }}
            localeText={{
              toolbarColumns: "Columnas",
              toolbarDensity: "Densidad",
              toolbarExport: "Exportar",
              toolbarFilters: "Filtros",
              filterPanelOperator: "Operador",
              toolbarFiltersTooltipHide: "Ocultar filtros",
              toolbarFiltersTooltipShow: "Mostrar filtros",
              footerTotalVisibleRows: (visibleCount, totalCount) => `${visibleCount} de ${totalCount}`,
              footerPaginationRowsPerPage: "Filas por página",
              noRowsLabel: "No hay pedidos para mostrar.",
            }}
          />
        </Box>
      </Paper>

      {hayMas && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button
            variant="outlined"
            onClick={() => fetchPedidos(filtrosAplicados, page + 1, true)}
            disabled={cargandoMas || loading}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {cargandoMas ? "Cargando…" : `Cargar más (${rows.length} de ${total})`}
          </Button>
        </Box>
      )}

      <DetallePedidoRecepcionDialog
        open={Boolean(pedidoDetalleId)}
        pedidoId={pedidoDetalleId}
        puedeRegistrar={puedeRegistrar}
        puedeEditarPedido={puedeEditarPedido}
        onClose={() => setPedidoDetalleId(null)}
        onCambio={recargar}
      />
    </Box>
  );
};

export default RecepcionPedidos;
