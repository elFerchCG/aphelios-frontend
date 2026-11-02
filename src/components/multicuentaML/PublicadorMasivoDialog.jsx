// [MULTICUENTA-ML] Publicador masivo por familias (dentro de Cuentas Ecommerce).
// Se marcan familias (User Products) de la principal —se pueden quitar
// variantes— y se mandan como un lote: el backend las publica en segundo plano
// (unas pocas por minuto) como familia nueva, variante agregada a la familia
// o nueva condición de venta, con el precio de Aphelios para ese tipo.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Alert,
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  GlobalStyles,
  IconButton,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DoNotDisturbOnOutlinedIcon from "@mui/icons-material/DoNotDisturbOnOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

import apiUrl from "../../config";
import { mcGet, mcPost, mensajeError } from "./multicuentaApi";
import PublicarEnCuentaDialog from "./PublicarEnCuentaDialog";
import PortadasRefa from "./PortadasRefa"; // [MULTICUENTA-ML]
import {
  GRID_HEIGHT,
  LOCALE_TEXT_GRID,
  gridSx,
  botonSx,
  SectionCard,
  KpiCard,
  KpiValor,
  kpiGridSx,
  EstadoChip,
} from "./uiMulticuenta";

const PAGE_SIZE = 100;
const PAGE_SIZE_FAMILIAS = 50;
const REFRESCO_MS = 5000;

// Tipos de lote (los "origen" son de lotes anteriores)
const TIPOS = [
  { value: "origen", label: "Igual a la principal" },
  { value: "gold_special", label: "Clásica" },
  { value: "gold_pro", label: "Premium" },
  { value: "ambas", label: "Clásica y Premium" },
];

const ESTADOS_LOTE = {
  pendiente: { label: "En cola", color: "default" },
  procesando: { label: "Publicando", color: "warning" },
  terminado: { label: "Terminado", color: "success" },
  cancelado: { label: "Cancelado", color: "secondary" },
};

const ESTADOS_ITEM = {
  pendiente: { label: "En cola", color: "default" },
  procesando: { label: "Publicando", color: "warning" },
  publicado: { label: "Publicada", color: "success" },
  omitido: { label: "Omitida", color: "info" },
  error: { label: "Error", color: "error" },
  cancelado: { label: "Cancelada", color: "secondary" },
};

const formatoFecha = (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "");
const dinero = (v) =>
  v == null || v === "" ? "" : Number(v).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const getThumbnailUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://http2.mlstatic.com/D_${url}-I.jpg`;
};

const ProductoCell = ({ row, titulo, sub }) => (
  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.5, minWidth: 0, width: "100%" }}>
    <Avatar
      variant="rounded"
      src={getThumbnailUrl(row.thumbnail) || undefined}
      sx={{ width: 34, height: 34, bgcolor: "#f5f5f5", border: "1px solid #e0e0e0", flexShrink: 0 }}
    >
      <Inventory2OutlinedIcon sx={{ fontSize: 16, color: "#9e9e9e" }} />
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" noWrap title={titulo} sx={{ fontWeight: 600 }}>
        {titulo || "Sin título"}
      </Typography>
      <Typography variant="caption" noWrap sx={{ color: "text.secondary", display: "block" }}>
        {sub}
      </Typography>
    </Box>
  </Stack>
);

const ProgresoLote = ({ lote }) => {
  const hechos = lote.publicados + lote.omitidos + lote.errores + lote.cancelados;
  const pct = lote.total ? Math.round((hechos / lote.total) * 100) : 0;
  return (
    <Stack direction="row" alignItems="center" gap={1} sx={{ width: "100%", height: "100%" }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={lote.errores ? "warning" : "success"}
        sx={{ height: 8, borderRadius: 4, flex: 1 }}
      />
      <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
        {hechos}/{lote.total}
      </Typography>
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Plan de una familia (mismas reglas que el backend; el backend decide al final)
// ---------------------------------------------------------------------------
const TIPOS_LOTE = {
  gold_special: ["gold_special"],
  gold_pro: ["gold_pro"],
  ambas: ["gold_special", "gold_pro"],
};
const NOMBRE_TIPO = { gold_special: "Clásica", gold_pro: "Premium" };

const ACCIONES = {
  nueva_familia: { label: "Familia nueva", color: "#1565c0", bg: "#e3f2fd" },
  agregar_a_familia: { label: "Agregar a la familia", color: "#2e7d32", bg: "#e8f5e9" },
  nueva_condicion: { label: "Condición de venta", color: "#6a1b9a", bg: "#f3e5f5" },
};

/** Por variante: qué pasa con cada tipo ('nueva', 'condicion', 'existe', 'en_lote', 'excluida', 'cerrada'). */
function planFamilia(fam, tipos, seleccion) {
  let familiaEnDestino = fam.variantes.some((v) => v.destino);
  const porVariante = new Map();
  const conteo = { nueva_familia: 0, agregar_a_familia: 0, nueva_condicion: 0, omitidas: 0 };
  for (const v of fam.variantes) {
    const lineas = [];
    const elegida = !seleccion || seleccion.has(v.user_product_id);
    if (v.excluida) lineas.push({ tipo: null, estado: "excluida", texto: "Excluida de la sincronización (no la operamos)" });
    else if (v.logistica === "cerrada") lineas.push({ tipo: null, estado: "cerrada", texto: "Cerrada en Aphelios" });
    // [MULTICUENTA-ML] La cuenta destino ya la vende con su propio SKU (la opera su almacén)
    else if (!v.destino && v.en_refa?.length)
      lineas.push({ tipo: null, estado: "en_refa", texto: `Ya la vende con su propio SKU: ${v.en_refa[0].seller_sku} · ${v.en_refa[0].item_id}` });
    else {
      const tiposDest = new Set((v.destino?.items || []).map((i) => i.listing_type_id).filter(Boolean));
      let existe = Boolean(v.destino);
      for (const t of tipos) {
        const lote = (v.en_lote || []).find((l) => l.tipo === t || !NOMBRE_TIPO[l.tipo]);
        if (lote) lineas.push({ tipo: t, estado: "en_lote", texto: `Ya va en el lote #${lote.lote_id}` });
        else if (tiposDest.has(t)) lineas.push({ tipo: t, estado: "existe", texto: `Ya existe como ${NOMBRE_TIPO[t]}` });
        else if (existe) lineas.push({ tipo: t, estado: "condicion", accion: "nueva_condicion" });
        else {
          // Solo una variante elegida puede "crear" la familia para las demás
          const accion = familiaEnDestino ? "agregar_a_familia" : "nueva_familia";
          lineas.push({ tipo: t, estado: "nueva", accion });
          if (elegida) familiaEnDestino = true;
          existe = true;
        }
      }
    }
    const accionables = lineas.filter((l) => l.accion);
    if (elegida) {
      for (const l of accionables) conteo[l.accion]++;
      if (!accionables.length) conteo.omitidas++;
    }
    porVariante.set(v.user_product_id, { lineas, publicable: accionables.length > 0 });
  }
  return { porVariante, conteo, publicaciones: conteo.nueva_familia + conteo.agregar_a_familia + conteo.nueva_condicion };
}

const ChipAccion = ({ accion, n, tipo }) => {
  const a = ACCIONES[accion];
  if (!a) return null;
  return (
    <Chip
      size="small"
      label={`${n != null ? `${n} · ` : ""}${a.label}${tipo ? ` (${NOMBRE_TIPO[tipo]})` : ""}`}
      sx={{ fontWeight: 600, bgcolor: a.bg, color: a.color, border: `1px solid ${a.color}33`, height: 22 }}
    />
  );
};

const ChipLogistica = ({ valor }) => {
  const m = {
    full: { label: "Full", bg: "#fff3e0", color: "#e65100" },
    me: { label: "Mercado Envíos", bg: "#e3f2fd", color: "#1565c0" },
    mixta: { label: "Mixta", bg: "#fffde7", color: "#8d6e00" },
    cerrada: { label: "Cerrada", bg: "#f5f5f5", color: "#757575" },
  }[valor] || { label: valor, bg: "#f5f5f5", color: "#616161" };
  return <Chip size="small" label={m.label} sx={{ fontWeight: 600, bgcolor: m.bg, color: m.color, height: 22 }} />;
};

const ChipStock = ({ v }) => {
  const n = Number(v || 0);
  const color = n > 0 ? "#2e7d32" : "#d32f2f";
  return (
    <Tooltip arrow title={n > 0 ? "Disponible en almacén" : "Sin stock: se publica con 1 y el sincronizador la deja en 0 (pausada)"}>
      <Chip size="small" label={n} sx={{ fontWeight: 700, minWidth: 40, height: 22, bgcolor: n > 0 ? "#e8f5e9" : "#ffebee", color, border: `1px solid ${color}` }} />
    </Tooltip>
  );
};

// ---------------------------------------------------------------------------
// Ventana de variantes de una familia (desmarcar, ver estado, revisión completa)
// ---------------------------------------------------------------------------
const VariantesFamilia = ({ fam, tipos, seleccion, onCambiar, onCerrar, onRevisionCompleta, destinoNombre }) => {
  const plan = planFamilia(fam, tipos, seleccion);
  const publicables = fam.variantes.filter((v) => plan.porVariante.get(v.user_product_id)?.publicable);
  const marcar = (ids) => onCambiar(new Set(ids));
  return (
    <Dialog open onClose={onCerrar} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
        <AccountTreeOutlinedIcon color="primary" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap title={fam.titulo}>
            {fam.titulo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Familia {fam.family_id} · {fam.total_variantes} variante(s) · {fam.en_destino} ya en {destinoNombre}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <Button size="small" sx={botonSx} onClick={() => marcar(publicables.map((v) => v.user_product_id))}>
            Marcar todas ({publicables.length})
          </Button>
          <Button size="small" color="inherit" sx={botonSx} onClick={() => marcar([])}>
            Ninguna
          </Button>
          <Box sx={{ flex: 1 }} />
          {plan.conteo.nueva_familia > 0 && <ChipAccion accion="nueva_familia" n={plan.conteo.nueva_familia} />}
          {plan.conteo.agregar_a_familia > 0 && <ChipAccion accion="agregar_a_familia" n={plan.conteo.agregar_a_familia} />}
          {plan.conteo.nueva_condicion > 0 && <ChipAccion accion="nueva_condicion" n={plan.conteo.nueva_condicion} />}
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          {fam.variantes.map((v) => {
            const pv = plan.porVariante.get(v.user_product_id);
            const elegida = seleccion.has(v.user_product_id);
            return (
              <Stack
                key={v.user_product_id}
                direction="row"
                gap={1.5}
                alignItems="flex-start"
                sx={{ px: 1.5, py: 1, borderBottom: "1px solid #eee", opacity: pv.publicable ? 1 : 0.6, bgcolor: elegida ? "#f5faff" : "inherit" }}
              >
                <Checkbox
                  size="small"
                  checked={elegida}
                  disabled={!pv.publicable}
                  onChange={(e) => {
                    const s = new Set(seleccion);
                    if (e.target.checked) s.add(v.user_product_id);
                    else s.delete(v.user_product_id);
                    onCambiar(s);
                  }}
                />
                <Avatar variant="rounded" src={getThumbnailUrl(v.thumbnail) || undefined} sx={{ width: 40, height: 40, bgcolor: "#f5f5f5" }}>
                  <Inventory2OutlinedIcon sx={{ fontSize: 18, color: "#9e9e9e" }} />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {v.variacion || v.titulo}
                    </Typography>
                    <ChipLogistica valor={v.logistica} />
                    <ChipStock v={v.disponible} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {v.user_product_id} · {v.opciones.map((o) => `${o.item_id} ${NOMBRE_TIPO[o.listing_type_id] || o.listing_type_id || ""}`).join(" · ")}
                  </Typography>
                  <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {(v.destino?.items || []).map((i) => (
                      <Chip
                        key={i.item_id}
                        size="small"
                        color="success"
                        variant="outlined"
                        label={`En ${destinoNombre}: ${NOMBRE_TIPO[i.listing_type_id] || "tipo por confirmar"} · ${i.item_id}`}
                        sx={{ height: 22 }}
                      />
                    ))}
                    {pv.lineas.map((l, k) =>
                      l.accion ? (
                        <ChipAccion key={k} accion={l.accion} tipo={l.tipo} />
                      ) : (
                        <Chip key={k} size="small" label={l.texto} color={l.estado === "en_refa" ? "warning" : "default"} variant={l.estado === "en_refa" ? "outlined" : "filled"} sx={{ height: 22 }} />
                      ),
                    )}
                  </Stack>
                </Box>
                <Tooltip arrow title="Revisión completa con Mercado Libre (atributos, fotos, precio mínimo) y publicación individual">
                  <span>
                    <Button size="small" sx={botonSx} disabled={!v.opciones.length} onClick={() => onRevisionCompleta(v)}>
                      Revisar
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            );
          })}
        </Paper>
        <Typography variant="caption" color="text.secondary">
          Esta es la revisión rápida (con los datos del sistema). Con «Revisar» se abre la revisión completa con Mercado Libre de esa variante.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onCerrar} sx={botonSx}>
          Listo ({seleccion.size} seleccionada{seleccion.size === 1 ? "" : "s"})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Pestaña 1: seleccionar familias
// ---------------------------------------------------------------------------
const FILTROS_INICIALES = {
  q: "",
  proveedor: null,
  logistica: "todas",
  estado: "active",
  multiVariante: false,
  ocultarCompletas: true,
  verEnRefa: false, // [MULTICUENTA-ML] por defecto se ocultan las que la cuenta destino ya vende con su SKU
};

const Seleccion = ({ destino, destinoNombre, onLoteCreado, avisar }) => {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [aplicados, setAplicados] = useState(FILTROS_INICIALES);
  const [proveedores, setProveedores] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  // family_id -> Set(MLMU elegidos); se conserva entre "Cargar más"
  const [seleccion, setSeleccion] = useState(new Map());
  const [tipo, setTipo] = useState("gold_special");
  const [abierta, setAbierta] = useState(null);
  const [revisionItem, setRevisionItem] = useState(null);
  const [revision, setRevision] = useState(null);
  const [revisando, setRevisando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const tipos = TIPOS_LOTE[tipo];

  useEffect(() => {
    axios
      .get(`${apiUrl}/proveedores`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => {
        const lista = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : [];
        setProveedores(lista.filter((p) => p?.id_proveedor));
      })
      .catch(() => setProveedores([]));
  }, []);

  const buscar = useCallback(
    async (f, pagina, acumular) => {
      if (!destino) return;
      if (acumular) setCargandoMas(true);
      else setLoading(true);
      try {
        const params = {
          cuentaDestinoId: destino,
          page: pagina,
          pageSize: PAGE_SIZE_FAMILIAS,
          logistica: f.logistica,
          estado: f.estado,
          minVariantes: f.multiVariante ? 2 : 1,
          ocultarCompletas: f.ocultarCompletas ? 1 : 0,
          enRefa: f.verEnRefa ? "todas" : "ocultar",
        };
        if (f.q.trim()) params.q = f.q.trim();
        if (f.proveedor) params.proveedorId = f.proveedor.id_proveedor;
        const r = await mcGet("/publicador/masivo/candidatos", params);
        const lista = r.filas || [];
        setRows((prev) => (acumular ? [...prev, ...lista.filter((x) => !prev.some((p) => p.family_id === x.family_id))] : lista));
        setTotal(Number(r.total) || 0);
        setPage(pagina);
        setAplicados(f);
        if (!acumular) setSeleccion(new Map());
      } catch (e) {
        avisar("error", await mensajeError(e, "No se pudieron buscar las familias."));
      } finally {
        setLoading(false);
        setCargandoMas(false);
      }
    },
    [destino, avisar],
  );

  useEffect(() => {
    buscar(FILTROS_INICIALES, 1, false);
    setFiltros(FILTROS_INICIALES);
  }, [buscar]);

  // Plan de cada familia con el tipo elegido y su selección
  const planes = useMemo(() => {
    const m = new Map();
    for (const fam of rows) m.set(fam.family_id, planFamilia(fam, tipos, seleccion.get(fam.family_id) || null));
    return m;
  }, [rows, tipos, seleccion]);

  // Al cambiar el tipo, se quitan de la selección las variantes que ya no tengan nada que publicar
  useEffect(() => {
    setSeleccion((prev) => {
      let cambio = false;
      const nueva = new Map();
      for (const [fid, set] of prev) {
        const fam = rows.find((r) => r.family_id === fid);
        if (!fam) {
          nueva.set(fid, set);
          continue;
        }
        const plan = planFamilia(fam, tipos, null);
        const filtrado = new Set([...set].filter((id) => plan.porVariante.get(id)?.publicable));
        if (filtrado.size !== set.size) cambio = true;
        if (filtrado.size) nueva.set(fid, filtrado);
        else cambio = true;
      }
      return cambio ? nueva : prev;
    });
  }, [tipo, rows, tipos]);

  const publicablesDe = (fam) => {
    const plan = planFamilia(fam, tipos, null);
    return fam.variantes.filter((v) => plan.porVariante.get(v.user_product_id)?.publicable).map((v) => v.user_product_id);
  };
  const famSeleccionable = (fam) => publicablesDe(fam).length > 0;

  const cambiarFamilias = (ids) => {
    const nuevo = new Map();
    for (const fid of ids) {
      const previo = seleccion.get(fid);
      if (previo) nuevo.set(fid, previo);
      else {
        const fam = rows.find((r) => r.family_id === fid);
        if (fam) nuevo.set(fid, new Set(publicablesDe(fam)));
      }
    }
    setSeleccion(nuevo);
  };

  const totales = useMemo(() => {
    let variantes = 0;
    let publicaciones = 0;
    const porAccion = { nueva_familia: 0, agregar_a_familia: 0, nueva_condicion: 0 };
    for (const [fid, set] of seleccion) {
      variantes += set.size;
      const p = planes.get(fid);
      if (!p) continue;
      publicaciones += p.publicaciones;
      for (const k of Object.keys(porAccion)) porAccion[k] += p.conteo[k];
    }
    return { familias: seleccion.size, variantes, publicaciones, porAccion };
  }, [seleccion, planes]);

  const mlmusElegidos = () => [...seleccion.values()].flatMap((s) => [...s]);

  const revisar = async () => {
    setRevisando(true);
    try {
      setRevision(await mcPost("/publicador/masivo/revisar", { cuentaDestinoId: destino, userProductIds: mlmusElegidos(), tipoPublicacion: tipo }));
    } catch (e) {
      avisar("error", await mensajeError(e, "No se pudo revisar el lote."));
    } finally {
      setRevisando(false);
    }
  };

  const enviar = async () => {
    setEnviando(true);
    try {
      const r = await mcPost("/publicador/masivo/lotes", { cuentaDestinoId: destino, userProductIds: mlmusElegidos(), tipoPublicacion: tipo });
      setRevision(null);
      if (!r.lote_id) {
        avisar("warning", `No se creó el lote: ${r.omitidos?.[0]?.motivo || "no hay nada que publicar."}`);
        return;
      }
      avisar("success", `Lote #${r.lote_id} en cola: ${r.resumen.familias} familia(s), ${r.resumen.publicaciones} publicación(es).`);
      setSeleccion(new Map());
      onLoteCreado(r.lote_id);
      buscar(aplicados, 1, false);
    } catch (e) {
      avisar("error", await mensajeError(e, "No se pudo crear el lote."));
    } finally {
      setEnviando(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "titulo",
        headerName: "Familia",
        minWidth: 320,
        flex: 1.6,
        renderCell: (p) => (
          <Tooltip arrow placement="top-start" title={famSeleccionable(p.row) ? "" : "No hay nada que publicar en esta familia con el tipo elegido."}>
            <Box sx={{ width: "100%", opacity: famSeleccionable(p.row) ? 1 : 0.55 }}>
              <ProductoCell row={p.row} titulo={p.row.titulo} sub={`Familia ${p.row.family_id}`} />
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "total_variantes",
        headerName: "Variantes",
        width: 170,
        renderCell: (p) => {
          const pct = p.row.total_variantes ? Math.round((p.row.en_destino / p.row.total_variantes) * 100) : 0;
          return (
            <Box sx={{ width: "100%" }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {p.row.en_destino} de {p.row.total_variantes} en {destinoNombre}
                {p.row.en_refa > 0 && (
                  <Box component="span" sx={{ color: "warning.main" }}>{` · ${p.row.en_refa} con su SKU`}</Box>
                )}
              </Typography>
              <LinearProgress variant="determinate" value={pct} color={pct === 100 ? "success" : "primary"} sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          );
        },
      },
      {
        field: "disponible",
        headerName: "Stock",
        width: 80,
        type: "number",
        headerAlign: "center",
        align: "center",
        renderCell: (p) => <ChipStock v={p.value} />,
      },
      {
        field: "logisticas",
        headerName: "Logística",
        width: 150,
        sortable: false,
        renderCell: (p) => (
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {(p.value || []).map((l) => (
              <ChipLogistica key={l} valor={l} />
            ))}
          </Stack>
        ),
      },
      {
        field: "plan",
        headerName: "Qué va a pasar",
        minWidth: 250,
        flex: 1.2,
        sortable: false,
        renderCell: (p) => {
          const plan = planes.get(p.row.family_id);
          if (!plan) return null;
          const c = planFamilia(p.row, tipos, null).conteo;
          if (!c.nueva_familia && !c.agregar_a_familia && !c.nueva_condicion) {
            return <Chip size="small" color="success" variant="outlined" label="Nada que publicar" sx={{ height: 22 }} />;
          }
          return (
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ py: 0.5 }}>
              {c.nueva_familia > 0 && <ChipAccion accion="nueva_familia" />}
              {c.agregar_a_familia > 0 && <ChipAccion accion="agregar_a_familia" n={c.agregar_a_familia} />}
              {c.nueva_condicion > 0 && <ChipAccion accion="nueva_condicion" n={c.nueva_condicion} />}
            </Stack>
          );
        },
      },
      {
        field: "seleccion",
        headerName: "Selección",
        width: 150,
        sortable: false,
        renderCell: (p) => {
          const set = seleccion.get(p.row.family_id);
          return (
            <Button size="small" sx={botonSx} startIcon={<AccountTreeOutlinedIcon />} onClick={(e) => { e.stopPropagation(); setAbierta(p.row.family_id); }}>
              {set ? `${set.size} de ${p.row.total_variantes}` : "Ver familia"}
            </Button>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planes, seleccion, tipos, destinoNombre],
  );

  const famAbierta = rows.find((r) => r.family_id === abierta);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <SectionCard
        icon={FilterAltOutlinedIcon}
        title="Filtros"
        subtitle="Familias de la cuenta principal. Una familia aparece si alguna de sus variantes cumple el filtro."
      >
        <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
          <TextField
            size="small"
            label="Familia, MLM, MLMU, SKU, ML o título"
            value={filtros.q}
            onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && buscar(filtros, 1, false)}
            sx={{ minWidth: 260, flex: 1 }}
          />
          <Autocomplete
            size="small"
            options={proveedores}
            value={filtros.proveedor}
            onChange={(e, v) => setFiltros((f) => ({ ...f, proveedor: v }))}
            getOptionLabel={(o) => o?.razon_social || ""}
            isOptionEqualToValue={(o, v) => o.id_proveedor === v.id_proveedor}
            renderInput={(params) => <TextField {...params} label="Proveedor" />}
            sx={{ minWidth: 220 }}
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filtros.logistica}
            onChange={(e, v) => v && setFiltros((f) => ({ ...f, logistica: v }))}
            sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, px: 1.5 } }}
          >
            <ToggleButton value="todas">Todas</ToggleButton>
            <ToggleButton value="me">Mercado Envíos</ToggleButton>
            <ToggleButton value="full">Full</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            select
            size="small"
            label="Estado ML"
            value={filtros.estado}
            onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
            sx={{ width: 140 }}
          >
            <MenuItem value="active">Activas</MenuItem>
            <MenuItem value="paused">Pausadas</MenuItem>
            <MenuItem value="todas">Todas</MenuItem>
          </TextField>
          <FormControlLabel
            control={<Switch checked={filtros.multiVariante} onChange={(e) => setFiltros((f) => ({ ...f, multiVariante: e.target.checked }))} />}
            label={<Typography variant="body2">Solo familias con 2 o más variantes</Typography>}
          />
          <FormControlLabel
            control={<Switch checked={filtros.ocultarCompletas} onChange={(e) => setFiltros((f) => ({ ...f, ocultarCompletas: e.target.checked }))} />}
            label={<Typography variant="body2">Ocultar familias ya completas en {destinoNombre}</Typography>}
          />
          <Tooltip arrow title={`Productos nuestros que ${destinoNombre} ya vende con su propio SKU y su propio stock. Se muestran marcados y no se publican.`}>
            <FormControlLabel
              control={<Switch checked={filtros.verEnRefa} onChange={(e) => setFiltros((f) => ({ ...f, verEnRefa: e.target.checked }))} />}
              label={<Typography variant="body2">Mostrar las que {destinoNombre} ya vende con su SKU</Typography>}
            />
          </Tooltip>
          <Stack direction="row" gap={1} sx={{ ml: { sm: "auto" } }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={() => {
                setFiltros(FILTROS_INICIALES);
                buscar(FILTROS_INICIALES, 1, false);
              }}
              sx={botonSx}
            >
              Limpiar
            </Button>
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={() => buscar(filtros, 1, false)} sx={botonSx}>
              Buscar
            </Button>
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard
        icon={AccountTreeOutlinedIcon}
        title="Familias"
        subtitle="Marca familias completas o entra a «Ver familia» para quitar variantes. Las atenuadas no tienen nada que publicar con el tipo elegido."
        count={total}
        actions={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={tipo}
            onChange={(e, v) => v && setTipo(v)}
            sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, px: 1.5 } }}
          >
            <ToggleButton value="gold_special">Clásica</ToggleButton>
            <ToggleButton value="gold_pro">Premium</ToggleButton>
            <ToggleButton value="ambas">Ambas</ToggleButton>
          </ToggleButtonGroup>
        }
      >
        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            sx={gridSx}
            rows={rows}
            columns={columns}
            getRowId={(r) => r.family_id}
            getRowHeight={() => "auto"}
            loading={loading}
            checkboxSelection
            keepNonExistentRowsSelected
            disableRowSelectionOnClick
            isRowSelectable={(p) => famSeleccionable(p.row)}
            rowSelectionModel={[...seleccion.keys()]}
            onRowSelectionModelChange={(m) => cambiarFamilias(m)}
            showCellVerticalBorder
            showColumnVerticalBorder
            density="compact"
            pageSizeOptions={[PAGE_SIZE_FAMILIAS]}
            initialState={{ pagination: { paginationModel: { pageSize: PAGE_SIZE_FAMILIAS, page: 0 } } }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: { csvOptions: { fileName: "publicador_masivo_familias", utf8WithBom: true } },
              loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" },
            }}
            localeText={{
              ...LOCALE_TEXT_GRID,
              noRowsLabel: "No hay familias con estos filtros (o ya están completas en la cuenta destino).",
              footerRowSelected: (n) => `${n} familia(s) seleccionada(s)`,
            }}
          />
        </Box>
        {rows.length < total && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
            <Button variant="outlined" onClick={() => buscar(aplicados, page + 1, true)} disabled={cargandoMas || loading} sx={botonSx}>
              {cargandoMas ? "Cargando…" : `Cargar más (${rows.length} de ${total})`}
            </Button>
          </Box>
        )}
      </SectionCard>

      {/* Barra fija de acción */}
      <Paper
        elevation={6}
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 3,
          p: 1.5,
          borderRadius: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
          border: seleccion.size ? "1px solid #1976d2" : "1px solid transparent",
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {seleccion.size
              ? `${totales.familias} familia(s) · ${totales.variantes} variante(s) · ${totales.publicaciones} publicación(es) ${
                  tipo === "ambas" ? "(Clásica y Premium)" : `(${NOMBRE_TIPO[tipo]})`
                }`
              : "Ninguna familia seleccionada"}
          </Typography>
          {seleccion.size > 0 && (
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
              {totales.porAccion.nueva_familia > 0 && <ChipAccion accion="nueva_familia" n={totales.porAccion.nueva_familia} />}
              {totales.porAccion.agregar_a_familia > 0 && <ChipAccion accion="agregar_a_familia" n={totales.porAccion.agregar_a_familia} />}
              {totales.porAccion.nueva_condicion > 0 && <ChipAccion accion="nueva_condicion" n={totales.porAccion.nueva_condicion} />}
            </Stack>
          )}
          <Typography variant="caption" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}>
            Precio = el de Aphelios para ese tipo · sin stock se publica con 1 y queda en 0 · dentro de cada familia se crean primero las variantes
          </Typography>
        </Box>
        <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
          {seleccion.size > 0 && (
            <Button size="small" color="inherit" onClick={() => setSeleccion(new Map())} sx={botonSx}>
              Quitar selección
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<FactCheckOutlinedIcon />}
            disabled={!totales.publicaciones || revisando}
            onClick={revisar}
            sx={botonSx}
          >
            {revisando ? "Revisando…" : `Revisar y publicar ${totales.publicaciones || ""}`}
          </Button>
        </Stack>
      </Paper>

      {famAbierta && (
        <VariantesFamilia
          fam={famAbierta}
          tipos={tipos}
          destinoNombre={destinoNombre}
          seleccion={seleccion.get(famAbierta.family_id) || new Set()}
          onCambiar={(set) =>
            setSeleccion((prev) => {
              const m = new Map(prev);
              if (set.size) m.set(famAbierta.family_id, set);
              else m.delete(famAbierta.family_id);
              return m;
            })
          }
          onCerrar={() => setAbierta(null)}
          onRevisionCompleta={(v) => {
            const ref = v.opciones.find((o) => o.status === "active") || v.opciones.find((o) => o.status !== "closed") || v.opciones[0];
            setRevisionItem(ref?.item_id || null);
          }}
        />
      )}

      <PublicarEnCuentaDialog
        open={Boolean(revisionItem)}
        itemIdInicial={revisionItem}
        cuentaDestinoInicial={destino}
        onClose={() => {
          setRevisionItem(null);
          buscar(aplicados, 1, false);
        }}
      />

      <ConfirmarLote revision={revision} enviando={enviando} onCancelar={() => setRevision(null)} onConfirmar={enviar} />
    </Box>
  );
};

/** Resumen de la revisión rápida antes de crear el lote. */
const ConfirmarLote = ({ revision, enviando, onCancelar, onConfirmar }) => {
  const [verOmitidos, setVerOmitidos] = useState(false);
  if (!revision) return null;
  const r = revision.resumen;
  const tipoTexto = revision.tipo === "ambas" ? "Clásica y Premium" : NOMBRE_TIPO[revision.tipo];
  // Familias del plan, en el orden en que se publican
  const familias = [];
  for (const f of revision.filas) {
    let g = familias.find((x) => x.clave === f.clave);
    if (!g) familias.push((g = { clave: f.clave, titulo: f.familia, filas: [] }));
    g.filas.push(f);
  }
  return (
    <Dialog open onClose={() => !enviando && onCancelar()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        ¿Publicar {r.publicaciones} en {revision.destino.nombre}?
      </DialogTitle>
      <DialogContent dividers>
        <Stack gap={1.5}>
          <Typography variant="body2">
            <b>{r.familias}</b> familia(s) · <b>{r.variantes}</b> variante(s) · tipo <b>{tipoTexto}</b>. Se publican en segundo plano, unas
            pocas por minuto; puedes seguir el avance en la pestaña <b>Lotes</b>.
          </Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            {r.por_accion.nueva_familia > 0 && <ChipAccion accion="nueva_familia" n={r.por_accion.nueva_familia} />}
            {r.por_accion.agregar_a_familia > 0 && <ChipAccion accion="agregar_a_familia" n={r.por_accion.agregar_a_familia} />}
            {r.por_accion.nueva_condicion > 0 && <ChipAccion accion="nueva_condicion" n={r.por_accion.nueva_condicion} />}
          </Stack>
          {r.sin_stock > 0 && (
            <Alert severity="info" sx={{ py: 0 }}>
              {r.sin_stock} variante(s) sin stock: se publican con 1 y el sincronizador las deja en 0 enseguida (Mercado Libre las pausa hasta que
              haya stock).
            </Alert>
          )}
          {revision.excede && (
            <Alert severity="error" sx={{ py: 0 }}>
              El lote tendría {r.publicaciones} publicaciones y el máximo es {revision.maximo}. Quita algunas familias.
            </Alert>
          )}
          <Paper variant="outlined" sx={{ maxHeight: 260, overflow: "auto", borderRadius: 2, p: 1 }}>
            {familias.map((g) => (
              <Box key={g.clave} sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                  {g.titulo}
                </Typography>
                {g.filas.map((f, k) => (
                  <Stack key={k} direction="row" gap={1} alignItems="center" sx={{ pl: 1 }}>
                    <Typography variant="caption" sx={{ minWidth: 0, flex: 1 }} noWrap title={f.titulo}>
                      {k + 1}. {(f.familia && f.titulo?.startsWith(f.familia) && f.titulo.slice(f.familia.length).trim()) || f.titulo}
                    </Typography>
                    <ChipAccion accion={f.accion} tipo={f.tipo} />
                  </Stack>
                ))}
              </Box>
            ))}
          </Paper>
          {revision.omitidos.length > 0 && (
            <Box>
              <Button size="small" sx={botonSx} onClick={() => setVerOmitidos((x) => !x)}>
                {verOmitidos ? "Ocultar" : "Ver"} {revision.omitidos.length} que no entran
              </Button>
              {verOmitidos && (
                <Paper variant="outlined" sx={{ maxHeight: 180, overflow: "auto", borderRadius: 2, p: 1 }}>
                  {revision.omitidos.map((o, k) => (
                    <Typography key={k} variant="caption" sx={{ display: "block" }}>
                      • {o.titulo || o.user_product_id}
                      {o.tipo ? ` (${NOMBRE_TIPO[o.tipo]})` : ""}: {o.motivo}
                    </Typography>
                  ))}
                </Paper>
              )}
            </Box>
          )}
          <Typography variant="caption" color="text.secondary">
            Revisión rápida con los datos del sistema. Atributos, fotos y precio mínimo los valida Mercado Libre al publicar; si algo falla, la
            fila queda con error y el motivo.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} disabled={enviando} sx={botonSx}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onConfirmar}
          disabled={enviando || revision.excede || !r.publicaciones}
          startIcon={<PublishOutlinedIcon />}
          sx={botonSx}
        >
          {enviando ? "Creando lote…" : "Sí, crear el lote"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Pestaña 2: lotes
// ---------------------------------------------------------------------------
const Lotes = ({ visible, loteInicial, avisar }) => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loteId, setLoteId] = useState(loteInicial || null);
  const [detalle, setDetalle] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [reintentando, setReintentando] = useState(false);

  useEffect(() => {
    if (loteInicial) setLoteId(loteInicial);
  }, [loteInicial]);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setLoading(true);
      try {
        const r = await mcGet("/publicador/masivo/lotes");
        const filas = r.filas || [];
        setLotes(filas);
        setLoteId((actual) => actual || filas[0]?.id || null);
      } catch (e) {
        if (!silencioso) avisar("error", await mensajeError(e, "No se pudieron consultar los lotes."));
      } finally {
        setLoading(false);
      }
    },
    [avisar],
  );

  const cargarDetalle = useCallback(async (id) => {
    if (!id) return setDetalle(null);
    try {
      setDetalle(await mcGet(`/publicador/masivo/lotes/${id}`));
    } catch (e) {
      setDetalle(null);
    }
  }, []);

  useEffect(() => {
    if (visible) cargar();
  }, [visible, cargar]);

  useEffect(() => {
    cargarDetalle(loteId);
  }, [loteId, cargarDetalle]);

  // Refresco automático mientras haya lotes en curso y la pestaña esté a la vista
  const hayActivos = lotes.some((l) => ["pendiente", "procesando"].includes(l.estado));
  useEffect(() => {
    if (!visible || !hayActivos) return undefined;
    const t = setInterval(() => {
      cargar(true);
      cargarDetalle(loteId);
    }, REFRESCO_MS);
    return () => clearInterval(t);
  }, [visible, hayActivos, cargar, cargarDetalle, loteId]);

  const cancelar = async () => {
    setCancelando(true);
    try {
      const r = await mcPost(`/publicador/masivo/lotes/${loteId}/cancelar`);
      avisar("info", `Lote #${loteId} cancelado (${r.cancelados} pendiente(s) detenidas).`);
      cargar(true);
      cargarDetalle(loteId);
    } catch (e) {
      avisar("error", await mensajeError(e, "No se pudo cancelar el lote."));
    } finally {
      setCancelando(false);
    }
  };

  // [MULTICUENTA-ML] Regresa a la cola las filas con error (con los ajustes automáticos nuevos)
  const reintentar = async () => {
    setReintentando(true);
    try {
      const r = await mcPost(`/publicador/masivo/lotes/${loteId}/reintentar`);
      avisar(r.reintentos ? "success" : "info", r.reintentos ? `${r.reintentos} publicación(es) del lote #${loteId} regresaron a la cola.` : "Este lote no tiene errores por reintentar.");
      cargar(true);
      cargarDetalle(loteId);
    } catch (e) {
      avisar("error", await mensajeError(e, "No se pudo reintentar el lote."));
    } finally {
      setReintentando(false);
    }
  };

  const colLotes = useMemo(
    () => [
      { field: "id", headerName: "Lote", width: 80, renderCell: (p) => <b>#{p.value}</b> },
      { field: "estado", headerName: "Estado", width: 120, renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADOS_LOTE} /> },
      { field: "cuenta_destino", headerName: "Destino", width: 160 },
      { field: "familias", headerName: "Familias", width: 90, type: "number" },
      { field: "avance", headerName: "Avance", minWidth: 160, flex: 1, sortable: false, renderCell: (p) => <ProgresoLote lote={p.row} /> },
      { field: "publicados", headerName: "Publicadas", width: 100, type: "number" },
      { field: "omitidos", headerName: "Omitidas", width: 95, type: "number" },
      { field: "errores", headerName: "Errores", width: 85, type: "number" },
      { field: "creado_por", headerName: "Creado por", width: 130 },
      { field: "fecha_creado", headerName: "Fecha", width: 140, valueFormatter: (v) => formatoFecha(v) },
    ],
    [],
  );

  const colItems = useMemo(
    () => [
      { field: "estado", headerName: "Estado", width: 115, renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADOS_ITEM} /> },
      {
        field: "titulo",
        headerName: "Variante (origen)",
        minWidth: 280,
        flex: 1.4,
        renderCell: (p) => <ProductoCell row={p.row} titulo={p.row.titulo} sub={`${p.row.item_id_origen} · MLMU ${p.row.user_product_id || ""}`} />,
      },
      {
        field: "tipo_publicacion",
        headerName: "Tipo",
        width: 90,
        valueFormatter: (v) => NOMBRE_TIPO[v] || v || "",
      },
      {
        field: "accion",
        headerName: "Acción",
        width: 200,
        renderCell: (p) => (p.value ? <ChipAccion accion={p.value} /> : ""),
      },
      {
        field: "item_id_destino",
        headerName: "Nueva publicación",
        width: 160,
        renderCell: (p) =>
          p.value && p.row.permalink ? (
            <Link href={p.row.permalink} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>
              {p.value}
            </Link>
          ) : (
            p.value || ""
          ),
      },
      { field: "precio", headerName: "Precio", width: 110, valueFormatter: (v) => dinero(v) },
      { field: "cantidad", headerName: "Stock", width: 75, type: "number" },
      {
        field: "detalle",
        headerName: "Detalle",
        minWidth: 260,
        flex: 1.2,
        renderCell: (p) => (
          <Typography variant="caption" sx={{ whiteSpace: "normal", py: 0.5 }} title={p.value || ""}>
            {p.value}
          </Typography>
        ),
      },
    ],
    [],
  );

  const l = detalle?.lote;
  const activo = l && ["pendiente", "procesando"].includes(l.estado);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <SectionCard
        icon={DynamicFeedOutlinedIcon}
        title="Lotes"
        subtitle={hayActivos ? "Se actualiza solo cada 5 segundos mientras haya lotes en curso." : "Elige un lote para ver su detalle."}
        count={lotes.length}
        actions={
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => cargar()} sx={botonSx}>
            Actualizar
          </Button>
        }
      >
        <Box sx={{ height: 300, width: "100%" }}>
          <DataGrid
            sx={{ ...gridSx, "& .MuiDataGrid-row": { cursor: "pointer" } }}
            rows={lotes}
            columns={colLotes}
            loading={loading}
            onRowClick={(p) => setLoteId(p.row.id)}
            rowSelectionModel={loteId ? [loteId] : []}
            density="compact"
            hideFooterSelectedRowCount
            showColumnVerticalBorder
            pageSizeOptions={[PAGE_SIZE]}
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Todavía no hay lotes. Crea uno en la pestaña Seleccionar." }}
          />
        </Box>
      </SectionCard>

      {l && (
        <>
          <Box sx={kpiGridSx}>
            <KpiCard icon={CheckCircleOutlineIcon} color="#2e7d32" label="Publicadas">
              <KpiValor valor={l.publicados} detalle={`de ${l.total} en el lote`} />
            </KpiCard>
            <KpiCard icon={DoNotDisturbOnOutlinedIcon} color="#0288d1" label="Omitidas">
              <KpiValor valor={l.omitidos} detalle="Ya existían en la cuenta destino" />
            </KpiCard>
            <KpiCard icon={ErrorOutlineIcon} color="#d32f2f" label="Con error">
              <KpiValor valor={l.errores} detalle="Ver el detalle de cada una" />
            </KpiCard>
            <KpiCard icon={HourglassEmptyOutlinedIcon} color="#ed6c02" label="En cola">
              <KpiValor valor={l.pendientes + l.procesando} detalle={activo ? "Se publican unas pocas por minuto" : "—"} />
            </KpiCard>
          </Box>

          <SectionCard
            icon={ListAltOutlinedIcon}
            title={`Lote #${l.id} · ${l.cuenta_destino}`}
            subtitle={`Creado por ${l.creado_por || "—"} el ${formatoFecha(l.fecha_creado)} · tipo ${
              TIPOS.find((t) => t.value === l.tipo_publicacion)?.label || l.tipo_publicacion
            }`}
            count={l.total}
            actions={
              <Stack direction="row" gap={1}>
                {l.errores > 0 && l.estado !== "cancelado" && (
                  <Tooltip arrow title="Vuelve a intentar las que fallaron, con los ajustes automáticos de atributos.">
                    <span>
                      <Button variant="outlined" size="small" startIcon={<ReplayOutlinedIcon />} onClick={reintentar} disabled={reintentando} sx={botonSx}>
                        Reintentar errores ({l.errores})
                      </Button>
                    </span>
                  </Tooltip>
                )}
                {activo && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CancelOutlinedIcon />}
                    onClick={cancelar}
                    disabled={cancelando}
                    sx={botonSx}
                  >
                    Cancelar pendientes
                  </Button>
                )}
              </Stack>
            }
          >
            {activo && <LinearProgress sx={{ mb: 1.5, borderRadius: 4 }} />}
            <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
              <DataGrid
                sx={gridSx}
                rows={detalle?.items || []}
                columns={colItems}
                getRowHeight={() => "auto"}
                density="compact"
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                showCellVerticalBorder
                showColumnVerticalBorder
                pageSizeOptions={[PAGE_SIZE]}
                initialState={{ pagination: { paginationModel: { pageSize: PAGE_SIZE, page: 0 } } }}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { csvOptions: { fileName: `lote_${l.id}`, utf8WithBom: true } } }}
                localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Este lote no tiene publicaciones." }}
              />
            </Box>
          </SectionCard>
        </>
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Ventana
// ---------------------------------------------------------------------------
const PublicadorMasivoDialog = ({ open, onClose }) => {
  const [cuentas, setCuentas] = useState([]);
  const [destino, setDestino] = useState("");
  const [tab, setTab] = useState(0);
  const [loteNuevo, setLoteNuevo] = useState(null);
  const [aviso, setAviso] = useState(null);

  const avisar = useCallback((severity, text) => setAviso({ severity, text }), []);

  useEffect(() => {
    if (!open) return;
    mcGet("/publicador/cuentas")
      .then((r) => {
        const subcuentas = (r.filas || []).filter((c) => c.tipo !== "principal");
        setCuentas(subcuentas);
        setDestino((d) => d || subcuentas[0]?.id || "");
      })
      .catch(async (e) => avisar("error", await mensajeError(e, "No se pudieron cargar las cuentas.")));
  }, [open, avisar]);

  return (
    <Dialog fullScreen open={open} onClose={onClose} PaperProps={{ sx: { bgcolor: "#f5f7fa" } }}>
      <GlobalStyles styles={(theme) => ({ ".MuiDataGrid-panel": { zIndex: theme.zIndex.modal + 100 } })} />
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
            <DynamicFeedOutlinedIcon color="primary" /> Publicador masivo
          </Typography>
          <TextField
            select
            size="small"
            label="Publicar en"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {cuentas.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nombre}
              </MenuItem>
            ))}
          </TextField>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600 } }}
          >
            <Tab label="Seleccionar" />
            <Tab label="Lotes" />
            <Tab label="Portadas" />
          </Tabs>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {!cuentas.length ? (
          <Alert severity="info">No hay subcuentas activas para publicar.</Alert>
        ) : (
          <>
            {tab === 0 && destino && (
              <Seleccion
                key={destino}
                destino={destino}
                destinoNombre={cuentas.find((c) => String(c.id) === String(destino))?.nombre || "destino"}
                avisar={avisar}
                onLoteCreado={(id) => {
                  setLoteNuevo(id);
                  setTab(1);
                }}
              />
            )}
            {tab === 1 && <Lotes visible={open && tab === 1} loteInicial={loteNuevo} avisar={avisar} />}
            {tab === 2 && destino && (
              <PortadasRefa
                key={destino}
                destino={destino}
                destinoNombre={cuentas.find((c) => String(c.id) === String(destino))?.nombre || "destino"}
                visible={open && tab === 2}
                avisar={avisar}
              />
            )}
          </>
        )}
      </Box>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={7000}
        onClose={() => setAviso(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {aviso ? (
          <Alert severity={aviso.severity} onClose={() => setAviso(null)} variant="filled" sx={{ maxWidth: 640 }}>
            {aviso.text}
          </Alert>
        ) : (
          <span />
        )}
      </Snackbar>
    </Dialog>
  );
};

export default PublicadorMasivoDialog;
