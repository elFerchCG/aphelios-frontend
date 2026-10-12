import React from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import apiUrl from '../../../config';

// Piezas visuales y utilidades compartidas del módulo de Preguntas (estilo Aphelios).

export const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export const API_PREGUNTAS = `${apiUrl}/preguntas`;

export const MAX_CARACTERES = 2000;

export const PLACEHOLDER = '**';

export const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children, sx }) => (
    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, ...sx }}>
        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                    <Icon color="primary" /> {title}
                    {count != null && (
                        <Chip size="small" label={count} sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main', height: 22 }} />
                    )}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 4 }}>{subtitle}</Typography>
                )}
            </Box>
            {actions && <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">{actions}</Stack>}
        </Stack>
        {children}
    </Paper>
);

// Formato único de fechas del módulo: año/mes/día hora.
export const FORMATO_FECHA = 'YYYY/MM/DD HH:mm';
export const formatearFecha = (fecha) => (fecha ? dayjs(fecha).format(FORMATO_FECHA) : '');

// Antigüedad legible ("35 min", "5 h", "3 d") y color según urgencia.
export const antiguedad = (fecha) => {
    const minutos = Math.max(Math.floor((Date.now() - new Date(fecha).getTime()) / 60000), 0);
    const texto = minutos < 60 ? `${minutos} min` : minutos < 1440 ? `${Math.floor(minutos / 60)} h` : `${Math.floor(minutos / 1440)} d`;
    const color = minutos < 120 ? '#2e7d32' : minutos < 1440 ? '#ed6c02' : '#d32f2f';
    return { minutos, texto, color };
};

export const ChipAntiguedad = ({ fecha }) => {
    const { texto, color } = antiguedad(fecha);
    return (
        <Chip size="small" label={texto} sx={{ fontWeight: 700, height: 22, bgcolor: `${color}14`, color, border: `1px solid ${color}` }} />
    );
};

// Evento de auditoría (no bloquea la pantalla si falla).
export const registrarEvento = (tipo, pregunta, detalle) =>
    axios.post(`${API_PREGUNTAS}/eventos`, { tipo, question_id: pregunta?.id, item_id: pregunta?.item_id, detalle }, authHeaders()).catch(() => {});

export const esInactiva = (pregunta) => Boolean(pregunta?.publicacion && pregunta.publicacion.status !== 'active');

export const mensajeError = (err, porDefecto) =>
    err?.response?.data?.error || (err?.request && !err?.response ? 'No se recibió respuesta del servidor. Revisa tu conexión.' : porDefecto);
