// Ruta: /frontend/src/pages/visits/new.js

import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/services/api';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext'; // 1. Importamos useAuth para saber qué usuario está logueado

const NewVisitPage = () => {
    const { user } = useAuth(); // 2. Obtenemos el usuario y su rol del contexto
    
    // 3. Añadimos 'supervisor_id' al estado del formulario
    const [formData, setFormData] = useState({ client_id: '', technician_id: '', planned_at: '', supervisor_id: '' });
    
    const [clients, setClients] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [supervisors, setSupervisors] = useState([]); // 4. Nuevo estado para guardar la lista de supervisores
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [clientsRes, usersRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/users') // Obtenemos todos los usuarios para poder filtrar
                ]);
                
                setClients(clientsRes.data);
                setTechnicians(usersRes.data.filter(u => u.role === 'TECHNICIAN'));
                setSupervisors(usersRes.data.filter(u => u.role === 'SUPERVISOR')); // 5. Llenamos la lista de supervisores
                
                setError('');
            } catch (err) {
                setError('No se pudieron cargar los datos necesarios. ' + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');
        try {
            await api.post('/visits', formData);
            setSuccess('¡Visita creada y asignada con éxito!');
            // Limpiamos el formulario para que puedan crear otra visita si quieren
            setFormData({ client_id: '', technician_id: '', planned_at: '', supervisor_id: '' });
        } catch (err) {
            setError('Error al crear la visita. ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
                <div className="text-center"><Spinner animation="border" /></div>
            </ProtectedRoute>
        );
    }

    return (
        // 6. Permitimos el acceso tanto a ADMIN como a SUPERVISOR
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
            <Card>
                <Card.Header as="h5">Planificar Nueva Visita</Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        {/* 7. ¡LA MAGIA! Este campo solo se renderiza si el usuario es un Administrador */}
                        {user?.role === 'ADMIN' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Asignar a Supervisor</Form.Label>
                                <Form.Select name="supervisor_id" value={formData.supervisor_id} onChange={handleInputChange} required>
                                    <option value="">-- Elige un supervisor --</option>
                                    {supervisors.map(sup => (
                                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Seleccionar Cliente</Form.Label>
                            <Form.Select name="client_id" value={formData.client_id} onChange={handleInputChange} required>
                                <option value="">-- Elige un cliente --</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Asignar a Técnico</Form.Label>
                            <Form.Select name="technician_id" value={formData.technician_id} onChange={handleInputChange} required>
                                <option value="">-- Elige un técnico --</option>
                                {technicians.map(tech => (
                                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Fecha y Hora Planificada</Form.Label>
                            <Form.Control type="datetime-local" name="planned_at" value={formData.planned_at} onChange={handleInputChange} required />
                        </Form.Group>

                        <Button variant="primary" type="submit">Crear Visita</Button>
                    </Form>
                </Card.Body>
            </Card>
        </ProtectedRoute>
    );
};

export default NewVisitPage;