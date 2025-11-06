// Ruta: /src/services/api.js

// --- Dependencias ---
// Importa la librería Axios, que es un cliente HTTP basado en promesas.
// Facilita enormemente la realización de peticiones (GET, POST, PUT, DELETE) a un backend.
import axios from 'axios';
// Importa la librería js-cookie, una utilidad simple para leer y escribir cookies en el navegador.
import Cookies from 'js-cookie';

// --- Creación de la Instancia de Axios ---
// Se crea una instancia personalizada de Axios. En lugar de usar `axios.get()`, `axios.post()`, etc.,
// usaremos `api.get()`, `api.post()`. La ventaja es que podemos preconfigurar esta instancia
// con valores por defecto que se aplicarán a TODAS las peticiones que se hagan con ella.
const api = axios.create({
    // ¡CAMBIO CLAVE!
    // Lee la URL de la API desde una variable de entorno.
    // El prefijo NEXT_PUBLIC_ es OBLIGATORIO en Next.js para que la variable
    // esté disponible en el navegador.
    baseURL: process.env.NEXT_PUBLIC_API_URL, 
    
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Configuración del Interceptor de Peticiones (Request Interceptor) ---

// Este es un "interceptor". Es una función que Axios ejecutará ANTES de que cada
// petición sea enviada al servidor. Es extremadamente útil para modificar la configuración
// de la petición de forma dinámica.
// Su trabajo aquí es tomar el token de autenticación guardado en las cookies y
// añadirlo a la cabecera 'Authorization' para que el backend sepa quiénes somos.
api.interceptors.request.use(
    // La primera función se ejecuta si la configuración de la petición es exitosa.
    (config) => {
        // `config` es un objeto que contiene toda la información de la petición que está a punto de salir
        // (URL, método, cabeceras, etc.).

        // Intentamos obtener el token que guardamos en las cookies durante el login.
        const token = Cookies.get('token');
        
        // Si se encuentra un token...
        if (token) {
            // ...modificamos el objeto `config` para añadir una nueva cabecera de `Authorization`.
            // El formato `Bearer ${token}` es el estándar para enviar JSON Web Tokens (JWT).
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Es OBLIGATORIO devolver el objeto `config` (modificado o no) para que Axios pueda
        // continuar y enviar la petición al servidor.
        return config;
    }, 
    // La segunda función se ejecuta si hay un error al preparar la petición (esto es poco común).
    (error) => {
        // Simplemente rechazamos la promesa con el error para que pueda ser capturado
        // por un bloque `.catch()` donde se hizo la llamada a la API.
        return Promise.reject(error);
    }
);

// Exporta la instancia de Axios configurada (`api`) como el valor por defecto de este módulo.
// Ahora, otros archivos (como tus páginas y componentes) pueden importarla y usarla para
// hacer llamadas a la API que automáticamente incluirán la baseURL y el token de autorización.
export default api;