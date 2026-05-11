import React from "react";
import { Modal, Box, Typography, Button } from "@mui/material";

const UbicacionesComponenteModal = ({
  open,
  onClose,
  componente,
  ubicaciones,
  onEliminar,
  onSelectProducto,
}) => {
  const handleSelectProducto = (u) => {
    onClose?.();

    onSelectProducto?.({
      producto_id: u.producto_id,
      producto_sku: u.producto_sku,
      producto_title: u.producto_title,
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 24,
          p: 3,
          width: { xs: "95vw", md: "850px" },
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Ubicaciones del componente
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          <b>SKU:</b> {componente?.sku || "N/A"}
          <br />
          <b>Descripción:</b> {componente?.descripcion || "N/A"}
        </Typography>

        {ubicaciones.length === 0 ? (
          <Typography variant="body2">
            Este componente ya no está enlazado a ningún producto.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {ubicaciones.map((u) => (
              <Box
                key={u.billete_id}
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  p: 2,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1fr auto",
                  },
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      cursor: "pointer",
                      color: "primary.main",
                      "&:hover": { textDecoration: "underline" },
                    }}
                    onClick={() => handleSelectProducto(u)}
                  >
                    {u.producto_title || "Producto sin título"}
                  </Typography>

                  <Typography variant="body2">
                    <b>Producto ID:</b> {u.producto_id} · <b>SKU:</b>{" "}
                    <Box
                      component="span"
                      sx={{
                        cursor: "pointer",
                        color: "primary.main",
                        fontWeight: 700,
                        "&:hover": { textDecoration: "underline" },
                      }}
                      onClick={() => handleSelectProducto(u)}
                    >
                      {u.producto_sku || "N/A"}
                    </Box>
                  </Typography>

                  <Typography variant="body2">
                    <b>Tipo:</b> {u.tipo} · <b>Cantidad:</b> {u.cantidad}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => onEliminar(u)}
                >
                  Quitar
                </Button>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button variant="outlined" onClick={onClose}>
            Cerrar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UbicacionesComponenteModal;