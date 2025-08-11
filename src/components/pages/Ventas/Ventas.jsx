import React, { useState } from 'react'
import DataGridV from './DataGridV';
import { useEffect } from 'react';
import { getVentas } from '../../actions/getUsers';
import Encabezado from './Encabezado';
import apiUrl from '../../../config';


export const Ventas = () => {
  const [data, setData] = useState([]);
  const [ setLoading] = useState(true);
  const [setError] = useState(null);

  const url = `${apiUrl}/ventas`;

  const fetchData = async () => {
    setLoading(true);
    const result = await getVentas(url);
    setData(result.data);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Encabezado />
      <DataGridV
        data={data}
        setData={setData}
      >
      </DataGridV>


    </div>
  )

}

export default Ventas;