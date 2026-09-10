import { Paper } from "@mui/material";

const PageToolbarCard = ({
  children,
  sx = {},
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        mx: "30px",
        mb: 2,
        p: 2,

        borderRadius: 3,
        border: "1px solid #e0e0e0",

        backgroundColor: "rgba(255, 255, 255, 0.72)",

        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",

        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

export default PageToolbarCard;