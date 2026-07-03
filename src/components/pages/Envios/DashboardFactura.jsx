import axios from 'axios';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    IconButton,
    Button,
    Chip,
    Tooltip
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export default function DashboardFactura({ factura, onBack }) {
    // Almacenará las líneas obtenidas de: factura_detalle -> envio -> orden_produccion_detalle
    const [lineasDetalle, setLineasDetalle] = useState([]);
    const [loading, setLoading] = useState(false);

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    useEffect(() => {
        console.log("Datos de la factura recibidos en el Dashboard:", factura);
        if (factura?.factura_id && factura?.envioId) {

            // Aquí haces tu llamada a la API con el ya conocido camino:
            // factura_detalle -> orden_produccion_detalle
            obtenerDetalleFactura();
        } else {
            console.warn("Faltan parámetros críticos:", {
                factura_id: factura?.factura_id,
                envioId: factura?.envioId
            });
        }
    }, [factura]);

    const obtenerDetalleFactura = async () => {
        setLoading(true);
        try {
            // Reemplaza '/api' por tu prefijo de servidor o variable de entorno real
            const response = await axios.get(`${apiUrl}/empaque/${factura.factura_id}/progreso-envio/${factura.envioId}`);
            setLineasDetalle(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Cálculos para las Tarjetas KPI Superiores
    const totalFacturado = lineasDetalle.reduce((acc, curr) => acc + (Number(curr.cantidad_facturada) || 0), 0);
    const totalSurtido = lineasDetalle.reduce((acc, curr) => acc + (Number(curr.cantidad_surtida) || 0), 0);
    const diferenciaTotal = totalFacturado - totalSurtido;
    const porcentajeGlobal = totalFacturado > 0 ? Math.round((totalSurtido / totalFacturado) * 100) : 0;

    // Columnas del Detalle del Dashboard
    const detalleCols = [
        { field: "sku", headerName: "SKU", flex: 1.5, minWidth: 120 },
        { field: "descripcion", headerName: "Descripción", flex: 2.5, minWidth: 200 },
        {
            field: "cantidad_facturada",
            headerName: "Enviar",
            type: "number",
            flex: 1.2,
            valueFormatter: (value) => Math.round(Number(value ?? 0))
        },
        {
            field: "cantidad_surtida",
            headerName: "Procesadas",
            type: "number",
            headerAlign: "center",
            flex: 1.5,
            renderCell: (params) => {
                const facturada = Number(params.row.cantidad_facturada) || 0;
                const surtida = Number(params.row.cantidad_surtida) || 0;
                const pct = facturada > 0 ? Math.min(100, Math.round((surtida / facturada) * 100)) : 0;

                return (
                    <Box sx={{ width: "100%", display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="caption" fontWeight="600">{pct}%</Typography>
                            <Typography variant="caption" color="text.secondary">{surtida} / {facturada}</Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={pct}
                            color={pct === 100 ? "success" : pct > 0 ? "warning" : "error"}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            }
        },
        {
            field: "diferencia",
            headerName: "Diferencias",
            type: "number",
            headerAlign: "center",
            flex: 1.2,
            renderCell: (params) => {
                const dif = (Number(params.row.cantidad_facturada) || 0) - (Number(params.row.cantidad_surtida) || 0);
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Chip
                            label={dif === 0 ? "Completo" : `${dif} pzas`}
                            color={dif === 0 ? "success" : "error"}
                            variant={dif === 0 ? "light" : "filled"}
                            size="small"
                            icon={dif === 0 ? <CheckCircleIcon /> : <WarningIcon />}
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>
                );
            }
        }
    ];

    const dashboardGridSx = {
        border: "none",
        "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f5f7fa",
            fontWeight: "bold",
            fontSize: 13,
        },
        "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #eee",
            fontSize: 13,
        },
        "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f9fafb",
        },
    };

    return (
        <Box sx={{ p: 1 }}>
            {/* Encabezado con Botón de Regreso */}
            <Box sx={{ mb: 3 }}>
                <Box>
                    <Typography
                        variant="h5"
                        fontWeight="bold"
                        color="primary"
                    >
                        Factura Activa
                    </Typography>
                    <Typography variant="body1">

                        Factura:

                        <b>{factura.numero_factura}</b>

                        &nbsp;&nbsp;|&nbsp;&nbsp;

                        Proveedor:

                        <b>{factura.razon_social}</b>

                        &nbsp;&nbsp;|&nbsp;&nbsp;

                        Serie:

                        <b>{factura.serie}</b>

                        &nbsp;&nbsp;|&nbsp;&nbsp;

                        Folio:

                        <b>{factura.folio}</b>

                    </Typography>
                </Box>
            </Box>

            {/* Tarjetas de Resumen KPI */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderLeft: '5px solid #2196f3' }}>
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                            <Typography color="text.secondary" variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>Total Facturado</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{totalFacturado}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderLeft: '5px solid #4caf50' }}>
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                            <Typography color="text.secondary" variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>Total Surtido</Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mt: 1 }}>{totalSurtido}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ borderLeft: '5px solid #f44336' }}>
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                            <Typography color="text.secondary" variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>Diferencia Por Enviar</Typography>
                            <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ mt: 1 }}>{diferenciaTotal}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2} sx={{ bgcolor: 'action.hover' }}>
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                            <Typography color="text.secondary" variant="caption" fontWeight="bold">Avance Global</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{porcentajeGlobal}%</Typography>
                            <LinearProgress variant="determinate" value={porcentajeGlobal} color="primary" sx={{ mt: 1, borderRadius: 2 }} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabla Detalle de SKUs */}
            <Typography variant="h6" fontWeight="bold" mb={2}>
                SKUs pendientes de surtir
            </Typography>
            <DataGrid
                rows={lineasDetalle}
                columns={detalleCols}
                getRowId={(row) => row.id} // Cambiar por tu llave primaria real (ej. orden_produccion_detalle_id)
                showCellVerticalBorder
                showColumnVerticalBorder
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                density="compact"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 100, page: 0 } }
                }}
                sx={dashboardGridSx}
                slots={{ toolbar: GridToolbar }}
                loading={loading}
                slotProps={{
                    loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
                }}
            />
        </Box>
    );
}