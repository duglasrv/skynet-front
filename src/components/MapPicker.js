// Ruta: /src/components/MapPicker.js

import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useCallback, useState } from 'react';
import { Spinner } from 'react-bootstrap';

const containerStyle = {
    width: '100%',
    height: '400px'
};

// Ubicación inicial del mapa (Ciudad de Guatemala)
const initialCenter = {
    lat: 14.634915,
    lng: -90.506882
};

function MapPicker({ onLocationSelect, initialPosition }) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    });

    const [markerPosition, setMarkerPosition] = useState(initialPosition || initialCenter);

    const onMapClick = useCallback((event) => {
        const newPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
        };
        setMarkerPosition(newPosition);
        onLocationSelect(newPosition);
    }, [onLocationSelect]);

    if (!isLoaded) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={containerStyle}>
                <Spinner animation="border" />
                <span className="ms-2">Cargando mapa...</span>
            </div>
        );
    }

    return (
        <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={markerPosition === initialCenter ? 12 : 17} // Más zoom si ya hay un punto
        onClick={onMapClick}
        >
        <Marker position={markerPosition} />
        </GoogleMap>
    );
}

export default MapPicker;