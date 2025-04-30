import { Typography } from '@mui/material';
import { GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import Swal from 'sweetalert2';
import '../Inventarios/estilosPrueba.css'
import { useParams } from 'react-router-dom';


const Empaque = () => {
    const { envioId, cajaId } = useParams();  // Aquí obtienes ambos parámetros
    const [data, setData] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: true,
        inventory_id: true,
        orden: false,
        cantidad: true,
        sku: true,
        title: true,
    });

    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('token'));
            setUser(JSON.parse(localStorage.getItem('user')));
        };

        // Añadir un listener para el evento `storage`
        window.addEventListener('storage', handleStorageChange);

        // Limpieza al desmontar el componente
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const CustomToolbar = () => (
        <GridToolbarContainer>
            {/* Mantener solo los botones necesarios */}
            <GridToolbarColumnsButton />  {/* Botón de Columnas */}
            <GridToolbarFilterButton />   {/* Botón de Filtros */}
            <GridToolbarDensitySelector />{/* Botón de Densidad */}
            <GridToolbarExport
                csvOptions={{
                    fileName: "exported_data",
                    utf8WithBom: true, // 👈 Esto garantiza que la codificación sea UTF-8
                }}
            />
        </GridToolbarContainer>
    );

    useEffect(() => {
        const fetchEscaneos = async () => {
            try {
                const response = await axios.get(`${apiUrl}/empaque/fetchEscaneosCerrada/${cajaId}`);
                const result = response.data.data;
                if (Array.isArray(result) && result.length > 0) {
                    setData(result);
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message;
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

        if (cajaId) {
            fetchEscaneos(); // Se ejecuta al montar con el cajaId
        }
    }, [cajaId]);


    const columns = [
        { field: "id", headerName: "# Registro", type: "number", flex: 1 },
        { field: "inventory_id", headerName: "ML", type: "text", flex: 2 },
        { field: "orden", headerName: "# Orden", type: "text", flex: 1 },
        { field: "cantidad", headerName: "Cantidad", type: "number", flex: 1 },
        { field: "sku", headerName: "SKU", type: "text", flex: 2 },
        { field: "title", headerName: "Descripción", type: "text", flex: 3 }
        //{ field: "actions", headerName: "Acciones", type: "actions" }
    ]

    const totalCantidad = data.reduce((acc, row) => acc + Number(row.cantidad || 0), 0);

    return (
        <div>
            <div className='DataG' style={{ height: 500, width: "90%", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold", marginTop: "-10px" }}>
                    <h1>Empaque</h1>
                </div>
                <div style={{ position: "absolute", top: "20px", right: "0", display: "flex", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold" }}># Envio:</Typography>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", color: "red" }}>{envioId}</Typography>
                </div>
                <div style={{ position: "absolute", top: "60px", right: "0", display: "flex", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", marginTop: "5px" }}># Caja:</Typography>
                    <Typography variant='h6' sx={{ fontFamily: "Montserrat", fontWeight: "bold", color: "blue", marginTop: "5px" }}>{cajaId}</Typography>
                </div>
                <DataGrid sx={{ marginTop: 2, borderRadius: 4, boxShadow: 24, borderWidth: 3, borderColor: "#1e88e5", fontFamily: "Montserrat", fontWeight: "bold" }}
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
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontFamily: "Montserrat", fontWeight: "bold" }}>
                    <h3>TOTAL CAJA: {totalCantidad}</h3>
                </div>
            </div>
        </div>
    )
}

export default Empaque