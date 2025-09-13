// Ruta: /src/pages/tech/today.js

import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/services/api';
import { Card, Button, Spinner, Alert, ListGroup, Modal, Form } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import emailjs from '@emailjs/browser'; // <-- 1. Importar EmailJS

const TechTodayPage = () => {
    const { user } = useAuth(); // <-- 2. Obtener el usuario (técnico) del contexto
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [reportData, setReportData] = useState({ summary: '', minutes_spent: '' });

    const fetchTodayVisits = async () => {
        try {
        setLoading(true);
        const { data } = await api.get('/visits/today');
        setVisits(data);
        setError('');
        } catch (err) {
        setError('No se pudieron cargar las visitas. ' + (err.response?.data?.message || err.message));
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => { fetchTodayVisits(); }, []);

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
        fetchTodayVisits();
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

    // --- 3. Lógica de Check-out MEJORADA ---
    const handleCheckOut = async (e) => {
        e.preventDefault();
        if (!selectedVisit) return;

        try {
        // --- PASO A: Guardar en nuestra base de datos ---
        const location = await handleGetLocation();
        const payload = { ...reportData, ...location };
        await api.post(`/visits/${selectedVisit.id}/checkout`, payload);
        
        // --- PASO B: Preparar y enviar el correo con EmailJS ---
        const templateParams = {
            client_name: selectedVisit.client_name,
            client_email: selectedVisit.client_email, // ¡Gracias al ajuste del backend!
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
        
        alert('¡Visita finalizada! El reporte se guardó y se envió la notificación al cliente.');
        handleCloseReportModal();
        fetchTodayVisits();

        } catch (err) {
        // Manejo de errores más detallado
        const apiError = err.response?.data?.message;
        const emailError = err.text;
        const genericError = err.message;
        alert(`Ocurrió un error: ${apiError || emailError || genericError}`);
        }
    };

    if (loading) return <ProtectedRoute allowedRoles={['TECHNICIAN']}><div className="text-center"><Spinner animation="border" /></div></ProtectedRoute>;

    return (
        <ProtectedRoute allowedRoles={['TECHNICIAN']}>
        <h1>Mis Visitas de Hoy</h1>
        {error && <Alert variant="danger">{error}</Alert>}
        {!visits.length && !loading && <Alert variant="info">No tienes visitas para hoy.</Alert>}

        {visits.map(visit => (
            <Card key={visit.id} className="mb-3">
                <Card.Header as="h5">Visita a: {visit.client_name}</Card.Header>
                <Card.Body>
                    <Card.Title>Estado: <span className={`fw-bold text-${visit.status === 'PENDING' ? 'warning' : visit.status === 'IN_PROGRESS' ? 'primary' : 'success'}`}>{visit.status}</span></Card.Title>
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
        ))}

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

export default TechTodayPage;