// Este es un comentario de plantilla que explica dónde encontrar la documentación oficial
// de las rutas de API en Next.js.
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

/**
 * Función manejadora (handler) de la ruta de API.
 * 
 * En Next.js, cualquier archivo dentro del directorio `/pages/api` se mapea a una ruta de API.
 * Por ejemplo, este archivo, si se llama `hello.js`, estará disponible en la URL `/api/hello`.
 * 
 * Esta función se ejecuta en el servidor cada vez que se realiza una petición a dicha URL.
 * 
 * @param {import('next').NextApiRequest} req - El objeto de la solicitud (request). Contiene
 *   información sobre la petición entrante, como las cabeceras, el método (GET, POST, etc.),
 *   y el cuerpo de la petición.
 * @param {import('next').NextApiResponse} res - El objeto de la respuesta (response). Se utiliza
 *   para construir y enviar la respuesta de vuelta al cliente.
 */
export default function handler(req, res) {
  // `res.status(200)`: Establece el código de estado HTTP de la respuesta a 200, que significa "OK" o "Éxito".
  // `.json({ name: "John Doe" })`: Envía la respuesta en formato JSON.
  // El cuerpo de la respuesta será un objeto JavaScript `{ name: "John Doe" }` convertido a una cadena JSON.
  res.status(200).json({ name: "John Doe" });
}