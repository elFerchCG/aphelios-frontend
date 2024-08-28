import React, { useEffect, useState } from 'react'
import { getTransacciones } from '../../../actions/getUsers';
import DataGridT from './DataGridT';
import ModalRegistroT from './ModalRegistroT';
import DetalleTransacciones from './DetalleTransacciones';


const Transacciones = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModalRegistroT, setOpenModalRegistroT] = useState(false);
  const [openDetalleTransaccion, setOpenDetalleTransaccion] = useState(false);
  const [selectedTransaccion, setSelectedTransaccion] = useState(null);
  const [filter, setFilter] = useState('');

  const url = 'http://localhost:3304/inventario/tipoTransaccion';


  const fetchData = async () => {
    setLoading(true);
    const result = await getTransacciones(url);
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
        <h2 id='titulo'>Tipos de Transacciones</h2>
        <div className='cuerpo'>
          <input 
          id='buscador'
          type='text'
          value={filter}
          onChange={(e) => setFilter(e.target.value)} 
          placeholder='Buscar transacciones' /><br />
          <button id='button-add-usuario' onClick={() => setOpenModalRegistroT(true)}>Agregar transaccion</button><p />
        </div>
      </div>
      <DataGridT
      data={data}
      fetchData={fetchData}
      setSelectedTransaccion={setSelectedTransaccion}
      setOpenDetalleTransaccion={setOpenDetalleTransaccion}
      openDetalleTransaccion={openDetalleTransaccion}
      filter={filter}
      />
      <ModalRegistroT
      openModalRegistroT={openModalRegistroT}
      setOpenModalRegistroT={setOpenModalRegistroT}
      data={data}
      fetchData={fetchData}
      />
      <DetalleTransacciones 
      openDetalleTransaccion={openDetalleTransaccion}
      setOpenDetalleTransaccion={setOpenDetalleTransaccion}
      selectedTransaccion={selectedTransaccion}
      setSelectedTransaccion={setSelectedTransaccion}
      data={data}
      fetchData={fetchData}
      />
    </div>
  )
}

export default Transacciones