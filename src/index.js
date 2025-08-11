import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from "@mui/material/styles"; 
import "../src/estilos/styles.css";
import theme from "./theme/theme"; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
     <ThemeProvider theme={theme}>
    <App />
    </ThemeProvider>
);
