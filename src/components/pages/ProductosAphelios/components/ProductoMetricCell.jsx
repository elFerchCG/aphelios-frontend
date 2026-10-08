import React from "react";

import {
  Chip,
} from "@mui/material";

import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";

const ProductoMetricCell = ({
  type,
  value,
}) => {
  const icons = {
    stock:
      <Inventory2OutlinedIcon />,

    relations:
      <AccountTreeOutlinedIcon />,

    items:
      <StorefrontOutlinedIcon />,
  };

  return (
    <Chip
      size="small"
      icon={icons[type]}
      label={value ?? 0}
      variant="outlined"
    />
  );
};

export default ProductoMetricCell;