import React, { useState} from 'react'
import { UsuariosTable } from './UsuariosTable'
import ModalRegistroU from './ModalRegistroU';

export const Usuarios = () => {

  const [openModalRegistroU, setOpenModalRegistroU] = useState(false);

  return (
    <div>
      <div className='encabezado'>
        <h2 id='titulo'>Usuarios</h2>
        <div className='cuerpo'>
          <input id='buscador' placeholder='Buscar usuario' /><br />
          <button id='button-add-usuario' onClick={() => setOpenModalRegistroU(true)} >Agregar usuario</button><p />
        </div>
      </div>
      <UsuariosTable />
      <ModalRegistroU
        openModalRegistroU={openModalRegistroU}
        setOpenModalRegistroU={setOpenModalRegistroU}
      >
      </ModalRegistroU> 
    </div>
  )

}