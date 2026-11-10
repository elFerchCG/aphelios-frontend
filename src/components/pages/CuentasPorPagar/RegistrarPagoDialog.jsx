import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";

import {
  modalActionsSx,
  modalContentSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
  modalTitleSx,
} from "../../common/modalStyles";
import apiUrl from "../../../config";
import {
  aCentavos,
  aPesos,
  descuentoAplicable,
  fmtFecha,
  fmtMoneda,
  getAuthHeaders,
  montoValido,
  nombreFactura,
} from "./cxpUtils";

const lineaInicial = (factura, fechaPago) => {
  const descuento = descuentoAplicable(factura, fechaPago);
  const saldo = aCentavos(factura.saldo);
  return {
    factura_id: factura.id,
    aplicar_descuento: descuento > 0,
    monto: aPesos(descuento > 0 ? saldo - descuento : saldo).toFixed(2),
  };
};

// Registro de un pago (transferencia o nota de crédito) que liquida o abona facturas del mismo proveedor.
const RegistrarPagoDialog = ({ open, facturas, proveedor, hoy, onClose, onGuardado }) => {
  const [metodo, setMetodo] = useState("transferencia");
  const [notas, setNotas] = useState([]);
  const [notaId, setNotaId] = useState("");
  const [cargandoNotas, setCargandoNotas] = useState(false);
  const [fechaPago, setFechaPago] = useState(hoy);
  const [referencia, setReferencia] = useState("");
  const [comentario, setComentario] = useState("");
  const [lineas, setLineas] = useState({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFechaPago(hoy);
    setReferencia("");
    setComentario("");
    setError("");
    setMetodo("transferencia");
    setNotaId("");
    setLineas(Object.fromEntries(facturas.map((f) => [f.id, lineaInicial(f, hoy)])));
  }, [open, facturas, hoy]);

  // Notas de crédito del proveedor con saldo disponible.
  useEffect(() => {
    if (!open || !proveedor?.id_proveedor) return;
    setNotas([]);
    setCargandoNotas(true);
    axios
      .get(`${apiUrl}/cuentasPorPagar/notas-credito`, {
        ...getAuthHeaders(),
        params: { proveedor_id: proveedor.id_proveedor, estatus: "disponibles" },
      })
      .then(({ data }) => setNotas(Array.isArray(data?.notas) ? data.notas : []))
      .catch(() => setNotas([]))
      .finally(() => setCargandoNotas(false));
  }, [open, proveedor?.id_proveedor]);

  // Si cambia la fecha, se quita el descuento a las facturas que ya no califican.
  const cambiarFecha = (valor) => {
    const fecha = valor && valor > hoy ? hoy : valor;
    setFechaPago(fecha);
    setLineas((prev) => {
      const nuevas = { ...prev };
      facturas.forEach((f) => {
        const linea = nuevas[f.id];
        if (linea?.aplicar_descuento && !descuentoAplicable(f, fecha)) {
          nuevas[f.id] = { ...linea, aplicar_descuento: false, monto: Number(f.saldo).toFixed(2) };
        }
      });
      return nuevas;
    });
  };

  const toggleDescuento = (factura, activo) => {
    const saldo = aCentavos(factura.saldo);
    const descuento = descuentoAplicable(factura, fechaPago);
    setLineas((prev) => ({
      ...prev,
      [factura.id]: {
        ...prev[factura.id],
        aplicar_descuento: activo,
        monto: aPesos(activo ? saldo - descuento : saldo).toFixed(2),
      },
    }));
  };

  const cambiarMonto = (facturaId, valor) => {
    if (valor !== "" && !/^\d*\.?\d{0,2}$/.test(valor)) return;
    setLineas((prev) => ({ ...prev, [facturaId]: { ...prev[facturaId], monto: valor } }));
  };

  const detalle = useMemo(
    () =>
      facturas.map((f) => {
        const linea = lineas[f.id] || lineaInicial(f, fechaPago);
        const saldo = aCentavos(f.saldo);
        const descuento = linea.aplicar_descuento ? descuentoAplicable(f, fechaPago) : 0;
        const monto = montoValido(linea.monto) ? aCentavos(linea.monto) : 0;
        let errorLinea = "";
        if (!montoValido(linea.monto)) errorLinea = "Monto inválido";
        else if (monto + descuento > saldo) errorLinea = "Mayor al saldo";
        return { factura: f, linea, saldo, descuento, monto, restante: saldo - monto - descuento, errorLinea };
      }),
    [facturas, lineas, fechaPago]
  );

  const esNota = metodo === "nota_credito";
  const nota = notas.find((n) => n.id === notaId) || null;
  const totalTransferir = detalle.reduce((s, d) => s + d.monto, 0);
  const totalDescuento = detalle.reduce((s, d) => s + d.descuento, 0);
  const hayErrores = detalle.some((d) => d.errorLinea);
  const sinCuenta = !proveedor?.clabe && !proveedor?.numero_cuenta;

  let errorNota = "";
  if (esNota && nota) {
    if (totalTransferir > aCentavos(nota.saldo)) errorNota = `La nota solo tiene ${fmtMoneda(nota.saldo)} disponibles.`;
    else if (fechaPago && fechaPago < nota.fecha_nota) errorNota = `La fecha de aplicación es anterior a la nota (${fmtFecha(nota.fecha_nota)}).`;
  }

  const metodoListo = esNota ? Boolean(nota) && !errorNota : !sinCuenta && referencia.trim();
  const puedeGuardar = !guardando && !hayErrores && metodoListo && fechaPago && facturas.length;

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      const payload = {
        proveedor_id: proveedor.id_proveedor,
        fecha_pago: fechaPago,
        metodo_pago: metodo,
        nota_credito_id: esNota ? nota.id : null,
        referencia: esNota ? null : referencia.trim(),
        comentario: comentario.trim() || null,
        facturas: detalle.map((d) => ({
          factura_id: d.factura.id,
          monto: aPesos(d.monto),
          aplicar_descuento: d.descuento > 0,
        })),
      };
      const { data } = await axios.post(`${apiUrl}/cuentasPorPagar/pagos`, payload, getAuthHeaders());
      onGuardado(data);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo registrar el pago. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ ...modalTitleSx, display: "flex", alignItems: "center", gap: 1 }}>
        <PaymentsOutlinedIcon color="primary" /> Registrar pago · {proveedor?.razon_social}
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={metodo}
            onChange={(e, v) => v && setMetodo(v)}
            sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, px: 2, gap: 1 } }}
          >
            <ToggleButton value="transferencia">
              <AccountBalanceOutlinedIcon fontSize="small" /> Transferencia
            </ToggleButton>
            <Tooltip title={!cargandoNotas && !notas.length ? "Este proveedor no tiene notas de crédito con saldo" : ""} arrow>
              <span>
                <ToggleButton value="nota_credito" disabled={cargandoNotas || !notas.length} selected={esNota} onChange={() => setMetodo("nota_credito")}>
                  <RequestQuoteOutlinedIcon fontSize="small" /> Nota de crédito
                  {notas.length > 0 && ` (${notas.length})`}
                </ToggleButton>
              </span>
            </Tooltip>
          </ToggleButtonGroup>

          {esNota ? (
            <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start">
              <TextField
                select
                label="Nota de crédito"
                size="small"
                value={notaId}
                onChange={(e) => setNotaId(e.target.value)}
                helperText={nota ? nota.concepto : "Elige la nota a aplicar"}
                sx={{ minWidth: 320, flex: 1 }}
              >
                {notas.map((n) => (
                  <MenuItem key={n.id} value={n.id}>
                    {n.folio} · {fmtFecha(n.fecha_nota)} · disponible {fmtMoneda(n.saldo)}
                  </MenuItem>
                ))}
              </TextField>
              {nota && (
                <Alert severity={errorNota ? "error" : "success"} icon={false} sx={{ flex: 1, minWidth: 280, py: 0.5 }}>
                  {errorNota || (
                    <>
                      Disponible <strong>{fmtMoneda(nota.saldo)}</strong> · se aplica{" "}
                      <strong>{fmtMoneda(aPesos(totalTransferir))}</strong> · le quedan{" "}
                      <strong>{fmtMoneda(aPesos(aCentavos(nota.saldo) - totalTransferir))}</strong>
                    </>
                  )}
                </Alert>
              )}
            </Stack>
          ) : sinCuenta ? (
            <Alert severity="error">
              Este proveedor no tiene CLABE ni número de cuenta. Captúralos en “Términos y cuenta de proveedores” antes de
              pagar.
            </Alert>
          ) : (
            <Alert severity="info" icon={false}>
              Transferencia a <strong>{proveedor.banco || "banco sin capturar"}</strong>
              {proveedor.clabe && <> · CLABE <strong>{proveedor.clabe}</strong></>}
              {proveedor.numero_cuenta && <> · Cuenta <strong>{proveedor.numero_cuenta}</strong></>}
            </Alert>
          )}

          <Stack direction="row" flexWrap="wrap" gap={2}>
            <TextField
              label={esNota ? "Fecha de aplicación" : "Fecha de pago"}
              type="date"
              size="small"
              value={fechaPago}
              onChange={(e) => cambiarFecha(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: hoy }}
              helperText={fmtFecha(fechaPago)}
              sx={{ width: 190 }}
            />
            {!esNota && (
              <TextField
                label="Referencia / clave de rastreo"
                size="small"
                required
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                inputProps={{ maxLength: 60 }}
                sx={{ minWidth: 260, flex: 1 }}
              />
            )}
            <TextField
              label="Comentario (opcional)"
              size="small"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              inputProps={{ maxLength: 255 }}
              sx={{ minWidth: 260, flex: 1.5 }}
            />
          </Stack>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: "#f5f7fa", fontWeight: 700, fontSize: 13 } }}>
                  <TableCell>Factura</TableCell>
                  <TableCell>Pronto pago</TableCell>
                  <TableCell>Vence</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                  <TableCell>Descuento pronto pago</TableCell>
                  <TableCell align="right" sx={{ width: 170 }}>{esNota ? "A aplicar" : "A transferir"}</TableCell>
                  <TableCell align="right">Saldo restante</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalle.map((d) => {
                  const disponible = descuentoAplicable(d.factura, fechaPago);
                  const pct = Number(d.factura.descuento_pronto_pago || 0);
                  return (
                    <TableRow key={d.factura.id} sx={{ "& td": { fontSize: 13 } }}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {nombreFactura(d.factura)}
                        <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                          Emisión {fmtFecha(d.factura.fecha_factura)} · Total {fmtMoneda(d.factura.total)}
                        </Typography>
                      </TableCell>
                      <TableCell>{fmtFecha(d.factura.fecha_pronto_pago)}</TableCell>
                      <TableCell>{fmtFecha(d.factura.fecha_vencimiento)}</TableCell>
                      <TableCell align="right">{fmtMoneda(aPesos(d.saldo))}</TableCell>
                      <TableCell>
                        {disponible > 0 ? (
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={d.linea.aplicar_descuento}
                                onChange={(e) => toggleDescuento(d.factura, e.target.checked)}
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ color: "#2e7d32", fontWeight: 600 }}>
                                {pct}% · {fmtMoneda(aPesos(disponible))}
                              </Typography>
                            }
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: "text.disabled" }}>
                            {pct > 0 ? "No aplica en esta fecha" : "—"}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          value={d.linea.monto}
                          onChange={(e) => cambiarMonto(d.factura.id, e.target.value)}
                          disabled={d.linea.aplicar_descuento}
                          error={Boolean(d.errorLinea)}
                          helperText={d.errorLinea || (d.linea.aplicar_descuento ? "Liquida con descuento" : " ")}
                          inputProps={{ inputMode: "decimal", style: { textAlign: "right" } }}
                          sx={{ width: 150 }}
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700, color: d.restante === 0 ? "#2e7d32" : "inherit" }}
                      >
                        {d.errorLinea ? "—" : fmtMoneda(aPesos(d.restante))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" flexWrap="wrap" gap={3} justifyContent="flex-end">
            {totalDescuento > 0 && (
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase" }}>
                  Descuento pronto pago
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#2e7d32", lineHeight: 1.3 }}>
                  {fmtMoneda(aPesos(totalDescuento))}
                </Typography>
              </Box>
            )}
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase" }}>
                {esNota ? "Total de la nota a aplicar" : "Total a transferir"}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main", lineHeight: 1.3 }}>
                {fmtMoneda(aPesos(totalTransferir))}
              </Typography>
            </Box>
          </Stack>

          {error && <Alert severity="warning">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={modalActionsSx}>
        <Button variant="outlined" onClick={onClose} disabled={guardando} sx={modalSecondaryButtonSx}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={guardar}
          disabled={!puedeGuardar}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
          sx={modalPrimaryButtonSx}
        >
          {esNota ? "Aplicar nota por" : "Registrar pago de"} {fmtMoneda(aPesos(totalTransferir))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrarPagoDialog;
