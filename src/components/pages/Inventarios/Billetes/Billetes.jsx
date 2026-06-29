import React, { useEffect, useState, useCallback } from "react";
import "../../../../estilos/billetes.css";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import BulkBilletesButton from "./BulkBilletesButton";
import DetalleBilleteDialog from "./DetalleBilleteDialog";
import AgregarComponenteDialog from "../Componentes/AgregarComponenteDialog.jsx";
import ActualizarComponenteDialog from "../Componentes/ActualizarComponenteDialog.jsx";

import BuscarProductoModal from "./BuscarProductoModal";
import BuscarComponenteModal from "./BuscarComponenteModal";
import AgregarBilleteModal from "./AgregarBilleteModal";

import { getBilletesColumns } from "./billetesColumns";
import { getProductosColumns } from "./productosColumns";
import { getComponentesBilleteColumns } from "./componentesBilleteColumns";
import UbicacionesComponenteModal from "./UbicacionesComponenteModal";

import BilletesToolbar from "./BilletesToolbar";

const Billetes = () => {
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
  const [loadingBilletes, setLoadingBilletes] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredProductsComponente, setFilteredProductsComponente] = useState(
    [],
  );
  const [rowsProducts, setRowsProducts] = useState([]);
  const [rowsComponentes, setRowsComponentes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermComponente, setSearchTermComponente] = useState("");
  const [openAddBillete, setOpenAddBillete] = useState(false);
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

  const [openUbicaciones, setOpenUbicaciones] = useState(false);
  const [ubicacionesComponente, setUbicacionesComponente] = useState([]);
  const [componenteUbicaciones, setComponenteUbicaciones] = useState(null);

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

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const handleOpenSearchProducts = async () => {
    setOpen(true);
  };

  const handleCloseSearchProducts = () => setOpen(false);

  const handleOpenSearchProductsComponentes = async () => {
    setOpenComponentes(true);
  };

  const handleCloseComponentes = () => setOpenComponentes(false);

  const handleOpenAddBillete = () => {
    if (!productoId) {
      Swal.fire({
        title: "Error",
        text: "Primero debes seleccionar un producto.",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
      return;
    }

    setProductoIdComponent("");
    setTitleComponente("");
    setProductoSkuComponente("");
    setCantidad("");
    setTipo("inventario");
    setOpenAddBillete(true);
  };

  const handleCloseAddBillete = () => {
    setOpenAddBillete(false);
    setProductoIdComponent("");
    setCantidad("");
    setTipo("inventario");
    setTitleComponente("");
    setProductoSkuComponente("");
  };

  const handleResetBilletes = async () => {
    try {
      setProductoId("");
      setProductoSku("");
      setTitle("");
      setProductoIdComponent("");
      setProductoSkuComponente("");
      setTitleComponente("");
      setCantidad("");
      setTipo("");

      await fetchBilletes();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "No se pudo recargar la lista completa de billetes.",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const handleOpenDetalle = (row) => async () => {
    try {
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

      const componentesCompartidos = componentes.filter(
        (c) => Number(c.totalProductosUso || 0) > 1,
      );

      const ubicacionesCompartidas = await Promise.all(
        componentesCompartidos.map(async (comp) => {
          const { data } = await axios.get(
            `${apiUrl}/billetes/componente/${comp.componenteId}/ubicaciones`,
          );

          return {
            componenteId: comp.componenteId,
            sku: comp.sku,
            descripcion: comp.descripcion,
            totalProductosUso: comp.totalProductosUso,
            ubicaciones: data?.data || [],
          };
        }),
      );

      setBilleteSeleccionado({
        ...row,
        ...detalle,
        componentes,
        ubicacionesCompartidas,
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
    setOpenDetalle(false);

    await Swal.fire({
      icon: type,
      title,
      text,
      timer: type === "success" ? 1500 : undefined,
      showConfirmButton: type !== "success",
    });

    fetchBilletes();
    setOpenDetalle(true);
  };

  const handleAfterUpdateCantidad = () => {
    setOpenDetalle(false);

    Swal.fire({
      icon: "success",
      title: "Actualizado",
      text: "Cantidad actualizada correctamente",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      fetchBilletes();
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
        `${apiUrl}/billetes/${billeteId}/componente`,
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

      const compRes = await axios.get(
        `${apiUrl}/billetes/${billeteSeleccionado.billete_id}/componentes`,
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

  const handleUpdateComponents = async (row) => {
    try {
      const productoId = row.producto_id;
      const componenteId = row.componente_id;
      const tipo = row.tipo;
      const cantidadNum = Number(row.cantidad);

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
        throw new Error(
          resp.data?.message || "No se pudo actualizar la cantidad",
        );
      }

      const lineaBack = resp.data.data;

      setBilleteSeleccionado((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          componentes: prev.componentes.map((comp) =>
            comp.producto_id === productoId &&
            comp.componente_id === componenteId &&
            comp.tipo === tipo
              ? { ...comp, cantidad: lineaBack.cantidad }
              : comp,
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

  const handleSelectProductoFromDetalle = async (producto) => {
    setOpenDetalle(false);

    setProductoId(producto.producto_id);
    setProductoSku(producto.producto_sku || "");
    setTitle(producto.producto_title || "");

    await fetchData(producto.producto_id);
  };

  const handleSaveComponente = async (values) => {
    if (!billeteParaAgregar) return;

    setOpenAddComp(false);
    setOpenDetalle(false);

    try {
      const { data } = await axios.post(
        `${apiUrl}/billetes/${billeteParaAgregar.billete_id}/componente`,
        {
          sku: values.sku,
          cantidad: 1.0,
          tipo: "ensamble",
        },
      );

      if (!data.ok) {
        await Swal.fire(
          "Error",
          data.message || "No se pudo enlazar el componente al billete",
          "error",
        );

        setOpenDetalle(true);
        return;
      }

      await Swal.fire(
        "Componente enlazado",
        `Se enlazó correctamente el componente con SKU ${data.data.sku}`,
        "success",
      );

      const compRes = await axios.get(
        `${apiUrl}/billetes/${billeteParaAgregar.billete_id}/componentes`,
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
      if (listaComponentes.length === 0) {
        const { data } = await axios.get(`${apiUrl}/componentes/todos`);
        if (data.ok) {
          setListaComponentes(data.data || []);
        }
      }

      setOpenAddComp(true);
    } catch (error) {
      console.error("Error al obtener componentes:", error);
    }
  };

  const fetchComponentesBillete = async (billeteId) => {
    await axios.get(`${apiUrl}/billetes/${billeteId}/componentes`);
  };

  const handleSaveUpdateComponent = async (values) => {
    const {
      componenteId,
      descripcion,
      proveedor_id,
      multiplo,
      factor_conversion,
    } = values;

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
        },
      );

      if (data?.ok === false) {
        await Swal.fire(
          "Error",
          data.message || "No se pudo actualizar el componente.",
          "error",
        );
        setOpenDetalle(true);
        return;
      }

      await Swal.fire(
        "Componente actualizado",
        "Los datos del componente se actualizaron correctamente.",
        "success",
      );

      if (billeteSeleccionado?.billete_id) {
        await fetchComponentesBillete(billeteSeleccionado.billete_id);
      }

      setOpenDetalle(true);
    } catch (error) {
      console.error("Error al actualizar componente:", error);

      const msg =
        error?.response?.data?.message || "Error al actualizar el componente.";

      await Swal.fire("Error", msg, "error");
      setOpenDetalle(true);
    }
  };

  const fetchBilleteDetalle = async (billeteId) => {
    try {
      const { data } = await axios.get(
        `${apiUrl}/billetes/${billeteId}/detalle`,
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
      setListaProveedores(proveedores);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
    }
  };

  useEffect(() => {
    console.log("listaProveedores actualizada:");
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
            title: "¡Productos no encontrados!",
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
            title: "¡Componentes no encontrados!",
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
    if (!productoId) {
      await fetchBilletes();
      setTitle("");
      return;
    }

    try {
      const [componentesResponse, titleResponse] = await Promise.all([
        axios.get(`${apiUrl}/billetes/${productoId}`),
        axios.get(`${apiUrl}/billetes/${productoId}/title`),
      ]);

      const componentesData = componentesResponse.data;

      if (Array.isArray(componentesData.data)) {
        setData(componentesData.data);
      } else {
        setData([]);
      }

      if (
        titleResponse.data &&
        Array.isArray(titleResponse.data) &&
        titleResponse.data.length > 0
      ) {
        setTitle(titleResponse.data[0].title);
      } else {
        setTitle("");
      }

      if (componentesData.warning) {
        Swal.fire({
          title: "Producto sin billete",
          text: componentesData.warning,
          icon: "info",
          timer: 4000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      }
    } catch (error) {
      setData([]);
      setTitle("");

      const errorMessage =
        error?.response?.data?.message ||
        "Error al obtener información del producto";

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
    if (!productoIdComponent) {
      setTitleComponente("");
      return;
    }

    try {
      const componentesResponse = await axios.get(
        `${apiUrl}/billetes/${productoIdComponent}`,
      );

      const titleResponse = await axios.get(
        `${apiUrl}/billetes/${productoIdComponent}/title`,
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
        },
      );

      if (Array.isArray(response.data) && response.data.length === 1) {
        const producto = response.data[0];
        setProductoId(producto.producto_id);
        setProductoSku(producto.sku);
        await fetchData(producto.producto_id);
      } else {
        setSearchTerm(productoSku);
        setOpen(true);
      }
    } catch (error) {
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
        },
      );

      if (Array.isArray(response.data) && response.data.length === 1) {
        const producto = response.data[0];
        setProductoIdComponent(producto.componente_id || producto.producto_id);
        setProductoSkuComponente(producto.sku);
        await fetchDataComponente(
          producto.producto_id || producto.componente_id,
        );
      } else {
        setSearchTermComponente(productoSkuComponente);
        setOpenComponentes(true);
      }
    } catch (error) {
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

  const addBillete = async () => {
    try {
      if (!productoId) {
        Swal.fire({
          title: "Error",
          text: "No se encontró el producto_id para agregar el componente.",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
        return;
      }

      if (!productoIdComponent) {
        Swal.fire({
          title: "Error",
          text: "Debes seleccionar un componente.",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
        return;
      }

      if (!cantidad || Number(cantidad) <= 0) {
        Swal.fire({
          title: "Error",
          text: "La cantidad debe ser mayor a 0.",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
        return;
      }

      if (!tipo) {
        Swal.fire({
          title: "Error",
          text: "Debes seleccionar un tipo.",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
        return;
      }

      const payload = {
        componente_id: productoIdComponent,
        cantidad,
        tipo,
      };

      const response = await axios.post(
        `${apiUrl}/billetes/addComponente/${productoId}`,
        payload,
      );

      Swal.fire({
        title: "Registrado",
        text: response.data.message,
        icon: "success",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });

      fetchData(productoId);
      handleCloseAddBillete();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Error al agregar componente";

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

  const processRowUpdate = async (newRow, oldRow) => {
    try {
      const response = await axios.put(
        `${apiUrl}/billetes/${newRow.billete_id}`,
        {
          cantidad: newRow.cantidad,
        },
      );

      if (response.data.ok) {
        Swal.fire({
          title: "Actualizado",
          text: response.data.message,
          icon: "success",
          timer: 3000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
        return newRow;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error desconocido";

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });

      return oldRow;
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === "Tab" ||
      event.type === "click"
    ) {
      if (productoSku.trim() === "") {
        setData([]);
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
      (product) => product.producto_id === params.row.producto_id,
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
      (component) => component.componente_id === params.row.componente_id,
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

  const deleteBillete = (row) => async () => {
    try {
      // Si hay producto seleccionado, borrar solo esa línea y recargar ese producto
      if (productoId) {
        const result = await Swal.fire({
          title: "¿Estás seguro?",
          text: "Se eliminará este componente del producto seleccionado.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        const { data } = await axios.delete(
          `${apiUrl}/billetes/${row.billete_id}`,
        );

        await fetchData(productoId);

        await Swal.fire({
          title: data?.warning ? "Eliminado con advertencia" : "Eliminado",
          text: data?.message || "La línea fue eliminada.",
          icon: data?.warning ? "warning" : "success",
        });

        return;
      }

      // Si NO hay producto seleccionado, abrir modal con ubicaciones
      if (!row?.componente_id) {
        Swal.fire("Error", "No se encontró el componente_id.", "error");
        return;
      }

      const { data } = await axios.get(
        `${apiUrl}/billetes/componente/${row.componente_id}/ubicaciones`,
      );

      setComponenteUbicaciones(row);
      setUbicacionesComponente(data?.data || []);
      setOpenUbicaciones(true);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        "Error al eliminar/buscar ubicaciones";

      Swal.fire("Error", errorMessage, "error");
    }
  };

  const handleEliminarUbicacion = async (ubicacion) => {
    setOpenUbicaciones(false);

    const esUltimoComponente =
      Number(ubicacion.total_componentes_producto || 0) <= 1;

    const result = await Swal.fire({
      title: esUltimoComponente
        ? "Este es el único componente del producto"
        : "¿Eliminar relación?",
      html: `
      <p>Se eliminará este componente del producto:</p>
      <p><b>${ubicacion.producto_title || "Sin título"}</b></p>
      <p><b>Tipo:</b> ${ubicacion.tipo}</p>
      <p><b>Cantidad:</b> ${ubicacion.cantidad}</p>

      ${
        esUltimoComponente
          ? `<hr />
             <p style="color:#d97706;">
               <b>Advertencia:</b> este producto quedará sin componentes/billetes asociados.
             </p>`
          : ""
      }
    `,
      icon: esUltimoComponente ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: esUltimoComponente
        ? "Sí, eliminar aunque quede vacío"
        : "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      setOpenUbicaciones(true);
      return;
    }

    try {
      const { data } = await axios.delete(
        `${apiUrl}/billetes/${ubicacion.billete_id}`,
      );

      setUbicacionesComponente((prev) =>
        prev.filter((item) => item.billete_id !== ubicacion.billete_id),
      );

      await fetchBilletes();

      Swal.fire({
        title: data?.warning ? "Eliminado con advertencia" : "Eliminado",
        text: data?.message || "Relación eliminada correctamente.",
        icon: data?.warning ? "warning" : "success",
      });
    } catch (error) {
      const msg =
        error?.response?.data?.message || "No se pudo eliminar la relación";

      Swal.fire("Error", msg, "error");
      setOpenUbicaciones(true);
    }
  };

  const fetchBilletes = useCallback(async () => {
    setLoadingBilletes(true);
    try {
      const response = await axios.get(`${apiUrl}/billetes`);
      if (response?.data?.ok && Array.isArray(response.data.data)) {
        setData(response.data.data);
      } else {
        setData([]);

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
      setData([]);

      Swal.fire({
        title: "Error",
        text: error?.response?.data?.message || "Error al obtener billetes",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    } finally {
      setLoadingBilletes(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchBilletes();
  }, [fetchBilletes, reloadKey]);

  const handleBulkSuccess = () => setReloadKey((k) => k + 1);

  useEffect(() => {
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

        const titleMatch = searchWords.every((word) =>
          productTitle.includes(word),
        );

        const otherColumnsMatch =
          productMLM.includes(searchTerm.toLowerCase()) ||
          productCatalog.includes(searchTerm.toLowerCase()) ||
          productSku.includes(searchTerm.toLowerCase()) ||
          productVariation.includes(searchTerm.toLowerCase()) ||
          productInventoryId.includes(searchTerm.toLowerCase()) ||
          productVariationDesc.includes(searchTerm.toLowerCase());

        return titleMatch || otherColumnsMatch;
      });
    }

    setFilteredProducts(filtered);
  }, [searchTerm, rowsProducts]);

  useEffect(() => {
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
        const proveedorPrincipal = component.proveedor_principal
          ? component.proveedor_principal.toLowerCase()
          : "";
        const proveedorSecundario = component.proveedor_secundario
          ? component.proveedor_secundario.toLowerCase()
          : "";

        const titleMatch = searchWords.every((word) =>
          productTitle.includes(word),
        );

        const otherColumnsMatch =
          productSku.includes(searchTermComponente.toLowerCase()) ||
          proveedorPrincipal.includes(searchTermComponente.toLowerCase()) ||
          proveedorSecundario.includes(searchTermComponente.toLowerCase());

        return titleMatch || otherColumnsMatch;
      });
    }

    setFilteredProductsComponente(filtered);
  }, [searchTermComponente, rowsComponentes]);

  const columnsProducts = getProductosColumns({
    rowsProducts,
    onSelectRow: handleRowSelection,
  });

  const columnsProductsComponentes = getComponentesBilleteColumns({
    rowsComponentes,
    onSelectRow: handleRowSelectionComponente,
  });

  const columns = getBilletesColumns({
    onOpenDetalle: handleOpenDetalle,
    onDeleteBillete: deleteBillete,
  });

  return (
    <div>
      <DetalleBilleteDialog
        open={openDetalle}
        onClose={handleCloseDetalle}
        billete={billeteSeleccionado}
        onDeleteComponent={handleDeleteComponent}
        onAddComponent={handleOpenComponents}
        onShowAlert={handleShowAlertBillete}
        onSelectProducto={handleSelectProductoFromDetalle}
        productoSeleccionado={Boolean(productoId)}
      />

      <UbicacionesComponenteModal
        open={openUbicaciones}
        onClose={() => setOpenUbicaciones(false)}
        componente={componenteUbicaciones}
        ubicaciones={ubicacionesComponente}
        onEliminar={handleEliminarUbicacion}
        onSelectProducto={handleSelectProductoFromDetalle}
      />

      <AgregarComponenteDialog
        open={openAddComp}
        onClose={handleCloseAddComponents}
        onSave={handleSaveComponente}
        listaComponentes={listaComponentes}
      />

      <ActualizarComponenteDialog
        open={openEditComp}
        onClose={() => setOpenEditComp(false)}
        componente={componenteEditando}
        onSave={handleSaveUpdateComponent}
        listaProveedores={listaProveedores}
      />

      <BuscarProductoModal
        open={open}
        onClose={handleCloseSearchProducts}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        rows={filteredProducts}
        columns={columnsProducts}
        columnVisibilityModel={columnVisibilityModelProducts}
        onColumnVisibilityModelChange={setColumnVisibilityModelProducts}
      />

      <BuscarComponenteModal
        open={openComponentes}
        onClose={handleCloseComponentes}
        searchTerm={searchTermComponente}
        onSearchChange={setSearchTermComponente}
        rows={filteredProductsComponente}
        columns={columnsProductsComponentes}
      />

      <AgregarBilleteModal
        open={openAddBillete}
        onClose={handleCloseAddBillete}
        productoSkuComponente={productoSkuComponente}
        onProductoSkuChange={handleProductIdComponent}
        onKeyDownComponent={handleKeyDownComponent}
        onBlurComponent={handleBlurComponent}
        onOpenSearchComponentes={handleOpenSearchProductsComponentes}
        cantidad={cantidad}
        onCantidadChange={handleChangeCantidad}
        tipo={tipo}
        onTipoChange={handleChangeTipo}
        onSave={addBillete}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <Box
        sx={{
          width: "90%",
          mx: "auto",
          mt: 2,
        }}
      >
        <BilletesToolbar
          productoSku={productoSku}
          onProductoSkuChange={handleProductId}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onOpenSearchProducts={handleOpenSearchProducts}
          title={title}
          onBulkSuccess={handleBulkSuccess}
          onOpenAddBillete={handleOpenAddBillete}
          onResetBilletes={handleResetBilletes}
        />

        {!productoId ? (
          <Box
            sx={{
              mt: 2,
              mb: 2,
              px: 2,
              py: 1.5,
              border: "1px solid #90caf9",
              borderRadius: 2,
              backgroundColor: "#e3f2fd",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Instrucciones:
            </Typography>
            <Typography variant="body2">
              1. Busca y selecciona un producto.
            </Typography>
            <Typography variant="body2">
              2. Después presiona <strong>Agregar billete</strong>.
            </Typography>
            <Typography variant="body2">
              3. Selecciona el componente, captura cantidad y tipo, y guarda.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
              Nota: si un componente está compartido en varios productos,
              elimínalo desde la vista general para elegir exactamente de qué
              producto quitarlo.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              mt: 2,
              mb: 2,
              px: 2,
              py: 1.5,
              border: "1px solid #bbdefb",
              borderRadius: 2,
              backgroundColor: "#f5faff",
            }}
          >
            <Typography variant="body2">
              Producto seleccionado correctamente. Ya puedes presionar{" "}
              <strong>Agregar billete</strong> para asignarle componentes.
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            mt: 2,
            height: "70vh",
          }}
        >
          <DataGrid
            sx={{
              borderRadius: 4,
              boxShadow: 24,
              borderWidth: 3,
              borderColor: "#1e88e5",
              height: "70vh",
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
            density="compact"
            slots={{ toolbar: GridToolbar }}
            loading={loadingBilletes}
          />
        </Box>
      </Box>
    </div>
  );
};

export default Billetes;
