import React, { useState, useEffect } from 'react'
import { ProveedoresTable } from './ProveedoresTable'
import ModalRegistroP from './ModalRegistroP';
import axios from 'axios';


export const Proveedores = () => {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openModalRegistroP, setOpenModalRegistroP] = useState(false);


    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3304/proveedores');
        setData(response.data);
        console.log(response.data);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    }

    useEffect(() => {
      fetchData();
    }, []);


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
          fetchData={fetchData}
        >
        </ModalRegistroP>
      </div>

    )
  }
