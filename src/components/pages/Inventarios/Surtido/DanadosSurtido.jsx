import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, Chip, CircularProgress,
    Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel,
    MenuItem, Select, Stack, TextField, Typography,
} from "@mui/material";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export const MOTIVOS_DANADO = [
    { value: "defectuoso", label: "Defectuoso" },
    { value: "mal_estado", label: "Mal estado" },
    { value: "danado_transporte", label: "Dañado en transporte" },
    { value: "otro", label: "Otro" },
];
export const motivoTexto = (m) => MOTIVOS_DANADO.find((x) => x.value === m)?.label || m;

export const ESTATUS_DANADO = {
    pendiente: { label: "Pendiente de ajuste", color: "warning" },
    atendido: { label: "Atendido", color: "success" },
};

// Registro simple: solo marca piezas dañadas; el supervisor hace los ajustes
export const DanadoDialog = ({ open, onClose, componente, apiUrl, token, onRegistrado }) => {
    const [cantidad, setCantidad] = useState("");
    const [motivo, setMotivo] = useState("defectuoso");
    const [comentario, setComentario] = useState("");
    const [yaContadas, setYaContadas] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (open) {
            setCantidad(""); setMotivo("defectuoso"); setComentario(""); setYaContadas(false);
            setResultado(null); setError(null);
        }
    }, [open]);

    const cantidadNum = Number(cantidad);
    const valido = Number.isInteger(cantidadNum) && cantidadNum > 0 && (motivo !== "otro" || comentario.trim() !== "");

    const registrar = async () => {
        setCargando(true); setError(null);
        try {
            const { data } = await axios.post(
                `${apiUrl}/mrp/danados`,
                {
                    orden_detalle_id: componente.id,
                    cantidad: cantidadNum,
                    ya_contadas: yaContadas,
                    motivo,
                    comentario: comentario.trim() || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResultado(data);
            onRegistrado?.(data);
        } catch (err) {
            setError({
                message: err?.response?.data?.message || "Ocurrió un error inesperado.",
                detalles: (err?.response?.data?.detalles || []).map((d) => (typeof d === "string" ? d : d.msg)),
            });
        } finally {
            setCargando(false);
        }
    };

    return (
        <Dialog open={open} onClose={cargando ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, bgcolor: "#f7f9fc", borderBottom: "1px solid", borderColor: "divider" }}>
                <ReportProblemOutlinedIcon color="warning" />
                Marcar piezas dañadas
                {componente && <Chip size="small" label={componente.sku} sx={{ fontWeight: 700, bgcolor: "#e3f2fd", color: "primary.main" }} />}
            </DialogTitle>

            <DialogContent sx={{ pt: "16px !important" }}>
                {resultado ? (
                    <Alert icon={<CheckCircleOutlineIcon />} severity="success">{resultado.message}</Alert>
                ) : (
                    <Stack spacing={2}>
                        <Alert severity="info">
                            Las piezas dañadas <b>cuentan como procesadas</b>, pero <b>no entran a ninguna etiqueta</b>.
                            No se ajusta nada más: el supervisor revisa la <b>Bitácora de dañados</b> y hace los ajustes necesarios.
                        </Alert>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField
                                label="Piezas dañadas" type="number" size="small" value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)} inputProps={{ min: 1, step: 1 }}
                                onWheel={(e) => e.target.blur()} sx={{ width: { sm: 150 } }}
                            />
                            <FormControl size="small" fullWidth>
                                <InputLabel id="motivo-danado">Motivo</InputLabel>
                                <Select labelId="motivo-danado" label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                                    {MOTIVOS_DANADO.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Stack>
                        <TextField
                            label={motivo === "otro" ? "Comentario (obligatorio)" : "Comentario"} size="small" fullWidth multiline minRows={2}
                            value={comentario} onChange={(e) => setComentario(e.target.value)} inputProps={{ maxLength: 500 }}
                        />
                        <FormControlLabel
                            control={<Checkbox checked={yaContadas} onChange={(e) => setYaContadas(e.target.checked)} />}
                            label="Estas piezas ya las había contado como buenas (no sumar al conteo)"
                        />
                        {error && (
                            <Alert severity="error">
                                {error.message}
                                {error.detalles.map((d, i) => <Typography key={i} variant="body2">• {d}</Typography>)}
                            </Alert>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", px: 3, py: 1.5 }}>
                <Button onClick={onClose} disabled={cargando}>{resultado ? "Cerrar" : "Cancelar"}</Button>
                {!resultado && (
                    <Button
                        variant="contained" color="warning" onClick={registrar} disabled={!valido || cargando}
                        startIcon={cargando ? <CircularProgress size={16} color="inherit" /> : <ReportProblemOutlinedIcon />}
                    >
                        Registrar dañadas
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// Registros de dañados de la orden (dentro de los modales de surtido)
export const HistorialDanados = ({ historial = [] }) => {
    if (!historial.length) return null;
    const total = historial.reduce((s, h) => s + Number(h.cantidad || 0), 0);
    return (
        <Accordion variant="outlined" sx={{ mb: 2, borderRadius: 2, borderColor: "warning.light", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <ReportProblemOutlinedIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="bold">
                        Piezas dañadas registradas: {total} ({historial.length} registro(s))
                    </Typography>
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                <Stack spacing={1}>
                    {historial.map((h) => {
                        const est = ESTATUS_DANADO[h.estatus] || ESTATUS_DANADO.pendiente;
                        return (
                            <Box key={h.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.25 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                    <Chip size="small" color="warning" label={`${h.cantidad} pza(s) ${h.componente_sku || ""}`} sx={{ fontWeight: 700 }} />
                                    <Chip size="small" variant="outlined" label={motivoTexto(h.motivo)} />
                                    <Chip size="small" color={est.color} label={est.label} sx={{ fontWeight: 600 }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {h.fecha_registro ? new Date(h.fecha_registro).toLocaleString("es-MX") : ""} · Marcó {h.registrado_por || "—"}
                                    </Typography>
                                </Stack>
                                {h.comentario && <Typography variant="body2" sx={{ mt: 0.5 }}>“{h.comentario}”</Typography>}
                                {h.nota_atencion && (
                                    <Typography variant="caption" color="success.main" sx={{ display: "block", mt: 0.5 }}>
                                        Ajuste del supervisor ({h.atendido_por || "—"}): {h.nota_atencion}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
};
