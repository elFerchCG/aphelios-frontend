import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import Swal from "sweetalert2";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const DataGridT = () => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const initialTransaccionData = {
    id: "",
    descripcion: "",
    categoria: "",
    activo: "",
    rol_id: "",
  };

  const initialNewTransaccionData = {
    descripcion: "",
    categoria: "",
    rol_id: "",
  };

  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedTransaccion, setSelectedTransaccion] = useState(null);
  const [openModalPost, setOpenModalPost] = useState(false);
  const [transaccionData, setTransaccionData] = useState(
    initialTransaccionData,
  );
  const [newTransaccionData, setNewTransaccionData] = useState(
    initialNewTransaccionData,
  );
  const [loading, setLoading] = useState(true);

  const fetchTiposTransacciones = async () => {
    try {
      const response = await axios.get(`${apiUrl}/inventario/tipoTransaccion/`);
      if (response.data && Array.isArray(response.data)) {
        setRows(response.data);
      } else {
        Swal.fire({
          title: "!Tipos de movimientos no encontrados!",
          text: "No se encontraron tipos de movimientos",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Error: ${error.message}`,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  useEffect(() => {
    const fetchTiposTransacciones = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${apiUrl}/inventario/tipoTransaccion/`,
        );
        if (response.data && Array.isArray(response.data)) {
          setRows(response.data);
        } else {
          Swal.fire({
            title: "!Tipos de movimientos no encontrados!",
            text: "No se encontraron tipos de movimientos",
            icon: "error",
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true,
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: `Error: ${error.message}`,
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${apiUrl}/usuarios/roles`);
        if (response.data && Array.isArray(response.data)) {
          setRoles(response.data);
        }
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar los roles",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      }
    };

    fetchTiposTransacciones();
    if (selectedTransaccion || openModalPost) {
      fetchRoles();
    }
  }, [apiUrl, selectedTransaccion, openModalPost]);

  const handleOpenModal = (transaccion) => {
    setSelectedTransaccion(transaccion);
    setTransaccionData({
      ...initialTransaccionData,
      ...transaccion,
      rol_descripcion: getRolDescripcion(transaccion.rol_id),
      activo_descripcion: transaccion.activo === 1 ? "Activo" : "Inactivo",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setTransaccionData(initialTransaccionData);
  };

  const handleOpenModalPost = () => {
    setOpenModalPost(true);
  };

  const handleCloseModalPost = () => {
    setOpenModalPost(false);
    setTransaccionData(initialTransaccionData);
  };

  const getRolDescripcion = (rolId) => {
    const rol = roles.find((role) => role.id === rolId);
    return rol ? rol.descripcion : "Desconocido";
  };

  const handleChangeEstado = (e) => {
    const selectedEstado = e.target.value;
    const descripcionEstado = selectedEstado === 1 ? "Activo" : "Inactivo";
    setTransaccionData({
      ...transaccionData,
      activo: selectedEstado,
      activo_descripcion: descripcionEstado,
    });
  };

  const handleSaveChanges = async () => {
    try {
      const response = await axios.put(
        `${apiUrl}/inventario/tipoTransaccion/${transaccionData.id}`,
        {
          descripcion: transaccionData.descripcion,
          categoria: transaccionData.categoria,
          activo: transaccionData.activo, // Enviar el estado (1 o 0)
          rol_id: parseInt(transaccionData.rol_id, 10), // Convertir a número entero
        },
      );
      if (response.status === 200) {
        Swal.fire({
          title: "Tipo de movimiento actualizado",
          text: "Los cambios se guardaron correctamente",
          icon: "success",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
        setTransaccionData("");
        fetchTiposTransacciones();
        setOpenModal(false);
      }
    } catch (error) {
      setTransaccionData("");
      const errorMessage =
        error.response?.data?.message || "Hubo un error desconocido";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
      setOpenModal(false);
    }
  };

  const addTipoTransaccion = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/inventario/tipoTransaccion/`,
        {
          descripcion: newTransaccionData.descripcion,
          categoria: newTransaccionData.categoria,
          rol_id: newTransaccionData.rol_id, // Convertir a número entero
        },
      );
      if (response.data.ok) {
        Swal.fire({
          title: "Tipo de transacción creado",
          text: "El nuevo tipo de transacción se ha creado correctamente",
          icon: "success",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
        fetchTiposTransacciones();
        setNewTransaccionData("");
        handleCloseModalPost();
      }
    } catch (error) {
      setNewTransaccionData("");
      const errorMessage =
        error.response?.data?.message || "Hubo un error desconocido";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
      setOpenModalPost(false);
    }
  };

  const columns = [
    { field: "id", headerName: "Folio", flex: 1 },
    { field: "descripcion", headerName: "Descripción", flex: 3 },
    { field: "categoria", headerName: "Categoria", flex: 1 },
    // { field: 'activo', headerName: 'Activo', flex: 1 },
    // {
    //     field: 'activo_descripcion', headerName: 'Activo', flex: 0.8,
    //     renderCell: (params) => (
    //         params.value === "Sí"
    //             ? <Chip label="Activo" color="success" size="small" />
    //             : <Chip label="Inactivo" color="default" size="small" />
    //     )
    // },
    { field: "rol_id", headerName: "Rol", flex: 1 },
    { field: "rol_descripcion", headerName: "Rol", flex: 0.8 },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      width: 150,
      getActions: (params) => [
        <Tooltip title="Ver detalles">
          <GridActionsCellItem
            icon={<EditNoteIcon />}
            label="Editar tipo de transacción"
            sx={{ color: "green" }}
            onClick={() => handleOpenModal(params.row)}
          />
        </Tooltip>,
      ],
    },
  ];

  // const filteredRows = data.filter(row =>
  //     (row.id && row.id.toString().includes(filter)) ||
  //     (row.descripcion && row.descripcion.toLowerCase().includes(filter.toLowerCase())) ||
  //     (row.categoria && row.categoria.toLowerCase().includes(filter.toLowerCase())) ||
  //     (row.responsable && row.responsable.toLowerCase().includes(filter.toLowerCase()))
  // )

  return (
    <div className="contenido">
      <div className="encabezado">
        <h1>Tipos de transacciones</h1>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "500px",
          width: "auto",
          margin: "30px",
          marginTop: "-30px",
        }}
      >
        {/* Contenedor flex para el TextField y el Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center", // Para alinear ambos elementos a la misma altura
            marginBottom: "10px", // Espacio entre el formulario y el DataGrid
          }}
        >
          {/* TextField alineado a la izquierda */}
          <TextField
            id="outlined-basic"
            label="Buscar tipo de transacción"
            variant="outlined"
            style={{
              minWidth: "350px", // Ajusta el tamaño del TextField según sea necesario
              marginRight: "auto", // Para que el TextField ocupe todo el espacio posible
            }}
          />
          {/* Botón alineado a la derecha */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenModalPost}
            style={{
              marginLeft: "auto", // Empuja el botón hacia la derecha
            }}
          >
            Agregar Tipo de transacción
          </Button>
        </div>
        {/* DataGrid */}

        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          loading={loading}
          disableColumnResize={false}
          showCellVerticalBorder
          showColumnVerticalBorder
          getRowId={(row) => row.id}
          experimentalFeatures={{ newEditingApi: true }}
          columnVisibilityModel={{
            id: false,
            activo: false,
            rol_id: false,
          }}
        />
      </div>
      {/* Modal para editar usuario */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Editar tipo de transacción</DialogTitle>
        <DialogContent>
          <TextField
            label={"descripción"}
            fullWidth
            margin="normal"
            type="text"
            value={transaccionData.descripcion}
            onChange={(e) =>
              setTransaccionData({
                ...transaccionData,
                descripcion: e.target.value,
              })
            }
          />
          <TextField
            label={"categoria"}
            fullWidth
            margin="normal"
            value={transaccionData.categoria}
            onChange={(e) =>
              setTransaccionData({
                ...transaccionData,
                categoria: e.target.value,
              })
            }
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{"Rol"}</InputLabel>
            <Select
              value={transaccionData.rol_id || ""}
              onChange={(e) => {
                const selectedRol = e.target.value;
                const descripcion = getRolDescripcion(selectedRol);
                setTransaccionData({
                  ...transaccionData,
                  rol_id: parseInt(selectedRol, 10), // Convertir el rol seleccionado a número
                  rol_descripcion: descripcion,
                });
              }}
            >
              <MenuItem value="">
                <em>Seleccionar rol</em>
              </MenuItem>
              {roles.length > 0 ? (
                roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.descripcion}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  No hay roles disponibles
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{"Estatus"}</InputLabel>
            <Select
              value={
                transaccionData.activo !== undefined
                  ? transaccionData.activo
                  : ""
              }
              onChange={handleChangeEstado}
            >
              <MenuItem value={1}>Activo</MenuItem>
              <MenuItem value={0}>Inactivo</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSaveChanges} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal para crear usuario */}
      <Dialog open={openModalPost} onClose={handleCloseModalPost}>
        <DialogTitle>Crear tipo de transacción</DialogTitle>
        <DialogContent>
          <TextField
            label={"Descripción"}
            fullWidth
            margin="normal"
            value={newTransaccionData.descripcion}
            onChange={(e) =>
              setNewTransaccionData({
                ...newTransaccionData,
                descripcion: e.target.value,
              })
            }
          />
          <TextField
            label={"Categoria"}
            fullWidth
            margin="normal"
            value={newTransaccionData.categoria}
            onChange={(e) =>
              setNewTransaccionData({
                ...newTransaccionData,
                categoria: e.target.value,
              })
            }
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{"Rol"}</InputLabel>
            <Select
              value={newTransaccionData.rol_id || ""} // El valor de 'rol_id' debe coincidir con los valores de los roles
              onChange={(e) => {
                const selectedRol = e.target.value;
                const descripcion = getRolDescripcion(selectedRol);
                setNewTransaccionData({
                  ...newTransaccionData,
                  rol_id: selectedRol,
                  rol_descripcion: descripcion, // Aquí puedes también almacenar la descripción si lo necesitas
                });
              }}
            >
              <MenuItem defaultValue="">
                <em>Seleccionar rol</em>
              </MenuItem>
              {roles.length > 0 ? (
                roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.descripcion}
                  </MenuItem>
                ))
              ) : (
                <MenuItem defaultValue="" disabled>
                  No hay roles disponibles
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModalPost} color="primary">
            Cancelar
          </Button>
          <Button onClick={addTipoTransaccion} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DataGridT;
