import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
    Alert, Avatar, Box, Button, Chip, FormControlLabel, GlobalStyles, IconButton, InputAdornment,
    Paper, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import MarkUnreadChatAltOutlinedIcon from '@mui/icons-material/MarkUnreadChatAltOutlined';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SendIcon from '@mui/icons-material/Send';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import HistorialPreguntasDialog from './HistorialPreguntasDialog';
import RespuestasRapidasDialog from './RespuestasRapidasDialog';
import AppDataGrid from '../../common/AppDataGrid';
import { DATA_GRID_LOCALE_ES } from '../../../config/dataGridLocale';
import { gridCompactoProps, gridCompactoSx, getThumbnailUrl } from '../Envios/tablaCompacta';
import {
    API_PREGUNTAS, MAX_CARACTERES, PLACEHOLDER, ChipAntiguedad, SectionCard,
    antiguedad, authHeaders, esInactiva, formatearFecha, mensajeError, registrarEvento,
} from './preguntasUI';

// Tabla con el estándar AppDataGrid + formato compacto (igual que EnviosProgresoEmpaque.jsx).
const GRID_HEIGHT = 640;
const PAGE_SIZE = 100;
const LOCALE_GRID = { ...DATA_GRID_LOCALE_ES, noRowsLabel: 'No hay preguntas pendientes que coincidan con los filtros.' };
const gridSx = {
    ...gridCompactoSx,
    '& .MuiDataGrid-row': { cursor: 'pointer' },
    '& .fila-seleccionada, & .fila-seleccionada:hover': { backgroundColor: '#e3f2fd' },
    '& .fila-inactiva': { boxShadow: 'inset 3px 0 0 #d32f2f' },
};
const COLUMNAS_OCULTAS = { sku: false, item_id: false };
const botonSx = { borderRadius: 2, textTransform: 'none', fontWeight: 600 };
const FILTROS_INICIALES = { busqueda: '', fechaInicio: '', fechaFin: '', ocultarInactivas: false };
const KEY_FIRMA = 'preguntas_firmar_respuesta';

const leerFirma = () => {
    try { return localStorage.getItem(KEY_FIRMA) === '1'; } catch { return false; }
};

const fechaLocal = (iso, finDelDia) => {
    const [a, m, d] = iso.split('-').map(Number);
    return finDelDia ? new Date(a, m - 1, d, 23, 59, 59, 999) : new Date(a, m - 1, d);
};

const Preguntas = () => {
    const [preguntas, setPreguntas] = useState([]);
    const [total, setTotal] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: PAGE_SIZE });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);

    const [seleccionada, setSeleccionada] = useState(null);
    const [respuestaTexto, setRespuestaTexto] = useState('');
    const [respuestaRapidaId, setRespuestaRapidaId] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [firmar, setFirmar] = useState(leerFirma);
    const respuestaRef = useRef(null);
    const abiertaEnRef = useRef(null);

    const [respuestasRapidas, setRespuestasRapidas] = useState([]);
    const [buscarRapida, setBuscarRapida] = useState('');
    const [gestorAbierto, setGestorAbierto] = useState(false);

    // Historial del cliente de la pregunta seleccionada (se usa para el contador y se reusa en el diálogo).
    const [historialCliente, setHistorialCliente] = useState(null);
    const [historialPregunta, setHistorialPregunta] = useState(null);

    const usuario = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    }, []);

    const cargarPreguntas = useCallback(async (pagina) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API_PREGUNTAS}/obtenerPreguntas`, { ...authHeaders(), params: { page: pagina + 1 } });
            setPreguntas(data.preguntas || []);
            setTotal(data.meta?.total_registros || 0);
        } catch (err) {
            setError(mensajeError(err, 'Error al obtener las preguntas desde el servidor.'));
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarRespuestasRapidas = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_PREGUNTAS}/respuestasRapidas`, authHeaders());
            setRespuestasRapidas(data.respuestas || []);
        } catch (err) {
            setError(mensajeError(err, 'No se pudieron cargar las respuestas rápidas.'));
        }
    }, []);

    useEffect(() => { cargarRespuestasRapidas(); }, [cargarRespuestasRapidas]);

    useEffect(() => {
        cargarPreguntas(paginationModel.page);
        setSeleccionada(null);
    }, [paginationModel.page, cargarPreguntas]);

    // Al cambiar de pregunta: limpiar respuesta y traer el historial del cliente sobre ese artículo.
    useEffect(() => {
        setRespuestaTexto('');
        setRespuestaRapidaId(null);
        setHistorialCliente(null);
        abiertaEnRef.current = seleccionada ? new Date().toISOString() : null;
        if (seleccionada) registrarEvento('PREGUNTA_ABIERTA', seleccionada);
        if (!seleccionada?.from?.id) return;
        let vigente = true;
        axios.get(`${API_PREGUNTAS}/historial`, { ...authHeaders(), params: { item_id: seleccionada.item_id, from_id: seleccionada.from.id } })
            .then(({ data }) => vigente && setHistorialCliente(data))
            .catch(() => vigente && setHistorialCliente({ historial: [], total: 0, error: true }));
        return () => { vigente = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seleccionada?.id]);

    const actualizarTodo = () => {
        cargarPreguntas(paginationModel.page);
        cargarRespuestasRapidas();
    };

    const filtradas = useMemo(() => {
        const termino = filtros.busqueda.toLowerCase().trim();
        const inicio = filtros.fechaInicio ? fechaLocal(filtros.fechaInicio) : null;
        const fin = filtros.fechaFin ? fechaLocal(filtros.fechaFin, true) : null;
        return preguntas
            .filter((p) => {
                const fecha = new Date(p.date_created);
                const coincide = !termino || [p.item_id, p.text, p.publicacion?.title, p.publicacion?.sku]
                    .some((v) => v && String(v).toLowerCase().includes(termino));
                return coincide
                    && (!filtros.ocultarInactivas || !esInactiva(p))
                    && (!inicio || fecha >= inicio)
                    && (!fin || fecha <= fin);
            })
            .sort((a, b) => Number(esInactiva(b)) - Number(esInactiva(a))); // inactivas arriba
    }, [preguntas, filtros]);

    const rapidasFiltradas = useMemo(() => {
        const t = buscarRapida.toLowerCase().trim();
        return t ? respuestasRapidas.filter((r) => `${r.titulo} ${r.categoria || ''} ${r.texto}`.toLowerCase().includes(t)) : respuestasRapidas;
    }, [respuestasRapidas, buscarRapida]);

    const hayFiltros = filtros.busqueda || filtros.fechaInicio || filtros.fechaFin || filtros.ocultarInactivas;
    const seleccionadaInactiva = esInactiva(seleccionada);
    const firmaTexto = usuario?.nombre ? `\nTe atendió: ${usuario.nombre}` : '';
    const textoFinal = (texto) => `${texto.trim()}${firmar ? firmaTexto : ''}`;

    // Llena la caja de respuesta con la plantilla y selecciona el primer "**" para completarlo.
    const usarPlantilla = (r) => {
        setRespuestaTexto(r.texto);
        setRespuestaRapidaId(r.id);
        setTimeout(() => {
            const input = respuestaRef.current;
            if (!input) return;
            input.focus();
            const pos = r.texto.indexOf(PLACEHOLDER);
            if (pos >= 0) input.setSelectionRange(pos, pos + PLACEHOLDER.length);
            else input.setSelectionRange(r.texto.length, r.texto.length);
        }, 0);
    };

    const enviarRespuesta = async (texto, rapidaId, directa = false) => {
        if (!seleccionada || !texto.trim() || enviando) return;
        if (texto.includes(PLACEHOLDER)) {
            Swal.fire({ icon: 'warning', title: 'Falta completar la respuesta', text: `Reemplaza "${PLACEHOLDER}" con el dato correspondiente antes de enviar.` });
            return;
        }
        const final = textoFinal(texto);
        if (final.length > MAX_CARACTERES) {
            Swal.fire({ icon: 'warning', title: 'Respuesta muy larga', text: `Mercado Libre permite máximo ${MAX_CARACTERES} caracteres.` });
            return;
        }
        setEnviando(true);
        try {
            const { data } = await axios.post(`${API_PREGUNTAS}/responder`, {
                question_id: seleccionada.id,
                text: texto.trim(),
                con_firma: firmar && Boolean(firmaTexto),
                directa,
                abierta_en: abiertaEnRef.current,
                item_id: seleccionada.item_id,
                from_id: seleccionada.from?.id ?? null,
                pregunta: seleccionada.text,
                fecha_pregunta: seleccionada.date_created,
                respuesta_rapida_id: rapidaId ?? null,
            }, authHeaders());
            if (data.ok) {
                // Se quita de la lista y se pasa a la siguiente pregunta activa para agilizar la atención.
                const idx = filtradas.findIndex((p) => p.id === seleccionada.id);
                const siguiente = filtradas.slice(idx + 1).find((p) => !esInactiva(p)) || null;
                setPreguntas((prev) => prev.filter((q) => q.id !== seleccionada.id));
                setTotal((t) => Math.max(t - 1, 0));
                setSeleccionada(siguiente);
                if (rapidaId) setRespuestasRapidas((prev) => prev.map((r) => (r.id === rapidaId ? { ...r, veces_usada: (r.veces_usada || 0) + 1 } : r)));
                Swal.fire({ title: '¡Respondida!', text: 'La respuesta se publicó en Mercado Libre.', icon: 'success', timer: 1800, showConfirmButton: false });
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.codigo === 'ITEM_NO_ACTIVO') {
                Swal.fire({ title: 'No es posible responder', text: data.error, icon: 'warning' });
            } else {
                const detalle = data?.detalle_ml ? `\n\nDetalle de Mercado Libre: ${data.detalle_ml}` : '';
                Swal.fire({ title: 'No se pudo responder', text: `${mensajeError(err, 'No se pudo conectar con el servidor.')}${detalle}`, icon: 'error' });
            }
        } finally {
            setEnviando(false);
        }
    };

    const enviarDirecto = async (r) => {
        const { isConfirmed } = await Swal.fire({
            title: `Responder con "${r.titulo}"`,
            text: textoFinal(r.texto),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Enviar',
            cancelButtonText: 'Cancelar',
        });
        if (isConfirmed) enviarRespuesta(r.texto, r.id, true);
    };

    const cambiarFirma = (valor) => {
        setFirmar(valor);
        try { localStorage.setItem(KEY_FIRMA, valor ? '1' : '0'); } catch { /* sin storage */ }
    };

    const abrirHistorial = (pregunta) => {
        setHistorialPregunta(pregunta);
        registrarEvento('HISTORIAL_CONSULTADO', pregunta);
    };

    const columnas = useMemo(() => [
        {
            field: 'publicacion', headerName: 'Publicación', flex: 3, minWidth: 240,
            valueGetter: (value, row) => `${row.publicacion?.title || ''} · SKU: ${row.publicacion?.sku || 'N/A'} · MLM: ${row.item_id}`,
            renderCell: ({ row }) => {
                const pub = row.publicacion;
                const detalle = `SKU: ${pub?.sku || 'N/A'} · MLM: ${row.item_id}`;
                return (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
                        <Avatar
                            component={pub?.permalink ? 'a' : 'div'} href={pub?.permalink || undefined} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} variant="rounded" src={getThumbnailUrl(pub?.thumbnail) || undefined}
                            sx={{ width: 30, height: 30, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0', flexShrink: 0 }}
                        >
                            <Inventory2OutlinedIcon sx={{ fontSize: 15, color: '#9e9e9e' }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0, lineHeight: 1.2 }}>
                            <Typography noWrap title={pub?.title} sx={{ fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.25 }}>
                                {pub?.title || 'No vinculada localmente'}
                            </Typography>
                            <Typography variant="caption" noWrap title={detalle} sx={{ color: 'text.secondary', display: 'block' }}>{detalle}</Typography>
                        </Box>
                    </Stack>
                );
            },
        },
        {
            field: 'text', headerName: 'Pregunta', flex: 4, minWidth: 260,
            renderCell: ({ value }) => (
                <Typography variant="body2" title={value}
                    sx={{ whiteSpace: 'normal', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {value}
                </Typography>
            ),
        },
        {
            field: 'date_created', headerName: 'Recibida', width: 130,
            valueFormatter: (value) => formatearFecha(value),
        },
        {
            field: 'espera', headerName: 'Espera', width: 85, align: 'center', headerAlign: 'center',
            valueGetter: (value, row) => antiguedad(row.date_created).minutos,
            renderCell: ({ row }) => <ChipAntiguedad fecha={row.date_created} />,
        },
        {
            field: 'cliente', headerName: 'Cliente', width: 95,
            valueGetter: (value, row) => row.from?.id ?? '',
            renderCell: ({ value }) => (value ? <Typography variant="caption">#{value}</Typography> : '—'),
        },
        {
            field: 'estado', headerName: 'Estado', width: 105,
            valueGetter: (value, row) => (!row.publicacion ? 'Sin vincular' : esInactiva(row) ? 'Inactiva' : 'Activa'),
            renderCell: ({ value }) => (
                <Chip size="small" variant={value === 'Inactiva' ? 'filled' : 'outlined'} label={value}
                    color={value === 'Activa' ? 'success' : value === 'Inactiva' ? 'error' : 'default'} sx={{ fontWeight: 600 }} />
            ),
        },
        {
            field: 'acciones', headerName: 'Acciones', width: 125, sortable: false, filterable: false, disableExport: true,
            renderCell: ({ row }) => (
                <Stack direction="row" gap={0.5} alignItems="center">
                    <Tooltip arrow title="Historial de preguntas">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); abrirHistorial(row); }}>
                            <HistoryOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip arrow title={esInactiva(row) ? 'Mercado Libre no permite responder en publicaciones pausadas o inactivas' : ''}>
                        <span>
                            <Button size="small" variant="contained" disabled={esInactiva(row)} sx={botonSx}
                                onClick={(e) => { e.stopPropagation(); setSeleccionada(row); }}>
                                {esInactiva(row) ? 'Inactiva' : 'Atender'}
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            ),
        },
        { field: 'item_id', headerName: 'MLM', width: 130 },
        { field: 'sku', headerName: 'SKU', width: 130, valueGetter: (value, row) => row.publicacion?.sku || '' },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

    const caracteresFinal = respuestaTexto.trim() ? textoFinal(respuestaTexto).length : 0;
    const totalHistorial = historialCliente?.historial ? historialCliente.historial.filter((q) => q.id !== seleccionada?.id).length : null;

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
            <GlobalStyles styles={(theme) => ({
                '.MuiDataGrid-panel': { zIndex: theme.zIndex.modal + 100 },
                '.swal2-container': { zIndex: theme.zIndex.modal + 200 },
            })} />

            {/* Encabezado */}
            <Paper elevation={2} sx={{ p: 1.5, borderRadius: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QuestionAnswerOutlinedIcon color="primary" /> Preguntas de Mercado Libre
                        <Chip size="small" label={`${total} pendientes`} sx={{ bgcolor: '#e3f2fd', color: 'primary.main', fontWeight: 700 }} />
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 4 }}>
                        Responde las dudas de tus compradores · 100 preguntas por página, de la más antigua a la más reciente
                    </Typography>
                </Box>
                <Stack direction="row" gap={1} flexWrap="wrap">
                    <Tooltip arrow title="Crear y editar plantillas de respuesta">
                        <span>
                            <Button variant="outlined" size="small" startIcon={<BoltOutlinedIcon />} sx={botonSx} onClick={() => setGestorAbierto(true)}>
                                Respuestas rápidas
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip arrow title="Recargar preguntas y respuestas rápidas">
                        <span>
                            <Button variant="outlined" size="small" startIcon={<RefreshIcon />} sx={botonSx} onClick={actualizarTodo} disabled={loading}>
                                Actualizar
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            </Paper>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 420px' }, alignItems: 'start' }}>
                {/* Listado de preguntas */}
                <SectionCard
                    icon={MarkUnreadChatAltOutlinedIcon}
                    title="Preguntas pendientes"
                    subtitle="Clic en una fila para responder · las publicaciones inactivas aparecen primero"
                    count={filtradas.length}
                    actions={
                        <>
                            <TextField size="small" placeholder="Item, título, SKU o pregunta" value={filtros.busqueda} sx={{ width: { xs: '100%', sm: 240 } }}
                                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                {[['fechaInicio', 'Desde'], ['fechaFin', 'Hasta']].map(([campo, label]) => (
                                    <DatePicker key={campo} label={label} format="YYYY/MM/DD" disableFuture
                                        value={filtros[campo] ? dayjs(filtros[campo]) : null}
                                        onChange={(v) => setFiltros((f) => ({ ...f, [campo]: v && v.isValid() ? v.format('YYYY-MM-DD') : '' }))}
                                        slotProps={{ textField: { size: 'small', sx: { width: 170 } } }} />
                                ))}
                            </LocalizationProvider>
                            <FormControlLabel
                                sx={{ mr: 0 }}
                                control={<Switch size="small" color="error" checked={filtros.ocultarInactivas}
                                    onChange={(e) => setFiltros({ ...filtros, ocultarInactivas: e.target.checked })} />}
                                label={<Typography variant="body2">Ocultar inactivas</Typography>}
                            />
                            {hayFiltros && (
                                <Button size="small" startIcon={<RestartAltIcon />} sx={botonSx} onClick={() => setFiltros(FILTROS_INICIALES)}>Limpiar</Button>
                            )}
                        </>
                    }
                >
                    <AppDataGrid
                        {...gridCompactoProps}
                        sx={gridSx}
                        height={GRID_HEIGHT}
                        pageSize={PAGE_SIZE}
                        pageSizeOptions={[PAGE_SIZE]}
                        rows={filtradas}
                        columns={columnas}
                        loading={loading}
                        exportFileName="preguntas_pendientes_ml"
                        initialColumnVisibilityModel={COLUMNAS_OCULTAS}
                        localeText={LOCALE_GRID}
                        getRowClassName={({ row }) => [row.id === seleccionada?.id && 'fila-seleccionada', esInactiva(row) && 'fila-inactiva'].filter(Boolean).join(' ')}
                        onRowClick={({ row }) => setSeleccionada(row)}
                        paginationMode="server"
                        rowCount={total}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                    />
                </SectionCard>

                {/* Panel de respuesta */}
                <SectionCard icon={ReplyOutlinedIcon} title="Responder" sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
                    {!seleccionada ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                            Selecciona una pregunta del listado para redactar la respuesta.
                        </Typography>
                    ) : (
                        <Stack gap={1.5}>
                            {/* Publicación y pregunta */}
                            <Stack direction="row" gap={1.25} alignItems="center">
                                <Avatar src={getThumbnailUrl(seleccionada.publicacion?.thumbnail) || undefined} variant="rounded" sx={{ width: 40, height: 40, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                                    <Inventory2OutlinedIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {seleccionada.publicacion?.title || seleccionada.item_id}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {seleccionada.publicacion ? `SKU ${seleccionada.publicacion.sku} · ` : ''}{seleccionada.item_id}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box sx={{ border: '1px solid #64b5f6', borderRadius: 1.5, p: 1.25, bgcolor: '#f5faff' }}>
                                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', flex: 1 }}>
                                        {formatearFecha(seleccionada.date_created)}{seleccionada.from?.id ? ` · Cliente #${seleccionada.from.id}` : ''}
                                    </Typography>
                                    <ChipAntiguedad fecha={seleccionada.date_created} />
                                </Stack>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{seleccionada.text}</Typography>
                            </Box>

                            <Button size="small" variant="outlined" startIcon={<HistoryOutlinedIcon />} sx={{ ...botonSx, alignSelf: 'flex-start' }}
                                onClick={() => abrirHistorial(seleccionada)}>
                                Historial del cliente
                                {totalHistorial != null && (
                                    <Chip size="small" label={totalHistorial} sx={{ ml: 1, height: 18, fontSize: 11, fontWeight: 700, bgcolor: totalHistorial ? '#e3f2fd' : '#f5f5f5', color: totalHistorial ? 'primary.main' : 'text.secondary' }} />
                                )}
                            </Button>

                            {seleccionadaInactiva ? (
                                <Alert severity="warning">
                                    Esta publicación está <b>pausada o inactiva</b> en Mercado Libre. No es posible responder hasta que vuelva a estar activa.
                                </Alert>
                            ) : (
                                <>
                                    {/* Respuestas rápidas: clic = llenar, avión = enviar directo */}
                                    <Box>
                                        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.75 }}>
                                            <BoltOutlinedIcon fontSize="small" color="primary" />
                                            <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>Respuestas rápidas</Typography>
                                            <Tooltip arrow title="Administrar respuestas rápidas">
                                                <IconButton size="small" onClick={() => setGestorAbierto(true)}><SettingsOutlinedIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <TextField size="small" fullWidth placeholder="Buscar plantilla..." value={buscarRapida} sx={{ mb: 1 }}
                                            onChange={(e) => setBuscarRapida(e.target.value)}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                                        <Box sx={{ maxHeight: 210, overflowY: 'auto', border: '1px solid #eee', borderRadius: 2 }}>
                                            {rapidasFiltradas.length === 0 ? (
                                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textAlign: 'center', py: 2 }}>
                                                    {respuestasRapidas.length ? 'Ninguna plantilla coincide.' : 'Aún no hay respuestas rápidas.'}
                                                </Typography>
                                            ) : rapidasFiltradas.map((r) => {
                                                const requiereDato = r.texto.includes(PLACEHOLDER);
                                                return (
                                                    <Stack key={r.id} direction="row" alignItems="center" gap={0.5}
                                                        sx={{ px: 1.25, py: 0.75, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', bgcolor: respuestaRapidaId === r.id ? '#e3f2fd' : 'transparent', '&:hover': { bgcolor: '#f5f7fa' } }}
                                                        onClick={() => usarPlantilla(r)}>
                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            <Stack direction="row" gap={0.75} alignItems="center">
                                                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.titulo}</Typography>
                                                                {r.categoria && <Chip size="small" label={r.categoria} sx={{ height: 18, fontSize: 10.5, bgcolor: '#f5f7fa' }} />}
                                                            </Stack>
                                                            <Typography variant="caption" color="text.secondary" noWrap component="div">{r.texto}</Typography>
                                                        </Box>
                                                        <Tooltip arrow title={requiereDato ? `Requiere completar ${PLACEHOLDER}: haz clic para llenarla` : 'Enviar esta respuesta directo'}>
                                                            <span>
                                                                <IconButton size="small" color="primary" disabled={requiereDato || enviando}
                                                                    onClick={(e) => { e.stopPropagation(); enviarDirecto(r); }}>
                                                                    <SendIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </Stack>
                                                );
                                            })}
                                        </Box>
                                    </Box>

                                    <TextField
                                        inputRef={respuestaRef}
                                        label="Respuesta"
                                        placeholder="Escribe o elige una respuesta rápida..."
                                        multiline minRows={5} fullWidth
                                        value={respuestaTexto}
                                        onChange={(e) => setRespuestaTexto(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) enviarRespuesta(respuestaTexto, respuestaRapidaId); }}
                                        disabled={enviando}
                                        inputProps={{ maxLength: MAX_CARACTERES }}
                                        error={caracteresFinal > MAX_CARACTERES || respuestaTexto.includes(PLACEHOLDER)}
                                        helperText={respuestaTexto.includes(PLACEHOLDER)
                                            ? `Completa el dato marcado con ${PLACEHOLDER}`
                                            : `${caracteresFinal}/${MAX_CARACTERES} caracteres · Ctrl + Enter para enviar`}
                                    />

                                    <FormControlLabel
                                        sx={{ mt: -0.5 }}
                                        control={<Switch size="small" checked={firmar} onChange={(e) => cambiarFirma(e.target.checked)} disabled={!firmaTexto} />}
                                        label={<Typography variant="body2">Firmar "Te atendió: {usuario?.nombre || '—'}"</Typography>}
                                    />
                                </>
                            )}

                            <Stack direction="row" gap={1}>
                                <Button fullWidth variant="contained" color="success" startIcon={<SendIcon />} sx={botonSx}
                                    disabled={enviando || !respuestaTexto.trim() || seleccionadaInactiva}
                                    onClick={() => enviarRespuesta(respuestaTexto, respuestaRapidaId)}>
                                    {enviando ? 'Enviando...' : 'Enviar respuesta'}
                                </Button>
                                <Button variant="outlined" color="inherit" sx={botonSx} disabled={enviando} onClick={() => setSeleccionada(null)}>
                                    Cancelar
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </SectionCard>
            </Box>

            <HistorialPreguntasDialog
                open={Boolean(historialPregunta)}
                onClose={() => setHistorialPregunta(null)}
                pregunta={historialPregunta}
                historialCliente={historialPregunta && historialPregunta.id === seleccionada?.id && !historialCliente?.error ? historialCliente : null}
            />
            <RespuestasRapidasDialog
                open={gestorAbierto}
                onClose={() => setGestorAbierto(false)}
                respuestas={respuestasRapidas}
                onCambio={cargarRespuestasRapidas}
            />
        </Box>
    );
};

export default Preguntas;
