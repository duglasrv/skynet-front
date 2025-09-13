import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from '@/services/api';
import { Card, Row, Col, Spinner, Alert, ProgressBar, ListGroup, Button } from "react-bootstrap";
import Link from 'next/link';

// --- Sub-componente Reutilizable para Tarjetas de Estadísticas ---
const StatCard = ({ title, value, variant = "primary" }) => (
    <Card className={`text-white bg-${variant} mb-3 text-center`}>
        <Card.Body>
            <Card.Title as="h1" className="fw-bold">{value}</Card.Title>
            <Card.Text>{title}</Card.Text>
        </Card.Body>
    </Card>
);

// --- Dashboard específico para el Administrador ---
const AdminDashboard = ({ data }) => (
    <>
        <Row>
            <Col md={4}><StatCard title="Usuarios Totales" value={data.userCount} variant="info" /></Col>
            <Col md={4}><StatCard title="Clientes Registrados" value={data.clientCount} variant="success" /></Col>
            <Col md={4}><StatCard title="Visitas Hoy (Global)" value={data.totalVisitsToday} variant="warning" /></Col>
        </Row>
        <Card className="mt-4">
            <Card.Header as="h5">Accesos Rápidos</Card.Header>
            <Card.Body className="d-flex gap-2">
                <Link href="/admin/users" passHref legacyBehavior><Button variant="primary">Gestionar Usuarios</Button></Link>
                <Link href="/clients" passHref legacyBehavior><Button variant="success">Gestionar Clientes</Button></Link>
            </Card.Body>
        </Card>
    </>
);

// --- Dashboard específico para el Supervisor ---
const SupervisorDashboard = ({ data }) => {
    const { total, finished } = data.teamVisits;
    const progress = total > 0 ? Math.round((finished / total) * 100) : 0;

    return (
        <>
            <h4>Progreso del Equipo Hoy</h4>
            <ProgressBar now={progress} label={`${progress}% completado`} className="mb-4" />
            <Row>
                <Col md={3}><StatCard title="Visitas Totales" value={total} variant="primary" /></Col>
                <Col md={3}><StatCard title="Pendientes" value={data.teamVisits.pending} variant="warning" /></Col>
                <Col md={3}><StatCard title="En Progreso" value={data.teamVisits.in_progress} variant="info" /></Col>
                <Col md={3}><StatCard title="Finalizadas" value={data.teamVisits.finished} variant="success" /></Col>
            </Row>
            <Card className="mt-4">
                <Card.Header as="h5">Estado de los Técnicos</Card.Header>
                <ListGroup variant="flush">
                    {data.teamTechnicians.map(tech => (
                        <ListGroup.Item key={tech.id} className="d-flex justify-content-between align-items-center">
                            {tech.name}
                            {tech.status === 'IN_PROGRESS' 
                                ? <span className="badge bg-primary">En visita: {tech.currentVisitClient}</span>
                                : <span className={`badge bg-${tech.status === 'PENDING' ? 'secondary' : 'success'}`}>{tech.status}</span>
                            }
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card>
        </>
    );
};

// --- Dashboard específico para el Técnico ---
const TechnicianDashboard = ({ data }) => (
    <>
        <Row>
            <Col md={4}><StatCard title="Visitas Totales Hoy" value={data.myVisits.total} variant="primary" /></Col>
            <Col md={4}><StatCard title="Completadas" value={data.myVisits.completed} variant="success" /></Col>
            <Col md={4}><StatCard title="Pendientes" value={data.myVisits.remaining} variant="warning" /></Col>
        </Row>
        {data.nextVisit ? (
            <Card className="mt-4">
                <Card.Header as="h5">Próxima Visita</Card.Header>
                <Card.Body>
                    <Card.Title>{data.nextVisit.client_name}</Card.Title>
                    <Card.Text>
                        <strong>Dirección:</strong> {data.nextVisit.address}<br/>
                        <strong>Hora:</strong> {new Date(data.nextVisit.planned_at).toLocaleTimeString()}
                    </Card.Text>
                    <Link href="/tech/today" passHref legacyBehavior><Button variant="primary">Ver Todas Mis Visitas</Button></Link>
                </Card.Body>
            </Card>
        ) : (
            <Alert variant="success" className="mt-4">¡Felicidades! Has completado todas tus visitas por hoy.</Alert>
        )}
    </>
);


// --- Componente Principal de la Página del Dashboard ---
const HomePage = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/dashboard');
                setDashboardData(data);
            } catch (err) {
                setError('No se pudo cargar la información del dashboard. ' + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        } else {
            // Si el usuario no está definido (aún cargando o no logueado), detenemos la carga
            setLoading(false);
        }
    }, [user]);

    const renderDashboardByRole = () => {
        // AÑADIMOS LA COMPROBACIÓN AQUÍ
        if (!dashboardData || !user) {
            return null;
        }
        
        switch (user.role) {
            case 'ADMIN':
                return <AdminDashboard data={dashboardData} />;
            case 'SUPERVISOR':
                return <SupervisorDashboard data={dashboardData} />;
            case 'TECHNICIAN':
                return <TechnicianDashboard data={dashboardData} />;
            default:
                return <p>No se ha configurado un dashboard para tu rol.</p>;
        }
    };

    return (
        <ProtectedRoute>
            <Alert variant="light">
                <Alert.Heading>¡Bienvenido de nuevo, {user?.name}!</Alert.Heading>
                <p>Has iniciado sesión con el rol de <strong>{user?.role}</strong>.</p>
            </Alert>
            
            {loading && <div className="text-center my-5"><Spinner animation="border" variant="primary" /></div>}
            {error && <Alert variant="danger">{error}</Alert>}
            {!loading && !error && renderDashboardByRole()}
        </ProtectedRoute>
    );
};

export default HomePage;