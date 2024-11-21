import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";

const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [refresh, setRefresh] = useState(false);

const apiUrl =
process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL
  : process.env.REACT_APP_API_URL_LOCAL;

const url = `${apiUrl}/usuarios`;

const fetchData = async () => {
    setLoading(true);
    const result = await getUsers(url);
    setData(result.data);
    setError(result.error);
    setLoading(false);
};

useEffect(() => {
    fetchData();
}, [refresh]);

export const deleteUser = (id_usuario, e) => {
    e.preventDefault();

    Swal.fire({
        title: '¿Estás seguro?',
        text: '¡No podrás revertir esto!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminarlo'
    }).then((result) => {
        if (result.isConfirmed) {
            axios.delete(`${apiUrl}/usuarios/${id_usuario}`)
                .then(response => {     
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Tu usuario ha sido eliminado.',
                        icon: 'success'
                    });
                    setRefresh(!refresh);
                })
                .catch(error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Hubo un error al eliminar el usuario.'
                    });
                    console.error('Error al eliminar usuario:', error);
                });
        }
    });
   
};

export { deleteUser };