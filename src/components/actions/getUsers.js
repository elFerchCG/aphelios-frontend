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

const getBodegas = async (url) => {
    try {
        const response = await axios.get(url);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }        
};

const getTransacciones = async (url) => {
    try {
        const response = await axios.get(url);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }        
};

const getLocalidades = async (url) => {
    try {
        const response = await axios.get(url);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }        
};

const getExistencias = async (url) => {
    try {
        const response = await axios.get(url);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }        
};

const getLineas = async (url) => {
    try {
        const response = await axios.get(url);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }        
};

const getOrdenB = async (url) => {
    try {
        const response = await axios.get(url);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }        
};

const getTransaccionesI = async (url) => {
    try {
        const response = await axios.get(url);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }        
};

const getUbicacionesBodega = async (url2) => {
    try {
        const response = await axios.get(url2);
        return { data: response.data, error: null };
    } catch (error) {
        return { data: null, error};
    }        
};

export { getUsers, getVentas, getBodegas, getTransacciones, 
    getLocalidades, getExistencias, getLineas, getOrdenB, getTransaccionesI, getUbicacionesBodega };