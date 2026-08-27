import { Alert, Box, Button, Chip, FormControl, IconButton, InputAdornment, InputLabel, LinearProgress, MenuItem, Modal, OutlinedInput, Paper, Select, Stack, TextField, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useRef, useState, useMemo } from 'react'
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { DataGrid, GridActionsCellItem, GridEditInputCell, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import axios from 'axios';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useParams, useSearchParams } from "react-router-dom";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2';

// El Swal de "No se puede contar todavía" se dispara mientras el Modal de
// asignar (FULL o No-FULL) sigue abierto; el Modal de MUI usa z-index 1300
// y el contenedor de SweetAlert2 usa 1060 por default, así que sin esto el
// aviso queda tapado por detrás. Mismo patrón que ya se usa en
// ProformaFacturasModal.jsx / CrearProformaModal.jsx / DetalleFactura.jsx.
const swalConfig = {
    didOpen: () => {
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) {
            swalContainer.style.zIndex = '1500';
        }
    },
};

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
    const [solicitandoStock, setSolicitandoStock] = useState({});
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
    const [resumenOrden, setResumenOrden] = useState(null);
    const [folioInternoEnvio, setFolioInternoEnvio] = useState("");

    const inputRef = useRef(null);

    const { proformaId } = useParams();

    const [searchParams] = useSearchParams();

    const envioId = searchParams.get("envioId");

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
        cantidad_facturada: false,
        cantidad_surtida: false
    });

    const CustomToolbar = () => (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector />
            <GridToolbarExport
                csvOptions={{
                    fileName: "exported_data",
                    utf8WithBom: true,
                }}
            />
        </GridToolbarContainer>
    );

    // 1. Evalúa UN componente: ¿ya no requiere más acción?
    const cumpleComponente = (c, resumen) => {
        const facturada = Number(c.cantidad_facturada) || 0;
        const aEnviar = Number(c.cantidad_a_enviar) || 0;
        const surtida = Number(c.cantidad_surtida) || 0;
        const contada = Number(c.cantidad_contada) || 0;

        const topeConteo = facturada > 0 ? facturada : aEnviar;

        if (topeConteo <= 0) return false;

        // En un KIT, el tope real de etiquetas es el cuello de botella
        // del kit completo (cantidad_producto_a_producir), no la factura
        // individual del componente. En SIMPLE, coincide con topeConteo.
        const topeEtiquetas = resumen?.esKit
            ? (Number(resumen.cantidad_producto_a_producir) || topeConteo)
            : topeConteo;

        const etiquetasCompletas = surtida >= topeEtiquetas;
        const conteoCompleto = contada >= topeConteo;

        return etiquetasCompletas && conteoCompleto;
    };

    // 2. Evalúa TODOS los componentes de la orden
    const calcularModoSoloLectura = (lista, resumen) => {
        if (!lista || lista.length === 0) return false;
        return lista.every((c) => cumpleComponente(c, resumen));
    };

    // 3. Valor derivado — debe declararse ANTES de cualquier hook que lo use
    const modoSoloLectura = useMemo(
        () => calcularModoSoloLectura(componentes, resumenOrden),
        [componentes, resumenOrden]
    );

    // 4. Seguro: si en algún punto se vuelve solo lectura con el modal
    // abierto, saca cualquier celda de modo edición
    useEffect(() => {
        if ((openAsignar || openSurtirNoFull) && modoSoloLectura) {
            setCellModesModel({});
        }
    }, [modoSoloLectura, openAsignar, openSurtirNoFull]);

    // 5. Efecto para activar la edición de la primera fila al abrir cualquiera de las modales
    useEffect(() => {
        if ((openAsignar || openSurtirNoFull)
            && componentes.length > 0 &&
            !yaEnfocado &&
            !modoSoloLectura
        ) {
            const primerId = componentes[0].id;

            setCellModesModel({
                [primerId]: {
                    cantidad_a_contar: { mode: 'edit' },
                },
            });

            setYaEnfocado(true);
        }

        if (!openAsignar && !openSurtirNoFull) {
            setCellModesModel({});
            setYaEnfocado(false);
        }
    }, [openAsignar, openSurtirNoFull, yaEnfocado, modoSoloLectura]);

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
            const responseData = error.response?.data;
            const errorMessage = error.response?.data?.message || "Ocurrió un error al consultar las órdenes.";

            // Evaluamos si el backend notificó que es un SKU nuevo
            if (responseData?.nuevoSKU) {
                Swal.fire({
                    title: "¡SKU Nuevo Detectado!",
                    text: errorMessage,
                    icon: "warning",
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#f39c12", // Color de advertencia / acción especial
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            } else {
                // Manejo estándar para errores de servidor o sin resultados normales
                Swal.fire({
                    title: "Error",
                    text: errorMessage,
                    icon: "error",
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
            }
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

    const getCantidadPorUnidad = (c) =>
        Number(c.cantidad_por_unidad) || 1;

    const handleOpenAsignar = async (
        ordenId,
        detalleId,
        cantidadEnviar,
        cantidadSurtida,
        cantidadFacturada
    ) => {

        setSelectedOrdenId(ordenId);
        setSelectedDetalleId(detalleId);

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

            await validarPaquete(ordenId);

            setOpenSurtirNoFull(true);

        } finally {

            setLoading(false);

        }
    };

    const handleCloseAsignar = () => {
        setOpenAsignar(false);
        setTimeout(() => inputRef.current?.focus(), 100);
        setSelectedOrdenId(null);
        setSelectedDetalleId(null);
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

    useEffect(() => {

        if (!envioId || !envios.length) {
            return;
        }

        const envioActual = envios.find(
            (envio) => String(envio.id) === String(envioId)
        );

        if (envioActual) {

            setEnvioSeleccionado(envioActual.id);

            setEnvioDescripcion(
                envioActual.descripcion || ""
            );

            setFolioInternoEnvio(
                String(envioActual.folio_interno ?? "").trim()
            );

        }

    }, [envioId, envios]);

    const generarYDescargarTXT = async (data) => {
        const { sku, title, inventory_id, cantidadEtiquetas } = data;

        const folio_interno = folioInternoEnvio || "";

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
            ^FT385,105^A0B,22,22^FH^FD${user.nombre}:/${folio_interno}^FS

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

    // Le pide a almacén que recolecte el stock interno de componentes ya
    // reservado/procesado para esta OPD (cantidad_cubierta_excedente).
    // No mueve existencias_componentes ni cantidad_cubierta_excedente —
    // eso ya pasó al confirmar el armado en Envíos. Aquí solo se marca
    // que el surtidor está esperando la entrega física.
    const solicitarStockComponente = async (opdId) => {
        try {
            setSolicitandoStock((prev) => ({ ...prev, [opdId]: true }));

            await axios.put(
                `${apiUrl}/inventario/existencias/orden-produccion-detalle/${opdId}/solicitar-stock-componente`,
                { usuario: user?.nombre || 'SISTEMA' }
            );

            Swal.fire({
                icon: 'success',
                title: 'Solicitud enviada',
                text: 'Se notificó a almacén para que recolecte este componente.',
                timer: 1500,
                showConfirmButton: false
            });

            if (selectedOrdenId) {
                await validarPaquete(selectedOrdenId);
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message?.messageText ||
                error.response?.data?.message ||
                'No se pudo enviar la solicitud';
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setSolicitandoStock((prev) => ({ ...prev, [opdId]: false }));
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

    // Disponible para contar en Surtido: SOLO lo facturado + lo que
    // almacén YA entregó físicamente del stock interno reservado
    // (cantidad_cubierta_excedente). Si el componente depende de stock
    // interno y todavía no se marcó como entregada en "Solicitudes de
    // surtido" (Stock de Componentes), esa parte NO cuenta. Coincide 1:1
    // con la regla del backend (mrpController.js: contarComponenteSurtido
    // / surtirYEmpacarNoFull).
    const getDisponibleParaContar = (row) => {
        const facturada = Number(row?.cantidad_facturada || 0);
        const stockEntregado = Number(row?.stock_entregado || 0);
        const contadaActual = Number(row?.cantidad_contada || 0);
        const topePermitido = facturada + stockEntregado;
        return Math.max(0, topePermitido - contadaActual);
    };

    const isCellEditable = (params) => {

        if (modoSoloLectura) {
            return false;
        }

        return (
            params.field === "cantidad_a_contar" &&
            typeof params.row.sku === "string" &&
            params.row.sku.trim() !== "" &&
            getDisponibleParaContar(params.row) > 0
        );

    };

    // Feedback al surtidor cuando intenta contar una celda bloqueada: sin
    // esto, isCellEditable simplemente ignora el click y no explica nada.
    const handleCantidadAContarClick = (params) => {
        if (params.field !== "cantidad_a_contar") return;
        if (modoSoloLectura) return;
        if (getDisponibleParaContar(params.row) > 0) return;

        const facturada = Number(params.row.cantidad_facturada || 0);
        const cubierta = Number(params.row.cantidad_cubierta_excedente || 0);

        Swal.fire({
            ...swalConfig,
            icon: 'info',
            title: 'No se puede contar todavía',
            text: cubierta > 0
                ? `Este componente (${params.row.sku}) depende de stock interno que aún no ha sido marcado como entregado en "Solicitudes de surtido". Solo se puede contar lo facturado (${facturada}).`
                : `No hay cantidad facturada ni entregada disponible para contar en ${params.row.sku}.`,
            timer: 3500,
            showConfirmButton: false
        });
    };

    const columns = [
        {
            field: "unique_id",
            headerName: "Folio línea",
            type: "text",
            flex: 1
        },

        {
            field: "id_orden",
            headerName: "# Orden",
            type: "number",
            flex: 1
        },

        {
            field: "id_detalle_orden",
            headerName: "# Detalle orden",
            type: "number",
            flex: 1
        },

        {
            field: "thumbnail",
            headerName: "Producto",
            flex: 1,
            minWidth: 100,
            sortable: false,

            renderCell: (params) => {

                const thumbnail = params.row.thumbnail;
                const permalink = params.row.permalink;

                return (
                    <Tooltip
                        title={
                            permalink
                                ? "Abrir publicación"
                                : "Publicación no disponible"
                        }
                        arrow
                    >
                        <div
                            onClick={() => {
                                if (permalink) {
                                    window.open(
                                        permalink,
                                        "_blank",
                                        "noopener,noreferrer"
                                    );
                                }
                            }}
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                                height: "100%",
                                cursor: permalink
                                    ? "pointer"
                                    : "default",
                            }}
                        >
                            {thumbnail ? (
                                <img
                                    src={thumbnail}
                                    alt={
                                        params.row.id_detalle_orden ||
                                        "Producto"
                                    }
                                    style={{
                                        width: 120,
                                        height: 120,
                                        borderRadius: 8,
                                        objectFit: "contain",
                                        boxShadow:
                                            "0px 2px 5px rgba(0,0,0,0.15)",
                                        transition:
                                            "transform 0.15s ease, box-shadow 0.15s ease",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: 58,
                                        height: 58,
                                        borderRadius: 8,
                                        backgroundColor: "#f5f5f5",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        color: "#9e9e9e",
                                        fontSize: 12,
                                    }}
                                >
                                    Sin imagen
                                </div>
                            )}
                        </div>
                    </Tooltip>
                );
            }
        },

        {
            field: "componente_sku",
            headerName: "SKU Componente",
            type: "text",
            flex: 2
        },

        {
            field: "descripcion",
            headerName: "Descripción",
            type: "text",
            flex: 2,

            renderCell: (params) => (
                params.value ?? "Sin descripción"
            )
        },

        {
            field: "cantidad_facturada",
            headerName: "Procesar",
            type: "number",
            flex: 1,

            renderCell: (params) => {
                return Math.round(
                    Number(params.value ?? 0)
                );
            }
        },

        {
            field: "cantidad_surtida",
            headerName: "Procesadas",
            type: "number",
            flex: 1
        },

        {
            field: "cantidad_recibida",
            headerName: "Cantidad Recibida",
            type: "number",
            flex: 1
        },

        {
            field: "logistic_type",
            headerName: "Logística",
            type: "text",
            flex: 1,

            renderCell: (params) => {
                if (
                    params.value === "fulfillment" ||
                    params.row.permitir_full === 1
                ) {
                    return "Full";
                }

                return "Mercado Envíos";
            }
        },

        {
            field: "permitir_full",
            headerName: "Permitir Full",
            type: "text",
            flex: 1
        },

        {
            field: "tipo",
            headerName: "Tipo",
            type: "text",
            flex: 1
        },

        {
            field: "actions",
            headerName: "Procesar",
            type: "actions",
            minWidth: 190,
            flex: 1.3,

            getActions: (params) => {

                // Solo mostrar la acción en la PRIMERA fila
                // correspondiente a cada id_orden
                const isFirstInstance = !data.some(
                    (row) =>
                        row.id_orden === params.row.id_orden &&
                        row.unique_id < params.row.unique_id
                );

                if (!isFirstInstance) {
                    return [];
                }

                const esFull =
                    params.row.logistic_type === "fulfillment" ||
                    params.row.permitir_full === 1;

                return [
                    <Tooltip
                        key={`surtir-${params.row.id_detalle_orden}`}
                        title={
                            esFull
                                ? "Surtir componente Full"
                                : "Surtir Mercado Envíos"
                        }
                        arrow
                    >
                        <Button
                            variant="contained"
                            color={esFull ? "warning" : "error"}
                            startIcon={
                                <AssignmentIndIcon
                                />
                            }
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
                            sx={{
                                height: 120,
                                minWidth: 160,
                                borderRadius: 4,
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: 30,
                                boxShadow: "none",

                                "&:hover": {
                                    boxShadow:
                                        "0px 3px 8px rgba(0,0,0,0.18)",
                                }
                            }}
                        >
                            {esFull
                                ? "Surtir"
                                : "Surtir"}
                        </Button>
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
            field: "cantidad_cubierta_excedente",
            headerName: "Cubierto Stock",
            flex: 1.5,
            type: "number",
            headerAlign: "center",
            align: "center",
            renderCell: (params) => {

                const cobertura = Number(params.value || 0);

                if (cobertura <= 0) {
                    return <Chip size="small" variant="outlined" label="—" />;
                }

                const ubicacion = params.row.ubicacion_stock_componente;
                const sinSolicitar = Number(params.row.stock_sin_solicitar || 0) > 0;
                const esperandoEntrega = !sinSolicitar && Number(params.row.stock_esperando_entrega || 0) > 0;

                const tooltipTitle = ubicacion
                    ? `Recolectar de stock interno de componentes en: ${ubicacion}`
                    : "Recolectar de stock interno de componentes (existencias_componentes)";

                let color = "success";
                let label = `${cobertura} entregado`;

                if (sinSolicitar) {
                    color = "warning";
                    label = `${cobertura} sin solicitar`;
                } else if (esperandoEntrega) {
                    color = "warning";
                    label = `${cobertura} esperando`;
                }

                return (
                    <Tooltip title={tooltipTitle}>
                        <Chip
                            size="small"
                            color={color}
                            icon={<Inventory2Icon fontSize="small" />}
                            label={label}
                        />
                    </Tooltip>
                );
            }
        },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 2,
            renderCell: (params) => {
                const facturada = Number(params.row.cantidad_facturada) || 0;
                const cubierta = Number(params.row.cantidad_cubierta_excedente) || 0;
                const aEnviar = Number(params.row.cantidad_a_enviar) || 0;
                const surtidas = Number(params.row.cantidad_contada) || 0;

                // Disponible = lo facturado + lo cubierto con stock interno de
                // componentes. Si no hay ninguno de los dos, usa aEnviar.
                const disponible = facturada + cubierta;
                const total = disponible > 0 ? disponible : aEnviar;

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
                const { props, row } = params;

                const value = Math.max(0, props.value);
                const disponible = getDisponibleParaContar(row);
                const isValid =
                    props.value !== "" &&
                    props.value !== null &&
                    props.value !== undefined &&
                    /^[0-9]+$/.test(props.value) &&
                    Number(props.value) <= disponible;

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
            field: "cantidad_cubierta_excedente",
            headerName: "Cubierto Stock",
            flex: 1.5,
            type: "number",
            headerAlign: "center",
            align: "center",
            renderCell: (params) => {

                const cobertura = Number(params.value || 0);

                if (cobertura <= 0) {
                    return <Chip size="small" variant="outlined" label="—" />;
                }

                const ubicacion = params.row.ubicacion_stock_componente;
                const sinSolicitar = Number(params.row.stock_sin_solicitar || 0) > 0;
                const esperandoEntrega = !sinSolicitar && Number(params.row.stock_esperando_entrega || 0) > 0;

                const tooltipTitle = ubicacion
                    ? `Recolectar de stock interno de componentes en: ${ubicacion}`
                    : "Recolectar de stock interno de componentes (existencias_componentes)";

                let color = "success";
                let label = `${cobertura} entregado`;

                if (sinSolicitar) {
                    color = "warning";
                    label = `${cobertura} sin solicitar`;
                } else if (esperandoEntrega) {
                    color = "warning";
                    label = `${cobertura} esperando`;
                }

                return (
                    <Tooltip title={tooltipTitle}>
                        <Chip
                            size="small"
                            color={color}
                            icon={<Inventory2Icon fontSize="small" />}
                            label={label}
                        />
                    </Tooltip>
                );
            }
        },
        {
            field: "avance",
            headerName: "Avance",
            type: "number",
            flex: 2,
            renderCell: (params) => {
                const facturada = Number(params.row.cantidad_facturada) || 0;
                const cubierta = Number(params.row.cantidad_cubierta_excedente) || 0;
                const total = facturada + cubierta;
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
                const { props, row } = params;

                const value = Math.max(0, props.value);
                const disponible = getDisponibleParaContar(row);
                const isValid =
                    props.value !== "" &&
                    props.value !== null &&
                    props.value !== undefined &&
                    /^[0-9]+$/.test(props.value) &&
                    Number(props.value) <= disponible;

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

                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            mt: 2
                        }}
                    >

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
                                    width: 420
                                }
                            }}
                        />

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
                    <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                        alignItems="center"
                        sx={{ mb: 2 }}
                    >
                        <Typography
                            sx={{
                                fontFamily: 'Montserrat',
                                fontWeight: 'bold',
                                fontSize: 18
                            }}
                        >
                            Asignar orden
                        </Typography>

                        {
                            resumenOrden && (
                                <Chip
                                    size="small"
                                    label={resumenOrden.esKit ? "KIT" : "SIMPLE"}
                                    color={resumenOrden.esKit ? "secondary" : "primary"}
                                    sx={{ fontWeight: "bold" }}
                                />
                            )
                        }
                    </Stack>

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

                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    size="small"
                                                    label={resumenOrden.esKit ? "KIT" : "SIMPLE"}
                                                    color={resumenOrden.esKit ? "secondary" : "primary"}
                                                    sx={{ fontWeight: "bold" }}
                                                />
                                            </Box>

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

                    {/* ===================== GUÍA DE ARMADO ===================== */}
                    {
                        resumenOrden && componentes.length > 0 && (

                            <Paper
                                variant="outlined"
                                sx={{
                                    mb: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "#FFFDF5",
                                    borderColor: "warning.light"
                                }}
                            >

                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                    <BuildOutlinedIcon color="warning" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        Guía de armado — para 1 {resumenOrden.esKit ? "kit" : "producto"} necesitas:
                                    </Typography>
                                </Stack>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                        gap: 1.5
                                    }}
                                >
                                    {
                                        componentes.map((c) => {
                                            const porUnidad = getCantidadPorUnidad(c);

                                            return (
                                                <Paper
                                                    key={c.id}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1,
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        bgcolor: "#fff"
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {c.sku}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {c.descripcion ?? "Sin descripción"}
                                                        </Typography>
                                                    </Box>

                                                    <Chip
                                                        size="small"
                                                        color={porUnidad > 1 ? "secondary" : "default"}
                                                        label={`x${porUnidad}`}
                                                    />
                                                </Paper>
                                            );
                                        })
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

                    {
                        componentes.filter((c) => Number(c.cantidad_cubierta_excedente) > 0).length > 0 && (

                            <Alert
                                severity="warning"
                                icon={<Inventory2Icon />}
                                sx={{ mb: 2 }}
                            >
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                    Esta orden tiene componentes cubiertos con stock interno — hay que recolectarlos en almacén antes de poder surtirlos.
                                </Typography>

                                <Stack spacing={1}>
                                    {
                                        componentes
                                            .filter((c) => Number(c.cantidad_cubierta_excedente) > 0)
                                            .map((c) => {
                                                const sinSolicitar = Number(c.stock_sin_solicitar || 0) > 0;
                                                const esperandoEntrega = !sinSolicitar && Number(c.stock_esperando_entrega || 0) > 0;
                                                const entregado = !sinSolicitar && !esperandoEntrega && Number(c.stock_entregado || 0) > 0;

                                                return (
                                                    <Box
                                                        key={c.id}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            bgcolor: '#fff',
                                                            p: 1,
                                                            borderRadius: 1
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {c.sku} - {c.descripcion}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {Math.round(Number(c.cantidad_cubierta_excedente))} pza(s)
                                                                {c.ubicacion_stock_componente ? ` — ${c.ubicacion_stock_componente}` : ''}
                                                            </Typography>
                                                        </Box>

                                                        {sinSolicitar && (
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="warning"
                                                                disabled={!!solicitandoStock[c.id]}
                                                                onClick={() => solicitarStockComponente(c.id)}
                                                            >
                                                                {solicitandoStock[c.id] ? "Enviando..." : "Solicitar a almacén"}
                                                            </Button>
                                                        )}

                                                        {esperandoEntrega && (
                                                            <Chip size="small" color="warning" label="Esperando entrega de almacén" />
                                                        )}

                                                        {entregado && (
                                                            <Chip size="small" color="success" label="Entregado ✓" />
                                                        )}
                                                    </Box>
                                                );
                                            })
                                    }
                                </Stack>
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
                            onCellClick={handleCantidadAContarClick}
                            experimentalFeatures={{ newEditingApi: true }}
                            columnVisibilityModel={{
                                id: false,
                                orden_id: false,
                            }}
                            sx={{
                                fontFamily: "Montserrat",
                                fontWeight: "bold",
                                minHeight: 300,
                            }}
                        />

                    </Box>

                    {/* FOOTER FIJO */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
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

                        <Stack direction="row" spacing={2} alignItems="center">
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
                        </Stack>
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
                    <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                        alignItems="center"
                        sx={{ mb: 2 }}
                    >
                        <Typography
                            sx={{
                                fontFamily: 'Montserrat',
                                fontWeight: 'bold',
                                fontSize: 18
                            }}
                        >
                            Surtir y empacar Mercado Envíos
                        </Typography>

                        {
                            resumenOrden && (
                                <Chip
                                    size="small"
                                    label={resumenOrden.esKit ? "KIT" : "SIMPLE"}
                                    color={resumenOrden.esKit ? "secondary" : "primary"}
                                    sx={{ fontWeight: "bold" }}
                                />
                            )
                        }
                    </Stack>

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

                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    size="small"
                                                    label={resumenOrden.esKit ? "KIT" : "SIMPLE"}
                                                    color={resumenOrden.esKit ? "secondary" : "primary"}
                                                    sx={{ fontWeight: "bold" }}
                                                />
                                            </Box>

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

                    {/* ===================== GUÍA DE ARMADO ===================== */}
                    {
                        resumenOrden && componentes.length > 0 && (

                            <Paper
                                variant="outlined"
                                sx={{
                                    mb: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "#FFFDF5",
                                    borderColor: "warning.light"
                                }}
                            >

                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                    <BuildOutlinedIcon color="warning" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        Guía de armado — para 1 {resumenOrden.esKit ? "kit" : "producto"} necesitas:
                                    </Typography>
                                </Stack>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                        gap: 1.5
                                    }}
                                >
                                    {
                                        componentes.map((c) => {
                                            const porUnidad = getCantidadPorUnidad(c);

                                            return (
                                                <Paper
                                                    key={c.id}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1,
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        bgcolor: "#fff"
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {c.sku}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {c.descripcion ?? "Sin descripción"}
                                                        </Typography>
                                                    </Box>

                                                    <Chip
                                                        size="small"
                                                        color={porUnidad > 1 ? "secondary" : "default"}
                                                        label={`x${porUnidad}`}
                                                    />
                                                </Paper>
                                            );
                                        })
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

                    {
                        componentes.filter((c) => Number(c.cantidad_cubierta_excedente) > 0).length > 0 && (

                            <Alert
                                severity="warning"
                                icon={<Inventory2Icon />}
                                sx={{ mb: 2 }}
                            >
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                    Esta orden tiene componentes cubiertos con stock interno — hay que recolectarlos en almacén antes de poder surtirlos.
                                </Typography>

                                <Stack spacing={1}>
                                    {
                                        componentes
                                            .filter((c) => Number(c.cantidad_cubierta_excedente) > 0)
                                            .map((c) => {
                                                const sinSolicitar = Number(c.stock_sin_solicitar || 0) > 0;
                                                const esperandoEntrega = !sinSolicitar && Number(c.stock_esperando_entrega || 0) > 0;
                                                const entregado = !sinSolicitar && !esperandoEntrega && Number(c.stock_entregado || 0) > 0;

                                                return (
                                                    <Box
                                                        key={c.id}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            bgcolor: '#fff',
                                                            p: 1,
                                                            borderRadius: 1
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {c.sku} - {c.descripcion}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {Math.round(Number(c.cantidad_cubierta_excedente))} pza(s)
                                                                {c.ubicacion_stock_componente ? ` — ${c.ubicacion_stock_componente}` : ''}
                                                            </Typography>
                                                        </Box>

                                                        {sinSolicitar && (
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="warning"
                                                                disabled={!!solicitandoStock[c.id]}
                                                                onClick={() => solicitarStockComponente(c.id)}
                                                            >
                                                                {solicitandoStock[c.id] ? "Enviando..." : "Solicitar a almacén"}
                                                            </Button>
                                                        )}

                                                        {esperandoEntrega && (
                                                            <Chip size="small" color="warning" label="Esperando entrega de almacén" />
                                                        )}

                                                        {entregado && (
                                                            <Chip size="small" color="success" label="Entregado ✓" />
                                                        )}
                                                    </Box>
                                                );
                                            })
                                    }
                                </Stack>
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
                            onCellClick={handleCantidadAContarClick}
                            experimentalFeatures={{ newEditingApi: true }}
                            columnVisibilityModel={{
                                id: false,
                                orden_id: false,
                            }}
                            sx={{
                                fontFamily: "Montserrat",
                                fontWeight: "bold",
                                minHeight: 300,
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