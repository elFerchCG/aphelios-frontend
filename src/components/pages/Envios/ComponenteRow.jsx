import { useState } from "react";

import {
    Box,
    Collapse,
    IconButton,
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

import TableFacturas from "./TableFacturas";

export default function ComponenteRow({ componente }) {

    const [open, setOpen] = useState(false);

    return (

        <>

            <TableRow hover>

                <TableCell width={50}>

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

                    <Typography fontWeight="bold">

                        {componente.op_detalle_id}

                    </Typography>

                </TableCell>

                <TableCell align="center">

                    <Typography fontWeight="bold">

                        {componente.componente_id}

                    </Typography>

                </TableCell>

                <TableCell width={180}>

                    <Typography fontWeight="bold">

                        {componente.componente_sku}

                    </Typography>

                </TableCell>

                <TableCell>

                    {componente.descripcion}

                </TableCell>

                <TableCell align="center">

                    <Chip

                        size="small"

                        color="primary"

                        label={componente.componente_cantidad_mrp}

                    />

                </TableCell>

                <TableCell align="center">

                    <Chip

                        size="small"

                        color="success"

                        label={componente.componente_cantidad_facturada}

                    />

                </TableCell>

                <TableCell align="center">

                    <Chip

                        size="small"

                        color="success"

                        label={componente.componente_cantidad_a_enviar}

                    />

                </TableCell>

                <TableCell align="center">

                    <Chip

                        size="small"

                        color="success"

                        label={componente.cantidad_surtida}

                    />

                </TableCell>

                <TableCell align="center">

                    <Chip

                        size="small"

                        color={
                            componente.pendiente > 0
                                ? "warning"
                                : "success"
                        }

                        label={componente.pendiente}

                    />

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
                                ml: 4
                            }}
                        >

                            <Typography

                                variant="subtitle2"

                                fontWeight="bold"

                                mb={1}

                            >

                                Líneas de factura que abastecen este componente

                            </Typography>

                            <TableFacturas

                                facturas={componente.facturas}

                            />

                        </Box>

                    </Collapse>

                </TableCell>

            </TableRow>

        </>

    );

}