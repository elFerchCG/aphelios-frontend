import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: '"Montserrat", sans-serif',

    button: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 600,
      textTransform: "none",
    },
  },

  components: {
    // Evita que MUI le meta overflow:hidden + padding-right de compensación
    // al <body> cada vez que se abre un Dialog/Modal/Menu/Drawer (todos usan
    // MuiModal por debajo). Ese padding-right encogía el header (y cualquier
    // barra full-width) dejando un hueco en blanco a la derecha cuando la
    // página tenía scrollbar real en ese momento. Efecto secundario aceptado:
    // el fondo detrás de un modal abierto se puede scrollear con la rueda del
    // mouse (el backdrop igual sigue bloqueando los clics).
    MuiModal: {
      defaultProps: {
        disableScrollLock: true,
      },
    },

    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
          borderWidth: 3,
          borderColor: "#1e88e5",
          borderStyle: "solid",
          fontFamily: '"Montserrat", sans-serif',
        },

        columnHeaders: {
          backgroundColor: "#1e88e5",
          color: "#000000ff",
          fontWeight: "bold",
        },

        row: {
          "&:hover": {
            backgroundColor: "rgba(30, 136, 229, 0.08)",
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
          fontWeight: 600,
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
        },
        input: {
          fontFamily: '"Montserrat", sans-serif',
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: '"Montserrat", sans-serif',
        },
      },
    },
  },
});

export default theme;
