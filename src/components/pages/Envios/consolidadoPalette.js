// Paleta de color compartida para el "Consolidado de Producción" (drawer
// de Envíos: ConsolidadoDrawer / ProductoRow / ComponenteRow /
// TableFacturas / TableStockExcedente).

export const palette = {

    surface: "#ffffff",
    surfaceMuted: "#fafafa",
    surfaceSunken: "#f5f5f5",

    border: "#e0e0e0",
    borderStrong: "#bdbdbd",

    textPrimary: "#212121",
    textSecondary: "#616161",
    textDisabled: "#9e9e9e",

    // Azul aphelios — el mismo de los encabezados/bordes de DataGrid
    // (theme.js) y de las celdas editables (.celdaEditable en styles.css).
    primary: {
        text: "#0d47a1",
        bg: "#e3f2fd",
        border: "#90caf9"
    },

    // Verde — igual a ESTATUS_CONFIG.abierto en TableOrdenes.jsx
    success: {
        text: "#2e7d32",
        bg: "#e8f5e9",
        border: "#a5d6a7"
    },

    // Naranja — igual a ESTATUS_CONFIG.confirmado en TableOrdenes.jsx
    // (pendiente / requiere atención — NO amarillo)
    warning: {
        text: "#ed6c02",
        bg: "#fff3e07c",
        border: "#ffcc80"
    },

    // Azul claro — igual a ESTATUS_CONFIG.procesado en TableOrdenes.jsx
    // (stock de excedentes de componentes)
    info: {
        text: "#0288d1",
        bg: "#e1f5fe",
        border: "#81d4fa"
    },

    // Gris — igual al estatus "Sin orden" (default) en TableOrdenes.jsx
    neutral: {
        text: "#616161",
        bg: "#f5f5f5",
        border: "#e0e0e0"
    }

};

export const tono = (nombre) => palette[nombre] || palette.neutral;