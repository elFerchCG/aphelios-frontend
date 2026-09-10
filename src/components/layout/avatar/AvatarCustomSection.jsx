import React from "react";

import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

const AvatarCustomSection = ({
  hasCustomAvatar,
  loadingCustom,
  customSeleccionada,
  hayNuevaImagen,
  imagenCustomVisible,
  saving,

  onSelectSaved,
  onFileChange,
}) => {
  return (
    <Box
      sx={{
        mt: 3.5,
        pt: 3,

        borderTop:
          "1px solid #eaecf0",
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 15,
          color: "#0f2744",
          mb: 0.7,
        }}
      >
        Imagen personalizada
      </Typography>

      <Typography
        sx={{
          fontSize: 13,
          color: "#667085",
          mb: 2,
        }}
      >
        Puedes subir una imagen JPG,
        PNG o WEBP de máximo 1 MB.
      </Typography>

      {loadingCustom && (
        <Box
          sx={{
            display: "flex",
            justifyContent:
              "center",
            py: 2,
          }}
        >
          <CircularProgress
            size={26}
          />
        </Box>
      )}

      {!loadingCustom &&
        imagenCustomVisible && (
          <Box
            sx={{
              display: "flex",
              flexDirection:
                "column",
              alignItems:
                "center",
              mb: 2.5,
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={
                onSelectSaved
              }
              sx={{
                p: "4px",

                border:
                  customSeleccionada
                    ? "3px solid #1976d2"
                    : "3px solid #e4e7ec",

                borderRadius:
                  "50%",

                backgroundColor:
                  "transparent",

                cursor:
                  "pointer",

                transition:
                  "0.2s ease",

                "&:hover": {
                  transform:
                    "scale(1.03)",

                  borderColor:
                    "#1976d2",
                },
              }}
            >
              <Box
                component="img"
                src={
                  imagenCustomVisible
                }
                alt="Avatar personalizado"
                sx={{
                  width: 110,
                  height: 110,

                  display:
                    "block",

                  objectFit:
                    "cover",

                  borderRadius:
                    "50%",
                }}
              />
            </Box>

            {hasCustomAvatar &&
              !hayNuevaImagen && (
                <>
                  <Typography
                    sx={{
                      mt: 1.3,

                      fontSize:
                        13,

                      fontWeight:
                        700,

                      color:
                        customSeleccionada
                          ? "#1976d2"
                          : "#667085",
                    }}
                  >
                    {customSeleccionada
                      ? "Imagen personalizada seleccionada"
                      : "Imagen personalizada guardada"}
                  </Typography>

                  {!customSeleccionada && (
                    <Typography
                      sx={{
                        mt: 0.5,

                        maxWidth:
                          390,

                        textAlign:
                          "center",

                        fontSize:
                          12,

                        color:
                          "#98a2b3",
                      }}
                    >
                      Haz clic en la
                      imagen para volver
                      a utilizarla.
                    </Typography>
                  )}
                </>
              )}

            {hayNuevaImagen && (
              <Box
                sx={{
                  mt: 1.5,
                  px: 2,
                  py: 1.2,

                  borderRadius:
                    "10px",

                  backgroundColor:
                    hasCustomAvatar
                      ? "#fff7ed"
                      : "#eff6ff",

                  border:
                    hasCustomAvatar
                      ? "1px solid #fed7aa"
                      : "1px solid #bfdbfe",
                }}
              >
                <Typography
                  sx={{
                    textAlign:
                      "center",

                    fontSize:
                      13,

                    fontWeight:
                      600,

                    color:
                      hasCustomAvatar
                        ? "#c2410c"
                        : "#1976d2",
                  }}
                >
                  {hasCustomAvatar
                    ? "La nueva imagen reemplazará tu imagen personalizada actual al guardar."
                    : "Esta será tu nueva imagen personalizada."}
                </Typography>
              </Box>
            )}
          </Box>
        )}

      {!loadingCustom &&
        !hasCustomAvatar &&
        !imagenCustomVisible && (
          <Typography
            sx={{
              mb: 2,
              fontSize: 12,
              color: "#98a2b3",
            }}
          >
            Aún no tienes una imagen
            personalizada guardada.
          </Typography>
        )}

      <Button
        component="label"
        variant="outlined"
        disabled={saving}
        sx={{
          fontWeight: 700,

          textTransform:
            "none",

          borderRadius:
            "10px",
        }}
      >
        {hasCustomAvatar
          ? "Cambiar imagen"
          : "Seleccionar imagen"}

        <input
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={
            onFileChange
          }
        />
      </Button>
    </Box>
  );
};

export default AvatarCustomSection;