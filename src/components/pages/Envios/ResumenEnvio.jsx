import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';


const ResumenEnvio = () => {
    const { envioId } = useParams();
    const [data, setData] = useState([]);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: false,
        envio_id: false,
        escaneo_id: false,
        descripcion: true,
        estatus: true,
        orden_id: false,
        cantidad_total: true,
        variation_desc: false,
        nombre_surtidor: false,
        producto_id: false,
    });

    const apiUrl = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;

    useEffect(() => {
        const fetchResumenEnvio = async () => {
            try {
                const response = await axios.get(`${apiUrl}/empaque/resumenEnvio/${envioId}`);
                if (response.data.ok) {
                    const dataWithIds = response.data.data.map((item, index) => ({
                        ...item,
                        id: index + 1, // ID basado en posición
                        escaneo_id: item.escaneo_id || item.caja_escaneo_id,
                        escaneo_cantidad: item.cantidad_total || item.cantidad_cajas_escaneos
                    }));
                    setData(dataWithIds);
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Error al obtener datos";
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
        fetchResumenEnvio();
    }, [envioId, apiUrl]);

    const ordenesRepetidas = useMemo(() => {
        const ordenIdCounts = {};
        data.forEach(row => {
            if (row.orden_id != null) {
                ordenIdCounts[row.orden_id] = (ordenIdCounts[row.orden_id] || 0) + 1;
            }
        });

        return new Set(
            Object.entries(ordenIdCounts)
                .filter(([_, count]) => count > 1)
                .map(([orden_id]) => Number(orden_id))
        );
    }, [data]);

    // Columnas DataGrid Resumen
    const columnsResumen = [
        { field: "envio_id", headerName: "# Envío", type: "number", minWidth: 100, flex: 0.3, align: "left", headerAlign: "left" },
        { field: "escaneo_id", headerName: "# Escaneo", type: "text", minWidth: 100, flex: 1, align: "center", headerAlign: "center" },
        {
            field: "escaneo_cantidad",
            headerName: "Cantidad\nEscaneada",
            type: 'text',
            minWidth: 120,
            flex: 0.5,
            headerClassName: 'header-wrap',
            align: "center",
            headerAlign: "center",
        },
        {
            field: "producto_id",
            headerName: "# Producto",
            type: 'text',
            minWidth: 100,
            flex: 0.5,
            align: "center",
            headerAlign: "center",
        },
        { field: 'inventory_id', headerName: "ML", type: "text", minWidth: 150, flex: 1, align: "center", headerAlign: "center" },
        { field: 'sku_componente', headerName: "SKU (#Parte)", type: "text", minWidth: 200, flex: 1, align: "center", headerAlign: "center" },
        { field: 'sku', headerName: "SKU", type: "text", minWidth: 250, flex: 1.5, align: "left", headerAlign: "center" },
        { field: 'title', headerName: "Titulo", type: "text", minWidth: 550, flex: 3, align: "left", headerAlign: "center" },
        { field: 'variation_desc', headerName: "Variante", type: "text", flex: 0.5, align: "center", headerAlign: "center" },
        { field: 'orden_id', headerName: "# Orden P", type: "text", minWidth: 120, flex: 0.5, align: "center", headerAlign: "center" },
        { field: 'cantidad_a_enviar', headerName: "Enviar", type: "text", minWidth: 80, flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'cantidad_a_producir', headerName: "Factura", type: "text", minWidth: 80, flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'cantidad_surtida', headerName: "Piezas\nProcesadas", type: "text", minWidth: 120, flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'cantidad_empacada', headerName: "Cantidad\nEmpacada", type: "text", minWidth: 120, flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'nombre_surtidor', headerName: "Surtío", type: "text", minWidth: 80, flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'nombre_operador', headerName: "Asignado", type: "text", minWidth: 120, flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'estatus', headerName: "Estatus\nOrden", type: "text", minWidth: 120, flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center', align: "center" },
    ];

    return (
        <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
            <div style={{
                width: "98%",
                height: 500,
                overflowX: "auto",
                minWidth: "98%",
                display: "flex",
                flexDirection: "column"
            }}
            >
                <h2>Control de producción envío: {envioId}</h2>
                <DataGrid sx={{
                    borderRadius: 4,
                    boxShadow: 24,
                    borderWidth: 3,
                    borderColor: "#1e88e5",
                    fontFamily: "Montserrat",
                    fontWeight: "bold",
                    minWidth: "98%",
                    '& .fila-repetida': {
                        backgroundColor: '#FFF9C4' // Amarillo claro, puedes cambiarlo
                    }
                }}
                    rows={data}
                    columns={columnsResumen}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.id}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    experimentalFeatures={{ newEditingApi: true }}
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                    getRowClassName={(params) =>
                        ordenesRepetidas.has(Number(params.row.orden_id)) ? 'fila-repetida' : ''
                    }
                />
            </div>
        </div>
    )
}

export default ResumenEnvio