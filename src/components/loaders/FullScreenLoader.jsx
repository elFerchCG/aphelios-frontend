import React from "react";
import { Box } from "@mui/material";
import logo from "../../images/APHELIOS negro.png"; 

const FullScreenLoader = ({ open = false, text = "Procesando…" }) => {
  if (!open) return null;
  return (
    <Box
      sx={{
        position: "fixed", inset: 0, zIndex: 2000,
        bgcolor: "rgba(0,0,0,0.55)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 2
      }}
    >
      <Box
        sx={{
          width: 120, height: 120, borderRadius: "50%",
          border: "6px solid rgba(255,255,255,0.25)",
          borderTopColor: "#1e88e5", 
          animation: "spin 1s linear infinite",
          "@keyframes spin": { "0%": { transform: "rotate(0)" }, "100%": { transform: "rotate(360deg)" } },
          position: "relative",
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Aphelios"
          sx={{ position: "absolute", inset: 0, m: "auto", width: 70, height: "auto", filter: "drop-shadow(0 0 6px rgba(255,255,255,0.6))" }}
        />
      </Box>
      <Box sx={{ color: "#fff", fontSize: 16 }}>{text}</Box>
    </Box>
  );
};

export default FullScreenLoader;
