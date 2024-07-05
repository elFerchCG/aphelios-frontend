import React, { useState } from 'react'
import DataGridO from './DataGridO';
import { getOrdenB } from '../../../actions/getUsers';
import { useEffect } from 'react';
import ModalRegistroO from './ModalRegistroO';


export const OrdenB = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const url = 'http://localhost:3304/inventario/ordenBodegas';

  const [openModalRegistroO, setOpenModalRegistroO] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await getOrdenB(url);
    console.log(result);
    setData(result.data);
    setError(result.error);
    setLoading(false);
  };
 
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className='encabezado'>
        <h2 id='titulo'>Ordenes de Bodegas</h2>
        <div className='cuerpo'>
          <input id='buscador' placeholder='Buscar orden' /><br />
          <button id='button-add-usuario' onClick={() => setOpenModalRegistroO(true)} >Agregar orden</button><p />
        </div>
      </div>
      <DataGridO
      data={data}
      setData={setData}
      fetchData={fetchData}
      ></DataGridO>
      <ModalRegistroO
      openModalRegistroO={openModalRegistroO}
      setOpenModalRegistroO={setOpenModalRegistroO}
      ></ModalRegistroO>
    </div>
  )
}

export default OrdenB;