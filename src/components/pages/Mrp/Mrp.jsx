import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Alert,
  Tooltip,
  Chip,
} from "@mui/material";
import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import FullScreenLoader from "../../../components/loaders/FullScreenLoader";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const apiUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : process.env.REACT_APP_API_URL_LOCAL;

const MrpSimple = () => {
  const [mrp, setMrp] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loadingMrp, setLoadingMrp] = useState(false);
  const [loadingProv, setLoadingProv] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [mlInfo, setMlInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const [loaderOpen, setLoaderOpen] = useState(false);
  const [loaderText, setLoaderText] = useState("Procesando…");
  const [loaderPct, setLoaderPct] = useState(0);
  const navigate = useNavigate();

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    orden_id: false,
    permitir_full: false,
  });

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const usuario_id = user?.id_usuario;

  // formulario
  const [proveedorId, setProveedorId] = useState("");

  const proveedorSel = useMemo(
    () =>
      proveedores.find((p) => String(p.id_proveedor) === String(proveedorId)),
    [proveedores, proveedorId],
  );

  const openLoader = (text = "Procesando…", pct = 0) => {
    setLoaderText(text);
    setLoaderPct(pct);
    setLoaderOpen(true);
    setIsBlocking(true);
  };

  const closeLoader = () => {
    setLoaderOpen(false);
    setIsBlocking(false);
    setLoaderText("Procesando…");
    setLoaderPct(0);
  };

  const daysOutLocal = useMemo(() => {
    if (!mlInfo?.max) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = new Date(mlInfo.max);
    last.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today - last) / 86400000));
  }, [mlInfo?.max]);

  const dias = mlInfo?.daysOutdated ?? daysOutLocal;

  const backorderActivo = !!proveedorSel?.backorder;
  const tieneProveedor = Boolean(proveedorId && proveedorSel);
  const fmtDT = (s) =>
    s
      ? new Date(s).toLocaleString("es-MX", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  const fetchMlInfo = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/mrp/ml/lastUpdate`);
      setMlInfo(data);
    } catch (e) {
      // opcional: mostrar alerta suave
      setMlInfo(null);
    }
  };

  const actualizarPublicacionesManual = async () => {
    try {
      setLoaderText("Actualizando publicaciones…");
      setLoaderPct(null);
      setLoaderOpen(true);

      const response = await axios.post(
        `${apiUrl}/mrp/actualizarPublicacionesManual`,
      );

      setLoaderOpen(false);

      Swal.fire({
        title: "Actualizacion exitosa!",
        text: response.data?.message || "Publicaciones actualizadas.",
        icon: "success",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    } catch (error) {
      setLoaderOpen(false);

      Swal.fire({
        title: "Error",
        text: error?.response?.data?.message || "No se pudo actualizar.",
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const isSameLocalDay = (a, b) => {
    const da = new Date(a);
    da.setHours(0, 0, 0, 0);
    const db = new Date(b);
    db.setHours(0, 0, 0, 0);
    return da.getTime() === db.getTime();
  };

  const lastUpdatedIsToday = useMemo(() => {
    if (!mlInfo?.ok || !mlInfo?.max) return false;
    return isSameLocalDay(mlInfo.max, new Date());
  }, [mlInfo]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/proveedores`);
        if (!cancel) setProveedores(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando proveedores", err);
        Swal.fire("Error", "No se pudieron cargar los proveedores.", "error");
      } finally {
        if (!cancel) setLoadingProv(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    setRowSelectionModel([]);
    cargarMrpDelProveedor();
  }, [proveedorId]);

  useEffect(() => {
    window.onbeforeunload = (e) => {
      e.preventDefault();
      e.returnValue = " ";
      return " ";
    };
    return () => {
      window.onbeforeunload = null;
    };
  }, []);

  const rowIdToOrdenId = useMemo(() => {
    const m = new Map();
    (Array.isArray(mrp) ? mrp : []).forEach((r) => {
      const key = r?.op_detalle_id
        ? `opd-${r.op_detalle_id}`
        : r?.orden_id
          ? `op-${r.orden_id}`
          : null;
      if (key) m.set(key, r.orden_id);
    });
    return m;
  }, [mrp]);

  const ordenesSeleccionadas = useMemo(() => {
    const set = new Set();
    rowSelectionModel.forEach((rid) => {
      const oid = rowIdToOrdenId.get(rid);
      if (oid) set.add(oid);
    });
    return Array.from(set); // array de orden_id únicos
  }, [rowSelectionModel, rowIdToOrdenId]);

  const descargarExcel = async () => {
    const response = await axios.get(`${apiUrl}/mrp/excel`, {
      params: { proveedor_id: proveedorId },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `mrp_${proveedorId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };

  const TablaToolbar = ({ tieneProveedor, backorderActivo, seleccionadas }) => {
    if (!tieneProveedor) return null;
    return (
      <GridToolbarContainer sx={{ px: 1, py: 1 }}>
        <Alert
          severity={backorderActivo ? "info" : "warning"}
          icon={<InfoOutlinedIcon />}
          sx={{ width: "100%" }}
        >
          {backorderActivo ? (
            <Box>
              <strong>¿Cerrar órdenes?</strong> Selecciona con las casillas, usa
              <b> CERRAR ORDEN</b> (fila) o{" "}
              <b>CERRAR SELECCIONADAS / CERRAR TODAS</b>. Después, el stock se
              actualiza automáticamente.
              <Chip
                sx={{ ml: 1 }}
                size="small"
                label={`Seleccionadas: ${seleccionadas}`}
              />
            </Box>
          ) : (
            <span>Proveedor sin backorder: la tabla es solo lectura.</span>
          )}
        </Alert>
      </GridToolbarContainer>
    );
  };

  const generarPedidos = async () => {
    if (!proveedorId) {
      await Swal.fire(
        "Atención",
        "Selecciona un proveedor primero.",
        "warning",
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Generar pedidos?",
      text: `Proveedor: ${
        proveedorSel?.razon_social || proveedorId
      } · Backorder: ${proveedorSel?.backorder ? "Sí" : "No"}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, generar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);

    try {
      openLoader("Preparando generación de pedidos…", 5);

      if (!proveedorSel?.backorder) {
        setLoaderText("Cerrando pendientes sin backorder…");
        setLoaderPct(15);

        await axios.post(`${apiUrl}/mrp/cerrarPorProveedorSinBackorder`, {
          proveedor_id: Number(proveedorId),
        });
      }

      setLoaderText("Ejecutando MRP…");
      setLoaderPct(15);

      const { data } = await axios.post(`${apiUrl}/mrp/iniciar`, {
        proveedor_id: Number(proveedorId),
        back_order: !!proveedorSel?.backorder,
      });

      const mrpId = data.mrpEjecucionId;

      const timer = setInterval(async () => {
        try {
          const res = await axios.get(`${apiUrl}/mrp/estado/${mrpId}`);
          if (!res.data) return;

          setLoaderPct(res.data.progreso);
          setLoaderText(`Estado: ${res.data.estado}`);

          if (res.data.estado === "COMPLETADO") {
            clearInterval(timer);
            closeLoader();
            Swal.fire("Listo", "MRP finalizado correctamente", "success");
            await cargarMrpDelProveedor();
          }

          if (res.data.estado === "SIN_PEDIDO") {
            clearInterval(timer);
            closeLoader();
            Swal.fire(
              "Sin demanda",
              "No se generó ninguna orden porque no hay productos con pedido mayor a 0.",
              "info",
            );
            await cargarMrpDelProveedor();
          }

          if (res.data.estado === "ERROR") {
            clearInterval(timer);
            closeLoader();
            Swal.fire("Error", res.data.mensaje_error, "error");
          }
        } catch (pollError) {
          console.error("Error polling MRP:", pollError);
        }
      }, 2000);
    } catch (err) {
      closeLoader();

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudieron generar los pedidos.";

      await Swal.fire("Error", msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchMlInfo();
  }, []);

  const actualizarStocksML = async () => {
    let pollTimer = null;
    let fakeTimer = null;

    let fakePct = 0;
    let serverPct = 0;

    let jobId = null;

    const stopFake = () => {
      if (fakeTimer) clearInterval(fakeTimer);
      fakeTimer = null;
    };

    const startFake = () => {
      if (fakeTimer) return;
      fakeTimer = setInterval(() => {
        if (serverPct < 40 && fakePct < 39) {
          fakePct += 1;
          setLoaderPct((prev) => Math.max(prev, fakePct, serverPct));
        }
      }, 10000);
    };

    try {
      if (!proveedorId) {
        await Swal.fire(
          "Atención",
          "Selecciona un proveedor primero.",
          "warning",
        );
        return;
      }

      if (lastUpdatedIsToday && mlInfo?.total > 0) {
        const hora = new Date(mlInfo.max).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const { isConfirmed } = await Swal.fire({
          icon: "question",
          title: "¿Actualizar stocks otra vez hoy?",
          html: `
          La última actualización de Mercado Libre fue <b>hoy a las ${hora}</b>.<br/>
          Este proceso tarda <b>~10-15 minutos</b> y afecta a <b>todos</b> los productos.<br/><br/>
          ¿Seguro que quieres ejecutarlo de nuevo?
        `,
          showCancelButton: true,
          confirmButtonText: "Sí, actualizar",
          cancelButtonText: "Cancelar",
          focusCancel: true,
        });

        if (!isConfirmed) return;
      }

      const resp = await axios.post(`${apiUrl}/mrp/refreshMl`, {
        proveedor_id: Number(proveedorId),
        usuario_id,
      });

      if (resp.data?.reused) {
        await Swal.fire({
          icon: "info",
          title: "Proceso ya en ejecución",
          text:
            resp.data?.message ||
            "Ya hay una actualización de stocks en curso. Ve al Centro de procesos para ver el avance.",
          confirmButtonText: "Ir a procesos",
          showCancelButton: true,
          cancelButtonText: "Cerrar",
        }).then((r) => {
          if (r.isConfirmed) navigate("/procesos");
        });

        return;
      }

      jobId = resp.data?.jobId;
      if (!jobId) throw new Error("No se recibió jobId del servidor.");

      fakePct = 0;
      serverPct = 0;
      setLoaderPct(0);
      setLoaderText("Sincronizando Mercado Libre… (puede tardar 10–15 min)");
      setLoaderOpen(true);
      startFake();

      const poll = async () => {
        const r = await axios.get(`${apiUrl}/job/${jobId}`);
        const job = r.data?.job;

        const msg = job?.message || "Procesando…";
        serverPct = Number(job?.progress ?? 0);

        if (serverPct >= 40) stopFake();

        const pctToShow =
          serverPct >= 40 ? serverPct : Math.max(serverPct, fakePct);

        setLoaderText(msg);
        setLoaderPct(pctToShow);

        if (job?.status === "done") return { done: true };
        if (job?.status === "error")
          throw new Error(job?.error || "Error en el job");
        return { done: false };
      };

      while (true) {
        const { done } = await poll();
        if (done) break;
        await new Promise((r) => (pollTimer = setTimeout(r, 1500)));
      }

      stopFake();
      setLoaderOpen(false);

      await Swal.fire(
        "Listo",
        "Stocks de Mercado Libre actualizados.",
        "success",
      );

      await cargarMrpDelProveedor();
      await fetchMlInfo();
    } catch (err) {
      stopFake();
      setLoaderOpen(false);

      if (
        err?.response?.status === 409 &&
        err?.response?.data?.code === "JOB_ALREADY_RUNNING"
      ) {
        await Swal.fire({
          icon: "info",
          title: "Proceso ya en ejecución",
          text:
            err.response.data.message ||
            "Ya hay una actualización de stocks en curso. Ve al Centro de procesos para ver el avance.",
          confirmButtonText: "Ir a procesos",
          showCancelButton: true,
          cancelButtonText: "Cerrar",
        }).then((r) => {
          if (r.isConfirmed) navigate("/procesos");
        });

        return;
      }

      await Swal.fire(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo actualizar el stock ML.",
        "error",
      );
    } finally {
      if (pollTimer) clearTimeout(pollTimer);
      stopFake();
      setLoaderOpen(false);
    }
  };

  const cargarMrpDelProveedor = async () => {
    if (!proveedorId) {
      setMrp([]);
      return;
    }
    setLoadingMrp(true);
    try {
      const { data } = await axios.get(`${apiUrl}/mrp`, {
        params: { proveedor_id: Number(proveedorId) },
      });

      setMrp(Array.isArray(data?.ordenes) ? data.ordenes : []);
    } catch {
      setBusy(false);

      Swal.fire(
        "Error",
        "No se pudieron cargar las órdenes abiertas.",
        "error",
      );
    } finally {
      setLoadingMrp(false);
    }
  };

  const handleCerrarOrden = async (row) => {
    const ordenId = row?.orden_id;
    if (!ordenId) {
      await Swal.fire("Atención", "No se encontró el ID de la OP.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Cerrar orden",
      text: `¿Cerrar la OP #${ordenId}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      setBusy(true);
      // ⚠️ Ajusta la ruta a tu backend:
      await axios.post(`${apiUrl}/mrp/op/cerrar`, {
        orden_id: Number(ordenId),
      });
      await Swal.fire("Listo", `OP #${ordenId} cerrada.`, "success");
      await cargarMrpDelProveedor();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo cerrar la orden.";
      await Swal.fire("Error", msg, "error");
    } finally {
      setBusy(false);
    }
  };

  const cerrarLinea = async (row) => {
    const payload = row?.op_detalle_id
      ? { op_detalle_id: Number(row.op_detalle_id) }
      : row?.detalle_orden_compra_id
        ? { orden_compra_detalle_id: Number(row.detalle_orden_compra_id) }
        : row?.pedido_linea_id
          ? { pedido_linea_id: Number(row.pedido_linea_id) }
          : null;

    if (!payload) {
      await Swal.fire(
        "Atención",
        "No encontré un ID de línea para cerrar.",
        "info",
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Cerrar línea",
      text: `¿Cerrar esta línea? (Numero de Orden de Produccion #${
        row?.orden_id ?? "?"
      })`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      setBusy(true);
      await axios.post(`${apiUrl}/mrp/linea/cerrar`, payload);
      setBusy(false);
      await Swal.fire("Listo", "Línea cerrada y stock recalculado.", "success");
      await cargarMrpDelProveedor();
    } catch (err) {
      setBusy(false);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo cerrar la línea.";
      await Swal.fire("Error", msg, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleCerrarSeleccionadas = async () => {
    if (!backorderActivo) return;

    if (rowSelectionModel.length === 0) {
      await Swal.fire("Atención", "Selecciona al menos una línea.", "info");
      return;
    }

    const bulk = {
      op_detalle_ids: [],
      orden_compra_detalle_ids: [],
      pedido_linea_ids: [],
      familias: [],
    };

    const selectedRows = [];
    const familiasMap = new Map();

    rowSelectionModel.forEach((rid) => {
      const row = mrp.find(
        (r) =>
          (r.op_detalle_id
            ? `opd-${r.op_detalle_id}`
            : r.orden_id
              ? `op-${r.orden_id}`
              : `row-${r.producto_id ?? "x"}`) === rid,
      );

      if (!row) return;

      selectedRows.push(row);

      if (row.op_detalle_id) {
        bulk.op_detalle_ids.push(Number(row.op_detalle_id));
      }

      if (row.detalle_orden_compra_id) {
        bulk.orden_compra_detalle_ids.push(Number(row.detalle_orden_compra_id));
      }

      if (row.pedido_linea_id) {
        bulk.pedido_linea_ids.push(Number(row.pedido_linea_id));
      }

      const pedidoId = Number(row.pedido_id || 0);
      const sku = String(
        row.componente_sku || row.sku || row.sku_componente || "",
      ).trim();

      if (pedidoId && sku) {
        const key = `${pedidoId}-${sku}`;

        if (!familiasMap.has(key)) {
          familiasMap.set(key, {
            pedido_id: pedidoId,
            sku,
          });
        }
      }
    });

    bulk.op_detalle_ids = [...new Set(bulk.op_detalle_ids)];
    bulk.orden_compra_detalle_ids = [...new Set(bulk.orden_compra_detalle_ids)];
    bulk.pedido_linea_ids = [...new Set(bulk.pedido_linea_ids)];
    bulk.familias = Array.from(familiasMap.values());

    const confirm = await Swal.fire({
      title: "Cerrar seleccionadas",
      text: `Se cerrarán ${rowSelectionModel.length} selección(es).`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setBusy(true);

      // 🔥 AQUI ABRES EL LOADER
      openLoader("Cerrando líneas seleccionadas…", null);

      await axios.post(`${apiUrl}/mrp/lineas/cerrar`, bulk);

      // 🔥 CIERRAS LOADER ANTES DEL SUCCESS
      closeLoader();

      await Swal.fire("Listo", "Líneas cerradas correctamente.", "success");

      setRowSelectionModel([]);
      await cargarMrpDelProveedor();
    } catch (err) {
      // 🔥 IMPORTANTE: cerrar loader también en error
      closeLoader();

      const backendCode = err?.response?.data?.code;
      const backendMsg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudieron cerrar las líneas.";

      if (backendCode === "GRUPO_INCOMPLETO") {
        const grupos = err?.response?.data?.grupos_bloqueados || [];

        const detalle = grupos.length
          ? grupos
              .map(
                (g) =>
                  `Pedido ${g.pedido_id} · SKU ${g.sku}\nFaltan ramas/líneas: ${(g.lineas_faltantes || []).join(", ")}`,
              )
              .join("\n\n")
          : "Hay ramas activas relacionadas que también deben cerrarse.";

        await Swal.fire({
          icon: "warning",
          title: "Grupo incompleto",
          text: "Debes seleccionar todas las ramas activas del mismo SKU dentro del pedido antes de cerrarlo.",
          footer: `<pre style="text-align:left;white-space:pre-wrap;">${detalle}</pre>`,
        });

        return;
      }

      await Swal.fire("Error", backendMsg, "error");
    } finally {
      setBusy(false);

      // 🔥 fallback (por si algo raro pasa)
      closeLoader();
    }
  };

  const handleCerrarTodas = async () => {
    if (!backorderActivo) return;

    const confirm = await Swal.fire({
      title: "Cerrar TODAS las órdenes",
      text: "Se cerrarán todas las líneas/órdenes abiertas del proveedor.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar todas",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setBusy(true);
      openLoader("Cerrando todas las órdenes del proveedor…", null);

      const { data } = await axios.post(
        `${apiUrl}/mrp/cerrarTodoProveedorBackorder`,
        {
          proveedor_id: Number(proveedorId),
        },
      );

      closeLoader();

      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: data?.message || "Cierre total ejecutado y stock actualizado.",
      });

      setRowSelectionModel([]);
      await cargarMrpDelProveedor();
    } catch (err) {
      closeLoader();

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo cerrar todo.";

      await Swal.fire("Error", msg, "error");
    } finally {
      setBusy(false);
      closeLoader();
    }
  };

  const columns = [
    { field: "pedido_id", headerName: "#Pedido", minWidth: 100 },
    { field: "pedido_fecha_creacion", headerName: "F. Pedido", minWidth: 160 },
    { field: "orden_id", headerName: "Orden de Produccion", minWidth: 160 },
    { field: "componente_sku", headerName: "SKU componente", minWidth: 160 },
    {
      field: "mlm",
      headerName: "MLM",
      minWidth: 140,
      renderCell: ({ value }) => (
        <span
          style={{
            display: "block",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "inherit",
          }}
        >
          {value ?? "—"}
        </span>
      ),
    },
    { field: "inventory_id", headerName: "ML", minWidth: 150 },
    {
      field: "logistic_type",
      headerName: "Logística",
      minWidth: 100,
      renderCell: (params) => {
        if (params.value !== "fulfillment" && params.row.permitir_full === 0) {
          return "ME";
        } else {
          return "FULL";
        }
      },
    },
    {
      field: "permitir_full",
      headerName: "Permitir Full",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "pub_title",
      headerName: "Título publicación",
      minWidth: 350,
      flex: 1,
    },
    {
      field: "cantidad_a_producir",
      headerName: "Cantidad a Producir",
      type: "number",
      minWidth: 130,
    },
    { field: "estatus_op", headerName: "Estatus", minWidth: 130 },
    {
      field: "fecha_creacion_op",
      headerName: "Fecha creación",
      minWidth: 220,
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <span>Fecha creación</span>
          <Tooltip
            title="Tip: abre el menú de columna (⋮) para filtrar por fecha."
            arrow
          >
            <InfoOutlinedIcon
              fontSize="small"
              sx={{ color: "text.secondary", cursor: "help" }}
            />
          </Tooltip>
        </Box>
      ),
    },

    // OP Detalle
    {
      field: "cantidad_billete",
      headerName: "Cant a surtir",
      minWidth: 120,
      type: "number",
    },

    // Pedido + líneas
    {
      field: "avance",
      headerName: "Avance",
      type: "number",
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row ?? {};
        const s = Number(row.total_componentes_surtidos ?? 0);
        const t = Number(row.total_componentes_solicitados ?? 0);
        return t > 0 ? Math.round((s / t) * 100) : 0;
      },
      valueFormatter: ({ value }) => `${value ?? 0}%`,
      sortComparator: (a, b) => (a ?? 0) - (b ?? 0),
      // 2) Header con tooltip + icono
      renderHeader: () => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <span>Avance</span>
          <Tooltip
            title="Avance = (surtidos ÷ solicitados) × 100. 0% = sin recepción registrada."
            arrow
          >
            <InfoOutlined
              fontSize="small"
              sx={{ color: "text.secondary", cursor: "help" }}
            />
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        MRP
      </Typography>

      {!proveedorId && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Primero selecciona un proveedor para generar sus órdenes de compra.
        </Typography>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, // proveedor 1/3, pasos 2/3
              gap: 4, // más espacio entre columnas
              alignItems: "flex-start",
            }}
          >
            {/* Columna izquierda: Proveedor */}
            <Box>
              <FormControl
                fullWidth
                disabled={loadingProv || proveedores.length === 0}
              >
                <InputLabel id="proveedor-label">Proveedor</InputLabel>
                <Select
                  labelId="proveedor-label"
                  label="Proveedor"
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  multiple={false}
                >
                  {proveedores.map((p) => (
                    <MenuItem
                      key={p.id_proveedor}
                      value={String(p.id_proveedor)}
                    >
                      {p.razon_social}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {proveedorSel && (
                <Box mt={2} sx={{ fontSize: 14 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Razón social:</strong> {proveedorSel.razon_social}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>RFC:</strong> {proveedorSel.rfc || "—"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Correo:</strong> {proveedorSel.correo || "—"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Estado:</strong>{" "}
                    {Number(proveedorSel.estado) === 1 ? "Activo" : "Inactivo"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Surtido:</strong> {proveedorSel.surtido ?? "—"}
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch checked={!!proveedorSel?.backorder} disabled />
                    }
                    label={
                      !!proveedorSel?.backorder
                        ? "¿Tiene backorder? Sí (se mantendrán pedidos abiertos)"
                        : "¿Tiene backorder? No (se cerrarán pedidos pendientes)"
                    }
                  />
                </Box>
              )}
            </Box>

            {/* Columna derecha: Pasos */}
            <Stack spacing={4}>
              {/* Paso 1 */}
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Paso 1 · Actualizar stocks Mercado Libre
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Actualiza las existencias de Mercado Libre y recalcula el
                  stock total de manera global (para todos los productos de
                  Mercado Libre). Por lo que este proceso si lo deseas,{" "}
                  <strong>solo debe ser generado una vez.</strong>
                </Typography>
                {/* Indicador de última actualización */}
                {mlInfo?.ok && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: 14 }}>
                      <strong>Última actualización Mercado Libre:</strong>{" "}
                      {mlInfo.total === 0 ? "sin datos" : fmtDT(mlInfo.max)}
                      {mlInfo.total > 0 &&
                        mlInfo.sameDay &&
                        " · datos consistentes (mismo día. Aqui se refiere a que todos los registros que tenemos del stock de mercado libre, estan actualizados del mismo dia no que son actuales.)"}
                    </span>
                  </Box>
                )}

                {/* Advertencia si NO es el mismo día */}
                {/* {mlInfo?.ok && mlInfo.total > 0 && !mlInfo.sameDay && (
                  <Alert severity="warning" sx={{ maxWidth: 720 }}>
                    Los registros de Mercado Libre no corresponden al mismo día
                    ({fmtDT(mlInfo.min)} → {fmtDT(mlInfo.max)}). Te recomendamos
                    <strong> actualizar stocks ML ahora</strong>.
                  </Alert>
                )} */}
                {mlInfo?.ok && mlInfo.total > 0 && dias > 0 && (
                  <Alert
                    severity={dias >= 7 ? "error" : "warning"}
                    sx={{ maxWidth: 720 }}
                  >
                    Tus registros de Mercado Libre están desactualizados por{" "}
                    <strong>{dias === 1 ? "1 día" : `${dias} días`}</strong>.
                  </Alert>
                )}
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={actualizarStocksML}
                    disabled={!proveedorId || submitting || busy}
                  >
                    Actualizar stocks ML
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={actualizarPublicacionesManual}
                    disabled={loaderOpen}
                  >
                    Actualizar publicaciones
                  </Button>

                  <Button
                    variant="contained"
                    color="success"
                    onClick={descargarExcel}
                    disabled={!proveedorId || loadingMrp || !mrp.length}
                  >
                    Descargar Excel
                  </Button>
                </Stack>
              </Stack>

              {/* Paso 2 (opcional) solo si SÍ acepta backorder */}
              {backorderActivo && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Paso 2 · (Opcional) Cerrar órdenes abiertas
                  </Typography>
                  <Alert severity="info" variant="outlined">
                    Si este proveedor acepta backorder, puedes elegir cerrar
                    una, varias o todas las órdenes abiertas
                    <strong> antes</strong> de generar nuevas. Al cerrar, se
                    actualizará el stock en camino y el total.
                    <strong>
                      {" "}
                      Todo esto lo puedes hacer en la tabla de abajo
                    </strong>
                  </Alert>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCerrarSeleccionadas}
                      disabled={ordenesSeleccionadas.length === 0 || busy}
                    >
                      Cerrar seleccionadas
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCerrarTodas}
                      disabled={(mrp?.length ?? 0) === 0 || busy}
                    >
                      Cerrar todas
                    </Button>
                  </Stack>
                </Stack>
              )}

              {/* Paso 3 si hay backorder, si no, sigue siendo Paso 2 */}
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {backorderActivo
                    ? "Paso 3 · Generar órdenes"
                    : "Paso 2 · Generar órdenes"}
                </Typography>
                <Alert severity="warning" variant="outlined">
                  Antes de generar órdenes, recuerda{" "}
                  <strong>refrescar stocks ML (Paso 1)</strong>
                  {backorderActivo &&
                    " y cerrar las órdenes que desees (Paso 2)."}
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  {backorderActivo
                    ? "Tras cerrar las órdenes que elijas (opcional), se actualizará el stock y podrás generar nuevas órdenes."
                    : "Si el proveedor no acepta backorder, se cerrarán automáticamente las órdenes pendientes antes de generar nuevas."}
                </Typography>
                <Button
                  variant="contained"
                  disabled={!proveedorId || submitting}
                  onClick={generarPedidos}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {submitting ? "Generando..." : "Generar pedidos"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
      <Box sx={{ height: 460, width: "100%" }}>
        {loadingMrp ? (
          <Box
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            sx={{
              fontFamily: "Montserrat",
              fontWeight: "bold",
              height: "150%",
              borderRadius: 2,
              boxShadow: 2,

              // 🔒 filas deshabilitadas
              "& .MuiDataGrid-row.row-disabled": {
                opacity: 0.5,
                pointerEvents: "none",
                filter: "grayscale(100%)",
              },

              // 🔴 FILAS NO FULL (ESTE ES EL BUENO)
              "& .MuiDataGrid-row.fila-no-full .MuiDataGrid-cell": {
                backgroundColor: "#FDECEA",
              },

              // 🔴 hover correcto
              "& .MuiDataGrid-row.fila-no-full:hover .MuiDataGrid-cell": {
                backgroundColor: "#F9D6D5",
              },
            }}
            rows={mrp}
            columns={columns}
            getRowId={(row) =>
              row?.op_detalle_id
                ? `opd-${row.op_detalle_id}`
                : row?.orden_id
                  ? `op-${row.orden_id}`
                  : `row-${row?.producto_id ?? "x"}`
            }
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            density="compact"
            disableRowSelectionOnClick
            showCellVerticalBorder
            showColumnVerticalBorder
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) =>
              setColumnVisibilityModel(newModel)
            }
            checkboxSelection={backorderActivo} // ⬅️ sólo si hay backorder
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(m) => setRowSelectionModel(m)}
            getRowClassName={(params) => {
              // 1. Si NO hay backorder activo → deshabilitar fila
              if (!backorderActivo) {
                return "row-disabled";
              }

              // 2. Si NO es fulfillment y permitir_full = 0 → fila roja
              if (
                params.row.logistic_type !== "fulfillment" &&
                params.row.permitir_full === 0
              ) {
                return "fila-no-full";
              }
              return "";
            }}
            slots={
              tieneProveedor
                ? {
                    toolbar: () => (
                      <TablaToolbar
                        tieneProveedor={tieneProveedor}
                        backorderActivo={backorderActivo}
                        seleccionadas={ordenesSeleccionadas.length}
                      />
                    ),
                  }
                : undefined // ⬅️ sin toolbar si no hay proveedor
            }
          />
        )}
      </Box>

      <FullScreenLoader
        open={loaderOpen}
        text={loaderText}
        progress={loaderPct}
      />
    </Box>
  );
};

export default MrpSimple;
