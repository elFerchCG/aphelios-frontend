import * as React from 'react';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { Box } from '@mui/material';

export const RegistroProveedor = () => {

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      };    

    const [modal, setModal]=useState(true);

    const abriCerrarModal =()=>{
        setModal(!modal);
    }

    const body=(
        
        <div className="modal">
            <Box sx={style}>
            <div align="center">
                <h2>Registro Proveedor</h2>
            </div>
            <TextField label="ID"/>
            <br />
            <TextField label="Razón social"/>
            <br />
            <TextField label="Telefono"/>
            <br />
            <TextField label="Domicilio"/>
            <br/><br/>
            <div align="right">
            <Button color="primary">Enviar</Button>
            <Button onClick={abriCerrarModal}>Cancelar</Button>
            </div>
            </Box>
        </div>

    )

    return (
        <div>
            <Modal
                open={modal}
                onClose={abriCerrarModal}>
                {body}
            </Modal>
        </div>
    )
}
