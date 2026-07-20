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
    onVerFactura,
    onVerConsolidado

}) {

    const navigate = useNavigate();

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
                >

                    <Grid item md={4}>

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

                    <Grid item md={2}>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >

                            Enviar: {grupo.cantidad_producto_a_enviar}

                        </Typography>

                    </Grid>

                    {/* <Grid item md={2}>

                        <Chip

                            label={grupo.estatus}

                            color={
                                grupo.estatus === "activa"
                                    ? "success"
                                    : "warning"
                            }

                        />

                    </Grid> */}

                    <Grid item md={2}>

                        <Box sx={{ width: "80%" }}>
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

                        <Box sx={{ width: "80%" }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                }}
                            >
                                <Typography variant="caption">Surtido: {grupo.avance_surtido}%</Typography>
                                <Typography variant="caption">
                                    {grupo.cantidad_surtida} / {grupo.cantidad_facturada}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Number(grupo.avance)}
                                sx={{ height: 6, borderRadius: 4 }}
                            />
                        </Box>

                    </Grid>

                    <Grid
                        item
                        md={2}
                    >

                        <Stack
                            direction="row"
                            spacing={1}
                        >

                            <Button
                                component={RouterLink}
                                to={`/surtido/${grupo.proforma_id}`}
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >

                                Surtir

                            </Button>

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

                {

                    grupo.facturas.map((factura) => (

                        <FacturaCard

                            key={factura.factura_id}

                            factura={factura}

                            onVerDetalle={onVerFactura}

                        />

                    ))

                }

            </AccordionDetails>

        </Accordion>

    );

}