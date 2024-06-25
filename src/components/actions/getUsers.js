import axios from "axios";


const getUsers = async (url) => {
    try {
        const response = await axios.get(url);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }
};

const getVentas = async (url) => {
    try {
        const response = await axios.get(url);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }        
};

export { getUsers, getVentas };