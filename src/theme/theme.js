import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
          borderWidth: 3,
          borderColor: "#1e88e5",
          borderStyle: "solid",
          height: 500,
        },
        columnHeaders: {
          backgroundColor: "#1e88e5",
          color: "#fff",
          fontWeight: "bold",
        },
        row: {
          "&:hover": {
            backgroundColor: "rgba(30, 136, 229, 0.08)",
          },
        },
      },
    },
  },
});

export default theme;
