import React, { useState } from 'react'
import DataGridV from './DataGridV';
import { useEffect } from 'react';
import { getVentas } from '../../actions/getUsers';
import Encabezado from './Encabezado';


export const Ventas = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const url = 'http://localhost:3304/ventas';

  const fetchData = async () => {
    setLoading(true);
    const result = await getVentas(url);
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