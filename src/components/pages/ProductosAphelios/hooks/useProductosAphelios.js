import {
  useCallback,
  useEffect,
  useState,
} from "react";

import axios from "axios";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const useProductosAphelios = () => {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [productos, setProductos] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [total, setTotal] =
    useState(0);

  const [
    paginationModel,
    setPaginationModel,
  ] = useState({
    page: 0,
    pageSize: 25,
  });

  const [busqueda, setBusqueda] =
    useState("");

  const [
    busquedaAplicada,
    setBusquedaAplicada,
  ] = useState("");

  const [estado, setEstado] =
    useState("todos");

  // =====================================================
  // OBTENER PRODUCTOS
  // =====================================================

  const obtenerProductos =
    useCallback(async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            "token",
          );

        const response =
          await axios.get(
            `${apiUrl}/productosAphelios`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              params: {
                pagina:
                  paginationModel.page +
                  1,

                limite:
                  paginationModel.pageSize,

                busqueda:
                  busquedaAplicada,

                estado,
              },
            },
          );

        setProductos(
          response.data.productos ||
            [],
        );

        setTotal(
          response.data.paginacion
            ?.total || 0,
        );
      } catch (error) {
        console.error(
          "Error al obtener Productos Aphelios:",
          error,
        );

        setProductos([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, [
      paginationModel.page,
      paginationModel.pageSize,
      busquedaAplicada,
      estado,
    ]);

  // =====================================================
  // DEBOUNCE BÚSQUEDA
  // =====================================================

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        setPaginationModel(
          (prev) => ({
            ...prev,
            page: 0,
          }),
        );

        setBusquedaAplicada(
          busqueda.trim(),
        );
      }, 500);

    return () =>
      clearTimeout(timeout);
  }, [busqueda]);

  // =====================================================
  // CARGAR PRODUCTOS
  // =====================================================

  useEffect(() => {
    obtenerProductos();
  }, [obtenerProductos]);

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  const handleEstadoChange = (
    event,
  ) => {
    setEstado(
      event.target.value,
    );

    setPaginationModel(
      (prev) => ({
        ...prev,
        page: 0,
      }),
    );
  };

  // =====================================================
  // RETURN
  // =====================================================

  return {
    productos,
    loading,
    total,

    paginationModel,
    setPaginationModel,

    busqueda,
    setBusqueda,

    estado,
    handleEstadoChange,

    obtenerProductos,
  };
};

export default useProductosAphelios;