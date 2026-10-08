import React from "react";

import {
  Box,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import PageToolbarCard from "../../../common/PageToolbarCard";

import {
  toolbarFieldSx,
  fieldWidths,
} from "../../../common/formStyles";

const ProductosApheliosToolbar = ({
  busqueda,
  onBusquedaChange,

  estado,
  onEstadoChange,
}) => {
  return (
    <PageToolbarCard>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",

          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* ===============================================
            BUSCADOR
        =============================================== */}

        <TextField
          label="Buscar producto"
          placeholder="SKU, nombre, MLMU, MLM o Family"
          value={busqueda}
          onChange={(event) =>
            onBusquedaChange(
              event.target.value,
            )
          }
          sx={{
            ...toolbarFieldSx,

            width:
              fieldWidths.large,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* ===============================================
            ESTADO
        =============================================== */}

        <FormControl
          sx={{
            ...toolbarFieldSx,

            width:
              fieldWidths.medium,
          }}
        >
          <Select
            value={estado}
            onChange={
              onEstadoChange
            }
            displayEmpty
          >
            <MenuItem value="todos">
              Todos
            </MenuItem>

            <MenuItem value="activos">
              Activos
            </MenuItem>

            <MenuItem value="obsoletos">
              Obsoletos
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
    </PageToolbarCard>
  );
};

export default ProductosApheliosToolbar;