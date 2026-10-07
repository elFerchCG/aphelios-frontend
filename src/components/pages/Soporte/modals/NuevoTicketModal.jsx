import React, { useEffect, useMemo, useState } from "react";

import axios from "axios";

import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import { swalError, swalSuccess } from "../../../../helpers/sweetAlert";

const FORM_INICIAL = {
  categoria: null,
  area: null,
  asunto: "",
  intento: "",
  ocurrido: "",
  esperado: "",
  impacto: "",
  detalleImpacto: "",
};

const ERRORES_INICIALES = {
  categoria: "",
  area: "",
  asunto: "",
  intento: "",
  ocurrido: "",
  esperado: "",
  impacto: "",
  detalleImpacto: "",
};

const MAX_ARCHIVOS = 3;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_IMAGEN_BYTES = 8 * 1024 * 1024;
const MAX_PDF_BYTES = 3 * 1024 * 1024;

const formatearTamanio = (bytes) => {
  if (!bytes) return "0 KB";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const NuevoTicketModal = ({
  open,
  onClose,
  categorias = [],
  areas = [],
  onTicketCreado,
}) => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const [form, setForm] = useState(FORM_INICIAL);

  const [errores, setErrores] = useState(ERRORES_INICIALES);

  const [guardando, setGuardando] = useState(false);

  const [archivos, setArchivos] = useState([]);
  const [errorArchivos, setErrorArchivos] = useState("");
  const [estadoEnvio, setEstadoEnvio] = useState("");

  // =========================================================
  // RESET AL ABRIR
  // =========================================================

  useEffect(() => {
    if (!open) return;

    setForm(FORM_INICIAL);
    setErrores(ERRORES_INICIALES);
    setArchivos([]);
    setErrorArchivos("");
    setEstadoEnvio("");
    setGuardando(false);
  }, [open]);

  // =========================================================
  // ÁREAS SELECCIONABLES
  //
  // Si ruta === null, normalmente se trata de un agrupador:
  //
  // Publicaciones
  // Inventario
  // Marketing
  // Kaizen
  //
  // El usuario debería reportar sobre una pantalla concreta.
  // =========================================================

  const areasSeleccionables = useMemo(
    () => areas.filter((area) => area.ruta && String(area.ruta).trim() !== ""),
    [areas],
  );

  // =========================================================
  // CAMBIAR CAMPO
  // =========================================================

  const cambiarCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setErrores((prev) => ({
      ...prev,
      [campo]: "",
    }));
  };

  // =========================================================
  // VALIDACIÓN
  // =========================================================

  const validarFormulario = () => {
    const nuevosErrores = {
      ...ERRORES_INICIALES,
    };

    if (!form.categoria) {
      nuevosErrores.categoria = "Selecciona una categoría.";
    }

    if (!form.area) {
      nuevosErrores.area = "Selecciona un área.";
    }

    if (!form.asunto.trim()) {
      nuevosErrores.asunto = "El asunto es obligatorio.";
    } else if (form.asunto.trim().length > 180) {
      nuevosErrores.asunto = "Máximo 180 caracteres.";
    }

    if (!form.intento.trim()) {
      nuevosErrores.intento = "Indica qué estabas intentando hacer.";
    }

    if (!form.ocurrido.trim()) {
      nuevosErrores.ocurrido = "Describe qué ocurrió.";
    }

    if (!form.esperado.trim()) {
      nuevosErrores.esperado = "Indica qué esperabas que ocurriera.";
    }

    if (!form.impacto) {
      nuevosErrores.impacto = "Selecciona el impacto.";
    }

    if (form.impacto === "general" && !form.detalleImpacto.trim()) {
      nuevosErrores.detalleImpacto = "Indica a quiénes más está afectando.";
    }

    if (form.detalleImpacto.length > 500) {
      nuevosErrores.detalleImpacto = "Máximo 500 caracteres.";
    }

    // -----------------------------------------
    // Validar descripción final
    // -----------------------------------------

    const descripcion = construirDescripcion();

    if (descripcion.length > 10000) {
      nuevosErrores.ocurrido =
        "La descripción completa del ticket es demasiado larga.";
    }

    setErrores(nuevosErrores);

    return !Object.values(nuevosErrores).some(Boolean);
  };

  // =========================================================
  // CONSTRUIR DESCRIPCIÓN
  // =========================================================

  const construirDescripcion = () => {
    return [
      "¿Qué estabas intentando hacer?",
      form.intento.trim(),

      "",

      "¿Qué ocurrió?",
      form.ocurrido.trim(),

      "",

      "¿Qué esperabas que ocurriera?",
      form.esperado.trim(),
    ].join("\n");
  };

  const handleSeleccionarArchivos = (event) => {
    const seleccionados = Array.from(event.target.files || []);

    // Permite volver a seleccionar el mismo archivo
    event.target.value = "";

    if (seleccionados.length === 0) {
      return;
    }

    const total = archivos.length + seleccionados.length;

    if (total > MAX_ARCHIVOS) {
      setErrorArchivos(`Puedes adjuntar máximo ${MAX_ARCHIVOS} archivos.`);
      return;
    }

    for (const archivo of seleccionados) {
      if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        setErrorArchivos(
          `"${archivo.name}" no es un tipo de archivo permitido.`,
        );
        return;
      }

      if (archivo.type === "application/pdf" && archivo.size > MAX_PDF_BYTES) {
        setErrorArchivos(
          `"${archivo.name}" supera el límite de 3 MB para PDF.`,
        );
        return;
      }

      if (
        archivo.type.startsWith("image/") &&
        archivo.size > MAX_IMAGEN_BYTES
      ) {
        setErrorArchivos(
          `"${archivo.name}" supera el límite de 8 MB para imágenes.`,
        );
        return;
      }
    }

    // Evitar duplicados
    const nuevos = seleccionados.filter(
      (nuevo) =>
        !archivos.some(
          (actual) =>
            actual.name === nuevo.name &&
            actual.size === nuevo.size &&
            actual.lastModified === nuevo.lastModified,
        ),
    );

    setArchivos((prev) => [...prev, ...nuevos]);

    setErrorArchivos("");
  };

  const handleEliminarArchivo = (indice) => {
    if (guardando) return;

    setArchivos((prev) => prev.filter((_, index) => index !== indice));

    setErrorArchivos("");
  };

  // =========================================================
  // CREAR TICKET
  // =========================================================

  const handleCrearTicket = async () => {
    if (!validarFormulario()) {
      return;
    }

    let ticketCreado = null;

    try {
      setGuardando(true);
      setEstadoEnvio("Creando ticket...");

      const token = localStorage.getItem("token");

      const descripcion = construirDescripcion();

      const payload = {
        categoriaId: Number(form.categoria.id),

        areaId: Number(form.area.id),

        asunto: form.asunto.trim(),

        descripcion,

        impacto: form.impacto,

        detalleImpacto:
          form.impacto === "general" ? form.detalleImpacto.trim() : "",

        rutaOrigen: window.location.pathname || "",
      };

      // ======================================================
      // 1. CREAR TICKET
      // ======================================================

      const response = await axios.post(`${apiUrl}/tickets`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      ticketCreado = response.data?.ticket;

      if (!ticketCreado?.id) {
        throw new Error(
          "El servidor creó el ticket pero no devolvió su identificador.",
        );
      }

      // ======================================================
      // 2. SUBIR ADJUNTOS
      // ======================================================

      if (archivos.length > 0) {
        setEstadoEnvio("Subiendo adjuntos...");

        try {
          await subirArchivosTicket(ticketCreado.id, token);
        } catch (errorAdjuntos) {
          console.error("Error subiendo adjuntos:", errorAdjuntos);

          /*
           * MUY IMPORTANTE:
           *
           * El ticket YA existe.
           * No debemos decirle al usuario que
           * falló la creación del ticket.
           */

          await swalError(
            "Ticket creado con advertencia",
            `El ticket ${ticketCreado.folio} fue creado correctamente, pero no se pudieron subir uno o más adjuntos.`,
          );

          onClose?.();

          await onTicketCreado?.(ticketCreado);

          return;
        }
      }

      // ======================================================
      // 3. TODO CORRECTO
      // ======================================================

      await swalSuccess(
        "Ticket creado",
        archivos.length > 0
          ? `Tu ticket ${ticketCreado.folio} y sus adjuntos fueron enviados correctamente.`
          : `Tu ticket ${ticketCreado.folio} fue creado correctamente.`,
      );

      onClose?.();

      await onTicketCreado?.(ticketCreado);
    } catch (error) {
      console.error("Error creando ticket:", error);

      const mensaje =
        error.response?.data?.message ||
        error.message ||
        "No se pudo crear el ticket.";

      await swalError(
        "Error",
        typeof mensaje === "string" ? mensaje : "No se pudo crear el ticket.",
      );
    } finally {
      setEstadoEnvio("");
      setGuardando(false);
    }
  };

  const subirArchivosTicket = async (ticketId, token) => {
    if (archivos.length === 0) {
      return null;
    }

    const formData = new FormData();

    archivos.forEach((archivo) => {
      formData.append("archivos", archivo);
    });

    const response = await axios.post(
      `${apiUrl}/tickets/${ticketId}/adjuntos`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  };

  // =========================================================
  // CERRAR
  // =========================================================

  const handleCerrar = () => {
    if (guardando) return;

    onClose?.();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Dialog
      open={open}
      onClose={handleCerrar}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <DialogTitle
        sx={{
          px: 3,
          py: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
            }}
          >
            <ConfirmationNumberOutlinedIcon
              color="primary"
              sx={{
                mt: 0.25,
                fontSize: 30,
              }}
            />

            <Box>
              <Typography variant="h6" fontWeight={700}>
                Nuevo ticket de soporte
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.25,
                }}
              >
                Cuéntanos qué ocurrió para que podamos ayudarte.
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={handleCerrar} disabled={guardando} size="small">
            <CloseOutlinedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <DialogContent
        sx={{
          px: 3,
          py: 3,
        }}
      >
        <Stack spacing={3}>
          {/* =================================================
              CATEGORÍA + ÁREA
          ================================================= */}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            <Autocomplete
              options={categorias}
              value={form.categoria}
              disabled={guardando}
              onChange={(_event, value) => {
                cambiarCampo("categoria", value);
              }}
              getOptionLabel={(option) => option?.nombre || ""}
              isOptionEqualToValue={(option, value) =>
                Number(option.id) === Number(value.id)
              }
              noOptionsText="No se encontraron categorías"
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Categoría"
                  placeholder="Buscar categoría..."
                  error={Boolean(errores.categoria)}
                  helperText={errores.categoria}
                />
              )}
            />

            <Autocomplete
              options={areasSeleccionables}
              value={form.area}
              disabled={guardando}
              onChange={(_event, value) => {
                cambiarCampo("area", value);
              }}
              getOptionLabel={(option) =>
                option?.nombre_completo || option?.nombre || ""
              }
              isOptionEqualToValue={(option, value) =>
                Number(option.id) === Number(value.id)
              }
              noOptionsText="No se encontraron áreas"
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Área"
                  placeholder="Buscar área..."
                  error={Boolean(errores.area)}
                  helperText={errores.area}
                />
              )}
            />
          </Box>

          {/* =================================================
              ASUNTO
          ================================================= */}

          <TextField
            required
            fullWidth
            label="Asunto"
            placeholder="Ej. No puedo registrar una orden"
            value={form.asunto}
            disabled={guardando}
            onChange={(event) => cambiarCampo("asunto", event.target.value)}
            error={Boolean(errores.asunto)}
            helperText={
              errores.asunto || `${form.asunto.length}/180 caracteres`
            }
            inputProps={{
              maxLength: 180,
            }}
          />

          {/* =================================================
              INTENTO
          ================================================= */}

          <TextField
            required
            fullWidth
            multiline
            minRows={3}
            label="¿Qué estabas intentando hacer?"
            placeholder="Describe brevemente la acción que estabas realizando."
            value={form.intento}
            disabled={guardando}
            onChange={(event) => cambiarCampo("intento", event.target.value)}
            error={Boolean(errores.intento)}
            helperText={errores.intento}
          />

          {/* =================================================
              OCURRIDO
          ================================================= */}

          <TextField
            required
            fullWidth
            multiline
            minRows={4}
            label="¿Qué ocurrió?"
            placeholder="Describe el problema, mensaje de error o comportamiento que observaste."
            value={form.ocurrido}
            disabled={guardando}
            onChange={(event) => cambiarCampo("ocurrido", event.target.value)}
            error={Boolean(errores.ocurrido)}
            helperText={errores.ocurrido}
          />

          {/* =================================================
              ESPERADO
          ================================================= */}

          <TextField
            required
            fullWidth
            multiline
            minRows={3}
            label="¿Qué esperabas que ocurriera?"
            placeholder="Describe cuál era el resultado esperado."
            value={form.esperado}
            disabled={guardando}
            onChange={(event) => cambiarCampo("esperado", event.target.value)}
            error={Boolean(errores.esperado)}
            helperText={errores.esperado}
          />

          <Divider />

          <Divider />

          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Adjuntos
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Puedes agregar capturas de pantalla o documentos que ayuden a
              entender el problema.
            </Typography>

            <Button
              component="label"
              variant="outlined"
              startIcon={<AttachFileOutlinedIcon />}
              disabled={guardando || archivos.length >= MAX_ARCHIVOS}
              sx={{
                textTransform: "none",
              }}
            >
              Agregar archivos
              <input
                hidden
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleSeleccionarArchivos}
              />
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 1,
              }}
            >
              JPG, PNG, WebP o PDF · Máximo 3 archivos · Imágenes hasta 8 MB ·
              PDF hasta 3 MB
            </Typography>

            {errorArchivos && (
              <Typography
                variant="caption"
                color="error"
                sx={{
                  display: "block",
                  mt: 1,
                }}
              >
                {errorArchivos}
              </Typography>
            )}

            {archivos.length > 0 && (
              <Stack spacing={1} sx={{ mt: 2 }}>
                {archivos.map((archivo, index) => {
                  const esImagen = archivo.type.startsWith("image/");

                  return (
                    <Box
                      key={`${archivo.name}-${archivo.size}-${archivo.lastModified}`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 1.5,
                        py: 1.25,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        bgcolor: "background.paper",
                      }}
                    >
                      {esImagen ? (
                        <ImageOutlinedIcon color="primary" />
                      ) : (
                        <InsertDriveFileOutlinedIcon color="primary" />
                      )}

                      <Box
                        sx={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {archivo.name}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {formatearTamanio(archivo.size)}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        variant="outlined"
                        label={esImagen ? "Imagen" : "PDF"}
                      />

                      <IconButton
                        size="small"
                        color="error"
                        disabled={guardando}
                        onClick={() => handleEliminarArchivo(index)}
                        title="Quitar archivo"
                      >
                        <DeleteOutlineOutlinedIcon />
                      </IconButton>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* =================================================
              IMPACTO
          ================================================= */}

          <FormControl required error={Boolean(errores.impacto)}>
            <FormLabel>¿Qué tanto te está afectando?</FormLabel>

            <RadioGroup
              row
              value={form.impacto}
              onChange={(event) => cambiarCampo("impacto", event.target.value)}
              sx={{
                mt: 1,
                gap: {
                  xs: 0,
                  md: 2,
                },
              }}
            >
              <FormControlLabel
                value="bajo"
                control={<Radio />}
                label="Bajo"
                disabled={guardando}
              />

              <FormControlLabel
                value="medio"
                control={<Radio />}
                label="Medio"
                disabled={guardando}
              />

              <FormControlLabel
                value="alto"
                control={<Radio />}
                label="Alto"
                disabled={guardando}
              />

              <FormControlLabel
                value="general"
                control={<Radio />}
                label="General"
                disabled={guardando}
              />
            </RadioGroup>

            {errores.impacto && (
              <FormHelperText>{errores.impacto}</FormHelperText>
            )}

            {!errores.impacto && (
              <FormHelperText>
                Bajo: puedes continuar trabajando · Medio: dificulta tu trabajo
                · Alto: te impide continuar · General: afecta a varias personas.
              </FormHelperText>
            )}
          </FormControl>

          {/* =================================================
              IMPACTO GENERAL
          ================================================= */}

          {form.impacto === "general" && (
            <TextField
              required
              fullWidth
              multiline
              minRows={2}
              label="¿A quiénes más está afectando?"
              placeholder="Ej. Todo el equipo de almacén no puede registrar órdenes."
              value={form.detalleImpacto}
              disabled={guardando}
              onChange={(event) =>
                cambiarCampo("detalleImpacto", event.target.value)
              }
              error={Boolean(errores.detalleImpacto)}
              helperText={
                errores.detalleImpacto ||
                `${form.detalleImpacto.length}/500 caracteres`
              }
              inputProps={{
                maxLength: 500,
              }}
            />
          )}
        </Stack>
      </DialogContent>

      <Divider />

      {/* =====================================================
          ACCIONES
      ===================================================== */}

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1,
        }}
      >
        <Button onClick={handleCerrar} disabled={guardando} color="inherit">
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleCrearTicket}
          disabled={guardando}
          startIcon={
            guardando ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <ConfirmationNumberOutlinedIcon />
            )
          }
        >
          {guardando ? estadoEnvio || "Procesando..." : "Crear ticket"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevoTicketModal;
