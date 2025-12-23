import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import logo from "../../images/APHELIOS negro.png";

const FullScreenLoader = ({
  open = false,
  text = "Procesando…",
  progress = null, 
}) => {
  if (!open) return null;

  const pct = typeof progress === "number"
    ? Math.max(0, Math.min(100, Math.round(progress)))
    : null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        bgcolor: "rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "6px solid rgba(255,255,255,0.25)",
          borderTopColor: "#1e88e5",
          animation: "spin 1s linear infinite",
          "@keyframes spin": {
            "0%": { transform: "rotate(0)" },
            "100%": { transform: "rotate(360deg)" },
          },
          position: "relative",
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Aphelios"
          sx={{
            position: "absolute",
            inset: 0,
            m: "auto",
            width: 70,
            height: "auto",
            filter: "drop-shadow(0 0 6px rgba(255,255,255,0.6))",
          }}
        />
      </Box>

      <Typography sx={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
        {text}
      </Typography>

      {pct !== null && (
        <Box sx={{ width: "min(420px, 90vw)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
              Progreso
            </Typography>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
              {pct}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 10,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.18)",
              "& .MuiLinearProgress-bar": { borderRadius: 999 },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default FullScreenLoader;
