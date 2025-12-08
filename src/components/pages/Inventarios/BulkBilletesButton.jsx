import { useRef, useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  Typography,
  FormControlLabel,
  Switch,
  Tooltip,
  Alert,
  Checkbox,
} from "@mui/material";
import axios from "axios";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import GetAppIcon from "@mui/icons-material/GetApp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

export default function BulkBilletesButton({ onSuccess }) {
  const anchorRef = useRef(null);
  const fileRef = useRef(null);

  const [openMenu, setOpenMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modeReplace, setModeReplace] = useState(false); // false=append, true=replace
  const [dryRun, setDryRun] = useState(true); // simular por defecto
  const [report, setReport] = useState(null);
  const [openReport, setOpenReport] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [openConfirmReplace, setOpenConfirmReplace] = useState(false);
  const [ackReplace, setAckReplace] = useState(false);

  const handleOpenMenu = () => setOpenMenu(true);
  const handleCloseMenu = () => setOpenMenu(false);

  const onDownloadTemplate = async () => {
    handleCloseMenu();
    try {
      const headers = {};
      // Si usas JWT en header:
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await axios.get(`${apiUrl}/billetes/descargar/template`, {
        responseType: "blob",
      });

      // Intentar obtener el filename del header
      let filename = "plantilla_billetes.xlsx";
      const cd = res.headers?.["content-disposition"];
      if (cd) {
        const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Si el servidor devuelve un error con blob, intenta leerlo como texto/JSON:
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const txt = reader.result;
          let msg = "No se pudo descargar la plantilla.";
          try {
            const j = JSON.parse(txt);
            msg = j.message || j.error || msg;
          } catch {
            if (typeof txt === "string" && txt.trim()) msg = txt;
          }
          setReport({ error: msg });
          setOpenReport(true);
        };
        if (e?.response?.data) reader.readAsText(e.response.data);
        else throw e;
      } catch {
        console.error(e);
        setReport({ error: "No se pudo descargar la plantilla." });
        setOpenReport(true);
      }
    }
  };

  const onChooseFile = () => {
    handleCloseMenu();
    if (fileRef.current) fileRef.current.value = null;
    fileRef.current?.click();
  };

  const proceedUploadAfterConfirm = () => {
    setOpenConfirmReplace(false);
    if (fileRef.current) fileRef.current.value = null;
    fileRef.current?.click();
  };

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Límite de tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setReport({ error: "Archivo demasiado grande (máx 10MB)" });
      setOpenReport(true);
      return;
    }

    // Confirmación si está en modo reemplazo
    if (modeReplace) {
      const ok = window.confirm(
        "Vas a REEMPLAZAR el billete con lo del archivo. ¿Continuar?"
      );
      if (!ok) return;
    }

    setLoading(true);
    setReport(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const mode = modeReplace ? "replace" : "append";

      const res = await axios.post(
        `${apiUrl}/billetes/cargar/excel?mode=${mode}&dryRun=${dryRun ? 1 : 0}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setReport(res.data?.report || res.data);
      setOpenReport(true);
      onSuccess?.();
      
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Error al subir el archivo.";
      setReport({ error: msg, raw: e?.response?.data });
      setOpenReport(true);
    } finally {
      setLoading(false);
      onSuccess?.();
    }
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flexWrap: "wrap", gap: 1 }}
      >
        <Button
          ref={anchorRef}
          variant="contained"
          endIcon={<MoreHorizIcon />}
          onClick={handleOpenMenu}
          disabled={loading}
        >
          Carga masiva
        </Button>

        <Tooltip
          title={
            <div style={{ maxWidth: 320 }}>
              <b>Agregar/Actualizar:</b> hace upsert de componentes y
              suma/actualiza líneas de billetes.
              <br />
              <b>Reemplazar:</b> borra las líneas del billete por producto_id y
              recrea exactamente lo del Excel.
            </div>
          }
          arrow
        >
          <FormControlLabel
            control={
              <Switch
                checked={modeReplace}
                onChange={(e) => setModeReplace(e.target.checked)}
                disabled={loading}
                inputProps={{ "aria-label": "Modo de carga" }}
              />
            }
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <span>
                  {modeReplace
                    ? "Modo: Reemplazar"
                    : "Modo: Agregar/Actualizar"}
                </span>
                <InfoOutlinedIcon fontSize="small" />
              </Stack>
            }
          />
        </Tooltip>

        <FormControlLabel
          control={
            <Switch
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              disabled={loading}
            />
          }
          label={
            dryRun ? "Simular primero (recomendado)" : "Aplicar cambios a BD"
          }
        />
      </Stack>

      {modeReplace && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mt: 1, mb: 1 }}
        >
          <b>Reemplazar</b> eliminará las líneas actuales de cada billete (por{" "}
          <code>producto_id</code>) y las creará de nuevo con lo del Excel.
          Úsalo solo si quieres resincronizar completamente.
        </Alert>
      )}

      <Menu
        anchorEl={anchorRef.current}
        open={openMenu}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => setOpenInfo(true)}>
          <ListItemIcon>
            <InfoOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="¿Cómo funciona la carga?" />
        </MenuItem>
        <MenuItem onClick={onDownloadTemplate}>
          <ListItemIcon>
            <GetAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Descargar plantilla (XLSX)" />
        </MenuItem>
        <MenuItem onClick={onChooseFile}>
          <ListItemIcon>
            <CloudUploadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              dryRun ? "Subir Excel (simular)" : "Subir Excel (aplicar cambios)"
            }
          />
        </MenuItem>
      </Menu>

      <input
        ref={fileRef}
        type="file"
        hidden
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={onFileSelected}
      />

      {/* Dialogo de procesamiento */}
      <Dialog open={loading} fullWidth maxWidth="sm">
        <DialogTitle>Procesando archivo…</DialogTitle>
        <DialogContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            No cierres esta ventana hasta que termine.
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Dialogo info modos */}
      <Dialog
        open={openInfo}
        onClose={() => setOpenInfo(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>¿Cómo funciona la carga masiva?</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            <b>Agregar/Actualizar</b> (recomendado): no borra nada. Crea
            componentes que no existan y actualiza campos de los que ya existen.
            En billetes, inserta líneas nuevas o actualiza cantidades si ya
            existían.
          </Typography>
          <Typography gutterBottom>
            <b>Reemplazar</b>: para cada <code>producto_id</code> del Excel,
            borra todas las líneas actuales del billete y lo deja exactamente
            como indica el archivo.
          </Typography>
          <Typography gutterBottom>
            Puedes activar <b>Simular primero</b> para ver un reporte de lo que
            sucedería antes de escribir en la base de datos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInfo(false)}>Entendido</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación cuando es Reemplazar y no es dry-run */}
      <Dialog
        open={openConfirmReplace}
        onClose={() => setOpenConfirmReplace(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirmar reemplazo</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Estás por <b>eliminar</b> las líneas actuales de los billetes
            incluidos en el Excel y volver a crearlas.
          </Alert>
          <FormControlLabel
            control={
              <Checkbox
                checked={ackReplace}
                onChange={(e) => setAckReplace(e.target.checked)}
              />
            }
            label="Entiendo que esta acción es destructiva y deseo continuar."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmReplace(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!ackReplace}
            onClick={proceedUploadAfterConfirm}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reporte */}
      <Dialog
        open={openReport}
        onClose={() => setOpenReport(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Resultado de la carga</DialogTitle>
        <DialogContent dividers>
          {!report ? (
            <Typography>No hay datos.</Typography>
          ) : report.error ? (
            <>
              <Typography color="error" gutterBottom>
                {String(report.error)}
              </Typography>
              {report.raw && (
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(report.raw, null, 2)}
                </pre>
              )}
            </>
          ) : (
            <>
              <Stack spacing={1} sx={{ mb: 2 }}>
                {"dryRun" in report && (
                  <Alert severity={report.dryRun ? "info" : "success"}>
                    {report.dryRun
                      ? "Simulación completada. No se realizaron cambios en la BD."
                      : "Cambios aplicados correctamente."}
                  </Alert>
                )}
                <Typography>
                  Componentes insertados:{" "}
                  <b>{report.insertados_componentes || 0}</b>
                </Typography>
                <Typography>
                  Componentes actualizados:{" "}
                  <b>{report.actualizados_componentes || 0}</b>
                </Typography>
                <Typography>
                  Líneas de billete insertadas:{" "}
                  <b>{report.insertadas_lineas_billete || 0}</b>
                </Typography>
                <Typography>
                  Líneas de billete actualizadas:{" "}
                  <b>{report.actualizadas_lineas_billete || 0}</b>
                </Typography>
              </Stack>
              {Array.isArray(report.errores) && report.errores.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Errores ({report.errores.length})
                  </Typography>
                  <pre
                    style={{
                      maxHeight: 240,
                      overflow: "auto",
                      background: "#0b102055",
                      padding: 8,
                    }}
                  >
                    {JSON.stringify(report.errores, null, 2)}
                  </pre>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReport(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
