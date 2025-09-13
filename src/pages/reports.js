// Ruta: /src/pages/reports.js

import { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import ProtectedRoute from "@/components/ProtectedRoute";
import api from '@/services/api';

const ReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(null); // Para saber qué PDF se está descargando

    useEffect(() => {
        const fetchReports = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/reports');
            setReports(data);
        } catch (err) {
            setError('No se pudieron cargar los reportes. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
        };
        fetchReports();
    }, []);

    const handleDownloadPdf = async (visitId) => {
        setDownloading(visitId); // Activa el spinner para este botón específico
        try {
        const response = await api.get(`/reports/${visitId}/pdf`, {
            responseType: 'blob', // ¡Muy importante! Le dice a Axios que espere un archivo binario
        });

        // Crear una URL temporal para el archivo Blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        
        // Crear un enlace temporal, hacer clic en él para descargar, y luego removerlo
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte-visita-${visitId}.pdf`);
        document.body.appendChild(link);
        link.click();
        
        // Limpiar
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

        } catch (err) {
        setError('Error al descargar el PDF. ' + (err.response?.data?.message || err.message));
        } finally {
        setDownloading(null); // Desactiva el spinner
        }
    };

    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
        <h1>Historial de Reportes de Visitas</h1>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
        ) : (
            <Table striped bordered hover responsive>
            <thead>
                <tr>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Fecha de Visita</th>
                <th>Supervisor</th>
                <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {reports.map(report => (
                <tr key={report.report_id}>
                    <td>{report.client_name}</td>
                    <td>{report.technician_name}</td>
                    <td>{new Date(report.planned_at).toLocaleDateString()}</td>
                    <td>{report.supervisor_name}</td>
                    <td>
                    <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDownloadPdf(report.visit_id)}
                        disabled={downloading === report.visit_id}
                    >
                        {downloading === report.visit_id ? (
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        ) : (
                            'Descargar PDF'
                        )}
                    </Button>
                    </td>
                </tr>
                ))}
            </tbody>
            </Table>
        )}
        </ProtectedRoute>
    );
};

export default ReportsPage;