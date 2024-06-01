import { Box, IconButton, Tooltip } from '@mui/material'
import React from 'react'
import { Preview, Delete } from '@mui/icons-material'

const ProveedoresActions = ({params}) => {
  return (
    <Box>
        <Tooltip title='Ver detalles'>
            <IconButton onClick={()=>{}}>
                <Preview />
            </IconButton>
        </Tooltip>  
        <Tooltip title='Eliminar proveedor'>
            <IconButton onClick={()=>{}}>
                <Delete />
            </IconButton>
        </Tooltip>
    </Box>
  )
};

export default ProveedoresActions;