import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { DataGrid, GridEditInputCell } from "@mui/x-data-grid";
import {
    Box,
    Grid,
    Typography,
    LinearProgress,
    Chip,
    Card,
    CardContent
} from "@mui/material";
import { GridToolbar } from '@mui/x-data-grid';

const EnviosProgresoEmpaque = () => {

    const { envioId } = useParams();

    const [totalPiezas, setTotalPiezas] = useState(0);
    const [totalPiezasEmpacadas, setTotalPiezasEmpacadas] = useState(0);
    const [facturasEnvio, setFacturasEnvio] = useState([]);
    const [totalOrdenRetiro, setTotalOrdenRetiro] = useState([]);
    const [ordenesProduccionFacturas, setOrdenesProduccionFacturas] = useState([]);
    const [ordenesProduccionRetiros, setOrdenesProduccionRetiros] = useState([]);

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

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

    const fetchPiezasYFacturas = async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/getPiezasYFacturas/${envioId}`);
            setTotalPiezas(Number(response.data.total_piezas || []));
            setTotalPiezasEmpacadas(Number(response.data.total_piezas_empacadas || []));
            setFacturasEnvio(response.data.facturas);
            setTotalOrdenRetiro(response.data.totalOrdenRetiro);
            setOrdenesProduccionFacturas(response.data.ordenesProduccionFacturas);
            setOrdenesProduccionRetiros(response.data.ordenesProduccionRetiros);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al cargar los datos';
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'warning',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
            });
        }
    };

    useEffect(() => {
        fetchPiezasYFacturas();
    }, [apiUrl]);

    const facturasCols = [
        { field: "factura_id", headerName: "#FacturaDB", flex: 1.5 },
        { field: "razon_social", headerName: "Proveedor", flex: 1.5 },
        { field: "numero_factura", headerName: "#Factura", flex: 1 },
        { field: "serie", headerName: "Serie", flex: 1 },
        { field: "folio", headerName: "Folio", flex: 1.5 },
        {
            field: "fecha_factura", headerName: "Fecha Factura", flex: 1.5, valueFormatter: (params) =>
                dayjs(params.value).format("DD/MM/YYYY"),
        },
        {
            field: "fecha_arribo", headerName: "Fecha Arribo", flex: 1.5, valueFormatter: (params) =>
                dayjs(params.value).format("DD/MM/YYYY"),
        },
        {
            field: "total_piezas",
            headerName: "Piezas",
            flex: 1,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0)),
        },
        {
            field: "total_piezas_surtidas",
            headerName: "Piezas Surtidas",
            flex: 1,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0)),
        },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 1.5,
            renderCell: (params) => {
                const total = Number(params.row.total_piezas) || 0;
                const surtidas = Number(params.row.total_piezas_surtidas) || 0;

                const pct = total > 0
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            Math.round((surtidas / total) * 100)
                        )
                    )
                    : 0;

                return (
                    <Box sx={{ width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >
                            <Typography variant="caption">{pct}%</Typography>
                            <Typography variant="caption">
                                {Math.round(surtidas)}/{Math.round(total)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Number(pct)}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    asignada: {
                        label: "Asignada",
                        color: "success",   // gris
                    }
                };

                const status = statusMap[params.value] || {
                    label: params.value,
                    color: "default",
                };

                return (
                    <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                );
            },
        },
    ];

    const ordenesCols = [
        { field: "id", headerName: "#Orden Producción", flex: 1 },
        { field: "producto_id", headerName: "#Producto", flex: 1 },
        { field: "mlm", headerName: "MLM", flex: 1 },
        { field: "title", headerName: "Titulo", flex: 1 },
        { field: "inventory_id", headerName: "ML", flex: 1 },
        { field: "sku", headerName: "SKU", flex: 1 },
        {
            field: "logistic_type", headerName: "Logistica", flex: 1,
            renderCell: (params) => {
                const logisticType = params.value;
                const permitir_full = params.row.permitir_full;
                let color = "default";
                if (logisticType === "fulfillment") {
                    color = "success";
                    params.value = "FULL";
                } else if (logisticType !== "fulfillment" && permitir_full === 1) {
                    color = "error"; // naranja para casos ME con permitir_full activo
                    params.value = "ME > FULL";
                } else if (logisticType !== "fulfillment" && permitir_full === 0) {
                    color = "warning";
                    params.value = "ME";
                }
                return <Chip label={params.value} size="small" color={color} />;
            }
        },
        {
            field: "cantidad_a_producir", headerName: "A Producir", flex: 1, type: "number",
            valueFormatter: (value) => Math.round(value ?? 0)
        },
        {
            field: "cantidad_a_enviar", headerName: "A Enviar", flex: 1, headerAlign: "center", align: "center", type: "number",
            // ✅ SOLO editable si NO está empacada
            editable: (params) => params.row.estatus !== "empacada",

            valueFormatter: (value) => Math.round(Number(value ?? 0)),

            // ✅ SOLO aplicar estilo editable si NO está empacada
            cellClassName: (params) =>
                params.row.estatus !== "empacada" ? "celdaEditable" : "celdaBloqueada",

            renderEditCell: (params) => (
                <GridEditInputCell
                    {...params}
                    value={parseInt(params.value, 10 || 0)}
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    onWheel={(e) => e.target.blur()}
                />
            ),
        },
        { field: "cantidad_empacada", headerName: "Empacada", flex: 1, type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 1.5,
            renderCell: (params) => {
                const enviar = Number(params.row.cantidad_a_enviar) || 0;
                const empacadas = Number(params.row.cantidad_empacada) || 0;

                const pct = enviar > 0
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            Math.round((empacadas / enviar) * 100)
                        )
                    )
                    : 0;

                return (
                    <Box sx={{ width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >
                            <Typography variant="caption">{pct}%</Typography>
                            <Typography variant="caption">
                                {Math.round(empacadas)}/{Math.round(enviar)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Number(pct)}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    recibida: {
                        label: "Recibida",
                        color: "default",   // gris
                    },
                    surtida: {
                        label: "Surtida",
                        color: "warning",   // amarillo
                    },
                    empacada: {
                        label: "Empacada",
                        color: "success",   // verde
                    },
                    cerrada: {
                        label: "Cerrada",
                        color: "secondary",   // red
                    },
                };

                const status = statusMap[params.value] || {
                    label: params.value,
                    color: "default",
                };

                return (
                    <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                );
            },
        },
    ];

    const ordenesProduccionRetirosCols = [
        { field: "id", headerName: "#Orden Producción", flex: 1 },
        { field: "producto_id", headerName: "#Producto", flex: 1 },
        { field: "mlm", headerName: "MLM", flex: 1 },
        { field: "title", headerName: "Titulo", flex: 1 },
        { field: "inventory_id", headerName: "ML", flex: 1 },
        { field: "sku", headerName: "SKU", flex: 1 },
        {
            field: "logistic_type", headerName: "Logistica", flex: 1,
            renderCell: (params) => {
                const logisticType = params.value;
                const permitir_full = params.row.permitir_full;
                let color = "default";
                if (logisticType === "fulfillment") {
                    color = "success";
                    params.value = "FULL";
                } else if (logisticType !== "fulfillment" && permitir_full === 1) {
                    color = "secondary"; // naranja para casos ME con permitir_full activo
                    params.value = "ME > FULL";
                } else if (logisticType !== "fulfillment" && permitir_full === 0) {
                    color = "warning";
                    params.value = "ME";
                }
                return <Chip label={params.value} size="small" color={color} />;
            }
        },
        { field: "cantidad_a_producir", headerName: "A Producir", flex: 1, type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        {
            field: "cantidad_a_enviar", headerName: "A Enviar", flex: 1, headerAlign: "center", align: "center", type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)),
            // renderEditCell: (params) => {
            //     return (
            //         <GridEditInputCell
            //             {...params}
            //             type="number"
            //             inputProps={{
            //                 min: 0, // Establecer el mínimo permitido en el input
            //             }}
            //             onWheel={(e) => e.target.blur()} // Evitar cambios accidentales con la rueda del mouse
            //         />
            //     );
            // },
        },
        { field: "cantidad_empacada", headerName: "Empacada", flex: 1, type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        {
            field: "avance",
            headerName: "Avance",
            flex: 1.5,
            type: "number",
            renderCell: (params) => {
                const enviar = Number(params.row.cantidad_a_enviar) || 0;
                const empacadas = Number(params.row.cantidad_empacada) || 0;

                const pct = enviar > 0
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            Math.round((empacadas / enviar) * 100)
                        )
                    )
                    : 0;

                return (
                    <Box sx={{ width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >
                            <Typography variant="caption">{pct}%</Typography>
                            <Typography variant="caption">
                                {Math.round(empacadas)}/{Math.round(enviar)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Number(pct)}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    recibida: {
                        label: "Recibida",
                        color: "default",   // gris
                    },
                    surtida: {
                        label: "Surtida",
                        color: "warning",   // amarillo
                    },
                    empacada: {
                        label: "Empacada",
                        color: "success",   // verde
                    },
                    cerrada: {
                        label: "Cerrada",
                        color: "secondary",   // red
                    },
                };

                const status = statusMap[params.value] || {
                    label: params.value,
                    color: "default",
                };

                return (
                    <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                );
            },
        },
    ];

    const ordenesDeRetiros = [
        { field: "orden_bodega_id", headerName: "#Orden Bodega", flex: 1 },
        { field: "orden_bodega_descripcion", headerName: "Descripción", flex: 2 },
        {
            field: "fecha_orden", headerName: "Fecha", flex: 1, valueFormatter: (params) =>
                dayjs(params.value).format("DD/MM/YYYY"),
        },
        { field: "total_a_enviar", headerName: "A Enviar", flex: 1, valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        { field: "total_empacado", headerName: "Empacado", flex: 1, valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        {
            field: "avance",
            headerName: "Avance",
            flex: 1.5,
            renderCell: (params) => {
                const pct =
                    Number(params.row.total_a_enviar > 0)
                        ? Math.round(
                            (Number(params.row.total_empacado) / Number(params.row.total_a_enviar)) * 100
                        )
                        : 0;

                return (
                    <Box sx={{ width: "100%" }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >
                            <Typography variant="caption">{Number(pct)}%</Typography>
                            <Typography variant="caption">
                                {Math.round(params.row.total_empacado)}/{Math.round(params.row.total_a_enviar)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Number(pct)}
                            sx={{ height: 6, borderRadius: 4 }}
                        />
                    </Box>
                );
            },
        },
        {
            field: "orden_bodega_estatus",
            headerName: "Estatus",
            flex: 1,
            renderCell: (params) => {
                const statusMap = {
                    abierto: {
                        label: "Abierto",
                        color: "default",   // gris
                    },
                    confirmado: {
                        label: "Confirmado",
                        color: "warning",   // amarillo
                    },
                    procesado: {
                        label: "Procesado",
                        color: "success",   // verde
                    },
                    cancelado: {
                        label: "Cancelado",
                        color: "secondary",   // red
                    },
                };

                const status = statusMap[params.value] || {
                    label: params.value,
                    color: "default",
                };

                return (
                    <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                );
            },
        },
    ]

    const [columnVisibilityOrdenesFacturas, setColumnVisibilityModelOrdenesFacturas] = useState({
        id: false,
        producto_id: false,
        permitir_full: false,
    });

    const [columnVisibilityOrdenesRetiros, setColumnVisibilityModelOrdenesRetiros] = useState({
        id: false,
        producto_id: false,
        permitir_full: false,
    });

    const [columnVisibilityFacturas, setColumnVisibilityModelFacturas] = useState({
        factura_id: false,
    });

    const [columnVisibilityRetiros, setColumnVisibilityModelRetiros] = useState({
        orden_bodega_id: true,
    });

    const processRowUpdate = async (newRow, oldRow) => {
        if (newRow.cantidad_a_enviar < 0) {
            Swal.fire("Valor inválido", "La cantidad no puede ser negativa", "warning");
            return oldRow;
        }

        if (newRow.cantidad_a_enviar < newRow.cantidad_empacada) {
            Swal.fire(
                "Valor inválido",
                "No puede ser menor a la cantidad empacada",
                "warning"
            );
            return oldRow;
        }

        if (newRow.cantidad_a_enviar > oldRow.cantidad_a_producir) {
            Swal.fire(
                "Valor inválido",
                "No puede ser mayor a la cantidad a producir",
                "warning"
            );
            return oldRow;
        }

        if (newRow.cantidad_a_enviar === oldRow.cantidad_a_enviar) {
            return oldRow;
        }

        try {
            await axios.put(
                `${apiUrl}/produccion/actualizar/orden/${newRow.id}/cantidad-a-enviar`,
                {
                    cantidad_a_enviar: newRow.cantidad_a_enviar
                }
            );

            await fetchPiezasYFacturas();

            Swal.fire({
                icon: "success",
                title: "Actualizado",
                text: "Cantidad a enviar actualizada correctamente",
                timer: 1200,
                showConfirmButton: false
            });

            return newRow;
        } catch (error) {
            Swal.fire(
                "Error",
                "No se pudo actualizar la orden",
                "error"
            );
            return oldRow;
        }
    };

    const handleProcessRowUpdateError = (error) => {
        Swal.fire({
            icon: "warning",
            title: "Error",
            text: error.message,
        });
    };

    return (
        <Box p={3}>
            <Typography variant="h4" fontWeight="bold" mb={2}>
                Dashboard de Envío
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            boxShadow: 2,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Envío
                            </Typography>
                            <Typography variant="h6">{envioId}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            boxShadow: 2,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Progreso del envío
                            </Typography>
                            <Typography variant="h6">
                                {totalPiezas > 0
                                    ? Math.round((totalPiezasEmpacadas / totalPiezas) * 100)
                                    : 0}
                                %
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={
                                    totalPiezas > 0
                                        ? (totalPiezasEmpacadas / totalPiezas) * 100
                                        : 0
                                }
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 2,
                            boxShadow: 2,
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Resumen
                            </Typography>
                            <Typography>Total piezas: {totalPiezas}</Typography>
                            <Typography>Empacadas: {totalPiezasEmpacadas}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Typography variant="h6" fontWeight="bold" mb={2}>
                Ordenes de Producción - Facturas
            </Typography>
            <DataGrid
                rows={ordenesProduccionFacturas}
                columns={ordenesCols}
                getRowId={(row) => row.id}
                experimentalFeatures={{ newEditingApi: true }}
                showCellVerticalBorder
                showColumnVerticalBorder
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={handleProcessRowUpdateError}
                isCellEditable={(params) => {
                    if (params.row.estatus === "empacada") return false;
                    if (params.field === "cantidad_a_enviar") return true;

                    return true;
                }}
                columnVisibilityModel={columnVisibilityOrdenesFacturas}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelOrdenesFacturas(newModel)}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                density="compact"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 10, page: 0 } }
                }}
                sx={{ ...dashboardGridSx, mb: 4 }}
                slots={{ toolbar: GridToolbar }}
            />
            <Typography variant="h6" fontWeight="bold" mb={2}>
                Ordenes de Producción - Retiros
            </Typography>
            <DataGrid
                rows={ordenesProduccionRetiros}
                columns={ordenesProduccionRetirosCols}
                getRowId={(row) => row.id}
                showCellVerticalBorder
                showColumnVerticalBorder
                columnVisibilityModel={columnVisibilityOrdenesRetiros}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelOrdenesRetiros(newModel)}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                density="compact"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 10, page: 0 } }
                }}
                sx={{ ...dashboardGridSx, mb: 4 }}
                slots={{ toolbar: GridToolbar }}
            />
            <Typography variant="h6" fontWeight="bold" mb={2}>
                Facturas
            </Typography>
            <DataGrid
                rows={facturasEnvio}
                columns={facturasCols}
                getRowId={(row) => row.factura_id}
                showCellVerticalBorder
                showColumnVerticalBorder
                columnVisibilityModel={columnVisibilityFacturas}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelFacturas(newModel)}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                density="compact"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 10, page: 0 } }
                }}
                sx={{ ...dashboardGridSx, mb: 4 }}
                slots={{ toolbar: GridToolbar }}
            />
            <Typography variant="h6" fontWeight="bold" mb={2}>
                Retiros
            </Typography>
            <DataGrid
                rows={totalOrdenRetiro}
                columns={ordenesDeRetiros}
                getRowId={(row) => row.orden_bodega_id}
                showCellVerticalBorder
                showColumnVerticalBorder
                columnVisibilityModel={columnVisibilityRetiros}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelRetiros(newModel)}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                density="compact"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 10, page: 0 } }
                }}
                sx={{ ...dashboardGridSx, mb: 4 }}
                slots={{ toolbar: GridToolbar }}
            />
        </Box>
    );
}

export default EnviosProgresoEmpaque