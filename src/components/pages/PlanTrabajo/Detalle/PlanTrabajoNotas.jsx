import React, { useEffect, useMemo, useState } from "react";

import axios from "axios";

import {
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import { modalPrimaryButtonSx } from "../../../common/modalStyles";

import { swalSuccess } from "../../../../helpers/sweetAlert";
import { handleApiError } from "../../../../helpers/apiErrorHandler";

// =========================================================
// COMPONENTE
// =========================================================

const PlanTrabajoNotas = ({
  tareaId,
  notasIniciales = "",
  onUpdated,
}) => {
  // =========================================================
  // CONFIG
  // =========================================================

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const token = localStorage.getItem("token");

  // =========================================================
  // STATES
  // =========================================================

  const [notas, setNotas] = useState(notasIniciales || "");

  const [notasOriginales, setNotasOriginales] = useState(
    notasIniciales || "",
  );

  const [guardando, setGuardando] = useState(false);

  // =========================================================
  // SINCRONIZAR CUANDO CAMBIA LA TAREA
  // =========================================================

  useEffect(() => {
    const valor = notasIniciales || "";

    setNotas(valor);
    setNotasOriginales(valor);
  }, [notasIniciales, tareaId]);

  // =========================================================
  // ¿HAY CAMBIOS?
  // =========================================================

  const hayCambios = useMemo(() => {
    return notas.trim() !== notasOriginales.trim();
  }, [notas, notasOriginales]);

  // =========================================================
  // GUARDAR
  // =========================================================

  const handleGuardar = async () => {
    if (!tareaId) {
      return;
    }

    const notasLimpias = notas.trim();

    if (notasLimpias.length > 5000) {
      return;
    }

    if (!hayCambios) {
      return;
    }

    try {
      setGuardando(true);

      await axios.patch(
        `${apiUrl}/planTrabajo/tareas/${tareaId}/notas`,
        {
          notas: notasLimpias,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setNotasOriginales(notasLimpias);
      setNotas(notasLimpias);

      swalSuccess(
        "Notas actualizadas",
        "Las notas de la tarea se actualizaron correctamente.",
      );

      if (onUpdated) {
        await onUpdated();
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          "No se pudieron actualizar las notas.",
        warningTitle:
          "No se pudieron guardar las notas",
      });
    } finally {
      setGuardando(false);
    }
  };

  // =========================================================
  // CANCELAR CAMBIOS
  // =========================================================

  const handleCancelar = () => {
    setNotas(notasOriginales);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box>
      <Typography
        fontWeight={700}
        sx={{
          color: "#263238",
        }}
      >
        Notas
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 2,
        }}
      >
        Agrega apuntes, pendientes o información interna relacionada
        con esta tarea.
      </Typography>

      <TextField
        fullWidth
        multiline
        minRows={4}
        maxRows={12}
        label="Notas de la tarea"
        placeholder="Escribe notas relacionadas con esta tarea..."
        value={notas}
        onChange={(event) => {
          setNotas(event.target.value);
        }}
        helperText={`${notas.length}/5000`}
        inputProps={{
          maxLength: 5000,
        }}
        disabled={guardando}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          mt: 1.5,
        }}
      >
        {hayCambios && (
          <Button
            variant="text"
            onClick={handleCancelar}
            disabled={guardando}
          >
            Cancelar
          </Button>
        )}

        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          onClick={handleGuardar}
          disabled={
            guardando ||
            !hayCambios
          }
          sx={modalPrimaryButtonSx}
        >
          {guardando
            ? "Guardando..."
            : "Guardar cambios"}
        </Button>
      </Box>
    </Box>
  );
};

export default PlanTrabajoNotas;