import React from 'react';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';
import { OverallStats } from '../types';

interface SummaryCardsProps {
  stats: OverallStats;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Investment - Brand Purple */}
      <div className="bg-white dark:bg-gray-850 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex items-center transition-colors duration-200 border-l-4 border-l-brand-500">
        <div className="p-3 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 mr-4 transition-colors duration-200">
          <DollarSign size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors duration-200">Total Investment</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">{formatCurrency(stats.totalInvestment)}</h3>
        </div>
      </div>

      {/* Anticipated Profit - Cyan */}
      <div className="bg-white dark:bg-gray-850 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex items-center transition-colors duration-200 border-l-4 border-l-cyan-500">
        <div className="p-3 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 mr-4 transition-colors duration-200">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors duration-200">Anticipated Profit</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">{formatCurrency(stats.totalProfit)}</h3>
        </div>
      </div>

      {/* Avg Turnover - Orange */}
      <div className="bg-white dark:bg-gray-850 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex items-center transition-colors duration-200 border-l-4 border-l-orange-500">
        <div className="p-3 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 mr-4 transition-colors duration-200">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors duration-200">Avg Turnover</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.avgTurnover} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">days</span></h3>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;