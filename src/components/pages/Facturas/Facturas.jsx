import { Tooltip } from '@mui/material'
import { DataGrid, GridActionsCellItem, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import DetailsIcon from '@mui/icons-material/Details';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs'; 
import BreadcrumbsNav from './BreadcrumbsNav';

const Facturas = () => {
    const [data, setData] = useState([]);
    const [facturaId, setFacturaId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [filteredEnvios, setFilteredEnvios] = useState([]);
    const navigate = useNavigate();
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: true,
        descripcion: true,
        estatus: true
    });

    const apiUrl = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;

    const CustomToolbar = () => (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector />
            <GridToolbarExport csvOptions={{ fileName: "exported_data", utf8WithBom: true }} />
        </GridToolbarContainer>
    );

    useEffect(() => {
        fetchFacturas();
    }, [apiUrl]);

    const fetchFacturas = async () => {
        try {
            const response = await axios.get(`${apiUrl}/facturas/`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setData(response.data.data);
                //setFilteredEnvios(response.data.data);
            }
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
        } finally {
            setLoading(false);
        }
    };


    const handleDetallesFactura = (facturaId, proveedorNombre) => {
        navigate(`/detalleFacturas/factura/${facturaId}`, {
            state: { proveedorNombre } // así lo mandas al otro componente
        });
    };

    const columns = [
        { field: "fecha", headerName: "Fecha", type: "text", flex: 1, align: "center", headerAlign: "center" },
        { field: 'proveedor_nombre', headerName: "Proveedor", type: "text", flex: 1, align: "center", headerAlign: "center" },
        { field: 'folio', headerName: "Numero de Factura", type: "text", flex: 1, align: "center", headerAlign: "center" },
        { field: 'total', headerName: "total", type: "number", flex: 1, align: "center", headerAlign: "center" },
        { field: 'estatus', headerName: "Estatus", type: "text", flex: 1, align: "center", headerAlign: "center" },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => [
                <Tooltip title="Detalles" key={`envios-${params.row.id}`}>
                    <GridActionsCellItem
                        icon={<DetailsIcon />}
                        sx={{ color: "blue" }}
                        label='Detalles'
                        onClick={() => handleDetallesFactura(params.row.id, params.row.proveedor_nombre)}
                    />
                </Tooltip>
            ]
        }
    ];

    return (
        <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
            <div style={{
                flexDirection: "row",
                fontFamily: "Montserrat",
                textAlign: "center",
                width: "90%",
                height: 500
            }}
            >
                <h2>Facturas</h2>
                <BreadcrumbsNav />
                <DataGrid sx={{ borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5" }}
                    rows={data}
                    columns={columns}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.id}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    experimentalFeatures={{ newEditingApi: true }}
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                    slots={{ toolbar: CustomToolbar }}
                />
            </div>
        </div>
    )
}

export default Facturas