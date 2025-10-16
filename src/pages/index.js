// Ruta: /src/pages/index.js

// Importar hooks y componentes de React
import { useState, useEffect } from 'react';
// Importar componente de ruta protegida para autenticación
import ProtectedRoute from "@/components/ProtectedRoute";
// Importar contexto de autenticación para obtener información del usuario
import { useAuth } from "@/context/AuthContext";
// Importar cliente API para hacer peticiones al backend
import api from '@/services/api';
// Importar componentes de Bootstrap para la interfaz de usuario
import { Card, Row, Col, Spinner, Alert, ProgressBar, ListGroup, Button } from "react-bootstrap";
// Importar componente Link para navegación entre páginas
import Link from 'next/link';

// --- 1. IMPORTAR LIBRERÍAS DE GRÁFICOS ---
// Importar elementos necesarios de Chart.js para configurar los gráficos
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
// Importar componentes de gráficos específicos de react-chartjs-2
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// --- 2. REGISTRAR LOS COMPONENTES DE CHART.JS QUE VAMOS A USAR ---
// Registrar todos los elementos de Chart.js que serán utilizados en la aplicación
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
// Componente que muestra una tarjeta con estadística, recibe props para personalizar
const StatCard = ({ title, value, variant = "primary", icon = "" }) => (
    <Card className={`text-white bg-${variant} mb-3`}>
        <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
                {/* Título grande con el valor numérico */}
                <Card.Title as="h2" className="fw-bold">{value}</Card.Title>
                {/* Texto descriptivo de la estadística */}
                <Card.Text className="mb-0">{title}</Card.Text>
            </div>
            {/* Icono opcional que se muestra a la derecha */}
            {icon && <i className={`pi ${icon}`} style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>}
        </Card.Body>
    </Card>
);

// --- NUEVOS COMPONENTES REUTILIZABLES PARA GRÁFICOS ---

// Componente para gráficos de Torta/Dona o Barras (para mostrar estados)
const VisitsByStatusChart = ({ data, chartType = 'bar' }) => {
    // Configurar los datos para el gráfico
    const chartData = {
        // Etiquetas para cada categoría (estados de visita)
        labels: data.map(d => d.status),
        datasets: [{
            label: 'Número de Visitas',
            // Valores numéricos para cada estado
            data: data.map(d => d.count),
            // Colores de fondo para cada segmento/barra
            backgroundColor: [
                'rgba(255, 193, 7, 0.7)',  // PENDING (Amarillo)
                'rgba(13, 110, 253, 0.7)', // IN_PROGRESS (Azul)
                'rgba(25, 135, 84, 0.7)',  // FINISHED (Verde)
                'rgba(108, 117, 125, 0.7)' // CANCELLED (Gris)
            ],
            // Colores del borde para cada segmento/barra
            borderColor: [
                'rgba(255, 193, 7, 1)',
                'rgba(13, 110, 253, 1)',
                'rgba(25, 135, 84, 1)',
                'rgba(108, 117, 125, 1)'
            ],
            borderWidth: 1,
        }]
    };
    // Configurar opciones del gráfico
    const options = { 
        responsive: true, 
        plugins: { 
            legend: { position: chartType === 'bar' ? 'top' : 'right' }, 
            title: { display: true, text: 'Visitas por Estado' } 
        } 
    };
    // Renderizar gráfico de barras o dona según el tipo especificado
    return chartType === 'bar' ? <Bar options={options} data={chartData} /> : <Doughnut options={options} data={chartData} />;
};

// Componente para gráficos de Barras o Línea (para mostrar rendimiento)
const PerformanceChart = ({ data, title }) => {
    // Configurar datos para el gráfico de rendimiento
    const chartData = {
        // Etiquetas: nombres o fechas formateadas
        labels: data.map(d => d.name || new Date(d.date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' })),
        datasets: [{
            label: 'Visitas Completadas',
            // Datos de visitas completadas
            data: data.map(d => d.completed_count || d.count),
            backgroundColor: 'rgba(13, 110, 253, 0.5)',
            borderColor: 'rgba(13, 110, 253, 1)',
            borderWidth: 2,
            tension: 0.3, // Suaviza la línea
            fill: true,
        }]
    };
    // Configurar opciones del gráfico
    const options = { 
        responsive: true, 
        plugins: { 
            legend: { display: false }, 
            title: { display: true, text: title } 
        } 
    };
    // Decidir automáticamente si usar gráfico de línea o barras basado en los datos
    const ChartComponent = data.length > 0 && data[0].date ? Line : Bar;
    return <ChartComponent options={options} data={chartData} />;
};

// --- DASHBOARDS ACTUALIZADOS CON GRÁFICOS ---

// Dashboard específico para usuarios con rol ADMIN
const AdminDashboard = ({ data }) => (
    <>
        {/* Tarjeta con acciones principales para administradores */}
        <Card className="mb-4">
            <Card.Header as="h5">Acciones Principales</Card.Header>
            <Card.Body className="d-flex flex-wrap gap-2">
                {/* Botones de navegación a diferentes secciones */}
                <Link href="/admin/users" passHref legacyBehavior><Button variant="primary">Gestionar Usuarios</Button></Link>
                <Link href="/clients" passHref legacyBehavior><Button variant="success">Gestionar Clientes</Button></Link>
                <Link href="/visits/list" passHref legacyBehavior><Button variant="warning">Ver Todas las Visitas</Button></Link>
                <Link href="/reports" passHref legacyBehavior><Button variant="secondary">Ver Reportes</Button></Link>
            </Card.Body>
        </Card>
        {/* Fila con tarjetas de estadísticas */}
        <Row>
            <Col md={4}><StatCard title="Usuarios Activos" value={data.userCount} variant="info" icon="pi pi-users" /></Col>
            <Col md={4}><StatCard title="Clientes Totales" value={data.clientCount} variant="success" icon="pi pi-id-card" /></Col>
            <Col md={4}><StatCard title="Visitas Pendientes" value={data.pendingVisitsGlobal} variant="danger" icon="pi pi-exclamation-triangle" /></Col>
        </Row>
        {/* Fila con gráficos para administradores */}
        <Row className="mt-4">
            <Col lg={7}><Card><Card.Header as="h5">Visitas Completadas por Supervisor</Card.Header><Card.Body><PerformanceChart data={data.charts.visitsBySupervisor} /></Card.Body></Card></Col>
            <Col lg={5}><Card><Card.Header as="h5">Estado Global de Visitas</Card.Header><Card.Body><VisitsByStatusChart data={data.charts.globalStatus} chartType="doughnut" /></Card.Body></Card></Col>
        </Row>
    </>
);

// Dashboard específico para usuarios con rol SUPERVISOR
const SupervisorDashboard = ({ data }) => {
    // Calcular progreso del equipo para hoy
    const { total, finished } = data.teamVisitsToday;
    const progress = total > 0 ? Math.round((finished / total) * 100) : 0;
    return (
        <>
            {/* Barra de progreso del equipo */}
            <h4>Progreso del Equipo Hoy</h4>
            <ProgressBar now={progress} label={`${progress}% completado`} className="mb-4" />
            {/* Fila con gráficos para supervisores */}
            <Row className="mt-4">
                <Col lg={8}><Card><Card.Header as="h5">Rendimiento del Equipo (Últimos 30 días)</Card.Header><Card.Body><PerformanceChart data={data.charts.teamPerformance} /></Card.Body></Card></Col>
                <Col lg={4}><Card><Card.Header as="h5">Estado de Visitas del Equipo</Card.Header><Card.Body><VisitsByStatusChart data={data.charts.teamStatus} chartType="doughnut" /></Card.Body></Card></Col>
            </Row>
        </>
    );
};

// Dashboard específico para usuarios con rol TECHNICIAN
const TechnicianDashboard = ({ data }) => (
    <>
        {/* Fila con estadísticas personales del técnico */}
        <Row>
            <Col md={4}><StatCard title="Mis Visitas de Hoy" value={data.myVisits.total} variant="primary" /></Col>
            <Col md={4}><StatCard title="Completadas Hoy" value={data.myVisits.completed} variant="success" /></Col>
            <Col md={4}><StatCard title="Restantes Hoy" value={data.myVisits.remaining} variant="warning" /></Col>
        </Row>
        {/* Fila con gráficos de rendimiento personal */}
        <Row className="mt-4">
            <Col lg={8}><Card><Card.Header as="h5">Mi Rendimiento (Últimos 7 días)</Card.Header><Card.Body><PerformanceChart data={data.charts.weeklyPerformance} /></Card.Body></Card></Col>
            <Col lg={4}><Card><Card.Header as="h5">Desglose de Mis Visitas</Card.Header><Card.Body><VisitsByStatusChart data={data.charts.myStatus} chartType="doughnut" /></Card.Body></Card></Col>
        </Row>
        {/* Información de la próxima visita programada */}
        {data.nextVisit && (
            <Card className="mt-4">
                <Card.Header as="h5">Próxima Visita</Card.Header>
                <Card.Body>
                    <Card.Title>{data.nextVisit.client_name}</Card.Title>
                    <Card.Text><strong>Hora:</strong> {new Date(data.nextVisit.planned_at).toLocaleTimeString()}</Card.Text>
                    {/* Enlace al historial de visitas */}
                    <Link href="/visits/list" passHref legacyBehavior><Button variant="primary">Ir a Mi Historial de Visitas</Button></Link>
                </Card.Body>
            </Card>
        )}
    </>
);

// --- Componente Principal de la Página ---
const HomePage = () => {
    // Obtener información del usuario desde el contexto de autenticación
    const { user } = useAuth();
    // Estado para almacenar los datos del dashboard
    const [dashboardData, setDashboardData] = useState(null);
    // Estado para controlar la carga de datos
    const [loading, setLoading] = useState(true);
    // Estado para almacenar mensajes de error
    const [error, setError] = useState('');

    // Efecto para cargar los datos del dashboard cuando el usuario cambia
    useEffect(() => {
        const fetchDashboardData = async () => {
            // Si no hay usuario, detener la carga
            if (!user) { setLoading(false); return; }
            try {
                setLoading(true);
                // Hacer petición a la API para obtener datos del dashboard
                const { data } = await api.get('/dashboard');
                setDashboardData(data);
                setError('');
            } catch (err) {
                // Manejar errores de la petición
                setError('No se pudo cargar la información del dashboard. ' + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]); // Se ejecuta cuando el usuario cambia

    // Función para renderizar el dashboard según el rol del usuario
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
        // Proteger la ruta para que solo usuarios autenticados puedan acceder
        <ProtectedRoute>
            {/* Mensaje de bienvenida personalizado */}
            <Alert variant="light">
                <Alert.Heading>¡Bienvenido de nuevo, {user?.name}!</Alert.Heading>
                <p>Has iniciado sesión con el rol de <strong>{user?.role}</strong>.</p>
            </Alert>
            
            {/* Mostrar spinner durante la carga */}
            {loading && <div className="text-center my-5"><Spinner animation="border" variant="primary" /></div>}
            {/* Mostrar mensaje de error si existe */}
            {error && <Alert variant="danger">{error}</Alert>}
            {/* Renderizar el dashboard correspondiente cuando no hay carga ni error */}
            {!loading && !error && renderDashboardByRole()}
        </ProtectedRoute>
    );
};

// Exportar el componente principal como default
export default HomePage;