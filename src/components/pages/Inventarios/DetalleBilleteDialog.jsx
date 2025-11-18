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
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";
import Swal from "sweetalert2";

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
  onUpdateComponent,
}) {
  if (!billete) return null;

  // OJO: ajusta estos nombres de campos a tu API real
  const {
    billete_id,
    titulo,
    tipo,
    productoSku,
    productoTitulo,
    proveedorNombre,
    publicacionId,
    permalink,
    componentes = [],
  } = billete;

  // valores seguros para que no truene
  const publicacionIdSafe = publicacionId || "N/A";
  const productoTituloSafe = productoTitulo || "N/A";
  const productoSkuSafe = productoSku || "N/A";
  const permalinkSafe = permalink || null;

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
      flex: 0.6,
      minWidth: 100,
      type: "number",
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
      // <Tooltip
      //   key={`upd-comp-${params.id}`}
      //   title="Actualizar componente"
      // >
      //  <GridActionsCellItem
      //     icon={<RefreshIcon />}
      //     label="Actualizar componente"
      //     onClick={() => {
      //       console.log("Click actualizar", params.row); 
      //       onUpdateComponent && onUpdateComponent(params.row);
      //     }}
      //     showInMenu={false}
      //   />
      // </Tooltip>,

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

  const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick") return; // ignorar click en el fondo
    onClose(); // solo cierra cuando tú lo mandes
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Billete: {titulo} ({billete_id})
      </DialogTitle>

      <DialogContent dividers>
        {/* INFO BILLETE / PRODUCTO */}
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
            {/* agrega más campos si tienes (estatus, fecha, etc.) */}
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

        {/* HEADER COMPONENTES + BOTONES */}
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

        {/* TABLA DE COMPONENTES */}
        <DataGrid
          autoHeight
          rows={componentes}
          columns={columnsComponentes}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id || row.componente_id || row.sku}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DetalleBilleteDialog;
