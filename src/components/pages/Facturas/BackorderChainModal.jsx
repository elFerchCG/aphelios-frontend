import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";

const BackorderChainModal = ({
  open,
  chain = [],
  linkedCount = 0,
  currentPedidoLineaId, // ✅ NUEVO (el id donde está parado el usuario)
  onClose,
  onSingle,
  onReset,
}) => {
  const parent = chain.find((r) => Number(r.is_parent) === 1);

  const FACTURA_STATUS_MAP = {
    pendiente: { label: "Pendiente", color: "warning" },
    recibido: { label: "Recibido", color: "success" },
    cancelado: { label: "Cancelado", color: "error" },
    borrador: { label: "Borrador", color: "default" },
  };

  const getFacturaStatusChip = (estatus) => {
    const cfg = FACTURA_STATUS_MAP[estatus] || {
      label: estatus || "—",
      color: "default",
    };

    return (
      <Chip size="small" label={cfg.label} color={cfg.color} sx={{ ml: 1 }} />
    );
  };

  const getFacturaLabel = (row) =>
    row?.numero_factura || row?.folio_ui || row?.folio || "—";

  const getFechaLabel = (row) => row?.fecha_factura || row?.fecha_arribo || "—";

  const getSkuLabel = (row) => row?.sku_factura || "—";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Este pedido está ligado a varias facturas</DialogTitle>

      <DialogContent dividers>
        <Typography gutterBottom>
          Esta línea no es independiente. Este pedido se fue completando por
          partes y algunas partes quedaron pendientes para otras facturas.
        </Typography>

        <Typography gutterBottom>
          Para evitar errores, elige cómo deseas continuar.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography gutterBottom>
          Detectamos que este pedido aparece en <b>{linkedCount}</b> factura(s).
        </Typography>

        <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
          <b>¿Qué significa “Papá” y “Hija”?</b>
          <br />• <b>Papá:</b> es la línea original del pedido (la primera).
          <br />• <b>Hijas:</b> son líneas que nacieron de esa original cuando
          el pedido quedó incompleto y se continuó después.
        </Typography>

        {parent && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            🏁 <b>Primera (Papá):</b> Factura <b>{getFacturaLabel(parent)}</b> ·{" "}
            {getFechaLabel(parent)} · SKU <b>{getSkuLabel(parent)}</b>
          </Typography>
        )}

        {/* Timeline */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {chain.map((row, idx) => {
            const isCurrent =
              Number(row.pedido_linea_id) === Number(currentPedidoLineaId);

            return (
              <Tooltip
                key={row.pedido_linea_id}
                title={isCurrent ? "Estás aquí" : ""}
                placement="top"
                disableHoverListener={!isCurrent}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    border: isCurrent
                      ? "1px solid rgba(25,118,210,0.55)" // azul
                      : "1px solid rgba(0,0,0,0.12)",
                    backgroundColor: isCurrent
                      ? "rgba(25,118,210,0.08)" // azul claro
                      : "transparent",
                    boxShadow: isCurrent
                      ? "0 0 0 2px rgba(25,118,210,0.12)"
                      : "none",
                    transition: "all 150ms ease",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    {/* Factura + estatus */}
                    <Typography variant="body2" noWrap>
                      #{idx + 1} · Factura <b>{getFacturaLabel(row)}</b>
                      <br />
                      Estatus:{getFacturaStatusChip(row.estatus_factura)}
                      {isCurrent && (
                        <Chip
                          label="Estás aquí"
                          size="small"
                          color="info"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>

                    {/* Proveedor */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      Proveedor: <b>{row.proveedor || "—"}</b>
                    </Typography>

                    {/* SKU + Fecha */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      SKU: <b>{getSkuLabel(row)}</b> · Fecha:{" "}
                      <b>{getFechaLabel(row)}</b>
                    </Typography>

                    {/* Pedido línea */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      Pedido #{row.pedido_id} · Línea {row.pedido_linea_id} ·{" "}
                      {row.fecha_pedido || "—"}
                    </Typography>
                  </Box>

                  {/* Etiqueta padre/hija */}
                  {Number(row.is_parent) === 1 ? (
                    <Chip label="Papá" color="primary" size="small" />
                  ) : (
                    <Chip label="Hija" size="small" />
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        <Typography sx={{ mt: 2 }} variant="body2">
          <b>¿Qué deseas hacer con este pedido?</b>
          <br />• <b>Solo esta línea:</b> quita el enlace únicamente de esta
          factura, sin tocar las demás.
          <br />• <b>Reset hasta papá:</b> deshace toda la cadena y regresa el
          pedido a como estaba originalmente (elimina hijas y enlaces
          posteriores).
          <br />
          <span style={{ color: "#d32f2f" }}>
            “Reset hasta papá” es una acción fuerte: úsala solo si quieres
            regresar todo a su estado original.
          </span>
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onSingle} color="warning">
          Solo esta línea
        </Button>
        <Button onClick={onReset} color="error" variant="contained">
          Reset hasta papá
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BackorderChainModal;