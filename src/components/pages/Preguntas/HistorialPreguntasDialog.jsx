import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, Stack, Tab, Tabs, Typography,
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { API_PREGUNTAS, authHeaders, formatearFecha, mensajeError } from './preguntasUI';
import { getThumbnailUrl } from '../Envios/tablaCompacta';

const ESTATUS_PREGUNTA = {
    UNANSWERED: { label: 'Sin responder', color: 'warning' },
    BANNED: { label: 'Moderada por ML', color: 'error' },
    DELETED: { label: 'Eliminada', color: 'default' },
    CLOSED_UNANSWERED: { label: 'Cerrada sin respuesta', color: 'default' },
    UNDER_REVIEW: { label: 'En revisión', color: 'info' },
    DISABLED: { label: 'Deshabilitada', color: 'default' },
};

// Globo de chat: preguntas del cliente a la izquierda (borde azul), respuestas a la derecha (azul sólido).
const Globo = ({ lado, fecha, children, destacado, extra }) => {
    const esRespuesta = lado === 'derecha';
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: esRespuesta ? 'flex-end' : 'flex-start', mb: 1.5 }}>
            <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 0.25 }}>
                <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>{formatearFecha(fecha)}</Typography>
                {extra}
            </Stack>
            <Box
                sx={{
                    position: 'relative', maxWidth: { xs: '90%', sm: '70%' }, px: 1.5, py: 1, borderRadius: 1.5, typography: 'body2',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    ...(esRespuesta
                        ? { bgcolor: '#2196f3', color: '#fff' }
                        : { bgcolor: destacado ? '#e3f2fd' : '#fff', border: `${destacado ? 2 : 1}px solid #64b5f6`, color: 'text.primary' }),
                    '&::after': {
                        content: '""', position: 'absolute', bottom: -8, [esRespuesta ? 'left' : 'right']: 24,
                        borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                        borderTop: `8px solid ${esRespuesta ? '#2196f3' : '#64b5f6'}`,
                    },
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

const HistorialPreguntasDialog = ({ open, onClose, pregunta, historialCliente }) => {
    const [tab, setTab] = useState('cliente');
    const [datos, setDatos] = useState({ cliente: null, item: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const finRef = useRef(null);

    const fromId = pregunta?.from?.id;
    const itemId = pregunta?.item_id;

    const cargar = async (alcance, forzar = false) => {
        if (!itemId || (!forzar && datos[alcance])) return;
        setLoading(true);
        setError(null);
        try {
            const params = { item_id: itemId, ...(alcance === 'cliente' && fromId ? { from_id: fromId } : {}) };
            const { data } = await axios.get(`${API_PREGUNTAS}/historial`, { ...authHeaders(), params });
            setDatos((prev) => ({ ...prev, [alcance]: data }));
        } catch (err) {
            setError(mensajeError(err, 'No se pudo obtener el historial.'));
        } finally {
            setLoading(false);
        }
    };

    // Al abrir (u otra pregunta) se reinicia; si el padre ya trae el historial del cliente se reutiliza.
    useEffect(() => {
        if (!open) return;
        const inicial = fromId ? 'cliente' : 'item';
        setTab(inicial);
        setError(null);
        setDatos({ cliente: historialCliente || null, item: null });
        if (!(inicial === 'cliente' && historialCliente)) cargar(inicial, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, pregunta?.id]);

    const cambiarTab = (_, v) => {
        setTab(v);
        cargar(v);
    };

    const actual = datos[tab];
    useEffect(() => {
        finRef.current?.scrollIntoView({ block: 'end' });
    }, [actual]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, pb: 1 }}>
                <HistoryOutlinedIcon color="primary" /> Historial de preguntas / respuestas
                <Box sx={{ flex: 1 }} />
                <IconButton size="small" onClick={() => cargar(tab, true)} disabled={loading}><RefreshIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            {pregunta?.publicacion && (
                <Stack direction="row" gap={1.5} alignItems="center" sx={{ px: 3, pb: 1 }}>
                    <Avatar src={getThumbnailUrl(pregunta.publicacion.thumbnail) || undefined} variant="rounded" sx={{ width: 36, height: 36, border: '1px solid #e0e0e0' }} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{pregunta.publicacion.title}</Typography>
                        <Typography variant="caption" color="text.secondary">SKU {pregunta.publicacion.sku} · {itemId}</Typography>
                    </Box>
                </Stack>
            )}

            <Tabs value={tab} onChange={cambiarTab} sx={{ px: 2, borderBottom: '1px solid #eee', minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}>
                <Tab value="cliente" label={`Este cliente${fromId ? ` (#${fromId})` : ''}`} disabled={!fromId} />
                <Tab value="item" label="Todo el artículo" />
            </Tabs>

            <DialogContent sx={{ bgcolor: '#fafbfc', height: 440 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {loading && !actual ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
                ) : actual?.historial?.length ? (
                    <Box sx={{ pt: 1 }}>
                        {actual.total > actual.historial.length && (
                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mb: 2 }}>
                                Mostrando las últimas {actual.historial.length} de {actual.total} preguntas
                            </Typography>
                        )}
                        {actual.historial.map((q) => {
                            const estatus = ESTATUS_PREGUNTA[q.status];
                            const esActual = q.id === pregunta?.id;
                            return (
                                <Box key={q.id}>
                                    <Globo
                                        lado="izquierda"
                                        fecha={q.date_created}
                                        destacado={esActual}
                                        extra={
                                            <>
                                                {tab === 'item' && q.from_id && (
                                                    <Chip size="small" label={q.from_id === fromId ? 'Este cliente' : `Cliente #${q.from_id}`} sx={{ height: 18, fontSize: 11 }} />
                                                )}
                                                {esActual && <Chip size="small" color="primary" label="Actual" sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />}
                                                {estatus && !esActual && <Chip size="small" color={estatus.color} variant="outlined" label={estatus.label} sx={{ height: 18, fontSize: 11 }} />}
                                            </>
                                        }
                                    >
                                        {q.text || <i>(Texto no disponible)</i>}
                                    </Globo>
                                    {q.answer && (
                                        <Globo lado="derecha" fecha={q.answer.date_created}>
                                            {q.answer.text || <i>(Respuesta moderada por Mercado Libre)</i>}
                                            {q.atendido_por && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.85 }}>Te atendió: {q.atendido_por}</Typography>
                                            )}
                                        </Globo>
                                    )}
                                </Box>
                            );
                        })}
                        <div ref={finRef} />
                    </Box>
                ) : (
                    !error && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
                            {tab === 'cliente' ? 'Este cliente no tiene otras preguntas en esta publicación.' : 'Esta publicación no tiene preguntas registradas.'}
                        </Typography>
                    )
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={onClose} variant="outlined" size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default HistorialPreguntasDialog;
