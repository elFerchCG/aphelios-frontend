import { Typography, Box, Stack, Paper, Divider } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import BackupSharpIcon from "@mui/icons-material/BackupSharp";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import ProformaFacturasModal from "./ProformaFacturasModal";
import FullScreenLoader from "../../loaders/FullScreenLoader";

const CargaFacturas = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  const [modalProformasOpen, setModalProformasOpen] = useState(false);
  const [facturasSubidas, setFacturasSubidas] = useState([]);

  const [procesandoArchivos, setProcesandoArchivos] = useState(false);
  const [loadingText, setLoadingText] = useState("Procesando archivos...");

  const [lastUploadSummary, setLastUploadSummary] = useState({
    xml: 0,
    xlsx: 0,
    total: 0,
  });

  const navigate = useNavigate();

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

  const handleMostrarFacturas = () => {
    navigate("/facturas");
  };

  const descargarPlantilla = () => {
    window.open(`${apiUrl}/template/remisionProvisional`, "_blank");
  };

  // ============================================================
  // SUBIR XML - FACTURAS REALES
  // ============================================================
  const handleXmlUpload = async (xmlFiles) => {
    const formData = new FormData();

    xmlFiles.forEach((file) => {
      formData.append("archivo_xml", file);
    });

    try {
      const response = await axios.post(
        `${apiUrl}/facturas/cargarFactura`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            // Authorization: `Bearer ${token}`,
          },
        },
      );

      const resultados = response.data.resultados || [];

      const exitosos = resultados.filter((r) => !r.error && r.factura_id);

      const facturaIds = exitosos.map((r) => r.factura_id);

      const errores = resultados.filter((r) => r.error);

      if (errores.length > 0) {
        await Swal.fire({
          title:
            exitosos.length > 0
              ? "Carga parcial"
              : "No se pudieron cargar las facturas",
          html: errores
            .map(
              (r) => `
                <b>${r.archivo}</b><br/>
                ${r.error}
              `,
            )
            .join("<br/><br/>"),
          icon: "warning",
          width: 700,
          showCloseButton: true,
        });
      }

      // Ya NO abrimos el modal aquí.
      // Regresamos los IDs y onDrop decide cuándo abrirlo.
      return facturaIds;
    } catch (error) {
      await Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Error en la carga de XML.",
        icon: "error",
      });

      return [];
    }
  };

  // ============================================================
  // SUBIR EXCEL - REMISIONES PROVISIONALES
  // ============================================================
  const handleExcelUpload = async (xlsxFiles) => {
    const formData = new FormData();

    xlsxFiles.forEach((file) => {
      formData.append("archivo_excel", file);
    });

    try {
      const response = await axios.post(
        `${apiUrl}/facturas/cargarRemisionesExcel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const resultados = response.data.resultados || [];

      // Remisiones que sí se crearon correctamente
      const exitosos = resultados.filter((r) => !r.error && r.factura_id);

      // Remisiones que tuvieron algún error
      const errores = resultados.filter((r) => r.error);

      // IDs que posteriormente enviaremos al modal de proforma
      const facturaIds = exitosos.map((r) => r.factura_id);

      // ========================================================
      // CASO 1: TODOS LOS ARCHIVOS FALLARON
      // ========================================================
      if (errores.length > 0 && exitosos.length === 0) {
        Swal.fire({
          title: "No se pudo cargar la remisión",
          html: errores
            .map(
              (r) => `
              <b>${r.archivo}</b><br/>
              ${String(r.error).replace(/\n/g, "<br/>")}
            `,
            )
            .join("<br/><br/>"),
          icon: "warning",
          showCloseButton: true,
          width: 700,
        });

        return [];
      }

      // ========================================================
      // CASO 2: ALGUNOS ARCHIVOS SE CARGARON Y OTROS FALLARON
      // ========================================================
      if (errores.length > 0 && exitosos.length > 0) {
        Swal.fire({
          title: "Carga parcial",
          html: `
          <b>Archivos cargados:</b> ${exitosos.length}<br/>
          <b>Archivos con error:</b> ${errores.length}<br/><br/>

          ${errores
            .map(
              (r) => `
                <b>${r.archivo}</b><br/>
                ${String(r.error).replace(/\n/g, "<br/>")}
              `,
            )
            .join("<br/><br/>")}
        `,
          icon: "warning",
          showCloseButton: true,
          width: 700,
        });

        // Aunque algunos fallaron, regresamos los IDs
        // de las remisiones que sí se crearon.
        return facturaIds;
      }

      // ========================================================
      // CASO 3: TODO CORRECTO
      // ========================================================

      // No mostramos SweetAlert de éxito porque el siguiente
      // paso del flujo será abrir el modal de proforma.
      return facturaIds;
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Error en la carga de Excel.",
        icon: "error",
      });

      return [];
    }
  };

  // ============================================================
  // PROCESAR ARCHIVOS
  // ============================================================
  const onDrop = async (acceptedFiles) => {
    const xmlFiles = acceptedFiles.filter((file) =>
      file.name.toLowerCase().endsWith(".xml"),
    );

    const xlsxFiles = acceptedFiles.filter((file) =>
      file.name.toLowerCase().endsWith(".xlsx"),
    );

    setLastUploadSummary({
      xml: xmlFiles.length,
      xlsx: xlsxFiles.length,
      total: acceptedFiles.length,
    });

    if (!xmlFiles.length && !xlsxFiles.length) {
      Swal.fire(
        "Atención",
        "Solo se permiten archivos .xml y .xlsx",
        "warning",
      );

      return;
    }

    setProcesandoArchivos(true);

    // Aquí acumularemos tanto facturas XML
    // como remisiones Excel.
    const facturaIdsGenerados = [];

    try {
      // ========================================================
      // XML
      // ========================================================
      if (xmlFiles.length) {
        setLoadingText(
          xmlFiles.length === 1
            ? "Procesando factura..."
            : `Procesando ${xmlFiles.length} facturas...`,
        );

        const xmlIds = await handleXmlUpload(xmlFiles);

        if (Array.isArray(xmlIds)) {
          facturaIdsGenerados.push(...xmlIds);
        }
      }

      // ========================================================
      // REMISIONES
      // ========================================================
      if (xlsxFiles.length) {
        setLoadingText(
          xlsxFiles.length === 1
            ? "Procesando remisión..."
            : `Procesando ${xlsxFiles.length} remisiones...`,
        );

        const remisionIds = await handleExcelUpload(xlsxFiles);

        if (Array.isArray(remisionIds)) {
          facturaIdsGenerados.push(...remisionIds);
        }
      }
    } finally {
      setProcesandoArchivos(false);
      setLoadingText("Procesando archivos...");
    }

    // ==========================================================
    // ABRIR PROFORMA UNA SOLA VEZ
    // ==========================================================
    if (facturaIdsGenerados.length > 0) {
      setFacturasSubidas(facturaIdsGenerados);

      setModalProformasOpen(true);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: procesandoArchivos,

    accept: {
      "text/xml": [".xml"],

      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  return (
    <div>
      {/* ====================================================== */}
      {/* LOADER */}
      {/* ====================================================== */}

      <FullScreenLoader open={procesandoArchivos} text={loadingText} />

      {/* ====================================================== */}
      {/* ACCIONES */}
      {/* ====================================================== */}

      <div className="gestorOrdenes">
        <div className="left-actions">
          <div
            className="action-item"
            style={{
              cursor: "pointer",
            }}
            onClick={handleMostrarFacturas}
          >
            <DescriptionOutlinedIcon
              className="action-icon"
              sx={{
                fontSize: 30,
              }}
            />

            <span>Ver Facturas</span>
          </div>

          <div
            className="action-item"
            style={{
              cursor: "pointer",
            }}
            onClick={descargarPlantilla}
          >
            <DownloadIcon
              className="action-icon"
              sx={{
                fontSize: 30,
              }}
            />

            <span>Descargar Plantilla Remisión</span>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* CONTENIDO */}
      {/* ====================================================== */}

      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            fontFamily: "Montserrat",
            fontWeight: "bold",
            width: "100%",
          }}
        >
          <h2>Facturas / Remisiones</h2>

          {/* ================================================== */}
          {/* GUÍA */}
          {/* ================================================== */}

          <Paper
            sx={{
              width: "80%",
              p: 2,
              mb: 2,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
              }}
            >
              Puedes subir varios archivos a la vez (.xml y .xlsx)
            </Typography>

            <Divider
              sx={{
                my: 1,
              }}
            />

            <Typography variant="body2">
              <b>XML (Factura CFDI):</b> factura real timbrada, actualiza
              UUID/costos.
              <br />
              <b>Excel (Remisión):</b> documento provisional para recibir
              mercancía sin XML. Cuando llegue el XML se actualizará.
            </Typography>
          </Paper>

          {/* ================================================== */}
          {/* DROPZONE */}
          {/* ================================================== */}

          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed #aaa",
              borderRadius: "10px",
              p: 4,
              height: "120px",
              width: "80%",

              backgroundColor: isDragActive ? "#f0f8ff" : "#fafafa",

              transition: "background-color 0.3s ease-in-out",

              cursor: procesandoArchivos ? "not-allowed" : "pointer",

              opacity: procesandoArchivos ? 0.7 : 1,

              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
            }}
          >
            <BackupSharpIcon
              color="primary"
              sx={{
                fontSize: 60,
              }}
            />

            <input {...getInputProps()} />

            <Typography variant="body1">
              {procesandoArchivos
                ? "Procesando archivos..."
                : isDragActive
                  ? "Suelta los archivos aquí..."
                  : "Arrastra archivos XML o Excel aquí (o clic para seleccionar)"}
            </Typography>
          </Box>

          {/* ================================================== */}
          {/* RESUMEN */}
          {/* ================================================== */}

          <Paper
            sx={{
              width: "80%",
              mt: 3,
              p: 2,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
              }}
            >
              Resumen de archivos detectados
            </Typography>

            <Divider
              sx={{
                my: 1,
              }}
            />

            <Stack direction="row" spacing={3} justifyContent="center">
              <Typography>XML: {lastUploadSummary.xml}</Typography>

              <Typography>Excel: {lastUploadSummary.xlsx}</Typography>

              <Typography>Total: {lastUploadSummary.total}</Typography>
            </Stack>
          </Paper>
        </Box>
      </Box>

      {/* ====================================================== */}
      {/* PROFORMA */}
      {/* ====================================================== */}

      <ProformaFacturasModal
        open={modalProformasOpen}
        onClose={() => setModalProformasOpen(false)}
        facturaIds={facturasSubidas}
        apiUrl={apiUrl}
      />
    </div>
  );
};

export default CargaFacturas;
