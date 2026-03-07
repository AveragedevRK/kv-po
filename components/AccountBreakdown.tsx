import React, { useState, useMemo } from 'react';
import { AccountStat } from '../types';
import { TrendingUp, Clock, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';

interface AccountBreakdownProps {
  accounts: AccountStat[];
}

type SortKey = 'investment' | 'profit' | 'turnover' | 'roi';

const AccountBreakdown: React.FC<AccountBreakdownProps> = ({ accounts }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'investment', direction: 'desc' });

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      if (sortConfig.key === 'roi') {
        aVal = (a.profit / a.investment) * 100;
        bVal = (b.profit / b.investment) * 100;
      } else {
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [accounts, sortConfig]);

  const SortButton = ({ label, sortKey }: { label: string; sortKey: SortKey }) => {
    const isActive = sortConfig.key === sortKey;
    const isAsc = sortConfig.direction === 'asc';

    return (
      <button
        onClick={() => handleSort(sortKey)}
        className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium border transition-colors duration-200 whitespace-nowrap flex-shrink-0
          ${isActive 
            ? 'bg-brand-100 border-brand-300 text-brand-800 dark:bg-brand-900/40 dark:border-brand-700 dark:text-brand-200' 
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-750'}
        `}
      >
        {label}
        {isActive && (
          <span className="ml-0.5 sm:ml-1">
            {isAsc ? <ArrowUp size={10} className="sm:w-3 sm:h-3" /> : <ArrowDown size={10} className="sm:w-3 sm:h-3" />}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold dark:text-brand-100 text-gray-800 transition-colors duration-200">Account Projection Breakdown</h2>
        
        <div className="flex items-center gap-1.5 sm:gap-2 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">Sort:</span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <SortButton label="Inv." sortKey="investment" />
            <SortButton label="Profit" sortKey="profit" />
            <SortButton label="Turn." sortKey="turnover" />
            <SortButton label="ROI" sortKey="roi" />
          </div>
        </div>
      </div>
      
      {/* Grid Layout: 1 col mobile, 2 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {sortedAccounts.map((account) => {
          const roi = ((account.profit / account.investment) * 100);
          return (
            <div 
              key={account.name} 
              className="bg-white dark:bg-gray-850 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-brand-500 mr-2 flex-shrink-0"></div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate" title={account.name}>
                    {account.name}
                  </h3>
                </div>
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 whitespace-nowrap flex-shrink-0">
                  <Clock size={10} className="mr-0.5 sm:mr-1 sm:w-3 sm:h-3" />
                  {account.turnover.toFixed(0)}d
                </span>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 flex items-center">
                    <DollarSign size={10} className="mr-0.5 sm:mr-1 sm:w-3 sm:h-3" /> Inv.
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-gray-200 text-sm sm:text-lg">
                    ${account.investment >= 1000 ? `${(account.investment/1000).toFixed(1)}k` : account.investment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 flex items-center justify-end">
                    <TrendingUp size={10} className="mr-0.5 sm:mr-1 sm:w-3 sm:h-3" /> Profit
                  </p>
                  <p className="font-semibold text-green-600 dark:text-green-400 text-sm sm:text-lg">
                    ${account.profit >= 1000 ? `${(account.profit/1000).toFixed(1)}k` : account.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Footer / ROI */}
              <div className="pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">ROI</span>
                <span className={`text-xs sm:text-sm font-bold ${roi >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-red-500'}`}>
                  {roi.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountBreakdown;
