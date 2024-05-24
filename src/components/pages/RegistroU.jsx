import React from 'react'

export const RegistroU = () => {
  return (
    <body>
        <section className='registros'>
            <h1 className='r'>Registro</h1>
            <h5 className='n'>Nombre</h5>
            <input className='in' placeholder='Introduce el nombre' />
            <h5 className='pa'>Contraseña</h5>
            <input className='ipa' placeholder='Introduce la contraseña' />
            <h5 className='sa'>Rol</h5>
            <input className='isa' placeholder='Introduce el rol' />
            <h5 className='tel'>Telefono</h5>
            <input className='itel' placeholder='Introduce un numero telefonico' />
            <button className='bR'>Registrar</button>
        </section>
    </body>
  )
}
