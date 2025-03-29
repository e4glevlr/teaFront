import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix cho marker icon trong React Leaflet
const defaultIcon = new Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

function MapPage() {
    const position = [51.505, -0.09]; // Vị trí mặc định, bạn có thể thay đổi tùy ý

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Bản Đồ Vị Trí</h1>

            <div style={{ height: "500px", width: "100%" }}>
                <MapContainer
                    center={position}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position} icon={defaultIcon}>
                        <Popup>
                            Vị trí hiện tại. <br /> Bạn có thể tùy chỉnh nội dung này.
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
}

export default MapPage;
