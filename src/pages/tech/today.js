// Ruta: /src/pages/tech/today.js

import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/services/api';
import { Card, Button, Spinner, Alert, ListGroup, Modal, Form } from 'react-bootstrap';

const TechTodayPage = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Estado para el modal de reporte (check-out)
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
        setError('No se pudieron cargar las visitas de hoy. ' + (err.response?.data?.message || err.message));
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayVisits();
    }, []);

    const handleGetLocation = () => {
        return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('La geolocalización no está soportada por tu navegador.'));
        } else {
            navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }),
            () => reject(new Error('No se pudo obtener la ubicación.'))
            );
        }
        });
    };

    const handleCheckIn = async (visitId) => {
        try {
        const location = await handleGetLocation();
        await api.post(`/visits/${visitId}/checkin`, location);
        alert('Check-in realizado con éxito.');
        fetchTodayVisits(); // Recargar
        } catch (err) {
        alert('Error en el Check-in: ' + err.message);
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
        try {
        const location = await handleGetLocation();
        const payload = { ...reportData, ...location };
        await api.post(`/visits/${selectedVisit.id}/checkout`, payload);
        alert('Check-out y reporte enviados con éxito.');
        handleCloseReportModal();
        fetchTodayVisits(); // Recargar
        } catch (err) {
        alert('Error en el Check-out: ' + err.message);
        }
    };

    if (loading) return <ProtectedRoute allowedRoles={['TECHNICIAN']}><div className="text-center"><Spinner animation="border" /></div></ProtectedRoute>;

    return (
        <ProtectedRoute allowedRoles={['TECHNICIAN']}>
        <h1>Mis Visitas de Hoy</h1>
        {error && <Alert variant="danger">{error}</Alert>}
        {!visits.length && !loading && <Alert variant="info">No tienes visitas asignadas para hoy.</Alert>}

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
            <Card.Footer className="d-flex justify-content-between">
                <Button variant="outline-primary" href={`https://www.google.com/maps/dir/?api=1&destination=${visit.lat},${visit.lng}`} target="_blank">
                Cómo Llegar
                </Button>
                <div>
                <Button 
                    variant="success" 
                    className="me-2"
                    onClick={() => handleCheckIn(visit.id)}
                    disabled={visit.status !== 'PENDING'}
                >
                    Check-In
                </Button>
                <Button 
                    variant="danger"
                    onClick={() => handleShowReportModal(visit)}
                    disabled={visit.status !== 'IN_PROGRESS'}
                >
                    Check-Out
                </Button>
                </div>
            </Card.Footer>
            </Card>
        ))}

        {/* Modal para Reporte de Check-out */}
        <Modal show={showReportModal} onHide={handleCloseReportModal}>
            <Modal.Header closeButton>
            <Modal.Title>Reporte de Visita - {selectedVisit?.client_name}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleCheckOut}>
            <Modal.Body>
                <Form.Group className="mb-3">
                <Form.Label>Resumen del Trabajo Realizado</Form.Label>
                <Form.Control as="textarea" rows={4} name="summary" value={reportData.summary} onChange={handleReportInputChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                <Form.Label>Minutos Invertidos</Form.Label>
                <Form.Control type="number" name="minutes_spent" value={reportData.minutes_spent} onChange={handleReportInputChange} required />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseReportModal}>Cancelar</Button>
                <Button variant="primary" type="submit">Finalizar Visita y Enviar Reporte</Button>
            </Modal.Footer>
            </Form>
        </Modal>

        </ProtectedRoute>
    );
};

export default TechTodayPage;