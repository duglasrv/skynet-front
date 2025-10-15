// Ruta: /src/pages/tech/today.js

// --- Dependencias de React y Bootstrap ---
import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute"; // Componente para proteger la ruta
import api from '@/services/api'; // Instancia de Axios para llamadas al backend
import { Card, Button, Spinner, Alert, ListGroup, Modal, Form } from 'react-bootstrap'; // Componentes de UI

// --- Definición del Componente de Página ---
const TechTodayPage = () => {
    // --- Estados del Componente ---
    const [visits, setVisits] = useState([]); // Almacena la lista de visitas del día del técnico.
    const [loading, setLoading] = useState(true); // Controla la visibilidad del spinner de carga.
    const [error, setError] = useState(''); // Almacena mensajes de error para mostrarlos en una alerta.

    // --- Estados para el Modal de Reporte (Check-out) ---
    const [showReportModal, setShowReportModal] = useState(false); // Controla si el modal está visible.
    const [selectedVisit, setSelectedVisit] = useState(null); // Almacena la visita para la cual se está haciendo el check-out.
    const [reportData, setReportData] = useState({ summary: '', minutes_spent: '' }); // Almacena los datos del formulario del reporte.

    /**
     * Obtiene las visitas asignadas para el día de hoy para el técnico logueado.
     */
    const fetchTodayVisits = async () => {
        try {
            setLoading(true); // Activa el spinner.
            // NOTA: Se asume que el backend tiene un endpoint `/visits/today` que devuelve las visitas del técnico actual.
            const { data } = await api.get('/visits/today');
            setVisits(data); // Guarda las visitas en el estado.
            setError(''); // Limpia cualquier error previo.
        } catch (err) {
            // Si la llamada falla, se guarda el mensaje de error.
            setError('No se pudieron cargar las visitas de hoy. ' + (err.response?.data?.message || err.message));
        } finally {
            // Se ejecuta siempre, con o sin error.
            setLoading(false); // Oculta el spinner.
        }
    };

    // `useEffect` con `[]` como dependencia se ejecuta solo una vez cuando el componente se monta.
    useEffect(() => {
        fetchTodayVisits();
    }, []);

    /**
     * Obtiene la geolocalización actual del usuario usando la API del navegador.
     * @returns {Promise<{lat: number, lng: number}>} Una promesa que se resuelve con las coordenadas.
     */
    const handleGetLocation = () => {
        return new Promise((resolve, reject) => {
            // Verifica si el navegador soporta la geolocalización.
            if (!navigator.geolocation) {
                reject(new Error('La geolocalización no está soportada por tu navegador.'));
            } else {
                // Pide la posición actual. Esto puede hacer que el navegador pida permiso al usuario.
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({ // Caso de éxito: resuelve la promesa con las coordenadas.
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }),
                    () => reject(new Error('No se pudo obtener la ubicación.')) // Caso de error.
                );
            }
        });
    };

    /**
     * Maneja la lógica del check-in para una visita.
     * @param {number} visitId - El ID de la visita.
     */
    const handleCheckIn = async (visitId) => {
        try {
            const location = await handleGetLocation(); // Espera a obtener la ubicación.
            // Envía la ubicación al endpoint de check-in del backend.
            await api.post(`/visits/${visitId}/checkin`, location);
            alert('Check-in realizado con éxito.'); // Notifica al usuario.
            fetchTodayVisits(); // Vuelve a cargar las visitas para actualizar su estado en la UI.
        } catch (err) {
            alert('Error en el Check-in: ' + err.message); // Muestra el error.
        }
    };

    /**
     * Abre el modal de reporte para una visita específica.
     * @param {object} visit - El objeto de la visita seleccionada.
     */
    const handleShowReportModal = (visit) => {
        setSelectedVisit(visit); // Guarda la visita seleccionada en el estado.
        setShowReportModal(true); // Muestra el modal.
    };
    
    /** Cierra el modal de reporte y resetea los estados relacionados. */
    const handleCloseReportModal = () => {
        setShowReportModal(false);
        setSelectedVisit(null);
        setReportData({ summary: '', minutes_spent: '' }); // Limpia el formulario.
    };
    
    /**
     * Actualiza el estado `reportData` cada vez que el usuario escribe en el formulario del modal.
     */
    const handleReportInputChange = (e) => {
        const { name, value } = e.target;
        setReportData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Maneja la lógica del check-out y el envío del reporte.
     */
    const handleCheckOut = async (e) => {
        e.preventDefault(); // Evita que el formulario recargue la página.
        try {
            const location = await handleGetLocation(); // Obtiene la ubicación del check-out.
            // Combina los datos del formulario del reporte con la ubicación.
            const payload = { ...reportData, ...location };
            // Envía todo al endpoint de check-out del backend.
            await api.post(`/visits/${selectedVisit.id}/checkout`, payload);
            alert('Check-out y reporte enviados con éxito.');
            handleCloseReportModal(); // Cierra el modal.
            fetchTodayVisits(); // Recarga las visitas para reflejar el estado "FINISHED".
        } catch (err) {
            alert('Error en el Check-out: ' + err.message);
        }
    };

    // Renderizado de "Cargando..." mientras se obtienen los datos.
    // Se envuelve en ProtectedRoute para que el spinner solo se muestre si el usuario tiene permiso.
    if (loading) return <ProtectedRoute allowedRoles={['TECHNICIAN']}><div className="text-center"><Spinner animation="border" /></div></ProtectedRoute>;

    // --- Renderizado Principal del Componente ---
    return (
        <ProtectedRoute allowedRoles={['TECHNICIAN']}>
            <h1>Mis Visitas de Hoy</h1>
            {/* Muestra alertas de error o informativas. */}
            {error && <Alert variant="danger">{error}</Alert>}
            {!visits.length && !loading && <Alert variant="info">No tienes visitas asignadas para hoy.</Alert>}

            {/* Itera sobre la lista de visitas y renderiza una tarjeta (Card) por cada una. */}
            {visits.map(visit => (
                <Card key={visit.id} className="mb-3">
                    <Card.Header as="h5">Visita a: {visit.client_name}</Card.Header>
                    <Card.Body>
                        {/* El color del estado cambia dinámicamente. */}
                        <Card.Title>Estado: <span className={`fw-bold text-${visit.status === 'PENDING' ? 'warning' : visit.status === 'IN_PROGRESS' ? 'primary' : 'success'}`}>{visit.status}</span></Card.Title>
                        <ListGroup variant="flush">
                            <ListGroup.Item><strong>Dirección:</strong> {visit.address}</ListGroup.Item>
                            <ListGroup.Item><strong>Planificado para:</strong> {new Date(visit.planned_at).toLocaleString()}</ListGroup.Item>
                        </ListGroup>
                    </Card.Body>
                    <Card.Footer className="d-flex justify-content-between">
                        {/* Botón que abre Google Maps con la dirección del cliente como destino. */}
                        <Button variant="outline-primary" href={`https://www.google.com/maps/dir/?api=1&destination=${visit.lat},${visit.lng}`} target="_blank">
                            Cómo Llegar
                        </Button>
                        <div>
                            {/* Botón de Check-In: se deshabilita si la visita no está 'PENDING'. */}
                            <Button 
                                variant="success" 
                                className="me-2"
                                onClick={() => handleCheckIn(visit.id)}
                                disabled={visit.status !== 'PENDING'}
                            >
                                Check-In
                            </Button>
                            {/* Botón de Check-Out: se deshabilita si la visita no está 'IN_PROGRESS'. */}
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

            {/* --- Modal para Reporte de Check-out --- */}
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