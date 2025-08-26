import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import FullScreenLoader from "../../../components/loaders/FullScreenLoader";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const MrpSimple = () => {
  const [mrp, setMrp] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loadingMrp, setLoadingMrp] = useState(false);
  const [loadingProv, setLoadingProv] = useState(true);
  const [busy, setBusy] = useState(false);

  // formulario
  const [proveedorId, setProveedorId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const proveedorSel = useMemo(
    () =>
      proveedores.find((p) => String(p.id_proveedor) === String(proveedorId)),
    [proveedores, proveedorId]
  );

  // cargar proveedores activos
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/proveedores`);
        if (!cancel) setProveedores(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando proveedores", err);
        Swal.fire("Error", "No se pudieron cargar los proveedores.", "error");
      } finally {
        if (!cancel) setLoadingProv(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // cargar MRP cuando se seleccione proveedor
  useEffect(() => {
    let cancel = false;

    const fetchMrp = async () => {
      // si no hay proveedor seleccionado, limpia la tabla
      if (!proveedorId) {
        setMrp([]);
        setLoadingMrp(false);
        return;
      }
      setLoadingMrp(true);
      try {
        const { data } = await axios.get(`${apiUrl}/mrp`, {
          params: { proveedor_id: Number(proveedorId) },
        });
        if (!cancel) setMrp(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando MRP", err);
        Swal.fire("Error", "No se pudo cargar el MRP del proveedor.", "error");
      } finally {
        if (!cancel) setLoadingMrp(false);
      }
    };

    fetchMrp();
    return () => {
      cancel = true;
    };
  }, [proveedorId]);

  useEffect(() => {
    cargarMrpDelProveedor(); /* eslint-disable-next-line */
  }, [proveedorId]);


  const generarPedidos = async () => {
    if (!proveedorId) {
      await Swal.fire(
        "Atención",
        "Selecciona un proveedor primero.",
        "warning"
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Generar pedidos?",
      text: `Proveedor: ${
        proveedorSel?.razon_social || proveedorId
      } · Backorder: ${proveedorSel?.backorder ? "Sí" : "No"}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, generar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      // 1) si NO acepta backorder, cerrar pendientes
      if (!proveedorSel?.backorder) {
        setBusy(true);
        await axios.post(`${apiUrl}/mrp/cerrarPorProveedorSinBackorder`, {
          proveedor_id: Number(proveedorId),
        });
        setBusy(false);
      }

      // 2) actualizar en_camino + total (filtrado por proveedor)
      setBusy(true);
      await axios.post(`${apiUrl}/mrp/refreshCaminoYTotal`, {
        proveedor_id: Number(proveedorId),
      });
      setBusy(false);

      // 3) ejecutar MRP (OP/OC/pedidos y excels)
      setBusy(true);
      await axios.post(`${apiUrl}/mrp/ejecutarMrp`, {
        proveedor_id: Number(proveedorId),
        back_order: !!proveedorSel?.backorder,
      });
      setBusy(false);

      await Swal.fire("Listo", "Pedidos generados correctamente.", "success");
      await cargarMrpDelProveedor();
    } catch (err) {
      setBusy(false);
      if (err?.response?.status === 409) {
        await Swal.fire(
          "Órdenes generadas hoy",
          err?.response?.data?.message ||
            "Ya se generaron órdenes para este proveedor hoy. Inténtalo mañana.",
          "warning"
        );
        return;
      }
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudieron generar los pedidos.";
      await Swal.fire("Error", msg, "error");
    } finally {
      setSubmitting(false);
      setBusy(false);
    }
  };

  const actualizarStocksML = async () => {
    try {
      if (!proveedorId) {
        await Swal.fire(
          "Atención",
          "Selecciona un proveedor primero.",
          "warning"
        );
        return;
      }
      setBusy(true);
      await axios.post(`${apiUrl}/mrp/refreshMl`, {
        proveedor_id: Number(proveedorId),
      });
      await Swal.fire(
        "Listo",
        "Stocks de Mercado Libre actualizados.",
        "success"
      );
      
      setBusy(false);

      
      // refresca la tabla MRP
      await cargarMrpDelProveedor();
    } catch (err) {
      await Swal.fire(
        "Error",
        err?.response?.data?.message || "No se pudo actualizar el stock ML.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  const cargarMrpDelProveedor = async () => {
    if (!proveedorId) {
      setMrp([]);
      return;
    }
    setLoadingMrp(true);
    try {
      const { data } = await axios.get(`${apiUrl}/mrp`, {
        params: { proveedor_id: Number(proveedorId) },
      });
      setMrp(Array.isArray(data) ? data : []);
    } catch {
      Swal.fire("Error", "No se pudo cargar el MRP del proveedor.", "error");
    } finally {
      setLoadingMrp(false);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", minWidth: 90 },
    { field: "producto_id", headerName: "Producto ID", minWidth: 120 },
    { field: "seguridad", headerName: "Seguridad", minWidth: 120 },
    { field: "punto_reorden", headerName: "Punto Reorden", minWidth: 140 },
    { field: "maximo", headerName: "Máximo", minWidth: 120 },
    { field: "stock_total", headerName: "Stock Total", minWidth: 120 },
    { field: "pedido", headerName: "Pedido", minWidth: 100 },
    { field: "retiro", headerName: "Retiro", minWidth: 100 },
    {
      field: "fecha",
      headerName: "Fecha",
      minWidth: 150,
    },
    { field: "stock_fisico", headerName: "Stock Físico", minWidth: 120 },
    {
      field: "stock_mercado_libre",
      headerName: "Stock Mercado Libre",
      minWidth: 180,
    },
    { field: "stock_en_camino", headerName: "Stock en camino", minWidth: 150 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        MRP
      </Typography>

      {!proveedorId && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Primero selecciona un proveedor para generar sus órdenes de compra.
        </Typography>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, // proveedor 1/3, pasos 2/3
              gap: 4, // más espacio entre columnas
              alignItems: "flex-start",
            }}
          >
            {/* Columna izquierda: Proveedor */}
            <Box>
              <FormControl
                fullWidth
                disabled={loadingProv || proveedores.length === 0}
              >
                <InputLabel id="proveedor-label">Proveedor</InputLabel>
                <Select
                  labelId="proveedor-label"
                  label="Proveedor"
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  multiple={false}
                >
                  {proveedores.map((p) => (
                    <MenuItem
                      key={p.id_proveedor}
                      value={String(p.id_proveedor)}
                    >
                      {p.razon_social}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {proveedorSel && (
                <Box mt={2} sx={{ fontSize: 14 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Razón social:</strong> {proveedorSel.razon_social}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>RFC:</strong> {proveedorSel.rfc || "—"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Correo:</strong> {proveedorSel.correo || "—"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Estado:</strong>{" "}
                    {Number(proveedorSel.estado) === 1 ? "Activo" : "Inactivo"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Surtido:</strong> {proveedorSel.surtido ?? "—"}
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch checked={!!proveedorSel?.backorder} disabled />
                    }
                    label={
                      !!proveedorSel?.backorder
                        ? "¿Tiene backorder? Sí (se mantendrán pedidos abiertos)"
                        : "¿Tiene backorder? No (se cerrarán pedidos pendientes)"
                    }
                  />
                </Box>
              )}
            </Box>

            {/* Columna derecha: Pasos */}
            <Stack spacing={4}>
              {/* Paso 1 */}
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Paso 1 · Actualizar stocks ML
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Actualiza las existencias de Mercado Libre y recalcula el
                  stock total para el proveedor seleccionado.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={actualizarStocksML}
                  disabled={!proveedorId || submitting || busy}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Actualizar stocks ML
                </Button>
              </Stack>

              {/* Paso 2 */}
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Paso 2 · Generar órdenes
                </Typography>
                <Alert severity="warning" variant="outlined">
                  Antes de generar órdenes, recuerda{" "}
                  <strong>refrescar stocks ML (Paso 1)</strong>.
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Si el proveedor no acepta backorder, se cerrarán
                  automáticamente las órdenes/pedidos/OP pendientes antes de
                  generar nuevas. Luego se actualizará “stock en camino” y se
                  crearán las órdenes correspondientes.
                </Typography>
                <Button
                  variant="contained"
                  disabled={!proveedorId || submitting}
                  onClick={generarPedidos}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {submitting ? "Generando..." : "Generar pedidos"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {loadingMrp ? (
        <Box
          height={360}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={mrp}
          columns={columns}
          getRowId={(row) => row.id}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          autoHeight
          density="compact"
          sx={{ borderRadius: 2, boxShadow: 2 }}
        />
      )}
      <FullScreenLoader open={busy} text="Cargando..." />
    </Box>
  );
};

export default MrpSimple;
