// Ruta: /frontend/src/pages/visits/list.js

// --- Dependencias de React, Bootstrap y Servicios ---
import { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Badge, Card, ListGroup, Button, Modal, Form } from 'react-bootstrap';
import ProtectedRoute from "@/components/ProtectedRoute"; // Para proteger la página
import api from '@/services/api'; // Instancia de Axios para llamadas al backend
import FilterBar from '@/components/FilterBar'; // Componente reutilizable para los filtros
import { useAuth } from '@/context/AuthContext'; // Hook para acceder a los datos del usuario logueado
import emailjs from '@emailjs/browser'; // Librería para enviar correos desde el frontend

// --- Definición del Componente de Página ---
const VisitsListPage = () => {
    // --- Estados del Componente ---
    const { user } = useAuth(); // Obtiene el usuario actual del contexto de autenticación.
    const [visits, setVisits] = useState([]); // Almacena la lista de visitas a mostrar.
    const [users, setUsers] = useState([]); // Almacena la lista de todos los usuarios para poblar los filtros de Admin/Supervisor.
    const [loading, setLoading] = useState(true); // Controla el estado de carga.
    const [error, setError] = useState(''); // Almacena mensajes de error.
    const [filters, setFilters] = useState({}); // Almacena el estado actual de los filtros de la FilterBar.

    // --- Estados específicos para la funcionalidad del Técnico (Modal de Check-out) ---
    const [showReportModal, setShowReportModal] = useState(false); // Controla la visibilidad del modal de reporte.
    const [selectedVisit, setSelectedVisit] = useState(null); // Almacena la visita que el técnico está finalizando.
    const [reportData, setReportData] = useState({ summary: '', minutes_spent: '' }); // Almacena los datos del formulario del reporte.

    // --- Funciones de Obtención de Datos ---
    /**
     * Función principal para obtener datos desde el backend.
     * Carga tanto las visitas (filtradas) como la lista de usuarios si es necesario.
     */
    const fetchData = async () => {
        try {
            setLoading(true);
            // Convierte el objeto de filtros (ej: {status: 'PENDING'}) en una cadena de consulta URL (ej: "status=PENDING").
            const queryParams = new URLSearchParams(filters).toString();
            // Llama a la API para obtener las visitas. El backend ya se encarga de restringir los datos según el rol del usuario que hace la petición.
            const visitsRes = await api.get(`/visits?${queryParams}`);
            setVisits(visitsRes.data);

            // Condición: Solo obtenemos la lista completa de usuarios si el rol es 'ADMIN' o 'SUPERVISOR',
            // ya que solo ellos necesitan ver los selectores de técnico/supervisor en la barra de filtros.
            if (user && (user.role === 'ADMIN' || user.role === 'SUPERVISOR')) {
                const usersRes = await api.get('/users');
                setUsers(usersRes.data);
            }
            setError(''); // Limpia cualquier error previo.
        } catch (err) {
            setError('No se pudieron cargar las visitas. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false); // Oculta el spinner, haya habido éxito o error.
        }
    };

    // `useEffect` que se ejecuta cuando el componente se monta y cada vez que el objeto `user` cambia.
    useEffect(() => {
        // Ponemos una guarda (`if (user)`) para asegurarnos de que no intentamos cargar datos
        // antes de que el contexto de autenticación haya determinado quién es el usuario.
        if (user) fetchData();
    }, [user]);

    /**
     * Manejador para el botón "Aplicar Filtros" del componente FilterBar.
     */
    const handleApplyFilters = (e) => {
        e.preventDefault(); // Evita que el formulario recargue la página.
        fetchData(); // Vuelve a llamar a fetchData con los nuevos filtros.
    };

    // --- Manejadores para la funcionalidad del Técnico ---

    /** Obtiene la geolocalización del usuario usando la API del navegador, envuelta en una Promesa. */
    const handleGetLocation = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocalización no soportada.'));
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => reject(new Error('No se pudo obtener la ubicación.'))
        );
    });

    /** Maneja la lógica de Check-In. */
    const handleCheckIn = async (visitId) => {
        try {
            const location = await handleGetLocation();
            await api.post(`/visits/${visitId}/checkin`, location);
            alert('Check-in realizado con éxito.');
            fetchData(); // Recarga la lista para mostrar el nuevo estado 'IN_PROGRESS'.
        } catch (err) {
            alert('Error en Check-in: ' + err.message);
        }
    };

    /** Abre el modal de reporte y guarda la visita seleccionada. */
    const handleShowReportModal = (visit) => {
        setSelectedVisit(visit);
        setShowReportModal(true);
    };

    /** Cierra el modal de reporte y resetea los estados. */
    const handleCloseReportModal = () => {
        setShowReportModal(false);
        setSelectedVisit(null);
        setReportData({ summary: '', minutes_spent: '' });
    };

    /** Actualiza el estado del formulario del reporte mientras el técnico escribe. */
    const handleReportInputChange = (e) => {
        const { name, value } = e.target;
        setReportData(prev => ({ ...prev, [name]: value }));
    };

    /** Maneja la lógica de Check-Out, incluyendo el envío de notificación por email. */
    const handleCheckOut = async (e) => {
        e.preventDefault();
        if (!selectedVisit) return;
        let emailSent = false;

        try {
            // Paso 1: Siempre guardar el reporte en nuestra base de datos.
            const location = await handleGetLocation();
            await api.post(`/visits/${selectedVisit.id}/checkout`, { ...reportData, ...location });

            // Paso 2: Intentar enviar un correo de notificación, pero SOLO SI el cliente tiene un email registrado.
            if (selectedVisit.client_email) {
                // Prepara los parámetros que la plantilla de EmailJS espera recibir.
                const templateParams = {
                    client_name: selectedVisit.client_name,
                    client_email: selectedVisit.client_email,
                    technician_name: user.name,
                    visit_date: new Date(selectedVisit.planned_at).toLocaleDateString(),
                    minutes_spent: reportData.minutes_spent,
                    summary: reportData.summary
                };
                // Llama a la API de EmailJS con las credenciales guardadas en las variables de entorno.
                await emailjs.send(
                    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
                    templateParams,
                    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
                );
                emailSent = true; // Marca que el email se envió con éxito.
            }
            
            // Paso 3: Mostrar un mensaje de éxito al usuario, adaptado según si se envió o no el correo.
            if (emailSent) {
                alert('¡Visita finalizada! El reporte se guardó y se notificó al cliente.');
            } else {
                alert('¡Visita finalizada! El reporte se guardó. (No se envió notificación porque el cliente no tiene un email registrado).');
            }
            
            handleCloseReportModal(); // Cierra el modal.
            fetchData(); // Recarga los datos para mostrar la visita como 'FINISHED'.

        } catch (err) {
            // Maneja errores tanto de nuestra API como de EmailJS.
            alert(`Ocurrió un error: ${err.response?.data?.message || err.text || err.message}`);
        }
    };

    // --- Helper para Renderizado de Badges ---
    /** Devuelve un componente Badge de Bootstrap con el color apropiado según el estado de la visita. */
    const getStatusBadge = (status) => {
        const variants = { PENDING: 'warning', IN_PROGRESS: 'primary', FINISHED: 'success', CANCELLED: 'secondary' };
        return <Badge bg={variants[status] || 'dark'}>{status}</Badge>;
    };

    // --- Renderizado del Componente ---
    return (
        // Protege la página, cualquier usuario logueado puede acceder, la lógica de qué ve cada uno está dentro.
        <ProtectedRoute>
            <h1>Historial de Visitas</h1>
            {/* Renderiza la barra de filtros, pasándole los estados y manejadores necesarios. */}
            <FilterBar filters={filters} setFilters={setFilters} onApply={handleApplyFilters} users={users} />
            
            {error && <Alert variant="danger">{error}</Alert>}
            {loading && <div className="text-center"><Spinner animation="border" /></div>}

            {/* Solo se renderiza el contenido principal cuando la carga ha terminado. */}
            {!loading && (
                // --- RENDERIZADO CONDICIONAL POR ROL ---
                user?.role === 'TECHNICIAN' ? (
                    // VISTA PARA EL TÉCNICO: Un listado de tarjetas interactivas.
                    <div>
                        {visits.length > 0 ? visits.map(visit => (
                            <Card key={visit.id} className="mb-3">
                                <Card.Header as="h5">Visita a: {visit.client_name}</Card.Header>
                                <Card.Body>
                                    <Card.Title>Estado: {getStatusBadge(visit.status)}</Card.Title>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item><strong>Dirección:</strong> {visit.address}</ListGroup.Item>
                                        <ListGroup.Item><strong>Planificado para:</strong> {new Date(visit.planned_at).toLocaleString()}</ListGroup.Item>
                                    </ListGroup>
                                </Card.Body>
                                <Card.Footer className="d-flex justify-content-between align-items-center flex-wrap">
                                    <Button variant="outline-primary" href={`https://www.google.com/maps/dir/?api=1&destination=${visit.lat},${visit.lng}`} target="_blank" className="mb-2 mb-md-0">
                                        Cómo Llegar
                                    </Button>
                                    <div>
                                        <Button variant="success" className="me-2" onClick={() => handleCheckIn(visit.id)} disabled={visit.status !== 'PENDING'}>Check-In</Button>
                                        <Button variant="danger" onClick={() => handleShowReportModal(visit)} disabled={visit.status !== 'IN_PROGRESS'}>Check-Out</Button>
                                    </div>
                                </Card.Footer>
                            </Card>
                        )) : <Alert variant="info">No se encontraron visitas con los filtros seleccionados.</Alert>}
                    </div>
                ) : (
                    // VISTA PARA ADMIN Y SUPERVISOR: Una tabla informativa.
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Cliente</th><th>Técnico</th><th>Supervisor</th><th>Fecha Planificada</th><th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visits.length > 0 ? visits.map(visit => (
                                <tr key={visit.id}>
                                    <td>{visit.client_name}</td>
                                    <td>{visit.technician_name}</td>
                                    <td>{visit.supervisor_name}</td>
                                    <td>{new Date(visit.planned_at).toLocaleString()}</td>
                                    <td>{getStatusBadge(visit.status)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center">No se encontraron visitas con los filtros seleccionados.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                )
            )}

            {/* El modal de reporte siempre está en el DOM, pero solo es visible cuando `showReportModal` es true. */}
            <Modal show={showReportModal} onHide={handleCloseReportModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Reporte de Visita - {selectedVisit?.client_name}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCheckOut}>
                    <Modal.Body>
                        <Form.Group className="mb-3"><Form.Label>Resumen del Trabajo</Form.Label><Form.Control as="textarea" rows={4} name="summary" value={reportData.summary} onChange={handleReportInputChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Minutos Invertidos</Form.Label><Form.Control type="number" name="minutes_spent" value={reportData.minutes_spent} onChange={handleReportInputChange} required /></Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseReportModal}>Cancelar</Button>
                        <Button variant="primary" type="submit">Finalizar y Enviar Reporte</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </ProtectedRoute>
    );
};

export default VisitsListPage;