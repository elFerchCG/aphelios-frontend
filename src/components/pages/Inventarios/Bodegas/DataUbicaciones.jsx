import React, { useState, useEffect } from 'react';


const DataUbicaciones = () => {

    const [bodegas, setBodegas] = useState([]);
    const [selectedBodega, setSelectedBodega] = useState('');
    const [resultados, setResultados] = useState([]);

    // Función para obtener la lista de bodegas
    const fetchBodegas = async () => {
        try {
            const response = await fetch('http://localhost:3304/inventario/bodegas_y_localidades/nombres/bodegas', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setBodegas(data);
            } else {
                console.error('Error al obtener las bodegas:', response.statusText);
            }
        } catch (error) {
            console.error('Error al realizar la solicitud:', error);
        }
    };

    useEffect(() => {
        fetchBodegas();
    }, []);

    // Función para manejar el cambio de selección
    const handleSelectChange = (e) => {
        setSelectedBodega(e.target.value);
    };


    // Función para manejar la búsqueda de localidades por bodega
    const handleSearch = async () => {
        try {
            const response = await fetch(`http://localhost:3304/inventario/bodegas_y_localidades/${selectedBodega}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setResultados(data);
            } else {
                console.error('Error al obtener los datos:', response.statusText);
            }
        } catch (error) {
            console.error('Error al realizar la solicitud:', error);
        }
    };


    return (
        <div className='contenido'>
            <div id='contenidoUsuarios'>
            <label>
                Selecciona una Bodega:
                <select value={selectedBodega} onChange={handleSelectChange}>
                    <option value="">Seleccione una bodega</option>
                    {bodegas.map((bodega) => (
                        <option key={bodega.Nombre} value={bodega.Nombre}>
                            {bodega.Nombre}
                        </option>
                    ))}
                </select>
            </label>
            <button onClick={handleSearch}>Buscar</button>

            <div>
                <h2>Resultados</h2>
                {resultados.length > 0 ? (
                    <ul>
                        {resultados.map((bodega) => (
                            <li key={bodega.localidad_id}>
                                {bodega.bodega_nombre} - {bodega.localidad_descripcion}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No se encontraron resultados.</p>
                )}
            </div>
            </div>
        </div>

    )
}

export default DataUbicaciones