const apiUrl =
    process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_API_URL
        : process.env.REACT_APP_API_URL_LOCAL;

// console.log(process.env.NODE_ENV); 
// console.log(apiUrl); 

export default apiUrl;