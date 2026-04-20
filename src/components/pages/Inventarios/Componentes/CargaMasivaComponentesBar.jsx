import React from "react";
import { Box, Alert } from "@mui/material";
import CargaMasivaBar from "../Billetes/CargaMasivaBar";

const CargaMasivaComponentesBar = ({
  onHowItWorks,
  onDownloadTemplate,
  onUploadSimular,
  modoAgregarActualizar,
  onChangeModo,
  simularPrimero,
  onChangeSimular,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, gap: 1 }}>
      <CargaMasivaBar
        labelBoton="CARGA MASIVA"
        onHowItWorks={onHowItWorks}
        onDownloadTemplate={onDownloadTemplate}
        onUploadSimular={onUploadSimular}
        modoAgregarActualizar={modoAgregarActualizar}
        onChangeModo={onChangeModo}
        simularPrimero={simularPrimero}
        onChangeSimular={onChangeSimular}
      />

      {modoAgregarActualizar && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{
            fontSize: 14,
          }}
        >
          <b>Reemplazar</b> eliminará los componentes actuales por SKU y los
          volverá a crear con lo del Excel. Úsalo solo si quieres resincronizar
          completamente.
        </Alert>
      )}

      {simularPrimero && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{
            fontSize: 14,
          }}
        >
          <b>Modo simulación activado.</b> El archivo se validará y te mostrará
          qué se insertaría o actualizaría, pero <b>no se guardará ningún cambio</b>{" "}
          en la base de datos.
        </Alert>
      )}
    </Box>
  );
};

export default CargaMasivaComponentesBar;