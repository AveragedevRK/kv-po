import React from 'react';
import { AccountStat } from '../types';
import { TrendingUp, Clock, DollarSign } from 'lucide-react';

interface AccountBreakdownProps {
  accounts: AccountStat[];
}

const AccountBreakdown: React.FC<AccountBreakdownProps> = ({ accounts }) => {
  const sortedAccounts = [...accounts].sort((a, b) => b.investment - a.investment);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 dark:text-brand-100 text-gray-800 transition-colors duration-200">Account Projection Breakdown</h2>
      
      {/* Grid Layout: 1 col mobile, 2 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {sortedAccounts.map((account) => {
          const roi = ((account.profit / account.investment) * 100);
          return (
            <div 
              key={account.name} 
              className="bg-white dark:bg-gray-850 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mr-2.5"></div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base truncate" title={account.name}>
                    {account.name}
                  </h3>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  <Clock size={12} className="mr-1" />
                  {account.turnover.toFixed(0)} days
                </span>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                    <DollarSign size={12} className="mr-1" /> Investment
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-gray-200 text-lg">
                    ${account.investment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-end">
                    <TrendingUp size={12} className="mr-1" /> Profit
                  </p>
                  <p className="font-semibold text-green-600 dark:text-green-400 text-lg">
                    ${account.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Footer / ROI */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ROI</span>
                <span className={`text-sm font-bold ${roi >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-red-500'}`}>
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