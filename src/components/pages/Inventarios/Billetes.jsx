import React, { useEffect, useState, useCallback } from "react";
import "../../../estilos/billetes.css";
import SearchIcon from "@mui/icons-material/Search";
import {
  DataGrid,
  GridActionsCellItem,
  GridDeleteIcon,
  GridEditInputCell,
  GridToolbar,
} from "@mui/x-data-grid";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import BulkBilletesButton from "./BulkBilletesButton";
import InfoIcon from "@mui/icons-material/Info";
import DetalleBilleteDialog from "./DetalleBilleteDialog";
import AgregarComponenteDialog from "./AgregarComponenteDialog.jsx";
import ActualizarComponenteDialog from "./ActualizarComponenteDialog.jsx";

const Componentes = () => {
  const [data, setData] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [productoIdComponent, setProductoIdComponent] = useState("");
  const [title, setTitle] = useState("");
  const [titleComponente, setTitleComponente] = useState("");
  const [tipo, setTipo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [productoSku, setProductoSku] = useState("");
  const [productoSkuComponente, setProductoSkuComponente] = useState("");
  const [open, setOpen] = useState(false);
  const [openComponentes, setOpenComponentes] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredProductsComponente, setFilteredProductsComponente] = useState(
    []
  );
  const [rowsProducts, setRowsProducts] = useState([]);
  const [rowsComponentes, setRowsComponentes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermComponente, setSearchTermComponente] = useState("");
  const [openAddComponent, setOpenAddComponent] = useState(false);
  const [inputActivo, setInputActivo] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [reloadKey, setReloadKey] = useState(0);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [billeteSeleccionado, setBilleteSeleccionado] = useState(null);
  const [openAddComp, setOpenAddComp] = useState(false);
  const [billeteParaAgregar, setBilleteParaAgregar] = useState(null);
  const [listaComponentes, setListaComponentes] = useState([]);
  const [openEditComp, setOpenEditComp] = useState(false);
  const [componenteEditando, setComponenteEditando] = useState(null);
  const [listaProveedores, setListaProveedores] = useState([]);
  

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    billete_id: false,
    producto_id: false,
    componente_id: false,
  });

  const [columnVisibilityModelProducts, setColumnVisibilityModelProducts] =
    useState({
      producto_id: false,
      tipo_publicacion: false,
      id: false,
      catalog_id: false,
      variation_id: false,
    });

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      setUser(JSON.parse(localStorage.getItem("user")));
    };

    // Añadir un listener para el evento `storage`
    window.addEventListener("storage", handleStorageChange);

    // Limpieza al desmontar el componente
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  // Estilos del modal
  const modalStyle = {
    position: "absolute",
    width: 1400,
    height: 600,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    borderRadius: 4,
    boxShadow: 24,
    p: 4,
  };

  // Estilos del modal
  const styleAddComponent = {
    position: "absolute",
    width: 300,
    height: 300,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    borderRadius: 4,
    boxShadow: 24,
    p: 4,
  };

  // Función que abre la modal y realiza la búsqueda al hacer clic en el ícono de búsqueda
  const handleOpenSearchProducts = async () => {
    setOpen(true);
  };

  const handleCloseSearchProducts = () => setOpen(false);

  const handleOpenSearchProductsComponentes = async () => {
    setOpenComponentes(true);
  };

  const handleCloseComponentes = () => setOpenComponentes(false);

  const handleOpenAddComponent = async () => {
    setOpenAddComponent(true);
  };

  const handleCloseAddComponent = () => {
    setOpenAddComponent(false);
    setProductoIdComponent("");
    setProductoSkuComponente("");
    setTipo("");
    setCantidad("");
  };

  const handleOpenDetalle = (row) => async () => {
    try {
      // Llamadas en paralelo
      const [detalleRes, componentesRes] = await Promise.all([
        axios.get(`${apiUrl}/billetes/${row.billete_id}/detalle`),
        axios.get(`${apiUrl}/billetes/${row.billete_id}/componentes`),
      ]);

      const detalle = Array.isArray(detalleRes.data.data)
        ? detalleRes.data.data[0]
        : detalleRes.data.data;

      const componentes = componentesRes.data.ok
        ? componentesRes.data.data
        : [];

      setBilleteSeleccionado({
        ...row, // lo que venía de la tabla principal
        ...detalle, // publicacionId, productoTitulo, productoSku, permalink, etc
        componentes, // aquí van los componentes para el DataGrid del diálogo
      });

      setOpenDetalle(true);
    } catch (error) {
      console.error("Error al abrir detalle de billete:", error);
    }
  };

  const handleCloseDetalle = () => {
    setOpenDetalle(false);
    setBilleteSeleccionado(null);
  };

  const handleShowAlertBillete = async ({ type, title, text }) => {
  // 1) Cerramos el dialog
  setOpenDetalle(false);

  // 2) Mostramos el Swal
  await Swal.fire({
    icon: type,         
    title: title,
    text: text,
    timer: type === "success" ? 1500 : undefined,
    showConfirmButton: type !== "success",
  });

  // 3) (Opcional) recargar billetes antes de reabrir
  fetchBilletes();

  // 4) Volvemos a abrir el dialog con el mismo billete
  setOpenDetalle(true);
};

  const handleAfterUpdateCantidad = () => {
  // 1) cerramos el dialog
  setOpenDetalle(false);

  // 2) mostramos el SweetAlert
  Swal.fire({
    icon: "success",
    title: "Actualizado",
    text: "Cantidad actualizada correctamente",
    timer: 1500,
    showConfirmButton: false,
  }).then(() => {
    // 3) (opcional) recargamos data
    fetchBilletes();

    // 4) reabrimos el modal si quieres seguir viendo el mismo billete
    setOpenDetalle(true);
  });
};

  const handleDeleteComponent = async (rowComponente) => {
    const { billeteId, sku, descripcion } = rowComponente;

    setOpenDetalle(false);

    const result = await Swal.fire({
      title: "¿Eliminar componente?",
      html: `
      <p>Se eliminará el siguiente componente del billete:</p>
      <p><strong>SKU:</strong> ${sku || "N/A"}</p>
      <p><strong>Descripción:</strong> ${descripcion || "N/A"}</p>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      setOpenDetalle(true);
      return;
    }

    try {
      const { data } = await axios.delete(
        `${apiUrl}/billetes/${billeteId}/componente`
      );

      if (!data.ok) {
        Swal.fire("Atención", data.message || "No se pudo eliminar", "info");
        setOpenDetalle(true);
        return;
      }

      await Swal.fire({
        title: "Componente eliminado",
        html: `
        <p>Se eliminó correctamente:</p>
        <p><strong>SKU:</strong> ${sku || "N/A"}</p>
        <p><strong>Descripción:</strong> ${descripcion || "N/A"}</p>
      `,
        icon: "success",
      });

      // refrescar componentes: puedes volver a llamar al endpoint de componentes
      const compRes = await axios.get(
        `${apiUrl}/billetes/${billeteSeleccionado.billete_id}/componentes`
      );

      setBilleteSeleccionado((prev) => ({
        ...prev,
        componentes: compRes.data.ok ? compRes.data.data : [],
      }));

      setOpenDetalle(true);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "Error al eliminar el componente del billete";

      Swal.fire("Error", msg, "error");
    }
  };


const handleUpdateComponents= async (row) => {
  try {
    const productoId   = row.producto_id;
    const componenteId = row.componente_id;
    const tipo         = row.tipo;
    const cantidadNum  = Number(row.cantidad);

    if (
      !productoId ||
      !componenteId ||
      !tipo ||
      !Number.isFinite(cantidadNum) ||
      cantidadNum <= 0
    ) {
      return;
    }

    const resp = await axios.put(`${apiUrl}/componentes/billetes/cantidad`, {
      producto_id: productoId,
      componente_id: componenteId,
      tipo,
      cantidad: cantidadNum,
    });

    if (!resp.data || !resp.data.ok) {
      throw new Error(resp.data?.message || "No se pudo actualizar la cantidad");
    }

    const lineaBack = resp.data.data;

    // actualizar el billeteSeleccionado en memoria
    setBilleteSeleccionado((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        componentes: prev.componentes.map((comp) =>
          comp.producto_id === productoId &&
          comp.componente_id === componenteId &&
          comp.tipo === tipo
            ? { ...comp, cantidad: lineaBack.cantidad }
            : comp
        ),
      };
    });
  } catch (error) {
    console.error("Error al actualizar cantidad del componente:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text:
        error.response?.data?.message ||
        error.message ||
        "Error al actualizar cantidad",
    });
  }
};


  const handleCloseAddComponents = () => {
    setOpenAddComp(false);
    setBilleteParaAgregar(null);
  };

  const handleSaveComponente = async (values) => {
    if (!billeteParaAgregar) return;

    // 1) Cerramos los diálogos para que el Swal quede libre
    setOpenAddComp(false);
    setOpenDetalle(false);

    try {
      const { data } = await axios.post(
        `${apiUrl}/billetes/${billeteParaAgregar.billete_id}/componente`,
        {
          sku: values.sku, // identificamos componente existente por SKU
          // si quieres que el usuario pueda definir esto desde el modal:
          cantidad: 1.0,
          tipo: "ensamble",
        }
      );

      if (!data.ok) {
        await Swal.fire(
          "Error",
          data.message || "No se pudo enlazar el componente al billete",
          "error"
        );

        setOpenDetalle(true);
        return;
      }

      await Swal.fire(
        "Componente enlazado",
        `Se enlazó correctamente el componente con SKU ${data.data.sku}`,
        "success"
      );

      // Refrescar componentes del billete
      const compRes = await axios.get(
        `${apiUrl}/billetes/${billeteParaAgregar.billete_id}/componentes`
      );

      setBilleteSeleccionado((prev) => ({
        ...prev,
        componentes: compRes.data.ok ? compRes.data.data : [],
      }));

      setOpenDetalle(true);
      setBilleteParaAgregar(null);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "Error al enlazar el componente al billete";
      await Swal.fire("Error", msg, "error");

      setOpenDetalle(true);
    }
  };

  const handleOpenComponents = async (billete) => {
    setBilleteParaAgregar(billete);

    try {
      // Puedes evitar volver a cargar si ya tienes la lista
      if (listaComponentes.length === 0) {
        const { data } = await axios.get(`${apiUrl}/componentes/todos`);
        if (data.ok) {
          setListaComponentes(data.data || []);
        }
      }

      setOpenAddComp(true);
    } catch (error) {
      console.error("Error al obtener componentes:", error);
      // opcional: Swal de error
    }
  };

  const fetchComponentesBillete = async (billeteId) => {
    const { data } = await axios.get(
      `${apiUrl}/billetes/${billeteId}/componentes`
    );
  };

  const handleSaveUpdateComponent = async (values) => {
    //console.log("✅ Valores que llegan de ActualizarComponenteDialog:", values);

    const {
      componenteId,
      descripcion,
      proveedor_id,
      multiplo,
      factor_conversion,
    } = values;

    // opcional: cerrar el modal de edición para que el Swal no quede atrás
    setOpenEditComp(false);
    setOpenDetalle(false);

    try {
      const { data } = await axios.put(
        `${apiUrl}/billetes/${componenteId}/componente`,
        {
          descripcion,
          proveedor_id,
          multiplo,
          factor_conversion,
        }
      );

      console.log("Respuesta del backend al actualizar componente:", data);

      // si tu endpoint ya devuelve ok=true
      if (data?.ok === false) {
        await Swal.fire(
          "Error",
          data.message || "No se pudo actualizar el componente.",
          "error"
        );
        setOpenDetalle(true);
        return;
      }

      await Swal.fire(
        "Componente actualizado",
        "Los datos del componente se actualizaron correctamente.",
        "success"
      );

      if (billeteSeleccionado?.billete_id) {
        await fetchComponentesBillete(billeteSeleccionado.billete_id);
      }

      setOpenDetalle(true);
    } catch (error) {
      console.error("❌ Error al actualizar componente:", error);

      const msg =
        error?.response?.data?.message || "Error al actualizar el componente.";

      await Swal.fire("Error", msg, "error");
      setOpenDetalle(true);
    }
  };

  const fetchBilleteDetalle = async (billeteId) => {
    try {
      const { data } = await axios.get(
        `${apiUrl}/billetes/${billeteId}/detalle`
      );

      if (data.ok) {
        setBilleteSeleccionado((prev) => ({
          ...prev,
          ...data.data,
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProveedores = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/proveedores/`);

      const proveedores = Array.isArray(data) ? data : [];

      console.log(" Proveedores recibidos:", proveedores); // 👈 AQUI

      setListaProveedores(proveedores);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      // opcional: Swal.fire(...)
    }
  };

  useEffect(() => {
    console.log("🔄 listaProveedores actualizada:");
  }, [listaProveedores]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${apiUrl}/buscador/productos/todo`);
        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          setRowsProducts(response.data);
          setFilteredProducts(response.data);
        } else {
          Swal.fire({
            title: "!Productos no encontrados!",
            text: "No se encontraron productos",
            icon: "error",
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true,
          });
        }
      } catch (error) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          const { messageText } = error.response.data.message;
          Swal.fire({
            title: "Error",
            text: `Error: ${messageText}`,
            icon: "error",
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true,
          });
        }
      }
    };
    if (open) {
      fetchProducts();
    }
  }, [apiUrl, open]);

  useEffect(() => {
    const fetchComponentesTodos = async () => {
      try {
        const response = await axios.get(`${apiUrl}/componentes/todos`);
        if (
          response.data.data &&
          Array.isArray(response.data.data) &&
          response.data.data.length > 0
        ) {
          setRowsComponentes(response.data.data);
          setFilteredProductsComponente(response.data.data);
        } else {
          Swal.fire({
            title: "!Componentes no encontrados!",
            text: "No se encontraron componentes",
            icon: "error",
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true,
          });
        }
      } catch (error) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          const { messageText } = error.response.data.message;
          Swal.fire({
            title: "Error",
            text: `Error: ${messageText}`,
            icon: "error",
            timer: 5000,
            showCloseButton: true,
            allowEscapeKey: true,
          });
        }
      }
    };
    if (openComponentes) {
      fetchComponentesTodos();
    }
  }, [apiUrl, openComponentes]);

  const fetchData = async (productoId) => {
    try {
      // Llamada para obtener componentes
      console.log(
        `Este es el title: ${title} y este es el producto_id: ${productoId}`
      );
      const componentesResponse = await axios.get(
        `${apiUrl}/billetes/${productoId}`
      );
      if (
        componentesResponse.data.data &&
        Array.isArray(componentesResponse.data.data) &&
        componentesResponse.data.data.length > 0
      ) {
        setData(componentesResponse.data.data);
      } else if (
        componentesResponse.data.data &&
        Array.isArray(componentesResponse.data.data) &&
        componentesResponse.data.data.length === 0
      ) {
        setData([]); // Limpiar datos si no hay resultados
      }
      //No entra a esta parte del codigo, se va directo al catch
      console.log(
        `Intentando obtener el título de: ${apiUrl}/billetes/${productoId}/title`
      );
      // Llamada para obtener el título
      const titleResponse = await axios.get(
        `${apiUrl}/billetes/${productoId}/title`
      );
      console.log("Respuesta del título:", titleResponse.data);
      if (
        titleResponse.data &&
        Array.isArray(titleResponse.data) &&
        titleResponse.data.length > 0
      ) {
        setTitle(titleResponse.data[0].title);
      }
    } catch (error) {
      setData([]); // Limpiar datos si no hay resultados
      console.log(
        `Intentando obtener el título de: ${apiUrl}/billetes/${productoId}/title`
      );
      // Llamada para obtener el título
      const titleResponse = await axios.get(
        `${apiUrl}/billetes/${productoId}/title`
      );
      console.log("Respuesta del título:", titleResponse.data);
      if (
        titleResponse.data &&
        Array.isArray(titleResponse.data) &&
        titleResponse.data.length > 0
      ) {
        setTitle(titleResponse.data[0].title);
      }
      const errorMessage = error.response.data.message;
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const fetchDataComponente = async (productoIdComponent) => {
    try {
      // Llamada para obtener componentes
      const componentesResponse = await axios.get(
        `${apiUrl}/billetes/${productoIdComponent}`
      );

      // Llamada para obtener el título
      const titleResponse = await axios.get(
        `${apiUrl}/billetes/${productoIdComponent}/title`
      );
      if (
        titleResponse.data &&
        Array.isArray(titleResponse.data) &&
        titleResponse.data.length > 0
      ) {
        setTitleComponente(titleResponse.data[0].title);
      } else if (
        componentesResponse.data &&
        Array.isArray(componentesResponse.data) &&
        componentesResponse.data.length === 0
      ) {
        setTitleComponente("Producto no encontrado");
      }
    } catch (error) {
      setTitleComponente("");
      setProductoIdComponent("");
      const messageText = error?.response?.data?.message || "Error desconocido";
      Swal.fire({
        title: "Error",
        text: `Error: ${messageText}`,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const fetchsku = async (productoSku) => {
    try {
      const response = await axios.get(
        `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoSku}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Si llega aquí, significa que hay un resultado válido en el array
      if (Array.isArray(response.data) && response.data.length === 1) {
        const producto = response.data[0]; // Accede al único producto
        setProductoId(producto.producto_id);
        setProductoSku(producto.sku);
        await fetchData(producto.producto_id);
      } else {
        // Para cuando el array no tiene exactamente un elemento
        setSearchTerm(productoSku);
        setOpen(true);
      }
    } catch (error) {
      // Maneja el caso específico de "Producto no encontrado"
      if (
        error.response &&
        error.response.data &&
        error.response.data.message === "Producto no encontrado"
      ) {
        setSearchTerm(productoSku);
        setOpen(true);
      } else if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        // Otros mensajes de error
        const errorMessage = error.response.data.message;
        Swal.fire({
          title: "Error",
          text: errorMessage,
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      } else {
        Swal.fire({
          title: "Error",
          text: "Error en la comunicación con el servidor.",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      }
    }
  };

  const fetchskuComponente = async (productoSkuComponente) => {
    try {
      const response = await axios.get(
        `${apiUrl}/inventario/ordenBodegas_y_lineasBodegas/producto/${productoSkuComponente}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Si llega aquí, significa que hay un resultado válido en el array
      if (Array.isArray(response.data) && response.data.length === 1) {
        const producto = response.data[0]; // Accede al único producto
        setProductoIdComponent(producto.producto_id);
        setProductoSkuComponente(producto.sku);
        await fetchDataComponente(productoIdComponent);
      } else {
        // Para cuando el array no tiene exactamente un elemento
        setSearchTermComponente(productoSkuComponente);
        setOpenComponentes(true);
      }
    } catch (error) {
      // Maneja el caso específico de "Producto no encontrado"
      if (
        error.response &&
        error.response.data &&
        error.response.data.message === "Producto no encontrado"
      ) {
        setSearchTermComponente(productoSkuComponente);
        setOpenComponentes(true);
      } else if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        // Otros mensajes de error
        const errorMessage = error.response.data.message;
        Swal.fire({
          title: "Error",
          text: errorMessage,
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      } else {
        Swal.fire({
          title: "Error",
          text: "Error en la comunicación con el servidor.",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      }
    }
  };

  const addComponent = async () => {
    try {
      const data = {
        producto_id: productoId,
        componente_id: productoIdComponent,
        cantidad: cantidad,
        tipo: tipo,
      };
      console.log("Esto es lo que se manda al post:", data);
      const response = await axios.post(
        `${apiUrl}/billetes/addComponente/${productoId}`,
        data
      );
      if (response.data) {
        const message = response.data.message;
        Swal.fire({
          title: "Registrado!",
          text: message,
          icon: "success",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      }
      fetchData(productoId);
      handleCloseAddComponent();
    } catch (error) {
      const errorMessage = error.response.data.message;
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
      handleCloseAddComponent();
    }
  };

  const processRowUpdate = async (newRow, oldRow) => {
    try {
      // Enviar la actualización al backend
      const response = await axios.put(
        `${apiUrl}/billetes/${newRow.billete_id}`,
        {
          cantidad: newRow.cantidad,
        }
      );

      if (response.data.ok) {
        Swal.fire({
          title: "Actualizado!",
          text: response.data.message,
          icon: "success",
          timer: 3000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
        return newRow; // Devuelve la fila actualizada
      }
    } catch (error) {
      // Capturar errores del backend
      const errorMessage = error.response?.data?.message || "Error desconocido";

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });

      return oldRow; // Revertir cambios en la UI
    }
  };

  const handleKeyDown = (event) => {
    console.log("Tecla presionada:", event.key, "SKU:", productoSku); // <-- Verifica el valor
    if (
      event.key === "Enter" ||
      event.key === "Tab" ||
      event.type === "click"
    ) {
      if (productoSku.trim() === "") {
        setData([]); // Limpia los datos si el productoId está vacío
        setTitle("");
        return;
      }
      fetchsku(productoSku);
    }
  };

  const handleBlur = () => {
    if (productoSku.trim()) {
      fetchsku(productoSku);
    }
  };

  const handleKeyDownComponent = (event) => {
    console.log("Tecla presionada:", event.key, "SKU:", productoSkuComponente); // <-- Verifica el valor
    if (
      event.key === "Enter" ||
      event.key === "Tab" ||
      event.type === "click"
    ) {
      if (productoSkuComponente.trim() === "") {
        return;
      }
      fetchskuComponente(productoSkuComponente);
    }
  };

  const handleBlurComponent = () => {
    if (productoSkuComponente.trim()) {
      fetchskuComponente(productoSkuComponente);
    }
  };

  const handleProductId = (event) => {
    const sku = event.target.value;
    setProductoSku(sku);
    setSearchTerm(sku);
  };

  const handleProductIdComponent = (event) => {
    const skuComponente = event.target.value;
    setProductoSkuComponente(skuComponente);
    setSearchTermComponente(skuComponente);
  };

  const handleRowSelection = (params) => {
    const selectedProduct = rowsProducts.find(
      (product) => product.producto_id === params.row.producto_id
    );

    if (selectedProduct) {
      setProductoSku(selectedProduct.sku);
      setProductoId(selectedProduct.producto_id);
      fetchData(selectedProduct.producto_id);
      setOpen(false);
    }
  };

  const handleRowSelectionComponente = (params) => {
    const selectedProductComponente = rowsComponentes.find(
      (component) => component.componente_id === params.row.componente_id
    );

    if (selectedProductComponente) {
      setProductoSkuComponente(selectedProductComponente.sku);
      setProductoIdComponent(selectedProductComponente.componente_id);
      setOpenComponentes(false);
    }
  };

  const handleChangeTipo = (e) => {
    setTipo(e.target.value);
  };

  const handleChangeCantidad = (e) => {
    setCantidad(parseInt(e.target.value, 10) || 0);
  };

  const deleteComponent = (billete_id) => async (e) => {
    try {
      Swal.fire({
        title: "¿Estás seguro?",
        text: "¡No podrás revertir esto!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminarlo",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            console.log("Este es el id del billete a eliminar:", billete_id);
            await axios.delete(`${apiUrl}/billetes/${billete_id}`);
            fetchData(productoId);

            Swal.fire({
              title: "¡Eliminado!",
              text: "Tu línea ha sido eliminada.",
              icon: "success",
            });
          } catch (error) {
            const errorMessage = error.response.data.message;
            Swal.fire({
              title: "Error",
              text: errorMessage,
              icon: "error",
              timer: 5000,
              showCloseButton: true,
              allowEscapeKey: true,
            });
          }
        } else if (result.isDenied) {
          Swal.fire("¡No se ha eliminado el componente!", "", "info");
        }
      });
    } catch (error) {
      const errorMessage = error.response.data.message;
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const fetchBilletes = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/billetes`);
      if (response?.data?.ok && Array.isArray(response.data.data)) {
        setData(response.data.data);
      } else {
        Swal.fire({
          title: "¡Billetes no encontrados!",
          text: "No se encontraron registros",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error?.response?.data?.message || "Error al obtener billetes",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchBilletes();
  }, [fetchBilletes, reloadKey]); // <- se re-ejecuta cuando subes archivo OK

  // Este callback se lo pasas al botón; lo llamas cuando el upload termina bien
  const handleBulkSuccess = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    // Filtra los productos en base al término de búsqueda
    let filtered = rowsProducts;

    if (searchTerm) {
      const searchWords = searchTerm
        .toLowerCase()
        .split(" ")
        .filter((word) => word);

      filtered = filtered.filter((product) => {
        const productMLM = product.id ? product.id.toLowerCase() : "";
        const productCatalog = product.catalog_id
          ? product.catalog_id.toLowerCase()
          : "";
        const productTitle = product.title ? product.title.toLowerCase() : "";
        const productSku = product.sku ? product.sku.toLowerCase() : "";
        const productVariation = product.variation_id
          ? product.variation_id.toLowerCase()
          : "";
        const productInventoryId = product.inventory_id
          ? product.inventory_id.toLowerCase()
          : "";
        const productVariationDesc = product.variation_desc
          ? product.variation_desc.toLowerCase()
          : "";

        // Verifica si todas las palabras están en el título
        const titleMatch = searchWords.every((word) =>
          productTitle.includes(word)
        );

        // Verifica si el término de búsqueda está en otras columnas
        const otherColumnsMatch =
          productMLM.includes(searchTerm.toLowerCase()) ||
          productCatalog.includes(searchTerm.toLowerCase()) ||
          // productTitle.includes(searchTerm.toLowerCase()) ||
          productSku.includes(searchTerm.toLowerCase()) ||
          productVariation.includes(searchTerm.toLowerCase()) ||
          productInventoryId.includes(searchTerm.toLowerCase()) ||
          productVariationDesc.includes(searchTerm.toLowerCase());

        // El producto debe coincidir en el título o en alguna de las otras columnas
        return titleMatch || otherColumnsMatch;
      });
    }

    setFilteredProducts(filtered);
  }, [searchTerm, rowsProducts]);

  useEffect(() => {
    // Filtra los productos en base al término de búsqueda
    let filtered = rowsComponentes;

    if (searchTermComponente) {
      const searchWords = searchTermComponente
        .toLowerCase()
        .split(" ")
        .filter((word) => word);

      filtered = filtered.filter((component) => {
        const productTitle = component.descripcion
          ? component.descripcion.toLowerCase()
          : "";
        const productSku = component.sku ? component.sku.toLowerCase() : "";
        const productProveedor = component.razon_social
          ? component.razon_social.toLowerCase()
          : "";
        const productTipo = component.tipo ? component.tipo.toLowerCase() : "";

        // Verifica si todas las palabras están en el título
        const titleMatch = searchWords.every((word) =>
          productTitle.includes(word)
        );

        // Verifica si el término de búsqueda está en otras columnas
        const otherColumnsMatch =
          productSku.includes(searchTermComponente.toLowerCase()) ||
          productProveedor.includes(searchTermComponente.toLowerCase()) ||
          productTipo.includes(searchTermComponente.toLowerCase());

        // El producto debe coincidir en el título o en alguna de las otras columnas
        return titleMatch || otherColumnsMatch;
      });
    }

    setFilteredProductsComponente(filtered);
  }, [searchTermComponente, rowsComponentes]);

  const columnsProducts = [
    {
      field: "select",
      headerName: "Seleccionar",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          disabled={
            !rowsProducts.some(
              (product) => product.producto_id === params.row.producto_id
            )
          }
          onClick={() => handleRowSelection(params)}
        >
          Seleccionar
        </Button>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "producto_id",
      headerName: "ID producto",
      type: "number",
      flex: 1,
    },
    {
      field: "tipo_publicacion",
      headerName: "Tipo\npublicación",
      type: "number",
      flex: 1,
      headerClassName: "header-wrap",
      headerAlign: "center",
    },
    { field: "id", headerName: "#Publicación", type: "text", flex: 1 },
    { field: "catalog_id", headerName: "#Catalogo", type: "text", flex: 1 },
    { field: "title", headerName: "Titulo", type: "text", flex: 3 },
    {
      field: "sku",
      headerName: "SKU",
      type: "text",
      flex: 2,
      headerAlign: "center",
    },
    {
      field: "variation_id",
      headerName: "#Variación",
      type: "number",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "inventory_id",
      headerName: "ML",
      type: "text",
      flex: 1,
      headerAlign: "center",
    },
    { field: "variation_desc", headerName: "Variante", type: "text", flex: 1 },
  ];

  const columnsProductsComponentes = [
    {
      field: "select",
      headerName: "Seleccionar",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          disabled={
            !rowsComponentes.some(
              (component) =>
                component.componente_id === params.row.componente_id
            )
          }
          onClick={() => handleRowSelectionComponente(params)}
        >
          Seleccionar
        </Button>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "componente_id",
      headerName: "ID Componente",
      type: "number",
      flex: 1,
    },
    {
      field: "sku",
      headerName: "SKU",
      type: "text",
      flex: 2,
      headerClassName: "header-wrap",
      headerAlign: "center",
    },
    { field: "descripcion", headerName: "Descripcion", type: "text", flex: 3 },
    { field: "razon_social", headerName: "Proveedor", type: "text", flex: 1 },
  ];

  const columns = [
    {
      field: "billete_id",
      headerName: "ID",
      type: "number",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "producto_id",
      headerName: "# De producto",
      type: "number",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "componente_id",
      headerName: "# De componente",
      type: "text",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "sku",
      headerName: "SKU Componente",
      type: "text",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "descripcion",
      headerName: "Descripcion",
      type: "number",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "cantidad",
      headerName: "Cantidad",
      type: "number",
      flex: 1,
      headerAlign: "center",
      editable: true,
      cellClassName: "celdaEditable",
      renderEditCell: (params) => {
        return (
          <GridEditInputCell
            {...params}
            type="number"
            inputProps={{
              min: 1,
            }}
            onWheel={(e) => e.target.blur()}
          />
        );
      },
      preProcessEditCellProps: (params) => {
        const { props } = params;

        // Asegurar que el valor sea al menos 0
        const value = Math.max(1, props.value);

        const isValid = /^[1-9]+$/.test(value);

        return {
          ...props,
          value, // Forzar el valor a 0 si es menor
          error: !isValid, // Marca la celda con error si la validación falla
        };
      },
    },
    {
      field: "tipo",
      headerName: "Tipo",
      type: "text",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => {
        return [
          <Tooltip
            title="Ver detalles del billete"
            key={`details-${params.id}`}
          >
            <GridActionsCellItem
              icon={<InfoIcon />}
              label="Detalles"
              onClick={handleOpenDetalle(params.row)}
            />
          </Tooltip>,

          <Tooltip
            title="Borrar componente del billete"
            key={`delete-${params.row.billete_id}`}
          >
            <GridActionsCellItem
              icon={<GridDeleteIcon />}
              sx={{ color: "red" }}
              onClick={deleteComponent(params.row.billete_id)}
              label="Eliminar"
            />
          </Tooltip>,
        ];
      },
    },
  ];

  return (
    <div>
      {/* Ventana Modal componentes*/}
      <DetalleBilleteDialog
        open={openDetalle}
        onClose={handleCloseDetalle}
        billete={billeteSeleccionado}
        onDeleteComponent={handleDeleteComponent}
        onAddComponent={handleOpenComponents}
        onShowAlert={handleShowAlertBillete}
      />

      {/* Ventana Modal Agregar componente*/}
      <AgregarComponenteDialog
        open={openAddComp}
        onClose={handleCloseAddComponents}
        onSave={handleSaveComponente}
        listaComponentes={listaComponentes}
      />

      {/* Ventana Modal actualizar componente*/}
      <ActualizarComponenteDialog
        open={openEditComp}
        onClose={() => setOpenEditComp(false)}
        componente={componenteEditando}
        onSave={handleSaveUpdateComponent}
        listaProveedores={listaProveedores}
      />

      {/* Ventana Modal Productos*/}
      <Modal open={open} onClose={handleCloseSearchProducts}>
        <Box sx={modalStyle}>
          <TextField
            label="Buscador..."
            color="primary"
            focused
            sx={{ width: "20rem", marginBottom: "10px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ width: "100%", height: 500, overflowX: "auto" }}>
            <div style={{ minWidth: columnsProducts.length * 160 }}>
              <DataGrid
                sx={{
                  borderRadius: 4,
                  boxShadow: 24,
                  borderWidth: 3,
                  borderColor: "#1e88e5",
                }}
                rows={filteredProducts}
                columns={columnsProducts}
                pageSize={5}
                showCellVerticalBorder
                showColumnVerticalBorder
                getRowId={(row) => row.producto_id}
                experimentalFeatures={{ newEditingApi: true }}
                columnVisibilityModel={columnVisibilityModelProducts}
                onColumnVisibilityModelChange={(newModel) =>
                  setColumnVisibilityModelProducts(newModel)
                }
                density="compact" // Establece el tamaño de las filas en compacto por defecto
                slots={{ toolbar: GridToolbar }}
                autoWidth
              />
            </div>
          </div>
          <Button
            onClick={handleCloseSearchProducts}
            variant="contained"
            color="primary"
            sx={{
              marginTop: "10px",
              marginLeft: "93%",
            }}
          >
            Cerrar
          </Button>
        </Box>
      </Modal>
      {/* Ventana Modal Componentes*/}
      <Modal open={openComponentes} onClose={handleCloseComponentes}>
        <Box sx={modalStyle}>
          <TextField
            label="Buscador..."
            color="primary"
            focused
            sx={{ width: "20rem", marginBottom: "10px" }}
            value={searchTermComponente}
            onChange={(e) => setSearchTermComponente(e.target.value)}
          />
          <div style={{ width: "100%", height: "85%", overflowX: "auto" }}>
            <DataGrid
              style={{
                fontFamily: "Montserrat",
                fontWeight: "bold",
                width: "100%",
              }}
              sx={{
                borderRadius: 4,
                boxShadow: 24,
                borderWidth: 3,
                borderColor: "#1e88e5",
              }}
              rows={filteredProductsComponente}
              columns={columnsProductsComponentes}
              pageSize={5}
              showCellVerticalBorder
              showColumnVerticalBorder
              getRowId={(row) => row.componente_id}
              experimentalFeatures={{ newEditingApi: true }}
              density="compact" // Establece el tamaño de las filas en compacto por defecto
              columnVisibilityModel={{
                variation_id: false,
                componente_id: false,
              }}
            />
          </div>
          <Button
            onClick={handleCloseComponentes}
            variant="contained"
            color="primary"
            sx={{
              marginTop: "10px",
              marginLeft: "93%",
            }}
          >
            Cerrar
          </Button>
        </Box>
      </Modal>
      <div className="contenedor-billetes">
        <div className="buscador-productos">
          <label className="label">Producto:</label>
          <TextField
            className="input"
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            value={productoSku}
            onChange={handleProductId}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon
                    style={{
                      cursor: "pointer",
                      color: "blue",
                    }}
                    onClick={handleOpenSearchProducts}
                  />
                </InputAdornment>
              ),
            }}
            InputLabelProps={{
              style: {
                transform: "translate(10px, 8px)", // Ajusta la posición del label
              },
            }}
            inputProps={{
              style: {
                width: "20rem",
                height: "5px", // Altura interna del input
                backgroundColor: "white",
                color: "black",
              },
            }}
          />
          <label className="label">Título: {title}</label>
        </div>
      </div>
      <div className="DataG" style={{ height: 500, width: "90%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <Box sx={{ ml: "auto" }}>
            <BulkBilletesButton onSuccess={handleBulkSuccess} />
          </Box>
          <Button
            variant="contained"
            style={{
              marginLeft: "auto",
              marginBottom: "10px",
            }}
            onClick={handleOpenAddComponent}
          >
            Agregar billete
          </Button>
        </div>
        <DataGrid
          sx={{
            borderRadius: 4,
            boxShadow: 24,
            borderWidth: 3,
            borderColor: "#1e88e5",
          }}
          rows={data}
          columns={columns}
          showCellVerticalBorder
          showColumnVerticalBorder
          getRowId={(row) => row.billete_id}
          processRowUpdate={processRowUpdate}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) =>
            setColumnVisibilityModel(newModel)
          }
          experimentalFeatures={{ newEditingApi: true }}
          density="compact" // Establece el tamaño de las filas en compacto por defecto
          slots={{ toolbar: GridToolbar }}
        />
      </div>
      {/* Ventana Modal ADD Componente*/}
      <Modal open={openAddComponent} onClose={handleCloseAddComponent}>
        <Box sx={styleAddComponent}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography
              sx={{
                fontFamily: "Montserrat",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Agregar nuevo billete
            </Typography>
            <TextField
              className="input"
              onKeyDown={handleKeyDownComponent}
              onBlur={handleBlurComponent}
              label="Componente"
              variant="outlined"
              value={productoSkuComponente}
              onChange={handleProductIdComponent}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon
                      style={{
                        cursor: "pointer",
                        color: "blue",
                      }}
                      onClick={handleOpenSearchProductsComponentes}
                    />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                style: {
                  backgroundColor: "white",
                  color: "black",
                },
              }}
            />
            <TextField
              className="input"
              label="Cantidad"
              variant="outlined"
              type="number"
              value={cantidad}
              onChange={handleChangeCantidad}
              inputProps={{
                style: {
                  backgroundColor: "white",
                  color: "black",
                },
              }}
            />
            <FormControl>
              <InputLabel id="select-tipo-label">Tipo</InputLabel>
              <Select
                labelId="select-tipo-label"
                id="select-tipo"
                value={tipo}
                label="Tipo"
                onChange={handleChangeTipo}
                inputProps={{
                  style: {
                    backgroundColor: "white",
                    color: "black",
                  },
                }}
              >
                <MenuItem value={"Inventario"}>Inventario</MenuItem>
                <MenuItem value={"Costo"}>Costo</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: "40px",
            }}
          >
            <Button
              onClick={handleCloseAddComponent}
              variant="contained"
              color="primary"
            >
              Cerrar
            </Button>
            <Button onClick={addComponent} variant="contained" color="success">
              Guardar
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Componentes;
