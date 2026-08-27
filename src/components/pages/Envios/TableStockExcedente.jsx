import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";

import Inventory2Icon from "@mui/icons-material/Inventory2";

import SoftChip from "./SoftChip";
import { palette } from "./consolidadoPalette";
import { formatFecha } from "./formatters";

const obtenerEstadoEntrega = (mov) => {

    if (mov.entregado_en) {
        return { label: "Entregado", tone: "success" };
    }

    if (mov.solicitado_en) {
        return { label: "Esperando entrega", tone: "warning" };
    }

    return { label: "Sin solicitar", tone: "neutral" };

};

export default function TableStockExcedente({ movimientos }) {

    if (!movimientos || movimientos.length === 0) {
        return null;
    }

    return (

        <Box
            sx={{
                overflowX: "auto",
                border: `1px solid ${palette.info.border}`,
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
                                color: palette.info.text,
                                fontSize: 11,
                                letterSpacing: 0.4,
                                textTransform: "uppercase",
                                bgcolor: palette.info.bg,
                                borderBottom: `1px solid ${palette.info.border}`
                            }
                        }}
                    >
                        <TableCell>
                            Movimiento ID
                        </TableCell>

                        <TableCell>
                            Localidad
                        </TableCell>

                        <TableCell>
                            Bodega
                        </TableCell>

                        <TableCell>
                            Estado de entrega
                        </TableCell>

                        <TableCell>
                            Fecha
                        </TableCell>

                        <TableCell align="right">
                            Cantidad
                        </TableCell>

                    </TableRow>

                </TableHead>

                <TableBody>

                    {

                        movimientos.map((mov) => {

                            const estado = obtenerEstadoEntrega(mov);

                            return (

                                <TableRow
                                    key={mov.movimiento_id}
                                    hover
                                    sx={{ "& td": { borderBottom: `1px solid ${palette.border}` } }}
                                >

                                    <TableCell>

                                        <SoftChip
                                            label={mov.movimiento_id}
                                            tone="info"
                                            icon={<Inventory2Icon sx={{ fontSize: 14 }} />}
                                        />

                                    </TableCell>

                                    <TableCell>

                                        <Typography variant="body2" sx={{ color: palette.textPrimary }}>
                                            {mov.localidad || "—"}
                                        </Typography>

                                    </TableCell>

                                    <TableCell>

                                        <Typography variant="body2" sx={{ color: palette.textPrimary }}>
                                            {mov.bodega || "—"}
                                        </Typography>

                                    </TableCell>

                                    <TableCell>

                                        <SoftChip
                                            label={estado.label}
                                            tone={estado.tone}
                                        />

                                    </TableCell>

                                    <TableCell>

                                        <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                                            {formatFecha(mov.fecha_movimiento) || "—"}
                                        </Typography>

                                    </TableCell>

                                    <TableCell
                                        align="right"
                                    >

                                        <Typography variant="body2" fontWeight={700} sx={{ color: palette.textPrimary }}>
                                            {Number(mov.cantidad).toLocaleString()}
                                        </Typography>

                                    </TableCell>

                                </TableRow>

                            );

                        })

                    }

                </TableBody>

            </Table>

        </Box>

    );

}