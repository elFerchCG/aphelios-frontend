import React from "react";

import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";

import PageToolbarCard from "../../../common/PageToolbarCard";

import {
  toolbarFieldSx,
  toolbarButtonSx,
  fieldWidths,
} from "../../../common/formStyles";

// =========================================================
// FILTROS DE SOPORTE
// =========================================================

const SoporteFiltros = ({
  vista,
  permisos,

  filtros,

  categorias = [],
  areas = [],
  usuarios = [],
  desarrolladores = [],

  hayFiltros,

  onFiltroChange,
  onLimpiar,
  onNuevoTicket,
}) => {
  // =========================================================
  // VALORES
  // =========================================================

  const {
    busqueda,
    estatus,
    usuarioFiltro,
    categoriaId,
    areaId,
    prioridad,
    asignadoA,
  } = filtros;

  // =========================================================
  // OPCIONES SELECCIONADAS DE AUTOCOMPLETE
  // =========================================================

  const areaSeleccionada =
    areas.find((area) => String(area.id) === String(areaId)) || null;

  const categoriaSeleccionada =
    categorias.find(
      (categoria) => String(categoria.id) === String(categoriaId),
    ) || null;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <PageToolbarCard>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",

          gap: "16px",
          flexWrap: "wrap",

          width: "100%",
          minWidth: 0,
        }}
      >
        {/* =================================================
            BUSCAR
        ================================================= */}

        <TextField
          label="Buscar"
          placeholder={
            vista === "mis" ? "Folio o asunto..." : "Folio, asunto o usuario..."
          }
          value={busqueda}
          onChange={(event) => onFiltroChange("busqueda", event.target.value)}
          sx={{
            ...toolbarFieldSx,

            width: fieldWidths.large,
            maxWidth: "100%",
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* =================================================
            USUARIO

            Solo aparece en:
            - Todos los tickets
            - Asignados a mí
        ================================================= */}

        {vista !== "mis" && (
          <FormControl
            sx={{
              ...toolbarFieldSx,

              width: fieldWidths.medium,
              maxWidth: "100%",
            }}
          >
            <InputLabel>Usuario</InputLabel>

            <Select
              value={usuarioFiltro}
              label="Usuario"
              onChange={(event) =>
                onFiltroChange("usuarioFiltro", event.target.value)
              }
            >
              <MenuItem value="">Todos</MenuItem>

              {usuarios.map((usuario) => (
                <MenuItem key={usuario.id_usuario} value={usuario.id_usuario}>
                  {usuario.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* =================================================
            ÁREA
            Selector + búsqueda
        ================================================= */}

        <Autocomplete
          options={areas}
          value={areaSeleccionada}
          onChange={(_event, nuevaArea) => {
            onFiltroChange("areaId", nuevaArea?.id || "");
          }}
          getOptionLabel={(option) =>
            option?.nombre_completo || option?.nombre || ""
          }
          isOptionEqualToValue={(option, value) =>
            String(option.id) === String(value.id)
          }
          noOptionsText="No se encontraron áreas"
          clearText="Limpiar"
          openText="Abrir"
          closeText="Cerrar"
          sx={{
            ...toolbarFieldSx,

            width: fieldWidths.medium,
            maxWidth: "100%",
          }}
          renderInput={(params) => (
            <TextField {...params} label="Área" placeholder="Buscar área..." />
          )}
        />

        {/* =================================================
            CATEGORÍA
            Selector + búsqueda
        ================================================= */}

        <Autocomplete
          options={categorias}
          value={categoriaSeleccionada}
          onChange={(_event, nuevaCategoria) => {
            onFiltroChange("categoriaId", nuevaCategoria?.id || "");
          }}
          getOptionLabel={(option) => option?.nombre || ""}
          isOptionEqualToValue={(option, value) =>
            String(option.id) === String(value.id)
          }
          noOptionsText="No se encontraron categorías"
          clearText="Limpiar"
          openText="Abrir"
          closeText="Cerrar"
          sx={{
            ...toolbarFieldSx,

            width: fieldWidths.medium,
            maxWidth: "100%",
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Categoría"
              placeholder="Buscar categoría..."
            />
          )}
        />

        {/* =================================================
            ESTATUS
        ================================================= */}

        <FormControl
          sx={{
            ...toolbarFieldSx,

            width: fieldWidths.medium,
            maxWidth: "100%",
          }}
        >
          <InputLabel>Estatus</InputLabel>

          <Select
            value={estatus}
            label="Estatus"
            onChange={(event) => onFiltroChange("estatus", event.target.value)}
          >
            <MenuItem value="todos">Todos</MenuItem>

            <MenuItem value="abierto">Abierto</MenuItem>

            <MenuItem value="en_revision">En revisión</MenuItem>

            <MenuItem value="en_desarrollo">En desarrollo</MenuItem>

            <MenuItem value="esperando_usuario">Esperando usuario</MenuItem>

            <MenuItem value="resuelto">Resuelto</MenuItem>

            <MenuItem value="cerrado">Cerrado</MenuItem>

            <MenuItem value="cancelado">Cancelado</MenuItem>
          </Select>
        </FormControl>

        {/* =================================================
            PRIORIDAD

            No aparece en "Mis tickets".
        ================================================= */}

        {vista !== "mis" && (
          <FormControl
            sx={{
              ...toolbarFieldSx,

              width: fieldWidths.medium,
              maxWidth: "100%",
            }}
          >
            <InputLabel>Prioridad</InputLabel>

            <Select
              value={prioridad}
              label="Prioridad"
              onChange={(event) =>
                onFiltroChange("prioridad", event.target.value)
              }
            >
              <MenuItem value="todos">Todas</MenuItem>

              <MenuItem value="baja">Baja</MenuItem>

              <MenuItem value="normal">Normal</MenuItem>

              <MenuItem value="alta">Alta</MenuItem>

              <MenuItem value="critica">Crítica</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* =================================================
            ASIGNADO A

            Solamente:
            - Vista "Todos"
            - Desarrolladores
        ================================================= */}

        {vista === "todos" && permisos?.puedeVerAsignados && (
          <FormControl
            sx={{
              ...toolbarFieldSx,

              width: fieldWidths.medium,
              maxWidth: "100%",
            }}
          >
            <InputLabel>Asignado a</InputLabel>

            <Select
              value={asignadoA}
              label="Asignado a"
              onChange={(event) =>
                onFiltroChange("asignadoA", event.target.value)
              }
            >
              <MenuItem value="">Todos</MenuItem>

              {desarrolladores.map((desarrollador) => (
                <MenuItem
                  key={desarrollador.id_usuario}
                  value={desarrollador.id_usuario}
                >
                  {desarrollador.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* =================================================
            LIMPIAR FILTROS
        ================================================= */}

        {hayFiltros && (
          <Button
            variant="text"
            startIcon={<FilterAltOffOutlinedIcon />}
            onClick={onLimpiar}
            sx={{
              minHeight: 40,
              whiteSpace: "nowrap",
            }}
          >
            Limpiar
          </Button>
        )}

        {/* =================================================
            NUEVO TICKET
        ================================================= */}

        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          sx={{
            ...toolbarButtonSx,

            ml: {
              xs: 0,
              xl: "auto",
            },
          }}
          onClick={onNuevoTicket}
        >
          Nuevo ticket
        </Button>
      </Box>
    </PageToolbarCard>
  );
};

export default SoporteFiltros;
