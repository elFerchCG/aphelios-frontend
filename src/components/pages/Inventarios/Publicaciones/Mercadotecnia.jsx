import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2';
import {
    Chip,
    MenuItem,
    Select,
    Box,
} from '@mui/material';


const ESTATUS_OPTIONS = [
    { value: 'sin accion', label: 'Sin acción', color: 'default' },
    { value: 'en procesos', label: 'En procesos', color: 'warning' },
    { value: 'publicado', label: 'Publicado', color: 'success' },
];

const renderEstatusChip = (value) => {
    const option = ESTATUS_OPTIONS.find(opt => opt.value === value) || ESTATUS_OPTIONS[0];

    return (
        <Chip
            label={option.label}
            color={option.color}
            variant="outlined"
            size="small"
            icon={option.color === 'success' ? <span>✔</span> : option.color === 'warning' ? <span>⏳</span> : <span>⚪</span>}
        />
    );
};

const Mercadotecnia = () => {
    const [data, setData] = useState([]);
    const [cellModesModel, setCellModesModel] = useState({});
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        id: true,
    });

    const apiUrl = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;

    useEffect(() => {
        const fetchResumenEnvio = async () => {
            try {
                const response = await axios.get(`${apiUrl}/empaque/componentesNuevos`);
                if (response.data.ok) {
                    setData(response.data.data);
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
    }, [apiUrl]);

    const handleEstatusChange = (id, newValue) => {
        const updated = data.map(row => (row.id === id ? { ...row, estatus: newValue } : row));
        setData(updated);

        // Si deseas actualizar en backend:
        // axios.put(`${apiUrl}/ruta/update-estatus`, { id, estatus: newValue })
        //     .catch(() => {
        //         Swal.fire('Error', 'No se pudo actualizar estatus', 'error');
        //     });
    };

    // Columnas DataGrid Resumen
    const columnsResumen = [
        { field: "id", headerName: "# Linea Factura", type: "number", flex: 0.5, align: "left", headerAlign: "left" },
        { field: "sku", headerName: "SKU", type: "number", flex: 1, align: "left", headerAlign: "left" },
        {
            field: "estatus",
            headerName: "Estatus",
            flex: 0.5,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => renderEstatusChip(params.value),
            renderEditCell: (params) => (
                <Select
                    fullWidth
                    value={params.value || 'sin accion'}
                    onChange={(event) => {
                        const newValue = event.target.value;
                        const updated = data.map(row =>
                            row.id === params.id ? { ...row, estatus: newValue } : row
                        );
                        setData(updated);
                    }}
                    variant="standard"
                >
                    {ESTATUS_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            ),
            editable: true,
        },
    ];

    const handleProcessRowUpdate = (newRow, oldRow) => {
        const updatedRows = data.map((row) =>
            row.id === oldRow.id ? { ...row, estatus: newRow.estatus } : row
        );
        setData(updatedRows);
        return newRow;
    };


    return (
        <div style={{ display: "flex", justifyContent: "center", fontFamily: "Montserrat", fontWeight: "bold" }}>
            <div style={{
                flexDirection: "row",
                fontFamily: "Montserrat",
                fontWeight: "bold",
                textAlign: "center",
                width: "50%",
                height: 500,
            }}
            >
                <h2>Componentes nuevos en facturas</h2>
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
                    cellModesModel={cellModesModel}
                    onCellModesModelChange={(newModel) => setCellModesModel(newModel)}
                    checkboxSelection
                    disableRowSelectionOnClick
                    getRowId={(row) => row.id}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    processRowUpdate={handleProcessRowUpdate}
                    experimentalFeatures={{ newEditingApi: true }}
                    editMode="cell"  // Habilita edición de celdas individuales
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                />
            </div>
        </div>
    )
}

export default Mercadotecnia