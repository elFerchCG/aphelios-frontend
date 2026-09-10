export const toolbarFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 48,
  },
};

export const toolbarButtonSx = {
  height: 48,
  px: 3,
  whiteSpace: "nowrap",

  backgroundColor: "#1e88e5",
  color: "#fff",

  fontWeight: 500,
  textTransform: "none",

  borderRadius: 2,
  boxShadow: "0 2px 6px rgba(30, 136, 229, 0.25)",

  "&:hover": {
    backgroundColor: "#1565c0",
    boxShadow: "0 4px 10px rgba(30, 136, 229, 0.30)",
  },

  "&:disabled": {
    backgroundColor: "#bbdefb",
    color: "#ffffff",
  },
};

export const fieldWidths = {
  small: 180,
  medium: 280,
  large: 500,
};

export const modalPrimaryButtonSx = {
  height: 44,
  px: 3,
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 600,

  backgroundColor: "#1e88e5",
  color: "#fff",

  "&:hover": {
    backgroundColor: "#1565c0",
  },
};

export const modalSecondaryButtonSx = {
  height: 44,
  px: 3,
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 500,

  color: "#1565c0",
  borderColor: "#90caf9",

  "&:hover": {
    borderColor: "#1e88e5",
    backgroundColor: "#e3f2fd",
  },
};

export const modalTitleSx = {
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "#1a237e",

  px: 3,
  py: 2,

  backgroundColor: "#e3f2fd",
  borderBottom: "1px solid #bbdefb",
};
