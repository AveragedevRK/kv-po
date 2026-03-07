import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { PurchaseOrder } from '../types';

interface POSelectorProps {
  purchaseOrders: PurchaseOrder[];
  selectedPO: PurchaseOrder | null;
  onSelect: (po: PurchaseOrder) => void;
  isLoading?: boolean;
}

const POSelector: React.FC<POSelectorProps> = ({ purchaseOrders, selectedPO, onSelect, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (po: PurchaseOrder) => {
    onSelect(po);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-1 text-xl font-bold leading-none mb-1 transition-colors duration-200 dark:text-white text-gray-900 hover:text-brand-600 dark:hover:text-brand-400 focus:outline-none"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {selectedPO?.name || 'Select PO'}
            <ChevronDown 
              size={18} 
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </>
        )}
      </button>

      {isOpen && !isLoading && (
        <div className="absolute top-full left-0 mt-2 min-w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto">
            {purchaseOrders.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No purchase orders found
              </div>
            ) : (
              purchaseOrders.map((po) => (
                <button
                  key={po.id}
                  onClick={() => handleSelect(po)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors duration-150
                    ${selectedPO?.id === po.id 
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }
                  `}
                >
                  <span className="font-medium">{po.name}</span>
                  {selectedPO?.id === po.id && (
                    <Check size={16} className="text-brand-600 dark:text-brand-400" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default POSelector;
