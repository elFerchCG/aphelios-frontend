import React from "react";
import { Button } from "@mui/material";

export const getProductosColumns = ({ rowsProducts, onSelectRow }) => [
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
        onClick={() => onSelectRow(params)}
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
    headerName: "Tipo publicación",
    type: "text",
    flex: 1,
    headerClassName: "header-wrap",
    headerAlign: "center",
  },
  {
    field: "id",
    headerName: "#Publicación",
    type: "text",
    flex: 1,
  },
  {
    field: "catalog_id",
    headerName: "#Catálogo",
    type: "text",
    flex: 1,
  },
  {
    field: "title",
    headerName: "Título",
    type: "text",
    flex: 3,
  },
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
  {
    field: "variation_desc",
    headerName: "Variante",
    type: "text",
    flex: 1,
  },
];