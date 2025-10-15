import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function LeafletMap() {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let map: any;
        if (mapRef.current) {
            // @ts-ignore
            import('leaflet').then(L => {
                map = L.map(mapRef.current!).setView([55.751244, 37.618423], 10);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(map);
                
            });
        }
        return () => {
            if (map) map.remove();
        };
    }, []);

    return <div ref={mapRef} id="leaflet-map" style={
        {
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            zIndex: 1

        }
    }
    />;
}
