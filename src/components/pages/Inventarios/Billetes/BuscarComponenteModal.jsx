import React from "react";
import { Box, Button, Modal, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

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

const BuscarComponenteModal = ({
  open,
  onClose,
  searchTerm,
  onSearchChange,
  rows,
  columns,
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

        <div style={{ width: "100%", height: "85%", overflowX: "auto" }}>
          <DataGrid
            style={{
              fontFamily: "Montserrat",
              fontWeight: "bold",
              width: "100%",
            }}
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
            getRowId={(row) => row.componente_id}
            experimentalFeatures={{ newEditingApi: true }}
            density="compact"
            columnVisibilityModel={{
              variation_id: false,
              componente_id: false,
            }}
          />
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

export default BuscarComponenteModal;