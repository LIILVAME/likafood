import React from 'react';

// Base skeleton component
const Skeleton = ({ className = '', width = 'w-full', height = 'h-4', rounded = 'rounded' }) => {
  return (
    <div
      className={`${width} ${height} ${rounded} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s ease-in-out infinite',
      }}
    />
  );
};

// Card skeleton for dashboard metrics
export const MetricCardSkeleton = () => {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="w-16" height="h-16" rounded="rounded-full" />
        <Skeleton width="w-8" height="h-8" rounded="rounded" />
      </div>
      <Skeleton width="w-20" height="h-8" className="mb-2" />
      <Skeleton width="w-32" height="h-4" />
    </div>
  );
};

// Order card skeleton
export const OrderCardSkeleton = () => {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton width="w-32" height="h-5" className="mb-2" />
          <Skeleton width="w-24" height="h-4" />
        </div>
        <Skeleton width="w-20" height="h-6" rounded="rounded-full" />
      </div>
      
      <div className="space-y-2 mb-4">
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-3/4" height="h-4" />
      </div>
      
      <div className="flex items-center justify-between">
        <Skeleton width="w-20" height="h-6" />
        <div className="flex space-x-2">
          <Skeleton width="w-16" height="h-8" rounded="rounded-lg" />
          <Skeleton width="w-16" height="h-8" rounded="rounded-lg" />
        </div>
      </div>
    </div>
  );
};

// Dish card skeleton
export const DishCardSkeleton = () => {
  return (
    <div className="card">
      <div className="flex items-start space-x-4">
        <Skeleton width="w-20" height="h-20" rounded="rounded-lg" />
        <div className="flex-1">
          <Skeleton width="w-32" height="h-5" className="mb-2" />
          <Skeleton width="w-full" height="h-4" className="mb-2" />
          <Skeleton width="w-24" height="h-6" />
        </div>
        <div className="flex flex-col space-y-2">
          <Skeleton width="w-12" height="h-6" rounded="rounded-full" />
          <Skeleton width="w-8" height="h-8" rounded="rounded" />
        </div>
      </div>
    </div>
  );
};

// Table row skeleton
export const TableRowSkeleton = ({ columns = 4 }) => {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton width={index === 0 ? 'w-32' : 'w-24'} height="h-4" />
        </td>
      ))}
    </tr>
  );
};

// List skeleton
export const ListSkeleton = ({ items = 5, ItemComponent = OrderCardSkeleton }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <ItemComponent key={index} />
      ))}
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton width="w-48" height="h-8" className="mb-2" />
          <Skeleton width="w-32" height="h-5" />
        </div>
        <Skeleton width="w-32" height="h-10" rounded="rounded-lg" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <Skeleton width="w-40" height="h-6" className="mb-4" />
        <ListSkeleton items={3} ItemComponent={OrderCardSkeleton} />
      </div>
    </div>
  );
};

// Form skeleton
export const FormSkeleton = () => {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton width="w-24" height="h-5" className="mb-2" />
        <Skeleton width="w-full" height="h-12" rounded="rounded-lg" />
      </div>
      <div>
        <Skeleton width="w-32" height="h-5" className="mb-2" />
        <Skeleton width="w-full" height="h-32" rounded="rounded-lg" />
      </div>
      <div className="flex space-x-4">
        <Skeleton width="w-24" height="h-12" rounded="rounded-lg" />
        <Skeleton width="w-24" height="h-12" rounded="rounded-lg" />
      </div>
    </div>
  );
};

// Navigation skeleton
export const NavigationSkeleton = () => {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3">
          <Skeleton width="w-6" height="h-6" rounded="rounded" />
          <Skeleton width="w-20" height="h-4" />
        </div>
      ))}
    </div>
  );
};

// Text skeleton with multiple lines
export const TextSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? 'w-3/4' : 'w-full'}
          height="h-4"
        />
      ))}
    </div>
  );
};

// Image skeleton
export const ImageSkeleton = ({ width = 'w-full', height = 'h-48', rounded = 'rounded-lg' }) => {
  return (
    <div className={`${width} ${height} ${rounded} bg-gray-200 animate-pulse flex items-center justify-center`}>
      <svg
        className="w-12 h-12 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
};

export default Skeleton;