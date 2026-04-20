import React from "react";
import { Box, Button, Modal, TextField } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

const modalStyle = {
  position: "absolute",
  width: 1400,
  height: 600,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
};

const BuscarProductoModal = ({
  open,
  onClose,
  searchTerm,
  onSearchChange,
  rows,
  columns,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <TextField
          label="Buscador..."
          color="primary"
          focused
          sx={{ width: "20rem", marginBottom: "10px" }}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <div style={{ width: "100%", height: 500, overflowX: "auto" }}>
          <div style={{ minWidth: columns.length * 160 }}>
            <DataGrid
              sx={{
                borderRadius: 4,
                boxShadow: 24,
                borderWidth: 3,
                borderColor: "#1e88e5",
              }}
              rows={rows}
              columns={columns}
              pageSize={5}
              showCellVerticalBorder
              showColumnVerticalBorder
              getRowId={(row) => row.producto_id}
              experimentalFeatures={{ newEditingApi: true }}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={onColumnVisibilityModelChange}
              density="compact"
              slots={{ toolbar: GridToolbar }}
              autoWidth
            />
          </div>
        </div>

        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{
            marginTop: "10px",
            marginLeft: "93%",
          }}
        >
          Cerrar
        </Button>
      </Box>
    </Modal>
  );
};

export default BuscarProductoModal;