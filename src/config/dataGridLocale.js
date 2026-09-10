export const DATA_GRID_LOCALE_ES = {
  // Estados
  noRowsLabel: "No se encontraron registros",
  noResultsOverlayLabel: "Sin resultados.",
  errorOverlayDefaultLabel: "Ocurrió un error.",

  // Footer
  footerRowSelected: (count) =>
    `${count} fila${count !== 1 ? "s" : ""} seleccionada${count !== 1 ? "s" : ""}`,

  footerTotalRows: "Total de filas:",

  // Menú de columnas
  columnMenuLabel: "Menú",
  columnMenuShowColumns: "Mostrar columnas",
  columnMenuFilter: "Filtrar",
  columnMenuHideColumn: "Ocultar",
  columnMenuUnsort: "Quitar orden",
  columnMenuSortAsc: "Ordenar ascendente",
  columnMenuSortDesc: "Ordenar descendente",

  // Toolbar
  toolbarColumns: "Columnas",
  toolbarFilters: "Filtros",
  toolbarDensity: "Densidad",

  toolbarDensityCompact: "Compacta",
  toolbarDensityStandard: "Estándar",
  toolbarDensityComfortable: "Cómoda",

  toolbarExport: "Exportar",
  toolbarExportCSV: "Descargar CSV",
  toolbarExportPrint: "Imprimir",

  // Paginación
  MuiTablePagination: {
    labelRowsPerPage: "Filas por página",

    labelDisplayedRows: ({ from, to, count }) =>
      `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`,
  },
};