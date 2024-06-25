import React from 'react'

const Encabezado = () => {
    return (
        <div>
            <div className='encabezado'>
                <h2 id='titulo'>Localidades</h2>
                <div className='cuerpo'>
                    <input id='buscador' placeholder='Buscar localidades' /><br />
                   {/*} <button id='button-add-usuario' >Agregar usuario</button><p /> */}
                </div>
            </div>
        </div>
    )
}

export default Encabezado
