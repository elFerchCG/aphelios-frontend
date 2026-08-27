import { useState } from "react";

import {
    Box,
    Collapse,
    IconButton,
    TableCell,
    TableRow,
    Typography
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

import TableFacturas from "./TableFacturas";
import TableStockExcedente from "./TableStockExcedente";
import SoftChip from "./SoftChip";
import { palette } from "./consolidadoPalette";

export default function ComponenteRow({ componente }) {

    const [open, setOpen] = useState(false);

    const tienePendiente = componente.pendiente > 0;
    const tieneCubierto = componente.cantidad_cubierta_excedente > 0;

    return (

        <>

            <TableRow
                hover
                sx={{
                    "& td": {
                        borderBottom: `1px solid ${palette.border}`
                    }
                }}
            >

                <TableCell width={44}>

                    <IconButton
                        size="small"
                        onClick={() => setOpen(!open)}
                    >

                        {
                            open
                                ? <KeyboardArrowDownIcon />
                                : <KeyboardArrowRightIcon />
                        }

                    </IconButton>

                </TableCell>

                <TableCell align="center">

                    <Typography variant="body2" fontWeight={600} sx={{ color: palette.textSecondary }}>

                        {componente.op_detalle_id}

                    </Typography>

                </TableCell>

                <TableCell align="center">

                    <Typography variant="body2" fontWeight={600} sx={{ color: palette.textSecondary }}>

                        {componente.componente_id}

                    </Typography>

                </TableCell>

                <TableCell width={170}>

                    <Typography variant="body2" fontWeight={700} sx={{ color: palette.textPrimary }}>

                        {componente.componente_sku}

                    </Typography>

                </TableCell>

                <TableCell>

                    <Typography variant="body2" sx={{ color: palette.textPrimary }}>

                        {componente.descripcion}

                    </Typography>

                </TableCell>

                <TableCell align="center">

                    <SoftChip
                        label={componente.componente_cantidad_facturada}
                        tone="primary"
                    />

                </TableCell>

                <TableCell align="center">

                    <SoftChip
                        label={componente.componente_cantidad_a_enviar}
                        tone="primary"
                    />

                </TableCell>

                <TableCell align="center">

                    <SoftChip
                        label={componente.cantidad_contada}
                        tone="success"
                    />

                </TableCell>

                <TableCell align="center">

                    <SoftChip
                        label={componente.pendiente}
                        tone={tienePendiente ? "warning" : "success"}
                    />

                </TableCell>

                <TableCell align="center">

                    {

                        tieneCubierto
                            ? (
                                <SoftChip
                                    label={componente.cantidad_cubierta_excedente}
                                    tone="info"
                                />
                            )
                            : (
                                <Typography
                                    variant="body2"
                                    sx={{ color: palette.textDisabled }}
                                >
                                    —
                                </Typography>
                            )

                    }

                </TableCell>

            </TableRow>

            <TableRow>

                <TableCell
                    colSpan={10}
                    sx={{
                        paddingBottom: 0,
                        paddingTop: 0,
                        borderBottom: 0
                    }}
                >

                    <Collapse

                        in={open}

                        timeout="auto"

                        unmountOnExit

                    >

                        <Box
                            sx={{
                                ml: { xs: 1, sm: 4 },
                                my: 1.5
                            }}
                        >

                            <Typography

                                variant="subtitle2"

                                fontWeight={700}

                                mb={1}

                                sx={{ color: palette.textPrimary }}

                            >

                                Líneas de factura que abastecen este componente

                            </Typography>

                            <TableFacturas

                                facturas={componente.facturas}

                            />

                            {

                                componente.stock_excedente && componente.stock_excedente.length > 0 && (

                                    <>

                                        <Typography

                                            variant="subtitle2"

                                            fontWeight={700}

                                            mt={2}

                                            mb={1}

                                            sx={{ color: palette.textPrimary }}

                                        >

                                            Stock de excedentes de componentes usado (este SKU o su hermano en la misma orden)

                                        </Typography>

                                        <TableStockExcedente

                                            movimientos={componente.stock_excedente}

                                        />

                                    </>

                                )

                            }

                        </Box>

                    </Collapse>

                </TableCell>

            </TableRow>

        </>

    );

}