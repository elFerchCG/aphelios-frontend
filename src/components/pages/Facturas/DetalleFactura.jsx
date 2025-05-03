import { Box, TextField, Tooltip } from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import axios from "axios";
import React, { useEffect, useState } from "react";
import DetailsIcon from "@mui/icons-material/Details";
import Typography from "@mui/material/Typography";
import Swal from "sweetalert2";
import { useParams, useLocation } from "react-router-dom";

const DetalleFactura = () => {
  const { facturaId } = useParams(); // Aquí obtienes ambos parámetros
  const location = useLocation();
  const proveedorNombre = location.state?.proveedorNombre;
  const [data, setData] = useState([]);
  const [dataProveedor, setDataProveedor] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: true,
    descripcion: true,
    estatus: true,
  });

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport
        csvOptions={{ fileName: "exported_data", utf8WithBom: true }}
      />
    </GridToolbarContainer>
  );

  useEffect(() => {
    fetchDetalleFactura(facturaId);
  }, [apiUrl]);

  useEffect(() => {
    fetchProveedor(proveedorNombre);
  }, [apiUrl]);

  const parseDetalles = (detalles) =>
    detalles.map((d, idx) => ({
      ...d,
      cantidad: parseFloat(d.cantidad),
      precio: parseFloat(d.precio),
      total: parseFloat(d.total),
      id: idx, // Aquí asignamos un `id` único usando el índice
    }));

  const fetchProveedor = async (proveedorNombre) => {
    try {
      const response = await axios.get(
        `${apiUrl}/proveedores/nombreProveedor`,
        {
          params: {
            proveedor_nombre: proveedorNombre,
          },
        }
      );

      console.log(response.data);
      setDataProveedor(response.data.data[0]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error al cargar los datos";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "warning",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const fetchDetalleFactura = async (facturaId) => {
    try {
      const response = await axios.get(`${apiUrl}/facturas/${facturaId}`);
      if (response.data && Array.isArray(response.data.detalles)) {
        const detallesParseados = parseDetalles(response.data.detalles);
        setData(detallesParseados);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error al cargar los datos";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "warning",
        timer: 5000,
        showCloseButton: true,
        allowEscapeKey: true,
      });
    }
  };

  const columns = [
    {
      field: "linea_id",
      headerName: "Folio de Linea",
      type: "number",
      flex: 0.6,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "sku",
      headerName: "SKU",
      type: "text",
      flex: 2,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "cantidad",
      headerName: "Cantidad",
      type: "number",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "precio",
      headerName: "Precio",
      type: "number",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      type: "number",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "orden_id",
      headerName: "Folio Orden",
      type: "text",
      flex: 0.6,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "actions",
      headerName: "Acciones",
      type: "actions",
      getActions: (params) => [
        <Tooltip title="Detalles" key={`envios-${params.row.id}`}>
          <GridActionsCellItem
            icon={<DetailsIcon />}
            sx={{ color: "blue" }}
            label="Detalles"
            //onClick={() => handleDetallesFactura(params.row.id)}
          />
        </Tooltip>,
      ],
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        fontFamily: "Montserrat",
        fontWeight: "bold",
      }}
    >
      <div
        style={{
          flexDirection: "row",
          fontFamily: "Montserrat",
          fontWeight: "bold",
          textAlign: "center",
          width: "90%",
          height: 500,
        }}
      >
        <h2>Detalle Factura {facturaId}</h2>
        <Box
          display="flex"
          justifyContent="center"
          sx={{ height: 150, borderRadius: 4, boxShadow: 4, borderWidth: 3 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            
            <Box sx={{ alignItems: "start" }}>
            <Typography variant="h6" component="h2">
              Informacion de la empresa emisora
            </Typography>
            <Typography variant="body1">
              <strong>Proveedor:</strong>{" "}
              {dataProveedor?.razon_social || "Cargando..."}
            </Typography>
            <Typography variant="body1">
              <strong>RFC:</strong> {dataProveedor?.rfc || "Cargando..."}
            </Typography>
            <Typography variant="body1">
              <strong>Correo:</strong> {dataProveedor?.correo || "Cargando..."}
            </Typography>

            
            </Box>
          </Box>
        </Box>
        <DataGrid
          sx={{
            borderRadius: 4,
            boxShadow: 24,
            borderWidth: 3,
            borderColor: "#1e88e5",
            fontFamily: "Montserrat",
            fontWeight: "bold",
            height: 400,
            mt: 2,
          }}
          rows={data}
          columns={columns}
          showCellVerticalBorder
          showColumnVerticalBorder
          //getRowId={(row, index) => index} // Usa el índice como id temporal
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) =>
            setColumnVisibilityModel(newModel)
          }
          experimentalFeatures={{ newEditingApi: true }}
          density="compact" // Establece el tamaño de las filas en compacto por defecto
          slots={{ toolbar: CustomToolbar }}
        />
      </div>
    </div>
  );
};

export default DetalleFactura;
