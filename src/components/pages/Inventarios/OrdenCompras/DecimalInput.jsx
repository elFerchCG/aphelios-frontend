import { GridEditInputCell } from "@mui/x-data-grid";
import { useState } from "react";
import React from "react";

const DecimalInput = ({ value, onValueChange, ...other }) => {
    const [inputValue, setInputValue] = useState(value);
  
    const handleChange = (event) => {
      const newValue = event.target.value;
      // Permitir solo números y el punto decimal
      if (/^\d*\.?\d*$/.test(newValue)) {
        setInputValue(newValue);
        onValueChange(newValue);  // Actualiza el valor en el DataGrid
      }
    };


return (
    <GridEditInputCell
    value={inputValue}
    onChange={handleChange}
    {...other}
/>
)
};

export default DecimalInput;