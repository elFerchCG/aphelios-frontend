import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Alert, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
    Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Swal from 'sweetalert2';
import { API_PREGUNTAS, MAX_CARACTERES, PLACEHOLDER, authHeaders, mensajeError } from './preguntasUI';

const FORM_VACIO = { id: null, titulo: '', categoria: '', texto: '', orden: '' };
const botonSx = { borderRadius: 2, textTransform: 'none', fontWeight: 600 };

// Alta, edición y baja de las plantillas de respuesta rápida.
const RespuestasRapidasDialog = ({ open, onClose, respuestas, onCambio }) => {
    const [form, setForm] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) { setForm(FORM_VACIO); setError(null); }
    }, [open]);

    const editando = form.id != null;
    const categorias = [...new Set(respuestas.map((r) => r.categoria).filter(Boolean))].sort();
    const valido = form.titulo.trim() && form.texto.trim();

    const guardar = async () => {
        if (!valido) return;
        setGuardando(true);
        setError(null);
        const payload = {
            titulo: form.titulo.trim(),
            categoria: form.categoria?.trim() || null,
            texto: form.texto.trim(),
            orden: form.orden === '' ? (editando ? 0 : respuestas.length + 1) : Number(form.orden),
        };
        try {
            if (editando) await axios.put(`${API_PREGUNTAS}/respuestasRapidas/${form.id}`, payload, authHeaders());
            else await axios.post(`${API_PREGUNTAS}/respuestasRapidas`, payload, authHeaders());
            setForm(FORM_VACIO);
            await onCambio();
        } catch (err) {
            setError(mensajeError(err, 'No se pudo guardar la respuesta rápida.'));
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async (r) => {
        const { isConfirmed } = await Swal.fire({
            title: '¿Eliminar respuesta rápida?',
            text: `"${r.titulo}" dejará de mostrarse para todos los usuarios.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d32f2f',
        });
        if (!isConfirmed) return;
        try {
            await axios.delete(`${API_PREGUNTAS}/respuestasRapidas/${r.id}`, authHeaders());
            if (form.id === r.id) setForm(FORM_VACIO);
            await onCambio();
        } catch (err) {
            setError(mensajeError(err, 'No se pudo eliminar la respuesta rápida.'));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                <BoltOutlinedIcon color="primary" /> Respuestas rápidas
                <Chip size="small" label={respuestas.length} sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: 'primary.main', height: 22 }} />
                <Box sx={{ flex: 1 }} />
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                {/* Formulario */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, alignSelf: 'start' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                        {editando ? 'Editar respuesta' : 'Nueva respuesta'}
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
                    <Stack gap={1.5}>
                        <Stack direction="row" gap={1.5}>
                            <TextField size="small" label="Título" value={form.titulo} fullWidth
                                inputProps={{ maxLength: 80 }} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                            <TextField size="small" label="Orden" type="number" value={form.orden} sx={{ width: 100 }}
                                onChange={(e) => setForm({ ...form, orden: e.target.value })} />
                        </Stack>
                        <Autocomplete freeSolo size="small" options={categorias} value={form.categoria || ''}
                            onInputChange={(_, v) => setForm((f) => ({ ...f, categoria: v.slice(0, 40) }))}
                            renderInput={(params) => <TextField {...params} label="Categoría (motivo de la pregunta)" />} />
                        <TextField size="small" label="Texto de la respuesta" value={form.texto} multiline minRows={5} fullWidth
                            inputProps={{ maxLength: MAX_CARACTERES }} onChange={(e) => setForm({ ...form, texto: e.target.value })}
                            helperText={`${form.texto.length}/${MAX_CARACTERES} · Usa ${PLACEHOLDER} para marcar el dato a completar (ej. número de parte)`} />
                        <Stack direction="row" gap={1} justifyContent="flex-end">
                            {editando && (
                                <Button size="small" onClick={() => setForm(FORM_VACIO)} sx={botonSx}>Cancelar edición</Button>
                            )}
                            <Button size="small" variant="contained" startIcon={editando ? <EditOutlinedIcon /> : <AddIcon />}
                                disabled={!valido || guardando} onClick={guardar} sx={botonSx}>
                                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Listado */}
                <Box sx={{ maxHeight: 460, overflowY: 'auto', pr: 0.5 }}>
                    {respuestas.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>Aún no hay respuestas rápidas.</Typography>
                    ) : respuestas.map((r) => (
                        <Paper key={r.id} variant="outlined"
                            sx={{ p: 1.25, mb: 1, borderRadius: 2, borderColor: form.id === r.id ? 'primary.main' : undefined }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Typography variant="body2" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }} noWrap>{r.titulo}</Typography>
                                {r.categoria && <Chip size="small" label={r.categoria} sx={{ height: 20, fontSize: 11, bgcolor: '#f5f7fa' }} />}
                                {r.veces_usada > 0 && (
                                    <Tooltip arrow title="Veces usada"><Chip size="small" label={`${r.veces_usada}×`} sx={{ height: 20, fontSize: 11 }} /></Tooltip>
                                )}
                                <IconButton size="small" onClick={() => setForm({ id: r.id, titulo: r.titulo, categoria: r.categoria || '', texto: r.texto, orden: String(r.orden ?? '') })}>
                                    <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => eliminar(r)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                            </Stack>
                            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>{r.texto}</Typography>
                        </Paper>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={onClose} variant="outlined" size="small" sx={botonSx}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default RespuestasRapidasDialog;
