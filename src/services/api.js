// Ruta: /src/services/api.js

import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    // ¡IMPORTANTE! Esta es la URL de tu backend.
    // Asegúrate de que coincida con el puerto donde lo estás corriendo.
    baseURL: 'http://localhost:4000/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Este es un "interceptor". Es una función mágica que se ejecuta ANTES de cada
// petición que hagamos. Su trabajo es tomar el token guardado en las cookies y
// añadirlo al header 'Authorization' para que el backend sepa quiénes somos.
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, 
    (error) => {
        return Promise.reject(error);
    }
);

export default api;