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
  const [errorExcel, setErrorExcel] = useState(null);

  const hasErrors = report?.errores?.length > 0;
  const isSimulation = report?.dryRun;

  let alertType = "success";
  let alertMessage = "Cambios aplicados correctamente";

  if (isSimulation) {
    alertType = "info";
    alertMessage = "Simulación completada. No se realizaron cambios en la BD.";
  } else if (hasErrors) {
    alertType = "warning";
    alertMessage = "Carga aplicada con errores. Revisa los detalles.";
  }

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

  const downloadErrorExcel = () => {
    if (!errorExcel?.base64) return;

    const byteCharacters = atob(errorExcel.base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([new Uint8Array(byteNumbers)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = errorExcel.filename || "errores_billetes.xlsx";

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const uploadFile = async (file) => {
    setLoading(true);
    setReport(null);
    setErrorExcel(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const mode = modeReplace ? "replace" : "append";

      const res = await axios.post(
        `${apiUrl}/billetes/cargar/excel?mode=${mode}&dryRun=${dryRun ? 1 : 0}`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setReport(res.data?.report || res.data);

      setErrorExcel({
        base64: res.data?.errorExcelBase64 || null,
        filename: res.data?.errorExcelFilename || "errores_billetes.xlsx",
      });

      setOpenReport(true);

      if (!dryRun) {
        onSuccess?.();
      }
    } catch (e) {
      console.error(e);

      const responseData = e?.response?.data;
      const msg =
        responseData?.message || e?.message || "Error al subir el archivo.";

      setReport({
        error: msg,
        raw: responseData,
        errores: responseData?.report?.errores || responseData?.errores || [],
      });

      setErrorExcel({
        base64: responseData?.errorExcelBase64 || null,
        filename: responseData?.errorExcelFilename || "errores_billetes.xlsx",
      });

      setOpenReport(true);
    } finally {
      setLoading(false);
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

  const errores = Array.isArray(report?.errores)
    ? report.errores
    : Array.isArray(report?.raw?.report?.errores)
      ? report.raw.report.errores
      : [];

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
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
                  actualiza líneas de billetes.
                  <br />
                  <b>Reemplazar:</b> borra líneas por producto_id y tipo, y las
                  recrea con el Excel.
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
              <b>Reemplazar</b> eliminará líneas actuales por{" "}
              <code>producto_id</code> y <code>tipo</code>, y las creará de
              nuevo con lo del Excel.
            </Alert>
          )}

          {dryRun && (
            <Alert severity="info" variant="outlined">
              <b>Modo simulación activado.</b> El archivo solo se validará y{" "}
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
            <b>Agregar/Actualizar</b>: crea componentes que no existan y
            actualiza los existentes. En billetes, inserta o actualiza cantidad.
          </Typography>

          <Typography gutterBottom>
            <b>Reemplazar</b>: para cada <code>producto_id</code> y{" "}
            <code>tipo</code> del Excel, elimina líneas actuales y las recrea.
          </Typography>

          <Typography gutterBottom>
            <b>Simular primero</b>: valida y muestra qué pasaría sin guardar
            cambios.
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
            Estás por <b>eliminar</b> las líneas actuales incluidas en el Excel
            y volver a crearlas.
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
            <Alert severity="error">{String(report.error)}</Alert>
          ) : (
            <>
              <Stack spacing={1} sx={{ mb: 2 }}>
                {"dryRun" in report && (
                  <Alert severity={alertType}>{alertMessage}</Alert>
                )}

                <Typography color="success.main">
                  Componentes insertados:{" "}
                  <b>{report.insertados_componentes || 0}</b>
                </Typography>

                <Typography color="warning.main">
                  Componentes actualizados:{" "}
                  <b>{report.actualizados_componentes || 0}</b>
                </Typography>

                <Typography color="primary.main">
                  Líneas de billete insertadas:{" "}
                  <b>{report.insertadas_lineas_billete || 0}</b>
                </Typography>

                <Typography color="info.main">
                  Líneas de billete actualizadas:{" "}
                  <b>{report.actualizadas_lineas_billete || 0}</b>
                </Typography>
              </Stack>
            </>
          )}

          {errores.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 2 }}>
                Errores ({errores.length})
              </Typography>

              <Box
                sx={{
                  maxHeight: 280,
                  overflow: "auto",
                  border: "1px solid #ddd",
                  borderRadius: 1,
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th style={{ padding: 8, textAlign: "left" }}>Hoja</th>
                      <th style={{ padding: 8, textAlign: "left" }}>Fila</th>
                      <th style={{ padding: 8, textAlign: "left" }}>Campo</th>
                      <th style={{ padding: 8, textAlign: "left" }}>Valor</th>
                      <th style={{ padding: 8, textAlign: "left" }}>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errores.map((e, i) => (
                      <tr key={`${e.hoja}-${e.fila}-${i}`}>
                        <td style={{ padding: 8 }}>{e.hoja}</td>
                        <td style={{ padding: 8 }}>{e.fila}</td>
                        <td style={{ padding: 8 }}>{e.campo}</td>
                        <td style={{ padding: 8 }}>{String(e.valor ?? "")}</td>
                        <td style={{ padding: 8 }}>{e.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {errorExcel?.base64 && (
            <Button
              variant="contained"
              color="warning"
              onClick={downloadErrorExcel}
            >
              Descargar Excel de errores
            </Button>
          )}

          <Button onClick={() => setOpenReport(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
