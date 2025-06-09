import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
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
        producto_id: false,
        orden_id: false,
        cantidad_total: false,
        variation_desc: false,
        nombre_surtidor: false,
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
                        escaneo_cantidad: item.escaneo_cantidad || item.caja_escaneo_cantidad
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


    // Columnas DataGrid Resumen
    const columnsResumen = [
        { field: "envio_id", headerName: "# Envío", type: "number", flex: 0.3, align: "left", headerAlign: "left" },
        { field: "escaneo_id", headerName: "# Escaneo", type: "text", flex: 1, align: "center", headerAlign: "center" },
        {
            field: "escaneo_cantidad",
            headerName: "Cantidad Escaneada",
            type: 'text',
            flex: 0.5,
            align: "center",
            headerAlign: "center",
        },
        {
            field: "producto_id",
            headerName: "# Producto",
            type: 'text',
            flex: 0.5,
            align: "center",
            headerAlign: "center",
        },
        { field: 'inventory_id', headerName: "ML", type: "text", flex: 1, align: "center", headerAlign: "center" },
        { field: 'sku_componente', headerName: "SKU (#Parte)", type: "text", flex: 1, align: "center", headerAlign: "center" },
        { field: 'sku', headerName: "SKU", type: "text", flex: 1.5, align: "center", headerAlign: "center" },
        { field: 'title', headerName: "Titulo", type: "text", flex: 3, align: "center", headerAlign: "center" },
        { field: 'variation_desc', headerName: "Variante", type: "text", flex: 0.5, align: "center", headerAlign: "center" },
        { field: 'orden_id', headerName: "# Orden P", type: "text", flex: 0.5, align: "center", headerAlign: "center" },
        { field: 'cantidad_a_producir', headerName: "Enviar", type: "text", flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'cantidad_billete', headerName: "Factura", type: "text", flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'cantidad_surtida', headerName: "Piezas\nProcesadas", type: "text", flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'nombre_surtidor', headerName: "Surtío", type: "text", flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'nombre_operador', headerName: "Asignado", type: "text", flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'cantidad_empacada', headerName: "Cantidad\nEmpacada", type: "text", flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center' },
        { field: 'orden_estatus', headerName: "Estatus\nOrden", type: "text", flex: 0.7, headerClassName: 'header-wrap', headerAlign: 'center', align: "center" },
    ];

    return (
        <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
            <div style={{
                flexDirection: "row",
                fontFamily: "Montserrat",
                fontWeight: "bold",
                textAlign: "center",
                width: "98%",
                height: 500
            }}
            >
                <h2>Control de producción envío: {envioId}</h2>
                <DataGrid sx={{
                    borderRadius: 4,
                    boxShadow: 24,
                    borderWidth: 3,
                    borderColor: "#1e88e5",
                    fontFamily: "Montserrat",
                    fontWeight: "bold"
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
                />
            </div>
        </div>
    )
}

export default ResumenEnvio