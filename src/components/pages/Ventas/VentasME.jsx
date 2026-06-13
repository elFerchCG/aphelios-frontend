import React, { useEffect, useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import axios from 'axios';
import Checkbox from '@mui/material/Checkbox';
import Swal from 'sweetalert2';

const VentasME = () => {
    const [loading, setLoading] = useState(true);
    const [shipments, setShipments] = useState([]);
    const [resumen, setResumen] = useState(null);
    const [tab, setTab] = useState('hoy');
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [filtroFecha, setFiltroFecha] = useState('hoy');
    const [shipmentsSeleccionados, setShipmentsSeleccionados] = useState([]);
    const [openProceso, setOpenProceso] = useState(false);
    const [shipmentProceso, setShipmentProceso] = useState(null);
    const [procesandoOrden, setProcesandoOrden] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const [pagina, setPagina] = useState(1);

    const enviosPorPagina = 25;

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

    const formatearFecha = (fecha) => {

        const date = new Date(fecha);

        return date.toLocaleString('es-MX', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }) + ' hs';
    };

    const formatearFechaColecta = (fecha) => {

        const date = new Date(fecha);

        return date.toLocaleString('es-MX', {
            day: 'numeric',
            month: 'long'
        });
    };

    const obtenerFechaComparable = (fecha) => {

        if (!fecha) return null;

        return new Date(fecha)
            .toLocaleDateString('en-CA');
    };

    const formatearColecta = (fecha) => {

        const date = new Date(fecha);

        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long'
        });
    };

    const obtenerDiasRetraso = (fecha) => {

        if (!fecha) return 0;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const colecta = new Date(fecha);
        colecta.setHours(0, 0, 0, 0);

        const diferencia =
            hoy.getTime() - colecta.getTime();

        return Math.floor(
            diferencia / (1000 * 60 * 60 * 24)
        );
    };

    const esHoyOAtrasado = (fecha) => {

        const hoy =
            new Date()
                .toLocaleDateString('en-CA');

        return (
            obtenerFechaComparable(fecha) <= hoy
        );
    };

    const esColectaActual = (fecha) => {

        if (!fecha) return false;

        const hoy =
            new Date()
                .toLocaleDateString('en-CA');

        const fechaShipment =
            obtenerFechaComparable(fecha);

        return fechaShipment <= hoy;
    };

    const esManana = (fecha) => {

        const manana = new Date();

        manana.setDate(manana.getDate() + 1);

        const mananaString =
            manana.toLocaleDateString('en-CA');

        return (
            obtenerFechaComparable(fecha) ===
            mananaString
        );
    };

    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL
            : process.env.REACT_APP_API_URL_LOCAL;

    const fetchShipments = async () => {

        try {

            const response = await axios.get(
                `${apiUrl}/pedidos/sync-mercado-envios`
            );

            const data = response.data.data;

            setShipments(data);

            const resumenConstruido =
                construirResumenOperativo(data);

            setResumen(resumenConstruido);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {

        fetchShipments();

    }, []);

    const construirResumenOperativo = (shipments) => {

        // 🔹 Estados que SI cuentan para colecta
        const estadosColecta = [
            'ready_to_print',
            'etiqueta_impresa',
            'listo_para_recolectar',
            'recolectado',
            'en_camino',
            'entregado'
        ];

        const resumen = {

            hoy: {
                total: 0,
                ready_to_print: 0,
                listo_para_recolectar: 0,
                recolectado: 0
            },

            manana: {
                total: 0,
                ready_to_print: 0,
                listo_para_recolectar: 0
            }
        };

        for (const shipment of shipments) {

            // 🔥 Ignorar estados NO operativos de colecta
            if (
                !estadosColecta.includes(
                    shipment.estado_operativo
                )
            ) {
                continue;
            }

            const fecha = shipment.expected_date;

            // 🔥 Ignorar sin fecha
            if (!fecha) {
                continue;
            }

            // 🔹 HOY
            if (esHoyOAtrasado(fecha)) {

                resumen.hoy.total++;

                if (
                    shipment.estado_operativo ===
                    'ready_to_print'
                ) {
                    resumen.hoy.ready_to_print++;
                }

                if (
                    shipment.estado_operativo ===
                    'listo_para_recolectar'
                    ||
                    shipment.estado_operativo ===
                    'etiqueta_impresa'
                ) {
                    resumen.hoy.listo_para_recolectar++;
                }
                if (shipment.mostrar_en_recolectados === true) {
                    resumen.hoy.recolectado++;
                }

            }

            // 🔹 MAÑANA
            else if (esManana(fecha)) {

                resumen.manana.total++;

                if (shipment.estado_operativo === 'ready_to_print') {

                    resumen.manana.ready_to_print++;
                }

                if (
                    shipment.estado_operativo === 'listo_para_recolectar' ||
                    shipment.estado_operativo === 'etiqueta_impresa'
                ) {

                    resumen.manana.listo_para_recolectar++;
                }

            }

        }

        return resumen;
    };

    // if (loading) {

    const imprimirEtiqueta = (shipmentId) => {

        window.open(
            `${apiUrl}/pedidos/imprimir-etiqueta/${shipmentId}`,
            '_blank'
        );
    };

    const imprimirEtiquetasSeleccionadas = async () => {

        if (
            shipmentsSeleccionados.length === 0
        ) {

            alert(
                'Selecciona al menos un shipment'
            );

            return;
        }

        try {

            const shipmentIds = shipmentsSeleccionados.join(',');

            window.open(

                `${apiUrl}/pedidos/imprimir-etiqueta/${shipmentIds}`,

                '_blank'
            );

        } catch (error) {

            console.error(error);
        }
    };

    const shipmentsFiltrados = shipments.filter((shipment) => {

        // 🔹 FILTRO ESTADO
        let coincideEstado = true;

        if (filtroEstado === 'ready_to_print') {

            coincideEstado =
                shipment.estado_operativo ===
                'ready_to_print';
        }

        else if (
            filtroEstado === 'listas_para_enviar'
        ) {

            coincideEstado = [

                'listo_para_recolectar',
                'etiqueta_impresa'

            ].includes(
                shipment.estado_operativo
            );
        }

        else if (
            filtroEstado === 'recolectado' || filtroEstado === 'en_camino' || filtroEstado === 'entregado'
        ) {

            coincideEstado =
                shipment.mostrar_en_recolectados === true;

        }

        else if (
            filtroEstado === 'cancelados'
        ) {

            coincideEstado =
                shipment.estado_operativo ===
                'cancelado';
        }

        // 🔹 FILTRO FECHA
        let coincideFecha = true;

        if (filtroFecha === 'hoy') {

            // 🔥 Recolectados:
            // SOLO HOY
            if (
                filtroEstado === 'recolectado' || filtroEstado === 'en_camino' || filtroEstado === 'entregado'
            ) {

                coincideFecha =
                    esHoyOAtrasado(
                        shipment.expected_date
                    );
            }

            // 🔥 Pendientes:
            // hoy + atrasados
            else {

                coincideFecha =
                    esColectaActual(
                        shipment.expected_date,
                        shipment.estado_operativo
                    );
            }
        } else if (
            filtroFecha === 'manana'
        ) {

            coincideFecha =
                esManana(shipment.expected_date);
        }

        return (
            coincideEstado &&
            coincideFecha
        );
    });

    const totalPaginas = Math.ceil(
        shipmentsFiltrados.length /
        enviosPorPagina
    );

    const inicio = (pagina - 1) * enviosPorPagina;

    const fin = inicio + enviosPorPagina;

    const shipmentsPaginados = shipmentsFiltrados.slice(inicio, fin);

    const mostrarBotonImprimir = (estado_operativo) => {

        const estadosConBoton = [
            'ready_to_print',
            'etiqueta_impresa',
            'listo_para_recolectar'
        ];

        return estadosConBoton.includes(
            estado_operativo
        );

    }

    const shipmentTieneReserva = (shipment) => {

        return shipment.items.some(
            item =>
                item.localidades &&
                item.localidades.length > 0
        );
    };

    const obtenerTextoBotonEtiqueta = (
        estado_operativo
    ) => {

        if (
            estado_operativo === 'etiqueta_impresa' ||
            estado_operativo === 'listo_para_recolectar'
        ) {

            return 'Reimprimir etiqueta';
        }

        return 'Imprimir etiqueta';
    };

    const obtenerTextoEstado = (estado_operativo) => {

        if (estado_operativo === 'ready_to_print') {
            return 'Listo para imprimir';
        }
        else if (estado_operativo === 'etiqueta_impresa') {
            return 'Listo para enviar';
        }
        else if (estado_operativo === 'listo_para_recolectar') {
            return 'Listo para recolectar';
        }
        else if (estado_operativo === 'recolectado' || estado_operativo === 'en_camino') {
            return 'Recolectado';
        }
        else if (estado_operativo === 'procesado') {
            return 'Procesado';
        }

        return 'Estado desconocido';
    };

    const obtenerTextoEstadoInterno = (
        estado
    ) => {

        switch (estado) {

            case 'reservado':
                return 'Reservado';

            case 'parcialmente_reservado':
                return 'Parcial';

            case 'sin_stock':
                return 'Sin stock';

            case 'orden_generada':
                return 'Orden generada';

            default:
                return estado;
        }
    };

    const construirTimeline = (
        shipment
    ) => {

        const pasos = [];

        // ✅ Venta creada
        pasos.push({
            label: 'Venta creada',
            completed: true
        });

        // ✅ Reservado
        pasos.push({
            label: 'Stock reservado',
            completed:
                shipment.estado_operativo_interno ===
                'reservado'
                || shipment.estado_operativo ===
                'procesado'
        });

        // 🚚 Recolectado
        pasos.push({
            label: 'Recolectado',
            completed:
                shipment.estado_operativo ===
                'recolectado'
                || shipment.estado_operativo ===
                'procesado'
        });

        // ✅ Orden generada
        pasos.push({
            label: 'Orden de bodega generada',
            completed:
                shipment.estado_operativo_interno ===
                'orden_generada'
        });

        return pasos;
    };

    const toggleShipmentSeleccionado = (
        shipmentId
    ) => {

        setShipmentsSeleccionados((prev) => {

            // ya existe → quitar
            if (prev.includes(shipmentId)) {

                return prev.filter(
                    id => id !== shipmentId
                );
            }

            // agregar
            return [...prev, shipmentId];
        });
    };

    const seleccionarTodos = () => {

        const ids = shipmentsPaginados.map(
            s => s.shipment_id
        );

        setShipmentsSeleccionados(ids);
    };

    const limpiarSeleccion = () => {

        setShipmentsSeleccionados([]);
    };

    const abrirModalProceso = (shipment) => {

        setShipmentProceso(shipment);

        setOpenProceso(true);
    };

    if (loading) {

        return (
            <Box p={3}>
                <Typography>
                    Cargando...
                </Typography>
            </Box>
        );
    }

    const procesarRecolectados = async () => {

        const shipmentIds =
            shipmentsFiltrados.map(
                shipment => shipment.shipment_id
            );

        // 📦 Total envíos
        const totalEnvios =
            shipmentIds.length;

        // 🛒 Total productos (unidades)
        const totalProductos =
            shipmentsFiltrados.reduce(
                (total, shipment) =>
                    total +
                    shipment.items.reduce(
                        (subtotal, item) =>
                            subtotal +
                            Number(item.cantidad || 0),
                        0
                    ),
                0
            );

        // 📍 Total reservas
        const totalReservas =
            shipmentsFiltrados.reduce(
                (total, shipment) =>
                    total +
                    shipment.items.reduce(
                        (subtotal, item) =>
                            subtotal +
                            (item.localidades?.reduce(
                                (localidadesTotal, localidad) =>
                                    localidadesTotal +
                                    Number(
                                        localidad.cantidad_reservada || 0
                                    ),
                                0
                            ) || 0),
                        0
                    ),
                0
            );

        const confirmacion =
            await Swal.fire({

                icon: 'warning',

                width: 700,

                title:
                    'Procesar recolectados',

                html: `
                <div style="text-align:left">

                    <p style="
                        margin-bottom:16px;
                        font-size:15px;
                    ">
                        Estás a punto de generar y procesar
                        una <b>orden de bodega de salida</b>
                        para los envíos que ya fueron
                        recolectados por Mercado Envíos.
                    </p>

                    <div style="
                        display:grid;
                        grid-template-columns:repeat(2,1fr);
                        gap:12px;
                        margin-bottom:20px;
                    ">

                        <div style="
                            border:1px solid #e5e7eb;
                            border-radius:10px;
                            padding:12px;
                        ">
                            <div style="font-size:13px;color:#6b7280">
                                📦 Envíos
                            </div>

                            <div style="
                                font-size:26px;
                                font-weight:bold;
                            ">
                                ${totalEnvios}
                            </div>
                        </div>

                        <div style="
                            border:1px solid #e5e7eb;
                            border-radius:10px;
                            padding:12px;
                        ">
                            <div style="font-size:13px;color:#6b7280">
                                🛒 Productos
                            </div>

                            <div style="
                                font-size:26px;
                                font-weight:bold;
                            ">
                                ${totalProductos}
                            </div>
                        </div>

                        <div style="
                            border:1px solid #e5e7eb;
                            border-radius:10px;
                            padding:12px;
                        ">
                            <div style="font-size:13px;color:#6b7280">
                                📍 Reservas
                            </div>

                            <div style="
                                font-size:26px;
                                font-weight:bold;
                            ">
                                ${totalReservas}
                            </div>
                        </div>

                        <div style="
                            border:1px solid #e5e7eb;
                            border-radius:10px;
                            padding:12px;
                        ">
                            <div style="font-size:13px;color:#6b7280">
                                📄 Orden
                            </div>

                            <div style="
                                font-size:26px;
                                font-weight:bold;
                            ">
                                1
                            </div>
                        </div>

                    </div>

                    <div style="
                        background:#f8fafc;
                        border-radius:10px;
                        padding:14px;
                        border:1px solid #e2e8f0;
                    ">

                        <b>
                            El sistema realizará:
                        </b>

                        <ul style="
                            margin-top:10px;
                            padding-left:20px;
                            line-height:1.8;
                        ">
                            <li>
                                Generar una orden de bodega automática.
                            </li>

                            <li>
                                Vincular las reservas de inventario.
                            </li>

                            <li>
                                Procesar la salida de inventario.
                            </li>

                            <li>
                                Actualizar existencias.
                            </li>

                            <li>
                                Marcar reservas como finalizadas.
                            </li>
                        </ul>

                    </div>

                    <div style="
                        margin-top:16px;
                        padding:12px;
                        border-radius:10px;
                        background:#fff7ed;
                        border:1px solid #fdba74;
                        color:#c2410c;
                        font-weight:bold;
                    ">
                        ⚠️ Este proceso afecta inventario y no puede deshacerse.
                    </div>

                </div>
            `,

                showCancelButton: true,

                confirmButtonText:
                    'Generar y procesar',

                cancelButtonText:
                    'Cancelar',

                confirmButtonColor:
                    '#2e7d32'
            });

        if (!confirmacion.isConfirmed) {
            return;
        }

        try {

            setProcesandoOrden(true);

            const response =
                await axios.post(
                    `${apiUrl}/pedidos/procesarRecolectados`,
                    { shipmentIds },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            if (response.data.ok) {

                Swal.fire({
                    icon: 'success',
                    title: 'Proceso completado',
                    html: `
                    <div style="text-align:left">
                        <p>
                            La orden fue generada y procesada correctamente.
                        </p>

                        <p>
                            <b>Orden:</b>
                            ${response.data.orden_id}
                        </p>
                    </div>
                `
                });

                await fetchShipments();
            }

        } catch (error) {

            console.error("Error capturado:", error.response?.data);

            // 1. Extraemos la data de la respuesta fallida
            const errorData = error.response?.data;

            // 2. Apuntamos al objeto 'message' que ahora envía tu Backend
            const targetMessage = errorData?.message;

            if (targetMessage) {
                const messageText = targetMessage.messageText || 'Error al procesar la orden';
                const errores = targetMessage.errores || [];

                let detalleErrores = '';

                // 3. Si vienen errores de stock, los mapeamos con un diseño limpio
                if (errores && errores.length > 0) {
                    detalleErrores = errores.map(err => `
                    <div style="text-align: left; margin-bottom: 8px; font-size: 14px;">
                        • <strong>SKU:</strong> ${err.sku} <br>
                        &nbsp;&nbsp;&nbsp;| <strong>ML:</strong> ${err.inventory_id} <br>
                        &nbsp;&nbsp;&nbsp;| <strong>Localidad:</strong> ${err.localidad} <br>
                        &nbsp;&nbsp;&nbsp;| <strong>Disponible:</strong> <span style="color: #dc2626; font-weight: bold;">${err.cantidad_disponible}</span> <br>
                        &nbsp;&nbsp;&nbsp;| <strong>Requerido:</strong> <span style="color: #16a34a; font-weight: bold;">${err.cantidad_requerida}</span>
                    </div>
                `).join('<hr style="border: 0; border-top: 1px dashed #e2e8f0; margin: 8px 0;">');
                }

                // 4. Mostramos el Swal con contenedor scrollable por si son muchos productos
                Swal.fire({
                    icon: 'error',
                    title: 'Stock Insuficiente',
                    html: `
                    <div style="font-size: 15px; margin-bottom: 15px; text-align: left; color: #1e293b;">
                        <strong>${messageText}</strong>
                    </div>
                    ${detalleErrores ? `
                    <div style="max-height: 300px; overflow-y: auto; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1;">
                        ${detalleErrores}
                    </div>
                    ` : ''}
                `,
                    width: 650,
                    showCloseButton: true
                });

                console.table(errores);

            } else {
                // Fallback en caso de que ocurra un error genérico (ej. error 500 de red)
                Swal.fire({
                    icon: 'error',
                    title: 'Error al procesar',
                    text: errorData?.mensaje || error.message || 'Ocurrió un error inesperado.'
                });
            }

        } finally {

            setProcesandoOrden(false);
            await fetchShipments();
        }
    };

    return (
        <Box p={2} backgroundColor="#f0f0f0" minHeight="100vh">

            {/* 🔹 Título */}
            <Typography
                variant="h5"
                fontWeight="bold"
                textAlign="center"
            >
                Ventas Mercado Envíos
            </Typography>

            {/* 🔹 Tabs */}
            <Box
                display="flex"
                gap={2}
                mb={1}
            >

                <Button
                    variant={
                        tab === 'hoy'
                            ? 'contained'
                            : 'outlined'
                    }
                    aria-label='Envíos de hoy'
                    onClick={() => {
                        setTab('hoy');
                        setFiltroFecha('hoy');
                        setPagina(1);
                    }}
                >
                    Envíos de hoy
                </Button>

                <Button
                    variant={
                        tab === 'proximos'
                            ? 'contained'
                            : 'outlined'
                    }
                    onClick={() => {
                        setTab('proximos');
                        setFiltroFecha('manana');
                        setPagina(1);
                    }}
                >
                    Próximos días
                </Button>

            </Box>

            {/* 🔹 Tarjetas HOY */}
            {tab === 'hoy' && resumen && (

                <Box
                    display="flex"
                    gap={3}
                    flexWrap="wrap"
                    mb={1}
                >

                    <Box
                        sx={{
                            minWidth: 220,
                            borderRadius: 4,
                            backgroundColor: 'white',
                            p: 3,
                        }}
                    >

                        <Typography
                            fontSize={12}
                            color="text.secondary"
                            mb={1}
                        >
                            PROGRAMADA
                        </Typography>

                        <Typography
                            fontSize={25}
                            fontWeight="bold"
                            mb={1}
                        >
                            Colecta | Hoy
                        </Typography>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={1}
                            onClick={() => {
                                setFiltroEstado('ready_to_print')
                                setPagina(1);
                            }
                            }
                            sx={{
                                cursor: 'pointer',
                                borderRadius: 2,
                                px: 1,
                                py: 0.5,
                                transition: 'all 0.2s ease',

                                // Estado activo
                                backgroundColor:
                                    filtroEstado === 'ready_to_print'
                                        ? '#dbeafe'
                                        : 'transparent',

                                border:
                                    filtroEstado === 'ready_to_print'
                                        ? '1px solid #60a5fa'
                                        : '1px solid transparent',

                                '&:hover': {
                                    backgroundColor:
                                        filtroEstado === 'ready_to_print'
                                            ? '#bfdbfe'
                                            : '#ececec'
                                }
                            }}
                        >
                            <Typography
                                fontWeight={
                                    filtroEstado === 'ready_to_print'
                                        ? 'bold'
                                        : 'normal'
                                }
                            >
                                Etiquetas por imprimir
                            </Typography>

                            <Typography fontWeight="bold">
                                {resumen.hoy.ready_to_print}
                            </Typography>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={1}
                            onClick={() => {
                                setFiltroEstado('listas_para_enviar');
                                setPagina(1);
                            }

                            }
                            sx={{
                                cursor: 'pointer',
                                borderRadius: 2,
                                px: 1,
                                py: 0.5,
                                transition: 'all 0.2s ease',

                                // Estado activo
                                backgroundColor:
                                    filtroEstado === 'listas_para_enviar'
                                        ? '#dbeafe'
                                        : 'transparent',

                                border:
                                    filtroEstado === 'listas_para_enviar'
                                        ? '1px solid #60a5fa'
                                        : '1px solid transparent',

                                '&:hover': {
                                    backgroundColor:
                                        filtroEstado === 'listas_para_enviar'
                                            ? '#bfdbfe'
                                            : '#ececec'
                                }
                            }}
                        >
                            <Typography
                                fontWeight={
                                    filtroEstado === 'listas_para_enviar'
                                        ? 'bold'
                                        : 'normal'
                                }
                            >
                                Listas para enviar
                            </Typography>

                            <Typography fontWeight="bold">
                                {resumen.hoy.listo_para_recolectar}
                            </Typography>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            onClick={() => {
                                setFiltroEstado('recolectado');
                                setPagina(1);
                            }

                            }
                            sx={{
                                cursor: 'pointer',
                                borderRadius: 2,
                                px: 1,
                                py: 0.5,
                                transition: 'all 0.2s ease',

                                // Estado activo
                                backgroundColor:
                                    filtroEstado === 'recolectado'
                                        ? '#dbeafe'
                                        : 'transparent',

                                border:
                                    filtroEstado === 'recolectado'
                                        ? '1px solid #60a5fa'
                                        : '1px solid transparent',

                                '&:hover': {
                                    backgroundColor:
                                        filtroEstado === 'recolectado'
                                            ? '#bfdbfe'
                                            : '#ececec'
                                }
                            }}
                        >
                            <Typography
                                fontWeight={
                                    filtroEstado === 'recolectado'
                                        ? 'bold'
                                        : 'normal'
                                }
                            >
                                Recolectados
                            </Typography>

                            <Typography fontWeight="bold">
                                {resumen.hoy.recolectado}
                            </Typography>
                        </Box>
                    </Box>
                    {filtroEstado === 'recolectado' && resumen.hoy.recolectado > 0 && (
                        <Box
                            sx={{
                                minWidth: 350,
                                borderRadius: 4,
                                backgroundColor: 'white',
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >

                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                mb={1}
                            >
                                Procesar recolectados
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                mb={2}
                            >
                                Genera la orden de bodega y procesa
                                todos los shipments recolectados
                                pendientes.
                            </Typography>

                            <Button
                                variant="contained"
                                color="success"
                                size="large"
                                fullWidth
                                onClick={procesarRecolectados}
                                disabled={
                                    procesandoOrden ||
                                    resumen?.hoy?.recolectado === 0
                                }
                            >
                                {
                                    procesandoOrden
                                        ? 'Procesando...'
                                        : 'Generar y procesar orden'
                                }
                            </Button>

                        </Box>
                    )}
                </Box>

            )}
            {/* 🔹 Tarjetas PRÓXIMOS */}
            {tab === 'proximos' && resumen && (

                <Box
                    display="flex"
                    gap={3}
                    flexWrap="wrap"
                    mb={1}
                >

                    <Box
                        sx={{
                            minWidth: 220,
                            borderRadius: 4,
                            backgroundColor: 'white',
                            p: 3,
                        }}
                    >

                        <Typography
                            fontSize={25}
                            fontWeight="bold"
                            mb={3}
                        >
                            Colecta | Siguiente
                        </Typography>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={1}
                            onClick={() => {

                                setFiltroEstado('ready_to_print');
                                setPagina(1);

                            }}
                            sx={{
                                cursor: 'pointer',
                                borderRadius: 2,
                                px: 1,
                                py: 0.5,
                                transition: 'all 0.2s ease',

                                // Estado activo
                                backgroundColor:
                                    filtroEstado === 'ready_to_print'
                                        ? '#dbeafe'
                                        : 'transparent',

                                border:
                                    filtroEstado === 'ready_to_print'
                                        ? '1px solid #60a5fa'
                                        : '1px solid transparent',

                                '&:hover': {
                                    backgroundColor:
                                        filtroEstado === 'ready_to_print'
                                            ? '#bfdbfe'
                                            : '#ececec'
                                }
                            }}
                        >
                            <Typography
                                fontWeight={
                                    filtroEstado === 'ready_to_print'
                                        ? 'bold'
                                        : 'normal'
                                }
                            >
                                Etiquetas por imprimir
                            </Typography>

                            <Typography fontWeight="bold">
                                {resumen.manana.ready_to_print}
                            </Typography>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            onClick={() => {

                                setFiltroEstado(
                                    'listas_para_enviar'
                                );

                                setPagina(1);

                            }}
                            sx={{
                                cursor: 'pointer',
                                borderRadius: 2,
                                px: 1,
                                py: 0.5,
                                transition: 'all 0.2s ease',

                                // Estado activo
                                backgroundColor:
                                    filtroEstado === 'listas_para_enviar'
                                        ? '#dbeafe'
                                        : 'transparent',

                                border:
                                    filtroEstado === 'listas_para_enviar'
                                        ? '1px solid #60a5fa'
                                        : '1px solid transparent',

                                '&:hover': {
                                    backgroundColor:
                                        filtroEstado === 'listas_para_enviar'
                                            ? '#bfdbfe'
                                            : '#ececec'
                                }
                            }}
                        >
                            <Typography
                                fontWeight={
                                    filtroEstado === 'listas_para_enviar'
                                        ? 'bold'
                                        : 'normal'
                                }
                            >
                                Listas para enviar
                            </Typography>

                            <Typography fontWeight="bold">
                                {resumen.manana.listo_para_recolectar}
                            </Typography>
                        </Box>

                    </Box>
                </Box>
            )}
            {/* 🔹 Lista de envíos */}
            {filtroEstado === "ready_to_print" && resumen.hoy.ready_to_print > 0 && (
                <Box
                    display="flex"
                    gap={2}
                    alignItems="center"
                    mb={1}
                >

                    <Button
                        variant="outlined"
                        onClick={seleccionarTodos}
                    >
                        Seleccionar todos
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={limpiarSeleccion}
                    >
                        Limpiar selección
                    </Button>

                    <Button
                        variant="contained"
                        onClick={
                            imprimirEtiquetasSeleccionadas
                        }
                        disabled={
                            shipmentsSeleccionados.length === 0
                        }
                    >
                        Imprimir seleccionados (
                        {shipmentsSeleccionados.length}
                        )
                    </Button>

                </Box>
            )}

            <Box display="flex" flexDirection="column" gap={2}>

                {shipmentsPaginados.map((shipment) => {

                    const diasRetraso =
                        obtenerDiasRetraso(
                            shipment.expected_date
                        );

                    const estaDemorado =
                        diasRetraso > 0;

                    return (

                        <Box
                            key={shipment.shipment_id}
                            sx={{
                                border: '1px solid #ddd',
                                borderRadius: 4,
                                p: 1.5,
                                backgroundColor: 'white'
                            }}
                        >

                            {/* HEADER SHIPMENT */}
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="flex-start"

                            >

                                {/* IZQUIERDA */}
                                <Box
                                    display="flex"
                                    alignItems="flex-start"
                                    gap={1.5}
                                    flex={1}
                                >

                                    {/* CHECKBOX */}
                                    <Checkbox
                                        size="small"
                                        checked={
                                            shipmentsSeleccionados.includes(
                                                shipment.shipment_id
                                            )
                                        }
                                        onChange={() =>
                                            toggleShipmentSeleccionado(
                                                shipment.shipment_id
                                            )
                                        }
                                        sx={{
                                            p: 0,
                                            mt: '2px'
                                        }}
                                    />

                                    {/* INFO */}
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        gap={0.5}
                                    >

                                        {/* FILA PRINCIPAL */}
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            gap={2}
                                            flexWrap="wrap"
                                        >

                                            <Typography fontWeight="bold">
                                                Shipment #{shipment.shipment_id}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                Orden:
                                                {' '}
                                                {shipment.orden_id}
                                            </Typography>

                                            {shipment.pack_id && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Pack:
                                                    {' '}
                                                    {shipment.pack_id}
                                                </Typography>
                                            )}

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {`Cliente: ${shipment.buyer_nickname}`}
                                            </Typography>

                                        </Box>

                                    </Box>

                                </Box>

                                {/* DERECHA */}
                                <Box
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="flex-end"
                                    gap={0.5}
                                >

                                    {/* ESTADO + BOTÓN */}
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                    >

                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                        >

                                            <Typography
                                                fontWeight="bold"
                                                color="orangered"
                                            >
                                                {obtenerTextoEstado(
                                                    shipment.estado_operativo
                                                )}
                                            </Typography>

                                            <Chip
                                                label={
                                                    obtenerTextoEstadoInterno(
                                                        shipment.estado_operativo_interno
                                                    )
                                                }
                                                size="small"
                                                color={
                                                    shipment.estado_operativo_interno === 'reservado'
                                                        ? 'success'
                                                        : shipment.estado_operativo_interno === 'parcialmente_reservado'
                                                            ? 'warning'
                                                            : shipment.estado_operativo_interno === 'sin_stock'
                                                                ? 'error'
                                                                : shipment.estado_operativo_interno === 'orden_generada'
                                                                    ? 'primary'
                                                                    : 'default'
                                                }
                                                sx={{
                                                    height: 24,
                                                    fontWeight: 'bold'
                                                }}
                                            />

                                        </Box>

                                        {mostrarBotonImprimir(
                                            shipment.estado_operativo
                                        )
                                            && shipmentTieneReserva(
                                                shipment
                                            ) && (

                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() =>
                                                        imprimirEtiqueta(
                                                            shipment.shipment_id
                                                        )
                                                    }
                                                    sx={{
                                                        minWidth: 'unset',
                                                        px: 1.5,
                                                        py: 0.5
                                                    }}
                                                >
                                                    {obtenerTextoBotonEtiqueta(
                                                        shipment.estado_operativo
                                                    )}
                                                </Button>
                                            )}

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() =>
                                                abrirModalProceso(shipment)
                                            }
                                        >
                                            Ver proceso
                                        </Button>

                                    </Box>

                                </Box>

                            </Box>

                            {/* Izquierda */}
                            <Box
                                display="flex"
                                flexDirection="row"
                                alignItems="flex-start"
                                ml={4}
                            >
                                {/* FECHA */}
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {"Venta: " + formatearFecha(
                                        shipment.date_created
                                    )}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    ml={2}
                                >
                                    {"Colecta: " + formatearFechaColecta(
                                        shipment.expected_date
                                    )}
                                </Typography>

                            </Box>

                            {/* ALERTA DE DEMORA */}
                            {estaDemorado && (

                                <Box
                                    ml={4}
                                    mt={1}
                                    mb={1}
                                >

                                    <Typography
                                        sx={{
                                            color: '#f97316',
                                            fontWeight: 700,
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        Listo para recolección. Está demorado {diasRetraso} día{diasRetraso > 1 ? 's' : ''}.
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#6b7280'
                                        }}
                                    >
                                        El envío no fue recolectado en la fecha programada. Debe entregarse en la siguiente colecta disponible.
                                    </Typography>

                                </Box>

                            )}

                            {/* ITEMS */}
                            <Box
                                display="flex"
                                flexDirection="column"
                                gap={2}
                            >

                                {shipment.items.map((item) => (

                                    <Box
                                        key={item.venta_operativa_id}
                                        display="flex"
                                        gap={2}
                                        alignItems="center"
                                        sx={{
                                            borderTop: '1px solid #eee',
                                            pt: 2
                                        }}
                                    >

                                        <img
                                            src={item.thumbnail}
                                            alt={item.title}
                                            style={{
                                                width: 70,
                                                height: 70,
                                                objectFit: 'contain'
                                            }}
                                        />

                                        <Box flex={1}>

                                            <Typography
                                                fontWeight="bold"
                                            >
                                                {item.title}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                SKU:
                                                {item.sku}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                            >
                                                Cantidad:
                                                {item.cantidad}
                                            </Typography>

                                            <Box mt={0.5}>

                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Ubicaciones:
                                                    {' '}

                                                    {item.localidades?.length > 0
                                                        ? item.localidades
                                                            .map(localidad =>
                                                                `${localidad.descripcion} (${localidad.cantidad_reservada})`
                                                            )
                                                            .join(', ')
                                                        : 'Sin stock disponible'
                                                    }

                                                </Typography>

                                            </Box>

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                href={item.permalink}
                                                target="_blank"
                                                sx={{
                                                    mt: 1,
                                                    textTransform: 'none'
                                                }}
                                            >
                                                Ver publicación
                                            </Button>

                                        </Box>
                                    </Box>

                                ))}

                            </Box>
                        </Box>
                    );
                })}
            </Box>
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                gap={1}
                mt={4}
            >

                {Array.from({
                    length: totalPaginas
                }).map((_, index) => {

                    const numeroPagina = index + 1;

                    return (

                        <Button
                            key={numeroPagina}
                            variant={
                                pagina === numeroPagina
                                    ? 'contained'
                                    : 'text'
                            }
                            onClick={() =>
                                setPagina(numeroPagina)
                            }
                            sx={{
                                minWidth: 40,
                                borderRadius: 2
                            }}
                        >
                            {numeroPagina}
                        </Button>
                    );
                })}

            </Box>
            <Dialog
                open={openProceso}
                onClose={() =>
                    setOpenProceso(false)
                }
                maxWidth="md"
                fullWidth
            >

                <DialogTitle>

                    Proceso Shipment #
                    {shipmentProceso?.shipment_id}

                </DialogTitle>

                <DialogContent>

                    {shipmentProceso && (

                        <Box
                            display="flex"
                            flexDirection="column"
                            gap={2}
                        >

                            {/* RESUMEN */}
                            <Box>

                                <Typography>
                                    Cliente:
                                    {' '}
                                    {shipmentProceso.buyer_nickname}
                                </Typography>

                                {/* <Typography>
                                    Estado ML:
                                    {' '}
                                    {shipmentProceso.estado_operativo}
                                </Typography> */}

                                <Typography>
                                    Estado interno:
                                    {' '}
                                    {shipmentProceso.estado_operativo_interno}
                                </Typography>

                                <Typography>
                                    Productos:
                                    {' '}
                                    {shipmentProceso.total_productos}
                                </Typography>

                                <Typography>
                                    Reservados:
                                    {' '}
                                    {shipmentProceso.productos_reservados}
                                </Typography>

                                <Typography>
                                    Sin reserva:
                                    {' '}
                                    {shipmentProceso.productos_sin_reserva}
                                </Typography>

                            </Box>

                            <Box mt={2}>
                                <Typography>
                                    Orden de bodega:
                                    {' '}
                                    {shipmentProceso?.items?.[0]?.orden_bodega_id || 'N/A'}
                                </Typography>
                            </Box>

                            {/* TIMELINE */}
                            <Box mt={2}>

                                <Typography
                                    fontWeight="bold"
                                    mb={2}
                                >
                                    Progreso operativo
                                </Typography>

                                <Box
                                    display="flex"
                                    flexDirection="column"
                                    gap={1.5}
                                >

                                    {construirTimeline(
                                        shipmentProceso
                                    ).map((paso, index) => (

                                        <Box
                                            key={index}
                                            display="flex"
                                            alignItems="center"
                                            gap={2}
                                        >

                                            {/* ICONO */}
                                            <Box
                                                sx={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: '50%',
                                                    backgroundColor:
                                                        paso.completed
                                                            ? '#2e7d32'
                                                            : paso.current
                                                                ? '#ed6c02'
                                                                : '#ccc',
                                                    flexShrink: 0
                                                }}
                                            />

                                            {/* TEXTO */}
                                            <Typography
                                                fontWeight={
                                                    paso.current
                                                        ? 'bold'
                                                        : 'normal'
                                                }
                                                color={
                                                    paso.completed
                                                        ? 'success.main'
                                                        : paso.current
                                                            ? 'warning.main'
                                                            : 'text.secondary'
                                                }
                                            >
                                                {paso.label}
                                            </Typography>

                                        </Box>
                                    ))}

                                </Box>

                            </Box>

                        </Box>
                    )}

                </DialogContent>

                <DialogActions>

                    <Button
                        onClick={() =>
                            setOpenProceso(false)
                        }
                    >
                        Cerrar
                    </Button>

                </DialogActions>

            </Dialog>
        </Box>
    );
};

export default VentasME;