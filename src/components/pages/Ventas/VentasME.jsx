// Ventas Mercado Envíos: colecta de la cuenta principal y de la subcuenta Refaccionaria en pestañas.
import React, { useState } from "react";
import { Box, Chip, GlobalStyles, Paper, Tab, Tabs, Typography } from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

import ColectaPrincipal from "./ColectaPrincipal";
// [MULTICUENTA-ML] Colecta de la subcuenta como pestaña
import ColectaSubcuenta from "../../multicuentaML/ColectaSubcuenta";
// [/MULTICUENTA-ML]

const PESTANAS = [
  { valor: "aphelios", label: "Colecta Aphelios", icon: <StorefrontOutlinedIcon fontSize="small" /> },
  // [MULTICUENTA-ML]
  { valor: "refa", label: "Colecta Refaccionaria", icon: <BuildOutlinedIcon fontSize="small" /> },
  // [/MULTICUENTA-ML]
];

const VentasME = ({ tabInicial = "aphelios" }) => {
  const [tab, setTab] = useState(tabInicial);
  // Una pestaña se monta al abrirla por primera vez y se conserva (no recarga al regresar)
  const [abiertas, setAbiertas] = useState(() => new Set([tabInicial]));

  const cambiarTab = (e, v) => {
    setTab(v);
    setAbiertas((prev) => new Set(prev).add(v));
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />

      <Paper elevation={2} sx={{ p: 1.5, pb: 0, borderRadius: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, display: "flex", gap: 1, alignItems: "center" }}>
              <LocalShippingOutlinedIcon color="primary" /> Ventas Mercado Envíos
              <Chip size="small" label="Colecta" sx={{ bgcolor: "#e3f2fd", color: "primary.main", fontWeight: 700 }} />
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: "block" }}>
              Envíos que se surten desde nuestro almacén: imprime etiquetas y procesa los recolectados por cuenta.
            </Typography>
          </Box>
        </Box>
        <Tabs value={tab} onChange={cambiarTab} variant="scrollable" allowScrollButtonsMobile sx={{ mt: 1, minHeight: 42 }}>
          {PESTANAS.map((p) => (
            <Tab
              key={p.valor}
              value={p.valor}
              label={p.label}
              icon={p.icon}
              iconPosition="start"
              sx={{ textTransform: "none", fontWeight: 600, minHeight: 42 }}
            />
          ))}
        </Tabs>
      </Paper>

      {abiertas.has("aphelios") && (
        <Box sx={{ display: tab === "aphelios" ? "block" : "none" }}>
          <ColectaPrincipal />
        </Box>
      )}
      {/* [MULTICUENTA-ML] */}
      {abiertas.has("refa") && (
        <Box sx={{ display: tab === "refa" ? "block" : "none" }}>
          <ColectaSubcuenta embebido />
        </Box>
      )}
      {/* [/MULTICUENTA-ML] */}
    </Box>
  );
};

export default VentasME;
