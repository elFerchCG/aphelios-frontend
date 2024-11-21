import React, { useEffect, useState } from 'react'
import { getLocalidades } from '../../../actions/getUsers';
import DataGridL from './DataGridL';
import ModalRegistroL from './ModalRegistroL';
import DetalleLocalidades from './DetalleLocalidades';
import apiUrl from '../../../../config';


const Localidades = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModalRegistroL, setOpenModalRegistroL] = useState(false);
  const [selectedLocalidad, setSelectedLocalidad] = useState(null);
  const [openDetalleLocalidad, setOpenDetalleLocalidad] = useState(false);
  const [filter, setFilter] = useState('');

  const url = `${apiUrl}/inventario/localidades`;

  const fetchData = async () => {
    setLoading(true);
    const result = await getLocalidades(url);
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
        <h2 id='titulo'>Ubicaciones</h2>
        <div className='cuerpo'>
          <input 
          type='text' 
          id='buscador'
          placeholder='Buscar ubicaciones'
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}/><br />
          <button id='button-add-usuario' onClick={() => setOpenModalRegistroL(true)}>Agregar ubicaciones</button><p />
        </div>
      </div>
      <DataGridL
      data={data}
      fetchData={fetchData}
      setSelectedLocalidad={setSelectedLocalidad}
      setOpenDetalleLocalidad={setOpenDetalleLocalidad}
      openDetalleLocalidad={openDetalleLocalidad}
      filter={filter}
      />
      <ModalRegistroL
      openModalRegistroL={openModalRegistroL}
      setOpenModalRegistroL={setOpenModalRegistroL}
      data={data}
      fetchData={fetchData}
      />
      <DetalleLocalidades
      openDetalleLocalidad={openDetalleLocalidad}
      setOpenDetalleLocalidad={setOpenDetalleLocalidad}
      selectedLocalidad={selectedLocalidad}
      setSelectedLocalidad={setSelectedLocalidad}
      data={data}
      fetchData={fetchData}
      />
    </div>
  )
}

export default Localidades;