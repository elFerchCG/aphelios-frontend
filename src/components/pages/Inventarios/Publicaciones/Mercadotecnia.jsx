import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2';
import {
    Chip,
    MenuItem,
    Select,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    InputAdornment,
} from '@mui/material';


const ESTATUS_OPTIONS = [
    { value: 'nuevo', label: 'Nuevo', color: 'default' },
    { value: 'en proceso', label: 'En proceso', color: 'warning' },
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

    // Estado para controlar apertura del modal
    const [modalOpen, setModalOpen] = useState(false);
    // Guarda el id del registro que está cambiando a 'en proceso'
    const [selectedRowId, setSelectedRowId] = useState(null);

    // Estado para el TextField en modal, con inicio "MLM"
    const [codigo, setCodigo] = useState("MLM");

    const apiUrl = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_LOCAL;

    // Declaración fuera del useEffect
    const fetchResumenEnvio = async () => {
        try {
            const response = await axios.get(`${apiUrl}/facturas/componentesNuevos/get`);
            if (response.data.ok) {
                setData(response.data.data);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error al obtener datos";
            console.log("Error:", errorMessage);
            // Swal.fire({
            //     title: 'Error',
            //     text: errorMessage,
            //     icon: 'warning',
            //     timer: 5000,
            //     showCloseButton: true,
            //     allowEscapeKey: true,
            // });
        }
    };

    // useEffect solo llama la función
    useEffect(() => {
        fetchResumenEnvio();
    }, [apiUrl]);


    const asignarMlm = async (id) => {
        try {
            await axios.put(`${apiUrl}/facturas/asignarMlm/${id}`, {
                numero_publicacion: codigo
            });

            // Actualizamos localmente si fue exitoso
            const updated = data.map(row =>
                row.id === id ? { ...row, estatus: 'en proceso', codigo } : row
            );
            setData(updated);
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
    }

    const handleEstatusChange = (id, newValue) => {
        if (newValue === 'en proceso') {
            setSelectedRowId(id);
            setCodigo("MLM"); // Reiniciar código cada vez que se abre modal
            setModalOpen(true);
        } else {
            const updated = data.map(row => (row.id === id ? { ...row, estatus: newValue } : row));
            setData(updated);
        }
    };

    // Cuando el modal confirma el cambio
    const handleModalConfirm = async () => {
        // Aquí puedes validar el código antes de aceptar
        if (!codigo || !codigo.startsWith("MLM")) {
            Swal.fire('Error', 'El código debe iniciar con "MLM"', 'error');
            return;
        }

        await asignarMlm(selectedRowId);
        await fetchResumenEnvio();

        setModalOpen(false);
        setSelectedRowId(null);
    };


    // Cancelar modal sin cambiar estado
    const handleModalCancel = () => {
        setModalOpen(false);
        setSelectedRowId(null);
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
                    value={params.value || 'nuevo'}
                    onChange={(event) => {
                        const newValue = event.target.value;

                        // Actualiza el valor en el grid
                        params.api.setEditCellValue({ id: params.id, field: params.field, value: newValue }, event);

                        // Cierra la celda de edición inmediatamente
                        params.api.stopCellEditMode({ id: params.id, field: params.field });

                        // Aquí lanzamos modal o actualizamos según estatus
                        handleEstatusChange(params.id, newValue);
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

                    onCellClick={(params, event) => {
                        if (params.field === 'estatus') {
                            setCellModesModel({
                                ...cellModesModel,
                                [params.id]: {
                                    ...cellModesModel[params.id],
                                    [params.field]: { mode: 'edit' },
                                },
                            });
                        }
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
                    density="compact" // Establece el tamaño de las filas en compacto por defecto
                />

                {/* Modal para 'en proceso' */}
                <Dialog open={modalOpen} onClose={handleModalCancel}>
                    <DialogTitle>Cambio de estatus a "En proceso"</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Código"
                            fullWidth
                            variant="standard"
                            value={codigo.slice(3)} // Solo la parte editable
                            onChange={(e) => setCodigo("MLM" + e.target.value)} // Concatenamos "MLM" + editable
                            helperText='El código debe iniciar con "MLM"'
                            InputProps={{
                                startAdornment: <InputAdornment position="start">MLM</InputAdornment>,
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleModalCancel} color="secondary">Cerrar</Button>
                        <Button onClick={handleModalConfirm} variant="contained" color="primary">Enviar</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    )
}

export default Mercadotecnia