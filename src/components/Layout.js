// Ruta: /frontend/src/components/Layout.js

// --- Dependencias ---
// Importa varios componentes de UI de la librería 'react-bootstrap' para construir la barra de navegación y el contenedor principal.
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
// Importa el hook `useAuth` desde el contexto de autenticación para acceder a los datos del usuario y la función de logout.
import { useAuth } from '@/context/AuthContext';
// Importa el componente `Link` de Next.js para habilitar la navegación del lado del cliente (client-side routing),
// lo cual es más rápido que la navegación tradicional de recarga de página.
import Link from 'next/link';

/**
 * Componente Layout
 * 
 * Este componente actúa como la plantilla principal para todas las páginas de la aplicación.
 * Envuelve el contenido de cada página (`children`) y le añade elementos comunes como la barra de navegación (Navbar).
 * 
 * @param {object} props - Las propiedades del componente.
 * @param {React.ReactNode} props.children - El contenido de la página específica que será renderizado dentro de este layout.
 */
const Layout = ({ children }) => {
    // Obtiene el objeto `user` (con los datos del usuario logueado) y la función `logout` del contexto de autenticación.
    const { user, logout } = useAuth();

    // Renderiza el JSX del componente.
    return (
        // Fragmento de React (<>) para agrupar múltiples elementos sin añadir un nodo extra al DOM.
        <>
            {/* --- Barra de Navegación Principal --- */}
            {/* Se utiliza el componente Navbar de react-bootstrap.
                - `bg="light"` y `variant="light"` definen el esquema de colores.
                - `expand="lg"` hace que la barra sea responsive: se colapsará en un menú de hamburguesa en pantallas pequeñas (lg = large).
                - `sticky="top"` fija la barra de navegación en la parte superior de la pantalla al hacer scroll. */}
            <Navbar bg="light" variant="light" expand="lg" sticky="top">
                <Container>
                    {/* --- Marca/Logo de la Aplicación --- */}
                    {/* El componente `Link` de Next.js envuelve al `Navbar.Brand` para hacerlo un enlace de navegación a la página principal.
                        - `href="/"`: La ruta de destino.
                        - `passHref`: Pasa la propiedad `href` al componente hijo (`Navbar.Brand`).
                        - `legacyBehavior`: Necesario cuando el hijo del `Link` es un componente que renderiza una etiqueta `<a>`. */}
                    <Link href="/" passHref legacyBehavior><Navbar.Brand>SkyNet Dashboard</Navbar.Brand></Link>
                    
                    {/* --- Botón de Hamburguesa para Móviles --- */}
                    <Navbar.Toggle aria-controls="main-navbar" />
                    
                    {/* --- Contenido Colapsable de la Navbar --- */}
                    <Navbar.Collapse id="main-navbar">
                        {/* --- Enlaces de Navegación Principales --- */}
                        <Nav className="me-auto">
                            <Link href="/visits/list" passHref legacyBehavior><Nav.Link>Visitas</Nav.Link></Link>
                            
                            {/* --- Enlaces con Renderizado Condicional --- */}
                            {/* Este enlace solo se muestra si el rol del usuario es 'ADMIN' o 'SUPERVISOR'.
                               El `?.` (optional chaining) previene errores si `user` es null al cargar la página. */}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                                <Link href="/clients" passHref legacyBehavior><Nav.Link>Clientes</Nav.Link></Link>
                            )}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                                <Link href="/reports" passHref legacyBehavior><Nav.Link>Reportes</Nav.Link></Link>
                            )}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                                <Link href="/visits/new" passHref legacyBehavior><Nav.Link>Planificar Visita</Nav.Link></Link>
                            )}
                             {/* Este enlace solo se muestra si el rol del usuario es 'ADMIN'. */}
                             {user?.role === 'ADMIN' && (
                                <Link href="/admin/users" passHref legacyBehavior><Nav.Link>Usuarios</Nav.Link></Link>
                            )}
                        </Nav>
                        
                        {/* --- Menú de Usuario --- */}
                        {/* Este bloque solo se renderiza si hay un usuario logueado (`user` no es null). */}
                        {user && (
                            <Nav>
                                {/* Muestra un menú desplegable con el nombre del usuario. */}
                                <NavDropdown title={`Hola, ${user.name}`} id="user-dropdown">
                                    {/* La opción para cerrar sesión llama a la función `logout` del contexto. */}
                                    <NavDropdown.Item onClick={logout}>Cerrar Sesión</NavDropdown.Item>
                                </NavDropdown>
                            </Nav>
                        )}
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            
            {/* --- Contenido Principal de la Página --- */}
            {/* La etiqueta `<main>` es semánticamente correcta para el contenido principal. */}
            <main>
                {/* El `Container` de react-bootstrap centra el contenido y le da márgenes adecuados. */}
                <Container className="mt-4">
                    {/* Aquí es donde se inyecta y renderiza el contenido de la página actual. */}
                    {children}
                </Container>
            </main>
        </>
    );
};

// Exporta el componente para ser usado en `_app.js` o en otras páginas.
export default Layout;