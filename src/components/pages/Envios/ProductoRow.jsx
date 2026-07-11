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

    return (

        <Paper
            sx={{
                mb: 1.5,
                overflow: "hidden",
                borderRadius: 4,
                transition: ".2s",
                border: "1px solid #e5e7eb",

                bgcolor: open ? "#b7cceb" : "#f0f0f0",

                "&:hover": {
                    boxShadow: 4,
                    borderColor: "#90caf9"
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

                    <TableRow
                        hover
                        sx={{
                            "& td": {
                                py: 1,
                                borderBottom: 0,
                                verticalAlign: "middle"
                            }
                        }}
                    >

                        {/* ===================== INFORMACIÓN ===================== */}

                        <TableCell
                            colSpan={2}
                            sx={{
                                borderBottom: 0,
                                width: "100%"
                            }}
                        >

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    minWidth: 0
                                }}
                            >

                                {/* Expandir */}

                                {/* Expandir */}

                                <Box
                                    sx={{
                                        width: 42,
                                        display: "flex",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}
                                >

                                    <IconButton
                                        size="small"
                                        onClick={() => setOpen(prev => !prev)}
                                    >
                                        {
                                            open
                                                ? <KeyboardArrowDownIcon />
                                                : <KeyboardArrowRightIcon />
                                        }
                                    </IconButton>

                                </Box>

                                {/* Estado */}

                                <Box
                                    sx={{
                                        width: 42,
                                        display: "flex",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}
                                >

                                    {

                                        producto.cantidad_pendiente > 0 ?

                                            <Tooltip title="Pendiente por surtir">

                                                <WarningAmberIcon
                                                    color="warning"
                                                />

                                            </Tooltip>

                                            :

                                            <Tooltip title="Completo">

                                                <CheckCircleIcon
                                                    color="success"
                                                />

                                            </Tooltip>

                                    }

                                </Box>

                                {/* Orden Produccion: ID */}
                                <Box
                                    sx={{
                                        width: 50,
                                        flexShrink: 0
                                    }}
                                >

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
                                    >

                                        OP ID

                                    </Typography>

                                    <Tooltip title={producto.orden_id}>

                                        <Typography
                                            fontWeight={600}
                                            noWrap
                                        >

                                            {producto.orden_id}

                                        </Typography>

                                    </Tooltip>

                                </Box>

                                {/* Producto: ID */}
                                <Box
                                    sx={{
                                        width: 100,
                                        flexShrink: 0
                                    }}
                                >

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
                                    >

                                        Producto ID

                                    </Typography>

                                    <Tooltip title={producto.producto_id}>

                                        <Typography
                                            fontWeight={600}
                                            noWrap
                                        >

                                            {producto.producto_id}

                                        </Typography>

                                    </Tooltip>

                                </Box>

                                {/* Publicación */}

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

                                        PUBLICACIÓN

                                    </Typography>

                                    <Tooltip title={producto.publicacion_id}>

                                        <Typography
                                            fontWeight={600}
                                            noWrap
                                        >

                                            {producto.publicacion_id}

                                        </Typography>

                                    </Tooltip>

                                </Box>


                                {/* Título */}

                                <Box
                                    sx={{
                                        maxWidth: 200,
                                        flex: 1
                                    }}
                                >

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
                                    >

                                        TÍTULO

                                    </Typography>

                                    <Tooltip title={producto.title}>

                                        <Typography
                                            noWrap
                                            fontWeight={600}
                                        >

                                            {producto.title}

                                        </Typography>

                                    </Tooltip>

                                </Box>


                                {/* SKU */}

                                <Box
                                    sx={{
                                        width: 200,
                                        flexShrink: 0
                                    }}
                                >

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
                                    >

                                        SKU

                                    </Typography>

                                    <Tooltip title={producto.sku}>

                                        <Typography
                                            noWrap
                                            fontWeight={600}
                                        >

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

                                        INVENTORY

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

                            </Box>

                        </TableCell>


                        {/* ===================== KPIs ===================== */}

                        <TableCell
                            sx={{
                                width: 360,
                                borderLeft: "1px solid #eceff1",
                                borderBottom: 0
                            }}
                        >

                            <Stack
                                direction="row"
                                spacing={1.5}
                                justifyContent="flex-end"
                            >

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
                                            value: producto.cantidad_a_producir,
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

                                                <TableCell  />

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