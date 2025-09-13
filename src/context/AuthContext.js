// Ruta: /src/context/AuthContext.js

import { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/services/api';
import { useRouter } from 'next/router';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Para saber si estamos verificando la sesión
    const router = useRouter();

    // Este useEffect se ejecuta solo una vez cuando la app carga.
    // Su trabajo es ver si ya existen cookies de una sesión anterior.
    useEffect(() => {
        const loadUserFromCookies = () => {
            const token = Cookies.get('token');
            const storedUser = Cookies.get('user');
            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Error al leer la cookie del usuario:", e);
                    // Limpiamos si la cookie está corrupta
                    Cookies.remove('token');
                    Cookies.remove('user');
                }
            }
            setLoading(false);
        };
        loadUserFromCookies();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            if (data.token && data.user) {
                setUser(data.user);
                // Guardamos el token y los datos del usuario en cookies.
                // El token es la "llave", los datos del usuario son para mostrar su nombre, rol, etc.
                Cookies.set('token', data.token, { expires: 1/3 }); // 1/3 de un día = 8 horas
                Cookies.set('user', JSON.stringify(data.user), { expires: 1/3 });
                router.push('/'); // Redirigimos al dashboard principal
            }
        } catch (error) {
            // Si el login falla, lanzamos un error para que el formulario lo muestre.
            throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
        }
    };

    const logout = () => {
        setUser(null);
        Cookies.remove('token');
        Cookies.remove('user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Este es un "hook" personalizado. Nos permite llamar a useAuth() en cualquier
// componente para acceder fácilmente a `user`, `login`, `logout`, etc.
export const useAuth = () => {
    return useContext(AuthContext);
};