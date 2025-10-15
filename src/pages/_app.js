// Ruta: /src/pages/_app.js

// --- Importación de Estilos Globales ---
// Importa la hoja de estilos principal de Bootstrap. Al importarla aquí,
// estará disponible en TODAS las páginas de la aplicación.
import 'bootstrap/dist/css/bootstrap.min.css';
// Importa estilos globales definidos en `globals.css`.
import '@/styles/globals.css';
// Importa estilos personalizados adicionales de `custom.css`.
import '@/styles/custom.css';

// --- Importación de Componentes y Contexto ---
// Importa el AuthProvider desde el contexto de autenticación. Este componente
// "proveerá" el estado de autenticación (usuario, login, logout) a toda la aplicación.
import { AuthProvider } from '@/context/AuthContext';
// Importa el componente Layout, que contiene la barra de navegación y la estructura principal.
import Layout from '@/components/Layout';
// Importa el hook `useRouter` de Next.js para acceder al objeto del router,
// lo que nos permite saber en qué página (ruta) nos encontramos actualmente.
import { useRouter } from 'next/router';

/**
 * Componente Principal de la Aplicación (MyApp)
 * 
 * En Next.js, `_app.js` es un componente especial que envuelve a todas las demás páginas.
 * Es el lugar ideal para colocar:
 * - Layouts persistentes (como la barra de navegación).
 * - Proveedores de contexto (como AuthProvider).
 * - Estilos globales.
 * - Manejar el estado que debe ser compartido entre todas las páginas.
 * 
 * @param {object} props - Propiedades pasadas por Next.js.
 * @param {React.ComponentType} props.Component - El componente de la página actual que se está renderizando (ej: `HomePage`, `LoginPage`).
 * @param {object} props.pageProps - Las propiedades iniciales que se pasan a la página `Component`.
 */
function MyApp({ Component, pageProps }) {
  // Obtiene el objeto del router, que contiene información sobre la ruta actual, como el `pathname`.
  const router = useRouter();

  // --- Lógica de Renderizado Condicional del Layout ---

  // Se comprueba si la ruta actual es exactamente '/login'.
  // Si estamos en la página de login, no queremos mostrar la barra de navegación principal (Layout).
  // Queremos una vista más simple.
  if (router.pathname === '/login') {
    return (
      // A pesar de no mostrar el Layout, SÍ envolvemos la página de login con el AuthProvider.
      // Esto es crucial para que el componente de login pueda acceder a la función `login()` del contexto.
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    );
  }

  // --- Renderizado por Defecto para Todas las Demás Páginas ---
  // Para cualquier otra página que no sea '/login', aplicamos la estructura completa.
  return (
    // 1. `AuthProvider` envuelve todo. Esto hace que el estado de autenticación (quién es el usuario,
    //    si está logueado, etc.) esté disponible para el Layout y para la página `Component`.
    <AuthProvider>
      {/* 2. `Layout` envuelve a la página. Esto añade la barra de navegación, el footer, y cualquier
          otra estructura visual que deba ser consistente en toda la aplicación. */}
      <Layout>
        {/* 3. `Component {...pageProps}` es la página actual que se está visitando. Se renderiza
            como "hijo" del componente Layout. */}
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

// Exporta el componente MyApp para que Next.js lo utilice como el componente raíz de la aplicación.
export default MyApp;