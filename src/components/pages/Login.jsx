import React from 'react'

export const Login = () => {
    return (
        <div>
            <div className='layout'>
                <header className='header'>
                    <h1>Iniciar Sesión</h1>
                </header>
                <section className='container'>
                    <input className='inputU' placeholder='Nombre de usuario'/><br></br>
                    <input className='inputC' placeholder='Contraseña'/><br></br>
                    <button className='buttonR'>Registrarse</button>
                    <button className='buttonI'>Ingresar</button>
                </section>
                <div className='restoreP'>
                    <h3>¿Olvidaste tu contraseña?</h3>
                </div>
            </div>
        </div>
    )
}