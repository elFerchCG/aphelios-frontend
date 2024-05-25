import React from 'react';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Styles from '@mui/material/GlobalStyles';
import { useState } from 'react';

const useStyles = Styles((theme) => ({
    modal: {
        position: 'absolute',
        width: 400,
        backgroundColor: 'white',
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: "16px 32px 24px",
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',

    }

}))


export const RegistroProveedor = () => {

    const useStyles = Styles((theme) => ({
        modal: {
            position: 'absolute',
            width: 400,
            backgroundColor: 'white',
            border: '2px solid #000',
            boxShadow: theme.shadows[5],
            padding: "16px 32px 24px",
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
    
        }
    
    }))
    

    const estilos= useStyles();

    const [modal, setModal]=useState(false);

    const abriCerrarModal =()=>{
        setModal(!modal);
    }

    const body=(
        <div className={estilos.modal}>
            <div align="center">
                <h2>Registro Proveedor</h2>
            </div>
            <TextField label="Mes" className={estilos.textField}/>
            <br />
            <TextField label="Año" className={estilos.textField}/>
            <br />
            <TextField label="Dia" className={estilos.textField}/>
            <br />
            <TextField label="Nombre" className={estilos.textField}/>
            <br />
            <TextField label="Pedido" className={estilos.textField}/>
            <br />
            <TextField label="Cantidad" className={estilos.textField}/>
            <br />
            <TextField label="Encargado" className={estilos.textField}/>
            <br />
            <TextField label="Proveedor" className={estilos.textField}/>
            <br /> <br />
            <div align="right">
            <Button color="primary">Enviar</Button>
            <Button>Cancelar</Button>
            </div>
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
