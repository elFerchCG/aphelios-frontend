import {

    Accordion,
    AccordionSummary,
    AccordionDetails,

    Typography,

    Stack,

    Button,

    LinearProgress

} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import FacturaCard from "./FacturaCard";

export default function ProformaCard({

    grupo,

    onVerFactura

}) {

    return (

        <Accordion
            sx={{
                mb: 2
            }}
        >

            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >

                <Stack
                    direction="row"
                    spacing={6}
                    width="100%"
                    alignItems="center"
                >

                    <Typography
                        fontWeight="bold"
                    >

                        📦 {grupo.titulo}

                    </Typography>

                    <Typography>

                        Pedido #{grupo.pedido_id}

                    </Typography>

                    <Typography>

                        Facturas: {grupo.total_facturas}

                    </Typography>

                    <Typography>

                        {grupo.estatus}

                    </Typography>

                    <Stack
                        width={200}
                    >

                        <LinearProgress
                            variant="determinate"
                            value={grupo.avance}
                        />

                    </Stack>

                    <Button
                        variant="outlined"
                    >

                        Consolidado

                    </Button>

                </Stack>

            </AccordionSummary>

            <AccordionDetails>

                {

                    grupo.facturas.map(factura => (

                        <FacturaCard

                            key={factura.factura_id}

                            factura={factura}

                            onVerDetalle={onVerFactura}

                        />

                    ))

                }

            </AccordionDetails>

        </Accordion>

    )

}