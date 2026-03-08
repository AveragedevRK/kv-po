import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { SkuDataWithId } from '../types';

interface DetailedProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: SkuDataWithId[];
}

interface ProgressData {
  totalInvestment: number;
  processedInvestment: number;
  partialInvestment: number;
  pendingInvestment: number;
  totalSKUs: number;
  processedSKUs: number;
  partialSKUs: number;
  pendingSKUs: number;
}

interface AccountProgress {
  name: string;
  totalInvestment: number;
  processedInvestment: number;
  percentage: number;
}

// Calculate progress from items
function calculateProgress(items: SkuDataWithId[]): ProgressData {
  let totalInvestment = 0;
  let processedInvestment = 0;
  let partialInvestment = 0;
  let pendingInvestment = 0;
  let processedSKUs = 0;
  let partialSKUs = 0;
  let pendingSKUs = 0;

  items.forEach(item => {
    const investment = item.investment || 0;
    totalInvestment += investment;

    const orderSubtotal = (item.orders || []).reduce((sum, order) => sum + (order.subtotal || 0), 0);

    if (item.orders && item.orders.length > 0) {
      if (orderSubtotal >= investment) {
        processedInvestment += investment;
        processedSKUs++;
      } else if (orderSubtotal > 0) {
        partialInvestment += investment;
        partialSKUs++;
      } else {
        pendingInvestment += investment;
        pendingSKUs++;
      }
    } else {
      pendingInvestment += investment;
      pendingSKUs++;
    }
  });

  return {
    totalInvestment,
    processedInvestment,
    partialInvestment,
    pendingInvestment,
    totalSKUs: items.length,
    processedSKUs,
    partialSKUs,
    pendingSKUs,
  };
}

// Calculate progress per account
export function calculateAccountProgress(items: SkuDataWithId[], accountName?: string): AccountProgress {
  const accountItems = accountName 
    ? items.filter(item => item.account === accountName)
    : items;

  let totalInvestment = 0;
  let processedInvestment = 0;

  accountItems.forEach(item => {
    const investment = item.investment || 0;
    totalInvestment += investment;

    const orderSubtotal = (item.orders || []).reduce((sum, order) => sum + (order.subtotal || 0), 0);

    if (item.orders && item.orders.length > 0 && orderSubtotal >= investment) {
      processedInvestment += investment;
    }
  });

  return {
    name: accountName || 'All',
    totalInvestment,
    processedInvestment,
    percentage: totalInvestment > 0 ? (processedInvestment / totalInvestment) * 100 : 0,
  };
}

// Get all unique accounts with progress
function getAccountsProgress(items: SkuDataWithId[]): AccountProgress[] {
  const accountNames = [...new Set(items.map(item => item.account))];
  return accountNames
    .map(name => calculateAccountProgress(items, name))
    .sort((a, b) => b.percentage - a.percentage);
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

// Progress Bar with segments
const ProgressBar: React.FC<{
  processedPercent: number;
  partialPercent: number;
  delay?: number;
}> = ({ processedPercent, partialPercent, delay = 0 }) => {
  const [processedWidth, setProcessedWidth] = useState(0);
  const [partialWidth, setPartialWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProcessedWidth(processedPercent);
      setPartialWidth(partialPercent);
    }, delay);
    return () => clearTimeout(timer);
  }, [processedPercent, partialPercent, delay]);

  return (
    <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
      <div className="h-full flex">
        <div 
          className="h-full bg-blue-500 transition-all duration-1000 ease-out"
          style={{ width: `${processedWidth}%` }}
        />
        <div 
          className="h-full bg-blue-400/50 transition-all duration-1000 ease-out"
          style={{ width: `${partialWidth}%`, transitionDelay: '100ms' }}
        />
      </div>
    </div>
  );
};

// Mini Progress Bar for Account Breakdown
const MiniProgressBar: React.FC<{ percentage: number; delay?: number }> = ({ percentage, delay = 0 }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-500 transition-all duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

// Mini Radial for Account Cards (simplified version for external use)
export const MiniRadialChart: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 28 }) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-blue-500 transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-medium text-gray-400">
        {Math.round(animatedPercent)}%
      </span>
    </div>
  );
};

// Animated Number Counter
const AnimatedNumber: React.FC<{ 
  value: number; 
  format?: 'currency' | 'number';
  delay?: number;
}> = ({ value, format = 'number', delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 800;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      let step = 0;
      
      const interval = setInterval(() => {
        step++;
        current = Math.min(current + increment, value);
        setDisplayValue(current);
        if (step >= steps) {
          setDisplayValue(value);
          clearInterval(interval);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  if (format === 'currency') {
    return <>{formatCurrency(displayValue)}</>;
  }
  return <>{Math.round(displayValue)}</>;
};

const DetailedProgressDrawer: React.FC<DetailedProgressDrawerProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const progress = calculateProgress(items);
  const accountsProgress = getAccountsProgress(items);

  // Calculate percentages
  const processedInvestPercent = progress.totalInvestment > 0
    ? (progress.processedInvestment / progress.totalInvestment) * 100
    : 0;
  const partialInvestPercent = progress.totalInvestment > 0
    ? (progress.partialInvestment / progress.totalInvestment) * 100
    : 0;
  const processedSkuPercent = progress.totalSKUs > 0
    ? (progress.processedSKUs / progress.totalSKUs) * 100
    : 0;
  const partialSkuPercent = progress.totalSKUs > 0
    ? (progress.partialSKUs / progress.totalSKUs) * 100
    : 0;

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 100);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[440px] bg-gray-900 border-l border-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Progress Overview</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5 overflow-y-auto h-[calc(100%-57px)] space-y-6">
          
          {/* Section 1: Investment Progress */}
          <section className="animate-fade-in" style={{ animationDelay: '0ms' }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Investment Progress</p>
            <h3 className="text-2xl font-bold text-white mb-4">
              <AnimatedNumber value={progress.processedInvestment} format="currency" delay={100} />
              <span className="text-gray-500 font-normal text-base"> deployed of </span>
              <AnimatedNumber value={progress.totalInvestment} format="currency" delay={100} />
            </h3>

            <ProgressBar 
              processedPercent={processedInvestPercent}
              partialPercent={partialInvestPercent}
              delay={200}
            />

            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <div>
                  <p className="text-[11px] text-gray-500">Processed</p>
                  <p className="text-sm font-medium text-white">
                    <AnimatedNumber value={progress.processedInvestment} format="currency" delay={300} />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-400/50" />
                <div>
                  <p className="text-[11px] text-gray-500">Partial</p>
                  <p className="text-sm font-medium text-white">
                    <AnimatedNumber value={progress.partialInvestment} format="currency" delay={350} />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-gray-600" />
                <div>
                  <p className="text-[11px] text-gray-500">Pending</p>
                  <p className="text-sm font-medium text-white">
                    <AnimatedNumber value={progress.pendingInvestment} format="currency" delay={400} />
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Section 2: SKU Progress */}
          <section className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">SKU Progress</p>
            <h3 className="text-2xl font-bold text-white mb-4">
              <AnimatedNumber value={progress.processedSKUs} delay={250} />
              <span className="text-gray-500 font-normal text-base"> / {progress.totalSKUs} SKUs processed</span>
            </h3>

            <ProgressBar 
              processedPercent={processedSkuPercent}
              partialPercent={partialSkuPercent}
              delay={350}
            />

            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <div>
                  <p className="text-[11px] text-gray-500">Processed</p>
                  <p className="text-sm font-medium text-white">
                    <AnimatedNumber value={progress.processedSKUs} delay={450} />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-400/50" />
                <div>
                  <p className="text-[11px] text-gray-500">Partial</p>
                  <p className="text-sm font-medium text-white">
                    <AnimatedNumber value={progress.partialSKUs} delay={500} />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-gray-600" />
                <div>
                  <p className="text-[11px] text-gray-500">Pending</p>
                  <p className="text-sm font-medium text-white">
                    <AnimatedNumber value={progress.pendingSKUs} delay={550} />
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Section 3: Account Breakdown */}
          <section className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Account Breakdown</p>
            <div className="space-y-4">
              {accountsProgress.map((account, index) => (
                <div 
                  key={account.name} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${400 + index * 60}ms` }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">{account.name}</span>
                    <span className="text-xs text-gray-500 tabular-nums">
                      {formatCurrency(account.processedInvestment)} / {formatCurrency(account.totalInvestment)}
                    </span>
                  </div>
                  <MiniProgressBar percentage={account.percentage} delay={500 + index * 60} />
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default DetailedProgressDrawer;
