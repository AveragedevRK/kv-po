import React from 'react';

// Animated shimmer gradient for skeleton elements
const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

// Base skeleton block
const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-800 rounded ${shimmerClass} ${className}`} />
);

// Summary Cards Skeleton
export const SummaryCardsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <SkeletonBlock className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
          <SkeletonBlock className="h-3 sm:h-4 w-20 sm:w-24" />
        </div>
        <SkeletonBlock className="h-6 sm:h-8 w-28 sm:w-32 mb-2" />
        <SkeletonBlock className="h-2.5 sm:h-3 w-16 sm:w-20" />
      </div>
    ))}
  </div>
);

// Account Breakdown Skeleton
export const AccountBreakdownSkeleton: React.FC = () => (
  <div>
    <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
      <SkeletonBlock className="h-5 sm:h-6 w-48 sm:w-56" />
      <div className="flex gap-1.5 sm:gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-6 sm:h-7 w-14 sm:w-20 rounded-full flex-shrink-0" />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850">
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <SkeletonBlock className="h-4 sm:h-5 w-20 sm:w-24" />
            <SkeletonBlock className="h-4 sm:h-5 w-12 sm:w-16 rounded-full" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="flex justify-between">
                <SkeletonBlock className="h-3 sm:h-4 w-16 sm:w-20" />
                <SkeletonBlock className="h-3 sm:h-4 w-12 sm:w-16" />
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
  <div className="rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 overflow-hidden">
    {/* Header */}
    <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
        <SkeletonBlock className="h-5 sm:h-6 w-24 sm:w-32" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-8 sm:h-9 flex-1 sm:flex-none sm:w-32 rounded-lg" />
          <SkeletonBlock className="h-8 sm:h-9 w-24 sm:w-28 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-1.5 sm:gap-2 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-6 sm:h-7 w-12 sm:w-20 rounded-full flex-shrink-0" />
        ))}
      </div>
    </div>
    
    {/* Table Header - Desktop only */}
    <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      {['SKU', 'Account', 'Category', 'Turnover', 'Investment', 'Profit', 'Status'].map((_, i) => (
        <SkeletonBlock key={i} className="h-4 w-full" />
      ))}
    </div>
    
    {/* Table Rows - Desktop */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {[1, 2, 3, 4, 5].map((i) => (
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
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="md:hidden p-3 sm:p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <SkeletonBlock className="h-4 sm:h-5 w-28 sm:w-32 mb-1" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
            <SkeletonBlock className="h-5 w-16 sm:w-20 rounded flex-shrink-0" />
          </div>
          <SkeletonBlock className="h-5 w-20 rounded-full mb-2" />
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
            {[1, 2, 3].map((j) => (
              <div key={j}>
                <SkeletonBlock className="h-2.5 w-10 mb-1" />
                <SkeletonBlock className="h-3.5 w-14" />
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
