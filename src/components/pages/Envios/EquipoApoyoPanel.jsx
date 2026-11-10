import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import AppDataGrid from '../../common/AppDataGrid';
import { DATA_GRID_LOCALE_ES } from '../../../config/dataGridLocale';
import { COLOR_APOYO, esResponsableCaja, folioCaja, tomarCajaConAutorizacion } from './tomarCaja';

// ============================================================
// Equipo de apoyo: cajas APOYO-### del envío (estilo aphelios-ui-style)
// ============================================================
const GRID_HEIGHT = 520;
const GRID_PAGE_SIZE = 100;
const GRID_PAGE_SIZE_OPTIONS = [100];
const ROW_HEIGHT_ACCIONES = 64;

const botonSx = { borderRadius: 2, textTransform: 'none', fontWeight: 600 };
const botonApoyoSx = { ...botonSx, bgcolor: COLOR_APOYO, '&:hover': { bgcolor: '#4a148c' } };

const ESTATUS_CAJA = {
    abierta: { label: 'Abierta', color: 'warning' },
    cerrada: { label: 'Cerrada', color: 'success' },
};

const SectionCard = ({ icon: Icon, title, subtitle, count, actions, children }) => (
    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, minWidth: 0 }}>
        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                    <Icon sx={{ color: COLOR_APOYO }} /> {title}
                    {count != null && (
                        <Chip size="small" label={count} sx={{ fontWeight: 700, bgcolor: `${COLOR_APOYO}1A`, color: COLOR_APOYO, height: 22 }} />
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

const FolioChip = ({ caja }) => (
    <Chip
        size="small"
        label={folioCaja(caja)}
        sx={{ fontWeight: 700, bgcolor: `${COLOR_APOYO}1A`, color: COLOR_APOYO, border: `1px solid ${COLOR_APOYO}` }}
    />
);

// Botón con icono y texto debajo (mismo formato que la tabla de cajas general)
const Accion = ({ icon, texto, color, disabled, onClick, tooltip }) => (
    <Tooltip arrow title={tooltip || ''}>
        <Box display="flex" flexDirection="column" alignItems="center">
            <IconButton size="small" disabled={disabled} onClick={onClick}>
                {React.cloneElement(icon, { sx: { fontSize: '1.6rem', color: disabled ? 'action.disabled' : color } })}
            </IconButton>
            <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 'bold', lineHeight: 1.1, color: disabled ? 'text.disabled' : 'text.primary' }}>
                {texto}
            </Typography>
        </Box>
    </Tooltip>
);

const formatFecha = (valor) => {
    if (!valor) return '';
    const d = new Date(valor);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const EquipoApoyoPanel = ({ apiUrl, token, user, envioId, folioEnvio, estatusEnvio, tarimas = [], cajasApoyo = [], loading, onRecargar }) => {
    const navigate = useNavigate();
    const [filtro, setFiltro] = useState('abiertas');
    const [procesando, setProcesando] = useState(false);
    const [cajaAsignar, setCajaAsignar] = useState(null);
    const [tarimaDestino, setTarimaDestino] = useState('');

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    const envioFinalizado = estatusEnvio === 'finalizado';
    const tarimasAbiertas = tarimas.filter((t) => t.estatus === 'abierta');

    const conteos = useMemo(() => ({
        abiertas: cajasApoyo.filter((c) => c.estatus === 'abierta').length,
        sinTarima: cajasApoyo.filter((c) => c.estatus === 'cerrada' && !c.tarima_id).length,
        todas: cajasApoyo.length,
    }), [cajasApoyo]);

    const misCajasAbiertas = cajasApoyo.filter((c) => c.estatus === 'abierta' && esResponsableCaja(c, user));

    const filas = cajasApoyo.filter((c) => {
        if (filtro === 'abiertas') return c.estatus === 'abierta';
        if (filtro === 'sin_tarima') return c.estatus === 'cerrada' && !c.tarima_id;
        return true;
    });

    // ---------- Navegación ----------
    const entrarAEscanear = (caja) =>
        navigate(`/empaqueCajaAbierta/envio/${envioId}/caja/${caja.id}/visual/${folioCaja(caja)}`);
    const verRegistros = (caja) =>
        navigate(`/empaque/envio/${envioId}/caja/${caja.id}/visual/${folioCaja(caja)}`);

    const mostrarError = (error, texto) =>
        Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || texto, timer: 5000, showCloseButton: true });

    // ---------- Acciones ----------
    const abrirCajaApoyo = async () => {
        if (procesando) return;
        setProcesando(true);
        try {
            const { data } = await axios.post(`${apiUrl}/empaque/abrirCajaApoyo/${envioId}`, {}, authHeaders);
            entrarAEscanear({ id: data.id, tipo: 'apoyo', visual_id: data.visual_id, folio: data.folio });
        } catch (error) {
            mostrarError(error, 'No se pudo abrir la caja de apoyo');
        } finally {
            setProcesando(false);
        }
    };

    const reabrirCaja = async (caja) => {
        const confirmacion = await Swal.fire({
            icon: 'question',
            title: `Reabrir ${folioCaja(caja)}`,
            text: caja.tarima_id
                ? `La caja sale de la tarima #${caja.tarima_visual_id} y regresa a la zona de apoyo. Al cerrarla de nuevo eliges su tarima.`
                : 'La caja vuelve a quedar abierta para escanear.',
            showCancelButton: true,
            confirmButtonText: 'Reabrir',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });
        if (!confirmacion.isConfirmed) return;
        setProcesando(true);
        try {
            await axios.post(`${apiUrl}/empaque/revertirCaja/caja/${caja.id}`, {});
            await onRecargar();
        } catch (error) {
            mostrarError(error, 'No se pudo reabrir la caja');
        } finally {
            setProcesando(false);
        }
    };

    const tomarCaja = async (caja) => {
        const respuesta = await tomarCajaConAutorizacion({ apiUrl, token, user, caja });
        if (respuesta) {
            await onRecargar();
            entrarAEscanear(caja);
        }
    };

    const abrirAsignar = (caja) => {
        setCajaAsignar(caja);
        setTarimaDestino(tarimasAbiertas.length === 1 ? tarimasAbiertas[0].id : '');
    };

    const confirmarAsignar = async () => {
        if (!cajaAsignar || !tarimaDestino || procesando) return;
        setProcesando(true);
        try {
            const { data } = await axios.put(
                `${apiUrl}/empaque/cajasApoyo/${cajaAsignar.id}/tarima`,
                { tarima_id: Number(tarimaDestino) },
                authHeaders
            );
            setCajaAsignar(null);
            await onRecargar();
            Swal.fire({ icon: 'success', title: 'Caja asignada', text: data.message, timer: 2000, showConfirmButton: false });
        } catch (error) {
            mostrarError(error, 'No se pudo asignar la tarima');
        } finally {
            setProcesando(false);
        }
    };

    // ---------- Tabla ----------
    const columnas = [
        {
            field: 'folio',
            headerName: 'Folio',
            flex: 0.7,
            minWidth: 120,
            renderCell: ({ row }) => <FolioChip caja={row} />,
        },
        {
            field: 'nombre_responsable',
            headerName: 'Responsable',
            flex: 1,
            minWidth: 150,
            renderCell: ({ row }) => (
                <Stack direction="row" gap={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 'inherit' }} title={row.nombre_responsable || ''}>
                        {row.nombre_responsable || '—'}
                    </Typography>
                    {row.estatus === 'abierta' && esResponsableCaja(row, user) && (
                        <Chip size="small" label="Tú" color="success" sx={{ fontWeight: 700, height: 20 }} />
                    )}
                </Stack>
            ),
        },
        { field: 'total_cantidad', headerName: 'Piezas', type: 'number', flex: 0.4, minWidth: 70, headerAlign: 'center', align: 'center' },
        {
            field: 'estatus',
            headerName: 'Estatus',
            flex: 0.5,
            minWidth: 95,
            renderCell: ({ value }) => {
                const info = ESTATUS_CAJA[value] || { label: value || '—', color: 'default' };
                return <Chip size="small" label={info.label} color={info.color} sx={{ fontWeight: 600 }} />;
            },
        },
        {
            field: 'tarima_visual_id',
            headerName: 'Tarima',
            flex: 0.6,
            minWidth: 110,
            valueGetter: (value, row) => (row?.tarima_id ? `Tarima #${value}` : 'Sin tarima'),
            renderCell: ({ row }) => row.tarima_id
                ? <Chip size="small" variant="outlined" label={`Tarima #${row.tarima_visual_id}`} sx={{ fontWeight: 600 }} />
                : row.estatus === 'cerrada'
                    ? <Chip size="small" color="warning" variant="outlined" label="Sin tarima" sx={{ fontWeight: 600 }} />
                    : <Typography variant="caption" sx={{ color: 'text.secondary' }}>Al cerrar</Typography>,
        },
        {
            field: 'fecha_recepcion',
            headerName: 'Apertura',
            flex: 0.6,
            minWidth: 100,
            valueFormatter: (value) => formatFecha(value),
        },
        {
            field: 'acciones',
            headerName: 'Acciones',
            flex: 1.6,
            minWidth: 320,
            sortable: false,
            filterable: false,
            disableExport: true,
            headerAlign: 'center',
            align: 'center',
            renderCell: ({ row: caja }) => {
                const abierta = caja.estatus === 'abierta';
                const esMia = esResponsableCaja(caja, user);
                const tarimaCerrada = caja.tarima_id && caja.tarima_estatus === 'cerrada';
                const bloqueado = procesando || envioFinalizado;
                return (
                    <Stack direction="row" gap={0.5} justifyContent="center" sx={{ width: '100%' }}>
                        <Accion icon={<ListAltIcon />} texto="Registros" color="primary.main" disabled={abierta} onClick={() => verRegistros(caja)} />
                        <Accion
                            icon={<AutorenewIcon />}
                            texto="Reabrir"
                            color="#ed6c02"
                            disabled={abierta || tarimaCerrada || bloqueado}
                            tooltip={tarimaCerrada ? `Está en la tarima #${caja.tarima_visual_id}, que ya está cerrada` : ''}
                            onClick={() => reabrirCaja(caja)}
                        />
                        <Accion
                            icon={<QrCodeScannerIcon />}
                            texto="Escanear"
                            color={COLOR_APOYO}
                            disabled={!abierta || !esMia || bloqueado}
                            tooltip={abierta && !esMia ? `A cargo de ${caja.nombre_responsable || 'otra persona'}` : ''}
                            onClick={() => entrarAEscanear(caja)}
                        />
                        <Accion
                            icon={<PanToolOutlinedIcon />}
                            texto="Tomar"
                            color="#ed6c02"
                            disabled={!abierta || esMia || bloqueado}
                            onClick={() => tomarCaja(caja)}
                        />
                        <Accion
                            icon={<LayersOutlinedIcon />}
                            texto={caja.tarima_id ? 'Cambiar' : 'Asignar'}
                            color="#2e7d32"
                            disabled={abierta || tarimaCerrada || bloqueado}
                            tooltip={abierta ? 'Cierra la caja para asignarla a una tarima' : ''}
                            onClick={() => abrirAsignar(caja)}
                        />
                    </Stack>
                );
            },
        },
    ];

    const mensajeVacio = {
        abiertas: 'No hay cajas de apoyo abiertas.',
        sin_tarima: 'Todas las cajas de apoyo cerradas ya tienen tarima.',
        todas: 'Este envío aún no tiene cajas de apoyo.',
    }[filtro];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* ---------- Encabezado del equipo ---------- */}
            <Paper
                elevation={2}
                sx={{
                    p: 1.5,
                    borderRadius: 3,
                    borderLeft: `6px solid ${COLOR_APOYO}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                        <GroupsOutlinedIcon sx={{ color: COLOR_APOYO }} /> Equipo de apoyo
                        <Chip size="small" label={`Envío ${folioEnvio || envioId}`} variant="outlined" sx={{ fontWeight: 600 }} />
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 4 }}>
                        Cajas APOYO-### de este envío. Se escanean igual que las normales; al cerrarlas eliges su tarima.
                    </Typography>
                </Box>
                <Tooltip arrow title={envioFinalizado ? 'El envío ya está finalizado' : 'Abre una caja nueva a tu cargo y entra a escanear'}>
                    <span>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddBoxOutlinedIcon />}
                            onClick={abrirCajaApoyo}
                            disabled={procesando || envioFinalizado}
                            sx={botonApoyoSx}
                        >
                            {procesando ? 'Abriendo...' : 'Abrir caja de apoyo'}
                        </Button>
                    </span>
                </Tooltip>
            </Paper>

            {/* ---------- Mis cajas abiertas ---------- */}
            <SectionCard
                icon={PersonOutlineOutlinedIcon}
                title="Mis cajas abiertas"
                count={misCajasAbiertas.length}
                subtitle="Acceso directo a las cajas de apoyo que tienes a tu cargo."
            >
                {misCajasAbiertas.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                        No tienes cajas de apoyo abiertas. Usa <b>Abrir caja de apoyo</b> para empezar.
                    </Typography>
                ) : (
                    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                        {misCajasAbiertas.map((caja) => (
                            <Paper
                                key={caja.id}
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 2, borderColor: `${COLOR_APOYO}66`, display: 'flex', flexDirection: 'column', gap: 1 }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography sx={{ fontWeight: 800, color: COLOR_APOYO, letterSpacing: 0.5 }}>{folioCaja(caja)}</Typography>
                                    <Chip size="small" label={`${caja.total_cantidad} pza(s)`} sx={{ fontWeight: 600 }} />
                                </Stack>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Abierta el {formatFecha(caja.fecha_recepcion) || '—'}
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<QrCodeScannerIcon />}
                                    onClick={() => entrarAEscanear(caja)}
                                    disabled={envioFinalizado}
                                    sx={botonApoyoSx}
                                >
                                    Continuar escaneando
                                </Button>
                            </Paper>
                        ))}
                    </Box>
                )}
            </SectionCard>

            {/* ---------- Todas las cajas de apoyo ---------- */}
            <SectionCard
                icon={ViewInArOutlinedIcon}
                title="Cajas de apoyo del envío"
                count={filas.length}
                subtitle={conteos.sinTarima > 0
                    ? `${conteos.sinTarima} caja(s) cerrada(s) sin tarima: asígnalas antes de cerrar el envío.`
                    : 'Las cajas cerradas se asignan a una tarima abierta del envío.'}
                actions={
                    <ToggleButtonGroup size="small" exclusive value={filtro} onChange={(e, v) => v && setFiltro(v)}>
                        <ToggleButton value="abiertas" sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}>Abiertas · {conteos.abiertas}</ToggleButton>
                        <ToggleButton value="sin_tarima" sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}>Sin tarima · {conteos.sinTarima}</ToggleButton>
                        <ToggleButton value="todas" sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}>Todas · {conteos.todas}</ToggleButton>
                    </ToggleButtonGroup>
                }
            >
                <AppDataGrid
                    rows={filas}
                    columns={columnas}
                    getRowId={(row) => row.id}
                    loading={loading}
                    height={GRID_HEIGHT}
                    rowHeight={ROW_HEIGHT_ACCIONES}
                    pageSize={GRID_PAGE_SIZE}
                    pageSizeOptions={GRID_PAGE_SIZE_OPTIONS}
                    exportFileName={`envio_${folioEnvio || envioId}_cajas_apoyo`}
                    localeText={{ ...DATA_GRID_LOCALE_ES, noRowsLabel: mensajeVacio }}
                />
            </SectionCard>

            {/* ---------- Asignar tarima ---------- */}
            <Dialog open={!!cajaAsignar} onClose={procesando ? undefined : () => setCajaAsignar(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                    <LayersOutlinedIcon sx={{ color: COLOR_APOYO }} /> Asignar {cajaAsignar ? folioCaja(cajaAsignar) : ''} a tarima
                </DialogTitle>
                <DialogContent dividers>
                    {tarimasAbiertas.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No hay tarimas abiertas en este envío. Abre una en la pestaña <b>Escaneo general</b> y vuelve a intentarlo.
                        </Typography>
                    ) : (
                        <FormControl fullWidth size="small">
                            <InputLabel id="tarima-destino-label">Tarima destino</InputLabel>
                            <Select
                                labelId="tarima-destino-label"
                                label="Tarima destino"
                                value={tarimaDestino}
                                onChange={(e) => setTarimaDestino(e.target.value)}
                            >
                                {tarimasAbiertas.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>Tarima #{t.visual_id}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setCajaAsignar(null)} disabled={procesando} sx={botonSx}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmarAsignar} disabled={!tarimaDestino || procesando} sx={botonApoyoSx}>
                        {procesando ? 'Asignando...' : 'Asignar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EquipoApoyoPanel;
