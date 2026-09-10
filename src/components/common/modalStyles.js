export const modalTitleSx = {
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "#1a237e",
  px: 3,
  pt: 2.5,
  pb: 1.5,
  borderBottom: "1px solid #e0e0e0",
};

export const modalContentSx = {
  px: 3,
  py: 2.5,
};

export const modalActionsSx = {
  px: 3,
  pb: 2.5,
  pt: 1.5,
  gap: 1,
  borderTop: "1px solid #f0f0f0",
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