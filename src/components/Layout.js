// Ruta: /frontend/src/components/Layout.js

import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();

    return (
        <>
            {/* CAMBIOS APLICADOS AQUÍ */}
            <Navbar bg="light" variant="light" expand="lg" sticky="top">
                <Container>
                    <Link href="/" passHref legacyBehavior><Navbar.Brand>SkyNet Dashboard</Navbar.Brand></Link>
                    <Navbar.Toggle aria-controls="main-navbar" />
                    <Navbar.Collapse id="main-navbar">
                        <Nav className="me-auto">
                            <Link href="/visits/list" passHref legacyBehavior><Nav.Link>Visitas</Nav.Link></Link>
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                                <Link href="/clients" passHref legacyBehavior><Nav.Link>Clientes</Nav.Link></Link>
                            )}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                                <Link href="/reports" passHref legacyBehavior><Nav.Link>Reportes</Nav.Link></Link>
                            )}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
                                <Link href="/visits/new" passHref legacyBehavior><Nav.Link>Planificar Visita</Nav.Link></Link>
                            )}
                             {user?.role === 'ADMIN' && (
                                <Link href="/admin/users" passHref legacyBehavior><Nav.Link>Usuarios</Nav.Link></Link>
                            )}
                        </Nav>
                        {user && (
                            <Nav>
                                <NavDropdown title={`Hola, ${user.name}`} id="user-dropdown">
                                    <NavDropdown.Item onClick={logout}>Cerrar Sesión</NavDropdown.Item>
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