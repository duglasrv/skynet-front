// Ruta: /src/pages/login.js

// --- Dependencias de React y Componentes ---
import { useState } from 'react'; // Hook de React para manejar el estado del componente.
import { Form, Button, Alert, Spinner } from 'react-bootstrap'; // Componentes de UI para el formulario.
import { useAuth } from '@/context/AuthContext'; // Hook personalizado para acceder a la función `login` del contexto.

// --- Definición del Componente de Página ---
const LoginPage = () => {
    // --- Estados del Componente ---
    // Estado para almacenar el valor del campo de email.
    const [email, setEmail] = useState('');
    // Estado для almacenar el valor del campo de contraseña.
    const [password, setPassword] = useState('');
    // Estado para almacenar cualquier mensaje de error que ocurra durante el login.
    const [error, setError] = useState('');
    // Estado para controlar si se está procesando una solicitud de login. Se usa para deshabilitar el botón y mostrar un spinner.
    const [loading, setLoading] = useState(false);
    // Obtiene la función `login` desde el AuthContext.
    const { login } = useAuth();

    /**
     * Manejador para el evento de envío del formulario.
     * @param {React.FormEvent} e - El evento del formulario.
     */
    const handleSubmit = async (e) => {
        // Previene el comportamiento por defecto del formulario, que es recargar la página.
        e.preventDefault();
        // Limpia cualquier error previo antes de un nuevo intento.
        setError('');
        // Pone el estado en modo "cargando".
        setLoading(true);

        try {
            // Llama a la función `login` del AuthContext, pasándole las credenciales.
            // Esta función se encarga de hacer la llamada a la API y manejar las cookies.
            await login(email, password);
            // Si el login es exitoso, la redirección a la página principal ocurre automáticamente
            // dentro de la función `login` del AuthContext, por lo que no es necesario manejarla aquí.
        } catch (err) {
            // Si la función `login` lanza un error (ej: credenciales incorrectas), se captura aquí.
            // Se actualiza el estado de error con el mensaje recibido.
            setError(err.message);
            // Se detiene el estado de carga para que el usuario pueda volver a intentarlo.
            setLoading(false);
        }
    };

    // --- Renderizado del Componente ---
    return (
        // Contenedor principal con estilos personalizados para centrar el formulario.
        <div className="login-container">
            <main className="form-signin">
                {/* Asigna el manejador `handleSubmit` al evento `onSubmit` del formulario. */}
                <Form onSubmit={handleSubmit}>
                    <img className="mb-4" src="https://img.freepik.com/vector-premium/vector-libre-hermoso-elemento-diseno-colibri-volador-pancartas-carteles-folletos-folletos_1009653-1.jpg" alt="" width="100" />
                    <h1 className="h3 mb-3 fw-normal">Iniciar Sesión</h1>

                    {/* Renderizado condicional: la alerta de error solo se muestra si el estado `error` tiene contenido. */}
                    {error && <Alert variant="danger">{error}</Alert>}

                    {/* Grupo de formulario para el correo electrónico. */}
                    <Form.Group className="mb-3 text-start" controlId="email">
                        <Form.Label>Correo Electrónico</Form.Label>
                        <Form.Control
                            type="email"
                            // El valor del input está controlado por el estado `email`.
                            value={email}
                            // El evento `onChange` actualiza el estado `email` cada vez que el usuario escribe.
                            onChange={(e) => setEmail(e.target.value)}
                            required // Hace que el campo sea obligatorio.
                            autoFocus // Pone el foco en este campo automáticamente al cargar la página.
                        />
                    </Form.Group>

                    {/* Grupo de formulario para la contraseña. */}
                    <Form.Group className="mb-3 text-start" controlId="password">
                        <Form.Label>Contraseña</Form.Label>
                        <Form.Control
                            type="password"
                            // El valor del input está controlado por el estado `password`.
                            value={password}
                            // El evento `onChange` actualiza el estado `password`.
                            onChange={(e) => setPassword(e.target.value)}
                            required // Campo obligatorio.
                        />
                    </Form.Group>
                    
                    {/* Botón de envío del formulario. */}
                    <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                        {/* Renderizado condicional dentro del botón:
                            - Si `loading` es true, muestra un spinner.
                            - Si `loading` es false, muestra el texto "Ingresar".
                            El botón también se deshabilita (`disabled={loading}`) para prevenir múltiples envíos. */}
                        {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Ingresar'}
                    </Button>
                    <p className="mt-5 mb-3 text-muted">SkyNet S.A. © 2025</p>
                </Form>
            </main>
        </div>
    );
};

// Exporta el componente para que Next.js lo pueda renderizar como una página.
export default LoginPage;