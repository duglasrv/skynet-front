// Ruta: /src/components/ProtectedRoute.js

// --- Dependencias ---
// Importa el hook `useAuth` desde el contexto de autenticación para acceder al estado del usuario.
import { useAuth } from '@/context/AuthContext';
// Importa el hook `useRouter` de Next.js para poder realizar redirecciones de página.
import { useRouter } from 'next/router';
// Importa el hook `useEffect` de React para ejecutar lógica de efectos secundarios (como la redirección) después del renderizado.
import { useEffect } from 'react';
// Importa el componente `Spinner` de react-bootstrap para mostrar una animación de carga.
import { Spinner } from 'react-bootstrap';

/**
 * Componente ProtectedRoute (Ruta Protegida)
 * 
 * Este componente actúa como un guardián o "wrapper" para otras páginas o componentes.
 * Su función es verificar si el usuario actual cumple con los requisitos de autenticación y autorización
 * (roles permitidos) antes de mostrar el contenido protegido. Si no los cumple, redirige al usuario.
 * 
 * @param {object} props - Las propiedades del componente.
 * @param {React.ReactNode} props.children - El contenido o componente hijo que se está protegiendo.
 * @param {string[]} [props.allowedRoles] - Un array opcional de strings que representa los roles que tienen permiso para acceder a esta ruta.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    // Obtiene el estado de autenticación desde el AuthContext.
    // - isAuthenticated: Un booleano que es `true` si el usuario está logueado.
    // - user: Un objeto con la información del usuario logueado (incluido su rol).
    // - loading: Un booleano que es `true` mientras el contexto verifica el estado de autenticación (ej. al recargar la página).
    const { isAuthenticated, user, loading } = useAuth();
    // Obtiene la instancia del router de Next.js para poder navegar a otras páginas.
    const router = useRouter();

    // `useEffect` se usa para manejar la lógica de redirección, que es un "efecto secundario" de los cambios de estado.
    useEffect(() => {
        // La lógica de redirección solo se ejecuta cuando el estado de carga ha finalizado (`!loading`).
        // Esto es CRUCIAL para evitar redirigir al usuario a la página de login antes de que se haya verificado si ya tiene una sesión activa.
        if (!loading) {
            // Caso 1: Usuario NO autenticado.
            // Si el usuario no está logueado, se le redirige inmediatamente a la página de login.
            if (!isAuthenticated) {
                router.push('/login');
            } 
            // Caso 2: Usuario autenticado PERO SIN los permisos necesarios.
            // Si se ha proporcionado una lista de `allowedRoles` y el rol del usuario actual (`user.role`) NO está en esa lista...
            else if (allowedRoles && !allowedRoles.includes(user.role)) {
                // ...se le redirige a la página principal (dashboard), ya que no tiene autorización para ver esta página.
                router.push('/');
            }
        }
    // Este array de dependencias asegura que el efecto se vuelva a ejecutar si cambia el estado de carga,
    // el estado de autenticación, el objeto de usuario, el router o la lista de roles permitidos.
    }, [loading, isAuthenticated, user, router, allowedRoles]);

    // --- Pantalla de Carga / Estado Intermedio ---
    // Este `if` es clave para una buena experiencia de usuario. Muestra un spinner si:
    // 1. `loading` es true: El sistema todavía está verificando la autenticación.
    // 2. `!isAuthenticated`: El usuario no está logueado (y la redirección se está procesando).
    // 3. `(allowedRoles && !allowedRoles.includes(user?.role))`: El usuario no tiene el rol correcto (y se está procesando la redirección).
    // Esto previene que el contenido protegido se muestre por un instante ("flash") antes de que la redirección se complete.
    if (loading || !isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role))) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    // --- Acceso Concedido ---
    // Si el código llega a este punto, significa que todas las verificaciones han sido superadas:
    // - La carga ha finalizado.
    // - El usuario está autenticado.
    // - El usuario tiene uno de los roles permitidos (o no se requería un rol específico).
    // Por lo tanto, se renderiza el contenido protegido (`children`).
    return <>{children}</>;
};

// Exporta el componente para que pueda ser utilizado para envolver las páginas.
export default ProtectedRoute;