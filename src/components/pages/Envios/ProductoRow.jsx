import { useState } from "react";

import {
    Box,
    Chip,
    Collapse,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Tooltip from "@mui/material/Tooltip";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import ComponenteRow from "./ComponenteRow";
import { palette, tono } from "./consolidadoPalette";

// Tile de métrica (Producir / Enviar / Empacado / Pendiente). Ancho
// flexible con un mínimo razonable en vez de un width fijo — así, en el
// grupo con flexWrap más abajo, se van acomodando en varias líneas en
// lugar de encimarse o desaparecer cuando el navegador está con zoom alto.
const StatTile = ({ label, value, tone: toneName }) => {

    const c = tono(toneName);

    return (

        <Box
            sx={{
                minWidth: 84,
                flex: "0 0 auto",
                px: 1.5,
                py: 0.75,
                textAlign: "center",
                bgcolor: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 2
            }}
        >

            <Typography
                sx={{
                    color: c.text,
                    fontWeight: 700,
                    fontSize: 20,
                    lineHeight: 1.15
                }}
            >

                {value}

            </Typography>

            <Typography
                variant="caption"
                sx={{
                    color: palette.textSecondary,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    display: "block"
                }}
            >

                {label}

            </Typography>

        </Box>

    );

};

const ESTADO_ICONO = {

    success: <CheckCircleIcon sx={{ fontSize: 15 }} />,
    warning: <WarningAmberIcon sx={{ fontSize: 15 }} />,
    info: <InfoOutlinedIcon sx={{ fontSize: 15 }} />

};

export default function ProductoRow({ producto }) {

    const [open, setOpen] = useState(false);

    const obtenerEstadoProducto = (item) => {
        const { cantidad_a_enviar, cantidad_empacada, componentes = [] } = item;

        const cantEnviar = Number(cantidad_a_enviar || 0);
        const cantEmpacada = Number(cantidad_empacada || 0);

        // Evaluamos si falta surtir algún componente
        const tieneComponentesPendientes = componentes.some((comp) => {
            const cantFacturada = Number(comp.componente_cantidad_facturada || 0);
            const cantContada = Number(comp.cantidad_contada || 0);
            const pendiente = Number(comp.pendiente || 0);

            return pendiente > 0 || cantContada < cantFacturada;
        });

        // 1. Si faltan piezas por surtirse
        if (tieneComponentesPendientes) {
            if (cantEnviar === 0) {
                return {
                    status: 'SIN_ENVIO_PENDIENTE_SURTIR',
                    resaltar: true,
                    label: 'Sin Envío | Pendiente por Surtir',
                    tone: 'warning'
                };
            }
            return {
                status: 'PENDIENTE_SURTIR',
                resaltar: true,
                label: 'Pendiente por Surtir',
                tone: 'warning'
            };
        }

        // 2. Si ya está 100% surtido pero NO requiere empaque/envío
        if (cantEnviar === 0) {
            return {
                status: 'SIN_ENVIO_COMPLETO',
                resaltar: false,
                label: 'Sin Envío | Surtido Completo',
                tone: 'success'
            };
        }

        // 3. Si requiere envío y está 100% surtido, evaluamos empaque
        const estaEmpacado = cantEmpacada >= cantEnviar;

        if (estaEmpacado) {
            return {
                status: 'EMPACADO',
                resaltar: false,
                label: 'Empacado',
                tone: 'success'
            };
        }

        return {
            status: 'PENDIENTE_EMPACAR',
            resaltar: true,
            label: 'Pendiente por Empacar',
            tone: 'info'
        };
    };

    const estado = obtenerEstadoProducto(producto);

    const pendienteProducto = Number(producto.cantidad_pendiente || 0);

    return (

        <Paper
            sx={{
                mb: 1.5,
                overflow: "hidden",
                borderRadius: 3,
                transition: "all .15s ease-in-out",
                // El estado "pendiente" ya no tiñe toda la tarjeta de
                // naranja — se distingue únicamente con el color del chip
                // de estatus. Aquí solo se resalta si está expandida.
                border: open
                    ? `1px solid ${palette.primary.border}`
                    : `1px solid ${palette.border}`,
                bgcolor: open
                    ? palette.primary.bg
                    : palette.surface,
                "&:hover": {
                    boxShadow: "0 2px 10px rgba(28,35,51,0.08)",
                    borderColor: palette.borderStrong
                }
            }}
        >

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    p: 1.5
                }}
            >

                {/* ===================== FILA 1: IDENTIFICACIÓN ===================== */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        rowGap: 1,
                        columnGap: 2
                    }}
                >

                    <IconButton
                        size="small"
                        onClick={() => setOpen(prev => !prev)}
                        sx={{ flexShrink: 0 }}
                    >
                        {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                    </IconButton>

                    <Chip
                        icon={ESTADO_ICONO[estado.tone]}
                        label={estado.label}
                        size="small"
                        sx={{
                            bgcolor: tono(estado.tone).bg,
                            color: tono(estado.tone).text,
                            border: `1px solid ${tono(estado.tone).border}`,
                            fontWeight: 700,
                            "& .MuiChip-icon": { color: tono(estado.tone).text }
                        }}
                    />

                    <Box sx={{ minWidth: 56 }}>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, display: "block" }}>
                            OP ID
                        </Typography>
                        <Typography variant="body2" fontWeight={600} noWrap>
                            {producto.orden_id}
                        </Typography>
                    </Box>

                    <Box sx={{ minWidth: 72 }}>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, display: "block" }}>
                            Producto ID
                        </Typography>
                        <Typography variant="body2" fontWeight={600} noWrap>
                            {producto.producto_id}
                        </Typography>
                    </Box>

                    <Box sx={{ minWidth: 110 }}>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, display: "block" }}>
                            PUBLICACIÓN
                        </Typography>
                        <Tooltip title={producto.publicacion_id || producto.publicacion}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                                {producto.publicacion_id || producto.publicacion}
                            </Typography>
                        </Tooltip>
                    </Box>

                    <Box sx={{ flex: "1 1 220px", minWidth: 160 }}>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, display: "block" }}>
                            TÍTULO
                        </Typography>
                        <Tooltip title={producto.title}>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ textOverflow: "ellipsis" }}>
                                {producto.title}
                            </Typography>
                        </Tooltip>
                    </Box>

                    <Box sx={{ minWidth: 100 }}>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, display: "block" }}>
                            SKU
                        </Typography>
                        <Tooltip title={producto.sku}>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ textOverflow: "ellipsis" }}>
                                {producto.sku}
                            </Typography>
                        </Tooltip>
                    </Box>

                    <Box sx={{ minWidth: 110 }}>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, display: "block" }}>
                            ML
                        </Typography>
                        <Tooltip title={producto.inventory_id}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                                {producto.inventory_id}
                            </Typography>
                        </Tooltip>
                    </Box>

                    <Box sx={{ minWidth: 90 }}>
                        <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600, display: "block" }}>
                            LOGÍSTICA
                        </Typography>
                        <Tooltip title={producto.logistic_type}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                                {producto.logistic_type || "—"}
                            </Typography>
                        </Tooltip>
                    </Box>

                </Box>

                {/* ===================== FILA 2: MÉTRICAS ===================== */}
                {/* Fila propia (no comparte espacio con el título) y con
                    flexWrap, así que a cualquier nivel de zoom las 4
                    métricas se van acomodando en líneas nuevas en vez de
                    salirse del contenedor o taparse con el título. */}

                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        justifyContent: "flex-end"
                    }}
                >

                    <StatTile label="Producir" value={producto.cantidad_a_producir} tone="primary" />
                    <StatTile label="Enviar" value={producto.cantidad_a_enviar} tone="primary" />
                    <StatTile label="Empacado" value={producto.cantidad_empacada} tone="success" />
                    <StatTile
                        label="Pendiente"
                        value={producto.cantidad_pendiente}
                        tone={pendienteProducto > 0 ? "warning" : "success"}
                    />

                </Box>

            </Box>

            <Collapse
                in={open}
                timeout={200}
                unmountOnExit
            >

                <Box
                    sx={{
                        p: 2,
                        bgcolor: palette.surfaceMuted,
                        borderTop: `1px solid ${palette.border}`
                    }}
                >

                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        mb={1.5}
                        sx={{ color: palette.textPrimary }}
                    >

                        Componentes ({producto.componentes.length})

                    </Typography>

                    {/* Contenedor con scroll horizontal propio: a zoom
                        alto la tabla no se comprime ni oculta columnas,
                        simplemente se desplaza dentro de su propia caja. */}

                    <Box
                        sx={{
                            overflowX: "auto",
                            border: `1px solid ${palette.border}`,
                            borderRadius: 2,
                            bgcolor: palette.surface
                        }}
                    >

                        <Table
                            size="small"
                            sx={{ minWidth: 780 }}
                        >

                            <TableHead>

                                <TableRow
                                    sx={{
                                        "& th": {
                                            fontWeight: 700,
                                            whiteSpace: "nowrap",
                                            color: palette.textSecondary,
                                            fontSize: 11,
                                            letterSpacing: 0.4,
                                            textTransform: "uppercase",
                                            bgcolor: palette.surfaceSunken,
                                            borderBottom: `1px solid ${palette.border}`
                                        }
                                    }}
                                >

                                    <TableCell />

                                    <TableCell align="center">OPD ID</TableCell>

                                    <TableCell align="center">COMP ID</TableCell>

                                    <TableCell>SKU</TableCell>

                                    <TableCell>Descripción</TableCell>

                                    <TableCell align="center">Facturado</TableCell>

                                    <TableCell align="center">Enviar</TableCell>

                                    <TableCell align="center">Procesado</TableCell>

                                    <TableCell align="center">Pendiente</TableCell>

                                    <TableCell align="center">Cubierto Stock</TableCell>

                                </TableRow>

                            </TableHead>

                            <TableBody>

                                {

                                    producto.componentes.map((componente) => (

                                        <ComponenteRow
                                            key={componente.op_detalle_id}
                                            componente={componente}
                                        />

                                    ))

                                }

                            </TableBody>

                        </Table>

                    </Box>

                </Box>

            </Collapse>

        </Paper>

    );

}