// Ruta: /src/components/FilterBar.js

// --- Dependencias ---
// Importa los componentes de layout y formulario de la librería 'react-bootstrap'.
import { Form, Row, Col, Button } from 'react-bootstrap';
// Importa el hook `useAuth` desde el contexto de autenticación.
// Esto permite al componente acceder a la información del usuario logueado, como su rol.
import { useAuth } from '@/context/AuthContext';

/**
 * Componente FilterBar
 * 
 * Este componente renderiza un formulario con varios campos de filtro (estado, supervisor, técnico, fechas).
 * Es un componente reutilizable que recibe el estado de los filtros y las funciones para manejarlos
 * desde un componente padre (como una página que muestra una lista de visitas o reportes).
 * 
 * @param {object} props - Las propiedades del componente.
 * @param {object} props.filters - El objeto de estado que contiene los valores actuales de los filtros.
 * @param {function} props.setFilters - La función para actualizar el estado de los filtros.
 * @param {function} props.onApply - La función que se ejecuta cuando el usuario envía el formulario (hace clic en "Aplicar").
 * @param {array} [props.users=[]] - Un array con todos los usuarios del sistema, usado para poblar los selectores de técnico y supervisor.
 */
const FilterBar = ({ filters, setFilters, onApply, users = [] }) => {
    // Obtiene los datos del usuario actual desde el contexto de autenticación.
    const { user } = useAuth();
    
    // Filtra el array de `users` para crear listas separadas de supervisores y técnicos.
    // Esto se usa para poblar las opciones de los menús desplegables (selects).
    const supervisors = users.filter(u => u.role === 'SUPERVISOR');
    const technicians = users.filter(u => u.role === 'TECHNICIAN');

    /**
     * Manejador de cambios en los campos del formulario.
     * Esta función se ejecuta cada vez que el usuario cambia el valor de un input o select.
     * @param {object} e - El evento del cambio.
     */
    const handleInputChange = (e) => {
        // Llama a la función `setFilters` del componente padre.
        // Utiliza el estado previo (`prev`) para crear un nuevo objeto de filtros.
        // `...prev` copia todos los filtros existentes.
        // `[e.target.name]: e.target.value` actualiza dinámicamente el filtro correspondiente
        // al `name` del input que cambió (ej: 'status', 'startDate').
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Renderiza el JSX del componente.
    return (
        // El `onSubmit` del formulario llama a la función `onApply` pasada por props.
        <Form onSubmit={onApply} className="p-3 mb-4 bg-light rounded">
            <Row className="align-items-end g-3">
                {/* --- Selector de Estado --- */}
                <Col md>
                    <Form.Group>
                        <Form.Label>Estado</Form.Label>
                        <Form.Select name="status" value={filters.status || ''} onChange={handleInputChange}>
                            <option value="">Todos</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="IN_PROGRESS">En Progreso</option>
                            <option value="FINISHED">Finalizada</option>
                            <option value="CANCELLED">Cancelada</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
                
                {/* --- Selector de Supervisor (Renderizado Condicional) --- */}
                {/* Este bloque solo se renderizará si el rol del usuario logueado es 'ADMIN'. */}
                {user.role === 'ADMIN' && (
                    <Col md>
                        <Form.Group>
                            <Form.Label>Supervisor</Form.Label>
                            <Form.Select name="supervisorId" value={filters.supervisorId || ''} onChange={handleInputChange}>
                                <option value="">Todos</option>
                                {/* Mapea el array de supervisores para crear una opción por cada uno. */}
                                {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                )}

                {/* --- Selector de Técnico (Renderizado Condicional) --- */}
                {/* Este bloque solo se renderizará si el rol es 'ADMIN' o 'SUPERVISOR'. */}
                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                    <Col md>
                        <Form.Group>
                            <Form.Label>Técnico</Form.Label>
                            <Form.Select name="technicianId" value={filters.technicianId || ''} onChange={handleInputChange}>
                                <option value="">Todos</option>
                                {/* Mapea el array de técnicos para crear las opciones. */}
                                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                )}

                {/* --- Selector de Fecha de Inicio --- */}
                <Col md>
                    <Form.Group>
                        <Form.Label>Desde</Form.Label>
                        <Form.Control type="date" name="startDate" value={filters.startDate || ''} onChange={handleInputChange} />
                    </Form.Group>
                </Col>
                {/* --- Selector de Fecha de Fin --- */}
                <Col md>
                    <Form.Group>
                        <Form.Label>Hasta</Form.Label>
                        <Form.Control type="date" name="endDate" value={filters.endDate || ''} onChange={handleInputChange} />
                    </Form.Group>
                </Col>
                {/* --- Botón de Aplicar Filtros --- */}
                <Col md="auto">
                    <Button type="submit" variant="primary">Aplicar Filtros</Button>
                </Col>
            </Row>
        </Form>
    );
};

// Exporta el componente para que pueda ser utilizado en otras partes de la aplicación.
export default FilterBar;