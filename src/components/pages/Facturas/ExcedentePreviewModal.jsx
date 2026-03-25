import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import LinkOffIcon from "@mui/icons-material/LinkOff";

const ExcedentePreviewModal = ({
  open,
  rows = [],
  loading = false,
  onClose,
  onSingle,
  onMassive,
}) => {
  const totalExcedente = rows.reduce(
    (sum, row) => sum + Number(row.cantidad_asignada || 0),
    0,
  );

  const columns = [
    {
      field: "factura_detalle_asignacion_id",
      headerName: "Asignación",
      width: 110,
    },
    {
      field: "pedido_id",
      headerName: "Pedido",
      width: 90,
    },
    {
      field: "pedido_linea_id",
      headerName: "Línea pedido",
      width: 120,
    },
    {
      field: "orden_compra_detalle_id",
      headerName: "OC detalle",
      width: 110,
    },
    {
      field: "op_detalle_id",
      headerName: "OP detalle",
      width: 110,
    },
    {
      field: "orden_produccion_id",
      headerName: "OP",
      width: 90,
    },
    {
      field: "cantidad_asignada",
      headerName: "Cantidad",
      width: 120,
    },
    {
      field: "estatus_linea",
      headerName: "Estatus línea",
      width: 130,
    },
    {
      field: "estatus_oc",
      headerName: "Estatus OC",
      width: 120,
    },
    {
      field: "estatus_orden",
      headerName: "Estatus OP",
      width: 120,
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Desenlazar esta asignación">
          <IconButton color="error" onClick={() => onSingle(params.row)}>
            <LinkOffIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }
        onClose();
      }}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          width: "80vw",
          maxWidth: "1300px",
          height: "70vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle>Asignaciones de excedente enlazadas</DialogTitle>

      <DialogContent
        dividers
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            Total de asignaciones: {rows.length}
          </Typography>
          <Typography variant="body2">
            Cantidad total excedente: {totalExcedente.toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.factura_detalle_asignacion_id}
            disableRowSelectionOnClick
            loading={loading}
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            sx={{
              borderRadius: 2,
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>

        <Button
          color="error"
          variant="contained"
          onClick={onMassive}
          disabled={!rows.length}
        >
          Desenlazar todo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExcedentePreviewModal;
