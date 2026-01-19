import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Checkbox,
    Collapse,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from 'dayjs';
import { DataGrid } from "@mui/x-data-grid";

const Row = ({ row, selectedOrdenes, setSelectedOrdenes }) => {
    const [open, setOpen] = useState(false);

    const isSelected = selectedOrdenes.includes(row.orden_id);

    const handleToggle = () => {
        if (row.envio_id != null) return; // 🔒 protección lógica

        setSelectedOrdenes((prev) =>
            isSelected
                ? prev.filter((id) => id !== row.orden_id)
                : [...prev, row.orden_id]
        );
    };

    return (
        <>
            <TableRow
                hover selected={isSelected}
            >
                <TableCell padding="checkbox">
                    <Checkbox
                        checked={isSelected}
                        onChange={handleToggle}
                        disabled={row.envio_id != null}
                    />
                </TableCell>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                {/* <TableCell align="center">{row.orden_id}</TableCell>
                <TableCell align="center">{row.producto_id}</TableCell> */}
                <TableCell>{row.orden_bodega_id}</TableCell>
                <TableCell>{row.mlm}</TableCell>
                <TableCell align="center">{row.title}</TableCell>
                <TableCell align="center">{row.sku_publicacion}</TableCell>
                <TableCell align="center">{row.inventory_id}</TableCell>
                <TableCell align="center">{row.logistic_type === "fulfillment" || row.permitir_full === 1 ? "Full" : "ME"}</TableCell>
                <TableCell align="center">{row.cantidad_a_producir}</TableCell>
                <TableCell align="center">{row.cantidad_empacada}</TableCell>
                <TableCell align="center">{row.estatus}</TableCell>
                <TableCell>
                    {dayjs(row.fecha_creacion).format('DD/MM/YYYY')}
                </TableCell>
                <TableCell align="center">{row.envio_id ?? 'Sin asignar'}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={10} sx={{ paddingBottom: 0, paddingTop: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            <Typography variant="subtitle1"
                                sx={{ fontWeight: "bold", mb: 1 }}
                            >
                                Componentes
                            </Typography>

                            <Table size="small"
                                sx={{
                                    backgroundColor: "#f9f9f9",
                                    borderRadius: 2,
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                            Componente
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                            Proveedor
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                            Cantidad Surtida
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                            Tipo
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.detalles.map((det, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{det.sku_componente}</TableCell>
                                            <TableCell align="center">{det.cantidad_surtida}</TableCell>
                                            <TableCell align="center">{det.cantidad_billete}</TableCell>
                                            <TableCell align="center">{det.tipo}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const OrdenRetiro = () => {
    const [ordenes, setOrdenes] = useState([]);
    const [totalOrdenes, setTotalOrdenes] = useState();
    const [selectedOrdenes, setSelectedOrdenes] = useState([]);
    const [envios, setEnvios] = useState([]);
    const [selectedEnvio, setSelectedEnvio] = useState(null);
    const [openEnvioModal, setOpenEnvioModal] = useState(false);
    const [loadingEnvios, setLoadingEnvios] = useState(false);
    const [filtros, setFiltros] = useState({
        orden: "",
    });

    const apiUrl =
        process.env.NODE_ENV === "production"
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    useEffect(() => {
        fetchOrdenes();
    }, []);

    const fetchOrdenes = async () => {
        try {
            const res = await axios.get(`${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/ordenes_retiro_produccion`);
            setOrdenes(res.data.data || []);
            setTotalOrdenes(res.data.total_ordenes || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEnviosAbiertos = async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchEnviosAbiertos`);
            setEnvios(response.data.data || []);
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

    const ordenesFiltradas = ordenes.filter((o) => {
        if (filtros.orden) {
            return String(o.orden_bodega_id)
                .toLowerCase()
                .includes(filtros.orden.toLowerCase());
        }
        return true;
    });

    return (
        <Box
            sx={{
                width: "90%",
                mx: "auto",
                mt: 4,
                fontFamily: "Montserrat",
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    backgroundColor: "#a1a2a59c"
                }}
            >
                {/* 🔥 HEADER FIJO (título + botón) */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        backgroundColor: "#b9c8f89c",
                        fontWeight: "bold"
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                        Órdenes de retiro por excedente
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={selectedOrdenes.length === 0}
                        onClick={() => {
                            setOpenEnvioModal(true);
                            fetchEnviosAbiertos();
                        }}
                    >
                        Asignar órdenes ({selectedOrdenes.length})
                    </Button>
                </Box>

                {/* 🔥 TABLA CON SCROLL */}
                <TableContainer
                    sx={{
                        maxHeight: 500,
                        overflowX: "auto",
                    }}
                >
                    <Table stickyHeader>
                        <TableHead sx={{
                            "& th": {
                                backgroundColor: "#a1a2a5",
                                fontWeight: "bold",
                            },
                        }}>
                            <TableRow >
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={
                                            selectedOrdenes.length > 0 &&
                                            selectedOrdenes.length <
                                            ordenes.filter(o => o.envio_id == null).length
                                        }
                                        checked={
                                            ordenes.length > 0 &&
                                            selectedOrdenes.length ===
                                            ordenes.filter(o => o.envio_id == null).length
                                        }
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const idsSeleccionables = ordenes
                                                    .filter(o => o.envio_id == null) // 👈 CLAVE
                                                    .map(o => o.orden_id);

                                                setSelectedOrdenes(idsSeleccionables);
                                            } else {
                                                setSelectedOrdenes([]);
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell />
                                <TableCell sx={{ fontWeight: "bold" }}>
                                    #Orden
                                    <TextField
                                        variant="standard"
                                        value={filtros.orden}
                                        onChange={(e) =>
                                            setFiltros((prev) => ({ ...prev, orden: e.target.value }))
                                        }
                                        placeholder="Buscar..."
                                        fullWidth
                                        InputProps={{ disableUnderline: true }}
                                        sx={{
                                            fontSize: 8,
                                            backgroundColor: "#e4fdfb",
                                            borderRadius: "5px"
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>MLM</TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                    Título
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                    SKU
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                    ML
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                    Logística
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                    Cantidad a producir
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                    Cantidad empacada
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                    Estatus
                                </TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                    Fecha creación
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                    #Envío
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {ordenesFiltradas.map((row) => (
                                <Row
                                    key={row.orden_id}
                                    row={row}
                                    selectedOrdenes={selectedOrdenes}
                                    setSelectedOrdenes={setSelectedOrdenes}
                                />
                            ))}

                            {/* 🔥 FILA TOTAL FIJA */}
                            <TableRow
                                sx={{
                                    backgroundColor: "#e3f2fd",
                                    position: "sticky",
                                    bottom: 0,
                                    zIndex: 2,
                                }}
                            >
                                <TableCell colSpan={9} sx={{ fontWeight: "bold" }}>
                                    Total de órdenes
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                                    {totalOrdenes}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
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