import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    Box,
    Modal,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    IconButton,
    Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const apiUrl =
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_API_URL
        : process.env.REACT_APP_API_URL_LOCAL;

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 720,
    maxWidth: "95vw",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 3,
    p: 4,
    maxHeight: "90vh",
    overflowY: "auto",
};

const pasos = ["Qué se cubrió", "De dónde salió", "Confirmar"];

const GuiaCoberturaStockModal = ({
    open,
    handleClose,
    pedidoLineaId,
    onConfirmado,
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [detalle, setDetalle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirmando, setConfirmando] = useState(false);

    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')))

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

    useEffect(() => {
        if (!open || !pedidoLineaId) return;

        setActiveStep(0);
        setDetalle(null);

        const fetchDetalle = async () => {
            setLoading(true);

            try {
                const res = await axios.get(
                    `${apiUrl}/pedidos/detalle/${pedidoLineaId}`,
                );
                setDetalle(res.data);
            } catch (error) {
                console.error("❌ Error al obtener detalle de cobertura:", error);
                Swal.fire(
                    "Error",
                    "No se pudo cargar el detalle de esta línea de pedido",
                    "error",
                );
                handleClose();
            } finally {
                setLoading(false);
            }
        };

        fetchDetalle();
    }, [open, pedidoLineaId]);

    if (!open) return null;

    const produccion = Array.isArray(detalle?.ordenes_compra)
        ? detalle.ordenes_compra.flatMap((oc) =>
            Array.isArray(oc.produccion) ? oc.produccion : [],
        )
        : [];

    const produccionCubierta = produccion.filter(
        (p) => Number(p.cantidad_cubierta_excedente || 0) > 0,
    );

    const totalCubierto = produccionCubierta.reduce(
        (sum, p) => sum + Number(p.cantidad_cubierta_excedente || 0),
        0,
    );

    const handleConfirmar = async () => {
        setConfirmando(true);

        try {
            const token = localStorage.getItem("token");

            const res = await axios.post(
                `${apiUrl}/pedidos/cobertura-stock/${pedidoLineaId}/confirmar`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (res.data?.ok) {
                Swal.fire({
                    title: "Cobertura confirmada",
                    text: `Se generó el comprobante interno ${res.data.numero_factura} (Factura #${res.data.factura_id}). Ya puedes asignarlo a una proforma desde la pantalla de facturas.`,
                    icon: "success",
                });

                if (onConfirmado) onConfirmado();
            } else {
                Swal.fire(
                    "No se pudo confirmar",
                    res.data?.message || "Ocurrió un error al confirmar la cobertura",
                    "warning",
                );
            }
        } catch (error) {
            console.error("❌ Error al confirmar cobertura por stock:", error);
            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Ocurrió un error al confirmar la cobertura por stock",
                "error",
            );
        } finally {
            setConfirmando(false);
        }
    };

    const renderPaso = () => {
        if (loading || !detalle) {
            return (
                <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                </Box>
            );
        }

        if (activeStep === 0) {
            return (
                <Box>
                    <Typography variant="body1" gutterBottom>
                        <strong>SKU:</strong> {detalle.componente_sku} —{" "}
                        {detalle.componente_desc}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Esta línea de pedido se cubrió al 100% con existencias de
                        componentes (sin necesidad de comprarle al proveedor). Estas son
                        las órdenes de producción que se cubrieron:
                    </Typography>

                    <List dense>
                        {produccionCubierta.length === 0 ? (
                            <ListItem>
                                <ListItemText primary="No se encontraron órdenes de producción con cobertura por stock." />
                            </ListItem>
                        ) : (
                            produccionCubierta.map((p) => (
                                <ListItem
                                    key={p.orden_produccion_detalle_id}
                                    sx={{
                                        border: "1px solid #e0e0e0",
                                        borderRadius: 2,
                                        mb: 1,
                                    }}
                                >
                                    <ListItemText
                                        primary={`OP #${p.orden_produccion_id} / OPD #${p.orden_produccion_detalle_id} — Producto ${p.producto_id}`}
                                        secondary={`Cubierto con stock: ${Math.round(Number(p.cantidad_cubierta_excedente || 0))} pza(s)`}
                                    />
                                </ListItem>
                            ))
                        )}
                    </List>

                    <Chip
                        color="warning"
                        label={`Total cubierto: ${Math.round(totalCubierto)} pza(s)`}
                    />
                </Box>
            );
        }

        if (activeStep === 1) {
            return (
                <Box>
                    <Typography variant="body1" gutterBottom>
                        La cantidad se descontó del stock de componentes (
                        <code>existencias_componentes</code>) al momento en que se generó
                        este pedido, en vez de pedírsela al proveedor.
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Pedido #{detalle.pedido_id} — creado el{" "}
                        {detalle.pedido_fecha_creacion
                            ? new Date(detalle.pedido_fecha_creacion).toLocaleString(
                                "es-MX",
                            )
                            : "N/A"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Cantidad total tomada del stock:{" "}
                        <strong>{Math.round(totalCubierto)} pza(s)</strong>
                    </Typography>
                </Box>
            );
        }

        return (
            <Box>
                <Typography variant="body1" gutterBottom>
                    Al confirmar se va a generar un comprobante interno (sin costo)
                    para esta cantidad. No se le va a pedir nada al proveedor.
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    Después de confirmar podrás asignar este comprobante a una
                    proforma para que sea visible en un envío, y ya aparecerá en
                    Surtido para que se cuente y etiquete normalmente.
                </Typography>
            </Box>
        );
    };

    return (
        <Modal open={open} onClose={confirmando ? undefined : handleClose}>
            <Box sx={style}>
                <IconButton
                    onClick={handleClose}
                    disabled={confirmando}
                    sx={{ position: "absolute", top: 10, right: 10, color: "#666" }}
                >
                    <CloseIcon />
                </IconButton>

                <Typography variant="h5" align="center" gutterBottom>
                    Confirmar cobertura por stock — Línea #{pedidoLineaId}
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {pasos.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {renderPaso()}

                <Divider sx={{ my: 3 }} />

                <Box display="flex" justifyContent="space-between">
                    <Button
                        disabled={activeStep === 0 || confirmando}
                        onClick={() => setActiveStep((s) => s - 1)}
                    >
                        Atrás
                    </Button>

                    {activeStep < pasos.length - 1 ? (
                        <Button
                            variant="contained"
                            disabled={loading || !detalle}
                            onClick={() => setActiveStep((s) => s + 1)}
                        >
                            Siguiente
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="warning"
                            disabled={confirmando || loading || !detalle}
                            onClick={handleConfirmar}
                        >
                            {confirmando ? "Confirmando..." : "Confirmar y generar trazabilidad"}
                        </Button>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

export default GuiaCoberturaStockModal;