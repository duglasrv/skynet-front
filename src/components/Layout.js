// Ruta: /src/components/Layout.js

import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
                <Container>
                    <Link href="/" passHref legacyBehavior><Navbar.Brand>SkyNet Dashboard</Navbar.Brand></Link>
                    <Navbar.Toggle aria-controls="main-navbar" />
                    <Navbar.Collapse id="main-navbar">
                        <Nav className="me-auto">
                            {/* --- Menú Renderizado Condicionalmente --- */}
                            
                            {/* Visible solo para Admin */}
                            {user?.role === 'ADMIN' && (
                                <Link href="/admin/users" passHref legacyBehavior><Nav.Link>Usuarios</Nav.Link></Link>
                            )}

                            {/* Visible para Admin y Supervisor */}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                                <Link href="/clients" passHref legacyBehavior><Nav.Link>Clientes</Nav.Link></Link>
                            )}

                            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                                <Link href="/clients" passHref legacyBehavior><Nav.Link>Clientes</Nav.Link></Link>
                            )}
                            
                            {/* AÑADE ESTE NUEVO BLOQUE */}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                                <Link href="/reports" passHref legacyBehavior><Nav.Link>Reportes</Nav.Link></Link>
                            )}
                            
                            {/* Visible solo para Supervisor */}
                            {user?.role === 'SUPERVISOR' && (
                                <Link href="/visits/new" passHref legacyBehavior><Nav.Link>Planificar Visita</Nav.Link></Link>
                            )}

                            {/* Visible solo para Técnico */}
                            {user?.role === 'TECHNICIAN' && (
                                <Link href="/tech/today" passHref legacyBehavior><Nav.Link>Mis Visitas de Hoy</Nav.Link></Link>
                            )}
                        </Nav>
                        
                        {/* Menú de Usuario a la derecha */}
                        {user && (
                            <Nav>
                                <NavDropdown title={`Hola, ${user.name}`} id="user-dropdown">
                                    <NavDropdown.Item onClick={logout}>
                                        Cerrar Sesión
                                    </NavDropdown.Item> {/* <-- CORRECCIÓN APLICADA AQUÍ */}
                                </NavDropdown>
                            </Nav>
                        )}
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            
            <main>
                <Container className="mt-4">
                    {children}
                </Container>
            </main>
        </>
    );
};

export default Layout;