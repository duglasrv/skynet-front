// Ruta: /frontend/src/pages/_document.js

// --- Dependencias de Next.js ---
// Importa los componentes especiales `Html`, `Head`, `Main`, y `NextScript` desde 'next/document'.
// Estos componentes son necesarios para construir la estructura base del documento HTML.
import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Componente Document (Documento Personalizado)
 * 
 * En Next.js, `_document.js` es un archivo especial que te permite personalizar el "esqueleto"
 * del documento HTML que envuelve a toda tu aplicación. A diferencia de `_app.js`, este archivo
 * se renderiza **únicamente en el servidor**.
 * 
 * Es el lugar correcto para:
 * - Modificar las etiquetas `<html>` y `<body>`.
 * - Añadir atributos de idioma (lang).
 * - Cargar fuentes externas (como Google Fonts) de forma global.
 * - Añadir metadatos que deben estar presentes en todas las páginas.
 * - Incluir scripts de terceros que deben cargarse antes que el resto de la aplicación.
 * 
 * **Importante:** No se debe poner lógica de la aplicación, componentes de React que no sean
 * los proveídos (`<Html>`, `<Head>`, etc.), ni hojas de estilo aquí (eso va en `_app.js`).
 */
export default function Document() {
  return (
    // El componente `<Html>` representa la etiqueta `<html>` del documento.
    // Aquí se establece el atributo `lang="es"` para indicar que el idioma principal de la página es español,
    // lo cual es bueno para la accesibilidad y el SEO.
    <Html lang="es">
      
      {/* El componente `<Head>` representa la etiqueta `<head>` del HTML.
          Es diferente del `<Head>` de 'next/head' que se usa en las páginas.
          Lo que se ponga aquí se cargará en TODAS las páginas de la aplicación. */}
      <Head>
        {/* --- Carga de Fuentes Externas (Google Fonts) --- */}
        {/* Estas etiquetas `<link>` son la forma recomendada por Google para importar fuentes.
            - `preconnect`: Establece una conexión temprana con los servidores de Google Fonts,
              lo que puede acelerar ligeramente la carga de la fuente. `crossOrigin="true"` es
              necesario para las conexiones de fuentes.
            - `stylesheet`: El enlace final que importa la hoja de estilos de la fuente Poppins
              con diferentes grosores (weights) para usar en la aplicación. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      {/* La etiqueta `<body>` del documento. */}
      <body>
        {/* El componente `<Main />` es un placeholder obligatorio.
            Aquí es donde Next.js inyectará el contenido principal de tu aplicación,
            incluyendo lo que se renderiza en `_app.js` y en cada página individual. */}
        <Main />
        
        {/* El componente `<NextScript />` es otro placeholder obligatorio.
            Aquí es donde Next.js inyectará todos los scripts necesarios para que
            la aplicación de React se hidrate y funcione de forma interactiva en el cliente. */}
        <NextScript />
      </body>
    </Html>
  )
}