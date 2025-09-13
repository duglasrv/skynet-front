// Ruta: /src/components/ProtectedRoute.js

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Spinner } from 'react-bootstrap';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Solo ejecutamos la lógica una vez que el estado de carga ha terminado.
        if (!loading) {
            // Si no está autenticado, lo enviamos a la página de login.
            if (!isAuthenticated) {
                router.push('/login');
            } 
            // Si está autenticado, pero su rol no está en la lista de roles permitidos...
            else if (allowedRoles && !allowedRoles.includes(user.role)) {
                // ...lo enviamos a la página principal (dashboard).
                router.push('/');
            }
        }
    }, [loading, isAuthenticated, user, router, allowedRoles]);

    // Mientras carga, o si el usuario no tiene los permisos, mostramos un spinner.
    // Esto previene que se muestre contenido protegido por un instante antes de la redirección.
    if (loading || !isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role))) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    // Si todas las verificaciones pasan, mostramos el contenido de la página.
    return <>{children}</>;
};

export default ProtectedRoute;