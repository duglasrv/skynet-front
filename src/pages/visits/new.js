// Ruta: /src/pages/visits/new.js

import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/services/api';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/router';

const NewVisitPage = () => {
    const [formData, setFormData] = useState({ client_id: '', technician_id: '', planned_at: '' });
    const [clients, setClients] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
        try {
            setLoading(true);
            // Hacemos ambas peticiones en paralelo para más eficiencia
            const [clientsRes, usersRes] = await Promise.all([
            api.get('/clients'),
            api.get('/users')
            ]);
            setClients(clientsRes.data);
            // Filtramos los usuarios para quedarnos solo con los técnicos
            setTechnicians(usersRes.data.filter(user => user.role === 'TECHNICIAN'));
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
        // Opcional: redirigir a una página de listado de visitas
        // router.push('/visits'); 
        } catch (err) {
        setError('Error al crear la visita. ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return (
        <ProtectedRoute allowedRoles={['SUPERVISOR']}>
            <div className="text-center"><Spinner animation="border" /></div>
        </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['SUPERVISOR']}>
        <Card>
            <Card.Header as="h5">Planificar Nueva Visita</Card.Header>
            <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            <Form onSubmit={handleSubmit}>
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