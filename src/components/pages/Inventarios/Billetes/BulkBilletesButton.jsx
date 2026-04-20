import { useRef, useState } from "react";
import {
  Box,
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
  const [modeReplace, setModeReplace] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [report, setReport] = useState(null);
  const [openReport, setOpenReport] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [openConfirmReplace, setOpenConfirmReplace] = useState(false);
  const [ackReplace, setAckReplace] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  const handleOpenMenu = () => setOpenMenu(true);
  const handleCloseMenu = () => setOpenMenu(false);

  const onDownloadTemplate = async () => {
    handleCloseMenu();

    try {
      const headers = {};
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await axios.get(`${apiUrl}/billetes/descargar/template`, {
        responseType: "blob",
        headers,
      });

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
      console.error(e);
      setReport({ error: "No se pudo descargar la plantilla." });
      setOpenReport(true);
    }
  };

  const onChooseFile = () => {
    handleCloseMenu();
    if (fileRef.current) fileRef.current.value = null;
    fileRef.current?.click();
  };

  const uploadFile = async (file) => {
    setLoading(true);
    setReport(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const mode = modeReplace ? "replace" : "append";

      const res = await axios.post(
        `${apiUrl}/billetes/cargar/excel?mode=${mode}&dryRun=${dryRun ? 1 : 0}`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
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

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setReport({ error: "Archivo demasiado grande (máx 10MB)" });
      setOpenReport(true);
      return;
    }

    if (modeReplace && !dryRun) {
      setPendingFile(file);
      setAckReplace(false);
      setOpenConfirmReplace(true);
      return;
    }

    await uploadFile(file);
  };

  const proceedUploadAfterConfirm = async () => {
    setOpenConfirmReplace(false);

    if (!pendingFile) return;

    const file = pendingFile;
    setPendingFile(null);
    setAckReplace(false);

    await uploadFile(file);
  };

  const cancelReplace = () => {
    setOpenConfirmReplace(false);
    setPendingFile(null);
    setAckReplace(false);
  };

  return (
    <>
      {/* CONTENEDOR GENERAL */}
      <Box sx={{ width: "100%" }}>
        {/* FILA CENTRADA DE CONTROLES */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 1.5,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ flexWrap: "wrap", rowGap: 1 }}
          >
            <Button
              ref={anchorRef}
              variant="contained"
              size="small"
              endIcon={<MoreHorizIcon />}
              onClick={handleOpenMenu}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                px: 2,
                py: 0.8,
                height: "36px",
              }}
            >
              CARGA MASIVA
            </Button>

            <Tooltip
              title={
                <div style={{ maxWidth: 320 }}>
                  <b>Agregar/Actualizar:</b> hace upsert de componentes y
                  suma/actualiza líneas de billetes.
                  <br />
                  <b>Reemplazar:</b> borra las líneas del billete por
                  producto_id y recrea exactamente lo del Excel.
                </div>
              }
              arrow
            >
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    checked={modeReplace}
                    onChange={(e) => setModeReplace(e.target.checked)}
                    disabled={loading}
                    inputProps={{ "aria-label": "Modo de carga" }}
                    size="small"
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
              sx={{ m: 0 }}
              control={
                <Switch
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  disabled={loading}
                  size="small"
                />
              }
              label={
                dryRun
                  ? "Simular primero (recomendado)"
                  : "Aplicar cambios a BD"
              }
            />
          </Stack>
        </Box>

        {/* ALERTAS DEBAJO */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "1120px",
            mx: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {modeReplace && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              variant="outlined"
            >
              <b>Reemplazar</b> eliminará las líneas actuales de cada billete
              (por <code>producto_id</code>) y las creará de nuevo con lo del
              Excel. Úsalo solo si quieres resincronizar completamente.
            </Alert>
          )}

          {dryRun && (
            <Alert severity="info" variant="outlined">
              <b>Modo simulación activado.</b> El archivo solo se validará y se
              mostrará un reporte de lo que sucedería, pero{" "}
              <b>no se guardará ningún cambio</b> en la base de datos.
            </Alert>
          )}
        </Box>
      </Box>

      <Menu
        anchorEl={anchorRef.current}
        open={openMenu}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setOpenInfo(true);
          }}
        >
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

      <Dialog open={loading} fullWidth maxWidth="sm">
        <DialogTitle>Procesando archivo…</DialogTitle>
        <DialogContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            No cierres esta ventana hasta que termine.
          </Typography>
        </DialogContent>
      </Dialog>

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

      <Dialog
        open={openConfirmReplace}
        onClose={cancelReplace}
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
          <Button onClick={cancelReplace}>Cancelar</Button>
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