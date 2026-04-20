import React from "react";
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const styleAddBillete = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
  maxHeight: "90vh",
  overflowY: "auto",
};

const AgregarBilleteModal = ({
  open,
  onClose,
  productoSkuComponente,
  onProductoSkuChange,
  onKeyDownComponent,
  onBlurComponent,
  onOpenSearchComponentes,
  cantidad,
  onCantidadChange,
  tipo,
  onTipoChange,
  onSave,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          ...styleAddBillete,
          width: { xs: "92vw", sm: "80vw", md: "700px" },
          p: 4,
        }}
      >
        <Typography
          sx={{
            fontFamily: "Montserrat",
            fontWeight: "bold",
            textAlign: "center",
            mb: 3,
            fontSize: "1.4rem",
          }}
        >
          Agregar nuevo billete
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2.5,
          }}
        >
          <TextField
            label="Componente"
            variant="outlined"
            value={productoSkuComponente}
            onChange={onProductoSkuChange}
            onKeyDown={onKeyDownComponent}
            onBlur={onBlurComponent}
            fullWidth
            sx={{ gridColumn: "1 / -1" }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon
                    style={{
                      cursor: "pointer",
                      color: "blue",
                    }}
                    onClick={onOpenSearchComponentes}
                  />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Cantidad"
            variant="outlined"
            type="number"
            value={cantidad}
            onChange={onCantidadChange}
            inputProps={{ min: 1 }}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id="select-tipo-label">Tipo</InputLabel>
            <Select
              labelId="select-tipo-label"
              id="select-tipo"
              value={tipo}
              label="Tipo"
              onChange={onTipoChange}
            >
              <MenuItem value={"Inventario"}>Inventario</MenuItem>
              <MenuItem value={"Costo"}>Costo</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 4,
          }}
        >
          <Button onClick={onClose} variant="contained" color="primary">
            Cerrar
          </Button>

          <Button onClick={onSave} variant="contained" color="success">
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AgregarBilleteModal;