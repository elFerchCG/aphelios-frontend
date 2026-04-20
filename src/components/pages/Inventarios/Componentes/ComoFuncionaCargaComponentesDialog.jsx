import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";

const ComoFuncionaCargaComponentesDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>¿Cómo funciona la carga masiva de componentes?</DialogTitle>

      <DialogContent dividers>
        <Typography gutterBottom>
          Esta plantilla te permite <strong>crear</strong> o{" "}
          <strong>actualizar</strong> componentes desde un archivo de Excel.
        </Typography>

        <Typography gutterBottom>
          • Si el <strong>SKU</strong> ya existe en la base de datos, el
          componente se <strong>ACTUALIZA</strong>.
          <br />• Si el <strong>SKU</strong> no existe pero el{" "}
          <strong>sku_viejo</strong> sí existe en la base, se actualizará ese
          mismo componente con el nuevo SKU.
          <br />• Si no existe ni el <strong>SKU</strong> ni el{" "}
          <strong>sku_viejo</strong>, se <strong>CREA</strong> un nuevo
          componente.
        </Typography>

        <Typography gutterBottom>
          <strong>Campos:</strong>
        </Typography>

        <Box component="ul" sx={{ pl: 3, mt: 1 }}>
          <li>
            <Typography variant="body2">
              <strong>sku</strong>: código actual del componente. Debe ser
              único.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>descripcion</strong>: descripción del componente.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>proveedor_id</strong>: id numérico del proveedor
              principal.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>proveedor_secundario_id</strong> (opcional): id numérico
              del proveedor secundario.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>multiplo</strong>: entero ≥ 1.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>factor_conversion</strong>: entero ≥ 1.
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>sku_viejo</strong> (opcional): SKU anterior si estás
              migrando o cambiando códigos.
            </Typography>
          </li>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Tip: puedes usar la opción <strong>"Simular primero"</strong> para
          revisar qué se insertará y qué se actualizará antes de aplicar
          cambios reales.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComoFuncionaCargaComponentesDialog;