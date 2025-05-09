import React from 'react'
import {
    Box,
    Typography,
    Collapse,
    List,
    ListItemButton,
    ListItemText,
    Divider
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useState } from 'react';

const BarraLateral = ({ ordenes, onSelectOrden }) => {
    const [openSection, setOpenSection] = useState(null);

    const handleToggle = (section) => {
        setOpenSection((prev) => (prev === section ? null : section));
    };

    return (
        <Box
            sx={{
                width: 200,
                maxHeight: '80vh',
                overflowY: 'auto',
                borderRight: '1px solid #ddd',
                p: 2,
            }}
        >
            <List component="nav">
                {ordenes.map((orden) => (
                    <Box key={orden.orden_id}>
                        <ListItemButton onClick={() => onSelectOrden(orden.orden_id)}>
                            <ListItemText primary={`Orden #${orden.orden_id}`} />
                        </ListItemButton>
                        <Divider />
                    </Box>
                ))}
            </List>
        </Box>
    );
};

export default BarraLateral;