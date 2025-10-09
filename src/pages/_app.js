// Ruta: /src/pages/_app.js

import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.css';
import '@/styles/custom.css';
import { AuthProvider } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Si estamos en la página de login, no queremos mostrar la barra de navegación.
  // Por eso, la renderizamos sin el componente <Layout>.
  if (router.pathname === '/login') {
    return (
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    );
  }

  // Para todas las demás páginas, las envolvemos con el AuthProvider y el Layout,
  // que mostrará la barra de navegación y el contenido de la página dentro.
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;