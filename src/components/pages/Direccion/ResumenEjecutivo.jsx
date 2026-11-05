import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import {
    API_DIRECCION, COLORES, PERIODO_INICIAL, ChipVariacion, EncabezadoDireccion, authHeaders, cardSx, fmtMinutos, fmtNumero, fmtPct, variacion,
} from './direccionUI';

// Áreas en Fase 2: datos de ejemplo fijos (solo para mostrar hacia dónde va el módulo).
const serieEjemplo = (base, paso, ruido) => Array.from({ length: 30 }, (_, i) => ({ valor: base + i * paso + ((i * 37) % 7) * ruido }));
const AREAS_EJEMPLO = [
    {
        clave: 'ventas', nombre: 'Ventas', descripcion: 'Mercado Libre · cuenta principal', icon: ShoppingCartOutlinedIcon, color: COLORES.azul,
        sparkLabel: 'Ventas diarias', serie: serieEjemplo(62, 1.5, 2),
        kpis: [
            { label: 'Ventas', valor: '$2.84 M', v: { texto: '▲ 6.2 %', tipo: 'bien' } },
            { label: 'Órdenes', valor: '4,912', v: { texto: '▲ 3.1 %', tipo: 'bien' } },
            { label: 'Ticket prom.', valor: '$578', v: { texto: '▲ 2.9 %', tipo: 'bien' } },
        ],
    },
    {
        clave: 'inventario', nombre: 'Inventario', descripcion: 'Existencias y cobertura', icon: Inventory2OutlinedIcon, color: COLORES.morado,
        sparkLabel: 'SKUs sin stock', serie: serieEjemplo(22, 0.6, 1),
        kpis: [
            { label: 'Cobertura', valor: '5.8 sem', v: { texto: '▼ 0.4 sem', tipo: 'mal' } },
            { label: 'Sin stock', valor: '38 SKUs', v: { texto: '▲ 9', tipo: 'mal' } },
            { label: 'En FULL', valor: '71 %', v: { texto: '= 0 pts', tipo: 'neutro' } },
        ],
    },
    {
        clave: 'compras', nombre: 'Compras', descripcion: 'Cuentas por pagar', icon: AccountBalanceWalletOutlinedIcon, color: COLORES.naranja,
        sparkLabel: 'Saldo por pagar', serie: serieEjemplo(80, 0.1, 1.5),
        kpis: [
            { label: 'Por pagar', valor: '$1.12 M', v: { texto: '▼ 4 %', tipo: 'neutro' } },
            { label: 'Vencidas', valor: '6', v: { texto: '▲ 2', tipo: 'mal' } },
            { label: 'Pronto pago', valor: '82 %', v: { texto: '▲ 6 pts', tipo: 'bien' } },
        ],
    },
    {
        clave: 'mejora', nombre: 'Mejora continua', descripcion: 'Kaizen y ventas perdidas', icon: TrendingUpOutlinedIcon, color: COLORES.verde,
        sparkLabel: 'Kaizen abiertos', serie: serieEjemplo(20, -0.2, 0.6),
        kpis: [
            { label: 'Abiertos', valor: '14', v: { texto: '▼ 6', tipo: 'bien' } },
            { label: 'Cerrados', valor: '9', v: { texto: '▲ 3', tipo: 'bien' } },
            { label: 'V. perdidas', valor: '27', v: { texto: '▲ 4', tipo: 'mal' } },
        ],
    },
];

const NIVELES = {
    ALTA: { label: 'Alta', sx: { bgcolor: '#fdecea', color: '#b71c1c', border: '1px solid #d32f2f' } },
    MEDIA: { label: 'Media', sx: { bgcolor: '#fff4e5', color: '#8a4b00', border: '1px solid #ed6c02' } },
};
const RUTAS_AREA = { atencion: { label: 'Atención al cliente', ruta: '/direccion/atencion-cliente' } };

const AreaCard = ({ nombre, descripcion, icon: Icon, color, kpis, serie, sparkLabel, ejemplo, loading, onVer }) => (
    <Paper elevation={2} sx={{ ...cardSx, display: 'flex', flexDirection: 'column', gap: 1.75, opacity: ejemplo ? 0.85 : 1 }}>
        <Stack direction="row" gap={1.5} alignItems="center">
            <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: `${color}1A`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{nombre}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{descripcion}</Typography>
            </Box>
            <Chip size="small" label={ejemplo ? 'Fase 2 · ejemplo' : 'Disponible'} variant="outlined"
                sx={{ fontWeight: 700, ...(ejemplo ? { color: '#4b5563', borderColor: '#9ca3af', bgcolor: '#f1f3f5' } : { color: '#1b5e20', borderColor: '#2e7d32', bgcolor: '#e8f5e9' }) }} />
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.25 }}>
            {kpis.map((k) => (
                <Box key={k.label} sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 11 }}>{k.label}</Typography>
                    {loading ? <Skeleton width="70%" height={30} /> : <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{k.valor}</Typography>}
                    <ChipVariacion v={k.v} />
                </Box>
            ))}
        </Box>

        <Stack direction="row" alignItems="flex-end" gap={1.5} sx={{ borderTop: '1px solid #eef0f3', pt: 1.25 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{sparkLabel} · {serie.length} días</Typography>
                <Box sx={{ height: 48 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={serie} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                            <YAxis hide domain={['dataMin', 'dataMax']} />
                            <Area type="monotone" dataKey="valor" stroke={color} strokeWidth={2.5} fill={`${color}1A`} connectNulls isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            </Box>
            <Button size="small" disabled={!onVer} onClick={onVer} sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
                Ver tablero →
            </Button>
        </Stack>
    </Paper>
);

const ResumenEjecutivo = () => {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState(PERIODO_INICIAL);
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API_DIRECCION}/resumen`, { ...authHeaders(), params: { desde: periodo.desde, hasta: periodo.hasta } });
            setDatos(data);
        } catch (err) {
            setError(err?.response?.data?.error || 'No se pudo cargar el resumen ejecutivo.');
        } finally {
            setLoading(false);
        }
    }, [periodo.desde, periodo.hasta]);

    useEffect(() => { cargar(); }, [cargar]);

    const a = datos?.atencion;
    const atencion = {
        nombre: 'Atención al cliente', descripcion: 'Preguntas de Mercado Libre', icon: QuestionAnswerOutlinedIcon, color: COLORES.celeste,
        sparkLabel: 'Tiempo de respuesta (mediana)',
        serie: a?.serie_mediana || [],
        kpis: [
            { label: 'T. respuesta', valor: fmtMinutos(a?.actual.mediana_min), v: variacion(a?.actual.mediana_min, a?.anterior.mediana_min, { mejor: 'baja' }) },
            { label: 'En < 1 h', valor: fmtPct(a?.actual.pct_menos_1h), v: variacion(a?.actual.pct_menos_1h, a?.anterior.pct_menos_1h, { unidad: 'pts' }) },
            { label: 'Pendientes', valor: fmtNumero(a?.pendientes), v: null },
        ],
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
            <EncabezadoDireccion
                icon={SpaceDashboardOutlinedIcon}
                titulo="Resumen ejecutivo"
                descripcion="Cómo va la empresa en el periodo, comparado contra el periodo anterior"
                periodo={periodo}
                onPeriodo={setPeriodo}
                onActualizar={cargar}
                loading={loading}
            />

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' } }}>
                <AreaCard {...AREAS_EJEMPLO[0]} ejemplo />
                <AreaCard {...AREAS_EJEMPLO[1]} ejemplo />
                <AreaCard {...atencion} loading={loading && !datos} onVer={() => navigate('/direccion/atencion-cliente')} />
                <AreaCard {...AREAS_EJEMPLO[2]} ejemplo />
                <AreaCard {...AREAS_EJEMPLO[3]} ejemplo />
            </Box>

            <Paper elevation={2} sx={cardSx}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <ReportProblemOutlinedIcon color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Requiere atención</Typography>
                    <Chip size="small" label={datos?.alertas?.length || 0} sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main', height: 22 }} />
                </Stack>
                {!datos?.alertas?.length ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                        {loading ? 'Calculando…' : 'Sin alertas para este periodo.'}
                    </Typography>
                ) : (
                    datos.alertas.map((al, i) => {
                        const nivel = NIVELES[al.nivel] || NIVELES.MEDIA;
                        const area = RUTAS_AREA[al.area];
                        return (
                            <Stack key={i} direction="row" flexWrap="wrap" alignItems="center" gap={1.5} sx={{ py: 1.25, borderTop: '1px solid #eef0f3' }}>
                                <Chip size="small" label={nivel.label} sx={{ fontWeight: 700, ...nivel.sx }} />
                                <Typography variant="body2" sx={{ flex: '1 1 320px', minWidth: 0 }}>{al.texto}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{area?.label}</Typography>
                                {area && <Button size="small" sx={{ textTransform: 'none', fontWeight: 700 }} onClick={() => navigate(area.ruta)}>Ver</Button>}
                            </Stack>
                        );
                    })
                )}
            </Paper>
        </Box>
    );
};

export default ResumenEjecutivo;
