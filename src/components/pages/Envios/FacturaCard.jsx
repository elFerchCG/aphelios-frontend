import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Stack,
    Typography
} from "@mui/material";

import DescriptionIcon from "@mui/icons-material/Description";

export default function FacturaCard({

    factura,
    onVerDetalle

}) {

    return (

        <Card
            elevation={2}
            sx={{
                height: "60px",
                mb: 1,
                borderRadius: 4,
                transition: ".2s",
                "&:hover": {
                    boxShadow: 6,
                    transform: "translateY(-2px)"
                }
            }}
        >

            <CardContent>

                <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    alignContent="center"
                >

                    {/* Factura */}

                    <Grid item xs={6} md={5}>

                            <Typography
                                fontWeight="bold"
                            >

                                <DescriptionIcon
                                    sx={{
                                        mr: 1,
                                        verticalAlign: "middle"
                                    }}
                                />

                                {factura.serie}-{factura.folio} | {factura.razon_social}

                            </Typography>

                    </Grid>

                    {/* Líneas */}

                    <Grid item xs={6} md={2}>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >

                            Líneas: {factura.total_lineas}

                        </Typography>

                    </Grid>

                    {/* Piezas */}

                    <Grid item xs={6} md={2}>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >

                            Piezas: {factura.total_piezas}

                        </Typography>

                    </Grid>

                    <Grid
                        item
                        xs={12}
                        md={3}
                        textAlign="right"
                        mt="-5px"
                    >

                        <Button

                            variant="contained"
                            

                            onClick={() => {
                                onVerDetalle(factura)
                            }}

                        >

                            Ver detalle

                        </Button>

                    </Grid>

                </Grid>

            </CardContent>

        </Card>

    );

}