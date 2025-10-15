// Ruta: /src/components/MapPicker.js

// --- Dependencias ---
// Importa los componentes `GoogleMap`, `Marker` y el hook `useJsApiLoader` de la librería de Google Maps para React.
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
// Importa los hooks `useCallback` y `useState` de React para manejar el estado y optimizar funciones.
import { useCallback, useState } from 'react';
// Importa el componente `Spinner` de react-bootstrap para mostrar un indicador de carga.
import { Spinner } from 'react-bootstrap';

// Define el estilo del contenedor del mapa.
const containerStyle = {
    width: '100%',
    height: '400px'
};

// Define la ubicación central inicial del mapa si no se proporciona una.
// En este caso, apunta a la Ciudad de Guatemala.
const initialCenter = {
    lat: 14.634915,
    lng: -90.506882
};

/**
 * Componente MapPicker
 * 
 * Renderiza un mapa de Google interactivo donde el usuario puede hacer clic
 * para colocar un marcador y seleccionar una ubicación (latitud y longitud).
 * 
 * @param {object} props - Las propiedades del componente.
 * @param {function} props.onLocationSelect - Una función callback que se ejecuta cada vez que el usuario selecciona una nueva ubicación en el mapa. Devuelve un objeto `{ lat, lng }`.
 * @param {object} [props.initialPosition] - Un objeto opcional `{ lat, lng }` para establecer la posición inicial del marcador.
 */
function MapPicker({ onLocationSelect, initialPosition }) {
    // Utiliza el hook `useJsApiLoader` para cargar el script de la API de Google Maps de forma asíncrona.
    // `isLoaded` será `true` una vez que el script se haya cargado correctamente.
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script', // Un ID único para el script en el DOM.
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY // Carga la clave de API desde las variables de entorno.
    });

    // Crea un estado para almacenar la posición actual del marcador en el mapa.
    // Si se proporciona una `initialPosition`, se usa esa; de lo contrario, se usa `initialCenter`.
    const [markerPosition, setMarkerPosition] = useState(initialPosition || initialCenter);

    /**
     * Manejador del evento de clic en el mapa.
     * Se envuelve en `useCallback` para memorizar la función y evitar que se vuelva a crear en cada renderizado,
     * a menos que sus dependencias (en este caso, `onLocationSelect`) cambien.
     * @param {object} event - El objeto de evento del clic en el mapa, que contiene las coordenadas.
     */
    const onMapClick = useCallback((event) => {
        // Extrae las coordenadas de latitud y longitud del evento.
        const newPosition = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        // Actualiza el estado local para mover el marcador a la nueva posición.
        setMarkerPosition(newPosition);
        // Llama a la función `onLocationSelect` pasada desde el componente padre,
        // enviándole las nuevas coordenadas para que el padre pueda usarlas (ej: guardarlas en un formulario).
        onLocationSelect(newPosition);
    }, [onLocationSelect]); // La dependencia `onLocationSelect` asegura que la función se actualice si el callback del padre cambia.

    // --- Renderizado Condicional: Estado de Carga ---
    // Si el script de Google Maps aún no se ha cargado, muestra un indicador de carga.
    if (!isLoaded) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={containerStyle}>
                <Spinner animation="border" />
                <span className="ms-2">Cargando mapa...</span>
            </div>
        );
    }

    // --- Renderizado Principal: El Mapa ---
    // Una vez que `isLoaded` es true, renderiza el mapa.
    return (
        <GoogleMap
            mapContainerStyle={containerStyle} // Aplica el estilo al contenedor del mapa.
            center={markerPosition} // Centra la vista del mapa en la posición actual del marcador.
            // Ajusta el nivel de zoom dinámicamente. Si es la vista inicial, el zoom es más alejado (12).
            // Si ya hay un punto específico seleccionado, el zoom es más cercano (17).
            zoom={markerPosition === initialCenter ? 12 : 17}
            onClick={onMapClick} // Asigna el manejador de clic al mapa.
        >
            {/* Renderiza un marcador (pin) en la posición definida por `markerPosition`. */}
            <Marker position={markerPosition} />
        </GoogleMap>
    );
}

// Exporta el componente para su uso en otras partes de la aplicación.
export default MapPicker;