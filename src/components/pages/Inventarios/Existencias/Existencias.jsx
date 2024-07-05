import React, { useEffect, useState } from 'react'
import { getExistencias } from '../../../actions/getUsers';
import DataGridE from './DataGridE';
import ModalRegistroE from './ModalRegistroE';


const Existencias = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const url = 'http://localhost:3304/inventario/existencias';

  const [openModalRegistroE, setOpenModalRegistroE] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await getExistencias(url);
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
        <h2 id='titulo'>Existencias</h2>
        <div className='cuerpo'>
          <input id='buscador' placeholder='Buscar existencias' /><br />
          <button id='button-add-usuario' onClick={() => setOpenModalRegistroE(true)}>Agregar existencias</button><p />
        </div>
      </div>
      <DataGridE
      data={data}
      setData={setData}
      fetchData={fetchData}
      ></DataGridE>
      <ModalRegistroE
      openModalRegistroE={openModalRegistroE}
      setOpenModalRegistroE={setOpenModalRegistroE}
      ></ModalRegistroE>
    </div>
  )
}

export default Existencias;