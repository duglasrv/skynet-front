// Ruta: /src/pages/reports.js

// --- Dependencias de React, Componentes y Servicios ---
import { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import ProtectedRoute from "@/components/ProtectedRoute"; // Para proteger la página
import api from '@/services/api'; // Instancia de Axios para llamadas a la API
import FilterBar from '@/components/FilterBar'; // Importamos el componente reutilizable de filtros
import { useAuth } from '@/context/AuthContext'; // Hook para acceder a los datos del usuario logueado

// --- Definición del Componente de Página ---
const ReportsPage = () => {
    // --- Estados del Componente ---
    const { user } = useAuth(); // Obtiene el usuario actual del contexto.
    const [reports, setReports] = useState([]); // Almacena la lista de reportes a mostrar.
    const [users, setUsers] = useState([]); // Almacena la lista de usuarios para poblar los filtros.
    const [loading, setLoading] = useState(true); // Controla el estado de carga.
    const [error, setError] = useState(''); // Almacena mensajes de error.
    // Estado para los filtros. Se inicializa con `status: 'FINISHED'` porque esta página es para reportes de visitas ya completadas.
    const [filters, setFilters] = useState({ status: 'FINISHED' });
    // Estado para controlar la UI durante las descargas. `pdf: null` o `pdf: visitId` y `csv: boolean`.
    const [downloading, setDownloading] = useState({ pdf: null, csv: false });

    /**
     * Carga los datos iniciales (reportes y usuarios para los filtros) desde el backend.
     */
    const fetchData = async () => {
        try {
            setLoading(true);
            // Convierte el objeto de filtros en una cadena de consulta para la URL (ej: "status=FINISHED&supervisorId=1").
            const queryParams = new URLSearchParams(filters).toString();
            
            // Usamos `Promise.all` para ejecutar ambas peticiones de red en paralelo, lo que es más eficiente.
            const [reportsRes, usersRes] = await Promise.all([
                api.get(`/reports?${queryParams}`),
                // Solo pedimos la lista completa de usuarios si el rol es Admin o Supervisor, ya que solo ellos los necesitan para los filtros.
                (user.role === 'ADMIN' || user.role === 'SUPERVISOR') 
                    ? api.get('/users') 
                    : Promise.resolve({ data: [] }) // Para otros roles, devolvemos una promesa resuelta con un array vacío para que `Promise.all` no falle.
            ]);
            
            setReports(reportsRes.data); // Actualiza el estado con los reportes recibidos.
            setUsers(usersRes.data); // Actualiza el estado con los usuarios recibidos.
            setError(''); // Limpia cualquier error anterior.
        } catch (err) {
            setError('No se pudieron cargar los reportes. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false); // Oculta el spinner, independientemente del resultado.
        }
    };

    // `useEffect` para cargar los datos cuando el componente se monta o cuando el usuario cambia.
    useEffect(() => {
        // La guarda `if (user)` asegura que no intentamos cargar datos antes de que el contexto de autenticación haya cargado el usuario.
        if (user) { 
            fetchData();
        }
    }, [user]); // El array de dependencias `[user]` hace que este efecto se ejecute una vez que `user` tiene un valor.

    /**
     * Manejador para el botón "Aplicar Filtros" del componente FilterBar.
     */
    const handleApplyFilters = (e) => {
        e.preventDefault(); // Evita que el formulario recargue la página.
        fetchData(); // Vuelve a llamar a fetchData para obtener los datos con los nuevos filtros.
    };

    /**
     * Maneja la descarga de un reporte individual en formato PDF.
     * @param {number} visitId - El ID de la visita cuyo reporte se quiere descargar.
     */
    const handleDownloadPdf = async (visitId) => {
        // Pone el estado en modo "descargando" para este PDF específico, mostrando un spinner en el botón correcto.
        setDownloading(prev => ({ ...prev, pdf: visitId }));
        try {
            // Pide el PDF al backend. `responseType: 'blob'` es CRUCIAL, le dice a Axios que espere datos binarios (un archivo), no JSON.
            const response = await api.get(`/reports/${visitId}/pdf`, { responseType: 'blob' });
            
            // --- Lógica para iniciar la descarga en el navegador ---
            // 1. Crea una URL temporal en el navegador que apunta al archivo recibido (el blob).
            const url = window.URL.createObjectURL(new Blob([response.data]));
            // 2. Crea un elemento de enlace `<a>` invisible en la memoria.
            const link = document.createElement('a');
            link.href = url;
            // 3. Establece el atributo 'download' con el nombre de archivo sugerido. Esto le dice al navegador que descargue el archivo.
            link.setAttribute('download', `reporte-visita-${visitId}.pdf`);
            // 4. Añade el enlace al documento, lo "cliquea" mediante código para iniciar la descarga, y luego lo elimina.
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            // 5. Libera la URL del objeto de la memoria para evitar fugas de memoria.
            window.URL.revokeObjectURL(url);

        } catch (err) {
            setError('Error al descargar el PDF.');
        } finally {
            // Resetea el estado de descarga del PDF para que el spinner desaparezca.
            setDownloading(prev => ({ ...prev, pdf: null }));
        }
    };
    
    /**
     * Maneja la exportación de la vista actual de reportes a un archivo CSV.
     */
    const handleExportCsv = async () => {
        setDownloading(prev => ({ ...prev, csv: true })); // Activa el spinner del botón CSV.
        try {
            const queryParams = new URLSearchParams(filters).toString();
            // Llama al endpoint de exportación con los mismos filtros aplicados en la tabla.
            const response = await api.get(`/reports/export/csv?${queryParams}`, { responseType: 'blob' });
            
            // La lógica de descarga es idéntica a la del PDF.
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
            setDownloading(prev => ({ ...prev, csv: false })); // Desactiva el spinner del botón CSV.
        }
    };

    // --- Renderizado del Componente ---
    return (
        // Protege la página, permitiendo el acceso solo a 'ADMIN' y 'SUPERVISOR'.
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}>
            <h1>Historial de Reportes</h1>
            {/* Renderiza la barra de filtros, pasándole los estados y manejadores necesarios. */}
            <FilterBar filters={filters} setFilters={setFilters} onApply={handleApplyFilters} users={users} />
            
            <div className="d-flex justify-content-end mb-3">
                <Button variant="success" onClick={handleExportCsv} disabled={downloading.csv}>
                    {/* Muestra un spinner en el botón mientras se exporta el CSV. */}
                    {downloading.csv ? <Spinner as="span" size="sm" /> : 'Exportar Vista a CSV'}
                </Button>
            </div>

            {/* Muestra alertas de error y el spinner de carga general. */}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            {loading ? <div className="text-center my-5"><Spinner animation="border" /></div> : (
                // Cuando la carga termina, muestra la tabla de reportes.
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
                        {/* Itera sobre los reportes. Si no hay, muestra un mensaje. */}
                        {reports.length > 0 ? reports.map(report => (
                            <tr key={report.report_id}>
                                <td>{report.client_name}</td>
                                <td>{report.technician_name}</td>
                                <td>{new Date(report.created_at).toLocaleString()}</td>
                                <td>{report.supervisor_name}</td>
                                <td>
                                    {/* Botón para descargar el PDF individual. */}
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={() => handleDownloadPdf(report.visit_id)}
                                        // El botón se deshabilita y muestra un spinner SOLO si el PDF que se está descargando es el de esta fila.
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