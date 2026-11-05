import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Box, Chip, GlobalStyles, Stack, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import {
    COLORES, PALETA_USUARIOS, ChartCard, KpiCard, SinDatos,
    fmtFechaHora, fmtMinutos, fmtNumero, fmtPct, fmtSegundos, variacion,
} from './direccionUI';
import { DATA_GRID_LOCALE_ES } from '../../../config/dataGridLocale';

const GRID_HEIGHT = 420;
const LOCALE_TEXT_GRID = {
    ...DATA_GRID_LOCALE_ES,
    filterPanelOperator: 'Operador', toolbarFiltersTooltipHide: 'Ocultar filtros', toolbarFiltersTooltipShow: 'Mostrar filtros',
    footerTotalVisibleRows: (visibleCount, totalCount) => `${visibleCount} de ${totalCount}`,
    noRowsLabel: 'Nadie respondió desde el sistema en este periodo.',
};
const gridSx = {
    fontFamily: 'Montserrat', borderRadius: 2,
    '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f7fa', fontWeight: 'bold', fontSize: 13 },
    '& .MuiDataGrid-columnHeader': { backgroundColor: '#f5f7fa' },
    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
    '& .MuiDataGrid-cell': { borderBottom: '1px solid #eee', fontSize: 13 },
    '& .MuiDataGrid-row:hover': { backgroundColor: '#f9fafb' },
};

const MODOS = [
    { clave: 'MANUAL', label: 'Manual', color: '#90a4ae' },
    { clave: 'PLANTILLA', label: 'Plantilla', color: COLORES.azulOscuro },
    { clave: 'PLANTILLA_EDITADA', label: 'Plantilla editada', color: COLORES.ambar },
    { clave: 'DIRECTA', label: 'Directa', color: COLORES.verde },
];
const FRANJAS_HORA = [
    { clave: 'LABORAL', label: 'Laboral', color: COLORES.azulOscuro },
    { clave: 'EXTRA', label: 'Extra', color: COLORES.naranja },
    { clave: 'FIN_SEMANA', label: 'Fin de semana', color: COLORES.morado },
];
const MOTIVOS_ERROR = {
    ITEM_NO_ACTIVO: 'Publicación pausada o inactiva',
    ERROR_INTERNO: 'Error interno del sistema',
    SIN_CODIGO: 'Sin código',
};
const motivoDe = (codigo) => MOTIVOS_ERROR[codigo] || `Rechazo de Mercado Libre (${codigo})`;
const filaSx = { display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' } };

const pctCol = (field, headerName, width = 120) => ({
    field, headerName, width, type: 'number', align: 'center', headerAlign: 'center',
    valueFormatter: (value) => fmtPct(value),
});

const PestanaEquipo = ({ datos, loading }) => {
    const act = datos?.actual;
    const ant = datos?.anterior;
    const usuarios = useMemo(() => (datos?.usuarios || []).map((u, i) => ({ ...u, id: u.clave, color: PALETA_USUARIOS[i % PALETA_USUARIOS.length] })), [datos]);
    const diario = useMemo(() => (datos?.diario || []).map((d) => ({ ...d, etiqueta: dayjs(d.dia).format('DD/MM') })), [datos]);
    const modos = useMemo(() => usuarios.map((u) => ({ usuario: u.usuario, ...u.modos })), [usuarios]);
    const hayHoras = (datos?.por_hora || []).some((h) => h.LABORAL + h.EXTRA + h.FIN_SEMANA);

    const columnas = useMemo(() => [
        {
            field: 'usuario', headerName: 'Usuario', flex: 1, minWidth: 170,
            renderCell: ({ row }) => (
                <Stack direction="row" gap={1} alignItems="center" sx={{ height: '100%' }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{row.usuario}</Typography>
                </Stack>
            ),
        },
        {
            field: 'respuestas', headerName: 'Respuestas', width: 130, type: 'number', align: 'center', headerAlign: 'center',
            renderCell: ({ row }) => `${fmtNumero(row.respuestas)} (${fmtPct(row.pct_total)})`,
        },
        { field: 'mediana_respuesta_min', headerName: 'T. respuesta típico', width: 150, type: 'number', align: 'center', headerAlign: 'center', valueFormatter: (value) => fmtMinutos(value) },
        { field: 'mediana_atencion_seg', headerName: 'T. atención típico', width: 145, type: 'number', align: 'center', headerAlign: 'center', valueFormatter: (value) => fmtSegundos(value) },
        pctCol('pct_menos_1h', 'En < 1 h', 100),
        pctCol('pct_plantilla', 'Con plantilla', 115),
        pctCol('pct_editadas', 'Editadas', 100),
        pctCol('pct_fuera_horario', 'Fuera de horario', 135),
        {
            field: 'errores', headerName: 'Errores', width: 95, type: 'number', align: 'center', headerAlign: 'center',
            renderCell: ({ value }) => (value ? <Chip size="small" label={value} sx={{ fontWeight: 700, bgcolor: '#fdecea', color: '#b71c1c' }} /> : '0'),
        },
        { field: 'ultima_respuesta', headerName: 'Última respuesta', width: 150, valueFormatter: (value) => fmtFechaHora(value) },
    ], []);

    return (
        <>
            <GlobalStyles styles={(theme) => ({ '.MuiDataGrid-panel': { zIndex: theme.zIndex.modal + 100 } })} />

            {/* KPIs */}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' } }}>
                <KpiCard icon={ForumOutlinedIcon} color={COLORES.azul} label="Respuestas desde el sistema" valor={fmtNumero(act?.respuestas)}
                    variacionKpi={variacion(act?.respuestas, ant?.respuestas, { mejor: null })} detalle={ant ? `vs ${fmtNumero(ant.respuestas)}` : null} />
                <KpiCard icon={GroupsOutlinedIcon} color={COLORES.celeste} label="Usuarios activos" valor={fmtNumero(act?.usuarios_activos)}
                    detalle={ant ? `antes: ${fmtNumero(ant.usuarios_activos)}` : null} />
                <KpiCard icon={TimerOutlinedIcon} color={COLORES.morado} label="Tiempo de atención" valor={fmtSegundos(act?.mediana_atencion_seg)}
                    variacionKpi={variacion(act?.mediana_atencion_seg, ant?.mediana_atencion_seg, { mejor: 'baja' })} detalle="de abrir a enviar" />
                <KpiCard icon={BoltOutlinedIcon} color={COLORES.verde} label="Con plantilla" valor={fmtPct(act?.pct_plantilla)}
                    variacionKpi={variacion(act?.pct_plantilla, ant?.pct_plantilla, { unidad: 'pts', mejor: null })} progreso={act?.pct_plantilla} />
                <KpiCard icon={EditNoteOutlinedIcon} color={COLORES.naranja} label="Plantillas editadas" valor={fmtPct(act?.pct_editadas)}
                    variacionKpi={variacion(act?.pct_editadas, ant?.pct_editadas, { unidad: 'pts', mejor: 'baja' })} progreso={act?.pct_editadas} />
                <KpiCard icon={ErrorOutlineOutlinedIcon} color={COLORES.rojo} label="Intentos con error" valor={fmtPct(act?.pct_errores)}
                    variacionKpi={variacion(act?.pct_errores, ant?.pct_errores, { unidad: 'pts', mejor: 'baja' })}
                    detalle={act ? `${fmtNumero(act.errores)} de ${fmtNumero(act.intentos)}` : null} />
            </Box>

            {/* Tabla por usuario */}
            <ChartCard
                title="Desempeño por usuario"
                subtitle="Solo respuestas enviadas desde el sistema en el periodo"
                ayuda={'T. respuesta: desde que llegó la pregunta hasta que el usuario respondió (mediana).\nT. atención: desde que abrió la pregunta en el sistema hasta que la envió (mediana).\nEditadas: de las respuestas con plantilla, cuántas modificó.\nFuera de horario: respuestas a preguntas que llegaron en franja extra o fin de semana.'}
                actions={<Chip size="small" label={usuarios.length} sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main', height: 22 }} />}
            >
                <Box sx={{ height: GRID_HEIGHT, width: '100%' }}>
                    <DataGrid
                        rows={usuarios}
                        columns={columnas}
                        loading={loading}
                        density="compact"
                        showCellVerticalBorder
                        showColumnVerticalBorder
                        disableRowSelectionOnClick
                        hideFooterSelectedRowCount
                        pageSizeOptions={[100]}
                        initialState={{ pagination: { paginationModel: { pageSize: 100, page: 0 } } }}
                        slots={{ toolbar: GridToolbar }}
                        slotProps={{ loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' } }}
                        localeText={LOCALE_TEXT_GRID}
                        sx={gridSx}
                    />
                </Box>
            </ChartCard>

            {/* Fila: por día + por hora */}
            <Box sx={filaSx}>
                <ChartCard
                    title="Respuestas por día y por usuario"
                    subtitle="Quién cargó el trabajo cada día"
                    ayuda="Respuestas enviadas con éxito desde el sistema, por día de envío (hora de México)."
                >
                    {!usuarios.length ? <SinDatos texto={loading ? 'Calculando…' : undefined} /> : (
                        <Box sx={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={diario} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
                                    <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <RTooltip />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {usuarios.map((u) => (
                                        <Bar key={u.clave} dataKey={u.clave} name={u.usuario} stackId="dia" fill={u.color} isAnimationActive={false} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    )}
                </ChartCard>

                <ChartCard
                    title="¿A qué hora responde el equipo?"
                    subtitle="Respuestas por hora de envío, según la franja de la pregunta"
                    ayuda="Compárala con el mapa de calor de la pestaña Servicio para ver si los turnos cubren las horas en que llegan las preguntas."
                >
                    {!hayHoras ? <SinDatos texto={loading ? 'Calculando…' : undefined} /> : (
                        <Box sx={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={datos.por_hora} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
                                    <XAxis dataKey="hora" tick={{ fontSize: 11 }} interval={2} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <RTooltip labelFormatter={(h) => `${h}:00 – ${h}:59`} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {FRANJAS_HORA.map((f) => (
                                        <Bar key={f.clave} dataKey={f.clave} name={f.label} stackId="hora" fill={f.color} isAnimationActive={false} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    )}
                </ChartCard>
            </Box>

            {/* Fila: modo por usuario + errores */}
            <Box sx={filaSx}>
                <ChartCard
                    title="Cómo responde cada usuario"
                    subtitle="Proporción de respuestas por tipo"
                    ayuda={'Manual: escrita desde cero.\nPlantilla: respuesta rápida sin cambios (o solo llenando el dato **).\nPlantilla editada: respuesta rápida modificada.\nDirecta: enviada con un clic desde la plantilla.'}
                >
                    {!usuarios.length ? <SinDatos texto={loading ? 'Calculando…' : undefined} /> : (
                        <Box sx={{ height: Math.max(usuarios.length * 44 + 60, 160) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={modos} layout="vertical" stackOffset="expand" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                                    <XAxis type="number" tickFormatter={(v) => `${Math.round(v * 100)} %`} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="usuario" width={130} tick={{ fontSize: 12 }} />
                                    <RTooltip />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {MODOS.map((m) => (
                                        <Bar key={m.clave} dataKey={m.clave} name={m.label} stackId="modo" fill={m.color} barSize={22} isAnimationActive={false} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    )}
                </ChartCard>

                <ChartCard
                    title="Errores por motivo"
                    subtitle={`${fmtNumero(act?.errores)} intentos rechazados en el periodo`}
                    ayuda="Intentos de respuesta que no llegaron a Mercado Libre. Una publicación pausada o inactiva no admite respuestas hasta reactivarse."
                >
                    {!datos?.errores?.length ? <SinDatos texto={loading ? 'Calculando…' : 'Sin errores en el periodo.'} /> : (
                        <Stack gap={1.5}>
                            {datos.errores.map((e) => (
                                <Box key={e.codigo} sx={{ borderTop: '1px solid #eef0f3', pt: 1.25 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{motivoDe(e.codigo)}</Typography>
                                        <Chip size="small" label={e.total} sx={{ fontWeight: 700, bgcolor: '#fdecea', color: '#b71c1c' }} />
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {e.usuarios.map((u) => `${u.usuario} (${u.total})`).join(' · ')}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </ChartCard>
            </Box>
        </>
    );
};

export default PestanaEquipo;
