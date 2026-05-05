import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SaveIcon from "@mui/icons-material/Save";
import axios from "axios";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

function DetalleBilleteDialog({
  open,
  onClose,
  billete,
  onShowAlert,
  onSelectProducto,
  productoSeleccionado = false,
}) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState(0);

  const modoProducto = productoSeleccionado;
  const compartidos = billete?.ubicacionesCompartidas || [];

  useEffect(() => {
    if (!billete || !Array.isArray(billete.componentes)) {
      setRows([]);
      return;
    }

    setRows(
      billete.componentes.map((r, index) => ({
        ...r,
        _rowId: index,
      })),
    );
  }, [billete]);

  useEffect(() => {
    if (open) setTab(0);
  }, [open, billete?.billete_id]);

  const getRowId = (row) => row._rowId;

  const skuPrincipal = billete?.sku || rows[0]?.sku || "N/A";

  const descripcionPrincipal =
    billete?.descripcion ||
    billete?.descripcion_componente ||
    rows.find(
      (r) => String(r.sku || "").trim() === String(skuPrincipal || "").trim(),
    )?.descripcion ||
    rows[0]?.descripcion ||
    "N/A";

  const productosTabs = useMemo(() => {
    const map = new Map();

    const compartidosDelSku = compartidos.filter(
      (comp) =>
        String(comp.sku || "").trim() === String(skuPrincipal || "").trim(),
    );

    compartidosDelSku.forEach((comp) => {
      (comp.ubicaciones || []).forEach((u) => {
        const productoId = Number(u.producto_id);

        if (!map.has(productoId)) {
          map.set(productoId, {
            producto_id: productoId,
            producto_title: u.producto_title || "Producto sin título",
            producto_sku: u.producto_sku || "N/A",
            mlm: u.mlm || "N/A",
            catalog_id: u.catalog_id || "N/A",
            inventory_id: u.inventory_id || "N/A",
            status: u.status || "N/A",
            logistic_type: u.logistic_type || "N/A",
            available_quantity: u.available_quantity ?? "N/A",
            permalink: u.permalink || null,
            costo: u.costo ?? null,
            free_shipping: u.free_shipping ?? null,
            costo_envio: u.costo_envio ?? null,
            inv_seguridad: u.inv_seguridad ?? null,
            inv_maximo: u.inv_maximo ?? null,
            items: [],
          });
        }

        map.get(productoId).items.push({
          ...u,
          componente: comp,
        });
      });
    });

    if (map.size === 0 && rows.length > 0) {
      const selectedRow = rows.find(
        (r) => String(r.sku || "").trim() === String(skuPrincipal || "").trim(),
      );

      if (selectedRow) {
        const productoId = Number(
          selectedRow.producto_id ??
            selectedRow.productoId ??
            billete?.producto_id ??
            billete?.productoId,
        );

        map.set(productoId, {
          producto_id: productoId,
          producto_title:
            billete?.productoTitulo || billete?.titulo || "Producto actual",
          producto_sku: billete?.productoSku || "N/A",
          mlm: billete?.publicacionId || "N/A",
          catalog_id: billete?.catalog_id || "N/A",
          inventory_id: billete?.inventory_id || "N/A",
          status: billete?.status || "N/A",
          logistic_type:
            billete?.logisticType || billete?.logistic_type || "N/A",
          available_quantity: billete?.disponible ?? "N/A",
          permalink: billete?.permalink || null,
          costo: billete?.costo ?? null,
          free_shipping:
            billete?.freeShipping ?? billete?.free_shipping ?? null,
          costo_envio: billete?.costoEnvio ?? billete?.costo_envio ?? null,
          inv_seguridad:
            billete?.invSeguridad ?? billete?.inv_seguridad ?? null,
          inv_maximo: billete?.invMaximo ?? billete?.inv_maximo ?? null,
          items: [
            {
              billete_id:
                selectedRow.billeteId ??
                selectedRow.billete_id ??
                billete?.billete_id,
              tipo: selectedRow.tipo,
              cantidad: selectedRow.cantidad,
              componente: {
                sku: selectedRow.sku,
                descripcion: selectedRow.descripcion,
              },
            },
          ],
        });
      }
    }

    return Array.from(map.values());
  }, [compartidos, skuPrincipal, rows, billete]);

  if (!billete) return null;

  const tieneCompartidos = productosTabs.length > 1;

  const tituloModal = modoProducto
    ? `Producto: ${billete?.productoSku || billete?.producto_sku || "N/A"}`
    : `SKU: ${skuPrincipal}`;

  const descripcionModal = modoProducto
    ? billete?.productoTitulo || billete?.titulo || "N/A"
    : descripcionPrincipal;

  const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick") return;
    onClose();
  };

  const handleChangeCantidadLocal = (rowId, rawValue) => {
    if (rawValue === "") {
      setRows((prev) =>
        prev.map((r) => (getRowId(r) === rowId ? { ...r, cantidad: "" } : r)),
      );
      return;
    }

    const n = Number(rawValue);
    if (!Number.isFinite(n) || n < 1) return;

    setRows((prev) =>
      prev.map((r) => (getRowId(r) === rowId ? { ...r, cantidad: n } : r)),
    );
  };

  const handleGuardarCantidad = async (row) => {
    const cantidadNum = Number(row.cantidad);

    if (!Number.isFinite(cantidadNum) || cantidadNum < 1) {
      onShowAlert?.({
        type: "warning",
        title: "Cantidad inválida",
        text: "La cantidad mínima es 1.",
      });
      return;
    }

    const payload = {
      producto_id: Number(
        row.producto_id ??
          row.productoId ??
          billete.producto_id ??
          billete.productoId,
      ),
      componente_id: Number(row.componente_id ?? row.componenteId),
      tipo: String(row.tipo ?? "inventario"),
      cantidad: cantidadNum,
    };

    if (!payload.producto_id || !payload.componente_id || !payload.tipo) {
      onShowAlert?.({
        type: "error",
        title: "Error de datos",
        text: "No se pudieron determinar las llaves del billete/componente.",
      });
      return;
    }

    try {
      const resp = await axios.put(
        `${apiUrl}/componentes/billetes/cantidad`,
        payload,
      );

      if (!resp.data?.ok) {
        throw new Error(resp.data?.message || "No se pudo actualizar cantidad");
      }

      const cantidadBD = resp.data.data?.cantidad ?? cantidadNum;

      setRows((prev) =>
        prev.map((r) =>
          (r.producto_id ?? billete.producto_id) === payload.producto_id &&
          (r.componente_id ?? r.componenteId) === payload.componente_id &&
          String(r.tipo ?? "inventario") === payload.tipo
            ? { ...r, cantidad: cantidadBD }
            : r,
        ),
      );

      onShowAlert?.({
        type: "success",
        title: "Actualizado",
        text: "Cantidad actualizada correctamente.",
      });
    } catch (error) {
      onShowAlert?.({
        type: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Error al actualizar la cantidad.",
      });
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "success";
      case "paused":
        return "warning";
      case "inactive":
        return "error";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  const columnsComponentes = [
    { field: "sku", headerName: "SKU componente", flex: 1, minWidth: 150 },
    {
      field: "descripcion",
      headerName: "Descripción",
      flex: 2,
      minWidth: 250,
    },
    {
      field: "cantidad",
      headerName: "Cantidad",
      flex: 1.1,
      minWidth: 190,
      renderCell: (params) => {
        const row = params.row;
        const rowId = getRowId(row);

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              value={row.cantidad ?? ""}
              onChange={(e) => handleChangeCantidadLocal(rowId, e.target.value)}
              size="small"
              type="number"
              sx={{ width: 90 }}
              inputProps={{ min: 1, step: 1 }}
            />

            <Tooltip title="Guardar cantidad">
              <IconButton
                size="small"
                onClick={() => handleGuardarCantidad(row)}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
    {
      field: "tipo",
      headerName: "Tipo",
      flex: 0.7,
      minWidth: 120,
    },
    {
      field: "uso",
      headerName: "Uso",
      flex: 1.2,
      minWidth: 190,
      renderCell: (params) => {
        const total = Number(params.row.totalProductosUso || 1);

        if (total <= 1) {
          return (
            <Chip size="small" label="Solo este producto" color="success" />
          );
        }

        return (
          <Chip
            size="small"
            label={`Compartido en ${total} productos`}
            color="warning"
          />
        );
      },
    },
  ];

  const rowsResumen = rows.filter(
    (r) => String(r.sku || "").trim() === String(skuPrincipal || "").trim(),
  );

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="lg">
      <DialogTitle>{tituloModal}</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Descripción:</strong> {descripcionModal}
          </Typography>

          {!modoProducto && tieneCompartidos && (
            <Typography variant="body2" color="warning.main">
              Este SKU aparece en {productosTabs.length} productos.
            </Typography>
          )}
        </Box>

        {!modoProducto && tieneCompartidos && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Este componente está compartido. Revisa cada pestaña de producto
            para identificar dónde se usa.
          </Alert>
        )}

        {modoProducto ? (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Componentes de este producto
            </Typography>

            <DataGrid
              autoHeight
              rows={rows}
              columns={columnsComponentes}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              getRowId={getRowId}
            />
          </>
        ) : (
          <>
            <Tabs
              value={tab}
              onChange={(e, value) => setTab(value)}
              sx={{ mb: 2 }}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Resumen" />

              {productosTabs.map((producto) => (
                <Tab
                  key={producto.producto_id}
                  label={
                    producto.producto_sku !== "N/A"
                      ? producto.producto_sku
                      : `Producto ${producto.producto_id}`
                  }
                />
              ))}
            </Tabs>

            {tab === 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Componente/s seleccionado:
                </Typography>

                <DataGrid
                  autoHeight
                  rows={rowsResumen}
                  columns={columnsComponentes}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableRowSelectionOnClick
                  getRowId={getRowId}
                />
              </>
            )}

            {productosTabs.map((producto, index) => {
              const tabIndex = index + 1;
              if (tab !== tabIndex) return null;

              return (
                <Box
                  key={producto.producto_id}
                  sx={{
                    border: "1px solid #d6e4ff",
                    borderRadius: 3,
                    p: 2.5,
                    mb: 2,
                    background:
                      "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                      gap: 2,
                      alignItems: "start",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          cursor: "pointer",
                          color: "primary.main",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                        onClick={() => onSelectProducto?.(producto)}
                      >
                        {producto.producto_title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        <strong>Producto ID:</strong> {producto.producto_id} ·{" "}
                        <strong>SKU producto:</strong>{" "}
                        <Box
                          component="span"
                          sx={{
                            cursor: "pointer",
                            color: "primary.main",
                            fontWeight: 700,
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() => onSelectProducto?.(producto)}
                        >
                          {producto.producto_sku}
                        </Box>{" "}
                        · <strong>MLM:</strong> {producto.mlm}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        <strong>Catálogo:</strong>{" "}
                        {producto.catalog_id || "N/A"} ·{" "}
                        <strong>Inventario:</strong>{" "}
                        {producto.inventory_id || "N/A"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Chip
                        size="small"
                        label={producto.status || "Sin status"}
                        color={getStatusColor(producto.status)}
                      />
                      <Chip
                        size="small"
                        label={producto.logistic_type || "Sin logística"}
                      />
                      <Chip
                        size="small"
                        label={`Stock: ${producto.available_quantity ?? "N/A"}`}
                        color="info"
                      />

                      {producto.permalink && (
                        <Button
                          size="small"
                          variant="outlined"
                          href={producto.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: "none" }}
                        >
                          Ver publicación
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {producto.items.map((item) => {
                    const esSkuPrincipal =
                      item.componente?.sku === skuPrincipal;

                    return (
                      <Box
                        key={item.billete_id}
                        sx={{
                          border: esSkuPrincipal
                            ? "1px solid #ffcc80"
                            : "1px solid #e0e0e0",
                          borderRadius: 2,
                          p: 2,
                          mb: 1.5,
                          backgroundColor: esSkuPrincipal ? "#fff8e1" : "#fff",
                        }}
                      >
                        <Typography sx={{ fontWeight: 800 }}>
                          {item.componente?.sku} —{" "}
                          {item.componente?.descripcion}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          <strong>Billete ID:</strong> {item.billete_id} ·{" "}
                          <strong>Tipo:</strong> {item.tipo} ·{" "}
                          <strong>Cantidad:</strong> {item.cantidad}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DetalleBilleteDialog;
