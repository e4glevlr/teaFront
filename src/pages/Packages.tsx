import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter, X } from 'lucide-react';
import { users, warehouses } from '../lib/api';
import type { Package } from '../types/api';

function Packages() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [selectedTeaType, setSelectedTeaType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<{startDate: string, endDate: string}>({
    startDate: '',
    endDate: ''
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: packages, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['packages'],
    queryFn: users.getAllPackages,
  });



  const { data: warehousesList, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouses.getAll,
  });

  const { data: warehousePackages } = useQuery({
    queryKey: ['warehousePackages', selectedWarehouse],
    queryFn: () => selectedWarehouse ? warehouses.getPackages(selectedWarehouse) : null,
    enabled: !!selectedWarehouse,
  });

  // Get all packages based on warehouse selection
  let displayPackages = packages || [];

  // Apply additional filters
  if (displayPackages) {

    if (selectedWarehouse) {
      displayPackages = displayPackages.filter(pkg => pkg.warehouse === selectedWarehouse);
    }

    // Filter by tea type
    if (selectedTeaType) {
      displayPackages = displayPackages.filter(pkg =>
          pkg.typeteaname.toLowerCase() === selectedTeaType.toLowerCase()
      );
    }

    // Filter by status
    if (selectedStatus) {
      displayPackages = displayPackages.filter(pkg => pkg.status === selectedStatus);
    }

    // Filter by date range
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      displayPackages = displayPackages.filter(pkg =>
          new Date(pkg.createdtime) >= startDate
      );
    }

    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      displayPackages = displayPackages.filter(pkg =>
          new Date(pkg.createdtime) <= endDate
      );
    }
  }

  // Extract unique tea types for filter dropdown
  const teaTypes = packages ? [...new Set(packages.map(pkg => pkg.typeteaname))] : [];

  // Extract unique statuses for filter dropdown
  const statuses = packages ? [...new Set(packages.map(pkg => pkg.status))] : [];

  // Function to determine status color based on status value
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Weighn't yet":
        return 'bg-red-100 text-red-800'; // Red for packages not weighed yet
      case "Weighed":
        return 'bg-yellow-100 text-yellow-800'; // Yellow for weighed packages
      case "Scanned":
        return 'bg-purple-100 text-purple-800'; // Purple for scanned packages
      case "Wait Delivery":
        return 'bg-blue-100 text-blue-800'; // Blue for packages waiting for delivery
      default:
        return 'bg-gray-100 text-gray-800'; // Default gray
    }
  };

  // Function to determine tea type color
  const getTeaTypeColor = (teaType: string) => {
    switch (teaType.toLowerCase()) {
      case "che thai":
        return 'bg-blue-100 text-blue-800'; // Blue for Che Thai
      case "che trung quoc":
        return 'bg-yellow-100 text-yellow-800'; // Yellow for Che Trung Quoc
      default:
        return 'bg-green-100 text-green-800'; // Green for other types
    }
  };

  // Function to get Vietnamese translation of status
  const getStatusTranslation = (status: string) => {
    switch (status) {
      case "Weighn't yet":
        return 'Chưa cân';
      case "Weighed":
        return 'Đã cân';
      case "Scanned":
        return 'Đã quét QR';
      case "Wait Delivery":
        return 'Chờ vận chuyển';
      default:
        return status;
    }
  };

  // Function to find warehouse name by ID - updated to handle string IDs
  const getWarehouseName = (warehouseId: string | number) => {
    // Convert to number if it's a string
    const id = typeof warehouseId === 'string' ? parseInt(warehouseId, 10) : warehouseId;
    const warehouse = warehousesList?.find(w => w.warehouseid === id);
    return warehouse ? warehouse.name : 'Unknown';
  };

  // Function to reset all filters
  const resetFilters = () => {
    setSelectedWarehouse(null);
    setSelectedTeaType('');
    setSelectedStatus('');
    setDateRange({ startDate: '', endDate: '' });
  };

  // Count active filters
  const activeFilterCount = [
    selectedWarehouse,
    selectedTeaType,
    selectedStatus,
    dateRange.startDate,
    dateRange.endDate
  ].filter(Boolean).length;

  if (isLoadingPackages || isLoadingWarehouses) {
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
            <h1 className="text-2xl font-semibold text-gray-900">Trà</h1>
            <p className="mt-2 text-sm text-gray-700">
              Hiển thị tất cả gói trà của bạn trong kho
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Lọc
              {activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {isFilterOpen && (
            <div className="mt-4 bg-white p-4 shadow rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bộ lọc</h3>
                <div className="flex space-x-2">
                  <button
                      onClick={resetFilters}
                      className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Đặt lại
                  </button>
                  <button
                      onClick={() => setIsFilterOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Warehouse filter */}
                <div>
                  <label htmlFor="warehouse-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Kho
                  </label>
                  <select
                      id="warehouse-filter"
                      value={selectedWarehouse || ''}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">Tất cả kho</option>
                    {warehousesList?.map((warehouse) => (
                        <option key={warehouse.name} value={warehouse.name}>
                          {warehouse.name}
                        </option>
                    ))}
                  </select>
                </div>

                {/* Tea type filter */}
                <div>
                  <label htmlFor="tea-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Loại trà
                  </label>
                  <select
                      id="tea-type-filter"
                      value={selectedTeaType}
                      onChange={(e) => setSelectedTeaType(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">Tất cả loại</option>
                    {teaTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                      id="status-filter"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">Tất cả trạng thái</option>
                    {statuses.map((status) => (
                        <option key={status} value={status}>
                          {getStatusTranslation(status)}
                        </option>
                    ))}
                  </select>
                </div>

                {/* Date range filter */}
                <div>
                  <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
                    Khoảng thời gian
                  </label>
                  <div className="flex space-x-2">
                    <input
                        type="date"
                        id="date-from"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        placeholder="Từ ngày"
                    />
                    <input
                        type="date"
                        id="date-to"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        placeholder="Đến ngày"
                    />
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-700">
          Hiển thị {displayPackages?.length || 0} kết quả
          {activeFilterCount > 0 && " (đã lọc)"}
        </div>

        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Tên
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Loại
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Số Lượng
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Kho
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Trạng Thái
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Thời Gian Khởi Tạo
                    </th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                  {displayPackages?.length ? (
                      displayPackages.map((pkg: Package) => (
                          <tr key={pkg.packageId}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                              {pkg.fullname}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTeaTypeColor(pkg.typeteaname)}`}
                          >
                            {pkg.typeteaname}
                          </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {pkg.capacity} {pkg.unit}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {pkg.warehouse}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(pkg.status)}`}
                            title={getStatusTranslation(pkg.status)}
                        >
                          {getStatusTranslation(pkg.status)}
                        </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(pkg.createdtime).toLocaleDateString()}
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-sm text-gray-500 text-center">
                          Không tìm thấy kết quả phù hợp với bộ lọc đã chọn
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default Packages;
