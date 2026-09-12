import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import AppDataGridToolbar from "./AppDataGridToolbar";
import { DATA_GRID_CONFIG } from "../../config/dataGridConfig";
import { DATA_GRID_LOCALE_ES } from "../../config/dataGridLocale";

const AppDataGrid = ({
  rows = [],
  columns = [],

  getRowId,

  loading = false,

  height = DATA_GRID_CONFIG.height,
  rowHeight = DATA_GRID_CONFIG.rowHeight,
  columnHeaderHeight = DATA_GRID_CONFIG.columnHeaderHeight,

  pageSize = DATA_GRID_CONFIG.pageSize,
  pageSizeOptions = DATA_GRID_CONFIG.pageSizeOptions,

  exportFileName = "exportacion",

  showToolbar = true,

  toolbar,

  initialColumnVisibilityModel = {},

  sx = {},

  ...props
}) => {
  const ToolbarComponent =
    toolbar || (() => <AppDataGridToolbar exportFileName={exportFileName} />);

  return (
    <Box
      sx={{
        width: "100%",
        height,
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        loading={loading}
        localeText={DATA_GRID_LOCALE_ES}
        rowHeight={rowHeight}
        columnHeaderHeight={columnHeaderHeight}
        pagination
        initialState={{
          density: DATA_GRID_CONFIG.density,

          columns: {
            columnVisibilityModel: initialColumnVisibilityModel,
          },

          pagination: {
            paginationModel: {
              page: 0,
              pageSize,
            },
          },
        }}
        pageSizeOptions={pageSizeOptions}
        slots={
          showToolbar
            ? {
                toolbar: ToolbarComponent,
              }
            : undefined
        }
        disableRowSelectionOnClick
        sx={{
          width: "100%",
          height: "100%",

          border: "none",

          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 500,
            fontSize: "1.05rem",
          },

          "& .MuiDataGrid-cell": {
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: DATA_GRID_CONFIG.colors.hover,
          },

          "& .MuiDataGrid-footerContainer": {
            minHeight: 52,
            borderTop: `1px solid ${DATA_GRID_CONFIG.colors.border}`,
          },

          "& .MuiTablePagination-toolbar": {
            minHeight: "52px",
          },

          ...sx,
        }}
        {...props}
      />
    </Box>
  );
};

export default AppDataGrid;