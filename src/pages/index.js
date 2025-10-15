// Ruta: /src/pages/index.js

// --- Dependencias de React, Componentes y Servicios ---
import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute"; // Componente para proteger la página
import { useAuth } from "@/context/AuthContext"; // Hook para obtener datos del usuario logueado
import api from '@/services/api'; // Instancia de Axios para llamadas a la API
import { Card, Row, Col, Spinner, Alert, ProgressBar, Button } from "react-bootstrap";
import Link from 'next/link'; // Para la navegación entre páginas

// --- 1. IMPORTAR LIBRERÍAS DE GRÁFICOS ---
// Se importa el objeto principal `Chart` y los componentes individuales (escalas, elementos, etc.) que se van a utilizar.
// Importar solo lo necesario ayuda a reducir el tamaño final del paquete de la aplicación.
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
// Se importan los componentes de React (`Bar`, `Doughnut`, `Line`) que renderizarán los gráficos.
import { Bar, Doughnut, Line } from 'react--chartjs-2';

// --- 2. REGISTRAR LOS COMPONENTES DE CHART.JS QUE VAMOS A USAR ---
// Chart.js requiere que se registren explícitamente los componentes que se van a utilizar.
// Esto permite que el motor de Chart.js sepa cómo dibujar las escalas, las barras, las leyendas, etc.
ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend
);

// --- Sub-componente Reutilizable para Tarjetas de Estadísticas ---
/**
 * Renderiza una tarjeta de color con un título, un valor grande y un ícono opcional.
 * @param {string} title - El texto descriptivo (ej: "Usuarios Activos").
 * @param {string|number} value - El valor numérico principal.
 * @param {string} [variant="primary"] - El color de la tarjeta (ej: "info", "success").
 * @param {string} [icon=""] - La clase del ícono (ej: "pi pi-users").
 */
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

/**
 * Componente de Gráfico para "Visitas por Estado".
 * Puede renderizar un gráfico de barras o de dona/torta.
 * @param {Array} data - Array de objetos, ej: [{ status: 'PENDING', count: 10 }].
 * @param {string} [chartType='bar'] - El tipo de gráfico a renderizar ('bar' o 'doughnut').
 */
const VisitsByStatusChart = ({ data, chartType = 'bar' }) => {
    // Formatea los datos recibidos de la API al formato que Chart.js necesita.
    const chartData = {
        labels: data.map(d => d.status), // Etiquetas para el eje X o para las secciones de la dona.
        datasets: [{
            label: 'Número de Visitas',
            data: data.map(d => d.count), // Los valores numéricos.
            backgroundColor: [ // Colores para cada estado.
                'rgba(255, 193, 7, 0.7)',  // PENDING (Amarillo)
                'rgba(13, 110, 253, 0.7)', // IN_PROGRESS (Azul)
                'rgba(25, 135, 84, 0.7)',  // FINISHED (Verde)
                'rgba(108, 117, 125, 0.7)' // CANCELLED (Gris)
            ],
            borderColor: [ /* ... colores de borde ... */ ],
            borderWidth: 1,
        }]
    };
    // Opciones de configuración para el gráfico.
    const options = { responsive: true, plugins: { legend: { position: chartType === 'bar' ? 'top' : 'right' }, title: { display: true, text: 'Visitas por Estado' } } };
    // Devuelve el componente de gráfico correspondiente según `chartType`.
    return chartType === 'bar' ? <Bar options={options} data={chartData} /> : <Doughnut options={options} data={chartData} />;
};

/**
 * Componente de Gráfico para "Rendimiento".
 * Puede renderizar un gráfico de línea (para series de tiempo) o de barras.
 * @param {Array} data - Array de objetos, ej: [{ name: 'Técnico 1', completed_count: 5 }] o [{ date: '2023-10-26', count: 3 }].
 * @param {string} title - El título del gráfico.
 */
const PerformanceChart = ({ data, title }) => {
    const chartData = {
        labels: data.map(d => d.name || new Date(d.date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' })), // Usa el nombre o formatea la fecha.
        datasets: [{
            label: 'Visitas Completadas',
            data: data.map(d => d.completed_count || d.count), // Usa el campo de conteo correspondiente.
            backgroundColor: 'rgba(13, 110, 253, 0.5)',
            borderColor: 'rgba(13, 110, 253, 1)',
            borderWidth: 2,
            tension: 0.3, // Suaviza las curvas en el gráfico de línea.
            fill: true, // Rellena el área bajo la línea.
        }]
    };
    const options = { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: title } } };
    // Lógica para decidir qué tipo de gráfico usar: si los datos tienen una propiedad 'date', es un gráfico de línea.
    const ChartComponent = data.length > 0 && data[0].date ? Line : Bar;
    return <ChartComponent options={options} data={chartData} />;
};

// --- COMPONENTES DE DASHBOARD ESPECÍFICOS POR ROL ---

/** Dashboard para el rol ADMIN. */
const AdminDashboard = ({ data }) => (
    <>
        {/* Sección de Acciones Rápidas */}
        <Card className="mb-4">
            <Card.Header as="h5">Acciones Principales</Card.Header>
            <Card.Body className="d-flex flex-wrap gap-2">
                <Link href="/admin/users" passHref legacyBehavior><Button variant="primary">Gestionar Usuarios</Button></Link>
                <Link href="/clients" passHref legacyBehavior><Button variant="success">Gestionar Clientes</Button></Link>
                <Link href="/visits/list" passHref legacyBehavior><Button variant="warning">Ver Todas las Visitas</Button></Link>
                <Link href="/reports" passHref legacyBehavior><Button variant="secondary">Ver Reportes</Button></Link>
            </Card.Body>
        </Card>
        {/* Sección de Estadísticas Principales */}
        <Row>
            <Col md={4}><StatCard title="Usuarios Activos" value={data.userCount} variant="info" icon="pi pi-users" /></Col>
            <Col md={4}><StatCard title="Clientes Totales" value={data.clientCount} variant="success" icon="pi pi-id-card" /></Col>
            <Col md={4}><StatCard title="Visitas Pendientes" value={data.pendingVisitsGlobal} variant="danger" icon="pi pi-exclamation-triangle" /></Col>
        </Row>
        {/* Sección de Gráficos */}
        <Row className="mt-4">
            <Col lg={7}><Card><Card.Header as="h5">Visitas Completadas por Supervisor</Card.Header><Card.Body><PerformanceChart data={data.charts.visitsBySupervisor} /></Card.Body></Card></Col>
            <Col lg={5}><Card><Card.Header as="h5">Estado Global de Visitas</Card.Header><Card.Body><VisitsByStatusChart data={data.charts.globalStatus} chartType="doughnut" /></Card.Body></Card></Col>
        </Row>
    </>
);

/** Dashboard para el rol SUPERVISOR. */
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

/** Dashboard para el rol TECHNICIAN. */
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
        {/* Muestra información de la próxima visita solo si existe. */}
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
    // --- Estados de la Página ---
    const { user } = useAuth(); // Obtiene el usuario actual.
    const [dashboardData, setDashboardData] = useState(null); // Almacena los datos del dashboard recibidos de la API.
    const [loading, setLoading] = useState(true); // Controla el estado de carga.
    const [error, setError] = useState(''); // Almacena mensajes de error.

    // `useEffect` para obtener los datos del dashboard cuando el componente se monta o el usuario cambia.
    useEffect(() => {
        const fetchDashboardData = async () => {
            // No intentar cargar datos si aún no sabemos quién es el usuario.
            if (!user) { setLoading(false); return; }
            try {
                setLoading(true);
                const { data } = await api.get('/dashboard'); // Llama al endpoint del dashboard.
                setDashboardData(data);
                setError('');
            } catch (err) {
                setError('No se pudo cargar la información del dashboard. ' + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]); // Se re-ejecuta si el objeto `user` cambia.

    /**
     * Función que decide qué componente de dashboard renderizar basado en el rol del usuario.
     */
    const renderDashboardByRole = () => {
        if (!dashboardData || !user) return null; // No renderizar nada si no hay datos o usuario.
        switch (user.role) {
            case 'ADMIN': return <AdminDashboard data={dashboardData} />;
            case 'SUPERVISOR': return <SupervisorDashboard data={dashboardData} />;
            case 'TECHNICIAN': return <TechnicianDashboard data={dashboardData} />;
            default: return <p>No se ha configurado un dashboard para tu rol.</p>;
        }
    };

    // --- Renderizado Principal de la Página ---
    return (
        <ProtectedRoute>
            {/* Mensaje de bienvenida personalizado. */}
            <Alert variant="light">
                <Alert.Heading>¡Bienvenido de nuevo, {user?.name}!</Alert.Heading>
                <p>Has iniciado sesión con el rol de <strong>{user?.role}</strong>.</p>
            </Alert>
            
            {/* Lógica de renderizado para carga, error y contenido. */}
            {loading && <div className="text-center my-5"><Spinner animation="border" variant="primary" /></div>}
            {error && <Alert variant="danger">{error}</Alert>}
            {!loading && !error && renderDashboardByRole()}
        </ProtectedRoute>
    );
};

export default HomePage;