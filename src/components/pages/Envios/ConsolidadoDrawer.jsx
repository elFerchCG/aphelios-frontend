import {
    Drawer,
    Box,
    Typography,
    CircularProgress
} from "@mui/material";

import { useEffect, useState } from "react";
import axios from "axios";

import ProductoRow from "./ProductoRow";

export default function ConsolidadoDrawer({

    open,
    onClose,
    envioId,
    proforma

}) {

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        if (!open || !proforma) return;

        cargar();

    }, [open, proforma]);

    const cargar = async () => {

        setLoading(true);

        try {

            const { data } = await axios.get(

                `${apiUrl}/empaque/proformas/${proforma.proforma_id}/envios/${envioId}/consolidado`

            );

            setProductos(data.data);

        } catch (err) {

            console.error(err);

        }

        setLoading(false);

    };

    return (

        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: "95%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "#f5f7fa"
                }
            }}
        >

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0
                }}
            >

                {/* HEADER */}

                <Box
                    sx={{
                        px: 3,
                        py: 1.5,
                        borderBottom: "1px solid #e0e0e0",
                        bgcolor: "white",
                        flexShrink: 0
                    }}
                >

                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        Consolidado de Producción
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >

                        Proforma #{proforma?.proforma_id} • Envío #{envioId}

                    </Typography>

                </Box>


                {/* CONTENIDO */}

                <Box
                    sx={{
                        flex: 1,
                        overflow: "auto",
                        minHeight: 0,
                        p: 2
                    }}
                >

                    {

                        loading ?

                            <Box
                                display="flex"
                                justifyContent="center"
                                mt={5}
                            >

                                <CircularProgress />

                            </Box>

                            :

                            productos.map((producto) => (

                                <ProductoRow
                                    key={producto.producto_id}
                                    producto={producto}
                                />

                            ))

                    }

                </Box>

            </Box>

        </Drawer>

    );

}