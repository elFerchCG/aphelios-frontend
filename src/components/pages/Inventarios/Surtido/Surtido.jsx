import { Alert, Box, Button, Chip, FormControl, IconButton, InputAdornment, InputLabel, LinearProgress, MenuItem, Modal, OutlinedInput, Paper, Select, Stack, TextField, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useRef, useState, useMemo } from 'react'
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { DataGrid, GridActionsCellItem, GridEditInputCell, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import axios from 'axios';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useParams, useLocation } from "react-router-dom";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const Surtido = () => {
    const [data, setData] = useState([]);
    const [componentes, setComponentes] = useState([]);
    const [sku, setSku] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [habilitarAsignar, setHabilitarAsignar] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState('');
    const [openAsignar, setOpenAsignar] = useState(false);
    const [openSurtirNoFull, setOpenSurtirNoFull] = useState(false);
    const [openImprimir, setOpenImprimir] = useState(false);
    const [ml, setMl] = useState("");
    const [titleEtiquetasModal, setTitleEtiquetasModal] = useState("");
    const [skuEtiquetasModal, setSkuEtiquetasModal] = useState("");
    const [cantidadEtiquetasModal, setCantidadEtiquetasModal] = useState("");
    const [inventoryIdEtiquetasModal, setInventoryIdEtiquetasModal] = useState("");
    const [cantidadEtiquetas, setCantidadEtiquetas] = useState("");
    const [selectedOrdenId, setSelectedOrdenId] = useState(null);
    const [selectedDetalleId, setSelectedDetalleId] = useState(null);
    const [skuEtiqueta, setSkuEtiqueta] = useState('');
    const [titleEtiqueta, setTitleEtiqueta] = useState('');
    const [inventoryIdEtiqueta, setInventoryIdEtiqueta] = useState('');
    const [skuPuroEtiqueta, setSkuPuroEtiqueta] = useState('');
    const [cantidadRecibida, setCantidadRecibida] = useState('');
    const [cantidadTicket, setCantidadTicket] = useState('');
    //const [cantidadEtiquetas, setCantidadEtiquetas] = useState('');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))
    const [dateTime, setDateTime] = useState(getCurrentDateTime());
    const [envioDescripcion, setEnvioDescripcion] = useState("");
    const [envios, setEnvios] = useState([]);
    const [envioSeleccionado, setEnvioSeleccionado] = useState(null);
    const [cellModesModel, setCellModesModel] = useState({});
    const [yaEnfocado, setYaEnfocado] = useState(false);
    const [openModalPin, setOpenModalPin] = useState(false);
    const [pinSupervisor, setPinSupervisor] = useState('');
    const [loading, setLoading] = useState(false);
    const [modoSoloLectura, setModoSoloLectura] = useState(false);
    const [resumenOrden, setResumenOrden] = useState(null);

    const inputRef = useRef(null);

    const { proformaId } = useParams();
    const { state } = useLocation();


    const [infoProforma, setInfoProforma] = useState(null);

    useEffect(() => {
        console.log('🟢 Montado Surtido');
        return () => {
            console.log('🔴 Desmontado Surtido');
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setDateTime(getCurrentDateTime());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState({
        unique_id: false,
        id_orden: true,
        id_detalle_orden: false,
        cantidad_recibida: false,
        permitir_full: false,

    });

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

    // Efecto para activar la edición de la primera fila al abrir cualquiera de las modales
    useEffect(() => {
        if ((openAsignar || openSurtirNoFull)
            && componentes.length > 0 &&
            !yaEnfocado &&
            !modoSoloLectura
        ) {
            const primerId = componentes[0].id; // Toma el ID de la primera fila

            // Seteamos el modelo para indicarle que esa celda específica debe estar editándose
            setCellModesModel({
                [primerId]: {
                    cantidad_a_contar: { mode: 'edit' },
                },
            });

            setYaEnfocado(true);
        }
        // Cuando las dos modales estén cerradas, limpiamos todo para la siguiente apertura
        if (!openAsignar && !openSurtirNoFull) {
            setCellModesModel({});
            setYaEnfocado(false); // 🔴 Reseteamos el flag para la próxima vez
        }
        // 💡 Quitamos 'componentes' de las dependencias para que no se dispare al editar los valores
    }, [openAsignar, openSurtirNoFull, yaEnfocado, modoSoloLectura]);

    useEffect(() => {
        // Si terminó de cargar y no hay modales abiertos, enfocar el input
        if (!loading && !openAsignar && !openImprimir && !openModalPin) {
            // Un ligero timeout asegura que el DOM ya habilitó el input (disabled={loading})
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [loading, openAsignar, openImprimir, openModalPin]);

    const styleModalAsignar = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',

        width: '95%',

        height: '90vh',            // 🔥 altura máxima relativa a pantalla

        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 24,
        p: 3,

        display: 'flex',           // 🔥 layout flexible
        flexDirection: 'column',   // 🔥 contenido vertical
    };

    // Estilos del modal etiquetas
    const styleModalEtiquetas = {
        position: 'absolute',
        width: "20%",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: 4,
    };

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

    useEffect(() => {
        const todasContadas = componentes.every(comp => Number(comp.cantidad_contada) > 0);
        setHabilitarAsignar(todasContadas);
    }, [componentes]);


    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await axios.get(`${apiUrl}/usuarios`);

                if (response.data && Array.isArray(response.data)) {
                    setUsuarios(response.data);

                    const ultimo = await axios.get(
                        `${apiUrl}/mrp/ultimoOperador`,
                    );

                    if (ultimo.data.ok && ultimo.data.operador) {
                        const usuarioDefault = response.data.find(
                            u => u.id_usuario === ultimo.data.operador
                        );

                        if (usuarioDefault) {
                            setSelectedUsuario(usuarioDefault);
                        }
                    }

                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: `Error: ${error.message}`,
                    icon: 'error'
                });
            }
        };

        if (openAsignar === true) {
            fetchUsuarios();
        }
    }, [apiUrl, openAsignar])

    const handleSelectedUsuario = (e) => {
        const selectedId = e.target.value;
        const usuario = usuarios.find((u) => u.id_usuario === selectedId);
        setSelectedUsuario(usuario); // ahora es un objeto { id_usuario, nombre }

    }

    const fetchOrdenProduccion = async (sku) => {
        if (loading) return; // Evita ejecuciones paralelas
        setLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/mrp/${proformaId}/${sku}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setData(response.data.data);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Ocurrió un error al consultar las órdenes.";

            Swal.fire({

                title: "Error",

                text: errorMessage,

                icon: "error",

                timer: 5000,

                showCloseButton: true,

                allowEscapeKey: true

            });
        } finally {
            setLoading(false);
        }
    }

    const handleInputChange = (e) => {
        setSku(e.target.value);
    };

    const handleSearch = () => {
        if (loading) return;
        if (sku.trim() !== "") {
            fetchOrdenProduccion(sku);
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Ingrese un SKU válido antes de buscar',
                icon: 'warning',
                timer: 3000,
                showCloseButton: true,
                allowEscapeKey: true
            }).then(() => {
                // Regresa el foco tras cerrar SweetAlert
                inputRef.current?.focus();
            });
        }
    };

    const handleOpenAsignar = async (
        ordenId,
        detalleId,
        cantidadEnviar,
        cantidadSurtida,
        cantidadFacturada
    ) => {

        setSelectedOrdenId(ordenId);
        setSelectedDetalleId(detalleId);

        // 2. Determinamos el tope dinámico
        const facturada = Number(cantidadFacturada) || 0;
        const aEnviar = Number(cantidadEnviar) || 0;
        const surtida = Number(cantidadSurtida) || 0;

        const topePermitido = facturada > 0 ? facturada : aEnviar;

        // 3. Queda en modo solo lectura solo si ya se alcanzó o superó el tope
        setModoSoloLectura(surtida >= topePermitido);

        await validarPaquete(ordenId);

        setOpenAsignar(true);
    };

    const handleOpenSurtirNoFull = async (
        ordenId,
        detalleId,
        cantidadEnviar,
        cantidadSurtida,
        cantidadFacturada
    ) => {

        if (loading) return;

        setLoading(true);

        try {

            setSelectedOrdenId(ordenId);
            setSelectedDetalleId(detalleId);

            // 2. Determinamos el tope dinámico
            const facturada = Number(cantidadFacturada) || 0;
            const aEnviar = Number(cantidadEnviar) || 0;
            const surtida = Number(cantidadSurtida) || 0;

            const topePermitido = facturada > 0 ? facturada : aEnviar;

            // 3. Queda en modo solo lectura solo si ya se alcanzó o superó el tope
            setModoSoloLectura(surtida >= topePermitido);

            await validarPaquete(ordenId);

            setOpenSurtirNoFull(true);

        } finally {

            setLoading(false);

        }
    };

    const handleCloseAsignar = () => {
        setOpenAsignar(false);
        setTimeout(() => inputRef.current?.focus(), 100);
        setSelectedOrdenId(null); // Resetear el ID cuando se cierre
        setSelectedDetalleId(null); // Resetear id_detalle_orden también
        setCantidadRecibida("");
        setSelectedUsuario("");
        setResumenOrden(null);
    };

    const handleCloseSurtirNoFull = () => {
        if (loading) return;
        setOpenSurtirNoFull(false);
        setTimeout(() => inputRef.current?.focus(), 100);
        setSelectedDetalleId(null);
        setResumenOrden(null);
    };

    const handleOpenImprimir = () => {
        setOpenImprimir(true);
    }

    const handleCloseImprimir = () => {
        setOpenImprimir(false);
        setTimeout(() => inputRef.current?.focus(), 100);
        setMl("");
        setCantidadEtiquetasModal("");
    };

    const fetchEnvioActual = async () => {
        try {
            const response = await axios.get(`${apiUrl}/empaque/fetchEnviosAbiertos`);
            if (response.data.ok) {
                setEnvios(response.data.data);
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
        }
    };

    useEffect(() => {
        fetchEnvioActual();
    }, [apiUrl]);

    const generarYDescargarTXT = async (data) => {
        const { sku, title, inventory_id, cantidadEtiquetas } = data;

        const envioDescripcion = envios.find(
            envio => envio.id === envioSeleccionado
        )?.descripcion || "";

        // Bloque condicional para inventory_id
        const bloqueInventory = inventory_id
            ? `
            ^FO65,18^BY2^BCN,54,N,N
            ^FD${inventory_id}^FS
            ^FT150,98^A0N,22,22^FH^FD${inventory_id}^FS
            ^FT149,98^A0N,22,22^FH^FD${inventory_id}^FS
            `
            : ``; // Si es null, no imprime nada

        const contenido = `
            ^XA
            ^CI28
            ^LH0,0
            ^FO22,165^A0N,25,25^FDSKU:${sku}^FS
            ^FB350,2,2
            ^FO22,105^A0N,20,20^FD${title}^FS
            ^FT385,105^A0B,22,22^FH^FD${user.nombre}:/${envioDescripcion}^FS

            ${bloqueInventory}

            ^PQ${cantidadEtiquetas},0,1,Y
            ^XZ
            `;

        const blob = new Blob([contenido], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `archivo_${inventory_id ?? "sin_inventory"}.txt`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const imprimirEtiquetasNoFULL = async () => {
        if (loading || !habilitarAsignar) return;
        setLoading(true);
        try {
            const data = {
                orden_id: componentes[0]?.orden_id
            }
            const response = await axios.post(`${apiUrl}/mrp/imprimirEtiquetasNoFull`, data, {
            });
            if (response.data.ok) {
                setCantidadTicket();
                await fetchValoresOrden(response.data.cantidadEtiquetas);
                setSku('');
                setData([]); // <- limpia los datos mostrados en el DataGrid
                handleCloseSurtirNoFull();
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Ocurrió un error inesperado';

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            handleCloseSurtirNoFull();
        } finally {
            setLoading(false);
        }
    }

    const asignarLinea = async () => {
        if (loading || !habilitarAsignar) return;
        setLoading(true);

        try {
            const data = {
                operador: selectedUsuario.id_usuario,
                orden_id: componentes[0]?.orden_id
            }
            const response = await axios.post(`${apiUrl}/mrp/asignarLineaProduccion`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.ok) {
                setCantidadTicket();
                //await updateDetalleOrden();
                await fetchValoresOrden(response.data.cantidadEtiquetas);
                setSku('');
                setData([]); // <- limpia los datos mostrados en el DataGrid
                handleCloseAsignar();
                inputRef.current?.focus();
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Ocurrió un error inesperado';

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            handleCloseAsignar();
        } finally {
            setLoading(false);
        }
    }

    const puedeImprimir = user && (
        user.rol_descripcion === 'administrador' ||
        (user.rol_descripcion === 'Produccion' && user.permisos === 'supervisor')
    );

    // console.log("Usuario actual:", user);

    // 1. EL FILTRO / INTERCEPTOR
    const imprimirEtiquetas = () => {
        // Si el usuario actual ya es administrador, ejecuta directo sin pedir PIN
        if (puedeImprimir) {
            ejecutarPeticionImpresion(null);
        } else {
            // Si es operario, pausamos el flujo y abrimos el modal para que el supervisor ponga su PIN
            setOpenModalPin(true);
        }
    };

    // 2. LA ACCIÓN REAL (Tu código original con la integración del PIN)
    const ejecutarPeticionImpresion = async (pinAutorizacion = null) => {
        try {
            // Enviamos el inventory_id (ml) y añadimos el pinSupervisor al body
            // 1. Enviamos el body y en el 3er parámetro pasamos la configuración de los headers
            const response = await axios.post(
                `${apiUrl}/mrp/imprimirEtiquetas`,
                {
                    inventory_id: ml,
                    pinSupervisor: pinAutorizacion
                },
                {
                    headers: {
                        // Asegúrate de usar la estructura clásica 'Bearer TOKEN'
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.ok) {
                setTitleEtiquetasModal(response.data.title);
                setSkuEtiquetasModal(response.data.sku);
                setInventoryIdEtiquetasModal(response.data.inventory_id);

                await generarYDescargarTXT({
                    sku: response.data.sku,
                    title: response.data.title,
                    inventory_id: response.data.inventory_id,
                    cantidadEtiquetas: cantidadEtiquetasModal
                });

                // Si todo salió bien, cerramos ambos modales y limpiamos el PIN cargado
                setOpenModalPin(false);
                setPinSupervisor('');
                handleCloseImprimir();
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Ocurrió un error inesperado';

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });

            // En caso de error, también es buena práctica cerrar el modal del PIN para que no se quede trabado
            setOpenModalPin(false);
            setPinSupervisor('');
            handleCloseImprimir();
        }
    };

    const fetchValoresOrden = async (cantidadEtiquetas) => {
        try {
            const response = await axios.get(`${apiUrl}/mrp/fetchOrden/${selectedOrdenId}`);
            if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                const result = response.data.data[0];
                setSkuEtiqueta(result.sku);
                setTitleEtiqueta(result.title);
                setInventoryIdEtiqueta(result.inventory_id);
                setSkuPuroEtiqueta(result.sku_componente);
                // Llamada correcta a generarYDescargarTXT pasando los datos necesarios
                await generarYDescargarTXT({
                    sku: result.sku,
                    title: result.title,
                    inventory_id: result.inventory_id,
                    cantidadEtiquetas
                });
                console.log("Esta es la cantidad a imprimir de etiquetas:", cantidadEtiquetas);
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Ocurrió un error inesperado';

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
        }
    }

    const validarPaquete = async (id) => {
        try {
            const response = await axios.get(`${apiUrl}/mrp/validarPaquete/${id}`);
            if (response.data.ok) {
                setComponentes(response.data.paqueteCheck);
                setResumenOrden(response.data.resumen);
            }
        } catch (error) {
            console.log("Ocurrio un error en validarPaquete:", error);
        }
    }

    const contarComponenteSurtido = async (row) => {
        if (loading) return;
        setLoading(true);
        try {
            const response = await axios.put(`${apiUrl}/mrp/contarComponenteSurtido/${row.id}`, {
                cantidad_contada: row.cantidad_a_contar
            });
            await validarPaquete(row.orden_id);

            Swal.fire({
                icon: 'success',
                title: 'Cantidad actualizada',
                text: response.data.message,
                timer: 1000,
                showConfirmButton: false,
                target: document.getElementById("modal-asignar"),
            });
        } finally {
            setLoading(false);
        }
    }

    const contarComponenteSurtidoNoFull = async (row) => {
        if (loading) return;
        setLoading(true);
        try {


            const response = await axios.put(`${apiUrl}/mrp/surtirME/${row.id}`, {
                cantidad_contada: row.cantidad_a_contar
            });

            await validarPaquete(row.orden_id);

            const message = response.data.message;
            Swal.fire({
                icon: 'success',
                title: 'Cantidad actualizada',
                text: message,
                timer: 1000,
                showConfirmButton: false,
                target: document.getElementById("modal-surtirNoFull"),
            });
        } finally {
            setLoading(false);
        }
    };

    const processRowUpdate = async (updatedRow, oldRow) => {

        const cantidad = Number(updatedRow.cantidad_a_contar);

        // No hacer nada si no se capturó un valor válido
        if (
            updatedRow.cantidad_a_contar === "" ||
            updatedRow.cantidad_a_contar === null ||
            updatedRow.cantidad_a_contar === undefined ||
            Number.isNaN(cantidad) ||
            cantidad <= 0
        ) {
            return oldRow;
        }

        // No llamar al backend si el valor no cambió
        if (
            Number(updatedRow.cantidad_a_contar) ===
            Number(oldRow.cantidad_a_contar)
        ) {
            return oldRow;
        }

        try {

            await contarComponenteSurtido(updatedRow);

            return updatedRow;

        } catch (error) {

            const errorMessage =
                error.response?.data?.message ||
                "Ha ocurrido un error desconocido";

            Swal.fire({
                title: "¡No se pudo actualizar la línea!",
                text: errorMessage,
                icon: "error",
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
                target: document.getElementById("modal-asignar"),
            });

            return oldRow;
        }
    };

    const processRowUpdateNoFull = async (updatedRow, oldRow) => {

        const cantidad = Number(updatedRow.cantidad_a_contar);

        // No hacer nada si no se capturó un valor válido
        if (
            updatedRow.cantidad_a_contar === "" ||
            updatedRow.cantidad_a_contar === null ||
            updatedRow.cantidad_a_contar === undefined ||
            Number.isNaN(cantidad) ||
            cantidad <= 0
        ) {
            return oldRow;
        }

        // No llamar al backend si el valor no cambió
        if (
            Number(updatedRow.cantidad_a_contar) ===
            Number(oldRow.cantidad_a_contar)
        ) {
            return oldRow;
        }

        try {

            await contarComponenteSurtidoNoFull(updatedRow);

            return updatedRow;

        } catch (error) {

            const errorMessage =
                error.response?.data?.message ||
                "Ha ocurrido un error desconocido";

            Swal.fire({
                title: "¡No se pudo actualizar la línea!",
                text: errorMessage,
                icon: "error",
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true,
                target: document.getElementById("modal-surtirNoFull"),
            });

            return oldRow;
        }
    };

    // Manejador de errores global en DataGrid
    const handleProcessRowUpdateError = (error) => {
        const errorMessage = error.response?.data?.message || "Ha ocurrido un error desconocido";
        Swal.fire({
            title: "Error Global",
            text: errorMessage,
            icon: "error",
            showCloseButton: true,
            allowEscapeKey: true,
        });
    };

    const isCellEditable = (params) => {

        if (modoSoloLectura) {
            return false;
        }

        return (
            params.field === "cantidad_a_contar" &&
            typeof params.row.sku === "string" &&
            params.row.sku.trim() !== ""
        );

    };

    const columns = [
        { field: "unique_id", headerName: "Folio linea", type: "text", flex: 1 },
        { field: 'id_orden', headerName: "# Orden", type: "number", flex: 1 },
        { field: 'id_detalle_orden', headerName: "# Detalle orden", type: "number", flex: 1 },
        {
            field: "thumbnail", headerName: "Producto", flex: 1,
            renderCell: (params) => {
                return (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%'
                    }}>
                        <img
                            src={params.row.thumbnail}
                            alt={params.row.id_detalle_orden || 'Producto'}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                borderRadius: '8px',       // Bordes redondeados profesionales
                                objectFit: 'contain',      // Mantiene la proporción sin deformar
                                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' // Una sombra sutil elegante
                            }}
                        />
                    </div>
                )
            }
        },
        { field: "componente_sku", headerName: "SKU Componente", type: "text", flex: 2 },
        {
            field: "descripcion", headerName: "Descripcion", type: "text", flex: 2, renderCell: (params) => (
                params.value ?? "Sin descripción"
            )
        },
        {
            field: "cantidad_facturada", headerName: "Procesar", type: "number", flex: 1,
            renderCell: (params) => {
                return Math.round(Number(params.value ?? 0));
            }
        },
        {
            field: "cantidad_surtida", headerName: "Procesadas", type: "number", flex: 1
        },
        {
            field: "cantidad_recibida", headerName: "Cantidad Recibida", type: "number", flex: 1
        },
        {
            field: "logistic_type", headerName: "Logística", type: "text", flex: 1,
            renderCell: (params) => {
                if (params.value === 'fulfillment' || params.row.permitir_full === 1) {
                    return 'Full';
                } else {
                    return 'Mercado Envíos';
                }
            }
        },
        { field: "permitir_full", headerName: "Permitir Full", type: "text", flex: 1 },
        { field: "tipo", headerName: "Tipo", type: "text", flex: 1 },
        {
            field: "actions",
            headerName: "Acciones",
            type: "actions",
            getActions: (params) => {
                // Solo mostrar si esta es la PRIMERA fila con este id_orden
                const isFirstInstance = !data.some((row, index) =>
                    row.id_orden === params.row.id_orden && row.unique_id < params.row.unique_id
                );

                if (!isFirstInstance) return [];

                const esFull = params.row.logistic_type === 'fulfillment' || params.row.permitir_full === 1;

                return [
                    <Tooltip
                        title={esFull ? "Surtir componente Full" : "Surtir y empacar Mercado Envíos"}
                        key={`surtir-${params.row.id_detalle_orden}`}>
                        <GridActionsCellItem
                            icon={<AssignmentIndIcon />}
                            sx={{ color: esFull ? "orange" : "red" }}
                            onClick={() => {
                                if (esFull) {
                                    handleOpenAsignar(
                                        params.row.id_orden,
                                        params.row.id_detalle_orden,
                                        params.row.cantidad_a_enviar,
                                        params.row.cantidad_surtida,
                                        params.row.cantidad_facturada
                                    );
                                } else {
                                    handleOpenSurtirNoFull(
                                        params.row.id_orden,
                                        params.row.id_detalle_orden,
                                        params.row.cantidad_a_enviar,
                                        params.row.cantidad_surtida,
                                        params.row.cantidad_facturada
                                    );
                                }
                            }}
                            label={esFull ? "Surtir" : "Surtir y empacar"}
                        />
                    </Tooltip>,
                    <Tooltip title="Ver publicación" key={`link-${params.row.permalink}`}>
                        <GridActionsCellItem
                            icon={<OpenInNewIcon />}
                            sx={{ color: "green" }}
                            onClick={() => window.open(params.row.permalink, "_blank")}
                            label="Ver publicación"
                            disabled={!params.row.permalink} // por si el campo viene nulo
                        />
                    </Tooltip>
                ];
            }
        }
    ]

    const columnsFULLAsignar = [
        { field: "id", headerName: "Folio detalle orden", flex: 1 },
        { field: "orden_id", headerName: "Folio orden", flex: 1 },
        { field: "sku", headerName: "SKU Componente", flex: 2 },
        { field: "descripcion", headerName: "Descripción", flex: 1 },
        {
            field: "cantidad_facturada",
            headerName: "Factura",
            flex: 1,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0))
        },
        {
            field: "cantidad_a_enviar",
            headerName: "Enviar",
            flex: 1,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0))
        },
        {
            field: "cantidad_contada",
            headerName: "Cantidad contada",
            flex: 1,
            type: "number",
            renderHeader: (params) => (
                <div style={{ lineHeight: "normal", whiteSpace: "normal", wordBreak: "break-word", textAlign: "center" }}>
                    {params.colDef.headerName}
                </div>
            )
        },
        {
            field: "cantidad_surtida",
            headerName: "Etiquetas",
            flex: 1,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0))
        },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 2,
            renderCell: (params) => {
                const facturada = Number(params.row.cantidad_facturada) || 0;
                const aEnviar = Number(params.row.cantidad_a_enviar) || 0;
                const surtidas = Number(params.row.cantidad_surtida) || 0;

                // Si la cantidad facturada es mayor a 0 usa facturada, si es 0 usa aEnviar
                const total = facturada > 0 ? facturada : aEnviar;

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
            field: "cantidad_a_contar",
            headerName: "Cantidad a surtir",
            type: "number",
            flex: 1,
            editable: true,
            cellClassName: 'celdaEditable',
            renderHeader: (params) => (
                <div style={{ lineHeight: "normal", whiteSpace: "normal", wordBreak: "break-word", textAlign: "center" }}>
                    {params.colDef.headerName}
                </div>
            ),
            renderEditCell: (params) => (
                <GridEditInputCell
                    {...params}
                    autoFocus
                    type="number"
                    inputProps={{ min: 0 }}
                    onWheel={(e) => e.target.blur()}
                />
            ),
            preProcessEditCellProps: (params) => {
                const { props } = params;

                const value = Math.max(0, props.value);
                const isValid =
                    props.value !== "" &&
                    props.value !== null &&
                    props.value !== undefined &&
                    /^[0-9]+$/.test(props.value);

                return {
                    ...props,
                    value,
                    error: !isValid,
                };
            }
        },
        {
            field: "cantidad_excedente",
            headerName: "Excedente",
            flex: 1,
            type: "number",
            renderCell: (params) => {

                const excedente = Number(params.value);

                if (excedente <= 0) {

                    return (
                        <Chip

                            size="small"

                            color="success"

                            label="Sin excedente"

                        />
                    );

                }

                return (

                    <Chip

                        size="small"

                        color="warning"

                        label={`+${excedente}`}

                    />

                );

            }
        },
    ];

    const columnsSurtirNoFull = [
        { field: "id", headerName: "Folio detalle orden", flex: 1 },
        { field: "orden_id", headerName: "Folio orden", flex: 1 },
        { field: "sku", headerName: "SKU Componente", flex: 1 },
        { field: "descripcion", headerName: "Descripción", flex: 2 },
        {
            field: "cantidad_facturada",
            headerName: "Factura",
            flex: 1,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0))
        },
        {
            field: "cantidad_a_enviar",
            headerName: "Enviar",
            flex: 1,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0))
        },
        {
            field: "cantidad_contada",
            headerName: "Cantidad contada",
            flex: 1,
            type: "number",
            renderHeader: (params) => (
                <div style={{ lineHeight: "normal", whiteSpace: "normal", wordBreak: "break-word", textAlign: "center" }}>
                    {params.colDef.headerName}
                </div>
            )
        },
        {
            field: "cantidad_surtida",
            headerName: "Etiquetas",
            flex: 1,
            type: "number",
            valueFormatter: (value) => Math.round(Number(value ?? 0))
        },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 2,
            renderCell: (params) => {
                const total = Number(params.row.cantidad_facturada) || 0;
                const surtidas = Number(params.row.cantidad_surtida) || 0;

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
            field: "cantidad_a_contar",
            headerName: "Cantidad a surtir",
            type: "number",
            flex: 1,
            editable: true,
            cellClassName: 'celdaEditable',
            renderHeader: (params) => (
                <div style={{ lineHeight: "normal", whiteSpace: "normal", wordBreak: "break-word", textAlign: "center" }}>
                    {params.colDef.headerName}
                </div>
            ),
            renderEditCell: (params) => (
                <GridEditInputCell
                    {...params}
                    autoFocus
                    type="number"
                    inputProps={{ min: 0 }}
                    onWheel={(e) => e.target.blur()}
                />
            ),
            preProcessEditCellProps: (params) => {
                const { props } = params;

                const value = Math.max(0, props.value);
                const isValid =
                    props.value !== "" &&
                    props.value !== null &&
                    props.value !== undefined &&
                    /^[0-9]+$/.test(props.value);

                return {
                    ...props,
                    value,
                    error: !isValid,
                };
            }
        },
    ];

    const obtenerInfoProforma = async () => {

        try {

            const { data } = await axios.get(
                `${apiUrl}/empaque/proforma/${proformaId}`
            );

            if (data.ok) {
                setInfoProforma(data.proforma);
            }

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {

        obtenerInfoProforma();

    }, [proformaId]);

    return (
        <Box
            style={{
                maxWidth: "90%",
                margin: "0 auto",
                width: "100%"
            }}
        >
            <h1 style={{
                fontFamily: "Montserrat",
                fontWeight: "bold",
                textAlign: "center",
                margin: 0
            }}>Surtido</h1>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "stretch",
                    gap: 2,
                    mb: 2,
                    mt: 2
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 3,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        bgcolor: "#fafafa",
                        borderLeft: "6px solid",
                        borderColor: "primary.main"
                    }}
                >

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            letterSpacing: 2,
                            textTransform: "uppercase"
                        }}
                    >
                        Proforma
                    </Typography>

                    <Typography
                        variant="h4"
                        fontWeight="bold"
                    >
                        {infoProforma?.titulo}
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={3}
                        mt={0.5}
                    >

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Pedido #{infoProforma?.pedido_id}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {infoProforma?.razon_social}
                        </Typography>

                    </Stack>

                </Paper>

                <Box
                    sx={{
                        width: 420,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                    }}
                >

                    {/* BUSCADOR */}

                    <TextField
                        inputRef={inputRef}
                        autoFocus
                        id="outlined-basic"
                        label="Ingresar SKU"
                        variant="outlined"
                        size="small"
                        disabled={loading}
                        value={sku}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSearch();
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon
                                        sx={{
                                            cursor: loading ? "not-allowed" : "pointer",
                                            color: loading ? "gray" : "primary.main"
                                        }}
                                        onClick={!loading ? handleSearch : undefined}
                                    />
                                </InputAdornment>
                            ),
                            sx: {
                                height: 44
                            }
                        }}
                    />

                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            mt: 2
                        }}
                    >

                        <FormControl
                            fullWidth
                            size="small"
                        >

                            <InputLabel>Envío</InputLabel>

                            <Select
                                value={envioSeleccionado || ""}
                                label="Envío"
                                onChange={(e) => setEnvioSeleccionado(e.target.value)}
                            >

                                {envios.map((envio) => (

                                    <MenuItem
                                        key={envio.id}
                                        value={envio.id}
                                    >

                                        ID: {envio.id} - {envio.descripcion} - {envio.estatus}

                                    </MenuItem>

                                ))}

                            </Select>

                        </FormControl>

                        <Button
                            variant="contained"
                            onClick={handleOpenImprimir}
                            sx={{
                                minWidth: 180,
                                whiteSpace: "nowrap"
                            }}
                        >
                            Imprimir Etiqueta
                        </Button>

                    </Stack>
                </Box>
            </Box>
            <DataGrid
                sx={{
                    fontFamily: "Montserrat",
                    fontWeight: "bold",
                    borderRadius: 4,
                    boxShadow: 24,
                    borderWidth: 3,
                    '& .fila-full': {
                        backgroundColor: '#E8F5E9', // verde claro
                        '&:hover': {
                            backgroundColor: '#C8E6C9',
                        },
                    },
                    '& .fila-no-full': {
                        backgroundColor: '#FDECEA', // rojo claro
                        '&:hover': {
                            backgroundColor: '#F9D6D5',
                        },
                    },
                    // si quieres mantener esto
                    '& .fila-repetida': {
                        backgroundColor: '#FFF9C4',
                    },
                }}
                rows={data}
                columns={columns}
                showCellVerticalBorder
                showColumnVerticalBorder
                getRowId={(row) => row.unique_id}
                rowHeight={150}
                //processRowUpdate={processRowUpdate}
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                disableRowSelectionOnClick
                experimentalFeatures={{ newEditingApi: true }}
                slots={{ toolbar: CustomToolbar }}
                getRowClassName={(params) => {
                    if (params.row.logistic_type === 'fulfillment' || params.row.permitir_full === 1) {
                        return 'fila-full';
                    }
                    return 'fila-no-full';
                }}
            />
            <Modal id={"modal-asignar"} open={openAsignar} onClose={handleCloseAsignar}>
                <Box sx={styleModalAsignar}>

                    {/* HEADER */}
                    <Typography
                        sx={{
                            fontFamily: 'Montserrat',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            mb: 2,
                            fontSize: 18
                        }}
                    >
                        Asignar orden
                    </Typography>

                    {
                        resumenOrden && (

                            <Paper
                                variant="outlined"
                                sx={{
                                    mb: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "#fafafa"
                                }}
                            >

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "560px 1fr",
                                        gap: 3,
                                        alignItems: "start"
                                    }}
                                >

                                    {/* ===================== KPIs ===================== */}

                                    <Stack
                                        direction="row"
                                        spacing={5}
                                        alignItems="flex-start"
                                    >

                                        <Box>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Tipo
                                            </Typography>

                                            <Typography fontWeight="bold">

                                                {
                                                    resumenOrden.esKit
                                                        ? "KIT"
                                                        : "SIMPLE"
                                                }

                                            </Typography>

                                        </Box>

                                        <Box>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Componentes
                                            </Typography>

                                            <Typography fontWeight="bold">

                                                {resumenOrden.cantidad_componentes}

                                            </Typography>

                                        </Box>

                                        <Box>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Productos a enviar
                                            </Typography>

                                            <Typography
                                                fontWeight="bold"
                                                color="primary"
                                            >

                                                {
                                                    resumenOrden.esKit
                                                        ? `${resumenOrden.cantidad_producto_a_enviar} Kits`
                                                        : `${resumenOrden.cantidad_producto_a_enviar} Productos`
                                                }

                                            </Typography>

                                        </Box>

                                        <Box>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Productos a producir
                                            </Typography>

                                            <Typography
                                                fontWeight="bold"
                                                color="success.main"
                                            >

                                                {
                                                    resumenOrden.esKit
                                                        ? `${resumenOrden.cantidad_producto_a_producir} Kits`
                                                        : `${resumenOrden.cantidad_producto_a_producir} Productos`
                                                }

                                            </Typography>

                                        </Box>

                                    </Stack>

                                    {/* ===================== NOTAS ===================== */}

                                    {
                                        resumenOrden.notas?.length > 0 && (

                                            <Box
                                                sx={{
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    borderRadius: 2,
                                                    p: 2,
                                                    minHeight: 110,
                                                    bgcolor: "#fff"
                                                }}
                                            >

                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight="bold"
                                                    gutterBottom
                                                >
                                                    📝 Notas
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "repeat(auto-fit, minmax(280px, 1fr))",
                                                        gap: 2
                                                    }}
                                                >

                                                    {
                                                        componentes
                                                            .filter(c => c.notas)
                                                            .map((c) => (

                                                                <Paper
                                                                    key={c.id}
                                                                    variant="outlined"
                                                                    sx={{
                                                                        p: 1.5,
                                                                        borderColor: "info.main",
                                                                        bgcolor: "#F8FCFF",
                                                                        height: "100%"
                                                                    }}
                                                                >

                                                                    <Stack
                                                                        direction="row"
                                                                        spacing={1}
                                                                        alignItems="flex-start"
                                                                    >

                                                                        <InfoOutlinedIcon
                                                                            color="info"
                                                                            fontSize="small"
                                                                            sx={{ mt: .3 }}
                                                                        />

                                                                        <Box>

                                                                            <Typography
                                                                                fontWeight="bold"
                                                                                color="primary.dark"
                                                                            >
                                                                                {c.sku}
                                                                            </Typography>

                                                                            <Typography
                                                                                variant="body2"
                                                                            >
                                                                                {c.notas}
                                                                            </Typography>

                                                                        </Box>

                                                                    </Stack>

                                                                </Paper>

                                                            ))
                                                    }

                                                </Box>

                                            </Box>

                                        )
                                    }

                                </Box>

                            </Paper>

                        )
                    }

                    {
                        modoSoloLectura && (

                            <Alert
                                severity="info"
                                sx={{ mb: 2 }}
                            >
                                Esta orden ya fue surtida completamente.
                                Se muestra únicamente para consulta.
                            </Alert>

                        )
                    }

                    {/* CONTENIDO SCROLLEABLE */}
                    <Box
                        sx={{
                            flex: 1,                 // 🔥 ocupa todo el espacio disponible
                            overflowY: 'auto',       // 🔥 solo esta parte hace scroll
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >

                        <DataGrid
                            rows={componentes}
                            columns={columnsFULLAsignar}
                            getRowId={(row) => row.id}
                            cellModesModel={cellModesModel} // 🔴 Controla el modo edición activo
                            onCellModesModelChange={(newModel) => setCellModesModel(newModel)} // 🔴 Mantiene el estado sincronizado si el usuario cambia de celda
                            pageSize={10}
                            rowsPerPageOptions={[10, 25, 50]}
                            density="compact"
                            disableRowSelectionOnClick
                            processRowUpdate={processRowUpdate}
                            onProcessRowUpdateError={handleProcessRowUpdateError}
                            isCellEditable={isCellEditable}
                            experimentalFeatures={{ newEditingApi: true }}
                            columnVisibilityModel={{
                                id: false,
                                orden_id: false,
                            }}
                            sx={{
                                fontFamily: "Montserrat",
                                fontWeight: "bold",
                            }}
                        />

                        {/* SELECT OPERADOR */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <FormControl sx={{ width: 250 }}>
                                <InputLabel id="operador-label">Operador</InputLabel>
                                <Select
                                    labelId="operador-label"
                                    value={selectedUsuario ? selectedUsuario.id_usuario : ''}
                                    label="Operador"
                                    onChange={handleSelectedUsuario}
                                    disabled={!habilitarAsignar || modoSoloLectura}
                                >
                                    {usuarios.map((usuario) => (
                                        <MenuItem
                                            key={usuario.id_usuario}
                                            value={usuario.id_usuario}
                                        >
                                            {usuario.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                    </Box>

                    {/* FOOTER FIJO */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 2
                        }}
                    >
                        <Button
                            onClick={handleCloseAsignar}
                            variant="contained"
                            disabled={loading}
                            sx={{ width: 100 }}
                        >
                            Cerrar
                        </Button>

                        <Button
                            onClick={asignarLinea}
                            variant="contained"
                            color="success"
                            disabled={
                                !habilitarAsignar ||
                                loading ||
                                modoSoloLectura
                            }
                            sx={{ width: 200 }}
                        >
                            {modoSoloLectura
                                ? "Orden surtida"
                                : loading
                                    ? "Procesando..."
                                    : "Asignar e Imprimir"
                            }
                        </Button>
                    </Box>

                </Box>
            </Modal>
            {/* Modal para surtir productos ME */}
            <Modal
                id={"modal-surtirNoFull"}
                open={openSurtirNoFull}
                onClose={handleCloseSurtirNoFull}
            >
                <Box sx={styleModalAsignar}>

                    {/* HEADER */}
                    <Typography
                        sx={{
                            fontFamily: 'Montserrat',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            mb: 2,
                            fontSize: 18
                        }}
                    >
                        Surtir y empacar Mercado Envíos
                    </Typography>

                    {
                        resumenOrden && (

                            <Paper
                                variant="outlined"
                                sx={{
                                    mb: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "#fafafa"
                                }}
                            >

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "560px 1fr",
                                        gap: 3,
                                        alignItems: "start"
                                    }}
                                >

                                    {/* ===================== KPIs ===================== */}

                                    <Stack
                                        direction="row"
                                        spacing={5}
                                        alignItems="flex-start"
                                    >

                                        <Box>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Tipo
                                            </Typography>

                                            <Typography fontWeight="bold">

                                                {
                                                    resumenOrden.esKit
                                                        ? "KIT"
                                                        : "SIMPLE"
                                                }

                                            </Typography>

                                        </Box>

                                        <Box>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Componentes
                                            </Typography>

                                            <Typography fontWeight="bold">

                                                {resumenOrden.cantidad_componentes}

                                            </Typography>

                                        </Box>

                                        <Box>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Productos a enviar
                                            </Typography>

                                            <Typography
                                                fontWeight="bold"
                                                color="primary"
                                            >

                                                {
                                                    resumenOrden.esKit
                                                        ? `${resumenOrden.cantidad_producto_a_enviar} Kits`
                                                        : `${resumenOrden.cantidad_producto_a_enviar} Productos`
                                                }

                                            </Typography>

                                        </Box>

                                        <Box>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Productos a producir
                                            </Typography>

                                            <Typography
                                                fontWeight="bold"
                                                color="success.main"
                                            >

                                                {
                                                    resumenOrden.esKit
                                                        ? `${resumenOrden.cantidad_producto_a_producir} Kits`
                                                        : `${resumenOrden.cantidad_producto_a_producir} Productos`
                                                }

                                            </Typography>

                                        </Box>

                                    </Stack>

                                    {/* ===================== NOTAS ===================== */}

                                    {
                                        resumenOrden.notas?.length > 0 && (

                                            <Box
                                                sx={{
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    borderRadius: 2,
                                                    p: 2,
                                                    minHeight: 110,
                                                    bgcolor: "#fff"
                                                }}
                                            >

                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight="bold"
                                                    gutterBottom
                                                >
                                                    📝 Notas
                                                </Typography>

                                                <Box
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "repeat(auto-fit, minmax(280px, 1fr))",
                                                        gap: 2
                                                    }}
                                                >

                                                    {
                                                        componentes
                                                            .filter(c => c.notas)
                                                            .map((c) => (

                                                                <Paper
                                                                    key={c.id}
                                                                    variant="outlined"
                                                                    sx={{
                                                                        p: 1.5,
                                                                        borderColor: "info.main",
                                                                        bgcolor: "#F8FCFF",
                                                                        height: "100%"
                                                                    }}
                                                                >

                                                                    <Stack
                                                                        direction="row"
                                                                        spacing={1}
                                                                        alignItems="flex-start"
                                                                    >

                                                                        <InfoOutlinedIcon
                                                                            color="info"
                                                                            fontSize="small"
                                                                            sx={{ mt: .3 }}
                                                                        />

                                                                        <Box>

                                                                            <Typography
                                                                                fontWeight="bold"
                                                                                color="primary.dark"
                                                                            >
                                                                                {c.sku}
                                                                            </Typography>

                                                                            <Typography
                                                                                variant="body2"
                                                                            >
                                                                                {c.notas}
                                                                            </Typography>

                                                                        </Box>

                                                                    </Stack>

                                                                </Paper>

                                                            ))
                                                    }

                                                </Box>

                                            </Box>

                                        )
                                    }

                                </Box>

                            </Paper>

                        )
                    }

                    {
                        modoSoloLectura && (

                            <Alert
                                severity="info"
                                sx={{ mb: 2 }}
                            >
                                Esta orden ya fue surtida completamente.
                                Se muestra únicamente para consulta.
                            </Alert>

                        )
                    }

                    {/* CONTENIDO SCROLLEABLE */}
                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        <DataGrid
                            rows={componentes}
                            columns={columnsSurtirNoFull}
                            getRowId={(row) => row.id}
                            cellModesModel={cellModesModel} // 🔴 Controla el modo edición activo
                            onCellModesModelChange={(newModel) => setCellModesModel(newModel)} // 🔴 Mantiene el estado sincronizado
                            density="compact"
                            disableRowSelectionOnClick
                            processRowUpdate={processRowUpdateNoFull}
                            onProcessRowUpdateError={handleProcessRowUpdateError}
                            isCellEditable={isCellEditable}
                            experimentalFeatures={{ newEditingApi: true }}
                            columnVisibilityModel={{
                                id: false,
                                orden_id: false,
                            }}
                            sx={{
                                fontFamily: "Montserrat",
                                fontWeight: "bold",
                            }}
                        />
                    </Box>

                    {/* FOOTER FIJO */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mt: 2
                        }}
                    >
                        <Button
                            onClick={handleCloseSurtirNoFull}
                            variant="contained"
                            sx={{ width: 100 }}
                        >
                            Cerrar
                        </Button>

                        <Button
                            onClick={imprimirEtiquetasNoFULL}
                            variant="contained"
                            color="success"
                            disabled={!habilitarAsignar || modoSoloLectura}
                            sx={{ width: 200 }}
                        >
                            {modoSoloLectura
                                ? "Orden surtida"
                                : "Imprimir etiqueta"
                            }
                        </Button>
                    </Box>

                </Box>
            </Modal>
            <Modal id={'modal-imprimir'} open={openImprimir} onClose={handleCloseImprimir}>
                <Box sx={styleModalEtiquetas}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                        Imprimir Etiquetas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: "wrap", gap: 2 }}>
                        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                            <InputLabel>ML</InputLabel>
                            <OutlinedInput
                                type={'text'}
                                label="ML"
                                value={ml}
                                onChange={(e) => setMl(e.target.value)}
                                endAdornment={
                                    <InputAdornment position='end'>
                                        <QrCodeScannerIcon />
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        <FormControl sx={{ ml: 1, width: '15ch' }} variant="outlined">
                            <InputLabel>Cantidad</InputLabel>
                            <OutlinedInput
                                type={'number'}
                                label="Cantidad"
                                value={cantidadEtiquetasModal}
                                onChange={(e) => setCantidadEtiquetasModal(e.target.value)}
                            />
                        </FormControl>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "50px" }}>
                        <Button onClick={handleCloseImprimir} variant="contained" color="primary" sx={{ width: 80 }}>Cerrar</Button>
                        <Button onClick={imprimirEtiquetas} variant="contained" color="success" sx={{ width: 190 }}>Imprimir</Button>
                    </Box>
                </Box>
            </Modal>
            {/* Modal para que el supervisor ingrese su PIN */}
            <Modal
                id={'modal-pin-autorizacion'}
                open={openModalPin}
                onClose={() => setOpenModalPin(false)}
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 320,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2
                }}>
                    <Typography sx={{ fontFamily: 'Montserrat', fontWeight: "bold", textAlign: "center", marginBottom: "15px" }}>
                        Se requiere Autorización
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'center', mb: 2, color: 'text.secondary' }}>
                        Un administrador debe ingresar su PIN para permitir esta impresión.
                    </Typography>

                    <FormControl fullWidth variant="outlined">
                        <InputLabel>PIN de Supervisor</InputLabel>
                        <OutlinedInput
                            type="password" // Para que no se vea el PIN en pantalla mientras lo teclean
                            label="PIN de Supervisor"
                            value={pinSupervisor}
                            onChange={(e) => setPinSupervisor(e.target.value)}
                            inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '20px', letterSpacing: '5px' } }}
                        />
                    </FormControl>

                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "25px" }}>
                        <Button
                            onClick={() => { setOpenModalPin(false); setPinSupervisor(''); }}
                            variant="outlined"
                            color="error"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                if (!pinSupervisor) return alert("Por favor ingresa un PIN");
                                ejecutarPeticionImpresion(pinSupervisor);
                            }}
                            variant="contained"
                            color="success"
                        >
                            Confirmar
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    )
}

export default Surtido