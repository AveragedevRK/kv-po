import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { SkuDataWithId, SkuCategory } from '../types';

interface SkuTableProps {
  data: SkuDataWithId[];
  onRowClick?: (item: SkuDataWithId) => void;
}

const SkuTable: React.FC<SkuTableProps> = ({ data, onRowClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof SkuData; direction: 'asc' | 'desc' } | null>(null);

  const categories = ['All', ...Object.values(SkuCategory)];

  const handleSort = (key: keyof SkuData) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    // Toggle direction if already selected
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else if (key === 'investment' || key === 'profit' || key === 'turnover') {
       // Default to descending for numbers (seeing highest first is better)
       direction = 'desc'; 
    }
    
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let processed = data;

    if (selectedCategory !== 'All') {
      processed = processed.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      processed = processed.filter(item => 
        item.sku.toLowerCase().includes(lowerTerm) || 
        item.account.toLowerCase().includes(lowerTerm)
      );
    }

    if (sortConfig) {
      processed = [...processed].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return processed;
  }, [data, searchTerm, selectedCategory, sortConfig]);

  const SortIcon = ({ column }: { column: keyof SkuData }) => {
    if (sortConfig?.key !== column) return <span className="ml-1 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-50">↕</span>;
    return <span className="ml-1 text-brand-600 dark:text-brand-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const SortButton = ({ label, column }: { label: string, column: keyof SkuData }) => {
    const isActive = sortConfig?.key === column;
    const isAsc = sortConfig?.direction === 'asc';

    return (
      <button
        onClick={() => handleSort(column)}
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
    <div className="bg-white dark:bg-gray-850 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-brand-100">SKU Details</h2>
            
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-750 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200 w-full"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div className="relative flex-1 xs:flex-none xs:w-[140px] sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <select
                  className="pl-9 pr-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent appearance-none bg-white dark:bg-gray-750 text-gray-900 dark:text-gray-100 transition-colors duration-200 w-full"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Sort Buttons - Horizontal scroll on mobile */}
          <div className="flex items-center gap-2 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">Sort:</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <SortButton label="Inv." column="investment" />
              <SortButton label="Profit" column="profit" />
              <SortButton label="Turn." column="turnover" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-750 text-gray-700 dark:text-gray-300 transition-colors duration-200">
            <tr>
              <th scope="col" className="px-6 py-3 cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('sku')}>
                SKU <SortIcon column="sku" />
              </th>
              <th scope="col" className="px-6 py-3 cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('account')}>
                Account <SortIcon column="account" />
              </th>
              <th scope="col" className="px-6 py-3 cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('category')}>
                Category <SortIcon column="category" />
              </th>
              <th scope="col" className="px-6 py-3 text-right cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('turnover')}>
                Turnover <SortIcon column="turnover" />
              </th>
              <th scope="col" className="px-6 py-3 text-right cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('investment')}>
                Investment <SortIcon column="investment" />
              </th>
              <th scope="col" className="px-6 py-3 text-right cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('profit')}>
                Profit <SortIcon column="profit" />
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr 
                  key={`${item.sku}-${index}`} 
                  className="bg-white dark:bg-gray-850 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150 cursor-pointer"
                  onClick={() => onRowClick?.(item)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{item.sku}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.account}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${item.category === SkuCategory.DISCONTINUED_FBM ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 
                        item.category === SkuCategory.EXISTING_FBM ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300' : 
                        'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'}`}>
                      {item.category === SkuCategory.DISCONTINUED_FBM ? 'Discontinued' : 
                       item.category === SkuCategory.EXISTING_FBM ? 'Existing' : 'New FBA'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">{item.turnover} days</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">${item.investment.toLocaleString()}</td>
                  <td className={`px-6 py-4 text-right font-medium ${item.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    ${item.profit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${item.status === 'Awaiting Payment' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        item.status === 'Partially Processed' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                        item.status === 'Processed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        item.status === 'Excluded' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                  No SKUs found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
        {filteredData.length > 0 ? (
          filteredData.map((item, index) => (
            <div 
              key={`${item.sku}-${index}`} 
              className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-gray-800"
              onClick={() => onRowClick?.(item)}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{item.sku}</div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{item.account}</div>
                </div>
                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0
                  ${item.status === 'Awaiting Payment' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    item.status === 'Partially Processed' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                    item.status === 'Processed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    item.status === 'Excluded' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {item.status === 'Awaiting Payment' ? 'Awaiting' : 
                   item.status === 'Partially Processed' ? 'Partial' : item.status}
                </span>
              </div>
              
              <div className="mb-2 sm:mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium
                  ${item.category === SkuCategory.DISCONTINUED_FBM ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 
                    item.category === SkuCategory.EXISTING_FBM ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300' : 
                    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'}`}>
                  {item.category === SkuCategory.DISCONTINUED_FBM ? 'Discontinued' : 
                   item.category === SkuCategory.EXISTING_FBM ? 'Existing' : 'New FBA'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mb-0.5">Turn.</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">{item.turnover}d</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mb-0.5">Inv.</div>
                  <div className="font-medium text-gray-900 dark:text-gray-200">${item.investment >= 1000 ? `${(item.investment/1000).toFixed(1)}k` : item.investment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mb-0.5">Profit</div>
                  <div className={`font-medium ${item.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    ${item.profit >= 1000 || item.profit <= -1000 ? `${(item.profit/1000).toFixed(1)}k` : item.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 sm:p-8 text-center text-sm text-gray-400 dark:text-gray-500">
             No SKUs found matching your criteria.
          </div>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-750 px-3 sm:px-6 py-2 sm:py-3 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 transition-colors duration-200">
        Showing {filteredData.length} {filteredData.length === 1 ? 'entry' : 'entries'}
      </div>
    </div>
  );
};

export default SkuTable;
