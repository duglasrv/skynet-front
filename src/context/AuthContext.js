// Ruta: /src/context/AuthContext.js

// --- Dependencias de React y Next.js ---
// `createContext`: Crea un objeto Context. Los componentes pueden suscribirse a este contexto para leer el valor actual.
// `useState`: Hook para añadir estado a los componentes funcionales.
// `useContext`: Hook para leer y suscribirse al valor de un contexto.
// `useEffect`: Hook para ejecutar "efectos secundarios" (como peticiones a una API o suscripciones) en componentes funcionales.
import { createContext, useState, useContext, useEffect } from 'react';
// Importa la librería `js-cookie` para manejar las cookies del navegador de una manera sencilla y limpia.
import Cookies from 'js-cookie';
// Importa la instancia de Axios preconfigurada para hacer llamadas a nuestra API backend.
import api from '@/services/api';
// Importa el hook `useRouter` de Next.js para poder redirigir al usuario entre páginas.
import { useRouter } from 'next/router';

// Crea el Contexto de Autenticación. `null` es el valor por defecto que recibiría un componente
// si intentara usar este contexto sin estar envuelto en un `AuthProvider`.
const AuthContext = createContext(null);

/**
 * Componente AuthProvider
 * 
 * Este componente es un "proveedor" de contexto. Su trabajo es envolver a toda la aplicación
 * (o a las partes que necesiten autenticación) y proveerles el estado de autenticación
 * (quién es el usuario, si está logueado) y las funciones para manejarlo (login, logout).
 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Los componentes hijos que serán envueltos por este proveedor.
 */
export const AuthProvider = ({ children }) => {
    // Estado para almacenar el objeto del usuario cuando está logueado. `null` si no hay sesión.
    const [user, setUser] = useState(null);
    // Estado para manejar el estado de carga inicial. Inicia en `true` porque al cargar la app,
    // necesitamos un momento para verificar si ya existe una sesión en las cookies.
    const [loading, setLoading] = useState(true);
    // Obtiene la instancia del router para poder redirigir al usuario.
    const router = useRouter();

    // Este `useEffect` se ejecuta solo una vez cuando la aplicación se carga por primera vez (el array de dependencias `[]` está vacío).
    // Su propósito es verificar si ya existen cookies de una sesión anterior para mantener al usuario logueado.
    useEffect(() => {
        const loadUserFromCookies = () => {
            // Intenta leer el token y los datos del usuario de las cookies.
            const token = Cookies.get('token');
            const storedUser = Cookies.get('user');

            // Si ambas cookies existen, significa que hay una sesión activa.
            if (token && storedUser) {
                try {
                    // La cookie del usuario se guarda como un string JSON, así que la parseamos para convertirla en un objeto.
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Error al leer la cookie del usuario:", e);
                    // Si la cookie está corrupta o no es un JSON válido, la limpiamos para evitar errores.
                    Cookies.remove('token');
                    Cookies.remove('user');
                }
            }
            // Independientemente de si se encontró un usuario o no, el proceso de verificación inicial ha terminado.
            // Ponemos `loading` en `false`.
            setLoading(false);
        };
        
        loadUserFromCookies();
    }, []);

    /**
     * Función para iniciar sesión.
     * @param {string} email - El email del usuario.
     * @param {string} password - La contraseña del usuario.
     */
    const login = async (email, password) => {
        try {
            // Realiza la petición POST al endpoint de login del backend.
            const { data } = await api.post('/auth/login', { email, password });

            // Si la respuesta del backend es exitosa y contiene el token y los datos del usuario...
            if (data.token && data.user) {
                // ...actualizamos el estado de la aplicación con los datos del usuario.
                setUser(data.user);
                
                // Guardamos el token y los datos del usuario en cookies para persistir la sesión.
                // El token es la "llave" para futuras peticiones a la API.
                // Los datos del usuario se guardan para no tener que pedirlos de nuevo y poder mostrar su nombre, rol, etc.
                // `expires: 1/3` establece la expiración de la cookie a 8 horas (1/3 de un día).
                Cookies.set('token', data.token, { expires: 1/3 });
                Cookies.set('user', JSON.stringify(data.user), { expires: 1/3 });

                // Redirigimos al usuario al dashboard principal.
                router.push('/');
            }
        } catch (error) {
            // Si el login falla (ej: contraseña incorrecta), el backend devolverá un error.
            // Capturamos ese error y lanzamos uno nuevo con un mensaje claro.
            // Esto permite que el componente del formulario de login pueda capturarlo y mostrar el error al usuario.
            throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
        }
    };

    /**
     * Función para cerrar sesión.
     */
    const logout = () => {
        // Limpia el estado del usuario en la aplicación, estableciéndolo a `null`.
        setUser(null);
        // Elimina las cookies de autenticación del navegador.
        Cookies.remove('token');
        Cookies.remove('user');
        // Redirige al usuario a la página de login.
        router.push('/login');
    };

    // El componente Provider devuelve el Contexto con un objeto `value`.
    // Todos los componentes hijos envueltos por `AuthProvider` tendrán acceso a este objeto.
    return (
        <AuthContext.Provider value={{
            user,           // El objeto del usuario o null.
            login,          // La función para iniciar sesión.
            logout,         // La función para cerrar sesión.
            isAuthenticated: !!user, // Un booleano conveniente para verificar si el usuario está logueado (!!convierte un objeto o null a true/false).
            loading         // El booleano que indica si se está verificando la sesión inicial.
        }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook personalizado `useAuth`.
 * 
 * Este es un atajo conveniente. En lugar de que cada componente tenga que importar `useContext` y `AuthContext`
 * por separado, simplemente pueden importar y llamar a `useAuth()` para acceder a todo el contexto.
 * @returns {object} El valor del AuthContext (user, login, logout, etc.).
 */
export const useAuth = () => {
    return useContext(AuthContext);
};