import React, { useMemo, useEffect, useState } from 'react';
import { X, TrendingUp, Package, BarChart2, Sparkles } from 'lucide-react';
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

// Animated Radial Progress Chart Component
const RadialChart: React.FC<{
  percentage: number;
  color: 'brand' | 'cyan' | 'orange' | 'gray';
  size?: number;
  strokeWidth?: number;
  delay?: number;
  label: string;
  subLabel?: string;
}> = ({ percentage, color, size = 110, strokeWidth = 10, delay = 0, label, subLabel }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;
  
  const gradientId = `gradient-${color}-${Math.random().toString(36).substr(2, 9)}`;
  
  const gradientColors = {
    brand: ['#8b5cf6', '#a855f7', '#d946ef'],
    cyan: ['#06b6d4', '#22d3ee', '#67e8f9'],
    orange: ['#f97316', '#fb923c', '#fdba74'],
    gray: ['#6b7280', '#9ca3af', '#d1d5db'],
  };

  return (
    <div className="flex flex-col items-center group">
      <div 
        className="relative transform transition-all duration-500 ease-out group-hover:scale-105" 
        style={{ width: size, height: size }}
      >
        {/* Glow effect */}
        <div 
          className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${
            color === 'brand' ? 'bg-brand-500' : 
            color === 'cyan' ? 'bg-cyan-500' : 
            color === 'orange' ? 'bg-orange-500' : 'bg-gray-500'
          }`}
        />
        
        <svg className="transform -rotate-90 relative z-10" width={size} height={size}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors[color][0]} />
              <stop offset="50%" stopColor={gradientColors[color][1]} />
              <stop offset="100%" stopColor={gradientColors[color][2]} />
            </linearGradient>
            <filter id={`shadow-${gradientId}`}>
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={gradientColors[color][0]} floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700/50"
          />
          
          {/* Animated progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `url(#shadow-${gradientId})` }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className={`text-2xl sm:text-3xl font-bold bg-gradient-to-br ${
            color === 'brand' ? 'from-brand-500 to-purple-600' : 
            color === 'cyan' ? 'from-cyan-500 to-teal-600' : 
            color === 'orange' ? 'from-orange-500 to-amber-600' : 'from-gray-500 to-gray-600'
          } bg-clip-text text-transparent transition-all duration-300`}>
            {animatedPercentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mt-3 text-center transition-colors">
        {label}
      </p>
      {subLabel && (
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center mt-0.5">
          {subLabel}
        </p>
      )}
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
  
  const getGradient = () => {
    if (percentage >= 100) return { from: '#22c55e', to: '#10b981' };
    if (percentage > 0) return { from: '#f97316', to: '#fb923c' };
    return { from: '#9ca3af', to: '#d1d5db' };
  };
  
  const colors = getGradient();
  const gradientId = `mini-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
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
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
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

// Animated Bar Chart with staggered entrance
const AnimatedBarChart: React.FC<{
  data: { label: string; value: number; color: string; gradient: string }[];
  delay?: number;
}> = ({ data, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="space-y-4">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-1.5 group/bar">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 group-hover/bar:text-gray-900 dark:group-hover/bar:text-white transition-colors">
              {item.label}
            </span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {item.value}
            </span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden relative">
            {/* Shimmer background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer opacity-0 group-hover/bar:opacity-100" />
            
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${item.gradient}`}
              style={{ 
                width: isVisible ? `${(item.value / maxValue) * 100}%` : '0%',
                transitionDelay: `${idx * 150}ms`
              }}
            >
              {/* Inner shine */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Animated Donut Pie Chart
const AnimatedPieChart: React.FC<{
  data: { label: string; value: number; color: string; gradient: { from: string; to: string } }[];
  size?: number;
  delay?: number;
}> = ({ data, size = 160, delay = 0 }) => {
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 1) {
            clearInterval(interval);
            return 1;
          }
          return prev + 0.02;
        });
      }, 16);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-sm text-gray-400 dark:text-gray-500">No data</span>
      </div>
    );
  }
  
  let cumulativePercentage = 0;
  const segments = data.map((d, idx) => {
    const percentage = (d.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    cumulativePercentage += percentage;
    const endAngle = (cumulativePercentage / 100) * 360;
    return { ...d, percentage, startAngle, endAngle, idx };
  });
  
  const radius = size / 2;
  const innerRadius = radius * 0.55;
  
  const polarToCartesian = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: radius + r * Math.cos(rad),
      y: radius + r * Math.sin(rad),
    };
  };
  
  const createArcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const animatedEndAngle = startAngle + (endAngle - startAngle) * animationProgress;
    const start = polarToCartesian(startAngle, outerR);
    const end = polarToCartesian(animatedEndAngle, outerR);
    const startInner = polarToCartesian(animatedEndAngle, innerR);
    const endInner = polarToCartesian(startAngle, innerR);
    const largeArcFlag = animatedEndAngle - startAngle > 180 ? 1 : 0;
    
    return [
      `M ${start.x} ${start.y}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
  };

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-brand-500/20 to-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <svg width={size} height={size} className="relative z-10 transform transition-transform duration-300 group-hover:scale-105">
        <defs>
          {segments.map((seg) => (
            <linearGradient key={`grad-${seg.idx}`} id={`pie-gradient-${seg.idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={seg.gradient.from} />
              <stop offset="100%" stopColor={seg.gradient.to} />
            </linearGradient>
          ))}
        </defs>
        
        {segments.map((seg) => {
          if (seg.percentage < 0.5) return null;
          return (
            <path
              key={seg.idx}
              d={createArcPath(seg.startAngle, seg.endAngle - 1, radius - 4, innerRadius)}
              fill={`url(#pie-gradient-${seg.idx})`}
              className="transition-all duration-300 hover:opacity-80"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
          );
        })}
        
        {/* Center circle */}
        <circle
          cx={radius}
          cy={radius}
          r={innerRadius - 4}
          className="fill-white dark:fill-gray-800 transition-colors"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <Sparkles size={16} className="text-brand-500 dark:text-brand-400 mb-1" />
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Distribution</span>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: string;
  color: 'brand' | 'cyan' | 'orange' | 'gray';
  delay?: number;
}> = ({ label, value, color, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  const colorClasses = {
    brand: 'from-brand-500 to-purple-600',
    cyan: 'from-cyan-500 to-teal-600',
    orange: 'from-orange-500 to-amber-600',
    gray: 'from-gray-500 to-gray-600',
  };
  
  return (
    <div 
      className={`transform transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm sm:text-base font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
        {value}
      </p>
    </div>
  );
};

const DetailedProgressDrawer: React.FC<DetailedProgressDrawerProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);
  
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

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[540px] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-all duration-500 ease-out overflow-hidden flex flex-col ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header with gradient border */}
        <div className="relative flex-shrink-0">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
          <div className="flex items-center justify-between p-4 sm:p-5">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 shadow-lg shadow-brand-500/20">
                <TrendingUp size={18} className="text-white" />
              </div>
              Detailed Progress
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Content with custom scrollbar */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          
          {/* Radial Progress Charts */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <RadialChart 
                percentage={metrics.investmentProgress} 
                color="brand" 
                size={100}
                strokeWidth={9}
                delay={100}
                label="Investment"
                subLabel={`${formatCurrency(metrics.processedInvestment + metrics.partialInvestment)} / ${formatCurrency(metrics.totalInvestment)}`}
              />
              
              <RadialChart 
                percentage={metrics.skuCompletion} 
                color="cyan" 
                size={100}
                strokeWidth={9}
                delay={250}
                label="Completed"
                subLabel={`${metrics.processedSKUs} / ${metrics.totalSKUs} SKUs`}
              />
              
              <RadialChart 
                percentage={metrics.partialCompletion} 
                color="orange" 
                size={100}
                strokeWidth={9}
                delay={400}
                label="In Progress"
                subLabel={`${metrics.partialSKUs} SKUs`}
              />
            </div>
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Investment Distribution */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Package size={16} className="text-brand-500" />
                Investment Distribution
              </h3>
              <div className="flex flex-col items-center">
                <AnimatedPieChart 
                  data={[
                    { label: 'Processed', value: metrics.processedInvestment, color: 'bg-green-500', gradient: { from: '#22c55e', to: '#10b981' } },
                    { label: 'Partial', value: metrics.partialInvestment, color: 'bg-orange-500', gradient: { from: '#f97316', to: '#fb923c' } },
                    { label: 'Pending', value: metrics.pendingInvestment, color: 'bg-gray-400', gradient: { from: '#9ca3af', to: '#d1d5db' } },
                  ]}
                  size={140}
                  delay={500}
                />
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {[
                    { label: 'Processed', color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
                    { label: 'Partial', color: 'bg-gradient-to-r from-orange-500 to-amber-500' },
                    { label: 'Pending', color: 'bg-gradient-to-r from-gray-400 to-gray-500' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 group cursor-default">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color} group-hover:scale-125 transition-transform`} />
                      <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* SKU Status */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-cyan-500" />
                SKU Status
              </h3>
              <AnimatedBarChart 
                data={[
                  { label: 'Processed', value: metrics.processedSKUs, color: 'bg-green-500', gradient: 'bg-gradient-to-r from-green-500 to-emerald-400' },
                  { label: 'In Progress', value: metrics.partialSKUs, color: 'bg-orange-500', gradient: 'bg-gradient-to-r from-orange-500 to-amber-400' },
                  { label: 'Pending', value: metrics.pendingSKUs, color: 'bg-gray-400', gradient: 'bg-gradient-to-r from-gray-400 to-gray-300 dark:from-gray-500 dark:to-gray-400' },
                ]}
                delay={600}
              />
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-purple-50 to-cyan-50 dark:from-brand-900/20 dark:via-purple-900/10 dark:to-cyan-900/20 rounded-2xl p-4 sm:p-5 border border-brand-100/50 dark:border-brand-800/30">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-500/10 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-2xl" />
            
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 relative z-10">
              <Sparkles size={16} className="text-brand-500" />
              Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <StatCard 
                label="Total Investment" 
                value={formatCurrency(metrics.totalInvestment)} 
                color="brand" 
                delay={700}
              />
              <StatCard 
                label="Processed" 
                value={formatCurrency(metrics.processedInvestment)} 
                color="cyan" 
                delay={800}
              />
              <StatCard 
                label="In Progress" 
                value={formatCurrency(metrics.partialInvestment)} 
                color="orange" 
                delay={900}
              />
              <StatCard 
                label="Pending" 
                value={formatCurrency(metrics.pendingInvestment)} 
                color="gray" 
                delay={1000}
              />
            </div>
          </div>
          
        </div>
      </div>
      
      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
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
