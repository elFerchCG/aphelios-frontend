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

const generarPedidos = async () => {
  if (!proveedorId) {
    await Swal.fire("Atención", "Selecciona un proveedor primero.", "warning");
    return;
  }

  const confirm = await Swal.fire({
    title: "¿Generar pedidos?",
    text: `Proveedor: ${proveedorSel?.razon_social || proveedorId} · Backorder: ${proveedorSel?.backorder ? "Sí" : "No"}`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, generar",
    cancelButtonText: "Cancelar",
  });
  if (!confirm.isConfirmed) return;

  try {
    setSubmitting(true);
    setBusy(true);

    const { data } = await axios.post(`${apiUrl}/mrp/ejecutarMrp`, {
      proveedor_id: Number(proveedorId),
      back_order: !!proveedorSel?.backorder,
    });

    setBusy(false); 
    await Swal.fire("Listo", "Pedidos generados correctamente.", "success");
  } catch (err) {
    console.error("Error al generar pedidos", err);

    // 👇 muestra mensaje real del backend si existe
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "No se pudieron generar los pedidos.";

    setBusy(false); 
    await Swal.fire("Error", msg, "error");
  } finally {
    setSubmitting(false);
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
              gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
              gap: 2,
              alignItems: "center",
            }}
          >
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
              >
                {proveedores.map((p) => (
                  <MenuItem key={p.id_proveedor} value={String(p.id_proveedor)}>
                    {p.razon_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Backorder informativo (desde BD), no editable */}
            <FormControlLabel
              control={<Switch checked={!!proveedorSel?.backorder} disabled />}
              label="¿Tiene backorder?"
            />

            <Button
              variant="contained"
              disabled={!proveedorId || submitting}
              onClick={generarPedidos}
            >
              {submitting ? "Generando..." : "Generar pedidos"}
            </Button>
          </Box>

          {loadingProv && (
            <Box mt={2} display="flex" alignItems="center" gap={1}>
              <CircularProgress size={18} /> <span>Cargando proveedores…</span>
            </Box>
          )}

          {!loadingProv && proveedores.length === 0 && (
            <Box mt={2}>No hay proveedores activos.</Box>
          )}

          {proveedorSel && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 1.5,
                  fontSize: 14,
                }}
              >
                <div>
                  <strong>Razón social:</strong> {proveedorSel.razon_social}
                </div>
                <div>
                  <strong>RFC:</strong> {proveedorSel.rfc || "—"}
                </div>
                <div>
                  <strong>Correo:</strong> {proveedorSel.correo || "—"}
                </div>
                <div>
                  <strong>Estado:</strong>{" "}
                  {Number(proveedorSel.estado) === 1 ? "Activo" : "Inactivo"}
                </div>
                <div>
                  <strong>Surtido:</strong> {proveedorSel.surtido ?? "—"}
                </div>
                <div>
                  <strong>MRP:</strong>{" "}
                  {Number(proveedorSel.mrp) === 1 ? "Sí" : "No"}
                </div>
              </Box>
            </>
          )}
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
       <FullScreenLoader open={busy} text="Generando órdenes…" />
    </Box>
  );
};

export default MrpSimple;
