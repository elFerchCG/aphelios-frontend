import {
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarContainer,
} from '@mui/x-data-grid';

const AppDataGridToolbar = ({
  exportFileName = 'exportacion',
}) => {
  return (
    <GridToolbarContainer
      sx={{
        px: 1.5,
        py: 1,
        gap: 0.5,
      }}
    >
      <GridToolbarColumnsButton />

      <GridToolbarFilterButton />

      <GridToolbarDensitySelector />

      <GridToolbarExport
        csvOptions={{
          fileName: exportFileName,
          utf8WithBom: true,
        }}
      />
    </GridToolbarContainer>
  );
};

export default AppDataGridToolbar;