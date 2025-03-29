import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { warehouses } from '../lib/api';

// Updated type to match the actual API response
interface Warehouse {
    warehouseid: number;
    name: string;
    address: string;
    lat: number;
    lon: number;
    currentcapacity: number;
    totalcapacity: number;
}

function Warehouses() {
    const { data, isLoading } = useQuery<Warehouse[]>({
        queryKey: ['warehouses'],
        queryFn: warehouses.getAll,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Kho Hàng</h1>

                </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data?.map((warehouse: Warehouse) => (
                    <div
                        key={warehouse.warehouseid}
                        className="bg-white overflow-hidden shadow rounded-lg"
                    >
                        <div className="p-6">
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
                            <div className="mt-4">
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
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Warehouses;
