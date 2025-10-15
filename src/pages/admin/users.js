// Ruta: /src/pages/admin/users.js

// --- Dependencias de React y Bootstrap ---
import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
// Importa el componente de ruta protegida para restringir el acceso a esta página.
import ProtectedRoute from "@/components/ProtectedRoute";
// Importa la instancia de Axios preconfigurada para las llamadas a la API.
import api from '@/services/api';

// --- Definición del Componente de Página ---
const AdminUsersPage = () => {
    // --- Estados del Componente ---
    const [users, setUsers] = useState([]); // Almacena la lista de todos los usuarios traídos de la API.
    const [loading, setLoading] = useState(true); // Controla la visibilidad del spinner de carga.
    const [error, setError] = useState(''); // Almacena mensajes de error para mostrarlos en una alerta.
    
    // --- Estados para el Modal de Crear/Editar ---
    const [showModal, setShowModal] = useState(false); // Controla si el modal está visible o no.
    const [isEditing, setIsEditing] = useState(false); // `true` si el modal está en modo "Editar", `false` si está en modo "Crear".
    const [currentUser, setCurrentUser] = useState(null); // Almacena los datos del usuario que se está editando.
    // Estado para manejar los datos del formulario de creación/edición de usuario.
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'TECHNICIAN', supervisor_id: null, is_active: true
    });
    
    // Estado para almacenar la lista de supervisores, usada para poblar el menú desplegable en el formulario.
    const [supervisors, setSupervisors] = useState([]);

    // --- Funciones de Interacción con la API ---

    /**
     * Obtiene la lista completa de usuarios desde el backend.
     */
    const fetchUsers = async () => {
        try {
            setLoading(true); // Muestra el spinner.
            const { data } = await api.get('/users'); // Llama al endpoint de la API.
            setUsers(data); // Guarda la lista de usuarios en el estado.
            // Filtra la lista de usuarios para obtener solo aquellos con rol 'SUPERVISOR' y los guarda en su propio estado.
            setSupervisors(data.filter(user => user.role === 'SUPERVISOR'));
            setError(''); // Limpia cualquier error anterior.
        } catch (err) {
            // Si hay un error, lo guarda en el estado para mostrarlo al usuario.
            setError('No se pudieron cargar los usuarios. ' + (err.response?.data?.message || err.message));
        } finally {
            // Se ejecuta siempre, tanto si hubo éxito como si hubo error.
            setLoading(false); // Oculta el spinner.
        }
    };

    // `useEffect` con un array de dependencias vacío `[]`.
    // Esto hace que la función `fetchUsers` se ejecute solo una vez, cuando el componente se monta por primera vez.
    useEffect(() => {
        fetchUsers();
    }, []);

    // --- Manejadores de Eventos del Modal y Formulario ---

    /**
     * Actualiza el estado `formData` cada vez que el usuario escribe en un campo del formulario.
     */
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Actualiza el estado previo, modificando dinámicamente el campo (`name`) que cambió.
        // Maneja tanto inputs de texto como checkboxes.
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    /**
     * Prepara y muestra el modal para crear un nuevo usuario.
     */
    const handleShowCreateModal = () => {
        setIsEditing(false); // Pone el modal en modo "Crear".
        // Resetea el formulario a sus valores por defecto.
        setFormData({ name: '', email: '', password: '', role: 'TECHNICIAN', supervisor_id: null, is_active: true });
        setCurrentUser(null);
        setShowModal(true); // Muestra el modal.
    };
    
    /**
     * Prepara y muestra el modal para editar un usuario existente.
     * @param {object} user - El objeto del usuario que se va a editar.
     */
    const handleShowEditModal = (user) => {
        setIsEditing(true); // Pone el modal en modo "Editar".
        setCurrentUser(user); // Guarda el usuario actual.
        // Rellena el formulario con los datos del usuario. La contraseña no se incluye por seguridad.
        setFormData({ 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            supervisor_id: user.supervisor_id || '', 
            is_active: user.is_active 
        });
        setShowModal(true); // Muestra el modal.
    };
    
    /** Cierra el modal. */
    const handleCloseModal = () => setShowModal(false);

    /**
     * Maneja el envío del formulario (tanto para crear como para editar).
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue.
        // Prepara el payload: si el rol no es 'TECHNICIAN', el supervisor_id debe ser nulo.
        const payload = {
            ...formData,
            supervisor_id: formData.role === 'TECHNICIAN' ? formData.supervisor_id : null
        };

        try {
            if (isEditing) {
                // Si está en modo edición, llama al endpoint PUT.
                await api.put(`/users/${currentUser.id}`, payload);
            } else {
                // Si está en modo creación, llama al endpoint POST.
                await api.post('/users', payload);
            }
            fetchUsers(); // Vuelve a cargar la lista de usuarios para ver los cambios.
            handleCloseModal(); // Cierra el modal.
        } catch (err) {
            setError('Error al guardar el usuario. ' + (err.response?.data?.message || err.message));
        }
    };

    /**
     * Maneja la eliminación de un usuario.
     * @param {number} id - El ID del usuario a eliminar.
     */
    const handleDelete = async (id) => {
        // Muestra una ventana de confirmación antes de proceder.
        if (window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
            try {
                await api.delete(`/users/${id}`); // Llama al endpoint DELETE.
                fetchUsers(); // Recarga la lista de usuarios.
            } catch (err) {
                setError('Error al eliminar el usuario. ' + (err.response?.data?.message || err.message));
            }
        }
    };
    
    // --- Renderizado del Componente ---

    return (
        // Envuelve toda la página en `ProtectedRoute`, permitiendo el acceso solo a usuarios con rol 'ADMIN'.
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <h1>Gestión de Usuarios</h1>
            <Button variant="primary" onClick={handleShowCreateModal} className="mb-3">
                Crear Nuevo Usuario
            </Button>

            {/* Muestra la alerta de error solo si el estado `error` tiene contenido. */}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            {/* Renderizado condicional: muestra el spinner mientras se cargan los datos. */}
            {loading ? (
                <div className="text-center"><Spinner animation="border" /></div>
            ) : (
                // Cuando la carga termina, muestra la tabla de usuarios.
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
                        {/* Itera sobre el array de usuarios y crea una fila por cada uno. */}
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td><Badge bg="info">{user.role}</Badge></td>
                                <td>
                                    {/* Muestra un badge de color diferente según el estado del usuario. */}
                                    <Badge bg={user.is_active ? 'success' : 'secondary'}>
                                        {user.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </td>
                                <td>
                                    {/* Botones de acción para cada usuario. */}
                                    <Button variant="warning" size="sm" onClick={() => handleShowEditModal(user)}>Editar</Button>{' '}
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>Eliminar</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* --- Modal para Crear/Editar Usuario --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    {/* El título del modal cambia según si se está editando o creando. */}
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
                        
                        {/* Renderizado condicional: el campo de contraseña solo aparece (y es requerido) al crear un usuario. */}
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

                        {/* Renderizado condicional: el campo para asignar supervisor solo aparece si el rol seleccionado es 'Técnico'. */}
                        {formData.role === 'TECHNICIAN' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Asignar a Supervisor</Form.Label>
                                <Form.Select name="supervisor_id" value={formData.supervisor_id || ''} onChange={handleInputChange}>
                                    <option value="">-- Ninguno --</option>
                                    {/* Itera sobre la lista de supervisores para crear las opciones. */}
                                    {supervisors.map(sup => (
                                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        )}

                        {/* Renderizado condicional: el switch para activar/desactivar un usuario solo aparece al editar. */}
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

// Exporta el componente para que Next.js pueda renderizarlo como una página.
export default AdminUsersPage;