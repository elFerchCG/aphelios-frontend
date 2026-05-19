import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import axios from 'axios';

const VentasME = () => {
    const [loading, setLoading] = useState(true);
    const [shipments, setShipments] = useState([]);
    const [resumen, setResumen] = useState(null);
    const [tab, setTab] = useState('hoy');

    const [pagina, setPagina] = useState(1);

    const enviosPorPagina = 25;

    const formatearFecha = (fecha) => {

        const date = new Date(fecha);

        return date.toLocaleString('es-MX', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }) + ' hs';
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

    const esHoy = (fecha) => {

        const hoy = new Date()
            .toLocaleDateString('en-CA');

        return (
            obtenerFechaComparable(fecha) === hoy
        );
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
            'recolectado'
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
                listo_para_recolectar: 0,
                recolectado: 0
            },

            proximos: {}
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
            if (esHoy(fecha)) {

                resumen.hoy.total++;

                if (shipment.estado_operativo === 'ready_to_print') {

                    resumen.hoy.ready_to_print++;
                }

                if (
                    shipment.estado_operativo === 'listo_para_recolectar' ||
                    shipment.estado_operativo === 'etiqueta_impresa'
                ) {

                    resumen.hoy.listo_para_recolectar++;
                }

                if (shipment.estado_operativo === 'recolectado') {

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

            // 🔹 FUTURO
            // else {

            //     const key = formatearColecta(fecha);

            //     if (!resumen.proximos[key]) {

            //         resumen.proximos[key] = {
            //             total: 0,
            //             ready_to_print: 0,
            //             listo_para_recolectar: 0
            //         };
            //     }

            //     resumen.proximos[key].total++;

            //     if (shipment.estado_operativo === 'ready_to_print') {

            //         resumen.proximos[key].ready_to_print++;
            //     }

            //     if (
            //         shipment.estado_operativo === 'listo_para_recolectar' ||
            //         shipment.estado_operativo === 'etiqueta_impresa'
            //     ) {

            //         resumen.proximos[key].listo_para_recolectar++;
            //     }
            // }
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

    const shipmentsFiltrados = shipments.filter(shipment => {

        if (!shipment.expected_date) {
            return false;
        }

        if (tab === 'hoy') {
            return esHoy(shipment.expected_date);
        }

        if (tab === 'proximos') {
            return !esHoy(shipment.expected_date);
        }

        return true;
    });

    const totalPaginas = Math.ceil(
        shipmentsFiltrados.length /
        enviosPorPagina
    );

    const inicio =
        (pagina - 1) * enviosPorPagina;

    const fin =
        inicio + enviosPorPagina;

    const shipmentsPaginados =
        shipmentsFiltrados.slice(inicio, fin);

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

    if (loading) {

        return (
            <Box p={3}>
                <Typography>
                    Cargando...
                </Typography>
            </Box>
        );
    }

    return (
        <Box p={3}>

            {/* 🔹 Título */}
            <Typography
                variant="h4"
                fontWeight="bold"
                mb={3}
                textAlign="center"
            >
                Ventas Mercado Envíos
            </Typography>

            {/* 🔹 Tabs */}
            <Box
                display="flex"
                gap={2}
                mb={4}
            >

                <Button
                    variant={
                        tab === 'hoy'
                            ? 'contained'
                            : 'outlined'
                    }
                    onClick={() => {
                        setTab('hoy');
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
                >

                    <Box
                        sx={{
                            minWidth: 220,
                            borderRadius: 4,
                            backgroundColor: '#f5f5f5',
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
                            mb={3}
                        >
                            Colecta | Hoy
                        </Typography>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={1}
                        >
                            <Typography>
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
                        >
                            <Typography>
                                Listas para enviar
                            </Typography>

                            <Typography fontWeight="bold">
                                {resumen.hoy.listo_para_recolectar}
                            </Typography>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                        >
                            <Typography>
                                Recolectados
                            </Typography>

                            <Typography fontWeight="bold">
                                {resumen.hoy.recolectado}
                            </Typography>
                        </Box>

                    </Box>

                </Box>
            )}
            {/* 🔹 Tarjetas PRÓXIMOS */}
            {tab === 'proximos' && resumen && (

                <Box
                    display="flex"
                    gap={3}
                    flexWrap="wrap"
                >

                    <Box
                        sx={{
                            minWidth: 220,
                            borderRadius: 4,
                            backgroundColor: '#f5f5f5',
                            p: 3,
                        }}
                    >

                        <Typography
                            fontSize={25}
                            fontWeight="bold"
                            mb={3}
                        >
                            Colecta | Mañana
                        </Typography>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={1}
                        >
                            <Typography>
                                Etiquetas por imprimir
                            </Typography>

                            <Typography fontWeight="bold">
                                {resumen.manana.ready_to_print}
                            </Typography>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                        >
                            <Typography>
                                Listas para enviar
                            </Typography>

                            <Typography fontWeight="bold">
                                {resumen.manana.listo_para_recolectar}
                            </Typography>
                        </Box>

                    </Box>

                </Box>
            )}
            <Box mt={4} display="flex" flexDirection="column" gap={2}>

                {shipmentsPaginados
                    .filter(shipment => {

                        if (!shipment.expected_date) {
                            return false;
                        }

                        if (tab === 'hoy') {
                            return esHoy(shipment.expected_date);
                        }

                        if (tab === 'proximos') {
                            return !esHoy(shipment.expected_date);
                        }

                        return true;
                    })
                    .map((shipment) => (

                        <Box
                            key={shipment.shipment_id}
                            sx={{
                                border: '1px solid #ddd',
                                borderRadius: 4,
                                p: 2,
                                backgroundColor: 'white'
                            }}
                        >

                            {/* HEADER SHIPMENT */}
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                mb={2}
                            >

                                <Box>

                                    <Typography fontWeight="bold">

                                        Shipment #{shipment.shipment_id}

                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {shipment.buyer_nickname}
                                    </Typography>

                                </Box>

                                <Box textAlign="right">

                                    <Typography
                                        fontWeight="bold"
                                    >
                                        {shipment.estado_operativo}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {formatearFecha(
                                            shipment.date_created
                                        )}
                                    </Typography>
                                </Box>

                            </Box>

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
                                        {mostrarBotonImprimir(shipment.estado_operativo) && (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() =>
                                                    imprimirEtiqueta(shipment.shipment_id)
                                                }
                                            >
                                                Imprimir etiqueta
                                            </Button>
                                        )}
                                    </Box>

                                ))}

                            </Box>

                        </Box>
                    ))}
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
        </Box>
    );
};

export default VentasME;