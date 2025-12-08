import React, { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Tooltip,
  TextField,
  IconButton,
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
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
  onDeleteComponent,
  onAddComponent,
  onShowAlert, // 👈 NUEVO: el padre muestra el Swal y maneja cerrar/abrir
}) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!billete || !Array.isArray(billete.componentes)) {
      setRows([]);
      return;
    }

    const withInternalId = billete.componentes.map((r, index) => ({
      ...r,
      _rowId: index,
    }));

    setRows(withInternalId);
  }, [billete]);

  if (!billete) return null;

  const {
    billete_id,
    titulo,
    tipo,
    productoSku,
    productoTitulo,
    publicacionId,
    permalink,
  } = billete;

  const publicacionIdSafe = publicacionId || "N/A";
  const productoTituloSafe = productoTitulo || "N/A";
  const productoSkuSafe = productoSku || "N/A";
  const permalinkSafe = permalink || null;

  const getRowId = (row) => row._rowId;

  // ================== HANDLERS ==================

  // Solo acepta números >= 1, pero deja vacío mientras escribe
  const handleChangeCantidadLocal = (rowId, rawValue) => {
    if (rawValue === "") {
      setRows((prev) =>
        prev.map((r) =>
          getRowId(r) === rowId ? { ...r, cantidad: "" } : r
        )
      );
      return;
    }

    const n = Number(rawValue);

    if (!Number.isFinite(n) || n < 1) {
      // ignoramos si no es número o < 1
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        getRowId(r) === rowId ? { ...r, cantidad: n } : r
      )
    );
  };

  const handleGuardarCantidad = async (row) => {
    const cantidadNum = Number(row.cantidad);

    if (!Number.isFinite(cantidadNum) || cantidadNum < 1) {
      onShowAlert &&
        onShowAlert({
          type: "warning",
          title: "Cantidad inválida",
          text: "La cantidad mínima es 1 y solo se aceptan números.",
        });
      return;
    }

    const productoId =
      row.producto_id ??
      row.productoId ??
      billete.producto_id ??
      billete.productoId ??
      null;

    const componenteId =
      row.componente_id ??
      row.componenteId ??
      row.id_componente ??
      row.comp_id ??
      null;

    const tipoValor =
      row.tipo ??
      row.tipo_billete ??
      row.tipoBillete ??
      "inventario";

    const payload = {
      producto_id: Number(productoId),
      componente_id: Number(componenteId),
      tipo: String(tipoValor),
      cantidad: cantidadNum,
    };

    if (!payload.producto_id || !payload.componente_id || !payload.tipo) {
      console.warn(
        "Faltan llaves para actualizar cantidad. row:",
        row,
        "payload:",
        payload,
        "billete:",
        billete
      );
      onShowAlert &&
        onShowAlert({
          type: "error",
          title: "Error de datos",
          text: "No se pudieron determinar las llaves del billete/componente.",
        });
      return;
    }

    try {
      const resp = await axios.put(`${apiUrl}/componentes/billetes/cantidad`, payload);

      if (!resp.data || !resp.data.ok) {
        throw new Error(
          resp.data?.message || "No se pudo actualizar cantidad"
        );
      }

      const cantidadBD = resp.data.data?.cantidad ?? cantidadNum;

      setRows((prev) =>
        prev.map((r) =>
          (r.producto_id ?? billete.producto_id) === payload.producto_id &&
          (r.componente_id ?? r.componenteId) === payload.componente_id &&
          (r.tipo ?? r.tipo_billete ?? r.tipoBillete) === payload.tipo
            ? { ...r, cantidad: cantidadBD }
            : r
        )
      );

      onShowAlert &&
        onShowAlert({
          type: "success",
          title: "Actualizado",
          text: "Cantidad actualizada correctamente.",
        });
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
      onShowAlert &&
        onShowAlert({
          type: "error",
          title: "Error",
          text:
            error.response?.data?.message ||
            error.message ||
            "Error al actualizar la cantidad del billete.",
        });
    }
  };

  const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick") return;
    onClose();
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
      flex: 1.2,
      minWidth: 200,
      renderCell: (params) => {
        const row = params.row;
        const rowId = getRowId(row);
        const valor = row.cantidad ?? "";

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              value={valor}
              onChange={(e) =>
                handleChangeCantidadLocal(rowId, e.target.value)
              }
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
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => [
        <Tooltip
          key={`del-comp-${params.id}`}
          title="Eliminar componente del billete"
        >
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Eliminar componente del billete"
            onClick={() => onDeleteComponent(params.row)}
            color="error"
            showInMenu={false}
          />
        </Tooltip>,
      ],
    },
  ];

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Billete: {titulo} ({billete_id})
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Datos del billete
            </Typography>
            <Typography variant="body2">
              <strong>Folio:</strong> {billete_id}
            </Typography>
            <Typography variant="body2">
              <strong>Tipo:</strong> {tipo}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Datos de la publicación enlazada al componente
            </Typography>

            <Typography variant="body2">
              <strong>MLM publicación:</strong> {publicacionIdSafe}
            </Typography>

            <Typography variant="body2">
              <strong>SKU publicación:</strong> {productoSkuSafe}
            </Typography>

            <Typography variant="body2">
              <strong>Título publicación:</strong> {productoTituloSafe}
            </Typography>

            <Typography variant="body2">
              <strong>Enlace:</strong>{" "}
              {permalinkSafe ? (
                <a
                  href={permalinkSafe}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver publicación
                </a>
              ) : (
                "N/A"
              )}
            </Typography>
          </Grid>
        </Grid>

        <Box
          mb={1}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1">
            Componentes ligados al billete
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onAddComponent(billete)}
            >
              Agregar componente
            </Button>
          </Box>
        </Box>

        <DataGrid
          autoHeight
          rows={rows}
          columns={columnsComponentes}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          getRowId={getRowId}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DetalleBilleteDialog;
