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
import { useState } from 'react';

const BarraLateral = ({ pedidos, onSelectPedido }) => {
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
                {pedidos.map((pedido) => (
                    <Box key={pedido.pedido_id}>
                        <ListItemButton onClick={() => onSelectPedido(pedido.pedido_id)}>
                            <ListItemText primary={`Pedido #${pedido.pedido_id}`} />
                        </ListItemButton>
                        <Divider />
                    </Box>
                ))}
            </List>
        </Box>
    );
};

export default BarraLateral;