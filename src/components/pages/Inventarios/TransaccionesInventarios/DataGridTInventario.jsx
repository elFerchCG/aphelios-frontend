import React, { useState, useEffect } from "react";
import {
  DataGrid,
  GridToolbar,
  GRID_DEFAULT_LOCALE_TEXT,
} from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { getTransaccionesI } from "../../../actions/getUsers";
import apiUrl from "../../../../config";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
  },
});

const formatFecha = (fechaISO) => {
  if (!fechaISO) return "";
  const date = new Date(fechaISO);
  if (isNaN(date.getTime())) {
    console.log("Fecha inválida:", fechaISO);
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DataGridTInventario = ({ filter }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const url = `${apiUrl}/inventario/transacciones`;

  const fmtNA = (v) => (v == null || v === "" ? "N/A" : v);

    const [columnVisibilityModelTransacciones, setColumnVisibilityModelTransacciones] = useState({
        transaccion_id: false,
        orden_id: false,
        tipo: true,
        sku: true,
        inventory_id: true,
        localidad_id: true,
        cantidad: true,
        inventario_inicial: true,
        inventario_final: true,
        fecha_transaccion: true,
        usuario_autorizacion: true,
        usuario_transaccion: true,
    })

  const columns = [
    // { field: 'id', headerName: 'ID', flex: 1 },
    {
      field: "transaccion_id",
      headerName: "Folio",
      type: "number",
      flex: 1,
      filterable: true,
    },
    {
      field: "orden_id",
      headerName: "Folio Orden",
      type: "number",
      flex: 1,
      filterable: true,
    },
    {
      field: "tipo",
      headerName: "Tipo de transacción",
      type: "string",
      flex: 2,
      filterable: true,
    },
    {
      field: "sku",
      headerName: "SKU",
      type: "text",
      flex: 2,
      sortable: true,
      filterable: true,
    },
    { field: "inventory_id", headerName: "ML", type: "text", flex: 2 },
    { field: "localidad_id", headerName: "Ubicación", type: "number", flex: 1 },
    {
      field: "cantidad",
      headerName: "Cantidad",
      type: "number",
      flex: 1,
      headerAlign: "center",
      filterable: true,
    },
    {
      field: "inventario_inicial",
      headerName: "Inventario\nInicial",
      type: "number",
      flex: 1,
      headerClassName: "header-wrap",
      headerAlign: "center",
    },
    {
      field: "inventario_final",
      headerName: "Inventario\nFinal",
      type: "number",
      flex: 1,
      headerClassName: "header-wrap",
      headerAlign: "center",
    },
    {
      field: "fecha_transaccion",
      headerName: "Fecha\ntransacción",
      headerClassName: "header-wrap",
      headerAlign: "center",
      flex: 1,
      renderCell: (params) => formatFecha(params.value),
    },
    // 👇 Estas dos con valueFormatter seguro (sin acceder a row)
    {
      field: "orden_confirmado_por",
      headerName: "Confirmó",
      type: "string",
      flex: 1,
      headerAlign: "center",
      valueFormatter: fmtNA,
    },
    {
      field: "orden_procesado_por",
      headerName: "Procesó",
      type: "string",
      flex: 1,
      headerAlign: "center",
      valueFormatter: fmtNA,
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    const result = await getTransaccionesI(url);
    setData(result.data);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

    return (
        <div className='contenido'>
            <div className='encabezado'>
                <h1>Transacciones de Inventario</h1>
            </div>
            <div style={{ height: 500, width: 'auto', margin: '30px' }}>

                <DataGrid
                    style={{ fontFamily: "Montserrat", fontWeight: "bold" }}
                    rows={data}
                    columns={columns}
                    pageSize={5}
                    showCellVerticalBorder
                    showColumnVerticalBorder
                    getRowId={(row) => row.transaccion_id}
                    experimentalFeatures={{ newEditingApi: true }}
                    columnVisibilityModel={columnVisibilityModelTransacciones}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModelTransacciones(newModel)}
                    localeText={{
                        ...GRID_DEFAULT_LOCALE_TEXT, ...{
                            toolbarColumns: 'Columnas',
                            toolbarDensity: 'Densidad',
                            toolbarExport: 'Exportar',
                            toolbarFilters: 'Filtros',
                            filterPanelOperator: 'Operador',
                            toolbarFiltersTooltipHide: 'Ocultar filtros',
                            toolbarFiltersTooltipShow: 'Mostrar filtros',
                            footerRowSelected: (count) => `${count} fila(s) seleccionada(s)`,
                            footerTotalVisibleRows: (visibleCount, totalCount) =>
                                `${visibleCount} de ${totalCount}`,
                            footerPaginationRowsPerPage: 'Filas por página', // Traducción de Rows per page
                        }
                    }} // Localización en español
                    slots={{ toolbar: GridToolbar }}
                    sortModel={[
                        {
                            field: 'linea_orden_id',
                            sort: 'desc',
                        },
                    ]}
                />

            </div>
        </div>
    );
};

export default DataGridTInventario;
