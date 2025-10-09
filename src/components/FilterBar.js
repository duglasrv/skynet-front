// Ruta: /src/components/FilterBar.js

import { Form, Row, Col, Button } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';

const FilterBar = ({ filters, setFilters, onApply, users = [] }) => {
    const { user } = useAuth();
    
    const supervisors = users.filter(u => u.role === 'SUPERVISOR');
    const technicians = users.filter(u => u.role === 'TECHNICIAN');

    const handleInputChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <Form onSubmit={onApply} className="p-3 mb-4 bg-light rounded">
            <Row className="align-items-end g-3">
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
                
                {user.role === 'ADMIN' && (
                    <Col md>
                        <Form.Group>
                            <Form.Label>Supervisor</Form.Label>
                            <Form.Select name="supervisorId" value={filters.supervisorId || ''} onChange={handleInputChange}>
                                <option value="">Todos</option>
                                {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                )}

                {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
                    <Col md>
                        <Form.Group>
                            <Form.Label>Técnico</Form.Label>
                            <Form.Select name="technicianId" value={filters.technicianId || ''} onChange={handleInputChange}>
                                <option value="">Todos</option>
                                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                )}

                <Col md>
                    <Form.Group>
                        <Form.Label>Desde</Form.Label>
                        <Form.Control type="date" name="startDate" value={filters.startDate || ''} onChange={handleInputChange} />
                    </Form.Group>
                </Col>
                <Col md>
                    <Form.Group>
                        <Form.Label>Hasta</Form.Label>
                        <Form.Control type="date" name="endDate" value={filters.endDate || ''} onChange={handleInputChange} />
                    </Form.Group>
                </Col>
                <Col md="auto">
                    <Button type="submit" variant="primary">Aplicar Filtros</Button>
                </Col>
            </Row>
        </Form>
    );
};

export default FilterBar;