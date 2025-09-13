// Ruta: /src/pages/clients.js

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/services/api';
import MapPicker from '@/components/MapPicker';

const ClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Estado para el modal
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentClient, setCurrentClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '', address: '', contact_name: '', phone: '', lat: '', lng: ''
    });

    const fetchClients = async () => {
        try {
        setLoading(true);
        const { data } = await api.get('/clients');
        setClients(data);
        setError('');
        } catch (err) {
        setError('No se pudieron cargar los clientes. ' + (err.response?.data?.message || err.message));
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMapSelect = (location) => {
        setFormData(prev => ({ ...prev, lat: location.lat, lng: location.lng }));
    };

    const handleShowCreateModal = () => {
        setIsEditing(false);
        setFormData({ name: '', address: '', contact_name: '', phone: '', lat: 14.6349, lng: -90.5068 });
        setCurrentClient(null);
        setShowModal(true);
    };
    
    const handleShowEditModal = (client) => {
        setIsEditing(true);
        setCurrentClient(client);
        setFormData({ ...client });
        setShowModal(true);
    };
    
    const handleCloseModal = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        if (isEditing) {
            await api.put(`/clients/${currentClient.id}`, formData);
        } else {
            await api.post('/clients', formData);
        }
        fetchClients(); // Recargar la lista de clientes
        handleCloseModal();
        } catch (err) {
        setError('Error al guardar el cliente. ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
        try {
            await api.delete(`/clients/${id}`);
            fetchClients();
        } catch (err) {
            setError('Error al eliminar el cliente. ' + (err.response?.data?.message || err.message));
        }
        }
    };

    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
        <h1>Gestión de Clientes</h1>
        <Button variant="primary" onClick={handleShowCreateModal} className="mb-3">
            Crear Nuevo Cliente
        </Button>

        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
        ) : (
            <Table striped bordered hover responsive>
            <thead>
                <tr>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {clients.map(client => (
                <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.contact_name}</td>
                    <td>{client.phone}</td>
                    <td>{client.address}</td>
                    <td>
                    <Button variant="info" size="sm" onClick={() => handleShowEditModal(client)}>Editar</Button>{' '}
                    <Button variant="danger" size="sm" onClick={() => handleDelete(client.id)}>Eliminar</Button>
                    </td>
                </tr>
                ))}
            </tbody>
            </Table>
        )}

        {/* Modal para Crear/Editar */}
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
                <MapPicker 
                onLocationSelect={handleMapSelect} 
                initialPosition={isEditing ? { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) } : null}
                />
                <div className="d-flex mt-2">
                <Form.Group className="flex-fill me-2">
                    <Form.Label>Latitud</Form.Label>
                    <Form.Control type="number" name="lat" value={formData.lat} readOnly />
                </Form.Group>
                <Form.Group className="flex-fill">
                    <Form.Label>Longitud</Form.Label>
                    <Form.Control type="number" name="lng" value={formData.lng} readOnly />
                </Form.Group>
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

export default ClientsPage;