import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

import dayjs from "dayjs";

import AppDataGrid from "../../../common/AppDataGrid";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../../../common/modalStyles";

import {
  toolbarFieldSx,
} from "../../../common/formStyles";

const AsignarEnvioModal = ({
  open,
  rows = [],
  loading = false,
  saving = false,
  selectedEnvio = null,
  onSelectedEnvioChange,
  onClose,
  onConfirm,
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
  // FILTRO
  // ==============================

  const filteredRows = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return rows;
    }

    return rows.filter((row) => {
      const id = String(
        row.id ?? "",
      ).toLowerCase();

      const descripcion = String(
        row.descripcion ?? "",
      ).toLowerCase();

      const estatus = String(
        row.estatus ?? "",
      ).toLowerCase();

      return (
        id.includes(searchValue) ||
        descripcion.includes(searchValue) ||
        estatus.includes(searchValue)
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
        headerName: "ID",
        width: 90,
      },
      {
        field: "descripcion",
        headerName: "Descripción",
        flex: 1.5,
        minWidth: 220,
      },
      {
        field: "fecha_creacion",
        headerName: "Fecha de creación",
        flex: 1,
        minWidth: 150,
        valueFormatter: (value) => {
          if (!value) return "";

          return dayjs(value).format(
            "DD/MM/YYYY",
          );
        },
      },
      {
        field: "fecha_programada",
        headerName: "Fecha programada",
        flex: 1,
        minWidth: 160,
        valueFormatter: (value) => {
          if (!value) return "";

          return dayjs(value).format(
            "DD/MM/YYYY",
          );
        },
      },
      {
        field: "estatus",
        headerName: "Estatus",
        flex: 0.8,
        minWidth: 120,
      },
    ],
    [],
  );

  // ==============================
  // SELECCIÓN
  // ==============================

  const handleSelectionChange = (
    selection,
  ) => {
    const selectedId =
      selection?.[0] ?? null;

    onSelectedEnvioChange(
      selectedId,
    );
  };

  // ==============================
  // CERRAR
  // ==============================

  const handleClose = () => {
    if (saving) return;

    setSearch("");
    onClose();
  };

  // ==============================
  // CONFIRMAR
  // ==============================

  const handleConfirm = () => {
    if (!selectedEnvio) return;

    onConfirm();
  };

  // ==============================
  // RENDER
  // ==============================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={modalTitleSx}>
        <Typography
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1a237e",
          }}
        >
          Asignar órdenes a envío
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#607d8b",
          }}
        >
          Selecciona el envío al que deseas
          asignar las órdenes de retiro.
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          ...modalContentSx,
          minHeight: "500px",
        }}
      >
        <TextField
          label="Buscar envío"
          placeholder="Buscar por descripción, ID o estatus..."
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
            mb: 2,
          }}
        />

        <AppDataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={
            selectedEnvio
              ? [selectedEnvio]
              : []
          }
          onRowSelectionModelChange={
            handleSelectionChange
          }
          exportFileName="envios_abiertos"
          initialColumnVisibilityModel={{
            id: false,
          }}
          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[
            10,
            25,
            50,
          ]}
        />
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={saving}
          sx={modalSecondaryButtonSx}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={
            !selectedEnvio ||
            saving
          }
          sx={modalPrimaryButtonSx}
        >
          {saving
            ? "Asignando..."
            : "Confirmar asignación"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AsignarEnvioModal;