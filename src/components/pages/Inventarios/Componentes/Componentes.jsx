import React, { useEffect, useState, useRef, useCallback } from "react";
import "../../../../estilos/billetes.css";
import axios from "axios";
import Swal from "sweetalert2";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import ComoFuncionaCargaComponentesDialog from "./ComoFuncionaCargaComponentesDialog";
import CargaMasivaComponentesBar from "./CargaMasivaComponentesBar";
import { getComponentesColumns } from "./componentesColumns";

const Componentes = () => {
  const [proveedores, setProveedores] = useState([]);
  const [productoIdComponent, setProductoIdComponent] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [proveedorSecundarioId, setProveedorSecundarioId] = useState("");
  const [multiplo, setMultiplo] = useState(1);
  const [factorConversion, setFactorConversion] = useState(1);
  const [productoSkuComponente, setProductoSkuComponente] = useState("");
  const [filteredProductsComponente, setFilteredProductsComponente] = useState(
    [],
  );
  const [rowsComponentes, setRowsComponentes] = useState([]);
  const [searchTermComponente, setSearchTermComponente] = useState("");
  const [openAddComponent, setOpenAddComponent] = useState(false);
  const [openDetailsComponente, setOpenDetailsComponente] = useState(false);
  const [openHowItWorks, setOpenHowItWorks] = useState(false);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    componente_id: false,
    multiplo: false,
    factor_conversion: false,
  });

  const [componenteSku, setComponenteSku] = useState("");
  const [componenteDescripcion, setComponenteDescripcion] = useState("");
  const [componenteMultiplo, setComponenteMultiplo] = useState("");
  const [componenteConversion, setComponenteConversion] = useState("");
  const [modoAgregarActualizar, setModoAgregarActualizar] = useState(false);
  const [simularPrimero, setSimularPrimero] = useState(true);

  const fileInputRef = useRef(null);

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const styleAddComponent = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    borderRadius: 4,
    boxShadow: 24,
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const styleDetailsComponente = {
    position: "absolute",
    width: "30%",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    borderRadius: 4,
    boxShadow: 24,
    p: 4,
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const handleOpenHowItWorks = () => setOpenHowItWorks(true);
  const handleCloseHowItWorks = () => setOpenHowItWorks(false);

  const handleOpenAddComponent = () => {
    setOpenAddComponent(true);
  };

  const handleCloseAddComponent = () => {
    setOpenAddComponent(false);
    setProductoIdComponent("");
    setProductoSkuComponente("");
    setDescripcion("");
    setProveedorId("");
    setProveedorSecundarioId("");
    setMultiplo(1);
    setFactorConversion(1);
  };

  const handleOpenDetailsComponente = (componente_id) => {
    setOpenDetailsComponente(true);
    setProductoIdComponent(componente_id);
    fetchComponente(componente_id);
  };

  const handleCloseDetailsComponente = () => {
    setOpenDetailsComponente(false);
    setProductoIdComponent("");
    setComponenteSku("");
    setComponenteDescripcion("");
    setProveedorId("");
    setProveedorSecundarioId("");
    setComponenteMultiplo("");
    setComponenteConversion("");
  };

  const handleComponenteSku = (event) => {
    setProductoSkuComponente(event.target.value);
  };

  const handleComponenteDesc = (event) => {
    setDescripcion(event.target.value);
  };

  const handleDetailSku = (event) => {
    setComponenteSku(event.target.value);
  };

  const handleDetailDesc = (event) => {
    setComponenteDescripcion(event.target.value);
  };

  const handleMultiplo = (event) => {
    setMultiplo(parseInt(event.target.value) || 0);
  };

  const handleConversion = (event) => {
    setFactorConversion(parseInt(event.target.value) || 0);
  };

  const handleDetailMultiplo = (event) => {
    setComponenteMultiplo(parseInt(event.target.value) || 0);
  };

  const handleDetailConversion = (event) => {
    setComponenteConversion(parseInt(event.target.value) || 0);
  };

  const handleProveedor = (event) => {
    setProveedorId(event.target.value);
  };

  const handleProveedorSecundario = (event) => {
    setProveedorSecundarioId(event.target.value);
  };

  const handleUploadSimularClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleFileChangeSimular = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const simularFlag = simularPrimero ? "1" : "0";

    try {
      const { data } = await axios.post(
        `${apiUrl}/componentes/cargaMasiva?simular=${simularFlag}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (data.ok) {
        const { resumen, simular } = data;

        Swal.fire({
          icon: simular ? "info" : "success",
          title: simular
            ? "Simulación de carga masiva"
            : "Carga masiva aplicada",
          html: `
            <p><b>Total filas leídas:</b> ${resumen.totalFilas}</p>
            <p><b>Insertados:</b> ${resumen.insertados.length}</p>
            <p><b>Actualizados por SKU:</b> ${
              resumen.actualizadosPorSku?.length || 0
            }</p>
            <p><b>Actualizados por SKU viejo:</b> ${
              resumen.actualizadosPorSkuViejo?.length || 0
            }</p>
            <p><b>Errores:</b> ${resumen.errores.length}</p>
          `,
          width: 600,
        });

        if (!simular) {
          await fetchComponentesTodos();
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Error al procesar la carga masiva",
        });
      }
    } catch (error) {
      console.error("Error al subir Excel:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo procesar el archivo",
      });
    }
  };

  const handleDownloadPlantillaComponentes = async () => {
    try {
      const response = await axios.get(`${apiUrl}/componentes/plantillaCarga`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "plantilla_componentes.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error al descargar plantilla de componentes:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo descargar la plantilla de componentes",
      });
    }
  };

  const fetchComponentesTodos = useCallback(async () => {
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
        setRowsComponentes([]);
        setFilteredProductsComponente([]);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || "Error al obtener componentes";

      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchComponentesTodos();
  }, [fetchComponentesTodos]);

  useEffect(() => {
    let filtered = rowsComponentes;

    if (searchTermComponente) {
      const searchWords = searchTermComponente
        .toLowerCase()
        .split(" ")
        .filter((word) => word);

      filtered = filtered.filter((component) => {
        const productTitle = component.descripcion?.toLowerCase() || "";
        const productSku = component.sku?.toLowerCase() || "";
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

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await axios.get(`${apiUrl}/proveedores`);

        if (response.data && Array.isArray(response.data)) {
          setProveedores(response.data);
        } else {
          Swal.fire({
            title: "Proveedores no encontrados",
            text: "No se encontraron proveedores",
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

    if (openAddComponent || openDetailsComponente) {
      fetchProveedores();
    }
  }, [apiUrl, openAddComponent, openDetailsComponente]);

  const addComponent = async () => {
    try {
      const data = {
        sku: productoSkuComponente,
        descripcion,
        proveedor_id: proveedorId,
        proveedor_secundario_id: proveedorSecundarioId || null,
        multiplo,
        factor_conversion: factorConversion,
      };

      const response = await axios.post(
        `${apiUrl}/componentes/agregarComponente`,
        data,
      );

      if (response.data) {
        Swal.fire({
          title: "Registrado",
          text: response.data.message,
          icon: "success",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      }

      await fetchComponentesTodos();
      handleCloseAddComponent();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Error al registrar componente";

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

  const fetchComponente = async (componente_id) => {
    try {
      const response = await axios.get(
        `${apiUrl}/componentes/getComponente/${componente_id}`,
      );

      if (response.data.ok && response.data.data) {
        const componente = response.data.data;

        setComponenteSku(componente.sku);
        setComponenteDescripcion(componente.descripcion);
        setComponenteMultiplo(componente.multiplo);
        setComponenteConversion(componente.factor_conversion);
        setProveedorId(componente.proveedor_id);
        setProveedorSecundarioId(componente.proveedor_secundario_id || "");
      } else {
        Swal.fire({
          title: "Componente no encontrado",
          text: "No se encontró el componente",
          icon: "error",
          timer: 5000,
          showCloseButton: true,
          allowEscapeKey: true,
        });
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || "Error al obtener componente";

      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const updateDetailComponente = async (componente_id) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Se actualizará la información del componente",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, actualizar",
        target: document.getElementById("modal-details"),
      });

      if (!result.isConfirmed) return;

      const data = {
        sku: componenteSku,
        descripcion: componenteDescripcion,
        proveedor_id: proveedorId,
        proveedor_secundario_id: proveedorSecundarioId || null,
        multiplo: componenteMultiplo,
        factor_conversion: componenteConversion,
      };

      await axios.put(
        `${apiUrl}/componentes/updateComponente/${componente_id}`,
        data,
      );

      await fetchComponentesTodos();

      Swal.fire({
        title: "Actualizado",
        text: "Tu componente ha sido actualizado.",
        icon: "success",
      });

      setOpenDetailsComponente(false);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Error al actualizar componente";

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
        target: document.getElementById("modal-details"),
      });
    }
  };

  const deleteComponent = async (componente_id) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás revertir esto",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
      });

      if (!result.isConfirmed) return;

      await axios.delete(`${apiUrl}/componentes/${componente_id}`);
      await fetchComponentesTodos();

      Swal.fire({
        title: "Eliminado",
        text: "Tu componente ha sido eliminado.",
        icon: "success",
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Error al eliminar componente";

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

  const columnsProductsComponentes = getComponentesColumns({
    onDelete: deleteComponent,
    onEdit: handleOpenDetailsComponente,
  });

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".xlsx, .xls"
        onChange={handleFileChangeSimular}
      />

      <ComoFuncionaCargaComponentesDialog
        open={openHowItWorks}
        onClose={handleCloseHowItWorks}
      />

      <div className="DataG" style={{ height: 500, width: "90%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
            marginTop: "10px",
            gap: "1rem",
          }}
        >
          <TextField
            label="Buscar componente"
            variant="outlined"
            sx={{
              fontFamily: "Montserrat",
              width: "20rem",
              backgroundColor: "white",
            }}
            value={searchTermComponente}
            onChange={(e) => setSearchTermComponente(e.target.value)}
          />

          <CargaMasivaComponentesBar
            onHowItWorks={handleOpenHowItWorks}
            onDownloadTemplate={handleDownloadPlantillaComponentes}
            onUploadSimular={handleUploadSimularClick}
            modoAgregarActualizar={modoAgregarActualizar}
            onChangeModo={setModoAgregarActualizar}
            simularPrimero={simularPrimero}
            onChangeSimular={setSimularPrimero}
          />

          <Button
            variant="contained"
            style={{ marginBottom: "10px" }}
            onClick={handleOpenAddComponent}
          >
            Agregar componente
          </Button>
        </div>

        <DataGrid
          sx={{
            mt: 2,
            height: {
              xs: "60vh",
              md: "70vh",
              lg: "75vh",
            },
          }}
          rows={filteredProductsComponente}
          columns={columnsProductsComponentes}
          showCellVerticalBorder
          showColumnVerticalBorder
          getRowId={(row) => row.componente_id}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) =>
            setColumnVisibilityModel(newModel)
          }
          experimentalFeatures={{ newEditingApi: true }}
          density="compact"
          slots={{ toolbar: GridToolbar }}
        />
      </div>

      <Modal open={openAddComponent} onClose={handleCloseAddComponent}>
        <Box
          sx={{
            ...styleAddComponent,
            width: { xs: "92vw", sm: "80vw", md: "700px" },
            p: 4,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Montserrat",
              fontWeight: "bold",
              textAlign: "center",
              mb: 3,
              fontSize: "1.4rem",
            }}
          >
            Agregar nuevo componente
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <TextField
              label="SKU"
              variant="outlined"
              value={productoSkuComponente}
              onChange={handleComponenteSku}
              fullWidth
            />

            <TextField
              label="Descripción"
              variant="outlined"
              value={descripcion}
              onChange={handleComponenteDesc}
              fullWidth
            />

            <FormControl fullWidth sx={{ gridColumn: "1 / -1" }}>
              <InputLabel id="select-proveedor-principal-label">
                Proveedor Principal
              </InputLabel>
              <Select
                labelId="select-proveedor-principal-label"
                id="select-proveedor-principal"
                label="Proveedor Principal"
                value={proveedorId}
                onChange={handleProveedor}
              >
                {proveedores.map((proveedor) => (
                  <MenuItem
                    key={proveedor.id_proveedor}
                    value={proveedor.id_proveedor}
                  >
                    {proveedor.razon_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ gridColumn: "1 / -1" }}>
              <InputLabel id="select-proveedor-secundario-label">
                Proveedor Secundario
              </InputLabel>
              <Select
                labelId="select-proveedor-secundario-label"
                id="select-proveedor-secundario"
                label="Proveedor Secundario"
                value={proveedorSecundarioId}
                onChange={handleProveedorSecundario}
              >
                <MenuItem value="">
                  <em>Ninguno</em>
                </MenuItem>

                {proveedores.map((proveedor) => (
                  <MenuItem
                    key={proveedor.id_proveedor}
                    value={proveedor.id_proveedor}
                  >
                    {proveedor.razon_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Múltiplo"
              variant="outlined"
              type="number"
              value={multiplo}
              onChange={handleMultiplo}
              inputProps={{ min: 1 }}
              fullWidth
            />

            <TextField
              label="Factor Conversión"
              variant="outlined"
              type="number"
              value={factorConversion}
              onChange={handleConversion}
              inputProps={{ min: 1 }}
              fullWidth
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 4,
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

      <Modal
        id="modal-details"
        open={openDetailsComponente}
        onClose={handleCloseDetailsComponente}
      >
        <Box
          sx={{
            ...styleDetailsComponente,
            width: { xs: "92vw", sm: "80vw", md: "700px" },
            p: 4,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Montserrat",
              fontWeight: "bold",
              textAlign: "center",
              mb: 3,
              fontSize: "1.4rem",
            }}
          >
            Editar componente
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <TextField
              label="SKU"
              variant="outlined"
              value={componenteSku}
              onChange={handleDetailSku}
              fullWidth
            />

            <TextField
              label="Descripción"
              variant="outlined"
              value={componenteDescripcion}
              onChange={handleDetailDesc}
              fullWidth
            />

            <FormControl fullWidth sx={{ gridColumn: "1 / -1" }}>
              <InputLabel id="proveedor-principal-label">
                Proveedor Principal
              </InputLabel>
              <Select
                labelId="proveedor-principal-label"
                id="proveedor-principal"
                value={proveedorId}
                label="Proveedor Principal"
                onChange={(e) => setProveedorId(e.target.value)}
              >
                {proveedores.map((proveedor) => (
                  <MenuItem
                    key={proveedor.id_proveedor}
                    value={proveedor.id_proveedor}
                  >
                    {proveedor.razon_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ gridColumn: "1 / -1" }}>
              <InputLabel id="proveedor-secundario-label">
                Proveedor Secundario
              </InputLabel>
              <Select
                labelId="proveedor-secundario-label"
                id="proveedor-secundario"
                value={proveedorSecundarioId}
                label="Proveedor Secundario"
                onChange={(e) => setProveedorSecundarioId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Ninguno</em>
                </MenuItem>

                {proveedores.map((proveedor) => (
                  <MenuItem
                    key={proveedor.id_proveedor}
                    value={proveedor.id_proveedor}
                  >
                    {proveedor.razon_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Múltiplo"
              variant="outlined"
              type="number"
              value={componenteMultiplo}
              onChange={handleDetailMultiplo}
              inputProps={{ min: 1 }}
              fullWidth
            />

            <TextField
              label="Factor Conversión"
              variant="outlined"
              type="number"
              value={componenteConversion}
              onChange={handleDetailConversion}
              inputProps={{ min: 1 }}
              fullWidth
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 4,
            }}
          >
            <Button
              onClick={handleCloseDetailsComponente}
              variant="contained"
              color="primary"
            >
              Cerrar
            </Button>

            <Button
              onClick={() => updateDetailComponente(productoIdComponent)}
              variant="contained"
              color="success"
            >
              Guardar
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Componentes;
