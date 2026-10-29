// [MULTICUENTA-ML] "Publicar en otra cuenta" (dentro de Cuentas Ecommerce), modelo User Products.
// Se elige una opción de venta (MLM) de origen; el backend lee su familia y
// decide: familia nueva, agregar variante a la familia espejo u otra
// condición de venta sobre la variante que ya existe en destino.
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import SearchIcon from "@mui/icons-material/Search";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import { mcGet, mcPost, mensajeError } from "./multicuentaApi";
import { botonSx } from "./uiMulticuenta";

const TIPOS = { gold_special: "Clásica", gold_pro: "Premium" };
const nombreTipo = (t) => TIPOS[t] || t || "—";
const dinero = (n) => (n == null || n === "" ? "—" : `$${Number(n).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`);

const ACCIONES = {
  nueva_familia: { severity: "info", Icon: AccountTreeOutlinedIcon, boton: "Crear familia y publicar" },
  agregar_a_familia: { severity: "info", Icon: AddCircleOutlineIcon, boton: "Agregar variante a la familia" },
  nueva_condicion: { severity: "warning", Icon: SellOutlinedIcon, boton: "Agregar condición de venta" },
  completa: { severity: "success", Icon: CheckCircleOutlineIcon, boton: null },
};

const NIVELES = {
  bloqueo: { Icon: BlockOutlinedIcon, color: "error.main", orden: 0 },
  aviso: { Icon: WarningAmberRoundedIcon, color: "warning.main", orden: 1 },
  ok: { Icon: CheckCircleOutlineIcon, color: "success.main", orden: 2 },
};

const Dato = ({ label, children }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
      {children}
    </Typography>
  </Box>
);

const Seccion = ({ icon: Icon, titulo, extra, children }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
        <Icon color="primary" fontSize="small" /> {titulo}
      </Typography>
      {extra}
    </Stack>
    {children}
  </Paper>
);

/** Estado de una variante en la cuenta destino. */
const EstadoDestino = ({ variante, cuenta }) => {
  if (variante.excluida) return <Chip size="small" color="error" variant="outlined" label="Excluida (no la operamos)" />;
  const vivas = (variante.destino?.items || []).filter((i) => i.status !== "closed");
  if (!vivas.length) return <Chip size="small" variant="outlined" label={`Falta en ${cuenta}`} />;
  return (
    <Tooltip title={vivas.map((i) => `${i.id} · ${nombreTipo(i.listing_type_id)} · ${dinero(i.price)} · ${i.status}`).join("\n")}>
      <Chip size="small" color="success" label={`En ${cuenta}: ${vivas.map((i) => nombreTipo(i.listing_type_id)).join(" + ")}`} />
    </Tooltip>
  );
};

// itemIdInicial / cuentaDestinoInicial: el publicador masivo lo abre directo en la revisión completa de una familia
const PublicarEnCuentaDialog = ({ open, onClose, itemIdInicial = null, cuentaDestinoInicial = null }) => {
  const [cuentas, setCuentas] = useState([]);
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState([]);
  const [verResultados, setVerResultados] = useState(true);
  const [itemId, setItemId] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState("");
  const [previa, setPrevia] = useState(null);
  const [creado, setCreado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState("");

  useEffect(() => {
    if (!open) return;
    setOrigen("");
    setDestino("");
    setQ("");
    setResultados([]);
    setVerResultados(true);
    setItemId("");
    setPrevia(null);
    setCreado(null);
    setError("");
    mcGet("/publicador/cuentas")
      .then((r) => {
        const filas = r.filas || [];
        setCuentas(filas);
        const principal = filas.find((c) => c.tipo === "principal");
        const sub = filas.find((c) => (cuentaDestinoInicial ? String(c.id) === String(cuentaDestinoInicial) : c.tipo !== "principal"));
        if (principal) setOrigen(String(principal.id));
        if (sub) setDestino(String(sub.id));
        if (itemIdInicial && principal && sub) verPrevia(itemIdInicial, { cuentas: { origen: principal.id, destino: sub.id } });
      })
      .catch(async (e) => setError(await mensajeError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const nombreCuenta = (id) => cuentas.find((c) => String(c.id) === String(id))?.nombre || "";
  const cuentaDestino = previa?.destino?.cuenta || nombreCuenta(destino) || "destino";

  const buscar = async () => {
    if (q.trim().length < 2) return;
    setCargando("Buscando…");
    setError("");
    try {
      const r = await mcGet("/publicador/buscar", { q: q.trim() });
      setResultados(r.filas || []);
      setVerResultados(true);
      if (!(r.filas || []).length) setError("No se encontró ninguna publicación con ese dato.");
    } catch (e) {
      setError(await mensajeError(e));
    } finally {
      setCargando("");
    }
  };

  // Vista previa: precio y tipo vacíos = los toma del origen
  const verPrevia = async (id = itemId, { conservarPrecio = false, cuentas: forzadas = null } = {}) => {
    if (!id) return;
    setItemId(id);
    setCargando("Leyendo la familia en Mercado Libre…");
    setError("");
    setCreado(null);
    try {
      const r = await mcPost("/publicador/vista-previa", {
        cuentaOrigenId: forzadas?.origen ?? origen,
        cuentaDestinoId: forzadas?.destino ?? destino,
        itemId: id,
        precio: conservarPrecio && precio ? precio : undefined,
        tipoPublicacion: conservarPrecio && tipo ? tipo : undefined,
      });
      setPrevia(r);
      setVerResultados(false);
      setPrecio(String(r.precio ?? r.origen.price ?? ""));
      setTipo(r.tipo || "");
    } catch (e) {
      setPrevia(null);
      setError(await mensajeError(e));
    } finally {
      setCargando("");
    }
  };

  const publicar = async () => {
    setCargando("Publicando en Mercado Libre…");
    setError("");
    try {
      const r = await mcPost("/publicador/publicar", {
        cuentaOrigenId: origen,
        cuentaDestinoId: destino,
        itemId: previa.origen.item_id,
        precio,
        tipoPublicacion: tipo,
        modo: previa.modo,
      });
      setCreado(r);
    } catch (e) {
      setError(await mensajeError(e));
    } finally {
      setCargando("");
    }
  };

  // Validaciones del servidor + precio mínimo con el precio que se está escribiendo
  const validaciones = useMemo(() => {
    if (!previa) return [];
    const lista = previa.validaciones.filter((v) => !/^Escribe un precio|^El precio mínimo/.test(v.texto));
    const p = Number(precio);
    if (previa.modo) {
      if (!(p > 0)) lista.push({ nivel: "bloqueo", texto: "Escribe un precio mayor a 0." });
      else if (previa.categoria.precio_minimo && p < previa.categoria.precio_minimo) {
        lista.push({ nivel: "bloqueo", texto: `El precio mínimo de la categoría es ${dinero(previa.categoria.precio_minimo)}.` });
      }
    }
    return lista.sort((a, b) => NIVELES[a.nivel].orden - NIVELES[b.nivel].orden);
  }, [previa, precio]);

  const bloqueos = validaciones.filter((v) => v.nivel === "bloqueo").length;
  const avisos = validaciones.filter((v) => v.nivel === "aviso").length;
  const puedePublicar = previa && !creado && previa.modo && previa.tipos_disponibles.includes(tipo) && !bloqueos && origen !== destino;
  const accion = previa ? ACCIONES[previa.accion] : null;

  const elegirVariante = (v) => {
    const it = v.items_origen.find((i) => i.status === "active") || v.items_origen.find((i) => i.status !== "closed");
    if (it && !v.actual) verPrevia(it.id);
  };

  return (
    <Dialog open={open} onClose={cargando ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
        <PublishOutlinedIcon color="primary" /> Publicar en otra cuenta
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          Copia una variante (con su familia) de una cuenta de Mercado Libre a otra
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {creado ? (
          <Resultado creado={creado} previa={previa} cuenta={cuentaDestino} />
        ) : (
          <>
            {/* 1. Cuentas y búsqueda */}
            <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
              <TextField
                select
                size="small"
                label="Copiar desde"
                value={origen}
                onChange={(e) => {
                  setOrigen(e.target.value);
                  setPrevia(null);
                }}
                fullWidth
              >
                {cuentas.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.nombre} ({c.tipo})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Publicar en"
                value={destino}
                onChange={(e) => {
                  setDestino(e.target.value);
                  setPrevia(null);
                }}
                fullWidth
              >
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
              label="Buscar publicación (MLM, MLMU, SKU o título)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" startIcon={<SearchIcon />} sx={botonSx} onClick={buscar} disabled={Boolean(cargando)}>
                      Buscar
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            {resultados.length > 0 && verResultados && (
              <Paper variant="outlined" sx={{ maxHeight: 240, overflow: "auto", borderRadius: 2 }}>
                <List dense disablePadding>
                  {resultados.map((r) => (
                    <ListItemButton key={r.item_id} selected={itemId === r.item_id} onClick={() => verPrevia(r.item_id)} disabled={Boolean(cargando)}>
                      <ListItemAvatar>
                        <Avatar variant="rounded" src={r.thumbnail || undefined}>
                          <Inventory2OutlinedIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={r.title}
                        secondary={`${r.item_id} · ${r.user_product_id || "sin MLMU"} · SKU ${r.sku || "—"} · ${r.logistic_type || ""} · ${r.status || ""}`}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
            {resultados.length > 0 && !verResultados && (
              <Button size="small" sx={{ ...botonSx, alignSelf: "flex-start" }} onClick={() => setVerResultados(true)}>
                Ver resultados de la búsqueda ({resultados.length})
              </Button>
            )}

            {cargando && (
              <Stack alignItems="center" gap={1} sx={{ py: 2 }}>
                <CircularProgress size={28} />
                <Typography variant="caption" color="text.secondary">
                  {cargando}
                </Typography>
              </Stack>
            )}

            {/* 2. Vista previa */}
            {previa && !cargando && (
              <>
                <Alert severity={accion.severity} icon={<accion.Icon />} sx={{ borderRadius: 2 }}>
                  <AlertTitle sx={{ fontWeight: 700 }}>{previa.accion_titulo}</AlertTitle>
                  {previa.accion_detalle}
                </Alert>

                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" }, alignItems: "start" }}>
                  <Familia previa={previa} cuenta={cuentaDestino} onElegir={elegirVariante} />

                  <Stack gap={2}>
                    <Seccion icon={SellOutlinedIcon} titulo="Condición de venta">
                      <Stack direction="row" gap={1.5} alignItems="center">
                        <Avatar variant="rounded" src={previa.origen.thumbnail || undefined} sx={{ width: 48, height: 48 }}>
                          <Inventory2OutlinedIcon />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {previa.origen.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Origen {previa.origen.item_id} · {nombreTipo(previa.origen.listing_type_id)} · {dinero(previa.origen.price)}
                            {previa.origen.permalink && (
                              <>
                                {" · "}
                                <Link href={previa.origen.permalink} target="_blank" rel="noopener">
                                  ver
                                </Link>
                              </>
                            )}
                          </Typography>
                        </Box>
                      </Stack>

                      {previa.modo ? (
                        <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                          <TextField
                            size="small"
                            label="Precio"
                            type="number"
                            value={precio}
                            onChange={(e) => setPrecio(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            helperText={`En ${previa.origen.cuenta}: ${dinero(previa.origen.price)}${
                              previa.categoria.precio_minimo ? ` · mínimo ${dinero(previa.categoria.precio_minimo)}` : ""
                            }`}
                            fullWidth
                          />
                          <TextField
                            select
                            size="small"
                            label="Tipo de publicación"
                            value={tipo}
                            onChange={(e) => {
                              setTipo(e.target.value);
                              // Precio de Aphelios para ese mismo tipo, si existe
                              const actual = previa.familia.variantes.find((v) => v.actual);
                              const mismo = (actual?.items_origen || []).find(
                                (i) => i.listing_type_id === e.target.value && i.status !== "closed" && Number(i.price) > 0,
                              );
                              if (mismo) setPrecio(String(mismo.price));
                            }}
                            helperText={previa.modo === "condicion" ? "Solo los tipos que la variante aún no tiene" : "El precio cambia al de Aphelios para ese tipo, si existe"}
                            fullWidth
                          >
                            {Object.keys(TIPOS).map((t) => (
                              <MenuItem key={t} value={t} disabled={!previa.tipos_disponibles.includes(t)}>
                                {nombreTipo(t)}
                                {!previa.tipos_disponibles.includes(t) ? " (ya publicada)" : ""}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No hay nada que publicar para esta variante. Elige otra variante de la familia.
                        </Typography>
                      )}

                      <Divider />
                      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
                        <Dato label="SELLER_SKU">{previa.seller_sku || "—"}</Dato>
                        <Dato label={previa.modo === "condicion" ? "Stock (compartido)" : "Piezas a publicar"}>
                          {previa.modo === "condicion"
                            ? "El de la variante"
                            : previa.stock_forzado
                              ? `${previa.cantidad_publicar} (sin stock; luego queda en 0)`
                              : previa.disponible}
                        </Dato>
                        <Dato label="Fotos / atributos">
                          {previa.resumen_payload?.fotos != null
                            ? `${previa.resumen_payload.fotos} / ${previa.resumen_payload.atributos}`
                            : "Se heredan de la variante"}
                        </Dato>
                        <Dato label="Descripción">{previa.descripcion_caracteres ? "Se copia" : "Sin descripción"}</Dato>
                      </Box>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        <Chip size="small" label="Envío desde almacén (Mercado Envíos)" />
                        <Chip size="small" label="Título: lo genera Mercado Libre" />
                        <Tooltip title={previa.categoria.ruta || ""}>
                          <Chip size="small" label={`Categoría: ${previa.categoria.nombre}`} />
                        </Tooltip>
                      </Stack>
                      {previa.resumen_payload?.omitidos?.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          No se copian (los calcula Mercado Libre): {previa.resumen_payload.omitidos.join(", ")}.
                        </Typography>
                      )}
                    </Seccion>

                    <Seccion
                      icon={FactCheckOutlinedIcon}
                      titulo="Revisión antes de publicar"
                      extra={
                        <Stack direction="row" gap={0.5}>
                          {bloqueos > 0 && <Chip size="small" color="error" label={`${bloqueos} impide${bloqueos > 1 ? "n" : ""}`} />}
                          {avisos > 0 && <Chip size="small" color="warning" label={`${avisos} aviso${avisos > 1 ? "s" : ""}`} />}
                          {!bloqueos && !avisos && <Chip size="small" color="success" label="Todo en orden" />}
                        </Stack>
                      }
                    >
                      <List dense disablePadding>
                        {validaciones.map((v, k) => {
                          const n = NIVELES[v.nivel];
                          return (
                            <ListItem key={k} disableGutters sx={{ alignItems: "flex-start", py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: 30, mt: 0.25 }}>
                                <n.Icon fontSize="small" sx={{ color: n.color }} />
                              </ListItemIcon>
                              <ListItemText primaryTypographyProps={{ variant: "body2" }} primary={v.texto} />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Seccion>
                  </Stack>
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={botonSx} disabled={Boolean(cargando)}>
          {creado ? "Cerrar" : "Cancelar"}
        </Button>
        {creado && (
          <Button variant="outlined" sx={botonSx} startIcon={<AccountTreeOutlinedIcon />} onClick={() => verPrevia(itemId)}>
            Ver la familia de nuevo
          </Button>
        )}
        {!creado && previa && (
          <>
            <Button
              variant="outlined"
              sx={botonSx}
              startIcon={<RefreshIcon />}
              disabled={Boolean(cargando)}
              onClick={() => verPrevia(itemId, { conservarPrecio: true })}
            >
              Actualizar vista previa
            </Button>
            {accion?.boton && (
              <Button variant="contained" startIcon={<PublishOutlinedIcon />} sx={botonSx} disabled={!puedePublicar || Boolean(cargando)} onClick={publicar}>
                {accion.boton} en {cuentaDestino}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

/** Árbol de la familia: variantes de origen y su estado en destino. */
const Familia = ({ previa, cuenta, onElegir }) => {
  const f = previa.familia;
  const pct = f.total_variantes ? Math.round((f.publicadas_en_destino / f.total_variantes) * 100) : 0;
  return (
    <Seccion
      icon={AccountTreeOutlinedIcon}
      titulo={`Familia (${f.total_variantes} variante${f.total_variantes === 1 ? "" : "s"})`}
      extra={<Chip size="small" label={`${f.publicadas_en_destino} de ${f.total_variantes} en ${cuenta}`} color={pct === 100 ? "success" : "default"} />}
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {f.family_name || "Sin nombre de familia"}
        </Typography>
        <LinearProgress variant="determinate" value={pct} sx={{ mt: 1, height: 6, borderRadius: 3 }} />
      </Box>

      {f.parent_pk.length > 0 && (
        <Stack direction="row" gap={0.75} flexWrap="wrap">
          {f.parent_pk.map((p) => (
            <Tooltip key={p.id} title="Igual en todas las variantes (define la familia)">
              <Chip size="small" variant="outlined" label={`${p.nombre}: ${p.valor ?? "—"}`} />
            </Tooltip>
          ))}
          {f.child_attributes.length > 0 && (
            <Chip size="small" color="primary" variant="outlined" label={`Varía por: ${f.child_attributes.map((c) => c.nombre).join(", ")}`} />
          )}
        </Stack>
      )}

      <Paper variant="outlined" sx={{ maxHeight: 380, overflow: "auto", borderRadius: 2 }}>
        <List dense disablePadding>
          {f.variantes.map((v) => {
            const sinOrigen = !v.items_origen.some((i) => i.status !== "closed");
            return (
              <ListItemButton
                key={v.user_product_id}
                selected={v.actual}
                disabled={sinOrigen && !v.actual}
                onClick={() => onElegir(v)}
                sx={{ alignItems: "flex-start", borderBottom: "1px solid #eee" }}
              >
                <ListItemAvatar>
                  <Avatar variant="rounded" src={v.thumbnail || undefined}>
                    <Inventory2OutlinedIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {v.variacion || v.nombre || v.user_product_id}
                      </Typography>
                      {v.actual && <Chip size="small" color="primary" label="Seleccionada" sx={{ height: 20 }} />}
                    </Stack>
                  }
                  secondaryTypographyProps={{ component: "div" }}
                  secondary={
                    <Stack gap={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {v.user_product_id} ·{" "}
                        {v.items_origen.length
                          ? v.items_origen.map((i) => `${nombreTipo(i.listing_type_id)} ${dinero(i.price)}`).join(" / ")
                          : "sin publicación en origen"}
                        {v.disponible != null ? ` · ${v.disponible} disp.` : ""}
                      </Typography>
                      <Box>
                        <EstadoDestino variante={v} cuenta={cuenta} />
                      </Box>
                    </Stack>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      </Paper>
      {f.truncada && (
        <Typography variant="caption" color="text.secondary">
          Se muestran las primeras 30 variantes.
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        Toca otra variante para revisarla y publicarla.
      </Typography>
    </Seccion>
  );
};

/** Resumen después de publicar. */
const Resultado = ({ creado, previa, cuenta }) => (
  <Stack gap={2}>
    <Alert severity="success" sx={{ borderRadius: 2 }}>
      <AlertTitle sx={{ fontWeight: 700 }}>Publicado en {cuenta}</AlertTitle>
      {previa?.origen?.variacion ? `Variante ${previa.origen.variacion}` : "La variante"} quedó publicada como{" "}
      <b>{nombreTipo(creado.listing_type_id)}</b> a <b>{dinero(creado.price)}</b>.
      {creado.permalink && (
        <>
          {" "}
          <Link href={creado.permalink} target="_blank" rel="noopener">
            Ver en Mercado Libre
          </Link>
        </>
      )}
    </Alert>

    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" } }}>
        <Dato label="Publicación">{creado.item_id}</Dato>
        <Dato label="Variante (MLMU)">{creado.user_product_id || "—"}</Dato>
        <Dato label="SELLER_SKU">{creado.seller_sku}</Dato>
        <Dato label="Piezas">{creado.available_quantity ?? "—"}</Dato>
        <Dato label="Descripción">{creado.descripcion}</Dato>
        <Dato label="Stock compartido">{creado.vinculo === "registrado" ? "Vinculado" : creado.vinculo}</Dato>
        {creado.stock_forzado && <Dato label="Sin stock">{creado.stock_ajustado || "se pone en 0 en el siguiente ciclo"}</Dato>}
      </Box>
    </Paper>

    {creado.familia && (
      <Alert severity={creado.familia.coincide === false ? "warning" : "info"} sx={{ borderRadius: 2 }}>
        {creado.familia.mensaje}
      </Alert>
    )}
  </Stack>
);

export default PublicarEnCuentaDialog;
