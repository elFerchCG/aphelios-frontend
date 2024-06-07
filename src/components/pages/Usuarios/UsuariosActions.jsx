import { Box, IconButton, Tooltip, TextField} from '@mui/material'
import React, { useState } from 'react'
import { Preview, Delete } from '@mui/icons-material'
import Modal from '@mui/material/Modal';


const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 800,
    height: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};


const UsuariosActions = () => {
    const [open, setOpen] = useState(false);
    const handleOpen = () => {
      setOpen(true);
    };
    const handleClose = () => {
      setOpen(false);
    };

    return (
        <Box>
            <Tooltip title='Ver detalles'>
                <IconButton onClick={handleOpen}>
                    <Preview />
                    <Modal
                        open={open}
                        onClose={handleClose}
                        aria-labelledby="Detalles usuario"  
                    >
                        <Box 
                            sx={{
                                ...style
                            }}
                          >
                            <TextField id="outlined-basic" label="Outlined" variant="outlined" sx={{width: 600}} /><br/>
                            <TextField id="filled-basic" label="Filled" variant="filled" sx={{width: 600}} /><br/>
                            <TextField id="standard-basic" label="Standard" variant="standard" sx={{width: 600}} /><br/>
                        </Box>
                    </Modal>
                </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar usuario'>
                <IconButton onClick={() => { }}>
                    <Delete />
                </IconButton>
            </Tooltip>
        </Box>
    )
};

export default UsuariosActions