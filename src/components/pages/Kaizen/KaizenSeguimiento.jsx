import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import HistorialKaizenModal from "./HistorialKaizenModal";
import EditarResponsablesKaizenModal from "./EditarResponsablesKaizenModal";
import CerrarKaizenModal from "./CerrarKaizenModal";
import {
  swalSuccess,
  swalError,
  swalWarning,
} from "../../../helpers/sweetAlert";
import Swal from "sweetalert2";

const KaizenSeguimiento = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const [openResponsables, setOpenResponsables] = useState(false);
  const [kaizenSeleccionado, setKaizenSeleccionado] = useState(null);

  const [openCerrarKaizen, setOpenCerrarKaizen] = useState(false);
  const [kaizenCerrarSeleccionado, setKaizenCerrarSeleccionado] =
    useState(null);

  const [estatusFiltro, setEstatusFiltro] = useState("activo");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [usuariosAsignables, setUsuariosAsignables] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const token = localStorage.getItem("token");

  const abrirHistorial = (producto) => {
    setProductoSeleccionado(producto);
    setOpenModal(true);
  };

  const cerrarHistorial = () => {
    setOpenModal(false);
    setProductoSeleccionado(null);
  };

  const abrirResponsables = (kaizen) => {
    setKaizenSeleccionado(kaizen);
    setOpenResponsables(true);
  };

  const cerrarResponsables = () => {
    setOpenResponsables(false);
    setKaizenSeleccionado(null);
  };

  const abrirCerrarKaizen = (kaizen) => {
    setKaizenCerrarSeleccionado(kaizen);
    setOpenCerrarKaizen(true);
  };

  const cerrarCerrarKaizen = () => {
    setOpenCerrarKaizen(false);
    setKaizenCerrarSeleccionado(null);
  };

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const obtenerUsuarioLocal = () => {
    try {
      const usuarioStorage = localStorage.getItem("user");
      if (!usuarioStorage) return null;

      return JSON.parse(usuarioStorage);
    } catch (error) {
      console.error("Error al leer usuario local:", error);
      return null;
    }
  };

  const obtenerUsuariosAsignables = async () => {
    try {
      const resp = await axios.get(`${apiUrl}/kaizen/usuariosAsignables`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        setUsuariosAsignables(resp.data.data);
      }
    } catch (error) {
      console.error("Error al obtener usuarios asignables:", error);
    }
  };

  const obtenerProveedores = async () => {
    try {
      const resp = await axios.get(`${apiUrl}/proveedores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(resp.data) ? resp.data : resp.data.data || [];
      setProveedores(data);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
    }
  };

  const usuarioLocal = obtenerUsuarioLocal();

  const rolDescripcion = usuarioLocal?.rol_descripcion;

  const esMarketing = usuarioLocal?.rol_descripcion === "Marketing";

  const puedeAdministrarKaizen =
    rolDescripcion === "administrador" ||
    rolDescripcion === "coordinador comercial" ||
    rolDescripcion === "Coordinador Comercial" ||
    rolDescripcion === "Lider Marketing" ||
    rolDescripcion === "Líder Marketing";

  const puedeVerProveedor =
    usuarioLocal?.rol_descripcion === "Marketing" ||
    usuarioLocal?.rol_descripcion === "administrador" ||
    usuarioLocal?.rol_descripcion === "coordinador comercial" ||
    usuarioLocal?.rol_descripcion === "Coordinador Comercial";

  const puedeCerrarKaizen =
    puedeAdministrarKaizen || rolDescripcion === "Marketing";

  const formatoFecha = (fecha) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const obtenerSeguimiento = async () => {
    try {
      setLoading(true);

      const resp = await axios.get(`${apiUrl}/kaizen/seguimiento`, {
        params: {
          estatus: estatusFiltro,
          fechaInicio,
          fechaFin,
          busqueda: busqueda || undefined,
          responsableId: responsableId || undefined,
          proveedorId: proveedorId || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.ok) {
        setRows(
          resp.data.data.map((item) => ({
            ...item,
            id: item.id,
          })),
        );
      }
    } catch (error) {
      console.error("Error al obtener Kaizen en seguimiento:", error);
    } finally {
      setLoading(false);
    }
  };

  const cerrarKaizensSeleccionados = async (producto) => {
    try {
      const token = localStorage.getItem("token");

      const respHistorial = await axios.get(
        `${apiUrl}/kaizen/historial/${producto.producto_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!respHistorial.data.ok) return;

      const kaizens = Array.isArray(respHistorial.data.data?.kaizens)
        ? respHistorial.data.data.kaizens
        : [];

      const accionesActivas = kaizens.filter(
        (item) => item.estatus === "activo",
      );

      if (accionesActivas.length === 0) {
        swalWarning(
          "Sin acciones activas",
          "Este producto no tiene acciones activas.",
        );
        return;
      }

      const html = `
  <div style="text-align:left; display:flex; flex-direction:column; gap:10px;">
    ${accionesActivas
      .map(
        (item) => `
          <label
            style="
              display:flex;
              gap:10px;
              align-items:flex-start;
              padding:12px;
              border:1px solid #e0e0e0;
              border-radius:10px;
              background:#fafafa;
              cursor:pointer;
            "
          >
            <input
              type="checkbox"
              class="kaizen-check"
              value="${item.id}"
              style="margin-top:4px;"
            />

            <div>
              <div style="font-weight:700; color:#222;">
                Razón ${item.razon_codigo}: ${item.razon_descripcion}
              </div>

              <div style="font-size:13px; color:#555; margin-top:4px;">
                ${item.acciones_mejora}
              </div>

              <div style="font-size:12px; color:#777; margin-top:6px;">
                Seguimiento: ${formatoFecha(item.fecha_seguimiento)}
              </div>
            </div>
          </label>
        `,
      )
      .join("")}
  </div>
`;

      const confirmacion = await Swal.fire({
        icon: "warning",
        title: "Selecciona acciones a cerrar",
        html,
        width: 620,
        showCancelButton: true,
        confirmButtonText: "Cerrar seleccionadas",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#1976d2",
        cancelButtonColor: "#757575",
        customClass: {
          container: "mi-swal",
        },
        preConfirm: () => {
          const seleccionados = Array.from(
            document.querySelectorAll(".kaizen-check:checked"),
          ).map((input) => Number(input.value));

          if (seleccionados.length === 0) {
            Swal.showValidationMessage("Selecciona al menos una acción");
            return false;
          }

          return seleccionados;
        },
      });

      if (!confirmacion.isConfirmed) return;

      const kaizenIds = confirmacion.value;

      const resp = await axios.patch(
        `${apiUrl}/kaizen/cerrarSeleccionados`,
        {
          kaizenIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        swalSuccess(
          "Acciones cerradas",
          resp.data.message || "Acciones cerradas correctamente",
        );

        obtenerSeguimiento();
      }
    } catch (error) {
      console.error("Error al cerrar acciones seleccionadas:", error);

      swalError(
        "Error",
        error.response?.data?.message ||
          "Error al cerrar acciones seleccionadas",
      );
    }
  };

  const cerrarTodosKaizens = async (producto) => {
    try {
      const confirmacion = await Swal.fire({
        icon: "warning",
        title: "¿Cerrar todos los Kaizens?",
        text: "Se cerrarán todas las acciones activas de este producto.",
        showCancelButton: true,
        confirmButtonText: "Sí, cerrar todos",
        cancelButtonText: "Cancelar",
        customClass: {
          container: "mi-swal",
        },
      });

      if (!confirmacion.isConfirmed) return;

      const token = localStorage.getItem("token");

      const resp = await axios.patch(
        `${apiUrl}/kaizen/producto/${producto.producto_id}/cerrarTodos`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (resp.data.ok) {
        swalSuccess(
          "Kaizens cerrados",
          resp.data.message || "Acciones cerradas correctamente",
        );

        obtenerSeguimiento();
      }
    } catch (error) {
      console.error("Error al cerrar todos los Kaizens:", error);

      swalError(
        "Error",
        error.response?.data?.message || "Error al cerrar los Kaizens",
      );
    }
  };

  useEffect(() => {
    obtenerProveedores();

    if (puedeAdministrarKaizen) {
      obtenerUsuariosAsignables();
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      obtenerSeguimiento();
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    estatusFiltro,
    fechaInicio,
    fechaFin,
    busqueda,
    responsableId,
    proveedorId,
  ]);

  useEffect(() => {
    const actualizarSeguimiento = () => {
      obtenerSeguimiento();
    };

    window.addEventListener("kaizenActualizado", actualizarSeguimiento);
    window.addEventListener("focus", actualizarSeguimiento);

    return () => {
      window.removeEventListener("kaizenActualizado", actualizarSeguimiento);
      window.removeEventListener("focus", actualizarSeguimiento);
    };
  }, []);

  const columnasBase = [
    {
      field: "title",
      headerName: "Producto",
      flex: 2,
      minWidth: 320,
      renderCell: (params) => {
        const url = params.row.permalink;

        if (!url) return params.value;

        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#1976d2",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            {params.value}
          </a>
        );
      },
    },

    {
      field: "sku",
      headerName: "SKU",
      minWidth: 170,
      flex: 1,
    },

    {
      field: "publicacion_mlm",
      headerName: "MLM",
      minWidth: 170,
      flex: 1,
    },

    {
      field: "user_product_id",
      headerName: "User Product ID",
      minWidth: 170,
      flex: 1,
    },

    {
      field: "logistic_type",
      headerName: "Logística",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const value = String(params.value || "")
          .trim()
          .toLowerCase();

        const config = {
          fulfillment: {
            label: "Fulfillment",
            color: "success",
          },
          cross_docking: {
            label: "Cross Docking",
            color: "info",
          },
          xd_drop_off: {
            label: "XD Drop Off",
            color: "warning",
          },
        };

        const estado = config[value] || {
          label: params.value || "Sin dato",
          color: "default",
        };

        return (
          <Chip
            label={estado.label}
            color={estado.color}
            size="small"
            variant="outlined"
          />
        );
      },
    },

    {
      field: "fecha_kaizen",
      headerName: "Fecha Kaizen",
      width: 150,
      renderCell: (params) => formatoFecha(params.value),
    },

    {
      field: "fecha_seguimiento",
      headerName: "Seguimiento",
      width: 150,
      renderCell: (params) => formatoFecha(params.value),
    },

    {
      field: "responsables",
      headerName: "Asignado a",
      width: 220,
    },

    {
      field: "estatus",
      headerName: "Estatus",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: ({ value }) => {
        const config = {
          activo: {
            label: "Activo",
            color: "primary",
          },
          cerrado: {
            label: "Cerrado",
            color: "default",
          },
        };

        const estado = config[value] || {
          label: value,
          color: "default",
        };

        return <Chip label={estado.label} color={estado.color} size="small" />;
      },
    },

    {
      field: "acciones",
      headerName: "Historial",
      width: 130,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => abrirHistorial(params.row)}
        >
          Ver
        </Button>
      ),
    },
  ];

  const columnasAdmin = [
    {
      field: "responsablesAccion",
      headerName: "Responsables",
      width: 160,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => abrirResponsables(params.row)}
        >
          Editar
        </Button>
      ),
    },
    {
      field: "cerrar",
      headerName: "Cerrar",
      width: 160,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        puedeAdministrarKaizen ? (
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={params.row.estatus === "cerrado"}
            onClick={() => abrirCerrarKaizen(params.row)}
          >
            Cerrar
          </Button>
        ) : null,
    },
  ];

  const columnaResponsables = {
    field: "responsablesAccion",
    headerName: "Responsables",
    width: 160,
    align: "center",
    headerAlign: "center",
    sortable: false,
    filterable: false,
    renderCell: (params) =>
      puedeAdministrarKaizen ? (
        <Button
          variant="contained"
          size="small"
          onClick={() => abrirResponsables(params.row)}
        >
          Editar
        </Button>
      ) : null,
  };

  const columnaCerrar = {
    field: "cerrar",
    headerName: "Cerrar",
    width: 160,
    align: "center",
    headerAlign: "center",
    sortable: false,
    filterable: false,
    renderCell: (params) =>
      puedeCerrarKaizen ? (
        <Button
          variant="outlined"
          color="error"
          size="small"
          disabled={params.row.estatus === "cerrado"}
          onClick={() => abrirCerrarKaizen(params.row)}
        >
          Cerrar
        </Button>
      ) : null,
  };

  const columns = [
    ...columnasBase,
    ...(puedeAdministrarKaizen ? [columnaResponsables] : []),
    ...(puedeCerrarKaizen ? [columnaCerrar] : []),
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Kaizen en Seguimiento
      </Typography>

      <Card sx={{ mb: 3, backgroundColor: "#f8f9fa" }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Seguimiento de acciones Kaizen
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Esta visual muestra los productos que ya cuentan con una acción
            Kaizen activa. Su objetivo es dar seguimiento a las acciones
            registradas, revisar responsables y fechas de seguimiento.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <TextField
                  select
                  label="Estatus"
                  size="small"
                  value={estatusFiltro}
                  onChange={(e) => setEstatusFiltro(e.target.value)}
                  sx={{ width: 180 }}
                >
                  <MenuItem value="activo">Activos</MenuItem>
                  <MenuItem value="cerrado">Cerrados</MenuItem>
                  <MenuItem value="todos">Todos</MenuItem>
                </TextField>

                <TextField
                  type="date"
                  label="Desde"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />

                <TextField
                  type="date"
                  label="Hasta"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />

                {puedeVerProveedor && (
                  <TextField
                    select
                    label="Proveedor"
                    size="small"
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    sx={{ minWidth: 260 }}
                  >
                    <MenuItem value="">Todos</MenuItem>

                    {proveedores.map((proveedor) => (
                      <MenuItem
                        key={proveedor.id_proveedor}
                        value={proveedor.id_proveedor}
                      >
                        {proveedor.razon_social}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {puedeAdministrarKaizen && (
                  <>
                    <TextField
                      select
                      label="Asignado a"
                      size="small"
                      value={responsableId}
                      onChange={(e) => setResponsableId(e.target.value)}
                      sx={{ minWidth: 240 }}
                    >
                      <MenuItem value="">Todos</MenuItem>

                      {usuariosAsignables.map((usuario) => (
                        <MenuItem
                          key={usuario.id_usuario}
                          value={usuario.id_usuario}
                        >
                          {usuario.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </>
                )}
              </Box>

              <TextField
                label="Buscar producto, SKU, MLM o User Product ID"
                size="small"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribe producto, SKU, MLM o User Product ID..."
                sx={{ maxWidth: 520 }}
              />
            </Box>

            <Button variant="outlined" onClick={obtenerSeguimiento}>
              Actualizar
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          disableRowSelectionOnClick
        />
      </Box>

      <HistorialKaizenModal
        open={openModal}
        onClose={cerrarHistorial}
        producto={productoSeleccionado}
        soloLectura={true}
      />

      <EditarResponsablesKaizenModal
        open={openResponsables}
        onClose={cerrarResponsables}
        kaizen={kaizenSeleccionado}
        onSaved={obtenerSeguimiento}
        soloLectura={kaizenSeleccionado?.estatus === "cerrado"}
      />

      <CerrarKaizenModal
        open={openCerrarKaizen}
        onClose={cerrarCerrarKaizen}
        producto={kaizenCerrarSeleccionado}
        onSaved={obtenerSeguimiento}
      />
    </Box>
  );
};

export default KaizenSeguimiento;
