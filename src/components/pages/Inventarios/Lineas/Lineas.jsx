import React, { useEffect, useState } from 'react'
import { getLineas } from '../../../actions/getUsers';
import DataGridL from './DataGridL';
import ModalRegistroL from './ModalRegistroL';


const Lineas = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const url = 'http://localhost:3304/inventario/lineasOrden';

  const [openModalRegistroL, setOpenModalRegistroL] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await getLineas(url);
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
        <h2 id='titulo'>Traspasos</h2>
        <div className='cuerpo'>
          <input 
          id='buscador' 
          type='text'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder='Buscar traspasos' /><br />
          <button id='button-add-usuario' onClick={() => setOpenModalRegistroL(true)}>Agregar traspaso</button><p />
        </div>
      </div>
      <DataGridL
      data={data}
      setData={setData}
      fetchData={fetchData}
      filter={filter}
      ></DataGridL>
      <ModalRegistroL
      openModalRegistroL={openModalRegistroL}
      setOpenModalRegistroL={setOpenModalRegistroL}
      ></ModalRegistroL>
    </div>
  )
}

export default Lineas;