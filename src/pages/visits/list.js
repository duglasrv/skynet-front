// Ruta: /frontend/src/pages/visits/list.js

import { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Badge, Card, ListGroup, Button, Modal, Form } from 'react-bootstrap';
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/services/api';
import FilterBar from '@/components/FilterBar';
import { useAuth } from '@/context/AuthContext';
import emailjs from '@emailjs/browser';

const VisitsListPage = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState([]);
    const [users, setUsers] = useState([]); // Para poblar los filtros de Admin/Supervisor
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({});

    // --- State para la funcionalidad del Técnico ---
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [reportData, setReportData] = useState({ summary: '', minutes_spent: '' });

    // --- Funciones de Datos ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters).toString();
            // La API ya restringe los datos por rol, así que esta llamada es segura para todos
            const visitsRes = await api.get(`/visits?${queryParams}`);
            setVisits(visitsRes.data);

            // Solo obtenemos la lista completa de usuarios si es un rol de gestión
            if (user && (user.role === 'ADMIN' || user.role === 'SUPERVISOR')) {
                const usersRes = await api.get('/users');
                setUsers(usersRes.data);
            }
            setError('');
        } catch (err) {
            setError('No se pudieron cargar las visitas. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData(); // Cargar datos solo cuando el usuario esté disponible
    }, [user]);

    const handleApplyFilters = (e) => {
        e.preventDefault();
        fetchData();
    };

    // --- Handlers para la funcionalidad del Técnico ---
    const handleGetLocation = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocalización no soportada.'));
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => reject(new Error('No se pudo obtener la ubicación.'))
        );
    });

    const handleCheckIn = async (visitId) => {
        try {
            const location = await handleGetLocation();
            await api.post(`/visits/${visitId}/checkin`, location);
            alert('Check-in realizado con éxito.');
            fetchData(); // Recargar la lista para mostrar el nuevo estado
        } catch (err) {
            alert('Error en Check-in: ' + err.message);
        }
    };

    const handleShowReportModal = (visit) => {
        setSelectedVisit(visit);
        setShowReportModal(true);
    };

    const handleCloseReportModal = () => {
        setShowReportModal(false);
        setSelectedVisit(null);
        setReportData({ summary: '', minutes_spent: '' });
    };

    const handleReportInputChange = (e) => {
        const { name, value } = e.target;
        setReportData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckOut = async (e) => {
        e.preventDefault();
        if (!selectedVisit) return;
        let emailSent = false;
        //console.log("Datos de la visita ANTES de enviar correo:", selectedVisit);
        try {
            // Paso 1: Guardar en nuestra base de datos (esto siempre se hace)
            const location = await handleGetLocation();
            await api.post(`/visits/${selectedVisit.id}/checkout`, { ...reportData, ...location });

            // Paso 2: Intentar enviar correo SOLO SI el cliente tiene un email registrado
            if (selectedVisit.client_email) {
                const templateParams = {
                    client_name: selectedVisit.client_name,
                    client_email: selectedVisit.client_email,
                    technician_name: user.name,
                    visit_date: new Date(selectedVisit.planned_at).toLocaleDateString(),
                    minutes_spent: reportData.minutes_spent,
                    summary: reportData.summary
                };
                await emailjs.send(
                    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
                    templateParams,
                    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
                );
                emailSent = true;
            }
            
            // Paso 3: Mostrar el mensaje de éxito correcto
            if (emailSent) {
                alert('¡Visita finalizada! El reporte se guardó y se notificó al cliente.');
            } else {
                alert('¡Visita finalizada! El reporte se guardó. (No se envió notificación porque el cliente no tiene un email registrado).');
            }
            
            handleCloseReportModal();
            fetchData();

        } catch (err) {
            alert(`Ocurrió un error: ${err.response?.data?.message || err.text || err.message}`);
        }
    };
    // --- Renderizado Condicional ---
    
    const getStatusBadge = (status) => {
        const variants = { PENDING: 'warning', IN_PROGRESS: 'primary', FINISHED: 'success', CANCELLED: 'secondary' };
        return <Badge bg={variants[status] || 'dark'}>{status}</Badge>;
    };

    return (
        <ProtectedRoute>
            <h1>Historial de Visitas</h1>
            <FilterBar filters={filters} setFilters={setFilters} onApply={handleApplyFilters} users={users} />
            
            {error && <Alert variant="danger">{error}</Alert>}
            {loading && <div className="text-center"><Spinner animation="border" /></div>}

            {!loading && (
                // Lógica principal de renderizado condicional
                user?.role === 'TECHNICIAN' ? (
                    // VISTA PARA EL TÉCNICO (Tarjetas Interactivas)
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
                    // VISTA PARA ADMIN Y SUPERVISOR (Tabla Informativa)
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

            {/* El modal de reporte está disponible para el técnico */}
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