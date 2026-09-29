import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

import useAuthStore from "../../../store/authStore";

import {
  modalTitleSx,
  modalContentSx,
  modalActionsSx,
  modalPrimaryButtonSx,
  modalSecondaryButtonSx,
} from "../../common/modalStyles";

import {
  swalSuccess,
  swalError,
} from "../../../helpers/sweetAlert";

// ============================================================
// CONFIGURACIÓN
// ============================================================

const TIPOS_AVISO = [
  {
    value: "general",
    label: "General",
    icon: CampaignOutlinedIcon,
  },
  {
    value: "importante",
    label: "Importante",
    icon: WarningAmberOutlinedIcon,
  },
  {
    value: "novedad",
    label: "Novedad",
    icon: AutoAwesomeOutlinedIcon,
  },
  {
    value: "sistema",
    label: "Sistema",
    icon: InfoOutlinedIcon,
  },
  {
    value: "mantenimiento",
    label: "Mantenimiento",
    icon: BuildOutlinedIcon,
  },
];

const MAX_TITULO = 150;
const MAX_MENSAJE = 2000;

// ============================================================
// API
// ============================================================

const getApiUrl = () => {
  return process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;
};

// ============================================================
// CONVERTIR FECHA A datetime-local
// ============================================================

const convertirFechaParaInput = (fecha) => {
  if (!fecha) {
    return "";
  }

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (numero) =>
    String(numero).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

// ============================================================
// FECHA ACTUAL
// ============================================================

const obtenerFechaActualInput = () => {
  const date = new Date();

  const pad = (numero) =>
    String(numero).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

// ============================================================
// COMPONENTE
// ============================================================

const AvisoModal = ({
  open,
  aviso,
  onClose,
  onGuardado,
}) => {
  const { token } = useAuthStore();

  const apiUrl = getApiUrl();

  const esEdicion = Boolean(aviso?.id);

  // ==========================================================
  // FORMULARIO
  // ==========================================================

  const [tipo, setTipo] = useState("general");

  const [titulo, setTitulo] = useState("");

  const [mensaje, setMensaje] = useState("");

  const [fechaInicio, setFechaInicio] =
    useState("");

  const [
    tieneExpiracion,
    setTieneExpiracion,
  ] = useState(false);

  const [
    fechaExpiracion,
    setFechaExpiracion,
  ] = useState("");

  // ==========================================================
  // ERRORES
  // ==========================================================

  const [errores, setErrores] =
    useState({});

  // ==========================================================
  // GUARDANDO
  // ==========================================================

  const [guardando, setGuardando] =
    useState(false);

  // ==========================================================
  // CARGAR / REINICIAR FORMULARIO
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    // Limpiamos errores cada vez que
    // se abre el modal.
    setErrores({});

    // ========================================================
    // EDICIÓN
    // ========================================================

    if (aviso) {
      setTipo(
        aviso.tipo || "general",
      );

      setTitulo(
        aviso.titulo || "",
      );

      setMensaje(
        aviso.mensaje || "",
      );

      setFechaInicio(
        convertirFechaParaInput(
          aviso.fecha_inicio,
        ),
      );

      const existeExpiracion =
        Boolean(
          aviso.fecha_expiracion,
        );

      setTieneExpiracion(
        existeExpiracion,
      );

      setFechaExpiracion(
        existeExpiracion
          ? convertirFechaParaInput(
              aviso.fecha_expiracion,
            )
          : "",
      );

      return;
    }

    // ========================================================
    // NUEVO AVISO
    // ========================================================

    setTipo("general");

    setTitulo("");

    setMensaje("");

    setFechaInicio(
      obtenerFechaActualInput(),
    );

    setTieneExpiracion(false);

    setFechaExpiracion("");
  }, [open, aviso]);

  // ==========================================================
  // TIPO SELECCIONADO
  // ==========================================================

  const tipoSeleccionado = useMemo(
    () =>
      TIPOS_AVISO.find(
        (item) =>
          item.value === tipo,
      ) || TIPOS_AVISO[0],
    [tipo],
  );

  const IconoTipo =
    tipoSeleccionado.icon;

  // ==========================================================
  // LIMPIAR ERROR DE UN CAMPO
  // ==========================================================

  const limpiarError = (campo) => {
    setErrores((prev) => {
      if (!prev[campo]) {
        return prev;
      }

      return {
        ...prev,
        [campo]: "",
      };
    });
  };

  // ==========================================================
  // CERRAR
  // ==========================================================

  const handleClose = () => {
    if (guardando) {
      return;
    }

    onClose();
  };

  // ==========================================================
  // VALIDAR FORMULARIO
  // ==========================================================

  const validarFormulario = () => {
    const nuevosErrores = {};

    // ========================================================
    // TIPO
    // ========================================================

    if (!tipo) {
      nuevosErrores.tipo =
        "Campo obligatorio";
    }

    // ========================================================
    // TÍTULO
    // ========================================================

    if (!titulo.trim()) {
      nuevosErrores.titulo =
        "Campo obligatorio";
    }

    // ========================================================
    // MENSAJE
    // ========================================================

    if (!mensaje.trim()) {
      nuevosErrores.mensaje =
        "Campo obligatorio";
    }

    // ========================================================
    // FECHA DE INICIO
    // ========================================================

    if (!fechaInicio) {
      nuevosErrores.fechaInicio =
        "Campo obligatorio";
    } else {
      const inicio =
        new Date(fechaInicio);

      if (
        Number.isNaN(
          inicio.getTime(),
        )
      ) {
        nuevosErrores.fechaInicio =
          "Fecha inválida";
      }
    }

    // ========================================================
    // FECHA DE EXPIRACIÓN
    // ========================================================

    if (tieneExpiracion) {
      if (!fechaExpiracion) {
        nuevosErrores.fechaExpiracion =
          "Campo obligatorio";
      } else {
        const expiracion =
          new Date(
            fechaExpiracion,
          );

        if (
          Number.isNaN(
            expiracion.getTime(),
          )
        ) {
          nuevosErrores.fechaExpiracion =
            "Fecha inválida";
        } else if (fechaInicio) {
          const inicio =
            new Date(
              fechaInicio,
            );

          if (
            !Number.isNaN(
              inicio.getTime(),
            ) &&
            expiracion <= inicio
          ) {
            nuevosErrores.fechaExpiracion =
              "Debe ser posterior a la fecha de inicio";
          }
        }
      }
    }

    setErrores(
      nuevosErrores,
    );

    return (
      Object.keys(
        nuevosErrores,
      ).length === 0
    );
  };

  // ==========================================================
  // GUARDAR
  // ==========================================================

  const handleGuardar = async () => {
    if (guardando) {
      return;
    }

    // ========================================================
    // VALIDACIÓN MUI
    // ========================================================

    if (!validarFormulario()) {
      return;
    }

    // ========================================================
    // PAYLOAD
    // ========================================================

    const payload = {
      tipo,

      titulo:
        titulo.trim(),

      mensaje:
        mensaje.trim(),

      fecha_inicio:
        fechaInicio,

      fecha_expiracion:
        tieneExpiracion
          ? fechaExpiracion
          : null,
    };

    try {
      setGuardando(true);

      // ======================================================
      // EDITAR
      // ======================================================

      if (esEdicion) {
        await axios.put(
          `${apiUrl}/avisos/${aviso.id}`,
          payload,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      }

      // ======================================================
      // CREAR
      // ======================================================

      else {
        await axios.post(
          `${apiUrl}/avisos`,
          payload,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      }

      // ======================================================
      // ÉXITO
      // ======================================================

      await swalSuccess(
        esEdicion
          ? "Aviso actualizado"
          : "Aviso creado",

        esEdicion
          ? "Los cambios fueron guardados correctamente."
          : "El aviso fue creado correctamente.",
      );

      if (
        typeof onGuardado ===
        "function"
      ) {
        await onGuardado();
      }
    } catch (error) {
      console.error(
        "[Avisos] Error guardando aviso:",
        error,
      );

      await swalError(
        "No fue posible guardar",
        error.response?.data
          ?.message ||
          "Ocurrió un error al guardar el aviso.",
      );
    } finally {
      setGuardando(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      {/* ====================================================
          HEADER
      ===================================================== */}

      <DialogTitle
        sx={modalTitleSx}
      >
        <Typography
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1a237e",
          }}
        >
          {esEdicion
            ? "Editar aviso"
            : "Nuevo aviso"}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#607d8b",
          }}
        >
          {esEdicion
            ? "Actualiza la información del aviso seleccionado."
            : "Crea un nuevo comunicado para los usuarios de Aphelios."}
        </Typography>
      </DialogTitle>

      {/* ====================================================
          CONTENIDO
      ===================================================== */}

      <DialogContent
        sx={modalContentSx}
      >
        {/* ==================================================
            INDICACIÓN
        =================================================== */}

        <Typography
          variant="body2"
          sx={{
            mb: 1,
            color: "#607d8b",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          Los campos marcados con * son
          obligatorios.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* =================================================
              TIPO DE AVISO
          ================================================== */}

          <FormControl
            fullWidth
            margin="normal"
            required
            error={
              Boolean(
                errores.tipo,
              )
            }
          >
            <InputLabel>
              Tipo de aviso
            </InputLabel>

            <Select
              value={tipo}
              label="Tipo de aviso"
              onChange={(e) => {
                setTipo(
                  e.target.value,
                );

                limpiarError(
                  "tipo",
                );
              }}
              disabled={guardando}
            >
              {TIPOS_AVISO.map(
                (item) => {
                  const Icono =
                    item.icon;

                  return (
                    <MenuItem
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Icono
                          fontSize="small"
                        />

                        <span>
                          {item.label}
                        </span>
                      </Stack>
                    </MenuItem>
                  );
                },
              )}
            </Select>

            {errores.tipo && (
              <FormHelperText>
                {errores.tipo}
              </FormHelperText>
            )}
          </FormControl>

          {/* =================================================
              TÍTULO
          ================================================== */}

          <TextField
            label="Título"
            value={titulo}
            onChange={(e) => {
              setTitulo(
                e.target.value.slice(
                  0,
                  MAX_TITULO,
                ),
              );

              limpiarError(
                "titulo",
              );
            }}
            fullWidth
            required
            margin="normal"
            disabled={guardando}
            error={
              Boolean(
                errores.titulo,
              )
            }
            helperText={
              errores.titulo
                ? `${errores.titulo} · ${titulo.length}/${MAX_TITULO} caracteres`
                : `${titulo.length}/${MAX_TITULO} caracteres`
            }
            inputProps={{
              maxLength:
                MAX_TITULO,
            }}
          />

          {/* =================================================
              MENSAJE
          ================================================== */}

          <TextField
            label="Mensaje"
            value={mensaje}
            onChange={(e) => {
              setMensaje(
                e.target.value.slice(
                  0,
                  MAX_MENSAJE,
                ),
              );

              limpiarError(
                "mensaje",
              );
            }}
            fullWidth
            required
            multiline
            minRows={3}
            maxRows={6}
            margin="normal"
            disabled={guardando}
            error={
              Boolean(
                errores.mensaje,
              )
            }
            helperText={
              errores.mensaje
                ? `${errores.mensaje} · ${mensaje.length}/${MAX_MENSAJE} caracteres`
                : `${mensaje.length}/${MAX_MENSAJE} caracteres`
            }
            inputProps={{
              maxLength:
                MAX_MENSAJE,
            }}
          />

          {/* =================================================
              VISTA DEL TIPO
          ================================================== */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 1,
              mb: 1,
            }}
          >
            <IconoTipo
              fontSize="small"
            />

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Este aviso se mostrará
              como{" "}
              <strong>
                {
                  tipoSeleccionado.label
                }
              </strong>
              .
            </Typography>
          </Box>

          {/* =================================================
              FECHA DE INICIO
          ================================================== */}

          <TextField
            label="Fecha de inicio"
            type="datetime-local"
            value={fechaInicio}
            onChange={(e) => {
              setFechaInicio(
                e.target.value,
              );

              // La fecha de inicio puede
              // afectar también la validación
              // de expiración.
              setErrores(
                (prev) => ({
                  ...prev,
                  fechaInicio: "",
                  fechaExpiracion:
                    "",
                }),
              );
            }}
            fullWidth
            required
            margin="normal"
            disabled={guardando}
            error={
              Boolean(
                errores.fechaInicio,
              )
            }
            helperText={
              errores.fechaInicio ||
              ""
            }
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* =================================================
              EXPIRACIÓN
          ================================================== */}

          <Box
            sx={{
              mt: 1,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    tieneExpiracion
                  }
                  onChange={(e) => {
                    const checked =
                      e.target
                        .checked;

                    setTieneExpiracion(
                      checked,
                    );

                    // Si se desactiva,
                    // limpiamos tanto la
                    // fecha como su error.
                    if (
                      !checked
                    ) {
                      setFechaExpiracion(
                        "",
                      );

                      limpiarError(
                        "fechaExpiracion",
                      );
                    }
                  }}
                  disabled={
                    guardando
                  }
                />
              }
              label="Este aviso tiene fecha de expiración"
            />

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{
                ml: 0.25,
              }}
            >
              Opcional. Si no
              seleccionas una fecha de
              expiración, el aviso
              permanecerá vigente hasta
              que sea desactivado.
            </Typography>
          </Box>

          {/* =================================================
              FECHA DE EXPIRACIÓN
          ================================================== */}

          {tieneExpiracion && (
            <TextField
              label="Fecha de expiración"
              type="datetime-local"
              value={
                fechaExpiracion
              }
              onChange={(e) => {
                setFechaExpiracion(
                  e.target.value,
                );

                limpiarError(
                  "fechaExpiracion",
                );
              }}
              fullWidth
              required
              margin="normal"
              disabled={guardando}
              error={
                Boolean(
                  errores.fechaExpiracion,
                )
              }
              helperText={
                errores.fechaExpiracion ||
                "Debe ser posterior a la fecha de inicio."
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}
        </Box>
      </DialogContent>

      {/* ====================================================
          ACCIONES
      ===================================================== */}

      <DialogActions
        sx={modalActionsSx}
      >
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={guardando}
          sx={
            modalSecondaryButtonSx
          }
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={
            handleGuardar
          }
          disabled={guardando}
          sx={
            modalPrimaryButtonSx
          }
        >
          {guardando
            ? "Guardando..."
            : esEdicion
              ? "Guardar cambios"
              : "Crear aviso"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvisoModal;