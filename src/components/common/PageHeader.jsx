import { Box, Stack, Typography } from "@mui/material";

const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  color = "#1e88e5",
}) => {
  return (
    <Box
      sx={{
        mx: "30px",
        mt: "24px",
        mb: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 0.5 }}
      >
        {Icon && (
          <Icon
            sx={{
              color,
              fontSize: 32,
            }}
          />
        )}

        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#1a237e",
          }}
        >
          {title}
        </Typography>
      </Stack>

      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            color: "#78909c",
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default PageHeader;