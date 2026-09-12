import React, { useCallback, useEffect, useMemo, useState } from "react";

import axios from "axios";

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  TextField,
  Typography,
} from "@mui/material";

import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";

import { modalPrimaryButtonSx } from "../../../common/modalStyles";

import { swalSuccess } from "../../../../helpers/sweetAlert";
import { handleApiError } from "../../../../helpers/apiErrorHandler";

// =========================================================
// COMPONENTE
// =========================================================

const PlanTrabajoResponsables = ({
  tareaId,
  responsables = [],
  usuarioActualId,
  procesandoAsignacion,
  onAsignarme,
  onDesasignarme,
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

  const [mostrarAsignacion, setMostrarAsignacion] = useState(false);

  const [administradores, setAdministradores] = useState([]);

  const [seleccionados, setSeleccionados] = useState([]);

  const [loadingAdministradores, setLoadingAdministradores] = useState(false);

  const [guardandoResponsables, setGuardandoResponsables] = useState(false);

  // =========================================================
  // ¿ESTOY ASIGNADO?
  // =========================================================

  const estoyAsignado = useMemo(() => {
    return responsables.some(
      (responsable) =>
        Number(responsable.usuario_id) === Number(usuarioActualId),
    );
  }, [responsables, usuarioActualId]);

  // =========================================================
  // IDS YA ASIGNADOS
  // =========================================================

  const idsAsignados = useMemo(() => {
    return new Set(
      responsables.map((responsable) => Number(responsable.usuario_id)),
    );
  }, [responsables]);

  // =========================================================
  // OBTENER ADMINISTRADORES
  // =========================================================

  const obtenerAdministradores = useCallback(async () => {
    try {
      setLoadingAdministradores(true);

      const response = await axios.get(
        `${apiUrl}/planTrabajo/administradores`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        response.data?.administradores || response.data?.usuarios || [];

      setAdministradores(data);
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron obtener los administradores.",
        warningTitle: "No se pudieron cargar los administradores",
      });
    } finally {
      setLoadingAdministradores(false);
    }
  }, [apiUrl, token]);

  // =========================================================
  // CARGAR ADMINISTRADORES AL ABRIR ASIGNACIÓN
  // =========================================================

  useEffect(() => {
    if (!mostrarAsignacion) {
      return;
    }

    if (administradores.length > 0) {
      return;
    }

    obtenerAdministradores();
  }, [mostrarAsignacion, administradores.length, obtenerAdministradores]);

  // =========================================================
  // OPCIONES DISPONIBLES
  // =========================================================

  const administradoresDisponibles = useMemo(() => {
    return administradores.filter((administrador) => {
      const id = Number(
        administrador.id_usuario ??
          administrador.usuario_id ??
          administrador.id,
      );

      return !idsAsignados.has(id);
    });
  }, [administradores, idsAsignados]);

  // =========================================================
  // GUARDAR RESPONSABLES
  // =========================================================

  const handleAsignarResponsables = async () => {
    if (seleccionados.length === 0) {
      return;
    }

    try {
      setGuardandoResponsables(true);

      const usuarioIds = seleccionados
        .map((usuario) =>
          Number(usuario.id_usuario ?? usuario.usuario_id ?? usuario.id),
        )
        .filter((id) => Number.isInteger(id) && id > 0);

      await axios.post(
        `${apiUrl}/planTrabajo/tareas/${tareaId}/responsables`,
        {
          usuario_ids: usuarioIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      swalSuccess(
        "Responsables asignados",
        "Los responsables se asignaron correctamente.",
      );

      setSeleccionados([]);
      setMostrarAsignacion(false);

      if (onUpdated) {
        await onUpdated();
      }
    } catch (error) {
      handleApiError(error, {
        defaultMessage: "No se pudieron asignar los responsables.",
        warningTitle: "No se pudieron asignar los responsables",
      });
    } finally {
      setGuardandoResponsables(false);
    }
  };

  // =========================================================
  // CANCELAR ASIGNACIÓN
  // =========================================================

  const handleCancelarAsignacion = () => {
    setSeleccionados([]);
    setMostrarAsignacion(false);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            fontWeight={700}
            sx={{
              color: "#263238",
            }}
          >
            Responsables
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.25,
            }}
          >
            Administradores actualmente asignados a esta tarea.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<PersonAddAlt1OutlinedIcon />}
            onClick={() => setMostrarAsignacion((prev) => !prev)}
            disabled={guardandoResponsables}
          >
            Asignar responsables
          </Button>

          {estoyAsignado ? (
            <Button
              variant="outlined"
              startIcon={<PersonRemoveOutlinedIcon />}
              onClick={onDesasignarme}
              disabled={procesandoAsignacion}
            >
              {procesandoAsignacion ? "Procesando..." : "Dejar tarea"}
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<PersonAddOutlinedIcon />}
              onClick={onAsignarme}
              disabled={procesandoAsignacion}
            >
              {procesandoAsignacion ? "Procesando..." : "Asignarme"}
            </Button>
          )}
        </Box>
      </Box>

      {/* =====================================================
          RESPONSABLES ACTUALES
      ====================================================== */}

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mt: 2,
        }}
      >
        {responsables.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontStyle: "italic",
            }}
          >
            Esta tarea todavía no tiene responsables asignados.
          </Typography>
        ) : (
          responsables.map((responsable) => (
            <Chip
              key={responsable.usuario_id}
              label={responsable.nombre}
              variant="outlined"
            />
          ))
        )}
      </Box>

      {/* =====================================================
          PANEL ASIGNAR RESPONSABLES
      ====================================================== */}

      <Collapse in={mostrarAsignacion}>
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
          }}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              mb: 1.5,
            }}
          >
            Asignar nuevos responsables
          </Typography>

          <Autocomplete
            multiple
            options={administradoresDisponibles}
            value={seleccionados}
            onChange={(event, value) => {
              setSeleccionados(value);
            }}
            loading={loadingAdministradores}
            disableCloseOnSelect
            getOptionLabel={(option) => option.nombre || "Administrador"}
            isOptionEqualToValue={(option, value) => {
              const optionId = Number(
                option.id_usuario ?? option.usuario_id ?? option.id,
              );

              const valueId = Number(
                value.id_usuario ?? value.usuario_id ?? value.id,
              );

              return optionId === valueId;
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Administradores"
                placeholder={
                  seleccionados.length === 0
                    ? "Selecciona uno o más administradores..."
                    : ""
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingAdministradores ? (
                        <CircularProgress size={20} />
                      ) : null}

                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              mt: 2,
            }}
          >
            <Button
              variant="text"
              onClick={handleCancelarAsignacion}
              disabled={guardandoResponsables}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              onClick={handleAsignarResponsables}
              disabled={guardandoResponsables || seleccionados.length === 0}
              sx={modalPrimaryButtonSx}
            >
              {guardandoResponsables ? "Asignando..." : "Asignar"}
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default PlanTrabajoResponsables;
