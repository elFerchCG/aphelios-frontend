import {
  Box,
  Button,
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
  Chip,
  Typography,
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import Swal from "sweetalert2";
import EditNoteIcon from "@mui/icons-material/EditNote";
import NuevoRolModal from "./NuevoRolModal";

const TableUsuarios = () => {
  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openModalPost, setOpenModalPost] = useState(false);
  const [openRolModal, setOpenRolModal] = useState(false);
  const [userData, setUserData] = useState({
    // Datos del usuario en los campos
    id_usuario: "",
    nombre: "",
    password: "",
    estado: "",
    rol_id: "",
    rol_descripcion: "",,
        pin: ''
  });
  const [search, setSearch] = useState("");

    const [newUserData, setNewUserData] = useState({
        nombre: '',
        password: "",
        rol_id: "",
        pin: ""
    })

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${apiUrl}/usuarios`);
      if (response.data && Array.isArray(response.data)) {
        setRows(response.data);
      } else {
        Swal.fire({
          title: "!Usuarios no encontrados!",
          text: "No se encontraron usuarios",
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

  useEffect(() => {
    fetchUsuarios();

    if (selectedUser || openModalPost) {
      fetchRoles();
    }
  }, [apiUrl, selectedUser, openModalPost]);

    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setUserData({
            ...user,
            password: '',
            pin: '',
            rol_descripcion: getRolDescripcion(user.rol_id),
        });
        setOpenModal(true);
    };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenModalPost = () => {
    setOpenModalPost(true);
  };

  const handleCloseModalPost = () => {
    setOpenModalPost(false);
  };

  const getRolDescripcion = (rolId) => {
    const rol = roles.find((role) => role.id === rolId);
    return rol ? rol.descripcion : "Desconocido";
  };

    const handleChangeEstado = (e) => {
        const selectedEstado = e.target.value;
        const descripcionEstado = selectedEstado === 1 ? 'Activo' : 'Inactivo';
        setUserData({
            ...userData,
            estado: selectedEstado,
            estado_descripcion: descripcionEstado,
        });
    };

    // Helper para validar que el input del PIN solo acepte números y un máximo de 6 dígitos
    const handlePinChange = (e, isNewUser = false) => {
        const val = e.target.value;
        if (val === '' || (/^[0-9\b]+$/.test(val) && val.length <= 6)) {
            if (isNewUser) {
                setNewUserData({ ...newUserData, pin: val });
            } else {
                setUserData({ ...userData, pin: val });
            }
        }
    };

    const handleSaveChanges = async () => {
        try {
            const response = await axios.put(`${apiUrl}/usuarios/actualizar/${userData.id_usuario}`, {
                nombre: userData.nombre,
                password: userData.password,
                rol: parseInt(userData.rol_id, 10), // Convertir a número entero
                estado: userData.estado, // Enviar el estado (1 o 0)
                pin: userData.pin // Enviar el PIN actualizado
            });
            if (response.status === 200) {
                Swal.fire({
                    title: 'Usuario actualizado',
                    text: 'Los cambios se guardaron correctamente',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
                setUserData('');
                fetchUsuarios();
                setOpenModal(false);
            }
        } catch (error) {
            setUserData('');
            const errorMessage = error.response?.data?.message || "Hubo un error desconocido";
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            setOpenModal(false);
        }
    };

    const addUser = async () => {
        try {
            const response = await axios.post(`${apiUrl}/auth/register`, {
                nombre: newUserData.nombre,
                password: newUserData.password,
                rol_id: newUserData.rol_id,
                pin: newUserData.pin || null
            });
            if (response.data.ok) {
                Swal.fire({
                    title: 'Usuario creado',
                    text: 'El nuevo usuario se ha creado correctamente',
                    icon: 'success',
                    timer: 5000,
                    showCloseButton: true,
                    allowEscapeKey: true
                });
                fetchUsuarios();
                setNewUserData('');
                handleCloseModalPost();
            }
        } catch (error) {
            setNewUserData('');
            const errorMessage = error.response?.data?.message || "Hubo un error desconocido";
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                timer: 5000,
                showCloseButton: true,
                allowEscapeKey: true
            });
            setOpenModalPost(false);
        }
    }

  const columns = [
    { field: "id_usuario", headerName: "Folio", flex: 1 },
    { field: "nombre", headerName: "Nombre", flex: 2 },
    { field: "password", headerName: "Password", flex: 1 },
    {
      field: "estado",
      headerName: "Estado",
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value === 1 ? "Activo" : "Inactivo"}
          color={params.value === 1 ? "success" : "error"}
          size="small"
        />
      ),
    },
    { field: "rol_id", headerName: "Rol ID", flex: 1 },
    { field: "rol_descripcion", headerName: "Rol", flex: 1 },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      flex: 0.5,
      getActions: (params) => [
        <Tooltip title="Ver detalles">
          <GridActionsCellItem
            icon={<EditNoteIcon />}
            label="Editar usuario"
            sx={{ color: "green" }}
            onClick={() => handleOpenModal(params.row)}
          />
        </Tooltip>,
      ],
    },
  ];

  return (
    <div className="contenido">
      <div className="encabezado">
        <h1>Usuarios</h1>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "70vh",
          width: "98%",
          margin: "30px",
          marginTop: "-15px",
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
            label="Buscar usuario"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: 300,
              mr: "auto",
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
            Agregar Usuario
          </Button>
        </div>

        {/* DataGrid */}
        <DataGrid
          rows={filteredRows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 15,
              },
            },
          }}
          pageSizeOptions={[15, 25, 50, 100]}
          disableColumnResize={false}
          showCellVerticalBorder
          showColumnVerticalBorder
          getRowId={(row) => row.id_usuario}
          experimentalFeatures={{ newEditingApi: true }}
          columnVisibilityModel={{
            id_usuario: false,
            password: false,
            rol_id: false,
          }}
        />
      </div>
      {/* Modal para editar usuario */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          <TextField
            label={"Nombre"}
            fullWidth
            margin="normal"
            type="text"
            value={userData.nombre}
            onChange={(e) =>
              setUserData({ ...userData, nombre: e.target.value })
            }
          />
          <TextField
            label={"Password"}
            fullWidth
            margin="normal"
            value={userData.password}
            onChange={(e) =>
              setUserData({ ...userData, password: e.target.value })
            }
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{"Rol"}</InputLabel>
            <Select
              value={userData.rol_id || ""}
              onChange={(e) => {
                const selectedRol = e.target.value;
                const descripcion = getRolDescripcion(selectedRol);
                setUserData({
                  ...userData,
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
              value={userData.estado !== undefined ? userData.estado : ""}
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
      <Dialog
        open={openModalPost}
        onClose={handleCloseModalPost}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", pb: 1 }}>
          Crear Usuario
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              p: 2,
              mb: 2,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              backgroundColor: "#fafafa",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Registra un nuevo usuario y asigna el rol correspondiente para
              definir sus permisos dentro de Aphelios.
            </Typography>
          </Box>

          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            value={newUserData.nombre}
            onChange={(e) =>
              setNewUserData({ ...newUserData, nombre: e.target.value })
            }
          />

          <TextField
            label="Password"
            fullWidth
            margin="normal"
            type="password"
            value={newUserData.password}
            onChange={(e) =>
              setNewUserData({ ...newUserData, password: e.target.value })
            }
          />

          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "center",
              mt: 2,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>

              <Select
                value={newUserData.rol_id || ""}
                label="Rol"
                onChange={(e) => {
                  const selectedRol = e.target.value;
                  const descripcion = getRolDescripcion(selectedRol);

                  setNewUserData({
                    ...newUserData,
                    rol_id: selectedRol,
                    rol_descripcion: descripcion,
                  });
                }}
              >
                <MenuItem value="">
                  <em>Seleccionar rol</em>
                </MenuItem>

                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => setOpenRolModal(true)}
              sx={{
                height: 56,
                px: 2,
                whiteSpace: "nowrap",
              }}
            >
              Nuevo
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseModalPost}>Cancelar</Button>

          <Button variant="contained" onClick={addUser}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <NuevoRolModal
        open={openRolModal}
        onClose={() => setOpenRolModal(false)}
        onCreated={async (nuevoRol) => {
          await fetchRoles();

          setNewUserData((prev) => ({
            ...prev,
            rol_id: nuevoRol.id,
            rol_descripcion: nuevoRol.descripcion,
          }));
        }}
      />
    </div>
  );
};

export default TableUsuarios;
