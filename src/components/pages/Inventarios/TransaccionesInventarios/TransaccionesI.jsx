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