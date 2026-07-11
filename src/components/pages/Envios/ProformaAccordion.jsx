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

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import FacturaCard from "./FacturaCard";

export default function ProformaAccordion({

    grupo,
    onVerFactura,
    onVerConsolidado

}) {

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

                    <Grid item md={2}>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >

                            Facturas: {grupo.total_facturas}

                        </Typography>

                    </Grid>

                    <Grid item md={2}>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >

                            Piezas: {grupo.total_piezas}

                        </Typography>

                    </Grid>

                    <Grid item md={2}>

                        <Chip

                            label={grupo.estatus}

                            color={
                                grupo.estatus === "activa"
                                    ? "success"
                                    : "warning"
                            }

                        />

                    </Grid>

                    <Grid item md={2}>

                        <Box sx={{ width: "80%" }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                }}
                            >
                                <Typography variant="caption">{grupo.avance}%</Typography>
                                <Typography variant="caption">
                                    {/* {Math.round(grupo.surtidas)}/{Math.round(grupo.requeridas)} */}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Number(grupo.avance)}
                                sx={{ height: 6, borderRadius: 4 }}
                            />
                        </Box>

                    </Grid>

                    <Grid item md={1}>

                        <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log("Click consolidado", grupo);
                                onVerConsolidado(grupo);
                            }}
                        >

                            Consolidado

                        </Button>

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