import { useEffect, useState } from "react";

import axios from "axios";

import {

    Drawer,
    Box,
    Typography,
    IconButton,
    Divider,
    Chip,
    Tooltip

} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { DataGrid, GridToolbar } from "@mui/x-data-grid";

const apiUrl =
    process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_API_URL
        : process.env.REACT_APP_API_URL_LOCAL;

export default function FacturaDrawer({

    open,
    factura,
    envioId,
    onClose

}) {

    const [loading, setLoading] = useState(false);

    const [detalle, setDetalle] = useState([]);

    useEffect(() => {

        if (!open || !factura) return;

        obtenerDetalleFactura();

    }, [open, factura]);

    const obtenerDetalleFactura = async () => {

        try {

            setLoading(true);

            const response = await axios.get(

                `${apiUrl}/empaque/${factura.factura_id}/progreso-envio/${envioId}`

            );

            setDetalle(response.data.data);

        }

        catch (error) {

            console.error(error);

        }

        finally {

            setLoading(false);

        }

    };

    const columns = [

        {

            field: "sku",

            headerName: "SKU",

            width: 180

        },

        {

            field: "descripcion",

            headerName: "Descripción",

            flex: 1

        },

        {

            field: "cantidad_facturada",

            headerName: "Facturada",

            width: 130,

            type: "number"

        },

        {

            field: "cantidad_a_enviar",

            headerName: "Enviar",

            width: 190,

            type: "number",

            renderCell: (params) => {

                const facturada = Number(params.row.cantidad_facturada) || 0;
                const aEnviar = Number(params.row.cantidad_a_enviar) || 0;
                const cubiertaExcedente = Number(params.row.cantidad_cubierta_excedente) || 0;

                const cubierto = (aEnviar > facturada && cubiertaExcedente > 0)
                    ? Math.min(aEnviar - facturada, cubiertaExcedente)
                    : 0;

                return (

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            height: "100%"
                        }}
                    >

                        <Typography variant="body2">
                            {aEnviar}
                        </Typography>

                        {cubierto > 0 && (

                            <Tooltip
                                title={`De esta línea llegaron ${facturada}. Se completan ${cubierto} más con stock interno de componentes (excedente). Total a enviar: ${aEnviar}.`}
                            >

                                <Chip
                                    icon={<Inventory2Icon sx={{ fontSize: 14 }} />}
                                    label={`+${cubierto}`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: 11 }}
                                />

                            </Tooltip>

                        )}

                    </Box>

                );

            }

        },

        {

            field: "cantidad_contada",

            headerName: "Procesado",

            width: 130,

            type: "number"

        },

        {

            field: "diferencia",

            headerName: "Pendiente",

            width: 130,

            type: "number"

        }

    ];

    return (

        <Drawer

            anchor="right"

            open={open}

            onClose={onClose}

            PaperProps={{

                sx: {

                    width: "80vw"

                }

            }}

        >

            <Box p={3}>

                <Box

                    display="flex"

                    justifyContent="space-between"

                    alignItems="center"

                >

                    <Box>

                        <Typography

                            variant="h5"

                            fontWeight="bold"

                        >

                            Factura {factura?.serie}-{factura?.folio}

                        </Typography>

                        <Typography

                            color="text.secondary"

                        >

                            {factura?.razon_social}

                        </Typography>

                    </Box>

                    <IconButton

                        onClick={onClose}

                    >

                        <CloseIcon />

                    </IconButton>

                </Box>

                <Divider sx={{ my: 2 }} />

                <DataGrid

                    rows={detalle}

                    columns={columns}

                    getRowId={(row) => row.id}

                    density="compact"

                    loading={loading}

                    disableRowSelectionOnClick

                    showCellVerticalBorder

                    showColumnVerticalBorder

                    pageSizeOptions={[25, 50, 100]}

                    initialState={{

                        pagination: {

                            paginationModel: {

                                pageSize: 25,

                                page: 0

                            }

                        }

                    }}

                    slots={{

                        toolbar: GridToolbar

                    }}

                    sx={{

                        height: "calc(100vh - 180px)"

                    }}

                />

            </Box>

        </Drawer>

    );

}