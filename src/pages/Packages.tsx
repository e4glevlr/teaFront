import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Package as PackageIcon, History, Info, ArrowLeft } from 'lucide-react';
import { warehouses } from '../lib/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EventSourcePolyfill } from 'event-source-polyfill'
// --- Imports cho Leaflet ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { Icon } from 'leaflet';

// --- Fix lỗi icon mặc định ---
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

const customMarkerIcon = new Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
// -------------------------

// Interface cho Warehouse
interface Warehouse {
  warehouseid: number;
  name: string;
  address: string;
  lat: number | null;
  lon: number | null;
  currentcapacity: number;
  totalcapacity: number;
}

// Interface cho Package
interface Package {
  packageId: number;
  fullname: string;
  teacode: number | string | null | undefined; // Dùng teacode
  capacity: number;
  unit: string;
  status: string | null | undefined; // Trạng thái gốc từ API
  createdtime: string;
  weightime?: string | null | undefined;
}


function Warehouses() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const warehouseId = searchParams.get('id') ? parseInt(searchParams.get('id')!, 10) : null;
  const initialTab = searchParams.get('tab') || 'info';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Query lấy danh sách kho
  const { data: warehousesList, isLoading: isLoadingWarehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: warehouses.getAll,
  });

  // Query lấy gói hàng trong kho
  const { data: warehousePackages, isLoading: isLoadingPackages } = useQuery<{ packages: Package[] } | null>({
    queryKey: ['warehousePackages', warehouseId],
    queryFn: () => warehouseId ? warehouses.getPackages(warehouseId) : Promise.resolve(null),
    enabled: !!warehouseId,
  });

  // Effect cập nhật selectedWarehouse
  useEffect(() => {
    if (warehousesList && warehouseId) {
      const warehouse = warehousesList.find(w => w.warehouseid === warehouseId);
      setSelectedWarehouse(warehouse ?? null);
    } else if (!warehouseId) {
      setSelectedWarehouse(null);
    }
  }, [warehousesList, warehouseId]);

  // Effect cập nhật activeTab
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handlers
  const handleWarehouseClick = (id: number) => {
    navigate(`/warehouses?id=${id}&tab=info`);
  };

  const handleBackToList = () => {
    navigate('/warehouses');
  };

  const handleTabChange = (tab: string) => {
    if (warehouseId) {
      navigate(`/warehouses?id=${warehouseId}&tab=${tab}`);
    }
  };

  // === CÁC HÀM HELPER ===

  // Lấy tên loại chè từ teacode (vẫn giữ logic chuẩn hóa số/chuỗi)
  const getTeaTypeName = (teacodeInput: number | string | null | undefined): string => {
    if (teacodeInput === null || teacodeInput === undefined || teacodeInput === '') return 'Không rõ';
    const teacode = Number(teacodeInput);
    if (isNaN(teacode)) return 'Mã không hợp lệ';
    switch (teacode) {
      case 1: return 'Chè Thái';
      case 2: return 'Chè Trung Quốc';
      default: return `Loại khác (${teacode})`;
    }
  };

  // Lấy màu loại chè từ TÊN (string)
  const getTeaTypeColor = (teaType: string | null | undefined): string => {
    if (!teaType) return 'bg-gray-100 text-gray-800';
    switch (teaType.toLowerCase()) { // Chuẩn hóa tên trước khi so sánh màu
      case "chè thái": return 'bg-blue-100 text-blue-800';
      case "chè trung quốc": return 'bg-yellow-100 text-yellow-800';
      default:
        if (teaType === 'Không rõ' || teaType === 'Mã không hợp lệ') return 'bg-gray-100 text-gray-800';
        return 'bg-green-100 text-green-800';
    }
  };

  // Dịch trạng thái sang tiếng Việt (có thể vẫn cần chuẩn hóa nhẹ để hiển thị đẹp)
  const getStatusTranslation = (rawStatus: string | null | undefined): string => {
    if (!rawStatus) return 'Không xác định';
    // Chuẩn hóa nhẹ để dịch đúng các trường hợp cơ bản
    const normalizedStatus = rawStatus.trim().toLowerCase();
    switch (normalizedStatus) {
      case "weighn't yet": return 'Chưa cân';
      case "weighed": return 'Đã cân';
      case "scanned": return 'Đã quét QR';
      case "wait delivery": return 'Chờ vận chuyển';
      default: return rawStatus.trim(); // Trả về trạng thái gốc (đã trim) nếu không khớp
    }
  };

  // *** GET STATUS COLOR - LOGIC ĐƠN GIẢN NHẤT (KHÔNG CHUẨN HÓA) ***
  // So sánh trực tiếp với chuỗi gốc từ API
  const getStatusColor = (rawStatus: string | null | undefined): string => {
    // Log giá trị gốc nhận được để debug (quan trọng!)
    // console.log(`getStatusColor received raw: '${rawStatus}'`);

    if (!rawStatus) {
      return 'bg-gray-100 text-gray-800'; // Default gray for null/undefined
    }

    // KHÔNG chuẩn hóa, so sánh trực tiếp
    switch (rawStatus) {
        // Các case phải khớp CHÍNH XÁC với giá trị từ API
      case "Weighn't yet":
        return 'bg-red-100 text-red-800'; // Đỏ
      case "Weighed":
        return 'bg-yellow-100 text-yellow-800'; // Vàng
      case "Scanned":
        return 'bg-purple-100 text-purple-800'; // Tím
      case "Wait Delivery":
        return 'bg-blue-100 text-blue-800'; // Xanh dương
      default:
        // Nếu không khớp với bất kỳ case nào ở trên
        // console.warn(`getStatusColor: No exact match for raw status '${rawStatus}'. Using default color.`);
        return 'bg-gray-100 text-gray-800'; // Xám (Mặc định)
    }
  };
  // ********************************************************************


  // Hàm lấy class cho tab
  const getTabClassName = (tabName: string) => {
    return `w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
        activeTab === tabName
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };

  // === RENDER LOGIC ===

  // Loading ban đầu
  if (isLoadingWarehouses && !warehousesList) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  // --- Render Chi tiết Kho ---
  if (selectedWarehouse) {
    const hasValidCoordinates = selectedWarehouse.lat != null && selectedWarehouse.lon != null;
    const mapPosition: L.LatLngExpression = hasValidCoordinates ? [selectedWarehouse.lat!, selectedWarehouse.lon!] : [10.762622, 106.660172];
    const mapZoom = hasValidCoordinates ? 15 : 10;

    return (
        <div>
          <div className="mb-6">
            <button onClick={handleBackToList} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại danh sách
            </button>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* Header Kho */}
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <div><h2 className="text-2xl font-bold text-gray-900">{selectedWarehouse.name}</h2><p className="mt-1 max-w-2xl text-sm text-gray-500">{selectedWarehouse.address}</p></div>
                <div className="flex items-center text-right"><span className="text-gray-700 mr-2 text-sm">Sức chứa:</span><span className="font-medium">{selectedWarehouse.currentcapacity}/{selectedWarehouse.totalcapacity}</span></div>
              </div>

              {/* Tab navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex" aria-label="Tabs">
                  <button onClick={() => handleTabChange('info')} className={getTabClassName('info')}><Info className="w-5 h-5 inline-block mr-2" /> Thông tin</button>
                  <button onClick={() => handleTabChange('packages')} className={getTabClassName('packages')}><PackageIcon className="w-5 h-5 inline-block mr-2" /> Gói hàng</button>
                  <button onClick={() => handleTabChange('history')} className={getTabClassName('history')}><History className="w-5 h-5 inline-block mr-2" /> Lịch sử cân</button>
                </nav>
              </div>

              {/* Tab content */}
              <div className="px-4 py-5 sm:p-6">
                {/* --- Tab Thông tin --- */}
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                      {/* Chi tiết */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin chi tiết</h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div><dt className="text-sm font-medium text-gray-500">ID</dt><dd className="mt-1 text-sm text-gray-900">{selectedWarehouse.warehouseid}</dd></div>
                          <div><dt className="text-sm font-medium text-gray-500">Tên kho</dt><dd className="mt-1 text-sm text-gray-900">{selectedWarehouse.name}</dd></div>
                          <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Địa chỉ</dt><dd className="mt-1 text-sm text-gray-900">{selectedWarehouse.address || 'Chưa cập nhật'}</dd></div>
                          <div><dt className="text-sm font-medium text-gray-500">Sức chứa</dt><dd className="mt-1 text-sm text-gray-900">{selectedWarehouse.totalcapacity}</dd></div>
                          <div><dt className="text-sm font-medium text-gray-500">Đã sử dụng</dt><dd className="mt-1 text-sm text-gray-900">{selectedWarehouse.currentcapacity}</dd></div>
                          <div><dt className="text-sm font-medium text-gray-500">Còn trống</dt><dd className="mt-1 text-sm text-gray-900">{selectedWarehouse.totalcapacity - selectedWarehouse.currentcapacity}</dd></div>
                        </dl>
                      </div>
                      {/* Map */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Vị trí</h3>
                        <div className="h-72 w-full bg-gray-100 rounded-lg overflow-hidden shadow">
                          {hasValidCoordinates ? (<MapContainer center={mapPosition} zoom={mapZoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' /><Marker position={mapPosition} icon={customMarkerIcon}><Popup><b>{selectedWarehouse.name}</b><br />{selectedWarehouse.address}</Popup></Marker></MapContainer>) : (<div className="flex items-center justify-center h-full"><MapPin className="h-8 w-8 text-gray-400 mr-2" /><span className="text-gray-500">Không có thông tin vị trí.</span></div>)}
                        </div>
                        {hasValidCoordinates && (<p className="mt-2 text-sm text-gray-600 text-center">Lat: {selectedWarehouse.lat!.toFixed(6)}, Lon: {selectedWarehouse.lon!.toFixed(6)}</p>)}
                      </div>
                    </div>
                )}

                {/* --- Tab Gói hàng --- */}
                {activeTab === 'packages' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Gói hàng trong kho</h3>
                      {isLoadingPackages ? ( <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>)
                          : warehousePackages?.packages && warehousePackages.packages.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian tạo</th></tr></thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                  {warehousePackages.packages.map((pkg: Package) => {
                                    const teaTypeName = getTeaTypeName(pkg.teacode);
                                    return (
                                        <tr key={pkg.packageId}>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pkg.fullname ?? 'N/A'}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTeaTypeColor(teaTypeName)}`}>{teaTypeName}</span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pkg.capacity ?? 'N/A'} {pkg.unit ?? ''}</td>
                                          {/* SỬ DỤNG HÀM ĐƠN GIẢN */}
                                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(pkg.status)}`}>
                                                                        {getStatusTranslation(pkg.status)}
                                                                    </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pkg.createdtime ? new Date(pkg.createdtime).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                        </tr>
                                    );
                                  })}
                                  </tbody>
                                </table>
                              </div>
                          ) : ( <p className="text-gray-500">Không có gói hàng nào trong kho này.</p> )}
                    </div>
                )}

                {/* --- Tab Lịch sử cân --- */}
                {activeTab === 'history' && (
                    <div>
                      <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-medium text-gray-900">Lịch sử cân</h3><span className="text-sm text-gray-500">Điểm cân: <span className="font-medium">{selectedWarehouse.name}</span></span></div>
                      {isLoadingPackages ? ( <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>)
                          : warehousePackages?.packages && warehousePackages.packages.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian cân</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khối lượng ({warehousePackages.packages.find(p => p.weightime)?.unit || 'kg'})</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại hàng</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chủ hàng</th></tr></thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                  {warehousePackages.packages
                                      .filter((pkg): pkg is Package & { weightime: string } => !!pkg.weightime)
                                      .sort((a, b) => new Date(b.weightime).getTime() - new Date(a.weightime).getTime())
                                      .map((pkg) => {
                                        const teaTypeName = getTeaTypeName(pkg.teacode);
                                        return (
                                            <tr key={`weigh-${pkg.packageId}`}>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(pkg.weightime).toLocaleString('vi-VN')}</td>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pkg.capacity}</td>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTeaTypeColor(teaTypeName)}`}>{teaTypeName}</span>
                                              </td>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pkg.fullname ?? 'N/A'}</td>
                                            </tr>
                                        );
                                      })}
                                  {warehousePackages.packages.filter(pkg => pkg.weightime).length === 0 && (<tr><td colSpan={4} className="px-6 py-4 text-sm text-gray-500 text-center">Không có dữ liệu lịch sử cân cho kho này.</td></tr>)}
                                  </tbody>
                                </table>
                              </div>
                          ) : ( <p className="text-gray-500">Không có dữ liệu gói hàng cho kho này.</p> )}
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
    );
  }

  // --- Render Danh sách Kho ---
  return (
      <div>
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto"><h1 className="text-2xl font-semibold leading-6 text-gray-900">Kho Hàng</h1><p className="mt-2 text-sm text-gray-700">Danh sách các kho hàng hiện có.</p></div>
        </div>
        {isLoadingWarehouses && <p className="text-sm text-gray-500">Đang tải danh sách kho...</p>}
        {!isLoadingWarehouses && (!warehousesList || warehousesList.length === 0) && (<p className="text-gray-500 mt-4">Không tìm thấy kho hàng nào.</p>)}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {warehousesList?.map((warehouse: Warehouse) => (
              <div key={warehouse.warehouseid} className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out" onClick={() => handleWarehouseClick(warehouse.warehouseid)}>
                <div className="p-5">
                  <div className="flex items-start"><div className="flex-shrink-0 pt-1"><MapPin className="h-6 w-6 text-indigo-600" /></div><div className="ml-4 flex-1"><h3 className="text-lg font-semibold text-gray-900 leading-tight">{warehouse.name}</h3><p className="text-sm text-gray-500 mt-1 break-words">{warehouse.address}</p></div></div>
                  <div className="mt-5"><p className="text-sm font-medium text-gray-500 mb-1">Sức chứa</p><div className="flex justify-between items-center text-sm mb-2"><span className="font-medium text-gray-900">{warehouse.currentcapacity} / {warehouse.totalcapacity}</span><span className="text-gray-600">{warehouse.totalcapacity > 0 ? Math.round((warehouse.currentcapacity / warehouse.totalcapacity) * 100) : 0}% đầy</span></div><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${warehouse.totalcapacity > 0 ? (warehouse.currentcapacity / warehouse.totalcapacity) * 100 : 0}%` }}></div></div></div>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}

export default Warehouses;