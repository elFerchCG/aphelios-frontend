import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Paper,
    Typography
} from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from 'dayjs';
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

const OrdenRetiro = () => {
    const [ordenes, setOrdenes] = useState([]);
    const [selectedOrdenes, setSelectedOrdenes] = useState([]);
    const [envios, setEnvios] = useState([]);
    const [selectedEnvio, setSelectedEnvio] = useState(null);
    const [openEnvioModal, setOpenEnvioModal] = useState(false);
    const [loadingEnvios, setLoadingEnvios] = useState(false);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    const [columnVisibilityOrdenesFacturas, setColumnVisibilityModelOrdenesFacturas] = useState({
        orden_id: false,
        producto_id: false,
        permitir_full: false,
    });

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

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const fetchOrdenes = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/ordenes_retiro_produccion`);
            setOrdenes(res.data.data || []);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error(error);
        }
    };

    useEffect(() => {
        fetchOrdenes();
    }, [apiUrl])

    const fetchEnviosAbiertos = async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchEnviosAbiertos`);
            setEnvios(response.data.data || []);
        } catch (error) {
            setOpenEnvioModal(false);
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

    const handleCloseEnvioModal = () => {
        setOpenEnvioModal(false);
        setSelectedEnvio(null);
    };

    const asignarOrdenes = async () => {
        try {
            await axios.post(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/asignarOrdenesAEnvio`, {
                envio_id: selectedEnvio,
                ordenes_ids: selectedOrdenes
            });

            Swal.fire("Éxito", "Facturas asignadas correctamente", "success");
            handleCloseEnvioModal();
            setSelectedOrdenes([]);
            fetchOrdenes();

        } catch (error) {
            handleCloseEnvioModal();
            Swal.fire(
                "Error",
                error.response?.data?.message || "Error al asignar facturas",
                "error"
            );
        }
    };

    const columns = [
        { field: "orden_bodega_id", headerName: "#Orden Bodega", flex: 0.5 },
        { field: "orden_id", headerName: "#Orden Producción", flex: 0.5 },
        { field: "producto_id", headerName: "#Producto", flex: 0.5 },
        { field: "mlm", headerName: "MLM", flex: 1 },
        { field: "title", headerName: "Titulo", flex: 2 },
        { field: "inventory_id", headerName: "ML", flex: 1 },
        { field: "sku_publicacion", headerName: "SKU", flex: 1 },
        {
            field: "logistic_type", headerName: "Logistica", flex: 0.5,
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
        { field: "cantidad_a_producir", headerName: "A Producir", flex: 0.5, type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        { field: "cantidad_a_enviar", headerName: "A Enviar", flex: 0.5, headerAlign: "center", align: "center", type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        { field: "cantidad_empacada", headerName: "Empacada", flex: 0.5, type: "number", valueFormatter: (value) => Math.round(Number(value ?? 0)), },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 0.5,
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

    const columnsEnvios = [
        { field: "id", headerName: "ID", flex: 0.8 },
        { field: "descripcion", headerName: "Descripción", flex: 2 },
        {
            field: "fecha_creacion",
            headerName: "Fecha de Creación",
            flex: 2,
            valueFormatter: (params) =>
                dayjs(params.value).format("DD/MM/YYYY"),
        },
        {
            field: "fecha_programada",
            headerName: "Fecha Programada",
            flex: 2,
            valueFormatter: (params) =>
                dayjs(params.value).format("DD/MM/YYYY"),
        },
        { field: "estatus", headerName: "Estatus", flex: 1 },
    ];

    return (
        <Box p={2}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                Órdenes de retiro por excedente
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={selectedOrdenes.length === 0}
                    onClick={() => {
                        fetchEnviosAbiertos();
                        setOpenEnvioModal(true);

                    }}
                >
                    Asignar órdenes ({selectedOrdenes.length})
                </Button>
            </Box>
            {/* Tabla de ordenes de retiros */}
            <DataGrid
                rows={ordenes}
                columns={columns}
                getRowId={(row) => row.orden_id}
                experimentalFeatures={{ newEditingApi: true }}
                showCellVerticalBorder
                showColumnVerticalBorder
                checkboxSelection
                onRowSelectionModelChange={(selection) => {
                    setSelectedOrdenes(selection);
                }}
                // rowSelectionModel={selectedOrdenes}
                // processRowUpdate={processRowUpdate}
                // onProcessRowUpdateError={handleProcessRowUpdateError}
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
                loading={loading}
                slotProps={{
                    loadingOverlay: {
                        variant: 'skeleton',
                        noRowsVariant: 'skeleton',
                    },
                }}
            />
            <Dialog
                open={openEnvioModal}
                onClose={handleCloseEnvioModal}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Selecciona un envío para asignar las ordenes seleccionadas
                </DialogTitle>
                <DialogContent sx={{ height: 400 }}>
                    <DataGrid
                        sx={{ height: 350 }}
                        rows={envios}
                        columns={columnsEnvios}
                        getRowId={(row) => row.id}
                        checkboxSelection
                        disableRowSelectionOnClick
                        onRowSelectionModelChange={(selection) => {
                            setSelectedEnvio(selection[0] || null);
                        }}
                        rowSelectionModel={selectedEnvio ? [selectedEnvio] : []}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseEnvioModal}>
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        disabled={!selectedEnvio}
                        onClick={() => {
                            asignarOrdenes();
                        }}
                    >
                        Confirmar asignación
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};


export default OrdenRetiro