import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { users, warehouses } from '../lib/api';
import type { Package } from '../types/api';

function Packages() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
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

  const displayPackages = selectedWarehouse ? warehousePackages?.packages : packages;

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
          <h1 className="text-2xl font-semibold text-gray-900">Tea Packages</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all tea packages in your warehouses
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Package
          </button>
        </div>
      </div>

      <div className="mt-4">
        <select
          value={selectedWarehouse || ''}
          onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All Warehouses</option>
          {warehousesList?.map((warehouse) => (
            <option key={warehouse.warehouseid} value={warehouse.warehouseid}>
              {warehouse.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Quantity
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {displayPackages?.map((pkg: Package) => (
                    <tr key={pkg.packageId}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {pkg.fullname}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {pkg.typeteaname}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {pkg.capacity} {pkg.unit}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {pkg.status}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(pkg.createdtime).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
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