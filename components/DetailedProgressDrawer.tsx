import React, { useMemo } from 'react';
import { X, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { SkuDataWithId } from '../types';

interface DetailedProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: SkuDataWithId[];
}

// Calculate item status based on orders
function calculateItemStatus(item: SkuDataWithId): 'Processed' | 'Partial' | 'Pending' {
  if (!item.orders || item.orders.length === 0) {
    return 'Pending';
  }
  const orderSubtotal = item.orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  if (orderSubtotal >= item.investment) {
    return 'Processed';
  }
  if (orderSubtotal > 0) {
    return 'Partial';
  }
  return 'Pending';
}

// Radial Progress Chart Component
const RadialChart: React.FC<{
  percentage: number;
  color: 'green' | 'orange' | 'gray';
  size?: number;
  strokeWidth?: number;
}> = ({ percentage, color, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const colorClasses = {
    green: 'text-green-500',
    orange: 'text-orange-500',
    gray: 'text-gray-400 dark:text-gray-600',
  };
  
  const bgColorClasses = {
    green: 'text-green-500/20',
    orange: 'text-orange-500/20',
    gray: 'text-gray-300 dark:text-gray-700',
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={bgColorClasses[color]}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClasses[color]} transition-all duration-500`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

// Mini Radial for Account Cards
export const MiniRadialChart: React.FC<{
  percentage: number;
  size?: number;
}> = ({ percentage, size = 32 }) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  
  const getColor = () => {
    if (percentage >= 100) return 'text-green-500';
    if (percentage > 0) return 'text-orange-500';
    return 'text-gray-400';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getColor()} transition-all duration-300`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] font-bold text-gray-700 dark:text-gray-300">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

// Bar segment for simple bar chart
const BarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
}> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${item.color}`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Pie Chart Component
const PieChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
}> = ({ data, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-sm text-gray-400">No data</span>
      </div>
    );
  }
  
  let cumulativePercentage = 0;
  const segments = data.map((d) => {
    const percentage = (d.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    cumulativePercentage += percentage;
    const endAngle = (cumulativePercentage / 100) * 360;
    return { ...d, percentage, startAngle, endAngle };
  });
  
  const radius = size / 2;
  const innerRadius = radius * 0.6;
  
  const polarToCartesian = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: radius + r * Math.cos(rad),
      y: radius + r * Math.sin(rad),
    };
  };
  
  const createArcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const start = polarToCartesian(startAngle, outerR);
    const end = polarToCartesian(endAngle, outerR);
    const startInner = polarToCartesian(endAngle, innerR);
    const endInner = polarToCartesian(startAngle, innerR);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return [
      `M ${start.x} ${start.y}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
  };
  
  const colorMap: Record<string, string> = {
    'bg-green-500': '#22c55e',
    'bg-orange-500': '#f97316',
    'bg-gray-400': '#9ca3af',
  };

  return (
    <svg width={size} height={size} className="mx-auto">
      {segments.map((seg, idx) => {
        if (seg.percentage < 0.5) return null;
        return (
          <path
            key={idx}
            d={createArcPath(seg.startAngle, seg.endAngle - 0.5, radius - 2, innerRadius)}
            fill={colorMap[seg.color] || '#9ca3af'}
            className="transition-all duration-300"
          />
        );
      })}
    </svg>
  );
};

const DetailedProgressDrawer: React.FC<DetailedProgressDrawerProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  // Calculate all metrics
  const metrics = useMemo(() => {
    const totalInvestment = items.reduce((sum, item) => sum + item.investment, 0);
    const totalSKUs = items.length;
    
    let processedInvestment = 0;
    let partialInvestment = 0;
    let pendingInvestment = 0;
    let processedSKUs = 0;
    let partialSKUs = 0;
    let pendingSKUs = 0;
    
    items.forEach((item) => {
      const status = calculateItemStatus(item);
      const orderSubtotal = item.orders?.reduce((sum, o) => sum + (o.subtotal || 0), 0) || 0;
      
      if (status === 'Processed') {
        processedInvestment += item.investment;
        processedSKUs++;
      } else if (status === 'Partial') {
        partialInvestment += orderSubtotal;
        pendingInvestment += (item.investment - orderSubtotal);
        partialSKUs++;
      } else {
        pendingInvestment += item.investment;
        pendingSKUs++;
      }
    });
    
    const investmentProgress = totalInvestment > 0 
      ? ((processedInvestment + partialInvestment) / totalInvestment) * 100 
      : 0;
    const skuCompletion = totalSKUs > 0 ? (processedSKUs / totalSKUs) * 100 : 0;
    const partialCompletion = totalSKUs > 0 ? (partialSKUs / totalSKUs) * 100 : 0;
    
    return {
      totalInvestment,
      totalSKUs,
      processedInvestment,
      partialInvestment,
      pendingInvestment,
      processedSKUs,
      partialSKUs,
      pendingSKUs,
      investmentProgress,
      skuCompletion,
      partialCompletion,
    };
  }, [items]);

  // Calculate per-account metrics for export
  const accountMetrics = useMemo(() => {
    const accountMap: Record<string, { 
      totalInvestment: number; 
      processedInvestment: number;
      totalSKUs: number;
      processedSKUs: number;
    }> = {};
    
    items.forEach((item) => {
      if (!accountMap[item.account]) {
        accountMap[item.account] = { 
          totalInvestment: 0, 
          processedInvestment: 0,
          totalSKUs: 0,
          processedSKUs: 0,
        };
      }
      accountMap[item.account].totalInvestment += item.investment;
      accountMap[item.account].totalSKUs++;
      
      const status = calculateItemStatus(item);
      const orderSubtotal = item.orders?.reduce((sum, o) => sum + (o.subtotal || 0), 0) || 0;
      
      if (status === 'Processed') {
        accountMap[item.account].processedInvestment += item.investment;
        accountMap[item.account].processedSKUs++;
      } else if (status === 'Partial') {
        accountMap[item.account].processedInvestment += orderSubtotal;
      }
    });
    
    return accountMap;
  }, [items]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[540px] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-500" />
            Detailed Progress
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Top Section - Radial Progress Charts */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {/* Investment Progress */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 flex flex-col items-center">
              <RadialChart 
                percentage={metrics.investmentProgress} 
                color="green" 
                size={90}
                strokeWidth={8}
              />
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 text-center">Investment</p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 text-center">
                {formatCurrency(metrics.processedInvestment + metrics.partialInvestment)} / {formatCurrency(metrics.totalInvestment)}
              </p>
            </div>
            
            {/* SKU Completion */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 flex flex-col items-center">
              <RadialChart 
                percentage={metrics.skuCompletion} 
                color="green" 
                size={90}
                strokeWidth={8}
              />
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 text-center">Completed</p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 text-center">
                {metrics.processedSKUs} / {metrics.totalSKUs} SKUs
              </p>
            </div>
            
            {/* Partial Completion */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 flex flex-col items-center">
              <RadialChart 
                percentage={metrics.partialCompletion} 
                color="orange" 
                size={90}
                strokeWidth={8}
              />
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 text-center">Partial</p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 text-center">
                {metrics.partialSKUs} SKUs
              </p>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Investment Distribution Pie Chart */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Package size={14} />
                Investment Distribution
              </h3>
              <div className="flex flex-col items-center">
                <PieChart 
                  data={[
                    { label: 'Processed', value: metrics.processedInvestment, color: 'bg-green-500' },
                    { label: 'Partial', value: metrics.partialInvestment, color: 'bg-orange-500' },
                    { label: 'Pending', value: metrics.pendingInvestment, color: 'bg-gray-400' },
                  ]}
                  size={140}
                />
                <div className="flex flex-wrap justify-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">Processed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">Partial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">Pending</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* SKU Status Bar Chart */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <AlertCircle size={14} />
                SKU Status
              </h3>
              <BarChart 
                data={[
                  { label: 'Processed', value: metrics.processedSKUs, color: 'bg-green-500' },
                  { label: 'Partial', value: metrics.partialSKUs, color: 'bg-orange-500' },
                  { label: 'Pending', value: metrics.pendingSKUs, color: 'bg-gray-400' },
                ]}
              />
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-brand-100 dark:border-brand-800/30">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Investment</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalInvestment)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Processed</p>
                <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(metrics.processedInvestment)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(metrics.partialInvestment)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                <p className="font-bold text-gray-600 dark:text-gray-400">{formatCurrency(metrics.pendingInvestment)}</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
};

// Export the account metrics calculation for use in AccountBreakdown
export function calculateAccountProgress(items: SkuDataWithId[], accountName: string) {
  const accountItems = items.filter(item => item.account === accountName);
  const totalInvestment = accountItems.reduce((sum, item) => sum + item.investment, 0);
  const totalSKUs = accountItems.length;
  
  let processedInvestment = 0;
  let processedSKUs = 0;
  
  accountItems.forEach((item) => {
    const status = calculateItemStatus(item);
    const orderSubtotal = item.orders?.reduce((sum, o) => sum + (o.subtotal || 0), 0) || 0;
    
    if (status === 'Processed') {
      processedInvestment += item.investment;
      processedSKUs++;
    } else if (status === 'Partial') {
      processedInvestment += orderSubtotal;
    }
  });
  
  return {
    investmentProgress: totalInvestment > 0 ? (processedInvestment / totalInvestment) * 100 : 0,
    processedSKUs,
    totalSKUs,
  };
}

export default DetailedProgressDrawer;
