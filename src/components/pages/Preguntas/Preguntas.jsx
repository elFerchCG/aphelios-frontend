import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TableHead,
    TextField,
    Button,
    Pagination,
    Box,
    CircularProgress,
    Alert,
    Divider,
    Avatar,
    Chip,
    Tooltip,
    Link,
    Grid,
    FormControlLabel,
    Switch
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Swal from 'sweetalert2';

const Preguntas = () => {
    const [preguntas, setPreguntas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    // Estados para la acción de responder
    const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);
    const [respuestaTexto, setRespuestaTexto] = useState('');
    const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

    // Estados para los filtros locales
    const [busqueda, setBusqueda] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [ocultarInactivas, setOcultarInactivas] = useState(false);

    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('token'));
            setUser(JSON.parse(localStorage.getItem('user')));
        };

        // Añadir un listener para el evento `storage`
        window.addEventListener('storage', handleStorageChange);

        // Limpieza al desmontar el componente
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    // 1. Cargar preguntas desde el Backend
    // const cargarPreguntas = async (paginaActual) => {
    //     setLoading(true);
    //     setError(null);
    //     try {
    //         // Ajusta la URL según la ruta de tu servidor
    //         const res = await axios.get(`${apiUrl}/preguntas/obtenerPreguntas?page=${paginaActual}`);
    //         const data = res.data;

    //         setPreguntas(data.preguntas || []);
    //         // Calcular el total de páginas basándonos en el límite de 100
    //         const totalRegistros = data.meta?.total_registros || 0;
    //         setTotalPages(Math.ceil(totalRegistros / 100) || 1);
    //     } catch (err) {
    //         // 1. Capturar errores con respuesta del servidor (ej: 400, 403, 500)
    //         if (err.response) {
    //             // Guardamos el error específico que configuraste en tu backend (data.error)
    //             setError(err.response.data?.error || 'Error al obtener las preguntas desde el servidor');
    //         }
    //         // 2. Capturar errores de red (cuando el servidor está apagado o no responde)
    //         else if (err.request) {
    //             setError('No se recibió respuesta del servidor local. Revisa tu conexión.');
    //         }
    //         // 3. Cualquier otro error inesperado
    //         else {
    //             setError('Ocurrió un error inesperado al procesar la solicitud.');
    //         }
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // Escuchar cambios de página
    // useEffect(() => {
    //     cargarPreguntas(page);
    //     setPreguntaSeleccionada(null); // Limpiar selección al cambiar de página
    //     setRespuestaTexto('');
    // }, [page]);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    // 2. Enviar la respuesta al Backend
    const handleEnviarRespuesta = async (e) => {
        e.preventDefault();
        if (!respuestaTexto.trim() || !preguntaSeleccionada) return;

        setEnviandoRespuesta(true);
        try {
            const response = await axios.post(`${apiUrl}/preguntas/responder`, {
                question_id: preguntaSeleccionada.id,
                text: respuestaTexto
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;

            if (data.ok) {
                // Optimización visual: Remover la pregunta respondida del estado local
                // para evitar recargar las 100 preguntas de nuevo de la API
                setPreguntas(preguntas.filter(q => q.id !== preguntaSeleccionada.id));
                setPreguntaSeleccionada(null);
                setRespuestaTexto('');
                // Alerta de Éxito
                Swal.fire({
                    title: '¡Respondida!',
                    text: 'La respuesta se publicó correctamente en Mercado Libre.',
                    icon: 'success',
                    timer: 2500,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            const mensajeError = err.response?.data?.error || 'No se pudo conectar con el servidor backend.';
            Swal.fire({
                title: 'Error de conexión',
                text: mensajeError,
                icon: 'error'
            });
        } finally {
            setEnviandoRespuesta(false);
        }
    };

    const preguntasFiltradasYOrdenadas = preguntas
        .filter((pregunta) => {
            // 1. Filtro del Buscador (Busca en ID de ítem, texto de pregunta, título de publicación o SKU)
            const termino = busqueda.toLowerCase().trim();
            const cumpleBusqueda = !termino ||
                pregunta.item_id.toLowerCase().includes(termino) ||
                pregunta.text.toLowerCase().includes(termino) ||
                (pregunta.publicacion?.title && pregunta.publicacion.title.toLowerCase().includes(termino)) ||
                (pregunta.publicacion?.sku && pregunta.publicacion.sku.toLowerCase().includes(termino));

            // 2. Filtro de Ocultar Inactivas
            const estaInactiva = pregunta.publicacion && pregunta.publicacion.status !== 'active';
            const cumpleInactivas = ocultarInactivas ? !estaInactiva : true;

            // 3. Filtro de Rango de Fechas (Compara contra la fecha de creación de la pregunta)
            const fechaPregunta = new Date(pregunta.date_created);

            let cumpleFechaInicio = true;
            if (fechaInicio) {
                // Rompemos el string "2026-06-28" en partes [2026, 06, 28]
                const [anio, mes, dia] = fechaInicio.split('-').map(Number);
                // Forzamos a JavaScript a crearlo en Hora Local (el mes va de 0 a 11)
                const inicio = new Date(anio, mes - 1, dia, 0, 0, 0, 0);

                cumpleFechaInicio = fechaPregunta >= inicio;
            }

            let cumpleFechaFin = true;
            if (fechaFin) {
                // Rompemos el string "2026-06-30" en partes [2026, 06, 30]
                const [anio, mes, dia] = fechaFin.split('-').map(Number);
                // Forzamos a las 23:59:59:999 del día local
                const fin = new Date(anio, mes - 1, dia, 23, 59, 59, 999);

                cumpleFechaFin = fechaPregunta <= fin;
            }

            return cumpleBusqueda && cumpleInactivas && cumpleFechaInicio && cumpleFechaFin;
        })
        .sort((a, b) => {
            // 4. Ordenamiento por defecto: Inactivas primero
            const aInactiva = a.publicacion && a.publicacion.status !== 'active' ? 1 : 0;
            const bInactiva = b.publicacion && b.publicacion.status !== 'active' ? 1 : 0;

            // Coloca las inactivas arriba (1 viene antes que 0 si ordenamos descendente)
            return bInactiva - aInactiva;
        });

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                Moderador de Preguntas (Mercado Libre)
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Responde las dudas pendientes de tus compradores. Cada página muestra hasta 100 preguntas.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* ================= BARRA DE FILTROS AÑADIDA ================= */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#fff' }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Buscador Global */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Buscar por Item, Título, SKU o Pregunta..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Ej: MLM123456..."
                        />
                    </Grid>

                    {/* Fecha Inicio */}
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Fecha Inicio"
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {/* Fecha Fin */}
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Fecha Fin"
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {/* Switch de Inactivas */}
                    <Grid item xs={12} sm={3}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={ocultarInactivas}
                                    onChange={(e) => setOcultarInactivas(e.target.checked)}
                                    color="error"
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    Ocultar publicaciones inactivas
                                </Typography>
                            }
                        />
                    </Grid>

                    {/* Botón de limpiar filtros rápidos */}
                    {(busqueda || fechaInicio || fechaFin || ocultarInactivas) && (
                        <Grid item xs={12} sm={1} sx={{ textAlign: 'right' }}>
                            <Button
                                variant="text"
                                color="secondary"
                                size="small"
                                onClick={() => {
                                    setBusqueda('');
                                    setFechaInicio('');
                                    setFechaFin('');
                                    setOcultarInactivas(false);
                                }}
                            >
                                Limpiar
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </Paper>
            {/* ============================================================ */}

            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>

                {/* PANEL IZQUIERDO: Tabla de Preguntas */}
                <Box sx={{ flex: 2 }}>
                    <TableContainer component={Paper} variant="outlined">
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Table>
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Artículo / Publicación</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Pregunta Pendiente</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Acción</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* CAMBIO AQUÍ: Ahora mapeamos sobre las preguntas filtradas */}
                                    {preguntasFiltradasYOrdenadas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                Ninguna pregunta coincide con los filtros aplicados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        preguntasFiltradasYOrdenadas.map((pregunta) => {
                                            const estaInactiva = pregunta.publicacion && pregunta.publicacion.status !== 'active';

                                            return (
                                                <TableRow
                                                    key={pregunta.id}
                                                    hover
                                                    selected={preguntaSeleccionada?.id === pregunta.id}
                                                    sx={{
                                                        opacity: estaInactiva ? 0.75 : 1,
                                                        backgroundColor: estaInactiva ? '#f9f9f9' : 'inherit',
                                                        borderLeft: estaInactiva ? '4px solid #d32f2f' : 'none' // Línea roja sutil para distinguir inactivos rápido
                                                    }}
                                                >
                                                    {/* Celda del Artículo Enriquecida */}
                                                    <TableCell sx={{ minWidth: 260, maxWidth: 320 }}>
                                                        {pregunta.publicacion ? (
                                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                                {pregunta.publicacion.permalink ? (
                                                                    <Tooltip title="Ver publicación en Mercado Libre" placement="top" arrow>
                                                                        <Box
                                                                            component="a"
                                                                            href={pregunta.publicacion.permalink}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            sx={{
                                                                                display: 'inline-flex',
                                                                                transition: 'transform 0.2s',
                                                                                '&:hover': { transform: 'scale(1.05)' }
                                                                            }}
                                                                        >
                                                                            <Avatar
                                                                                src={pregunta.publicacion.thumbnail}
                                                                                alt={pregunta.publicacion.title}
                                                                                variant="rounded"
                                                                                sx={{ width: 48, height: 48, border: '1px solid #e0e0e0', cursor: 'pointer' }}
                                                                            />
                                                                        </Box>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Avatar
                                                                        src={pregunta.publicacion.thumbnail}
                                                                        alt={pregunta.publicacion.title}
                                                                        variant="rounded"
                                                                        sx={{ width: 48, height: 48, border: '1px solid #e0e0e0' }}
                                                                    />
                                                                )}

                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {pregunta.publicacion.title}
                                                                    </Typography>
                                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                                        SKU: <b>{pregunta.publicacion.sku}</b>
                                                                    </Typography>
                                                                    {pregunta.publicacion.permalink ? (
                                                                        <Link
                                                                            href={pregunta.publicacion.permalink}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            variant="caption"
                                                                            underline="hover"
                                                                            sx={{ fontWeight: 'medium', cursor: 'pointer', display: 'inline-block' }}
                                                                        >
                                                                            {pregunta.item_id}
                                                                        </Link>
                                                                    ) : (
                                                                        <Typography variant="caption" color="primary" sx={{ fontSize: '0.75rem' }}>
                                                                            {pregunta.item_id}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {pregunta.item_id} <br />
                                                                <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(No vinculada localmente)</span>
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Celda del Texto de Pregunta */}
                                                    <TableCell>
                                                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{pregunta.text}</Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Recibida: {new Date(pregunta.date_created).toLocaleString()}
                                                            </Typography>
                                                            {estaInactiva && (
                                                                <Chip
                                                                    label={`Inactiva (${pregunta.publicacion.status})`}
                                                                    color="error"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 'bold' }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </TableCell>

                                                    {/* Celda de Acción */}
                                                    <TableCell align="right">
                                                        {estaInactiva ? (
                                                            <Tooltip title="No puedes responder hasta que actives la publicación en Mercado Libre" placement="top" arrow>
                                                                <span>
                                                                    <Button variant="contained" size="small" disabled>
                                                                        Inactiva
                                                                    </Button>
                                                                </span>
                                                            </Tooltip>
                                                        ) : (
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                onClick={() => {
                                                                    setPreguntaSeleccionada(pregunta);
                                                                    setRespuestaTexto('');
                                                                }}
                                                            >
                                                                Atender
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </TableContainer>

                    {/* Paginador */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            shape="rounded"
                            disabled={loading}
                        />
                    </Box>
                </Box>

                {/* PANEL DERECHO: Formulario de Respuesta Dinámico */}
                <Box sx={{ flex: 1, minWidth: { md: '350px' } }}>
                    {/* ... Se mantiene idéntico a tu bloque derecho anterior ... */}
                    <Paper variant="outlined" sx={{ p: 3, backgroundColor: '#fafafa', position: 'sticky', top: 20 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Responder Pregunta</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {preguntaSeleccionada ? (
                            (() => {
                                const seleccionadaInactiva = preguntaSeleccionada.publicacion && preguntaSeleccionada.publicacion.status !== 'active';
                                return (
                                    <Box component="form" onSubmit={handleEnviarRespuesta}>
                                        {preguntaSeleccionada.publicacion && (
                                            <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                                                <Avatar src={preguntaSeleccionada.publicacion.thumbnail} variant="rounded" sx={{ width: 32, height: 32 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {preguntaSeleccionada.publicacion.title}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>ITEM ASOCIADO: {preguntaSeleccionada.item_id}</Typography>
                                        <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', color: '#333' }}>"{preguntaSeleccionada.text}"</Typography>

                                        {seleccionadaInactiva ? (
                                            <Alert severity="warning" sx={{ mb: 2, fontSize: '0.85rem' }}>
                                                Esta publicación se encuentra en estado <b>{preguntaSeleccionada.publicacion.status}</b>. Actívala en Mercado Libre para habilitar las respuestas.
                                            </Alert>
                                        ) : (
                                            <TextField
                                                label="Escribe tu respuesta oficial..."
                                                multiline rows={4} fullWidth variant="outlined"
                                                value={respuestaTexto} onChange={(e) => setRespuestaTexto(e.target.value)}
                                                disabled={enviandoRespuesta} inputProps={{ maxLength: 2000 }}
                                                helperText={`${respuestaTexto.length}/2000 caracteres`} required
                                                sx={{ backgroundColor: '#fff', mb: 2 }}
                                            />
                                        )}
                                        <Button type="submit" variant="contained" color="success" fullWidth disabled={enviandoRespuesta || !respuestaTexto.trim() || seleccionadaInactiva}>
                                            {enviandoRespuesta ? 'Enviando...' : 'Enviar Respuesta'}
                                        </Button>
                                        <Button variant="text" color="error" fullWidth sx={{ mt: 1 }} onClick={() => setPreguntaSeleccionada(null)} disabled={enviandoRespuesta}>Cancelar</Button>
                                    </Box>
                                );
                            })()
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                                <Typography variant="body2">Selecciona una pregunta de la lista de la izquierda para redactar una respuesta.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>

            </Box>
        </Container>
    );
}

export default Preguntas