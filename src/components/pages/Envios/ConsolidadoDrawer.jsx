import {
    Drawer,
    Box,
    Typography,
    CircularProgress,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
    Chip,
    ToggleButton,
    Tooltip,
    Pagination
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SortIcon from "@mui/icons-material/Sort";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import ProductoRow from "./ProductoRow";
import { palette, tono } from "./consolidadoPalette";
import { obtenerEstadoProducto, ESTADOS_PRODUCTO, ORDEN_ESTATUS_PRODUCTO } from "./estadoProducto";

export default function ConsolidadoDrawer({

    open,
    onClose,
    envioId,
    proforma

}) {

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtroEstatus, setFiltroEstatus] = useState([]);
    const [ordenarPorUrgencia, setOrdenarPorUrgencia] = useState(true);
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(25);

    useEffect(() => {

        if (!open || !proforma) return;

        cargar();

    }, [open, proforma]);

    const cargar = async () => {

        setLoading(true);

        try {

            const { data } = await axios.get(

                `${apiUrl}/empaque/proformas/${proforma.proforma_id}/envios/${envioId}/consolidado`

            );

            setProductos(data.data);
            setPagina(1);

        } catch (err) {

            console.error(err);

        }

        setLoading(false);

    };

    // Cada producto trae ya resuelto su _estado (mismo cálculo que usa
    // ProductoRow) para poder filtrar/ordenar/contar en el drawer sin
    // duplicar la lógica de obtenerEstadoProducto.
    const productosConEstado = useMemo(
        () => productos.map((producto) => ({
            ...producto,
            _estado: obtenerEstadoProducto(producto)
        })),
        [productos]
    );

    const conteoPorEstatus = useMemo(() => {
        const mapa = {};
        productosConEstado.forEach((producto) => {
            const status = producto._estado.status;
            mapa[status] = (mapa[status] || 0) + 1;
        });
        return mapa;
    }, [productosConEstado]);

    const productosFiltrados = useMemo(() => {
        let lista = filtroEstatus.length === 0
            ? productosConEstado
            : productosConEstado.filter((producto) => filtroEstatus.includes(producto._estado.status));

        if (ordenarPorUrgencia) {
            lista = [...lista].sort(
                (a, b) =>
                    ORDEN_ESTATUS_PRODUCTO.indexOf(a._estado.status) -
                    ORDEN_ESTATUS_PRODUCTO.indexOf(b._estado.status)
            );
        }

        return lista;
    }, [productosConEstado, filtroEstatus, ordenarPorUrgencia]);

    const handleChangeFiltroEstatus = (event) => {
        const { value } = event.target;
        setFiltroEstatus(typeof value === "string" ? value.split(",") : value);
        setPagina(1);
    };

    const handleChangePorPagina = (event) => {
        setPorPagina(Number(event.target.value));
        setPagina(1);
    };

    // Si el filtro/orden deja menos páginas de las que había (por ejemplo
    // se estaba en la página 4 y el nuevo filtro solo da 2), regresamos a
    // la última página válida en vez de mostrar una página vacía.
    const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / porPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    const productosPagina = useMemo(() => {
        const inicio = (pagina - 1) * porPagina;
        return productosFiltrados.slice(inicio, inicio + porPagina);
    }, [productosFiltrados, pagina, porPagina]);

    const rangoInicio = productosFiltrados.length === 0 ? 0 : (pagina - 1) * porPagina + 1;
    const rangoFin = Math.min(pagina * porPagina, productosFiltrados.length);

    return (

        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: "95%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: palette.surfaceMuted
                }
            }}
        >

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0
                }}
            >

                {/* HEADER */}

                <Box
                    sx={{
                        px: 3,
                        py: 1.5,
                        borderBottom: `1px solid ${palette.border}`,
                        bgcolor: palette.surface,
                        flexShrink: 0
                    }}
                >

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            Consolidado de Producción
                        </Typography>

                        <IconButton

                            onClick={onClose}

                        >

                            <CloseIcon />

                        </IconButton>
                    </Box>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >

                        Proforma #{proforma?.proforma_id} • Envío #{envioId}

                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1.5,
                            mt: 1.5
                        }}
                    >

                        <FormControl size="small" sx={{ minWidth: 260 }}>
                            <InputLabel id="filtro-estatus-consolidado-label">
                                Filtrar por estatus
                            </InputLabel>
                            <Select
                                labelId="filtro-estatus-consolidado-label"
                                multiple
                                value={filtroEstatus}
                                onChange={handleChangeFiltroEstatus}
                                input={<OutlinedInput label="Filtrar por estatus" />}
                                renderValue={(selected) => (
                                    selected.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Todos los estatus
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const estatusInfo = ESTADOS_PRODUCTO.find((e) => e.value === value);
                                                return (
                                                    <Chip
                                                        key={value}
                                                        size="small"
                                                        label={estatusInfo?.label || value}
                                                        sx={{
                                                            bgcolor: tono(estatusInfo?.tone).bg,
                                                            color: tono(estatusInfo?.tone).text,
                                                            border: `1px solid ${tono(estatusInfo?.tone).border}`,
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )
                                )}
                            >
                                {ESTADOS_PRODUCTO.map((estatusInfo) => (
                                    <MenuItem key={estatusInfo.value} value={estatusInfo.value}>
                                        <Checkbox checked={filtroEstatus.indexOf(estatusInfo.value) > -1} />
                                        <ListItemText
                                            primary={estatusInfo.label}
                                            secondary={`${conteoPorEstatus[estatusInfo.value] || 0} producto(s)`}
                                        />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Tooltip title="Ordena la lista mostrando primero lo más urgente (pendiente por surtir) y al final lo ya empacado">
                            <ToggleButton
                                size="small"
                                value="ordenar"
                                selected={ordenarPorUrgencia}
                                onChange={() => {
                                    setOrdenarPorUrgencia((prev) => !prev);
                                    setPagina(1);
                                }}
                                sx={{ textTransform: "none", gap: 0.5 }}
                            >
                                <SortIcon fontSize="small" />
                                Ordenar por urgencia
                            </ToggleButton>
                        </Tooltip>

                        <FormControl size="small" sx={{ minWidth: 130 }}>
                            <InputLabel id="por-pagina-consolidado-label">
                                Por página
                            </InputLabel>
                            <Select
                                labelId="por-pagina-consolidado-label"
                                label="Por página"
                                value={porPagina}
                                onChange={handleChangePorPagina}
                            >
                                <MenuItem value={25}>25 por página</MenuItem>
                                <MenuItem value={50}>50 por página</MenuItem>
                            </Select>
                        </FormControl>

                        <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                            Mostrando {rangoInicio}–{rangoFin} de {productosFiltrados.length}
                            {productosFiltrados.length !== productos.length && ` (filtrado de ${productos.length})`}
                        </Typography>

                    </Box>

                </Box>


                {/* CONTENIDO */}

                <Box
                    sx={{
                        flex: 1,
                        overflow: "auto",
                        minHeight: 0,
                        p: 2
                    }}
                >

                    {

                        loading ?

                            <Box
                                display="flex"
                                justifyContent="center"
                                mt={5}
                            >

                                <CircularProgress />

                            </Box>

                            : productosFiltrados.length === 0 ?

                            <Box
                                display="flex"
                                justifyContent="center"
                                mt={5}
                            >

                                <Typography variant="body2" color="text.secondary">
                                    No hay productos con el estatus seleccionado.
                                </Typography>

                            </Box>

                            :

                            productosPagina.map((producto) => (

                                <ProductoRow
                                    key={producto.producto_id}
                                    producto={producto}
                                />

                            ))

                    }

                </Box>

                {

                    !loading && totalPaginas > 1 && (

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                py: 1.5,
                                borderTop: `1px solid ${palette.border}`,
                                bgcolor: palette.surface,
                                flexShrink: 0
                            }}
                        >

                            <Pagination
                                count={totalPaginas}
                                page={pagina}
                                onChange={(event, value) => setPagina(value)}
                                color="primary"
                                size="small"
                            />

                        </Box>

                    )

                }

            </Box>

        </Drawer>

    );

}