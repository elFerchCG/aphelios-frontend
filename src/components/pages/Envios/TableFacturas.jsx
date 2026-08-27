import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";

import SoftChip from "./SoftChip";
import { palette } from "./consolidadoPalette";
import { formatFecha } from "./formatters";

export default function TableFacturas({ facturas }) {

    if (!facturas || facturas.length === 0) {
        return (

            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    border: `1px dashed ${palette.border}`,
                    borderRadius: 2,
                    bgcolor: palette.surfaceMuted
                }}
            >

                <Typography variant="body2" sx={{ color: palette.textDisabled }}>

                    Este componente no tiene líneas de factura propias (se cubrió con stock de excedentes — ver abajo).

                </Typography>

            </Box>

        );
    }

    return (

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
                sx={{ minWidth: 620 }}
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
                                sx={{ "& td": { borderBottom: `1px solid ${palette.border}` } }}
                            >

                                <TableCell>

                                    <SoftChip
                                        label={factura.factura_id}
                                        tone="neutral"
                                    />

                                </TableCell>

                                <TableCell>

                                    <SoftChip
                                        label={factura.factura}
                                        tone="neutral"
                                    />

                                </TableCell>

                                <TableCell>

                                    <SoftChip
                                        label={factura.factura_detalle_id}
                                        tone="neutral"
                                    />

                                </TableCell>

                                <TableCell>

                                    <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                                        {formatFecha(factura.fecha_factura) || "—"}
                                    </Typography>

                                </TableCell>

                                <TableCell>

                                    <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                                        {formatFecha(factura.fecha_arribo) || "—"}
                                    </Typography>

                                </TableCell>

                                <TableCell>

                                    <Typography variant="body2" sx={{ color: palette.textPrimary }}>
                                        {factura.sku}
                                    </Typography>

                                </TableCell>

                                <TableCell
                                    align="right"
                                >

                                    <Typography variant="body2" fontWeight={700} sx={{ color: palette.textPrimary }}>
                                        {Number(factura.cantidad).toLocaleString()}
                                    </Typography>

                                </TableCell>

                            </TableRow>

                        ))

                    }

                </TableBody>

            </Table>

        </Box>

    );

}