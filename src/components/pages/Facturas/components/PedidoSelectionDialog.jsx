import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";

import dayjs from "dayjs";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../../../common/modalStyles";

const PedidoSelectionDialog = ({
  open,
  onClose,
  pedidos = [],
  selectedPedido,
  onSelectPedido,
  loading = false,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={modalTitleSx}>
        Seleccionar pedido
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Selecciona el pedido donde se agregará esta línea.
          Se muestran los pedidos más recientes de los proveedores
          configurados para el componente.
        </Typography>

        {/* =========================================
            LOADING
        ========================================= */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 5,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}

        {/* =========================================
            SIN PEDIDOS
        ========================================= */}
        {!loading && pedidos.length === 0 && (
          <Box
            sx={{
              py: 4,
              textAlign: "center",
            }}
          >
            <Typography
              color="text.secondary"
              variant="body2"
            >
              No hay pedidos disponibles para los proveedores
              configurados en este componente.
            </Typography>
          </Box>
        )}

        {/* =========================================
            PEDIDOS
        ========================================= */}
        {!loading && pedidos.length > 0 && (
          <RadioGroup
            value={selectedPedido || ""}
            onChange={(e) =>
              onSelectPedido(Number(e.target.value))
            }
          >
            {pedidos.map((pedido) => {
              const seleccionado =
                Number(selectedPedido) === Number(pedido.id);

              const esPrincipal =
                pedido.tipo_proveedor === "principal";

              const esSecundario =
                pedido.tipo_proveedor === "secundario";

              return (
                <Paper
                  key={pedido.id}
                  variant="outlined"
                  onClick={() =>
                    onSelectPedido(Number(pedido.id))
                  }
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    cursor: "pointer",

                    borderColor: seleccionado
                      ? "primary.main"
                      : "divider",

                    borderWidth: seleccionado ? 2 : 1,

                    transition: "all 0.15s ease",

                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <FormControlLabel
                    value={pedido.id}
                    control={<Radio />}
                    sx={{
                      width: "100%",
                      m: 0,
                      alignItems: "flex-start",
                    }}
                    label={
                      <Box
                        sx={{
                          ml: 1,
                          width: "100%",
                        }}
                      >
                        {/* ==========================
                            PEDIDO + TIPO PROVEEDOR
                        ========================== */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="body1"
                            fontWeight={600}
                          >
                            Pedido #{pedido.id}
                          </Typography>

                          {esPrincipal && (
                            <Chip
                              label="Proveedor principal"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}

                          {esSecundario && (
                            <Chip
                              label="Proveedor secundario"
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        {/* ==========================
                            PROVEEDOR
                        ========================== */}
                        <Typography
                          variant="body2"
                          fontWeight={500}
                        >
                          {pedido.proveedor_nombre || "Proveedor"}
                        </Typography>

                        {/* ==========================
                            FECHA
                        ========================== */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Fecha:{" "}
                          {pedido.fecha_creacion
                            ? dayjs(
                                pedido.fecha_creacion,
                              ).format(
                                "DD/MM/YYYY HH:mm",
                              )
                            : "—"}
                        </Typography>

                        {/* ==========================
                            LÍNEAS
                        ========================== */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {Number(
                            pedido.total_lineas || 0,
                          )}{" "}
                          línea(s)
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              );
            })}
          </RadioGroup>
        )}
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button
          variant="outlined"
          sx={modalSecondaryButtonSx}
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          sx={modalPrimaryButtonSx}
          disabled={
            !selectedPedido ||
            loading ||
            pedidos.length === 0
          }
          onClick={onConfirm}
        >
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PedidoSelectionDialog;