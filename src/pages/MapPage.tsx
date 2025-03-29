import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { warehouses } from '../lib/api';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix cho marker icon trong React Leaflet
const defaultIcon = new Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Định nghĩa kiểu dữ liệu cho warehouse theo API thực tế của bạn
interface Warehouse {
    warehouseid: number;
    name: string;
    address: string;
    lat: number;
    lon: number;
    currentcapacity: number;
    totalcapacity: number;
}

function MapPage() {
    // Sử dụng React Query để lấy dữ liệu kho
    const { data: warehousesList, isLoading, error } = useQuery<Warehouse[]>({
        queryKey: ['warehouses'],
        queryFn: warehouses.getAll,
    });

    // Vị trí mặc định (Hà Nội) nếu không có dữ liệu kho
    const defaultPosition: [number, number] = [21.0285, 105.8542];

    // Tính toán vị trí trung tâm dựa trên tất cả các kho
    const calculateCenter = () => {
        if (!warehousesList || warehousesList.length === 0) return defaultPosition;

        const sumLat = warehousesList.reduce((sum, warehouse) => sum + warehouse.lat, 0);
        const sumLon = warehousesList.reduce((sum, warehouse) => sum + warehouse.lon, 0);

        return [
            sumLat / warehousesList.length,
            sumLon / warehousesList.length
        ] as [number, number];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-semibold text-gray-900">Bản Đồ Kho Hàng</h1>
                <div className="text-red-500">
                    Đã xảy ra lỗi khi tải dữ liệu kho: {(error as Error).message}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="sm:flex sm:items-center mb-6">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Bản Đồ Kho Hàng</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Hiển thị vị trí và thông tin của tất cả kho hàng trên bản đồ
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div style={{ height: "500px", width: "100%" }}>
                    <MapContainer
                        center={calculateCenter()}
                        zoom={13}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {warehousesList?.map((warehouse) => (
                            <Marker
                                key={warehouse.warehouseid}
                                position={[warehouse.lat, warehouse.lon]}
                                icon={defaultIcon}
                            >
                                <Popup className="warehouse-popup" minWidth={250}>
                                    <div className="p-2">
                                        <div className="flex items-center mb-3">
                                            <div className="flex-shrink-0">
                                                <MapPin className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {warehouse.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">{warehouse.address}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Sức Chứa</span>
                                                <span className="font-medium text-gray-900">
                                                    {warehouse.currentcapacity}/{warehouse.totalcapacity}
                                                </span>
                                            </div>
                                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-indigo-600 h-2.5 rounded-full"
                                                    style={{
                                                        width: `${(warehouse.currentcapacity / warehouse.totalcapacity) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <a
                                                href={`/warehouses?id=${warehouse.warehouseid}`}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Xem chi tiết
                                            </a>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Thêm phần hiển thị danh sách kho ở dưới bản đồ (tùy chọn) */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {warehousesList?.map((warehouse) => (
                    <div
                        key={warehouse.warehouseid}
                        className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                            // Có thể thêm logic để focus vào marker tương ứng trên bản đồ
                            window.location.href = `/warehouses?id=${warehouse.warehouseid}`;
                        }}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <MapPin className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {warehouse.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{warehouse.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MapPage;
