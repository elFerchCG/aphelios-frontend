import React, { useEffect, useState } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box, Button, Typography } from '@mui/material';

const VentasME = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('hoy');
    const [subTab, setSubTab] = useState(null);

    const formatearFecha = (fecha) => {
        const date = new Date(fecha);

        return date.toLocaleString('es-MX', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }) + ' hs';
    };

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const getFilteredRows = () => {
        let filtered = [...rows];

        // 🔹 TAB PRINCIPAL
        if (tab === 'hoy') {
            return filtered.filter(r => r.seccion === 'hoy' && r.estado !== 'en_camino');
        }

        if (tab === 'transito') {
            return filtered.filter(r => r.estado === 'en_camino');
        }

        if (tab === 'proximos') {
            filtered = filtered.filter(r => r.seccion === 'proximos');

            if (subTab === 'manana') {
                filtered = filtered.filter(r => r.sub_seccion === 'manana');
            }

            if (subTab === 'futuro') {
                filtered = filtered.filter(r => r.sub_seccion === 'futuro');
            }

            return filtered;
        }

        return filtered;
    };

    useEffect(() => {
        setLoading(true);

        fetch(`${apiUrl}/pedidos/sync-mercado-envios`)
            .then(res => res.json())
            .then(data => {
                setRows(data.data); // 🔥 aquí está el fix
                setLoading(false);
                console.log("Response:", rows);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const surtirVenta = (row) => {
        console.log("Surtir:", row);
        // aquí después descontamos inventario
    };

    const columns = [
        { field: 'id_venta_me', headerName: 'ID venta ME', flex: 1 },
        { field: 'estado', headerName: 'Estado', flex: 1 },
        { field: 'orden_id', headerName: 'Orden', flex: 1 },
        {
            field: 'date_created', headerName: 'Fecha', flex: 1,
            renderCell: (params) => formatearFecha(params.value)
        },
        { field: 'shipment_id', headerName: 'Shipment', flex: 2 },
        { field: 'sku', headerName: 'SKU', flex: 2 },
        { field: 'title', headerName: 'Titulo', flex: 1 },
        { field: 'cantidad', headerName: 'Cantidad', flex: 1 },
        { field: 'logistic_type', headerName: 'Logística', flex: 1 },
        { field: 'localidad_sugerida', headerName: 'Ubicación sugerida', flex: 1 },
        {
            field: 'acciones',
            headerName: 'Acciones',
            flex: 1,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => surtirVenta(params.row)}
                >
                    Surtir
                </Button>
            )
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

    const [columnVisibilityVentasME, setColumnVisibilityVentasME] = useState({
        id_venta_me: false,
        producto_id: false,
        permitir_full: false,
        shipment_id: false,
        logistic_type: false,
    });

    return (
        <Box p={3}>
            <Typography variant="h4" fontWeight="bold" mb={2}>
                Ventas Mercado Envíos
            </Typography>
            <Box display="flex" gap={2} mb={2}>
                <Button
                    variant={tab === 'hoy' ? 'contained' : 'outlined'}
                    onClick={() => { setTab('hoy'); setSubTab(null); }}
                >
                    Envíos de hoy
                </Button>

                <Button
                    variant={tab === 'proximos' ? 'contained' : 'outlined'}
                    onClick={() => { setTab('proximos'); setSubTab(null); }}
                >
                    Próximos días
                </Button>

                <Button
                    variant={tab === 'transito' ? 'contained' : 'outlined'}
                    onClick={() => { setTab('transito'); setSubTab(null); }}
                >
                    En tránsito
                </Button>
            </Box>
            {tab === 'proximos' && (
                <Box display="flex" gap={2} mb={3}>

                    <Box
                        p={2}
                        sx={{ border: '1px solid #ddd', borderRadius: 2, cursor: 'pointer', backgroundColor: subTab === 'manana' ? '#e3f2fd' : '#fff' }}
                        onClick={() => setSubTab('manana')}
                    >
                        <Typography fontWeight="bold">Colecta | Mañana</Typography>
                        <Typography variant="body2">Etiquetas por imprimir</Typography>
                    </Box>

                    <Box
                        p={2}
                        sx={{ border: '1px solid #ddd', borderRadius: 2, cursor: 'pointer', backgroundColor: subTab === 'futuro' ? '#e3f2fd' : '#fff' }}
                        onClick={() => setSubTab('futuro')}
                    >
                        <Typography fontWeight="bold">Colecta | A partir de...</Typography>
                        <Typography variant="body2">En procesamiento</Typography>
                    </Box>

                </Box>
            )}
            <DataGrid
                rows={getFilteredRows()}
                columns={columns}
                getRowId={(row) => row.id_venta_me}
                showCellVerticalBorder
                showColumnVerticalBorder
                columnVisibilityModel={columnVisibilityVentasME}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityVentasME(newModel)}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                density="comfortable"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 100, page: 0 } }
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
        </Box>
    );
};

export default VentasME;