import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import EditNoteIcon from "@mui/icons-material/EditNote";
import AddLocationAltOutlinedIcon from "@mui/icons-material/AddLocationAltOutlined";

import AppDataGrid from "../../../../common/AppDataGrid";

import {
  modalTitleSx,
  modalActionsSx,
  modalSecondaryButtonSx,
} from "../../../../common/modalStyles";

import {
  toolbarButtonSx,
  toolbarFieldSx,
} from "../../../../common/formStyles";

const UbicacionesModal = ({
  open,
  bodega = null,
  rows = [],
  loading = false,
  onClose,
  onCreate,
  onEdit,
}) => {
  const [search, setSearch] =
    useState("");

  // ==============================
  // LIMPIAR BUSCADOR
  // ==============================

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // ==============================
  // FILTRADO
  // ==============================

  const filteredRows = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return rows;
    }

    return rows.filter((row) => {
      const descripcion = String(
        row.descripcion ?? "",
      ).toLowerCase();

      return descripcion.includes(
        searchValue,
      );
    });
  }, [rows, search]);

  // ==============================
  // COLUMNAS
  // ==============================

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Folio",
        width: 90,
      },
      {
        field: "descripcion",
        headerName: "Descripción",
        flex: 1.5,
        minWidth: 250,
      },
      {
        field: "disponible",
        headerName:
          "Disponible para ventas",
        flex: 0.8,
        minWidth: 170,

        valueGetter: (value) =>
          Number(value) === 1
            ? "Sí"
            : "No",
      },
      {
        field: "activo",
        headerName: "Estatus",
        flex: 0.7,
        minWidth: 120,

        valueGetter: (value) =>
          Number(value) === 1
            ? "Activo"
            : "Inactivo",
      },
      {
        field: "actions",
        headerName: "Acciones",
        width: 120,
        sortable: false,
        filterable: false,

        renderCell: (params) => (
          <Tooltip
            title="Editar ubicación"
            arrow
          >
            <IconButton
              size="small"
              onClick={() =>
                onEdit(params.row)
              }
              sx={{
                color: "#1976d2",

                "&:hover": {
                  color: "#1565c0",
                  backgroundColor:
                    "rgba(25, 118, 210, 0.08)",
                },
              }}
            >
              <EditNoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [onEdit],
  );

  // ==============================
  // CERRAR
  // ==============================

  const handleClose = () => {
    if (loading) return;

    setSearch("");
    onClose();
  };

  // ==============================
  // RENDER
  // ==============================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "94vw",
          maxWidth: "1600px",
          height: "84vh",
          maxHeight: "900px",
          borderRadius: "16px",
          overflow: "hidden",
        },
      }}
    >
      {/* ======================== */}
      {/* HEADER */}
      {/* ======================== */}

      <DialogTitle
        sx={{
          ...modalTitleSx,
          px: 3,
          py: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "#1a237e",
          }}
        >
          Ubicaciones
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#607d8b",
          }}
        >
          Administra las ubicaciones de{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              color: "#455a64",
            }}
          >
            {bodega?.nombre ||
              bodega?.Nombre ||
              "la bodega seleccionada"}
          </Box>
          .
        </Typography>
      </DialogTitle>

      {/* ======================== */}
      {/* CONTENIDO */}
      {/* ======================== */}

      <DialogContent
        dividers
        sx={{
          px: 3,
          py: 2.5,

          display: "flex",
          flexDirection: "column",

          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* ====================== */}
        {/* TOOLBAR */}
        {/* ====================== */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            width: "100%",
            mb: 2,
          }}
        >
          <TextField
            label="Buscar ubicación"
            placeholder="Buscar por descripción..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            sx={{
              ...toolbarFieldSx,
              width: {
                xs: "100%",
                sm: "360px",
              },
            }}
          />

          <Button
            variant="contained"
            startIcon={
              <AddLocationAltOutlinedIcon />
            }
            onClick={onCreate}
            disabled={loading}
            sx={{
              ...toolbarButtonSx,
              ml: {
                xs: 0,
                sm: "auto",
              },
            }}
          >
            Agregar ubicación
          </Button>
        </Box>

        {/* ====================== */}
        {/* TABLA */}
        {/* ====================== */}

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            width: "100%",
          }}
        >
          <AppDataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            exportFileName="ubicaciones"
            initialColumnVisibilityModel={{
              id: false,
            }}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: 100,
                },
              },
            }}
            pageSizeOptions={[
              25,
              50,
              100,
            ]}
            sx={{
              height: "100%",
              minHeight: "450px",
            }}
          />
        </Box>
      </DialogContent>

      {/* ======================== */}
      {/* FOOTER */}
      {/* ======================== */}

      <DialogActions
        sx={{
          ...modalActionsSx,
          px: 3,
          py: 1.5,
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={loading}
          sx={modalSecondaryButtonSx}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UbicacionesModal;