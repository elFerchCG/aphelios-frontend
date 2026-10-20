import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, GlobalStyles,
    IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AppDataGrid from "../../common/AppDataGrid";
import { DATA_GRID_LOCALE_ES } from "../../../config/dataGridLocale";
import { columnaProducto, gridCompactoProps } from "./tablaCompacta";
import { ESTATUS_DANADO, MOTIVOS_DANADO, motivoTexto } from "../Inventarios/Surtido/DanadosSurtido";

const GRID_HEIGHT = 560;

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
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", ml: 4 }}>{subtitle}</Typography>
                )}
            </Box>
            {actions && <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">{actions}</Stack>}
        </Stack>
        {children}
    </Paper>
);

const KpiCard = ({ icon: Icon, color, label, children }) => (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: `${color}1A`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
            {children}
        </Box>
    </Paper>
);

const FILTROS_VACIOS = { envio: "todos", proforma: "todas", orden: "", texto: "", estatus: "pendiente", motivo: "todos" };

const BitacoraDanados = () => {
    const apiUrl = process.env.NODE_ENV === "production" ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState(() => ({
        ...FILTROS_VACIOS,
        envio: searchParams.get("envio_id") || "todos",
        estatus: searchParams.get("envio_id") ? "todos" : "pendiente",
    }));
    const [atender, setAtender] = useState(null);
    const [nota, setNota] = useState("");
    const [guardando, setGuardando] = useState(false);

    // Solo administrador o Producción con permiso de supervisor pueden atender
    const puedeAtender = Boolean(user) && (
        String(user.rol_descripcion ?? "").toLowerCase() === "administrador" ||
        (user.rol_descripcion === "Produccion" && user.permisos === "supervisor")
    );

    const fetchRegistros = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${apiUrl}/mrp/danados`, { headers: { Authorization: `Bearer ${token}` } });
            setRegistros((data.data || []).map((r) => ({
                ...r,
                // Campos que espera la columna de producto compartida
                title: r.producto_titulo,
                sku: r.producto_sku,
            })));
        } catch (error) {
            Swal.fire("Error", error?.response?.data?.message || "No se pudo consultar la bitácora.", "error");
        } finally {
            setLoading(false);
        }
    }, [apiUrl, token]);

    useEffect(() => { fetchRegistros(); }, [fetchRegistros]);

    const setFiltro = (campo, valor) =>
        setFiltros((f) => ({ ...f, [campo]: valor, ...(campo === "envio" ? { proforma: "todas" } : {}) }));

    // Opciones de envío y proforma a partir de los registros
    const envios = useMemo(() => {
        const m = new Map();
        registros.forEach((r) => r.envio_id && m.set(String(r.envio_id), r.envio_folio || `Envío #${r.envio_id}`));
        return [...m.entries()];
    }, [registros]);

    const proformas = useMemo(() => {
        const m = new Map();
        registros
            .filter((r) => filtros.envio === "todos" || String(r.envio_id) === filtros.envio)
            .forEach((r) => r.proforma_id && m.set(String(r.proforma_id), r.proforma_titulo || `Proforma #${r.proforma_id}`));
        return [...m.entries()];
    }, [registros, filtros.envio]);

    const filtrados = useMemo(() => {
        const texto = filtros.texto.trim().toLowerCase();
        return registros.filter((r) =>
            (filtros.envio === "todos" || String(r.envio_id) === filtros.envio) &&
            (filtros.proforma === "todas" || String(r.proforma_id) === filtros.proforma) &&
            (!filtros.orden || String(r.orden_id).includes(filtros.orden.trim())) &&
            (filtros.estatus === "todos" || r.estatus === filtros.estatus) &&
            (filtros.motivo === "todos" || r.motivo === filtros.motivo) &&
            (!texto || [r.componente_sku, r.componente_descripcion, r.producto_sku, r.producto_titulo, r.inventory_id, r.comentario]
                .some((v) => String(v || "").toLowerCase().includes(texto)))
        );
    }, [registros, filtros]);

    const kpis = useMemo(() => ({
        pendientes: filtrados.filter((r) => r.estatus === "pendiente").length,
        atendidos: filtrados.filter((r) => r.estatus === "atendido").length,
        piezas: filtrados.reduce((s, r) => s + Number(r.cantidad || 0), 0),
        piezasPendientes: filtrados.filter((r) => r.estatus === "pendiente").reduce((s, r) => s + Number(r.cantidad || 0), 0),
        envios: new Set(filtrados.map((r) => r.envio_id).filter(Boolean)).size,
        ordenes: new Set(filtrados.map((r) => r.orden_id)).size,
    }), [filtrados]);

    const guardarAtencion = async () => {
        setGuardando(true);
        try {
            await axios.put(
                `${apiUrl}/mrp/danados/${atender.id}/atender`,
                { nota: nota.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAtender(null);
            setNota("");
            await fetchRegistros();
        } catch (error) {
            Swal.fire("Error", error?.response?.data?.message || "No se pudo marcar como atendido.", "error");
        } finally {
            setGuardando(false);
        }
    };

    const columnas = [
        {
            field: "fecha_registro", headerName: "Fecha", width: 130,
            valueFormatter: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
        },
        {
            field: "estatus", headerName: "Estatus", width: 150,
            renderCell: (p) => {
                const e = ESTATUS_DANADO[p.value] || ESTATUS_DANADO.pendiente;
                return <Chip size="small" color={e.color} label={e.label} sx={{ fontWeight: 600 }} />;
            },
        },
        {
            field: "envio_folio", headerName: "Envío", width: 120,
            valueGetter: (value, row) => value || (row.envio_id ? `#${row.envio_id}` : "—"),
        },
        {
            field: "proforma_titulo", headerName: "Proforma", width: 150,
            valueGetter: (value, row) => value || (row.proforma_id ? `#${row.proforma_id}` : "—"),
        },
        { field: "orden_id", headerName: "Orden prod.", width: 100 },
        columnaProducto,
        {
            field: "componente_sku", headerName: "Componente", width: 190,
            renderCell: (p) => (
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{p.value}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{p.row.componente_descripcion}</Typography>
                </Box>
            ),
        },
        {
            field: "cantidad", headerName: "Piezas", width: 90, type: "number", headerAlign: "center", align: "center",
            renderCell: (p) => <Chip size="small" color="warning" label={p.value} sx={{ fontWeight: 700 }} />,
        },
        {
            field: "kits_despues", headerName: "Armar / Enviar / Excedente", width: 210, sortable: false,
            renderCell: (p) => {
                const r = p.row;
                if (r.kits_antes == null) return <Typography variant="caption" color="text.secondary">—</Typography>;
                const cambio = (a, d) => (a === d ? `${d}` : `${a} → ${d}`);
                return (
                    <Typography variant="caption" sx={{ lineHeight: 1.3 }}>
                        Armar {cambio(r.kits_antes, r.kits_despues)} · Enviar {cambio(r.enviar_antes, r.enviar_despues)}
                        <br />
                        Excedente {cambio(r.kits_antes - r.enviar_antes, r.kits_despues - r.enviar_despues)}
                    </Typography>
                );
            },
        },
        { field: "motivo", headerName: "Motivo", width: 150, valueFormatter: (value) => motivoTexto(value) },
        { field: "comentario", headerName: "Comentario", flex: 1, minWidth: 180 },
        { field: "registrado_por", headerName: "Marcó", width: 130 },
        {
            field: "nota_atencion", headerName: "Ajuste del supervisor", flex: 1, minWidth: 200,
            renderCell: (p) => p.row.estatus === "atendido" ? (
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap title={p.value}>{p.value}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {p.row.atendido_por} · {p.row.fecha_atendido ? dayjs(p.row.fecha_atendido).format("DD/MM/YYYY HH:mm") : ""}
                    </Typography>
                </Box>
            ) : <Typography variant="caption" color="text.secondary">—</Typography>,
        },
        {
            field: "acciones", headerName: "Acciones", width: 120, sortable: false, filterable: false, disableExport: true,
            renderCell: (p) => (
                <Stack direction="row" spacing={0.5}>
                    {p.row.envio_id && (
                        <Tooltip arrow title="Ver dashboard del envío">
                            <IconButton size="small" onClick={() => navigate(`/envios/detalle/${p.row.envio_id}/progresoEmpaque`)}>
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {p.row.estatus === "pendiente" && (
                        <Tooltip arrow title={puedeAtender ? "Marcar como atendido" : "Solo un supervisor puede marcarlo como atendido"}>
                            <span>
                                <IconButton size="small" color="success" disabled={!puedeAtender} onClick={() => { setAtender(p.row); setNota(""); }}>
                                    <TaskAltOutlinedIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                </Stack>
            ),
        },
    ];

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />

            {/* ---------- Encabezado ---------- */}
            <Paper elevation={2} sx={{ p: 1.5, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between" }}>
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                    <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
                        <ReportProblemOutlinedIcon color="primary" /> Bitácora de dañados
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Piezas marcadas como dañadas en surtido. El supervisor hace los ajustes y las marca como atendidas.
                    </Typography>
                </Stack>
                <Tooltip arrow title="Vuelve a consultar la bitácora.">
                    <span>
                        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={fetchRegistros} disabled={loading}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                            Actualizar
                        </Button>
                    </span>
                </Tooltip>
            </Paper>

            {/* ---------- Indicadores (según los filtros) ---------- */}
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
                <KpiCard icon={PendingActionsOutlinedIcon} color="#ed6c02" label="Pendientes de ajuste">
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{kpis.pendientes}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{kpis.piezasPendientes} pieza(s) por revisar</Typography>
                </KpiCard>
                <KpiCard icon={TaskAltOutlinedIcon} color="#2e7d32" label="Atendidos">
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{kpis.atendidos}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Ajustes ya realizados</Typography>
                </KpiCard>
                <KpiCard icon={ReportProblemOutlinedIcon} color="#6a1b9a" label="Piezas dañadas">
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{kpis.piezas}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{kpis.ordenes} orden(es) de producción</Typography>
                </KpiCard>
                <KpiCard icon={LocalShippingOutlinedIcon} color="#1976d2" label="Envíos afectados">
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{kpis.envios}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Con piezas dañadas</Typography>
                </KpiCard>
            </Box>

            {/* ---------- Filtros ---------- */}
            <SectionCard
                icon={FilterAltOutlinedIcon}
                title="Filtros"
                subtitle="Filtra por envío, proforma, orden de producción, estatus, motivo o SKU."
                actions={
                    <Button size="small" startIcon={<RestartAltIcon />} onClick={() => setFiltros({ ...FILTROS_VACIOS, estatus: "todos" })}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                        Limpiar
                    </Button>
                }
            >
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" } }}>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="f-envio">Envío</InputLabel>
                        <Select labelId="f-envio" label="Envío" value={filtros.envio} onChange={(e) => setFiltro("envio", e.target.value)}>
                            <MenuItem value="todos">Todos</MenuItem>
                            {envios.map(([id, folio]) => <MenuItem key={id} value={id}>{folio}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="f-proforma">Proforma</InputLabel>
                        <Select labelId="f-proforma" label="Proforma" value={filtros.proforma} onChange={(e) => setFiltro("proforma", e.target.value)}>
                            <MenuItem value="todas">Todas</MenuItem>
                            {proformas.map(([id, titulo]) => <MenuItem key={id} value={id}>{titulo}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField size="small" label="Orden de producción" value={filtros.orden} onChange={(e) => setFiltro("orden", e.target.value.replace(/\D/g, ""))} />
                    <FormControl size="small" fullWidth>
                        <InputLabel id="f-estatus">Estatus</InputLabel>
                        <Select labelId="f-estatus" label="Estatus" value={filtros.estatus} onChange={(e) => setFiltro("estatus", e.target.value)}>
                            <MenuItem value="todos">Todos</MenuItem>
                            <MenuItem value="pendiente">Pendientes de ajuste</MenuItem>
                            <MenuItem value="atendido">Atendidos</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="f-motivo">Motivo</InputLabel>
                        <Select labelId="f-motivo" label="Motivo" value={filtros.motivo} onChange={(e) => setFiltro("motivo", e.target.value)}>
                            <MenuItem value="todos">Todos</MenuItem>
                            {MOTIVOS_DANADO.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small" label="SKU, producto o comentario" value={filtros.texto} onChange={(e) => setFiltro("texto", e.target.value)}
                        InputProps={{ endAdornment: <InputAdornment position="end"><SearchIcon fontSize="small" /></InputAdornment> }}
                    />
                </Box>
            </SectionCard>

            {/* ---------- Registros ---------- */}
            <SectionCard icon={ListAltOutlinedIcon} title="Piezas marcadas como dañadas" count={filtrados.length}>
                <AppDataGrid
                    {...gridCompactoProps}
                    rowHeight={56}
                    rows={filtrados}
                    columns={columnas}
                    getRowId={(row) => row.id}
                    loading={loading}
                    height={GRID_HEIGHT}
                    pageSize={100}
                    pageSizeOptions={[100]}
                    exportFileName="bitacora_danados"
                    localeText={{ ...DATA_GRID_LOCALE_ES, noRowsLabel: "No hay piezas dañadas con estos filtros." }}
                />
            </SectionCard>

            {/* ---------- Atender ---------- */}
            <Dialog open={Boolean(atender)} onClose={guardando ? undefined : () => setAtender(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, bgcolor: "#f7f9fc", borderBottom: "1px solid", borderColor: "divider" }}>
                    <TaskAltOutlinedIcon color="success" /> Marcar como atendido
                </DialogTitle>
                <DialogContent sx={{ pt: "16px !important" }}>
                    {atender && (
                        <Stack spacing={2}>
                            <Typography variant="body2">
                                <b>{atender.cantidad} pza(s) de {atender.componente_sku}</b> · Orden #{atender.orden_id}
                                {atender.envio_folio ? ` · Envío ${atender.envio_folio}` : ""}
                                {atender.proforma_titulo ? ` · ${atender.proforma_titulo}` : ""}
                                <br />
                                Motivo: {motivoTexto(atender.motivo)}{atender.comentario ? ` — “${atender.comentario}”` : ""}
                            </Typography>
                            <TextField
                                label="¿Qué ajustes se hicieron?" multiline minRows={3} fullWidth value={nota}
                                onChange={(e) => setNota(e.target.value)} inputProps={{ maxLength: 500 }}
                                placeholder="Ej. Se canceló 1 kit en Control de Excedentes y se ajustaron 2 pzas en Stock de componentes."
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", px: 3, py: 1.5 }}>
                    <Button onClick={() => setAtender(null)} disabled={guardando}>Cancelar</Button>
                    <Button variant="contained" color="success" onClick={guardarAtencion} disabled={!nota.trim() || guardando} startIcon={<TaskAltOutlinedIcon />}>
                        Marcar atendido
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BitacoraDanados;
