// Ruta: /src/pages/index.js

import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from '@/services/api';
import { Card, Row, Col, Spinner, Alert, ProgressBar, ListGroup, Button } from "react-bootstrap";
import Link from 'next/link';

// --- 1. IMPORTAR LIBRERÍAS DE GRÁFICOS ---
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// --- 2. REGISTRAR LOS COMPONENTES DE CHART.JS QUE VAMOS A USAR ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// --- Sub-componente Reutilizable para Tarjetas de Estadísticas ---
const StatCard = ({ title, value, variant = "primary", icon = "" }) => (
    <Card className={`text-white bg-${variant} mb-3`}>
        <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
                <Card.Title as="h2" className="fw-bold">{value}</Card.Title>
                <Card.Text className="mb-0">{title}</Card.Text>
            </div>
            {icon && <i className={`pi ${icon}`} style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>}
        </Card.Body>
    </Card>
);

// --- NUEVOS COMPONENTES REUTILIZABLES PARA GRÁFICOS ---

// Componente para gráficos de Torta/Dona o Barras (para mostrar estados)
const VisitsByStatusChart = ({ data, chartType = 'bar' }) => {
    const chartData = {
        labels: data.map(d => d.status),
        datasets: [{
            label: 'Número de Visitas',
            data: data.map(d => d.count),
            backgroundColor: [
                'rgba(255, 193, 7, 0.7)',  // PENDING (Amarillo)
                'rgba(13, 110, 253, 0.7)', // IN_PROGRESS (Azul)
                'rgba(25, 135, 84, 0.7)',  // FINISHED (Verde)
                'rgba(108, 117, 125, 0.7)' // CANCELLED (Gris)
            ],
            borderColor: [
                'rgba(255, 193, 7, 1)',
                'rgba(13, 110, 253, 1)',
                'rgba(25, 135, 84, 1)',
                'rgba(108, 117, 125, 1)'
            ],
            borderWidth: 1,
        }]
    };
    const options = { responsive: true, plugins: { legend: { position: chartType === 'bar' ? 'top' : 'right' }, title: { display: true, text: 'Visitas por Estado' } } };
    return chartType === 'bar' ? <Bar options={options} data={chartData} /> : <Doughnut options={options} data={chartData} />;
};

// Componente para gráficos de Barras o Línea (para mostrar rendimiento)
const PerformanceChart = ({ data, title }) => {
    const chartData = {
        labels: data.map(d => d.name || new Date(d.date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' })),
        datasets: [{
            label: 'Visitas Completadas',
            data: data.map(d => d.completed_count || d.count),
            backgroundColor: 'rgba(13, 110, 253, 0.5)',
            borderColor: 'rgba(13, 110, 253, 1)',
            borderWidth: 2,
            tension: 0.3, // Suaviza la línea
            fill: true,
        }]
    };
    const options = { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: title } } };
    // Decide si es un gráfico de Línea (si los labels son fechas) o de Barras
    const ChartComponent = data.length > 0 && data[0].date ? Line : Bar;
    return <ChartComponent options={options} data={chartData} />;
};


// --- DASHBOARDS ACTUALIZADOS CON GRÁFICOS ---

const AdminDashboard = ({ data }) => (
    <>
        <Card className="mb-4">
            <Card.Header as="h5">Acciones Principales</Card.Header>
            <Card.Body className="d-flex flex-wrap gap-2">
                <Link href="/admin/users" passHref legacyBehavior><Button variant="primary">Gestionar Usuarios</Button></Link>
                <Link href="/clients" passHref legacyBehavior><Button variant="success">Gestionar Clientes</Button></Link>
                <Link href="/visits/list" passHref legacyBehavior><Button variant="warning">Ver Todas las Visitas</Button></Link>
                <Link href="/reports" passHref legacyBehavior><Button variant="secondary">Ver Reportes</Button></Link>
            </Card.Body>
        </Card>
        <Row>
            <Col md={4}><StatCard title="Usuarios Activos" value={data.userCount} variant="info" icon="pi pi-users" /></Col>
            <Col md={4}><StatCard title="Clientes Totales" value={data.clientCount} variant="success" icon="pi pi-id-card" /></Col>
            <Col md={4}><StatCard title="Visitas Pendientes" value={data.pendingVisitsGlobal} variant="danger" icon="pi pi-exclamation-triangle" /></Col>
        </Row>
        <Row className="mt-4">
            <Col lg={7}><Card><Card.Header as="h5">Visitas Completadas por Supervisor</Card.Header><Card.Body><PerformanceChart data={data.charts.visitsBySupervisor} /></Card.Body></Card></Col>
            <Col lg={5}><Card><Card.Header as="h5">Estado Global de Visitas</Card.Header><Card.Body><VisitsByStatusChart data={data.charts.globalStatus} chartType="doughnut" /></Card.Body></Card></Col>
        </Row>

    </>
);

const SupervisorDashboard = ({ data }) => {
    const { total, finished } = data.teamVisitsToday;
    const progress = total > 0 ? Math.round((finished / total) * 100) : 0;
    return (
        <>
            <h4>Progreso del Equipo Hoy</h4>
            <ProgressBar now={progress} label={`${progress}% completado`} className="mb-4" />
            <Row className="mt-4">
                <Col lg={8}><Card><Card.Header as="h5">Rendimiento del Equipo (Últimos 30 días)</Card.Header><Card.Body><PerformanceChart data={data.charts.teamPerformance} /></Card.Body></Card></Col>
                <Col lg={4}><Card><Card.Header as="h5">Estado de Visitas del Equipo</Card.Header><Card.Body><VisitsByStatusChart data={data.charts.teamStatus} chartType="doughnut" /></Card.Body></Card></Col>
            </Row>
        </>
    );
};

const TechnicianDashboard = ({ data }) => (
    <>
        <Row>
            <Col md={4}><StatCard title="Mis Visitas de Hoy" value={data.myVisits.total} variant="primary" /></Col>
            <Col md={4}><StatCard title="Completadas Hoy" value={data.myVisits.completed} variant="success" /></Col>
            <Col md={4}><StatCard title="Restantes Hoy" value={data.myVisits.remaining} variant="warning" /></Col>
        </Row>
        <Row className="mt-4">
            <Col lg={8}><Card><Card.Header as="h5">Mi Rendimiento (Últimos 7 días)</Card.Header><Card.Body><PerformanceChart data={data.charts.weeklyPerformance} /></Card.Body></Card></Col>
            <Col lg={4}><Card><Card.Header as="h5">Desglose de Mis Visitas</Card.Header><Card.Body><VisitsByStatusChart data={data.charts.myStatus} chartType="doughnut" /></Card.Body></Card></Col>
        </Row>
        {data.nextVisit && (
            <Card className="mt-4">
                <Card.Header as="h5">Próxima Visita</Card.Header>
                <Card.Body>
                    <Card.Title>{data.nextVisit.client_name}</Card.Title>
                    <Card.Text><strong>Hora:</strong> {new Date(data.nextVisit.planned_at).toLocaleTimeString()}</Card.Text>
                    <Link href="/visits/list" passHref legacyBehavior><Button variant="primary">Ir a Mi Historial de Visitas</Button></Link>
                </Card.Body>
            </Card>
        )}
    </>
);

// --- Componente Principal de la Página ---
const HomePage = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) { setLoading(false); return; }
            try {
                setLoading(true);
                const { data } = await api.get('/dashboard');
                setDashboardData(data);
                setError('');
            } catch (err) {
                setError('No se pudo cargar la información del dashboard. ' + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    const renderDashboardByRole = () => {
        if (!dashboardData || !user) return null;
        switch (user.role) {
            case 'ADMIN': return <AdminDashboard data={dashboardData} />;
            case 'SUPERVISOR': return <SupervisorDashboard data={dashboardData} />;
            case 'TECHNICIAN': return <TechnicianDashboard data={dashboardData} />;
            default: return <p>No se ha configurado un dashboard para tu rol.</p>;
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