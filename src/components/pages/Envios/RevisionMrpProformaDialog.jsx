import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    GlobalStyles,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CloseIcon from "@mui/icons-material/Close";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CheckIcon from "@mui/icons-material/Check";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import AppDataGrid from "../../common/AppDataGrid";
import { DATA_GRID_LOCALE_ES } from "../../../config/dataGridLocale";
import { columnaProducto, columnasProductoDetalle, gridCompactoProps, gridCompactoSx } from "./tablaCompacta";

// =====================================================================
// Revisión de cantidades a enviar a FULL (proforma + envío)
// ---------------------------------------------------------------------
// Por producto de la proforma en el envío:
//   nueva cantidad a enviar = máximo (6 semanas de pronóstico) − stock FULL
// El máximo viene de ventas_tendencia_envio (proceso de la 1:00 am: ventas
// de los últimos 35 días, 1 seguridad + 2 tiempo proveedor + 3 tiempo
// definido). Referencia: cantidad_mrp de las órdenes (lo que pidió el MRP
// al generarlas). Se puede aplicar por producto o a todos, solo con la
// proforma pendiente (al activarla se generan los excedentes).
// Backend: GET  /produccion/proformas/:id/envios/:id/revision-mrp
//          POST /produccion/proformas/:id/envios/:id/aplicar-sugerido
//          POST /produccion/tendencia-envio/recalcular
// =====================================================================

const GRID_HEIGHT = 440;

const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const fmtNum = (v, dec = 0) =>
    Number(v || 0).toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtFecha = (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "—");
const fmtFechaHora = (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—");

const ESTADOS_NO_APLICA = {
    no_aplica: "ME sin FULL",
    sin_tendencia: "Sin tendencia",
    sin_publicacion: "Sin publicación",
};

const KpiCard = ({ icon: Icon, color, label, children }) => (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
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
            <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}
            >
                {label}
            </Typography>
            {children}
        </Box>
    </Paper>
);

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

const DiferenciaChip = ({ valor }) => {
    const v = Number(valor) || 0;
    if (v === 0) return <Chip size="small" label="Sin cambio" sx={{ fontWeight: 600 }} />;
    const sube = v > 0;
    return (
        <Chip
            size="small"
            icon={sube ? <TrendingUpOutlinedIcon /> : <TrendingDownOutlinedIcon />}
            label={`${sube ? "+" : ""}${fmtNum(v)}`}
            sx={{
                fontWeight: 700,
                bgcolor: sube ? "#e8f5e9" : "#fff3e0",
                color: sube ? "#2e7d32" : "#e65100",
                border: `1px solid ${sube ? "#2e7d32" : "#ed6c02"}`,
                "& .MuiChip-icon": { color: "inherit" },
            }}
        />
    );
};

export default function RevisionMrpProformaDialog({ open, onClose, apiUrl, envioId, proforma, puedeEditar, onAplicado }) {
    const proformaId = proforma?.proforma_id;

    const [data, setData] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [aviso, setAviso] = useState(null); // { severity, text, details }
    const [seleccionado, setSeleccionado] = useState(null);
    const [confirmar, setConfirmar] = useState(null); // { titulo, productos: [] }
    const [aplicando, setAplicando] = useState(false);
    const [recalculando, setRecalculando] = useState(false);

    const cargar = useCallback(async () => {
        if (!proformaId || !envioId) return;
        setCargando(true);
        setError(null);
        try {
            const { data: resp } = await axios.get(
                `${apiUrl}/produccion/proformas/${proformaId}/envios/${envioId}/revision-mrp`,
                getAuthHeaders()
            );
            setData(resp);
            setSeleccionado((prev) =>
                prev ? resp.productos.find((p) => p.producto_id === prev.producto_id) || null : null
            );
        } catch (e) {
            setError(e?.response?.data?.message || "No se pudo calcular la revisión de cantidades a enviar.");
        } finally {
            setCargando(false);
        }
    }, [apiUrl, proformaId, envioId]);

    useEffect(() => {
        if (!open) return;
        setData(null);
        setAviso(null);
        setSeleccionado(null);
        setError(null);
        cargar();
    }, [open, cargar]);

    const recalcular = async () => {
        setRecalculando(true);
        setAviso(null);
        try {
            const { data: resp } = await axios.post(`${apiUrl}/produccion/tendencia-envio/recalcular`, {}, getAuthHeaders());
            setAviso({ severity: "info", text: resp?.message || "Recálculo iniciado." });
        } catch (e) {
            setAviso({ severity: "warning", text: e?.response?.data?.message || "No se pudo iniciar el recálculo." });
        } finally {
            setRecalculando(false);
        }
    };

    const productos = useMemo(() => data?.productos || [], [data]);
    const aplican = useMemo(() => productos.filter((p) => p.aplica), [productos]);
    const editable = Boolean(data?.editable) && Boolean(puedeEditar);
    const conCambio = aplican.filter((p) => p.diferencia !== 0);
    const tendencia = data?.tendencia;
    const semanasTotales = (tendencia?.semanas_seguridad || 0) + (tendencia?.semanas_surtido || 0) + (tendencia?.semanas_maximo || 0);

    const totales = useMemo(
        () => ({
            mrp: aplican.reduce((a, p) => a + p.cantidad_mrp, 0),
            actual: aplican.reduce((a, p) => a + p.a_enviar_actual, 0),
            nueva: aplican.reduce((a, p) => a + (p.nueva_cantidad || 0), 0),
            sugerido: aplican.reduce((a, p) => a + p.sugerido, 0),
            suben: aplican.filter((p) => p.diferencia > 0).length,
            bajan: aplican.filter((p) => p.diferencia < 0).length,
        }),
        [aplican]
    );

    const aplicar = async (lista) => {
        setAplicando(true);
        setAviso(null);
        try {
            const asignaciones = lista.flatMap((p) =>
                p.ordenes.map((o) => ({ orden_id: o.orden_id, cantidad_a_enviar: o.sugerido }))
            );
            const { data: resp } = await axios.post(
                `${apiUrl}/produccion/proformas/${proformaId}/envios/${envioId}/aplicar-sugerido`,
                { asignaciones },
                getAuthHeaders()
            );
            setAviso({ severity: "success", text: resp?.message || "Cantidades actualizadas." });
            setConfirmar(null);
            await cargar();
            onAplicado?.();
        } catch (e) {
            setAviso({
                severity: "error",
                text: e?.response?.data?.message || "No se pudieron aplicar las cantidades.",
                details: e?.response?.data?.details,
            });
            setConfirmar(null);
        } finally {
            setAplicando(false);
        }
    };

    const columnas = [
        // Producto en una sola columna, mismo formato que Existencias
        // (miniatura + título + SKU · ML · MLM · Catálogo), versión compacta.
        columnaProducto,
        ...columnasProductoDetalle,
        {
            field: "logistic_type",
            headerName: "Logística",
            width: 85,
            valueGetter: (value, row) =>
                value === "fulfillment" ? "FULL" : value ? (row.permitir_full ? "ME + FULL" : "ME") : "—",
        },
        {
            field: "pronostico",
            headerName: "Pronóstico",
            description: "Pronóstico semanal (promedio ponderado) con las ventas de los últimos 35 días",
            width: 95,
            type: "number",
            valueGetter: (value, row) => row.tendencia?.pronostico ?? null,
            renderCell: ({ row }) => (row.tendencia ? fmtNum(row.tendencia.pronostico, 2) : "—"),
        },
        {
            field: "maximo",
            headerName: "Máximo",
            description: "Máximo de unidades: ≈ 6 semanas de pronóstico (1 seguridad + 2 tiempo proveedor + 3 tiempo definido)",
            width: 85,
            type: "number",
            valueGetter: (value, row) => row.tendencia?.maximo ?? null,
            renderCell: ({ row }) =>
                row.tendencia ? (
                    <Tooltip arrow title={`Seguridad ${row.tendencia.seguridad} · Punto de reorden ${row.tendencia.punto_reorden} · Máximo ${row.tendencia.maximo}`}>
                        <span>{fmtNum(row.tendencia.maximo)}</span>
                    </Tooltip>
                ) : (
                    "—"
                ),
        },
        {
            field: "stock_full",
            headerName: "Stock FULL",
            description: "Existencia actual en FULL (última sincronización con Mercado Libre)",
            width: 95,
            type: "number",
            renderCell: ({ row }) => (
                <Tooltip arrow title={`Actualizado: ${fmtFechaHora(row.stock_full_actualizado)}`}>
                    <span>{fmtNum(row.stock_full)}</span>
                </Tooltip>
            ),
        },
        {
            field: "nueva_cantidad",
            headerName: "Máx − FULL",
            description: "Nueva cantidad a enviar = máximo − stock FULL",
            width: 95,
            type: "number",
            renderCell: ({ row }) => (row.nueva_cantidad == null ? "—" : fmtNum(row.nueva_cantidad)),
        },
        {
            field: "cantidad_mrp",
            headerName: "Cant. MRP",
            description: "Lo que pidió el MRP al generar las órdenes (cantidad_mrp, no cambia)",
            width: 90,
            type: "number",
        },
        { field: "a_enviar_actual", headerName: "A enviar", description: "Cantidad a enviar actual", width: 85, type: "number" },
        {
            field: "sugerido",
            headerName: "Sugerido",
            description: "Máx − FULL ajustado a lo empacado (mínimo) y facturado (máximo)",
            width: 90,
            type: "number",
            renderCell: ({ row }) =>
                row.aplica ? (
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                        {fmtNum(row.sugerido)}
                    </Typography>
                ) : (
                    "—"
                ),
        },
        {
            field: "diferencia",
            headerName: "Dif.",
            description: "Sugerido − a enviar actual",
            width: 110,
            type: "number",
            renderCell: ({ row }) =>
                row.aplica ? (
                    <DiferenciaChip valor={row.diferencia} />
                ) : (
                    <Chip size="small" variant="outlined" label={ESTADOS_NO_APLICA[row.estado] || "No aplica"} sx={{ fontWeight: 600 }} />
                ),
        },
        {
            field: "acciones",
            headerName: "",
            width: 95,
            sortable: false,
            filterable: false,
            disableExport: true,
            renderCell: ({ row }) => (
                <Tooltip
                    arrow
                    title={
                        !row.aplica
                            ? row.notas?.[0] || "No aplica"
                            : !editable
                                ? "Solo con la proforma pendiente y permisos de edición"
                                : row.diferencia === 0
                                    ? "Ya tiene la cantidad sugerida"
                                    : "Aplicar el sugerido a este producto"
                    }
                >
                    <span>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CheckIcon />}
                            disabled={!row.aplica || !editable || row.diferencia === 0 || aplicando}
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmar({ titulo: `Aplicar sugerido a ${row.sku || `producto ${row.producto_id}`}`, productos: [row] });
                            }}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                        >
                            Aplicar
                        </Button>
                    </span>
                </Tooltip>
            ),
        },
    ];

    const columnasOrdenes = [
        { field: "orden_id", headerName: "Orden", width: 90 },
        { field: "fecha_creacion", headerName: "Creada", width: 110, valueFormatter: (value) => fmtFecha(value) },
        { field: "estatus", headerName: "Estatus", width: 110 },
        { field: "cantidad_mrp", headerName: "Cant. MRP", width: 105, type: "number" },
        { field: "cantidad_parcial", headerName: "Facturado", width: 100, type: "number" },
        { field: "cantidad_empacada", headerName: "Empacado", width: 100, type: "number" },
        { field: "cantidad_a_enviar", headerName: "A enviar", width: 95, type: "number" },
        {
            field: "sugerido",
            headerName: "Sugerido",
            width: 100,
            type: "number",
            renderCell: ({ row }) => (
                <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>{fmtNum(row.sugerido)}</Typography>
            ),
        },
    ];

    const estatus = data?.proforma?.estatus;
    const sinTabla = data && !tendencia?.filas;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: "#f7f9fc" } }}>
            <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />

            {/* Encabezado fijo: banda del mismo color que el diálogo, con aire
                abajo y una línea divisoria. El contenido se desplaza por debajo
                y se corta en esa línea (antes se cortaba pegado a la sombra
                de la caja del título y las tarjetas se veían "mochas"). */}
            <DialogTitle
                sx={{
                    p: 0,
                    pb: 2,
                    bgcolor: "#f7f9fc",
                    borderBottom: "1px solid #e3e8ef",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <Paper elevation={2} sx={{ p: 1.5, m: 2, mb: 0, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" component="div" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, flexWrap: "wrap" }}>
                            <InsightsOutlinedIcon color="primary" /> Revisión de cantidades a enviar a FULL
                            <Chip size="small" label={`Proforma #${proformaId ?? "—"}`} sx={{ fontWeight: 700, bgcolor: "#e3f2fd", color: "primary.main" }} />
                            {estatus && (
                                <Chip
                                    size="small"
                                    label={estatus}
                                    color={estatus === "pendiente" ? "default" : estatus === "activa" ? "warning" : "success"}
                                    sx={{ fontWeight: 600, textTransform: "capitalize" }}
                                />
                            )}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", ml: 4 }}>
                            {tendencia?.calculado_en
                                ? `Tendencia calculada el ${fmtFechaHora(tendencia.calculado_en)} con las ventas del ${fmtFecha(tendencia.fecha_inicio)} al ${fmtFecha(tendencia.fecha_fin)} · máximo de ${semanasTotales} semanas (${tendencia.semanas_seguridad} seguridad + ${tendencia.semanas_surtido} tiempo proveedor + ${tendencia.semanas_maximo} tiempo definido)`
                                : "Nueva cantidad a enviar = máximo de 6 semanas − stock FULL."}
                        </Typography>
                    </Box>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                        {puedeEditar && (
                            <Tooltip arrow title="Vuelve a calcular la tabla de tendencias para todos los productos (normalmente lo hace el proceso de la 1:00 am). Tarda unos minutos.">
                                <span>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={recalculando ? <CircularProgress size={16} /> : <AutorenewIcon />}
                                        onClick={recalcular}
                                        disabled={recalculando || Boolean(data?.recalculando)}
                                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                                    >
                                        {data?.recalculando ? "Recalculando…" : "Recalcular tendencias"}
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                        <Tooltip arrow title="Volver a consultar (stock FULL y cantidades actuales)">
                            <span>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={cargando ? <CircularProgress size={16} /> : <RefreshIcon />}
                                    onClick={cargar}
                                    disabled={cargando}
                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                                >
                                    Actualizar
                                </Button>
                            </span>
                        </Tooltip>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </Paper>
            </DialogTitle>

            <DialogContent sx={{ px: 2, pt: "16px !important", pb: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
                {error && <Alert severity="error">{error}</Alert>}
                {sinTabla && (
                    <Alert severity="warning">
                        Aún no hay tendencias calculadas. Se calculan en el proceso de la 1:00 am
                        {puedeEditar ? " o con el botón “Recalcular tendencias”." : "."}
                    </Alert>
                )}
                {aviso && (
                    <Alert severity={aviso.severity} onClose={() => setAviso(null)}>
                        {aviso.text}
                        {Array.isArray(aviso.details) && aviso.details.length > 0 && (
                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                {aviso.details.map((d) => <li key={d}>{d}</li>)}
                            </Box>
                        )}
                    </Alert>
                )}
                {data && !data.editable && (
                    <Alert severity="info" icon={<LockOutlinedIcon />}>
                        La proforma está <strong>{estatus}</strong>: la revisión es solo informativa. Las cantidades solo se
                        pueden aplicar mientras la proforma está pendiente (al activarla se generan los excedentes).
                    </Alert>
                )}
                {data && data.editable && !puedeEditar && (
                    <Alert severity="info" icon={<LockOutlinedIcon />}>
                        No tienes permisos para cambiar cantidades a enviar: la revisión es solo informativa.
                    </Alert>
                )}

                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
                    <KpiCard icon={Inventory2OutlinedIcon} color="#1976d2" label="Productos a FULL">
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{aplican.length}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {conCambio.length} con diferencia
                            {productos.length > aplican.length ? ` · ${productos.length - aplican.length} no aplican` : ""}
                        </Typography>
                    </KpiCard>
                    <KpiCard icon={LocalShippingOutlinedIcon} color="#0288d1" label="A enviar hoy">
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{fmtNum(totales.actual)}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Cantidad MRP al generar: {fmtNum(totales.mrp)}
                        </Typography>
                    </KpiCard>
                    <KpiCard icon={FactCheckOutlinedIcon} color="#6a1b9a" label="Sugerido (máx − FULL)">
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{fmtNum(totales.sugerido)}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Diferencia vs hoy: {totales.sugerido - totales.actual > 0 ? "+" : ""}{fmtNum(totales.sugerido - totales.actual)}
                        </Typography>
                    </KpiCard>
                    <KpiCard icon={TrendingUpOutlinedIcon} color={totales.bajan > totales.suben ? "#ed6c02" : "#2e7d32"} label="Enviar más / menos">
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                            {totales.suben} ↑ · {totales.bajan} ↓
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            productos respecto a lo que se enviará hoy
                        </Typography>
                    </KpiCard>
                </Box>

                <SectionCard
                    icon={ListAltOutlinedIcon}
                    title="Comparación por producto"
                    subtitle="Nueva cantidad = máximo − stock FULL, ajustada a lo empacado y facturado. Haz clic en un producto para ver sus órdenes y ventas."
                    count={productos.length}
                    actions={
                        <Tooltip arrow title={!editable ? "Solo con la proforma pendiente y permisos de edición" : "Aplicar el sugerido a todos los productos con diferencia"}>
                            <span>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<DoneAllIcon />}
                                    disabled={!editable || conCambio.length === 0 || aplicando}
                                    onClick={() => setConfirmar({ titulo: `Aplicar sugerido a ${conCambio.length} producto(s)`, productos: conCambio })}
                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                                >
                                    Aplicar a todos ({conCambio.length})
                                </Button>
                            </span>
                        </Tooltip>
                    }
                >
                    <AppDataGrid
                        rows={productos}
                        columns={columnas}
                        getRowId={(row) => row.producto_id}
                        loading={cargando}
                        height={GRID_HEIGHT}
                        pageSize={100}
                        pageSizeOptions={[100]}
                        {...gridCompactoProps}
                        initialColumnVisibilityModel={{ mlm: false, sku: false, inventory_id: false, catalog_id: false }}
                        exportFileName={`revision_envio_proforma_${proformaId}_envio_${envioId}`}
                        onRowClick={({ row }) => setSeleccionado(row)}
                        getRowClassName={({ row }) =>
                            [seleccionado?.producto_id === row.producto_id ? "fila-seleccionada" : "", !row.aplica ? "fila-no-aplica" : ""].join(" ")
                        }
                        sx={{
                            ...gridCompactoSx,
                            "& .fila-seleccionada": { bgcolor: "#e3f2fd !important" },
                            "& .fila-no-aplica": { color: "text.disabled" },
                            "& .MuiDataGrid-row": { cursor: "pointer" },
                        }}
                        localeText={{ ...DATA_GRID_LOCALE_ES, noRowsLabel: "La proforma no tiene órdenes de producción en este envío." }}
                    />
                </SectionCard>

                {seleccionado && (
                    <SectionCard
                        icon={Inventory2OutlinedIcon}
                        title={`Detalle · ${seleccionado.sku || `Producto ${seleccionado.producto_id}`}`}
                        subtitle="El sugerido se reparte llenando primero la orden más vieja (nunca menos de lo empacado ni más de lo facturado)."
                        count={seleccionado.ordenes.length}
                    >
                        <Stack spacing={1.5}>
                            {seleccionado.notas?.length > 0 && (
                                <Alert severity="warning">
                                    {seleccionado.notas.map((n) => <div key={n}>{n}</div>)}
                                </Alert>
                            )}
                            {seleccionado.tendencia && (
                                <>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {seleccionado.tendencia.ventas_bloques.map((v, i) => {
                                            const ini = tendencia?.fecha_inicio ? dayjs(tendencia.fecha_inicio).add(7 * i, "day") : null;
                                            return (
                                                <Chip
                                                    key={`${i}-${v}`}
                                                    size="small"
                                                    variant="outlined"
                                                    label={`${ini ? `${ini.format("DD/MM")}–${ini.add(6, "day").format("DD/MM")}` : `Semana ${i + 1}`}: ${fmtNum(v)}`}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            );
                                        })}
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        Pronóstico semanal {fmtNum(seleccionado.tendencia.pronostico, 2)} (regresión {fmtNum(seleccionado.tendencia.pronostico_regresion, 2)}, promedio {fmtNum(seleccionado.tendencia.venta_promedio, 2)}, pendiente {fmtNum(seleccionado.tendencia.pendiente, 2)}) ·
                                        seguridad {fmtNum(seleccionado.tendencia.seguridad)} · punto de reorden {fmtNum(seleccionado.tendencia.punto_reorden)} · máximo {fmtNum(seleccionado.tendencia.maximo)} ·
                                        stock FULL {fmtNum(seleccionado.stock_full)} → nueva cantidad {fmtNum(seleccionado.nueva_cantidad)} ·
                                        límites: empacado {fmtNum(seleccionado.empacada)}, facturado {fmtNum(seleccionado.facturada)}
                                    </Typography>
                                </>
                            )}
                            <AppDataGrid
                                rows={seleccionado.ordenes}
                                columns={columnasOrdenes}
                                getRowId={(row) => row.orden_id}
                                {...gridCompactoProps}
                                height={240}
                                pageSize={100}
                                pageSizeOptions={[100]}
                                showToolbar={false}
                                localeText={{ ...DATA_GRID_LOCALE_ES, noRowsLabel: "Sin órdenes." }}
                            />
                        </Stack>
                    </SectionCard>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid #e3e8ef" }}>
                <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                    Cerrar
                </Button>
            </DialogActions>

            {/* Confirmación (MUI, para no quedar detrás del diálogo como un Swal) */}
            <Dialog open={Boolean(confirmar)} onClose={() => !aplicando && setConfirmar(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{confirmar?.titulo}</DialogTitle>
                <DialogContent>
                    <DialogContentText component="div">
                        Se cambiará la cantidad a enviar de estas órdenes de producción:
                        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                            {(confirmar?.productos || []).map((p) => (
                                <li key={p.producto_id}>
                                    <strong>{p.sku || `Producto ${p.producto_id}`}</strong>: {fmtNum(p.a_enviar_actual)} → {fmtNum(p.sugerido)}
                                    {p.ordenes.length > 1 && (
                                        <Typography variant="caption" component="div" sx={{ color: "text.secondary" }}>
                                            {p.ordenes.map((o) => `#${o.orden_id}: ${fmtNum(o.cantidad_a_enviar)} → ${fmtNum(o.sugerido)}`).join(" · ")}
                                        </Typography>
                                    )}
                                </li>
                            ))}
                        </Box>
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setConfirmar(null)} disabled={aplicando} sx={{ textTransform: "none", fontWeight: 600 }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => aplicar(confirmar.productos)}
                        disabled={aplicando}
                        startIcon={aplicando ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                    >
                        Aplicar
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
}
