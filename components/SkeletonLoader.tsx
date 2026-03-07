import React from 'react';

// Animated shimmer gradient for skeleton elements
const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

// Base skeleton block
const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-800 rounded ${shimmerClass} ${className}`} />
);

// Summary Cards Skeleton
export const SummaryCardsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850">
        <div className="flex items-center gap-3 mb-4">
          <SkeletonBlock className="w-10 h-10 rounded-lg" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
        <SkeletonBlock className="h-8 w-32 mb-2" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
    ))}
  </div>
);

// Account Breakdown Skeleton
export const AccountBreakdownSkeleton: React.FC = () => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <SkeletonBlock className="h-6 w-56" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850">
          <div className="flex items-center justify-between mb-4">
            <SkeletonBlock className="h-5 w-24" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex justify-between">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// SKU Table Skeleton
export const SkuTableSkeleton: React.FC = () => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 overflow-hidden">
    {/* Header */}
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBlock className="h-6 w-32" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <SkeletonBlock className="h-10 flex-1 rounded-lg" />
        <SkeletonBlock className="h-10 w-32 rounded-lg" />
      </div>
    </div>
    
    {/* Table Header */}
    <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      {['SKU', 'Account', 'Category', 'Turnover', 'Investment', 'Profit', 'Status'].map((_, i) => (
        <SkeletonBlock key={i} className="h-4 w-full" />
      ))}
    </div>
    
    {/* Table Rows */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="hidden md:grid grid-cols-7 gap-4 px-6 py-4 items-center">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-6 w-20 rounded-full" />
        </div>
      ))}
      
      {/* Mobile Cards */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="md:hidden p-4">
          <div className="flex justify-between items-start mb-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-5 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j}>
                <SkeletonBlock className="h-3 w-16 mb-1" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Full Page Skeleton combining all sections
export const PageSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    {/* Overview Section */}
    <div>
      <SkeletonBlock className="h-6 w-24 mb-4" />
      <SummaryCardsSkeleton />
    </div>
    
    {/* Account Breakdown Section */}
    <AccountBreakdownSkeleton />
    
    {/* SKU Table Section */}
    <SkuTableSkeleton />
  </div>
);

// Header Skeleton for when PO is not selected
export const HeaderSkeleton: React.FC = () => (
  <div className="flex items-center gap-3">
    <SkeletonBlock className="h-7 w-40" />
    <SkeletonBlock className="h-5 w-20 rounded-full" />
  </div>
);

export default PageSkeleton;
