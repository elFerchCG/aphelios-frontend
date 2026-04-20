import React from "react";
import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BulkBilletesButton from "./BulkBilletesButton";

const BilletesToolbar = ({
  productoSku,
  onProductoSkuChange,
  onKeyDown,
  onBlur,
  onOpenSearchProducts,
  title,
  onBulkSuccess,
  onOpenAddBillete,
  onResetBilletes,
}) => {
  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      {/* FILA 1 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "auto 280px auto 1fr auto",
          },
          alignItems: "center",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>Producto:</Typography>

        <TextField
          size="small"
          value={productoSku}
          onChange={onProductoSkuChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon
                  sx={{ cursor: "pointer", color: "blue" }}
                  onClick={onOpenSearchProducts}
                />
              </InputAdornment>
            ),
          }}
        />

        <Typography sx={{ fontWeight: 700 }}>Título:</Typography>

        <Typography
          sx={{
            minHeight: 24,
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title || "—"}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "flex-start", md: "flex-end" },
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              px: 2,
              py: 0.8,
              height: "36px",
              whiteSpace: "nowrap",
            }}
            onClick={onResetBilletes}
            disabled={!productoSku && !title}
          >
            Ver todos
          </Button>

          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              px: 2,
              py: 0.8,
              height: "36px",
              whiteSpace: "nowrap",
            }}
            onClick={onOpenAddBillete}
          >
            AGREGAR BILLETE
          </Button>
        </Box>
      </Box>

      {/* FILA 2 */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <BulkBilletesButton onSuccess={onBulkSuccess} />
      </Box>
    </Box>
  );
};

export default BilletesToolbar;
