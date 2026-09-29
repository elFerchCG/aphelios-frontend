import {
    Drawer,
    Box,
    Typography,
    CircularProgress,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
    Chip,
    ToggleButton,
    Tooltip,
    Pagination,
    TextField,
    InputAdornment,
    LinearProgress,
    Button
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SortIcon from "@mui/icons-material/Sort";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

import ProductoRow from "./ProductoRow";
import { palette, tono } from "./consolidadoPalette";
import { obtenerEstadoProducto, ESTADOS_PRODUCTO, ORDEN_ESTATUS_PRODUCTO } from "./estadoProducto";
import { ResumenTile, ResumenConsolidado, calcularResumen, textoBusqueda } from "./consolidadoUI";

// Consolidado de las órdenes de RETIRO de un envío (equivalente al
// ConsolidadoDrawer de proformas). Carga TODOS los retiros del envío una
// sola vez y permite verlos todos juntos o uno por uno con el selector de
// "Orden de retiro", sin volver a consultar el backend.

const ESTATUS_RETIRO = {
    abierto: { label: "Abierto", tone: "neutral" },
    confirmado: { label: "Confirmado", tone: "warning" },
    procesado: { label: "Procesado", tone: "success" },
    cancelado: { label: "Cancelado", tone: "neutral" }
};

const getEstatusRetiro = (estatus) =>
    ESTATUS_RETIRO[estatus] || { label: estatus || "—", tone: "neutral" };

export default function RetirosConsolidadoDrawer({
    open,
    onClose,
    envioId,
    folioInternoEnvio,
    retiroInicial = "todas"
}) {

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const [retiros, setRetiros] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [retiroSel, setRetiroSel] = useState("todas");
    const [filtroEstatus, setFiltroEstatus] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [ordenarPorUrgencia, setOrdenarPorUrgencia] = useState(true);
    const [agruparPorRetiro, setAgruparPorRetiro] = useState(true);
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(25);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(
                `${apiUrl}/empaque/envios/${envioId}/retiros/consolidado`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            setRetiros(data.retiros || []);
            setProductos(data.data || []);
        } catch (err) {
            console.error(err);
            setRetiros([]);
            setProductos([]);
            setError(err.response?.data?.message || "No se pudo cargar el consolidado de retiros.");
        } finally {
            setLoading(false);
        }
    }, [apiUrl, envioId]);

    // Al abrir: posiciona el selector en el retiro con el que se abrió
    // (o "todas") y recarga los datos.
    useEffect(() => {
        if (!open || !envioId) return;
        setRetiroSel(retiroInicial == null ? "todas" : String(retiroInicial));
        setFiltroEstatus([]);
        setBusqueda("");
        setPagina(1);
        cargar();
    }, [open, envioId, retiroInicial, cargar]);

    // ------------------------------------------------------------
    // Derivados
    // ------------------------------------------------------------

    const productosConEstado = useMemo(
        () => productos.map((p) => ({ ...p, _estado: obtenerEstadoProducto(p), _texto: textoBusqueda(p) })),
        [productos]
    );

    // Productos del retiro seleccionado (antes de filtros de estatus/búsqueda)
    const productosRetiro = useMemo(
        () => retiroSel === "todas"
            ? productosConEstado
            : productosConEstado.filter((p) => String(p.orden_bodega_id) === retiroSel),
        [productosConEstado, retiroSel]
    );

    const conteoPorEstatus = useMemo(() => {
        const mapa = {};
        productosRetiro.forEach((p) => {
            mapa[p._estado.status] = (mapa[p._estado.status] || 0) + 1;
        });
        return mapa;
    }, [productosRetiro]);

    const resumen = useMemo(() => calcularResumen(productosRetiro), [productosRetiro]);

    const retiroActual = retiroSel === "todas"
        ? null
        : retiros.find((r) => String(r.orden_bodega_id) === retiroSel) || null;

    const agrupar = retiroSel === "todas" && agruparPorRetiro;

    const productosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();

        let lista = productosRetiro.filter((p) =>
            (filtroEstatus.length === 0 || filtroEstatus.includes(p._estado.status)) &&
            (!q || p._texto.includes(q))
        );

        const urgencia = (p) => ORDEN_ESTATUS_PRODUCTO.indexOf(p._estado.status);

        lista = [...lista].sort((a, b) => {
            if (agrupar && a.orden_bodega_id !== b.orden_bodega_id) {
                return a.orden_bodega_id - b.orden_bodega_id;
            }
            if (ordenarPorUrgencia) return urgencia(a) - urgencia(b);
            return 0;
        });

        return lista;
    }, [productosRetiro, filtroEstatus, busqueda, ordenarPorUrgencia, agrupar]);

    const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / porPagina));

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [pagina, totalPaginas]);

    const productosPagina = useMemo(() => {
        const inicio = (pagina - 1) * porPagina;
        return productosFiltrados.slice(inicio, inicio + porPagina);
    }, [productosFiltrados, pagina, porPagina]);

    const rangoInicio = productosFiltrados.length === 0 ? 0 : (pagina - 1) * porPagina + 1;
    const rangoFin = Math.min(pagina * porPagina, productosFiltrados.length);

    const retiroPorId = useMemo(() => {
        const m = new Map();
        retiros.forEach((r) => m.set(r.orden_bodega_id, r));
        return m;
    }, [retiros]);

    // ------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------

    const resetPagina = () => setPagina(1);

    const handleChangeFiltroEstatus = (event) => {
        const { value } = event.target;
        setFiltroEstatus(typeof value === "string" ? value.split(",") : value);
        resetPagina();
    };

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------

    const renderEncabezadoGrupo = (retiroId) => {
        const r = retiroPorId.get(retiroId);
        const est = getEstatusRetiro(r?.estatus);
        const pct = r && r.total_a_enviar > 0
            ? Math.min(100, Math.round((r.total_empacado / r.total_a_enviar) * 100))
            : 0;
        return (
            <Box
                key={`grupo-${retiroId}`}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    mb: 1.5,
                    mt: 1,
                    borderRadius: 2,
                    bgcolor: palette.surface,
                    border: `1px solid ${palette.border}`,
                    borderLeft: `4px solid ${palette.primary.border}`
                }}
            >
                <AssignmentReturnOutlinedIcon sx={{ color: palette.primary.text }} />
                <Typography variant="subtitle2" fontWeight={700}>
                    Retiro #{retiroId}
                </Typography>
                {r?.descripcion && (
                    <Typography variant="body2" sx={{ color: palette.textSecondary }} noWrap>
                        {r.descripcion}
                    </Typography>
                )}
                <Chip
                    size="small"
                    label={est.label}
                    sx={{
                        bgcolor: tono(est.tone).bg,
                        color: tono(est.tone).text,
                        border: `1px solid ${tono(est.tone).border}`,
                        fontWeight: 600
                    }}
                />
                <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1, minWidth: 200 }}>
                    <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={pct >= 100 ? "success" : "primary"}
                        sx={{ height: 6, borderRadius: 4, flex: 1 }}
                    />
                    <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {r ? `${Math.round(r.total_empacado)}/${Math.round(r.total_a_enviar)} · ${pct}%` : ""}
                    </Typography>
                </Box>
            </Box>
        );
    };

    const renderListado = () => {
        const elementos = [];
        let retiroAnterior = null;
        productosPagina.forEach((producto) => {
            if (agrupar && producto.orden_bodega_id !== retiroAnterior) {
                elementos.push(renderEncabezadoGrupo(producto.orden_bodega_id));
                retiroAnterior = producto.orden_bodega_id;
            }
            elementos.push(
                <ProductoRow key={producto.orden_id} producto={producto} modo="retiro" />
            );
        });
        return elementos;
    };

    const estRetiroActual = retiroActual ? getEstatusRetiro(retiroActual.estatus) : null;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: "95%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: palette.surfaceMuted
                }
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

                {/* HEADER */}
                <Box
                    sx={{
                        px: 3,
                        py: 1.5,
                        borderBottom: `1px solid ${palette.border}`,
                        bgcolor: palette.surface,
                        flexShrink: 0
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <AssignmentReturnOutlinedIcon color="primary" />
                            Consolidado de Retiros
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Tooltip title="Vuelve a consultar el consolidado." arrow>
                                <span>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<RefreshIcon />}
                                        onClick={cargar}
                                        disabled={loading}
                                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                                    >
                                        Actualizar
                                    </Button>
                                </span>
                            </Tooltip>
                            <IconButton onClick={onClose}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        Envío {folioInternoEnvio || `#${envioId}`} • {retiros.length} orden(es) de retiro
                        {retiroActual && ` • Retiro #${retiroActual.orden_bodega_id}`}
                        {retiroActual?.fecha_orden && ` • ${dayjs(retiroActual.fecha_orden).format("DD/MM/YYYY")}`}
                    </Typography>

                    {/* Selector de retiro */}
                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, mt: 1.5 }}>
                        <FormControl size="small" sx={{ minWidth: 320 }}>
                            <InputLabel id="retiro-consolidado-label">Orden de retiro</InputLabel>
                            <Select
                                labelId="retiro-consolidado-label"
                                label="Orden de retiro"
                                value={retiroSel}
                                onChange={(e) => {
                                    setRetiroSel(e.target.value);
                                    setFiltroEstatus([]);
                                    resetPagina();
                                }}
                            >
                                <MenuItem value="todas">
                                    <ListItemText
                                        primary="Todas las órdenes de retiro"
                                        secondary={`${productos.length} orden(es) de producción`}
                                    />
                                </MenuItem>
                                {retiros.map((r) => (
                                    <MenuItem key={r.orden_bodega_id} value={String(r.orden_bodega_id)}>
                                        <ListItemText
                                            primary={`Retiro #${r.orden_bodega_id}${r.descripcion ? ` · ${r.descripcion}` : ""}`}
                                            secondary={`${getEstatusRetiro(r.estatus).label} · ${r.total_ordenes} OP · ${Math.round(r.total_empacado)}/${Math.round(r.total_a_enviar)} empacado`}
                                        />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {estRetiroActual && (
                            <Chip
                                size="small"
                                label={estRetiroActual.label}
                                sx={{
                                    bgcolor: tono(estRetiroActual.tone).bg,
                                    color: tono(estRetiroActual.tone).text,
                                    border: `1px solid ${tono(estRetiroActual.tone).border}`,
                                    fontWeight: 600
                                }}
                            />
                        )}
                    </Box>

                    {/* Resumen de la selección */}
                    <ResumenConsolidado
                        aEnviar={resumen.aEnviar}
                        empacado={resumen.empacado}
                        pendiente={resumen.pendiente}
                        pct={resumen.pct}
                        extra={
                            <ResumenTile
                                label="Órdenes de retiro"
                                value={retiroSel === "todas" ? retiros.length : 1}
                                tone="neutral"
                            />
                        }
                    />

                    {/* Filtros */}
                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, mt: 1.5 }}>
                        <TextField
                            size="small"
                            placeholder="Buscar SKU, título, ML u OP"
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value);
                                resetPagina();
                            }}
                            sx={{ minWidth: 260 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <FormControl size="small" sx={{ minWidth: 260 }}>
                            <InputLabel id="filtro-estatus-retiros-label">Filtrar por estatus</InputLabel>
                            <Select
                                labelId="filtro-estatus-retiros-label"
                                multiple
                                value={filtroEstatus}
                                onChange={handleChangeFiltroEstatus}
                                input={<OutlinedInput label="Filtrar por estatus" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const info = ESTADOS_PRODUCTO.find((e) => e.value === value);
                                            return (
                                                <Chip
                                                    key={value}
                                                    size="small"
                                                    label={info?.label || value}
                                                    sx={{
                                                        bgcolor: tono(info?.tone).bg,
                                                        color: tono(info?.tone).text,
                                                        border: `1px solid ${tono(info?.tone).border}`,
                                                        fontWeight: 600
                                                    }}
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {ESTADOS_PRODUCTO.map((info) => (
                                    <MenuItem key={info.value} value={info.value}>
                                        <Checkbox checked={filtroEstatus.indexOf(info.value) > -1} />
                                        <ListItemText
                                            primary={info.label}
                                            secondary={`${conteoPorEstatus[info.value] || 0} orden(es)`}
                                        />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Tooltip title="Muestra primero lo más urgente (pendiente por surtir/empacar) y al final lo ya empacado">
                            <ToggleButton
                                size="small"
                                value="ordenar"
                                selected={ordenarPorUrgencia}
                                onChange={() => {
                                    setOrdenarPorUrgencia((prev) => !prev);
                                    resetPagina();
                                }}
                                sx={{ textTransform: "none", gap: 0.5 }}
                            >
                                <SortIcon fontSize="small" />
                                Ordenar por urgencia
                            </ToggleButton>
                        </Tooltip>

                        {retiroSel === "todas" && (
                            <Tooltip title="Agrupa las órdenes de producción bajo su orden de retiro">
                                <ToggleButton
                                    size="small"
                                    value="agrupar"
                                    selected={agruparPorRetiro}
                                    onChange={() => {
                                        setAgruparPorRetiro((prev) => !prev);
                                        resetPagina();
                                    }}
                                    sx={{ textTransform: "none", gap: 0.5 }}
                                >
                                    <ViewAgendaOutlinedIcon fontSize="small" />
                                    Agrupar por retiro
                                </ToggleButton>
                            </Tooltip>
                        )}

                        <FormControl size="small" sx={{ minWidth: 130 }}>
                            <InputLabel id="por-pagina-retiros-label">Por página</InputLabel>
                            <Select
                                labelId="por-pagina-retiros-label"
                                label="Por página"
                                value={porPagina}
                                onChange={(e) => {
                                    setPorPagina(Number(e.target.value));
                                    resetPagina();
                                }}
                            >
                                <MenuItem value={25}>25 por página</MenuItem>
                                <MenuItem value={50}>50 por página</MenuItem>
                            </Select>
                        </FormControl>

                        <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                            Mostrando {rangoInicio}–{rangoFin} de {productosFiltrados.length}
                            {productosFiltrados.length !== productosRetiro.length && ` (filtrado de ${productosRetiro.length})`}
                        </Typography>
                    </Box>
                </Box>

                {/* CONTENIDO */}
                <Box sx={{ flex: 1, overflow: "auto", minHeight: 0, p: 2 }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" mt={5}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Box display="flex" justifyContent="center" mt={5}>
                            <Typography variant="body2" color="error">{error}</Typography>
                        </Box>
                    ) : productosFiltrados.length === 0 ? (
                        <Box display="flex" justifyContent="center" mt={5}>
                            <Typography variant="body2" color="text.secondary">
                                {productos.length === 0
                                    ? "Este envío no tiene órdenes de retiro."
                                    : "No hay órdenes de producción con los filtros seleccionados."}
                            </Typography>
                        </Box>
                    ) : (
                        renderListado()
                    )}
                </Box>

                {!loading && totalPaginas > 1 && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            py: 1.5,
                            borderTop: `1px solid ${palette.border}`,
                            bgcolor: palette.surface,
                            flexShrink: 0
                        }}
                    >
                        <Pagination
                            count={totalPaginas}
                            page={pagina}
                            onChange={(event, value) => setPagina(value)}
                            color="primary"
                            size="small"
                        />
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}
