// [MULTICUENTA-ML] "Publicar en otra cuenta" (dentro de Cuentas Ecommerce).
// Se elige una opción de venta (MLM) solo para tomar su MLMU y su estructura;
// la publicación nueva lleva SELLER_SKU = MLMU origen. No se guarda nada en
// la base al publicar.
import React, { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  Link,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import SearchIcon from "@mui/icons-material/Search";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import { mcGet, mcPost, mensajeError } from "./multicuentaApi";
import { botonSx } from "./uiMulticuenta";

const TIPOS = [
  { value: "gold_special", label: "Clásica (gold_special)" },
  { value: "gold_pro", label: "Premium (gold_pro)" },
];

const Dato = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {children}
    </Typography>
  </Box>
);

const PublicarEnCuentaDialog = ({ open, onClose }) => {
  const [cuentas, setCuentas] = useState([]);
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState([]);
  const [item, setItem] = useState(null);
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState("gold_special");
  const [previa, setPrevia] = useState(null);
  const [confirmarDuplicado, setConfirmarDuplicado] = useState(false);
  const [creado, setCreado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOrigen("");
    setDestino("");
    setQ("");
    setResultados([]);
    setItem(null);
    setPrevia(null);
    setCreado(null);
    setError("");
    setConfirmarDuplicado(false);
    mcGet("/publicador/cuentas")
      .then((r) => {
        const filas = r.filas || [];
        setCuentas(filas);
        const principal = filas.find((c) => c.tipo === "principal");
        const sub = filas.find((c) => c.tipo !== "principal");
        if (principal) setOrigen(String(principal.id));
        if (sub) setDestino(String(sub.id));
      })
      .catch(async (e) => setError(await mensajeError(e)));
  }, [open]);

  const buscar = async () => {
    if (q.trim().length < 2) return;
    setCargando(true);
    setError("");
    try {
      const r = await mcGet("/publicador/buscar", { q: q.trim() });
      setResultados(r.filas || []);
    } catch (e) {
      setError(await mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  const verPrevia = async (elegido = item) => {
    if (!elegido) return;
    setCargando(true);
    setError("");
    setPrevia(null);
    setConfirmarDuplicado(false);
    try {
      const r = await mcPost("/publicador/vista-previa", {
        cuentaOrigenId: origen,
        cuentaDestinoId: destino,
        itemId: elegido.item_id,
        precio: precio || undefined,
        tipoPublicacion: tipo,
      });
      setPrevia(r);
      if (!precio) setPrecio(String(r.origen.price ?? ""));
    } catch (e) {
      setError(await mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  const publicar = async () => {
    setCargando(true);
    setError("");
    try {
      const r = await mcPost("/publicador/publicar", {
        cuentaOrigenId: origen,
        cuentaDestinoId: destino,
        itemId: previa.origen.item_id,
        precio,
        tipoPublicacion: tipo,
        confirmarDuplicado,
      });
      setCreado(r);
    } catch (e) {
      setError(await mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  const nombreCuenta = (id) => cuentas.find((c) => String(c.id) === String(id))?.nombre || "";
  const puedePublicar =
    previa && !creado && Number(precio) > 0 && origen && destino && origen !== destino && (!previa.duplicados.length || confirmarDuplicado);

  return (
    <Dialog open={open} onClose={cargando ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
        <PublishOutlinedIcon color="primary" /> Publicar en otra cuenta
      </DialogTitle>

      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        {creado ? (
          <Alert severity="success">
            Publicado en <b>{nombreCuenta(destino)}</b>: <b>{creado.item_id}</b> (MLMU {creado.user_product_id || "—"}) con SELLER_SKU <b>{creado.seller_sku}</b>,{" "}
            {creado.available_quantity} pieza(s). Descripción: {creado.descripcion}.{" "}
            {creado.permalink && (
              <Link href={creado.permalink} target="_blank" rel="noopener">
                Ver en Mercado Libre
              </Link>
            )}
            <br />
            Empezará a sincronizar stock cuando se lean las publicaciones de la cuenta (cada hora o con «Descubrir publicaciones» en Stock compartido).
          </Alert>
        ) : (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
              <TextField select size="small" label="Cuenta origen" value={origen} onChange={(e) => { setOrigen(e.target.value); setPrevia(null); }} fullWidth>
                {cuentas.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.nombre} ({c.tipo})
                  </MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="Cuenta destino" value={destino} onChange={(e) => { setDestino(e.target.value); setPrevia(null); }} fullWidth>
                {cuentas
                  .filter((c) => String(c.id) !== String(origen))
                  .map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.nombre} ({c.tipo})
                    </MenuItem>
                  ))}
              </TextField>
            </Stack>

            <TextField
              size="small"
              label="Buscar opción de venta (MLM, MLMU, SKU o título)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" startIcon={<SearchIcon />} sx={botonSx} onClick={buscar} disabled={cargando}>
                      Buscar
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            {resultados.length > 0 && (
              <Paper variant="outlined" sx={{ maxHeight: 220, overflow: "auto", borderRadius: 2 }}>
                <List dense disablePadding>
                  {resultados.map((r) => (
                    <ListItemButton
                      key={r.item_id}
                      selected={item?.item_id === r.item_id}
                      onClick={() => {
                        setItem(r);
                        setPrecio("");
                        verPrevia(r);
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar variant="rounded" src={r.thumbnail || undefined}>
                          <Inventory2OutlinedIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={r.title}
                        secondary={`${r.item_id} · ${r.user_product_id || "sin MLMU"} · SKU ${r.sku || "—"} · ${r.logistic_type} · ${r.status || ""}`}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}

            {cargando && (
              <Stack alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={28} />
              </Stack>
            )}

            {previa && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Stack direction="row" gap={1.5} alignItems="center">
                  <Avatar variant="rounded" src={previa.origen.thumbnail || undefined} sx={{ width: 56, height: 56 }}>
                    <Inventory2OutlinedIcon />
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {previa.origen.family_name || previa.origen.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Origen {previa.origen.item_id} · {previa.origen.user_product_id} · {previa.origen.logistic_type} · {previa.origen.status}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" } }}>
                  <Dato label="SELLER_SKU">{previa.seller_sku}</Dato>
                  <Dato label="Producto base">{previa.producto_base ?? "—"}</Dato>
                  <Dato label="Disponible a publicar">{previa.disponible}</Dato>
                  <Dato label="Fotos / atributos">
                    {previa.payload.pictures.length} / {previa.payload.attributes.length}
                  </Dato>
                </Box>

                {previa.opciones_mismo_mlmu.length > 1 && (
                  <Typography variant="caption" color="text.secondary">
                    Opciones de venta del mismo MLMU: {previa.opciones_mismo_mlmu.map((o) => `${o.itemId} (producto ${o.productoId})`).join(", ")}
                  </Typography>
                )}

                <Divider />

                <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                  <TextField
                    size="small"
                    label="Precio"
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    fullWidth
                  />
                  <TextField select size="small" label="Tipo de publicación" value={tipo} onChange={(e) => setTipo(e.target.value)} fullWidth>
                    {TIPOS.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip size="small" label="Envío desde almacén (Mercado Envíos)" />
                  <Chip size="small" label="Sin título: lo genera Mercado Libre" />
                  <Chip size="small" label={`Descripción: ${previa.descripcion_caracteres ? "se copia" : "sin descripción"}`} />
                </Stack>

                {previa.duplicados.length > 0 && (
                  <Alert severity="warning">
                    {nombreCuenta(destino)} ya tiene publicación(es) con SELLER_SKU {previa.seller_sku}: <b>{previa.duplicados.join(", ")}</b>.
                    <FormControlLabel
                      sx={{ display: "block", mt: 0.5 }}
                      control={<Checkbox size="small" checked={confirmarDuplicado} onChange={(e) => setConfirmarDuplicado(e.target.checked)} />}
                      label="Publicar de todos modos (otra opción de venta del mismo producto)"
                    />
                  </Alert>
                )}
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={botonSx} disabled={cargando}>
          {creado ? "Cerrar" : "Cancelar"}
        </Button>
        {!creado && (
          <>
            <Button variant="outlined" sx={botonSx} disabled={!item || cargando} onClick={() => verPrevia()}>
              Actualizar vista previa
            </Button>
            <Button variant="contained" startIcon={<PublishOutlinedIcon />} sx={botonSx} disabled={!puedePublicar || cargando} onClick={publicar}>
              Publicar en {nombreCuenta(destino) || "destino"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PublicarEnCuentaDialog;
