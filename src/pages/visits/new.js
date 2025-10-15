// Ruta: /frontend/src/pages/visits/new.js

// --- Dependencias de React y Componentes ---
import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/ProtectedRoute"; // Componente para proteger la ruta
import api from '@/services/api'; // Instancia de Axios para llamadas al backend
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap'; // Componentes de UI
import { useAuth } from '@/context/AuthContext'; // 1. Importamos useAuth para saber qué usuario está logueado

// --- Definición del Componente de Página ---
const NewVisitPage = () => {
    // 2. Obtenemos el objeto del usuario y su rol desde el contexto de autenticación.
    const { user } = useAuth();
    
    // --- Estados del Componente ---
    // 3. Estado para manejar los datos del formulario. Incluye `supervisor_id` para cuando un admin crea la visita.
    const [formData, setFormData] = useState({ client_id: '', technician_id: '', planned_at: '', supervisor_id: '' });
    
    // Estados para almacenar las listas que poblarán los menús desplegables del formulario.
    const [clients, setClients] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [supervisors, setSupervisors] = useState([]); // 4. Nuevo estado para guardar la lista de supervisores.
    
    // Estados para controlar la UI (carga, errores, éxito).
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // `useEffect` para cargar los datos iniciales (clientes, técnicos, supervisores) cuando el componente se monta.
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Usamos `Promise.all` para hacer las dos llamadas a la API de forma concurrente,
                // lo cual es más eficiente que hacerlas una después de la otra.
                const [clientsRes, usersRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/users') // Obtenemos la lista completa de usuarios para poder filtrarlos en el frontend.
                ]);
                
                // Guardamos la lista de clientes.
                setClients(clientsRes.data);
                // Filtramos la lista de usuarios para obtener solo los técnicos y los supervisores.
                setTechnicians(usersRes.data.filter(u => u.role === 'TECHNICIAN'));
                setSupervisors(usersRes.data.filter(u => u.role === 'SUPERVISOR')); // 5. Llenamos la lista de supervisores.
                
                setError(''); // Limpiamos cualquier error previo.
            } catch (err) {
                // Si alguna de las llamadas a la API falla, capturamos el error.
                setError('No se pudieron cargar los datos necesarios. ' + (err.response?.data?.message || err.message));
            } finally {
                // Este bloque se ejecuta siempre, haya habido éxito o error.
                setLoading(false); // Ocultamos el spinner.
            }
        };
        fetchData();
    }, []); // El array de dependencias vacío `[]` asegura que este efecto se ejecute solo una vez.

    /**
     * Manejador que actualiza el estado `formData` cada vez que cambia un campo del formulario.
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Manejador para el envío del formulario.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue.
        // Limpia los mensajes de éxito y error antes de un nuevo envío.
        setSuccess('');
        setError('');
        try {
            // Envía los datos del formulario al endpoint de creación de visitas en el backend.
            await api.post('/visits', formData);
            setSuccess('¡Visita creada y asignada con éxito!');
            // Limpiamos el formulario después de un envío exitoso para permitir crear otra visita fácilmente.
            setFormData({ client_id: '', technician_id: '', planned_at: '', supervisor_id: '' });
        } catch (err) {
            // Si el backend devuelve un error, lo mostramos en la alerta.
            setError('Error al crear la visita. ' + (err.response?.data?.message || err.message));
        }
    };

    // Muestra un spinner de carga mientras se obtienen los datos iniciales.
    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
                <div className="text-center"><Spinner animation="border" /></div>
            </ProtectedRoute>
        );
    }

    // --- Renderizado Principal del Componente ---
    return (
        // 6. Protege la página, permitiendo el acceso solo a 'ADMIN' y 'SUPERVISOR'.
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
            <Card>
                <Card.Header as="h5">Planificar Nueva Visita</Card.Header>
                <Card.Body>
                    {/* Muestra alertas de error o éxito según el estado. */}
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        {/* --- RENDERIZADO CONDICIONAL POR ROL --- */}
                        {/* 7. ¡LA MAGIA! Este campo de formulario solo se renderiza si el rol del usuario logueado es 'ADMIN'.
                            Un SUPERVISOR no verá este campo, y el backend asignará automáticamente su propio ID. */}
                        {user?.role === 'ADMIN' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Asignar a Supervisor</Form.Label>
                                <Form.Select name="supervisor_id" value={formData.supervisor_id} onChange={handleInputChange} required>
                                    <option value="">-- Elige un supervisor --</option>
                                    {/* Itera sobre la lista de supervisores para crear las opciones del menú. */}
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
                                {/* Itera sobre la lista de clientes para crear las opciones. */}
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Asignar a Técnico</Form.Label>
                            <Form.Select name="technician_id" value={formData.technician_id} onChange={handleInputChange} required>
                                <option value="">-- Elige un técnico --</option>
                                {/* Itera sobre la lista de técnicos para crear las opciones. */}
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

// Exporta el componente para que Next.js lo pueda renderizar como una página.
export default NewVisitPage;