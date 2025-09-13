// Ruta: /src/pages/login.js

import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            // La redirección ocurre automáticamente dentro de la función de login
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <main className="form-signin">
                <Form onSubmit={handleSubmit}>
                    <img className="mb-4" src="https://img.freepik.com/vector-premium/vector-libre-hermoso-elemento-diseno-colibri-volador-pancartas-carteles-folletos-folletos_1009653-1.jpg" alt="" width="100" />
                    <h1 className="h3 mb-3 fw-normal">Iniciar Sesión</h1>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form.Group className="mb-3 text-start" controlId="email">
                        <Form.Label>Correo Electrónico</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </Form.Group>

                    <Form.Group className="mb-3 text-start" controlId="password">
                        <Form.Label>Contraseña</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>
                    
                    <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                        {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Ingresar'}
                    </Button>
                    <p className="mt-5 mb-3 text-muted">SkyNet S.A. © 2025</p>
                </Form>
            </main>
        </div>
    );
};

export default LoginPage;