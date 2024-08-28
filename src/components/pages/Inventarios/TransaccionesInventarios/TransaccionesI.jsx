import React, { useState } from 'react'
import DataGridTInventario from './DataGridTInventario';
import { getTransaccionesI } from '../../../actions/getUsers';
import { useEffect } from 'react';
import ModalRegistroTI from './ModalRegistroTI';


export const OrdenB = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const url = 'http://localhost:3304/inventario/transacciones';

  const [openModalRegistroT, setOpenModalRegistroT] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await getTransaccionesI(url);
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
        <h2 id='titulo'>Transacciones de inventarios</h2>
        <div className='cuerpo'>
          <input id='buscador'
          type='text'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder='Buscar transacción' /><br />
          <button id='button-add-usuario' onClick={() => setOpenModalRegistroT(true)} >Agregar orden</button><p />
        </div>
      </div>
      <DataGridTInventario
      data={data}
      setData={setData}
      fetchData={fetchData}
      filter={filter}
      ></DataGridTInventario>
      <ModalRegistroTI
      openModalRegistroT={openModalRegistroT}
      setOpenModalRegistroT={setOpenModalRegistroT}
      ></ModalRegistroTI>
    </div>
  )
}

export default OrdenB;