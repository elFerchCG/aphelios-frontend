// [MULTICUENTA-ML] Portadas Refa (pestaña del Publicador masivo).
// Se suben las portadas hechas en Photoroom (cada archivo nombrado con el MLMU de
// Aphelios), se revisan y se aplican en cola: sustituyen la primera foto de la
// publicación en la subcuenta. Se pueden revertir a las fotos originales.
import React, { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";
import { Alert, Avatar, Box, Button, Chip, LinearProgress, Link, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

import { mcGet, mcPost, mensajeError } from "./multicuentaApi";
import { GRID_HEIGHT, LOCALE_TEXT_GRID, gridSx, botonSx, SectionCard, EstadoChip } from "./uiMulticuenta";

const REFRESCO_MS = 5000;
const POR_ENVIO = 10; // imágenes por petición
const MAX_BYTES_ENVIO = 8 * 1024 * 1024; // y máximo ~8 MB por petición
const MAX_BYTES_IMAGEN = 10 * 1024 * 1024;
const PRUEBA = 15;

const ESTADOS = {
  cargada: { label: "Cargada", color: "default" },
  pendiente: { label: "En cola", color: "info" },
  procesando: { label: "Aplicando", color: "warning" },
  aplicada: { label: "Aplicada", color: "success" },
  error: { label: "Error", color: "error" },
  revertir: { label: "Revirtiendo", color: "warning" },
  revertida: { label: "Revertida", color: "secondary" },
};

const FILTROS_ESTADO = [
  { value: "", label: "Todas" },
  { value: "cargada", label: "Cargadas" },
  { value: "sin_publicar", label: "Cargadas sin publicar aún" },
  { value: "pendiente", label: "En cola" },
  { value: "aplicada", label: "Aplicadas" },
  { value: "error", label: "Con error" },
  { value: "revertida", label: "Revertidas" },
];

const formatoFecha = (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "");
const RE_MLMU = /MLMU\d{5,20}/i;

/** Agrupa los archivos en envíos de máximo 10 imágenes y ~8 MB. */
function enEnvios(archivos) {
  const envios = [];
  let actual = [];
  let bytes = 0;
  for (const a of archivos) {
    if (actual.length && (actual.length >= POR_ENVIO || bytes + a.size > MAX_BYTES_ENVIO)) {
      envios.push(actual);
      actual = [];
      bytes = 0;
    }
    actual.push(a);
    bytes += a.size;
  }
  if (actual.length) envios.push(actual);
  return envios;
}

const PortadasRefa = ({ destino, destinoNombre, visible, avisar }) => {
  const [filas, setFilas] = useState([]);
  const [conteo, setConteo] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState({ estado: "", q: "" });
  const [aplicado, setAplicado] = useState({ estado: "", q: "" });
  const [paginacion, setPaginacion] = useState({ page: 0, pageSize: 100 });
  const [seleccion, setSeleccion] = useState([]);
  const [subida, setSubida] = useState(null); // { total, hechos, resultado: {cargada, error, sin_producto}, problemas: [] }
  const [trabajando, setTrabajando] = useState(false);
  const inputRef = useRef(null);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!destino) return;
      if (!silencioso) setLoading(true);
      try {
        const params = { cuentaMlId: destino, page: paginacion.page + 1, pageSize: paginacion.pageSize };
        if (aplicado.estado) params.estado = aplicado.estado;
        if (aplicado.q.trim()) params.q = aplicado.q.trim();
        const r = await mcGet("/portadas", params);
        setFilas(r.filas || []);
        setTotal(Number(r.total) || 0);
        setConteo(r.conteo || {});
      } catch (e) {
        if (!silencioso) avisar("error", await mensajeError(e, "No se pudieron consultar las portadas."));
      } finally {
        setLoading(false);
      }
    },
    [destino, aplicado, paginacion, avisar],
  );

  useEffect(() => {
    if (visible) cargar();
  }, [visible, cargar]);

  // Refresco mientras haya portadas en cola
  const enCurso = Number(conteo.pendiente || 0) + Number(conteo.procesando || 0) + Number(conteo.revertir || 0);
  useEffect(() => {
    if (!visible || !enCurso) return undefined;
    const t = setInterval(() => cargar(true), REFRESCO_MS);
    return () => clearInterval(t);
  }, [visible, enCurso, cargar]);

  const elegirArchivos = () => inputRef.current?.click();

  const subir = async (lista) => {
    const archivos = [...lista];
    if (!archivos.length) return;
    // Validación en el navegador antes de enviar
    const problemas = [];
    const validos = archivos.filter((a) => {
      if (!RE_MLMU.test(a.name)) problemas.push({ archivo: a.name, detalle: "El nombre no trae el MLMU (ej. MLMU987701338.jpg)." });
      else if (!/^image\/(jpe?g|png)$/i.test(a.type)) problemas.push({ archivo: a.name, detalle: "Solo JPG o PNG." });
      else if (a.size > MAX_BYTES_IMAGEN) problemas.push({ archivo: a.name, detalle: "Pesa más de 10 MB." });
      else return true;
      return false;
    });
    const resultado = { cargada: 0, error: problemas.length, sin_producto: 0 };
    setSubida({ total: archivos.length, hechos: problemas.length, resultado: { ...resultado }, problemas: [...problemas] });

    for (const envio of enEnvios(validos)) {
      const fd = new FormData();
      fd.append("cuentaMlId", String(destino));
      envio.forEach((a) => fd.append("imagenes", a, a.name));
      try {
        const r = await mcPost("/portadas/subir", fd);
        for (const f of r.archivos || []) {
          resultado[f.estado] = (resultado[f.estado] || 0) + 1;
          if (f.estado !== "cargada") problemas.push({ archivo: f.archivo, detalle: f.detalle });
        }
      } catch (e) {
        const msg = await mensajeError(e, "No se pudo subir este grupo de imágenes.");
        envio.forEach((a) => problemas.push({ archivo: a.name, detalle: msg }));
        resultado.error += envio.length;
      }
      setSubida((s) => ({ ...s, hechos: Math.min(s.total, s.hechos + envio.length), resultado: { ...resultado }, problemas: [...problemas] }));
    }
    avisar(
      resultado.cargada ? "success" : "warning",
      `Portadas cargadas: ${resultado.cargada}. Con problema: ${resultado.error + resultado.sin_producto}.`,
    );
    cargar(true);
  };

  const aplicar = async ({ ids = null, limite = null }) => {
    setTrabajando(true);
    try {
      const r = await mcPost("/portadas/aplicar", { cuentaMlId: destino, ids, limite });
      avisar(
        r.encoladas ? "success" : "info",
        `${r.encoladas} portada(s) en cola.${r.sin_publicar ? ` ${r.sin_publicar} aún no están publicadas en ${destinoNombre} (nacerán con su portada).` : ""}`,
      );
      setSeleccion([]);
      cargar(true);
    } catch (e) {
      avisar("error", await mensajeError(e, "No se pudieron aplicar las portadas."));
    } finally {
      setTrabajando(false);
    }
  };

  const revertir = async () => {
    setTrabajando(true);
    try {
      const r = await mcPost("/portadas/revertir", { cuentaMlId: destino, ids: seleccion });
      avisar("info", `${r.encoladas} portada(s) se regresan a las fotos originales.`);
      setSeleccion([]);
      cargar(true);
    } catch (e) {
      avisar("error", await mensajeError(e, "No se pudieron revertir las portadas."));
    } finally {
      setTrabajando(false);
    }
  };

  const elegidas = filas.filter((f) => seleccion.includes(f.id));
  const aplicables = elegidas.filter((f) => ["cargada", "error"].includes(f.estado)).length;
  const revertibles = elegidas.filter((f) => ["aplicada", "error"].includes(f.estado) && f.puede_revertir).length;
  const cargadasConPublicacion = Number(conteo.cargada || 0) - Number(conteo.sin_publicar || 0);

  const columnas = [
    {
      field: "picture_url",
      headerName: "Portada nueva",
      width: 110,
      sortable: false,
      renderCell: (p) => (
        <Avatar variant="rounded" src={p.value || undefined} sx={{ width: 64, height: 64, my: 0.5, bgcolor: "#f5f5f5", border: "1px solid #e0e0e0" }}>
          <ImageOutlinedIcon sx={{ color: "#9e9e9e" }} />
        </Avatar>
      ),
    },
    { field: "estado", headerName: "Estado", width: 115, renderCell: (p) => <EstadoChip valor={p.value} mapa={ESTADOS} /> },
    {
      field: "titulo",
      headerName: "Producto",
      minWidth: 260,
      flex: 1.3,
      renderCell: (p) => (
        <Box sx={{ minWidth: 0, py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "normal" }}>
            {p.value || "Sin título"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {p.row.user_product_id} · {p.row.archivo}
          </Typography>
        </Box>
      ),
    },
    {
      field: "item_id_destino",
      headerName: `Publicación en ${destinoNombre}`,
      width: 170,
      renderCell: (p) =>
        p.value ? (
          <Link href={`https://articulo.mercadolibre.com.mx/${p.value.replace(/^MLM/, "MLM-")}`} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>
            {p.value}
          </Link>
        ) : (
          <Chip size="small" label="Aún no publicada" sx={{ height: 22 }} />
        ),
    },
    {
      field: "detalle",
      headerName: "Detalle",
      minWidth: 240,
      flex: 1,
      renderCell: (p) => (
        <Typography variant="caption" sx={{ whiteSpace: "normal", py: 0.5 }} title={p.value || ""}>
          {p.value}
        </Typography>
      ),
    },
    { field: "fecha_actualizado", headerName: "Actualizada", width: 135, valueFormatter: (v) => formatoFecha(v) },
    { field: "subido_por", headerName: "Subió", width: 120 },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <SectionCard
        icon={CloudUploadOutlinedIcon}
        title="Subir portadas"
        subtitle={`Cada archivo con el MLMU de Aphelios en el nombre (ej. MLMU987701338.jpg). JPG o PNG, mínimo 500×500 px. Se suben a Mercado Libre con la cuenta ${destinoNombre}.`}
        actions={
          <Button variant="contained" size="small" startIcon={<CloudUploadOutlinedIcon />} onClick={elegirArchivos} disabled={subida && subida.hechos < subida.total} sx={botonSx}>
            Elegir imágenes
          </Button>
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          hidden
          onChange={(e) => {
            subir(e.target.files);
            e.target.value = "";
          }}
        />
        {subida ? (
          <Stack gap={1}>
            <LinearProgress variant="determinate" value={subida.total ? Math.round((subida.hechos / subida.total) * 100) : 0} sx={{ height: 8, borderRadius: 4 }} />
            <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {subida.hechos} de {subida.total}
              </Typography>
              <Chip size="small" color="success" label={`Cargadas: ${subida.resultado.cargada}`} />
              {subida.resultado.sin_producto > 0 && <Chip size="small" color="warning" label={`Sin producto: ${subida.resultado.sin_producto}`} />}
              {subida.resultado.error > 0 && <Chip size="small" color="error" label={`Con error: ${subida.resultado.error}`} />}
            </Stack>
            {subida.problemas.length > 0 && (
              <Alert severity="warning" sx={{ maxHeight: 160, overflow: "auto" }}>
                {subida.problemas.slice(0, 200).map((p, i) => (
                  <Typography key={i} variant="caption" sx={{ display: "block" }}>
                    <b>{p.archivo}</b>: {p.detalle}
                  </Typography>
                ))}
              </Alert>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Puedes elegir cientos de imágenes a la vez; se envían de 10 en 10. Si un producto ya tenía portada cargada, la nueva la reemplaza.
          </Typography>
        )}
      </SectionCard>

      <SectionCard
        icon={ImageOutlinedIcon}
        title="Portadas"
        subtitle={enCurso ? "Se actualiza sola cada 5 segundos mientras haya portadas en cola." : "La portada nueva sustituye la primera foto; Mercado Libre la replica a la Clásica y Premium de la misma variante."}
        count={total}
        actions={
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Tooltip arrow title={`Aplica solo ${PRUEBA} para confirmar que Mercado Libre acepta el diseño antes de hacerlo en masa.`}>
              <span>
                <Button size="small" variant="outlined" startIcon={<ScienceOutlinedIcon />} disabled={trabajando || cargadasConPublicacion <= 0} onClick={() => aplicar({ limite: PRUEBA })} sx={botonSx}>
                  Prueba ({PRUEBA})
                </Button>
              </span>
            </Tooltip>
            <Button size="small" variant="outlined" startIcon={<PlayArrowOutlinedIcon />} disabled={trabajando || !aplicables} onClick={() => aplicar({ ids: seleccion })} sx={botonSx}>
              Aplicar seleccionadas ({aplicables})
            </Button>
            <Button size="small" variant="contained" startIcon={<PlayArrowOutlinedIcon />} disabled={trabajando || cargadasConPublicacion <= 0} onClick={() => aplicar({})} sx={botonSx}>
              Aplicar todas las cargadas ({Math.max(0, cargadasConPublicacion)})
            </Button>
            <Button size="small" color="warning" variant="outlined" startIcon={<UndoOutlinedIcon />} disabled={trabajando || !revertibles} onClick={revertir} sx={botonSx}>
              Revertir ({revertibles})
            </Button>
          </Stack>
        }
      >
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems={{ sm: "center" }} sx={{ mb: 1.5 }} flexWrap="wrap">
          {Object.entries(ESTADOS)
            .filter(([k]) => Number(conteo[k]) > 0)
            .map(([k, e]) => (
              <Chip key={k} size="small" color={e.color} variant="outlined" label={`${e.label}: ${conteo[k]}`} />
            ))}
          {Number(conteo.sin_publicar) > 0 && <Chip size="small" variant="outlined" label={`Aún sin publicar: ${conteo.sin_publicar}`} />}
          <Box sx={{ flex: 1 }} />
          <TextField select size="small" label="Estado" value={filtro.estado} onChange={(e) => setFiltro((f) => ({ ...f, estado: e.target.value }))} sx={{ width: 220 }}>
            {FILTROS_ESTADO.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Buscar"
            placeholder="MLMU, MLM o título"
            value={filtro.q}
            onChange={(e) => setFiltro((f) => ({ ...f, q: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              setPaginacion((p) => ({ ...p, page: 0 }));
              setAplicado(filtro);
            }}
            sx={{ width: 240 }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => {
              setPaginacion((p) => ({ ...p, page: 0 }));
              setAplicado(filtro);
            }}
            sx={botonSx}
          >
            Buscar
          </Button>
          <Button size="small" color="inherit" startIcon={<RefreshIcon />} onClick={() => cargar()} sx={botonSx}>
            Actualizar
          </Button>
        </Stack>

        <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
          <DataGrid
            sx={gridSx}
            rows={filas}
            columns={columnas}
            loading={loading}
            getRowHeight={() => "auto"}
            density="compact"
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={seleccion}
            onRowSelectionModelChange={(m) => setSeleccion(m)}
            keepNonExistentRowsSelected
            paginationMode="server"
            rowCount={total}
            paginationModel={paginacion}
            onPaginationModelChange={setPaginacion}
            pageSizeOptions={[100]}
            showCellVerticalBorder
            showColumnVerticalBorder
            localeText={{ ...LOCALE_TEXT_GRID, noRowsLabel: "Todavía no hay portadas. Sube las imágenes de Photoroom arriba." }}
          />
        </Box>
      </SectionCard>
    </Box>
  );
};

export default PortadasRefa;
