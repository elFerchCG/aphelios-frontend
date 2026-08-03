import { useState } from "react";

import {
    Box,
    Collapse,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Chip
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import ComponenteRow from "./ComponenteRow";

export default function ProductoRow({ producto }) {

    const [open, setOpen] = useState(false);

    const obtenerEstadoProducto = (item) => {
        const { cantidad_a_enviar, cantidad_empacada, componentes = [] } = item;

        // 1. Empaque completado
        const estaEmpacado = Number(cantidad_empacada) >= Number(cantidad_a_enviar);
        if (estaEmpacado) {
            return {
                status: 'EMPACADO',
                resaltar: false,
                label: 'Empacado',
                color: 'success'
            };
        }

        // 2. Componentes pendientes de surtir
        const tieneComponentesPendientes = componentes.some(
            (comp) => Number(comp.cantidad_surtida || 0) < Number(comp.componente_cantidad_a_enviar)
        );

        if (tieneComponentesPendientes) {
            return {
                status: 'PENDIENTE_SURTIR',
                resaltar: true,
                label: 'Pendiente por Surtir',
                color: 'warning'
            };
        }

        // 3. Surtido completo pero falta empacar
        return {
            status: 'PENDIENTE_EMPACAR',
            resaltar: true,
            label: 'Pendiente por Empacar',
            color: 'info'
        };
    };

    // --- AJUSTE 1: Obtener el estado dinámico ---
    const estado = obtenerEstadoProducto(producto);
    const esPendiente = estado.resaltar; // Resuelve el error de variable no definida

    return (

        <Paper
            sx={{
                mb: 1.5,
                overflow: "hidden",
                borderRadius: 3,
                transition: "all .2s ease-in-out",
                border: esPendiente ? "1.5px solid #ffa726" : "1px solid #e5e7eb",
                bgcolor: open
                    ? "#b7cceb"
                    : esPendiente
                        ? "#fffde7"
                        : "#f9fafb",
                "&:hover": {
                    boxShadow: 4,
                    borderColor: esPendiente ? "#f57c00" : "#90caf9"
                }
            }}
        >

            <Table
                size="small"
                sx={{
                    tableLayout: "fixed",
                    width: "100%"
                }}
            >

                <TableBody>

                    <TableRow hover sx={{ "& td": { py: 1, px: 1.5, borderBottom: 0, verticalAlign: "middle" } }}>

                        {/* ===================== INFORMACIÓN ===================== */}

                        <TableCell colSpan={2} sx={{ borderBottom: 0, width: "100%", p: 1 }}>

                            {/* Contenedor Flex para alinear horizontalmente todo el contenido */}
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%" }}>

                                {/* Expandir */}

                                <Box sx={{ width: 32, display: "flex", justifyContent: "center", flexShrink: 0 }}>

                                    <IconButton size="small" onClick={() => setOpen(prev => !prev)}>
                                        {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                                    </IconButton>

                                </Box>

                                {/* Estado */}

                                <Box sx={{ flexShrink: 0 }}>
                                    <Chip
                                        size="small"
                                        label={estado.label}
                                        color={estado.color}
                                        icon={
                                            estado.status === 'EMPACADO'
                                                ? <CheckCircleIcon fontSize="small" />
                                                : <WarningAmberIcon fontSize="small" />
                                        }
                                        variant={estado.status === 'EMPACADO' ? 'outlined' : 'filled'}
                                    />
                                </Box>

                                {/* Orden Produccion: ID */}
                                <Box sx={{ width: 45, flexShrink: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                        OP ID
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} noWrap>
                                        {producto.orden_id}
                                    </Typography>
                                </Box>

                                {/* Producto: ID */}
                                <Box sx={{ width: 75, flexShrink: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                        Producto ID
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} noWrap>
                                        {producto.producto_id}
                                    </Typography>
                                </Box>

                                {/* Publicación */}

                                <Box sx={{ width: 125, flexShrink: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                        PUBLICACIÓN
                                    </Typography>
                                    <Tooltip title={producto.publicacion_id || producto.publicacion}>
                                        <Typography variant="body2" fontWeight={600} noWrap>
                                            {producto.publicacion_id || producto.publicacion}
                                        </Typography>
                                    </Tooltip>
                                </Box>


                                {/* Título */}

                                <Box sx={{ flex: 1, minWidth: 100, overflow: "hidden" }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                        TÍTULO
                                    </Typography>
                                    <Tooltip title={producto.title}>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ textOverflow: "ellipsis" }}>
                                            {producto.title}
                                        </Typography>
                                    </Tooltip>
                                </Box>

                                {/* SKU */}

                                <Box sx={{ width: 110, flexShrink: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                        SKU
                                    </Typography>
                                    <Tooltip title={producto.sku}>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ textOverflow: "ellipsis" }}>
                                            {producto.sku}
                                        </Typography>
                                    </Tooltip>
                                </Box>

                                {/* Inventory */}

                                <Box
                                    sx={{
                                        width: 150,
                                        flexShrink: 0
                                    }}
                                >

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
                                    >

                                        ML

                                    </Typography>

                                    <Tooltip title={producto.inventory_id}>

                                        <Typography
                                            noWrap
                                            fontWeight={600}
                                        >

                                            {producto.inventory_id}

                                        </Typography>

                                    </Tooltip>

                                </Box>

                                <Box sx={{ display: "flex", gap: 1, flexShrink: 0, ml: "auto" }}>
                                    {

                                        [
                                            {
                                                label: "MRP",
                                                value: producto.producto_cantidad_mrp,
                                                color: "#fffec8",
                                                text: "#e96161"
                                            },

                                            {
                                                label: "Envíar",
                                                value: producto.cantidad_a_enviar,
                                                color: "#eef4ff",
                                                text: "#1565c0"
                                            },

                                            {
                                                label: "Empacado",
                                                value: producto.cantidad_empacada,
                                                color: "#edf7ed",
                                                text: "#2e7d32"
                                            },

                                            {
                                                label: "Pendiente",
                                                value: producto.cantidad_pendiente,
                                                color:
                                                    producto.cantidad_pendiente > 0
                                                        ? "#fff8e1"
                                                        : "#edf7ed",
                                                text:
                                                    producto.cantidad_pendiente > 0
                                                        ? "#ed6c02"
                                                        : "#2e7d32"
                                            }

                                        ].map(item => (

                                            <Paper
                                                key={item.label}
                                                elevation={0}
                                                sx={{
                                                    width: 95,
                                                    py: .7,
                                                    textAlign: "center",
                                                    bgcolor: item.color,
                                                    borderRadius: 2,
                                                    border: "1px solid rgba(0,0,0,.05)"
                                                }}
                                            >

                                                <Typography
                                                    sx={{
                                                        color: item.text,
                                                        fontWeight: 600,
                                                        fontSize: 22,
                                                        lineHeight: 1.1
                                                    }}
                                                >

                                                    {item.value}

                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >

                                                    {item.label}

                                                </Typography>

                                            </Paper>

                                        ))

                                    }
                                </Box>

                            </Stack>

                        </TableCell>

                    </TableRow>

                    <TableRow>

                        <TableCell
                            colSpan={8}
                            sx={{
                                p: 0,
                                borderBottom: 0
                            }}
                        >

                            <Collapse
                                in={open}
                                timeout={250}
                                unmountOnExit
                            >

                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: "#edf1fa"
                                    }}
                                >

                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={700}
                                        mb={2}
                                    >

                                        Componentes ({producto.componentes.length})

                                    </Typography>

                                    <Table
                                        size="small"
                                    >

                                        <TableHead sx={{ backgroundColor: "#b7cceb" }}>

                                            <TableRow
                                                sx={{
                                                    "& th": {
                                                        fontWeight: 700,
                                                        whiteSpace: "nowrap"
                                                    }
                                                }}
                                            >

                                                <TableCell />

                                                <TableCell align="center">OPD ID</TableCell>

                                                <TableCell align="center">COMP ID</TableCell>

                                                <TableCell>SKU</TableCell>

                                                <TableCell>Descripción</TableCell>

                                                <TableCell align="center">MRP</TableCell>

                                                <TableCell align="center">Facturado</TableCell>

                                                <TableCell align="center">Enviar</TableCell>

                                                <TableCell align="center">Surtido</TableCell>

                                                <TableCell align="center">Pendiente</TableCell>

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

                            </Collapse>

                        </TableCell>

                    </TableRow>

                </TableBody>

            </Table>

        </Paper>

    );

}