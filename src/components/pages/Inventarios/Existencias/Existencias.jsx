import React, { useEffect, useState } from "react";
import { getExistencias } from "../../../actions/getUsers";
import DataGridE from "./DataGridE";
import ModalRegistroE from "./ModalRegistroE";

const Existencias = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_API_URL_LOCAL;

  const url = `${apiUrl}/inventario/existencias`;

  const [openModalRegistroE, setOpenModalRegistroE] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    try {
      const result = await getExistencias(url);

      if (result.error) {
        setData([]);
        setError(result.error);
        return;
      }

      setData(Array.isArray(result.data) ? result.data : []);
      setError(null);
    } catch (error) {
      setData([]);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <DataGridE
        data={data}
        setData={setData}
        fetchData={fetchData}
        filter={filter}
        loading={loading}
      ></DataGridE>
      <ModalRegistroE
        openModalRegistroE={openModalRegistroE}
        setOpenModalRegistroE={setOpenModalRegistroE}
      ></ModalRegistroE>
    </div>
  );
};

export default Existencias;
