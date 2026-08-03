import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    LinearProgress,
    Stack,
    Typography
} from "@mui/material";

import { Link as RouterLink } from "react-router-dom";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { useNavigate } from "react-router-dom";

import FacturaCard from "./FacturaCard";

export default function ProformaAccordion({

    grupo,
    puedeEditarColumna,
    onVerFactura,
    onVerConsolidado,
    onHabilitarProforma,
    onFinalizarProforma,
    onRevertirProforma

}) {

    const navigate = useNavigate();

    // 1. Deshabilitar botón si el usuario no tiene permisos
    const disabled = !puedeEditarColumna;

    // 2. Determinar texto del botón según estatus
    let textoBoton = "Habilitar";
    let colorBoton = "success";

    if (grupo.estatus === "activa") {
        textoBoton = "Finalizar";
        colorBoton = "secondary";
    } else if (grupo.estatus === "finalizada") {
        textoBoton = "Revertir";
        colorBoton = "warning";
    }

    return (

        <Accordion
            sx={{
                mb: 2,
                backgroundColor: "#f0f0f0",
                boxShadow: 4,
                borderRadius: 4,
                "&:before": {
                    display: "none"
                }
            }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid
                    container
                    alignItems="center"
                    spacing={1}
                >
                    <Grid item md={3}>
                        <Stack>
                            <Typography
                                fontWeight="bold"
                                variant="h6"
                            >
                                <Inventory2Icon
                                    sx={{
                                        mr: 1,
                                        verticalAlign: "middle"
                                    }}
                                />
                                {grupo.titulo}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Pedido #{grupo.pedido_id}
                            </Typography>
                        </Stack>
                    </Grid>

                    <Grid item md={1}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Facturas: {grupo.total_facturas}
                        </Typography>
                    </Grid>

                    <Grid item md={1}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Piezas: {grupo.total_piezas}
                        </Typography>
                    </Grid>

                    <Grid item md={1}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Enviar: {grupo.cantidad_producto_a_enviar}
                        </Typography>
                    </Grid>

                    <Grid item md={1}>
                        <Chip
                            label={grupo.estatus}
                            color={
                                grupo.estatus === "activa"
                                    ? "success"
                                    : grupo.estatus === "pendiente"
                                        ? "warning"
                                        : "default"
                            }
                        />
                    </Grid>

                    {/* Sección de Avance / Progreso */}
                    <Grid item md={2}>
                        <Box sx={{ width: "90%" }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                }}
                            >
                                <Typography variant="caption">Escaneo: {grupo.avance}%</Typography>
                                <Typography variant="caption">
                                    {grupo.cantidad_producto_empacada} / {grupo.cantidad_producto_a_enviar}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Number(grupo.avance)}
                                sx={{ height: 6, borderRadius: 4, mb: 1 }}
                            />
                        </Box>

                        <Box sx={{ width: "90%" }}>
                            {(() => {
                                const facturada = Number(grupo.cantidad_facturada) || 0;
                                const aEnviar = Number(grupo.cantidad_a_enviar) || 0;
                                const surtida = Number(grupo.cantidad_surtida) || 0;

                                // 1. Determinar el total según la regla de negocio
                                const total = facturada > 0 ? facturada : aEnviar;

                                // 2. Calcular el porcentaje dinámico
                                const pct = total > 0
                                    ? Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            Math.round((surtida / total) * 100)
                                        )
                                    )
                                    : 0;

                                return (
                                    <>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                mb: 0.5,
                                            }}
                                        >
                                            <Typography variant="caption">Surtido: {pct}%</Typography>
                                            <Typography variant="caption">
                                                {Math.round(surtida)} / {Math.round(total)}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Number(pct)}
                                            sx={{ height: 6, borderRadius: 4 }}
                                        />
                                    </>
                                );
                            })()}
                        </Box>
                    </Grid>

                    {/* Sección de Botones de Acción */}
                    <Grid
                        item
                        md={3}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                        >
                            {/* Botón dinámico Habilitar / Finalizar / Revertir */}
                            <Button
                                variant="contained"
                                color={colorBoton}
                                size="small"
                                disabled={disabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (disabled) return;

                                    if (grupo.estatus === "pendiente") {
                                        onHabilitarProforma?.(grupo);
                                    } else if (grupo.estatus === "activa") {
                                        onFinalizarProforma?.(grupo);
                                    } else if (grupo.estatus === "finalizada") {
                                        onRevertirProforma?.(grupo);
                                    }
                                }}
                            >
                                {textoBoton}
                            </Button>

                            {/* Botón Surtir - Habilitado únicamente cuando el estatus es 'activa' */}
                            <Button
                                component={RouterLink}
                                to={`/surtido/${grupo.proforma_id}`}
                                variant="contained"
                                color="primary"
                                size="small"
                                disabled={grupo.estatus !== "activa"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                Surtir
                            </Button>

                            {/* Botón Consolidado */}
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onVerConsolidado(grupo);
                                }}
                            >
                                Consolidado
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </AccordionSummary>

            <AccordionDetails sx={{ borderRadius: 8 }}>
                <Divider sx={{ mb: 2, border: "1px solid #e0e0e0", borderRadius: 4 }} />
                {grupo.facturas.map((factura) => (
                    <FacturaCard
                        key={factura.factura_id}
                        factura={factura}
                        onVerDetalle={onVerFactura}
                    />
                ))}
            </AccordionDetails>
        </Accordion>

    );

}