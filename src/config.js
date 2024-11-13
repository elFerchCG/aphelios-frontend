const apiUrl =
    process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_API_URL
        : process.env.REACT_APP_API_URL_LOCAL;

console.log(process.env.NODE_ENV); // Esto debe imprimir "production" en Netlify
console.log(apiUrl); // Esto imprimirá la URL correcta según el entorno

export default apiUrl;