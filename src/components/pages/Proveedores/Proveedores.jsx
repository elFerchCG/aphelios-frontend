import React, { useState } from 'react'
import { ProveedoresTable } from './ProveedoresTable'
import ModalRegistroP from './ModalRegistroP';

export const Proveedores = () => {

  const [openModalRegistroP, setOpenModalRegistroP] = useState(false);

  return (
    <div>
      <div className='encabezado'>
        <h2 id='titulo'>Proveedores</h2>
        <div className='cuerpo'>
          <input id='buscador' placeholder='Buscar proveedor' /><br />
          <button id='button-add-usuario' onClick={() => setOpenModalRegistroP(true)} >Agregar proveedor</button><p />
        </div>
      </div>
      <ProveedoresTable />
      <ModalRegistroP
          openModalRegistroP={openModalRegistroP}
          setOpenModalRegistroP={setOpenModalRegistroP}
      >    
      </ModalRegistroP>
    </div>

  )
}
