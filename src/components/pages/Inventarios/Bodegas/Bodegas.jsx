import React, { useState, useEffect } from 'react';
import DataGridB from './DataGridB';
import { getBodegas } from '../../../actions/getUsers';
import ModalRegistroB from './ModalRegistroB';
import DetalleBodegas from './DetalleBodegas';
import DataUbicaciones from './DataUbicaciones';


export const Bodegas = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModalRegistroB, setOpenModalRegistroB] = useState(false);
  const [selectedBodega, setSelectedBodega] = useState(null);
  const [openDetalleBodega, setOpenDetalleBodega] = useState(false);
  const [openUbicaciones, setOpenUbicaciones] = useState(false);
  const [ubicacionesData, setUbicacionesData] = useState([]);


  const url = 'http://localhost:3304/inventario/bodegas';

  const fetchData = async () => {
    setLoading(true);
    const result = await getBodegas(url);
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
        <h2 id='titulo'>Bodegas</h2>
        <div className='cuerpo'>
          <input id='buscador' placeholder='Buscar Bodega' /><br />
          <button id='button-add-usuario' onClick={() => setOpenModalRegistroB(true)}>Agregar Bodega</button>
        </div>
      </div>
      <DataGridB
        data={data}
        setData={setData}
        fetchData={fetchData}
        selectedBodega={selectedBodega}
        setSelectedBodega={setSelectedBodega}
        setOpenDetalleBodega={setOpenDetalleBodega}
        openDetalleBodega={openDetalleBodega}
        setOpenUbicaciones={setOpenUbicaciones}
      />
      <ModalRegistroB
        openModalRegistroB={openModalRegistroB}
        setOpenModalRegistroB={setOpenModalRegistroB}
        data={data}
        fetchData={fetchData}
      />
      <DetalleBodegas
        openDetalleBodega={openDetalleBodega}
        setOpenDetalleBodega={setOpenDetalleBodega}
        selectedBodega={selectedBodega}
        setSelectedBodega={setSelectedBodega}
        data={data}
        fetchData={fetchData}
      />
      <DataUbicaciones 
      openUbicaciones={openUbicaciones}
      setOpenUbicaciones={setOpenUbicaciones}
      selectedBodega={selectedBodega}
      setSelectedBodega={setSelectedBodega}
      data={ubicacionesData}
      />
    </div>
  );
};

export default Bodegas;
