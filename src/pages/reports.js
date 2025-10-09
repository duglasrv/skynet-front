// Ruta: /src/pages/reports.js

import { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/services/api';
import FilterBar from '@/components/FilterBar'; // Importamos el componente de filtros
import { useAuth } from '@/context/AuthContext';

const ReportsPage = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]); // Para poblar los filtros
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ status: 'FINISHED' }); // Por defecto, los reportes son de visitas finalizadas
    const [downloading, setDownloading] = useState({ pdf: null, csv: false });

    // Carga los datos iniciales (reportes y usuarios para los filtros)
    const fetchData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters).toString();
            
            // Hacemos ambas peticiones en paralelo
            const [reportsRes, usersRes] = await Promise.all([
                api.get(`/reports?${queryParams}`),
                // Solo pedimos la lista de usuarios si es Admin o Supervisor
                (user.role === 'ADMIN' || user.role === 'SUPERVISOR') ? api.get('/users') : Promise.resolve({ data: [] })
            ]);
            
            setReports(reportsRes.data);
            setUsers(usersRes.data);
            setError('');
        } catch (err) {
            setError('No se pudieron cargar los reportes. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) { // Nos aseguramos que el usuario esté cargado antes de hacer la llamada
            fetchData();
        }
    }, [user]); // Dependemos del usuario para la carga inicial

    // Manejador para el botón "Aplicar Filtros"
    const handleApplyFilters = (e) => {
        e.preventDefault();
        fetchData();
    };

    // Manejador para descargar el PDF individual
    const handleDownloadPdf = async (visitId) => {
        setDownloading(prev => ({ ...prev, pdf: visitId }));
        try {
            const response = await api.get(`/reports/${visitId}/pdf`, { responseType: 'blob' });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte-visita-${visitId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            setError('Error al descargar el PDF.');
        } finally {
            setDownloading(prev => ({ ...prev, pdf: null }));
        }
    };
    
    // Manejador para exportar el reporte general a CSV
    const handleExportCsv = async () => {
        setDownloading(prev => ({ ...prev, csv: true }));
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await api.get(`/reports/export/csv?${queryParams}`, { responseType: 'blob' });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte_general_skynet.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Error al exportar a CSV. Es posible que no haya datos para los filtros seleccionados.');
        } finally {
            setDownloading(prev => ({ ...prev, csv: false }));
        }
    };

    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
            <h1>Historial de Reportes</h1>
            <FilterBar filters={filters} setFilters={setFilters} onApply={handleApplyFilters} users={users} />
            
            <div className="d-flex justify-content-end mb-3">
                <Button variant="success" onClick={handleExportCsv} disabled={downloading.csv}>
                    {downloading.csv ? <Spinner as="span" size="sm" /> : 'Exportar Vista a CSV'}
                </Button>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            {loading ? <div className="text-center my-5"><Spinner animation="border" /></div> : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Técnico</th>
                            <th>Fecha Finalización</th>
                            <th>Supervisor</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length > 0 ? reports.map(report => (
                            <tr key={report.report_id}>
                                <td>{report.client_name}</td>
                                <td>{report.technician_name}</td>
                                <td>{new Date(report.created_at).toLocaleString()}</td>
                                <td>{report.supervisor_name}</td>
                                <td>
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={() => handleDownloadPdf(report.visit_id)}
                                        disabled={downloading.pdf === report.visit_id}
                                    >
                                        {downloading.pdf === report.visit_id ? <Spinner size="sm" /> : 'PDF'}
                                    </Button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center">No se encontraron reportes con los filtros seleccionados.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </ProtectedRoute>
    );
};

export default ReportsPage;