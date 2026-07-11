import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from "@mui/material";

export default function TableFacturas({ facturas }) {

    if (!facturas || facturas.length === 0) {
        return null;
    }

    return (

        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                mt: 1,
                border: "2px solid #e0e0e0",
                borderRadius: 2
            }}
        >

            <Table
                size="small"
            >

                <TableHead>

                    <TableRow
                        sx={{
                            backgroundColor: "#b7cceb"
                        }}
                    >
                        <TableCell>
                            Factura ID
                        </TableCell>

                        <TableCell>
                            Factura
                        </TableCell>

                        <TableCell>
                            Línea
                        </TableCell>

                        <TableCell>
                            Fecha factura
                        </TableCell>

                        <TableCell>
                            Fecha arribo
                        </TableCell>

                        <TableCell>
                            SKU Factura
                        </TableCell>

                        <TableCell align="right">
                            Cantidad
                        </TableCell>

                    </TableRow>

                </TableHead>

                <TableBody>

                    {

                        facturas.map((factura) => (

                            <TableRow
                                key={factura.factura_detalle_id}
                                hover
                            >

                                <TableCell>

                                    <Chip
                                        size="small"
                                        label={factura.factura_id}
                                        color="primary"
                                        variant="outlined"
                                    />

                                </TableCell>

                                <TableCell>

                                    <Chip
                                        size="small"
                                        label={factura.factura}
                                        color="primary"
                                        variant="outlined"
                                    />

                                </TableCell>

                                <TableCell>

                                    <Chip
                                        size="small"
                                        label={factura.factura_detalle_id}
                                        color="primary"
                                        variant="outlined"
                                    />

                                </TableCell>

                                <TableCell>

                                    <Chip
                                        size="small"
                                        label={factura.fecha_factura}
                                        color="primary"
                                        variant="outlined"
                                    />

                                </TableCell>

                                <TableCell>

                                    <Chip
                                        size="small"
                                        label={factura.fecha_arribo}
                                        color="primary"
                                        variant="outlined"
                                    />

                                </TableCell>

                                <TableCell>

                                    {factura.sku}

                                </TableCell>



                                <TableCell
                                    align="right"
                                >

                                    {Number(factura.cantidad).toLocaleString()}

                                </TableCell>

                            </TableRow>

                        ))

                    }

                </TableBody>

            </Table>

        </TableContainer>

    );

}