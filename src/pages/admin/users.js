// Ruta: /src/pages/admin/users.js

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/services/api';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Estado para el modal de crear/editar
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'TECHNICIAN', supervisor_id: null, is_active: true
    });
    
    // Lista de supervisores para el dropdown
    const [supervisors, setSupervisors] = useState([]);

    // --- Funciones de API ---

    const fetchUsers = async () => {
        try {
        setLoading(true);
        const { data } = await api.get('/users');
        setUsers(data);
        // Filtramos para obtener solo los supervisores y poblar el dropdown
        setSupervisors(data.filter(user => user.role === 'SUPERVISOR'));
        setError('');
        } catch (err) {
        setError('No se pudieron cargar los usuarios. ' + (err.response?.data?.message || err.message));
        } finally {
        setLoading(false);
        }
    };

    // Cargar usuarios al montar el componente
    useEffect(() => {
        fetchUsers();
    }, []);

    // --- Manejadores de Eventos del Modal y Formulario ---

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleShowCreateModal = () => {
        setIsEditing(false);
        setFormData({ name: '', email: '', password: '', role: 'TECHNICIAN', supervisor_id: null, is_active: true });
        setCurrentUser(null);
        setShowModal(true);
    };
    
    const handleShowEditModal = (user) => {
        setIsEditing(true);
        setCurrentUser(user);
        // No incluimos el password al editar
        setFormData({ 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            supervisor_id: user.supervisor_id || '', 
            is_active: user.is_active 
        });
        setShowModal(true);
    };
    
    const handleCloseModal = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Limpiamos el supervisor_id si el rol no es Técnico
        const payload = {
            ...formData,
            supervisor_id: formData.role === 'TECHNICIAN' ? formData.supervisor_id : null
        };

        try {
        if (isEditing) {
            await api.put(`/users/${currentUser.id}`, payload);
        } else {
            await api.post('/users', payload);
        }
        fetchUsers();
        handleCloseModal();
        } catch (err) {
        setError('Error al guardar el usuario. ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            setError('Error al eliminar el usuario. ' + (err.response?.data?.message || err.message));
        }
        }
    };
    
    // --- Renderizado del Componente ---

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
        <h1>Gestión de Usuarios</h1>
        <Button variant="primary" onClick={handleShowCreateModal} className="mb-3">
            Crear Nuevo Usuario
        </Button>

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        
        {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
        ) : (
            <Table striped bordered hover responsive>
            <thead>
                <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {users.map(user => (
                <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td><Badge bg="info">{user.role}</Badge></td>
                    <td>
                    <Badge bg={user.is_active ? 'success' : 'secondary'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    </td>
                    <td>
                    <Button variant="warning" size="sm" onClick={() => handleShowEditModal(user)}>Editar</Button>{' '}
                    <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>Eliminar</Button>
                    </td>
                </tr>
                ))}
            </tbody>
            </Table>
        )}

        {/* Modal para Crear/Editar Usuario */}
        <Modal show={showModal} onHide={handleCloseModal} centered>
            <Modal.Header closeButton>
            <Modal.Title>{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
            <Modal.Body>
                <Form.Group className="mb-3">
                <Form.Label>Nombre Completo</Form.Label>
                <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </Form.Group>
                
                {/* El campo de contraseña solo es obligatorio al crear */}
                {!isEditing && (
                <Form.Group className="mb-3">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                </Form.Group>
                )}

                <Form.Group className="mb-3">
                <Form.Label>Rol</Form.Label>
                <Form.Select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="ADMIN">Administrador</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="TECHNICIAN">Técnico</option>
                </Form.Select>
                </Form.Group>

                {/* El campo de supervisor solo aparece si el rol es 'Técnico' */}
                {formData.role === 'TECHNICIAN' && (
                    <Form.Group className="mb-3">
                        <Form.Label>Asignar a Supervisor</Form.Label>
                        <Form.Select name="supervisor_id" value={formData.supervisor_id || ''} onChange={handleInputChange}>
                            <option value="">-- Ninguno --</option>
                            {supervisors.map(sup => (
                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                )}

                {/* El switch de estado solo aparece al editar */}
                {isEditing && (
                    <Form.Group>
                        <Form.Check 
                            type="switch"
                            id="is_active-switch"
                            label="Usuario Activo"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                        />
                    </Form.Group>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                <Button variant="primary" type="submit">Guardar</Button>
            </Modal.Footer>
            </Form>
        </Modal>
        </ProtectedRoute>
    );
};

export default AdminUsersPage;