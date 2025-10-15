// Ruta: /src/pages/clients.js

// --- Dependencias de React, Bootstrap y Componentes ---
import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import ProtectedRoute from "@/components/ProtectedRoute"; // Para proteger la página
import api from '@/services/api'; // Instancia de Axios para llamadas a la API
import MapPicker from '@/components/MapPicker'; // Componente para seleccionar ubicación en un mapa

// --- Definición del Componente de Página ---
const ClientsPage = () => {
    // --- Estados del Componente ---
    const [clients, setClients] = useState([]); // Almacena la lista de clientes de la API.
    const [loading, setLoading] = useState(true); // Controla la visibilidad del spinner.
    const [error, setError] = useState(''); // Almacena mensajes de error.
    
    // --- Estados para el Modal de Crear/Editar Cliente ---
    const [showModal, setShowModal] = useState(false); // Controla si el modal está visible.
    const [isEditing, setIsEditing] = useState(false); // `true` si el modal está en modo "Editar".
    const [currentClient, setCurrentClient] = useState(null); // Almacena los datos del cliente que se está editando.
    // 1. Estado para manejar los datos del formulario, incluyendo el nuevo campo 'email'.
    const [formData, setFormData] = useState({
        name: '', email: '', address: '', contact_name: '', phone: '', lat: '', lng: ''
    });

    /**
     * Obtiene la lista de todos los clientes desde el backend.
     */
    const fetchClients = async () => {
        try {
            setLoading(true); // Muestra el spinner.
            const { data } = await api.get('/clients');
            setClients(data); // Guarda la lista de clientes en el estado.
            setError(''); // Limpia cualquier error anterior.
        } catch (err) {
            // Si hay un error, lo guarda en el estado para mostrarlo al usuario.
            setError('No se pudieron cargar los clientes. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false); // Oculta el spinner.
        }
    };

    // `useEffect` con `[]` como dependencia se ejecuta solo una vez cuando el componente se monta.
    useEffect(() => { fetchClients(); }, []);

    /**
     * Actualiza el estado `formData` cada vez que el usuario escribe en un campo del formulario.
     */
    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    /**
     * Callback que se pasa al componente `MapPicker`. Se ejecuta cuando el usuario hace clic en el mapa.
     * @param {object} location - Un objeto con `{ lat, lng }`.
     */
    const handleMapSelect = (location) => {
        // Actualiza el estado del formulario con las nuevas coordenadas.
        setFormData(prev => ({ ...prev, lat: location.lat, lng: location.lng }));
    };

    /**

     * Prepara y muestra el modal para crear un nuevo cliente.
     */
    const handleShowCreateModal = () => {
        setIsEditing(false); // Pone el modal en modo "Crear".
        // Resetea el formulario a sus valores por defecto, incluyendo una ubicación inicial en el mapa.
        setFormData({ name: '', email: '', address: '', contact_name: '', phone: '', lat: 14.6349, lng: -90.5068 });
        setCurrentClient(null);
        setShowModal(true); // Muestra el modal.
    };
    
    /**
     * Prepara y muestra el modal para editar un cliente existente.
     * @param {object} client - El objeto del cliente que se va a editar.
     */
    const handleShowEditModal = (client) => {
        setIsEditing(true); // Pone el modal en modo "Editar".
        setCurrentClient(client); // Guarda el cliente actual.
        // Rellena el formulario con los datos del cliente seleccionado. El spread `...client` copia todas las propiedades.
        setFormData({ ...client });
        setShowModal(true); // Muestra el modal.
    };
    
    /** Cierra el modal. */
    const handleCloseModal = () => setShowModal(false);

    /**
     * Maneja el envío del formulario (tanto para crear como para editar).
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue.
        try {
            if (isEditing) {
                // Si está en modo edición, llama al endpoint PUT con el ID del cliente.
                await api.put(`/clients/${currentClient.id}`, formData);
            } else {
                // Si está en modo creación, llama al endpoint POST.
                await api.post('/clients', formData);
            }
            fetchClients(); // Vuelve a cargar la lista de clientes para ver los cambios.
            handleCloseModal(); // Cierra el modal.
        } catch (err) {
            setError('Error al guardar el cliente. ' + (err.response?.data?.message || err.message));
        }
    };

    /**
     * Maneja la eliminación de un cliente.
     * @param {number} id - El ID del cliente a eliminar.
     */
    const handleDelete = async (id) => {
        // Muestra una ventana de confirmación antes de proceder.
        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            try {
                await api.delete(`/clients/${id}`); // Llama al endpoint DELETE.
                fetchClients(); // Recarga la lista de clientes.
            } catch (err) {
                setError('Error al eliminar el cliente. ' + (err.response?.data?.message || err.message));
            }
        }
    };

    // --- Renderizado del Componente ---
    return (
        // Protege la página, permitiendo el acceso solo a usuarios con rol 'ADMIN' o 'SUPERVISOR'.
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
            <h1>Gestión de Clientes</h1>
            <Button variant="primary" onClick={handleShowCreateModal} className="mb-3">
                Crear Nuevo Cliente
            </Button>

            {/* Muestra alertas de error y el spinner de carga según el estado. */}
            {error && <Alert variant="danger">{error}</Alert>}
            {loading ? (
                <div className="text-center"><Spinner animation="border" /></div>
            ) : (
                // Cuando la carga termina, muestra la tabla de clientes.
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Contacto</th>
                            <th>Teléfono</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Itera sobre el array de clientes y crea una fila por cada uno. */}
                        {clients.map(client => (
                            <tr key={client.id}>
                                <td>{client.name}</td>
                                <td>{client.email}</td>
                                <td>{client.contact_name}</td>
                                <td>{client.phone}</td>
                                <td>
                                    {/* Botones de acción para cada cliente. */}
                                    <Button variant="info" size="sm" onClick={() => handleShowEditModal(client)}>Editar</Button>{' '}
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(client.id)}>Eliminar</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* --- Modal para Crear/Editar Cliente --- */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre del Cliente</Form.Label>
                            <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                        </Form.Group>
                        
                        {/* 2. Campo de Email para el cliente. */}
                        <Form.Group className="mb-3">
                            <Form.Label>Correo Electrónico del Cliente</Form.Label>
                            <Form.Control type="email" name="email" value={formData.email || ''} onChange={handleInputChange} required placeholder="ejemplo@correo.com" />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Nombre del Contacto</Form.Label>
                            <Form.Control type="text" name="contact_name" value={formData.contact_name} onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Teléfono</Form.Label>
                            <Form.Control type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Dirección</Form.Label>
                            <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleInputChange} />
                        </Form.Group>
                        <hr />
                        <p>Selecciona la ubicación en el mapa:</p>
                        {/* Componente del mapa. */}
                        <MapPicker 
                            onLocationSelect={handleMapSelect} // Pasa la función callback para recibir la ubicación.
                            // Pasa la posición inicial. Si estamos editando y el cliente ya tiene latitud, la usamos.
                            initialPosition={isEditing && formData.lat ? { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) } : null}
                        />
                        {/* Campos de latitud y longitud, solo lectura, se actualizan con el mapa. */}
                        <div className="d-flex mt-2">
                            <Form.Group className="flex-fill me-2"><Form.Label>Latitud</Form.Label><Form.Control type="number" name="lat" value={formData.lat} readOnly /></Form.Group>
                            <Form.Group className="flex-fill"><Form.Label>Longitud</Form.Label><Form.Control type="number" name="lng" value={formData.lng} readOnly /></Form.Group>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                        <Button variant="primary" type="submit">Guardar Cambios</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </ProtectedRoute>
    );
};

// Exporta el componente para que Next.js pueda renderizarlo como una página.
export default ClientsPage;