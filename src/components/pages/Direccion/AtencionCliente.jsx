import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
    Alert, Box, Button, Chip, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tooltip, Typography,
} from '@mui/material';
import {
    Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import {
    API_DIRECCION, COLORES, PERIODO_INICIAL, ChartCard, EncabezadoDireccion, KpiCard, Leyenda, SinDatos,
    authHeaders, fmtFechaHora, fmtMinutos, fmtNumero, fmtPct, variacion,
} from './direccionUI';
import PestanaEquipo from './PestanaEquipo';

// endpoint: pestañas ya construidas; el resto aparece como "próximamente".
const PESTANAS = [
    { valor: 'servicio', label: 'Servicio', endpoint: 'servicio' },
    { valor: 'equipo', label: 'Equipo', endpoint: 'equipo' },
    { valor: 'plantillas', label: 'Plantillas' },
    { valor: 'producto', label: 'Producto' },
    { valor: 'conversion', label: 'Conversión' },
];

const FRANJAS = {
    LABORAL: { nombre: 'Laboral', horario: 'L–V 9:00–18:00' },
    EXTRA: { nombre: 'Extra', horario: 'L–V 18:00–9:00' },
    FIN_SEMANA: { nombre: 'Fin de semana', horario: 'Sáb y dom' },
};
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ESCALA_CALOR = ['#eef4fb', '#bbdefb', '#64b5f6', '#1e88e5', '#0d47a1'];
const COLOR_ANTIGUEDAD = { MENOS_1H: COLORES.verde, '1_6H': '#f9a825', '6_24H': COLORES.naranja, MAS_24H: COLORES.rojo };
const filaSx = { display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' } };

const TooltipDiario = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: 1.5, p: 1, boxShadow: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{label}</Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>Recibidas: {d.recibidas}</Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>Respondidas: {d.respondidas}</Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>Tiempo típico: {fmtMinutos(d.mediana_min)}</Typography>
        </Box>
    );
};

// ---------- Pestaña Servicio ----------
const PestanaServicio = ({ datos, loading }) => {
    const navigate = useNavigate();
    const act = datos?.actual;
    const ant = datos?.anterior;
    const pend = datos?.pendientes;

    const diario = useMemo(() => (datos?.diario || []).map((d) => ({ ...d, etiqueta: dayjs(d.dia).format('DD/MM') })), [datos]);
    const maxP90 = Math.max(...(datos?.franjas || []).map((f) => f.p90_min || 0), 1);
    const maxCalor = Math.max(...(datos?.calor || []).flat(), 1);

    return (
        <>
            {/* KPIs */}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' } }}>
                <KpiCard icon={MarkEmailUnreadOutlinedIcon} color={COLORES.azul} label="Recibidas" valor={fmtNumero(act?.recibidas)}
                    variacionKpi={variacion(act?.recibidas, ant?.recibidas, { mejor: null })} detalle={ant ? `vs ${fmtNumero(ant.recibidas)}` : null} />
                <KpiCard icon={TaskAltOutlinedIcon} color={COLORES.verde} label="Respondidas" valor={fmtPct(act?.pct_respondidas)}
                    variacionKpi={variacion(act?.pct_respondidas, ant?.pct_respondidas, { unidad: 'pts' })}
                    detalle={act ? `${fmtNumero(act.respondidas)} de ${fmtNumero(act.recibidas)}` : null} progreso={act?.pct_respondidas} />
                <KpiCard icon={TimerOutlinedIcon} color={COLORES.celeste} label="Tiempo de respuesta" valor={fmtMinutos(act?.mediana_min)}
                    variacionKpi={variacion(act?.mediana_min, ant?.mediana_min, { mejor: 'baja' })}
                    detalle={act?.p90_min != null ? `9 de 10 en ${fmtMinutos(act.p90_min)}` : null} />
                <KpiCard icon={BoltOutlinedIcon} color={COLORES.morado} label="Respondidas en < 1 h" valor={fmtPct(act?.pct_menos_1h)}
                    variacionKpi={variacion(act?.pct_menos_1h, ant?.pct_menos_1h, { unidad: 'pts' })} progreso={act?.pct_menos_1h} />
                <KpiCard icon={PendingActionsOutlinedIcon} color={COLORES.naranja} label="Pendientes ahora" valor={fmtNumero(pend?.total)}
                    detalle={pend?.mas_antigua_min != null ? `la más antigua: ${fmtMinutos(pend.mas_antigua_min)}` : null} />
                <KpiCard icon={OpenInNewOutlinedIcon} color={COLORES.naranja} label="Fuera del sistema" valor={fmtPct(act?.pct_externas)}
                    variacionKpi={variacion(act?.pct_externas, ant?.pct_externas, { unidad: 'pts', mejor: 'baja' })}
                    detalle={act ? `${fmtNumero(act.externas)} respuestas` : null} progreso={act?.pct_externas} />
            </Box>

            {/* Fila 1 */}
            <Box sx={filaSx}>
                <ChartCard
                    title="Recibidas vs respondidas por día"
                    subtitle="La línea es el tiempo de respuesta típico (mediana) de cada día"
                    ayuda={'Se agrupa por el día en que llegó la pregunta (hora de México).\nRespondidas: de las preguntas de ese día, las que ya tienen respuesta.\nTiempo típico: la mediana entre la llegada y la respuesta.'}
                    actions={<Leyenda items={[{ label: 'Recibidas', color: COLORES.azulClaro }, { label: 'Respondidas', color: COLORES.azulOscuro }, { label: 'Tiempo típico', color: COLORES.naranja, linea: true }]} />}
                >
                    {!diario.some((d) => d.recibidas) ? <SinDatos texto={loading ? 'Calculando…' : undefined} /> : (
                        <Box sx={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={diario} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
                                    <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
                                    <YAxis yAxisId="n" tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <YAxis yAxisId="t" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtMinutos(v)} width={64} />
                                    <RTooltip content={<TooltipDiario />} />
                                    <Bar yAxisId="n" dataKey="recibidas" fill={COLORES.azulClaro} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                                    <Bar yAxisId="n" dataKey="respondidas" fill={COLORES.azulOscuro} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                                    <Line yAxisId="t" dataKey="mediana_min" stroke={COLORES.naranja} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </Box>
                    )}
                </ChartCard>

                <ChartCard
                    title="Tiempo de respuesta por franja"
                    subtitle="Como lo mide Mercado Libre para la reputación"
                    ayuda={'Franja según la hora de llegada (México):\nLaboral L–V 9–18 h · Extra L–V 18–9 h · Fin de semana sáb y dom.\nBarra oscura: tiempo típico (mediana). Barra clara: tiempo en que se responde 9 de cada 10.'}
                >
                    {(datos?.franjas || []).map((f) => (
                        <Stack key={f.franja} gap={0.75}>
                            <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{FRANJAS[f.franja]?.nombre}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{FRANJAS[f.franja]?.horario} · {fmtPct(f.pct_volumen)} del volumen</Typography>
                            </Stack>
                            <Box sx={{ position: 'relative', height: 22, borderRadius: 1, bgcolor: '#f1f4f8' }}>
                                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 1, bgcolor: '#bbdefb', width: `${((f.p90_min || 0) / maxP90) * 100}%` }} />
                                <Box sx={{ position: 'absolute', left: 0, top: 4, bottom: 4, borderRadius: 0.75, bgcolor: COLORES.azulOscuro, width: f.mediana_min ? `${Math.max((f.mediana_min / maxP90) * 100, 1.5)}%` : 0 }} />
                            </Box>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption"><strong>{fmtMinutos(f.mediana_min)}</strong> típico</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>9 de cada 10 en {fmtMinutos(f.p90_min)}</Typography>
                            </Stack>
                        </Stack>
                    ))}
                </ChartCard>
            </Box>

            {/* Fila 2 */}
            <Box sx={filaSx}>
                <ChartCard
                    title="¿Cuándo llegan las preguntas?"
                    subtitle="Preguntas recibidas por día y hora (hora de México) · para cuadrar turnos"
                    ayuda="Cuenta las preguntas del periodo según el día de la semana y la hora en que llegaron. Pasa el cursor sobre un cuadro para ver el número."
                >
                    <Box sx={{ overflowX: 'auto' }}>
                        <Stack gap={0.4} sx={{ minWidth: 640 }}>
                            {(datos?.calor || []).map((fila, d) => (
                                <Stack key={DIAS[d]} direction="row" gap={0.4} alignItems="center">
                                    <Typography variant="caption" sx={{ width: 34, flexShrink: 0, fontWeight: 600, color: 'text.secondary' }}>{DIAS[d]}</Typography>
                                    {fila.map((n, h) => (
                                        <Tooltip key={h} arrow title={`${DIAS[d]} ${h}:00 – ${h}:59 · ${n} ${n === 1 ? 'pregunta' : 'preguntas'}`}>
                                            <Box sx={{ flex: 1, height: 26, borderRadius: 0.75, bgcolor: ESCALA_CALOR[n ? Math.min(Math.ceil((n / maxCalor) * 4), 4) : 0] }} />
                                        </Tooltip>
                                    ))}
                                </Stack>
                            ))}
                            <Stack direction="row" gap={0.4} sx={{ pl: '37px' }}>
                                {Array.from({ length: 24 }, (_, h) => (
                                    <Typography key={h} variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'text.secondary' }}>{h % 3 === 0 ? h : ''}</Typography>
                                ))}
                            </Stack>
                        </Stack>
                    </Box>
                    <Stack direction="row" gap={0.75} alignItems="center">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Menos</Typography>
                        {ESCALA_CALOR.map((c) => <Box key={c} sx={{ width: 14, height: 14, borderRadius: 0.75, bgcolor: c }} />)}
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Más</Typography>
                    </Stack>
                </ChartCard>

                <ChartCard
                    title="Pendientes por antigüedad"
                    subtitle={`Ahora mismo · ${fmtNumero(pend?.total)} sin responder`}
                    ayuda="Preguntas que hoy siguen sin responder (sin importar el periodo), agrupadas por cuánto tiempo llevan esperando."
                >
                    <Box sx={{ height: 230 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pend?.antiguedad || []} margin={{ top: 20, right: 8, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <RTooltip formatter={(v) => [v, 'Preguntas']} />
                                <Bar dataKey="total" radius={[6, 6, 0, 0]} isAnimationActive={false} label={{ position: 'top', fontSize: 13, fontWeight: 700 }}>
                                    {(pend?.antiguedad || []).map((c) => <Cell key={c.clave} fill={COLOR_ANTIGUEDAD[c.clave]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </ChartCard>
            </Box>

            {/* Fila 3 */}
            <Box sx={{ ...filaSx, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 2fr)' } }}>
                <ChartCard
                    title="¿Dónde se responde?"
                    subtitle="Desde el sistema vs directamente en Mercado Libre, por semana"
                    ayuda={'Semanas de lunes a domingo, según la fecha de la pregunta.\nSistema: respondida desde la pantalla de Preguntas.\nFuera: respondida directo en Mercado Libre (la detecta la sincronización).'}
                >
                    {!(datos?.canales || []).length ? <SinDatos texto={loading ? 'Calculando…' : undefined} /> : (
                        <>
                            {datos.canales.map((s) => (
                                <Stack key={s.semana} direction="row" alignItems="center" gap={1.25}>
                                    <Typography variant="caption" sx={{ width: 72, flexShrink: 0, color: 'text.secondary' }}>{dayjs(s.semana).format('DD/MM')}</Typography>
                                    <Tooltip arrow title={`Sistema: ${s.sistema} · Fuera: ${s.externo}`}>
                                        <Box sx={{ flex: 1, height: 22, display: 'flex', borderRadius: 1, overflow: 'hidden', bgcolor: '#f1f4f8' }}>
                                            <Box sx={{ width: `${s.pct_sistema}%`, bgcolor: COLORES.azulOscuro, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', pl: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                {s.pct_sistema >= 15 ? fmtPct(s.pct_sistema) : ''}
                                            </Box>
                                            <Box sx={{ flex: 1, bgcolor: COLORES.ambar, color: '#4a2c00', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                {100 - s.pct_sistema >= 15 ? fmtPct(Math.round((100 - s.pct_sistema) * 10) / 10) : ''}
                                            </Box>
                                        </Box>
                                    </Tooltip>
                                </Stack>
                            ))}
                            <Leyenda items={[{ label: 'Sistema Aphelios', color: COLORES.azulOscuro }, { label: 'Fuera del sistema', color: COLORES.ambar }]} />
                        </>
                    )}
                </ChartCard>

                <ChartCard
                    title="Pendientes más antiguas"
                    actions={<Button size="small" sx={{ textTransform: 'none', fontWeight: 700 }} onClick={() => navigate('/preguntas')}>Ir a Preguntas →</Button>}
                >
                    {!pend?.mas_antiguas?.length ? <SinDatos texto={loading ? 'Calculando…' : 'No hay preguntas pendientes.'} /> : (
                        <TableContainer sx={{ border: '1px solid #eef0f3', borderRadius: 2 }}>
                            <Table size="small" sx={{ minWidth: 560 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f7fa', '& th': { fontWeight: 700 } }}>
                                        <TableCell>Pregunta</TableCell>
                                        <TableCell>Cliente</TableCell>
                                        <TableCell>SKU</TableCell>
                                        <TableCell>Recibida</TableCell>
                                        <TableCell align="center">Espera</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pend.mas_antiguas.map((p) => (
                                        <TableRow key={p.question_id} hover>
                                            <TableCell sx={{ maxWidth: 320 }}>
                                                <Tooltip arrow title={p.titulo ? `${p.titulo} · ${p.item_id}` : p.item_id}>
                                                    <Typography variant="body2" noWrap>{p.texto}</Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>{p.cliente || '—'}</TableCell>
                                            <TableCell>{p.sku || '—'}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtFechaHora(p.fecha_pregunta)}</TableCell>
                                            <TableCell align="center">
                                                <Chip size="small" label={fmtMinutos(p.espera_min)} variant="outlined"
                                                    sx={{ fontWeight: 700, ...(p.espera_min >= 1440 ? { color: '#b71c1c', borderColor: COLORES.rojo, bgcolor: '#fdecea' } : { color: '#8a4b00', borderColor: COLORES.naranja, bgcolor: '#fff4e5' }) }} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </ChartCard>
            </Box>
        </>
    );
};

// ---------- Página ----------
const AtencionCliente = () => {
    const [periodo, setPeriodo] = useState(PERIODO_INICIAL);
    const [pestana, setPestana] = useState('servicio');
    const [datos, setDatos] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Carga solo la pestaña visible, con el periodo actual.
    const cargar = useCallback(async () => {
        const endpoint = PESTANAS.find((p) => p.valor === pestana)?.endpoint;
        if (!endpoint) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API_DIRECCION}/atencion/${endpoint}`, { ...authHeaders(), params: { desde: periodo.desde, hasta: periodo.hasta } });
            setDatos((prev) => ({ ...prev, [pestana]: data }));
        } catch (err) {
            setError(err?.response?.data?.error || 'No se pudieron cargar las métricas.');
        } finally {
            setLoading(false);
        }
    }, [pestana, periodo.desde, periodo.hasta]);

    useEffect(() => { cargar(); }, [cargar]);

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
            <EncabezadoDireccion
                icon={QuestionAnswerOutlinedIcon}
                titulo="Atención al cliente"
                descripcion="Preguntas de Mercado Libre · cuenta principal · comparado contra el periodo anterior"
                periodo={periodo}
                onPeriodo={setPeriodo}
                onActualizar={cargar}
                loading={loading}
            >
                <Tabs value={pestana} onChange={(_, v) => setPestana(v)} variant="scrollable" allowScrollButtonsMobile
                    sx={{ borderTop: '1px solid #eef0f3', minHeight: 42, '& .MuiTab-root': { minHeight: 42, textTransform: 'none', fontWeight: 600 } }}>
                    {PESTANAS.map((p) => (
                        <Tab key={p.valor} value={p.valor} label={p.endpoint ? p.label : `${p.label} · próximamente`} disabled={!p.endpoint} />
                    ))}
                </Tabs>
            </EncabezadoDireccion>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {pestana === 'servicio' && <PestanaServicio datos={datos.servicio} loading={loading} />}
            {pestana === 'equipo' && <PestanaEquipo datos={datos.equipo} loading={loading} />}
        </Box>
    );
};

export default AtencionCliente;
