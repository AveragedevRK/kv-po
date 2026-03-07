import React, { useEffect, useRef, useState } from 'react';
import { X, Package, DollarSign, TrendingUp, Clock, Layers, Tag, Loader2 } from 'lucide-react';
import { SkuDataWithId, SkuCategory, ItemStatus } from '../types';
import { updateItemStatus } from '../lib/loadPurchaseOrder';
import InvoiceSection from './InvoiceSection';

interface ItemDrawerProps {
  item: SkuDataWithId | null;
  isOpen: boolean;
  onClose: () => void;
  poId: string;
  onItemUpdated: () => void;
}

const ItemDrawer: React.FC<ItemDrawerProps> = ({ item, isOpen, onClose, poId, onItemUpdated }) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (!item || item.status !== 'Awaiting Payment') return;
    
    setIsUpdating(true);
    try {
      const success = await updateItemStatus(poId, item.id, item.status as ItemStatus, newStatus);
      if (success) {
        onItemUpdated();
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getCategoryLabel = (category: SkuCategory) => {
    switch (category) {
      case SkuCategory.DISCONTINUED_FBM:
        return 'Discontinued (FBM)';
      case SkuCategory.EXISTING_FBM:
        return 'Existing (FBM)';
      case SkuCategory.NEW_FBA:
        return 'New (FBA)';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: SkuCategory) => {
    switch (category) {
      case SkuCategory.DISCONTINUED_FBM:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case SkuCategory.EXISTING_FBM:
        return 'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300';
      case SkuCategory.NEW_FBA:
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Awaiting Payment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Partially Processed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Processed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Excluded':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!item) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-gray-850 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package size={20} />
            Item Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          {/* SKU Header */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.sku}</h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                {getCategoryLabel(item.category)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Tag size={14} />
                <span className="text-xs font-medium">Account</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.account}</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Layers size={14} />
                <span className="text-xs font-medium">Units</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.units}</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Clock size={14} />
                <span className="text-xs font-medium">Turnover Days</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.turnover} days</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <DollarSign size={14} />
                <span className="text-xs font-medium">Investment</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">${item.investment.toLocaleString()}</p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 col-span-2">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <TrendingUp size={14} />
                <span className="text-xs font-medium">Profit</span>
              </div>
              <p className={`text-lg font-bold ${item.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                ${item.profit.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Status Controls */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Update Status</h4>
            {item.status === 'Awaiting Payment' ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange('Partially Processed')}
                    disabled={isUpdating}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200
                      bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 
                      dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/30
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Partially Processed'}
                  </button>
                  <button
                    onClick={() => handleStatusChange('Processed')}
                    disabled={isUpdating}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200
                      bg-green-50 border-green-200 text-green-700 hover:bg-green-100 
                      dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Processed'}
                  </button>
                </div>
                <button
                  onClick={() => handleStatusChange('Excluded')}
                  disabled={isUpdating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200
                    bg-red-50 border-red-200 text-red-700 hover:bg-red-100 
                    dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Excluded'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Status cannot be changed once set to {item.status}.
              </p>
            )}
          </div>

          {/* Invoice Section */}
          <InvoiceSection 
            poId={poId} 
            itemId={item.id} 
            invoices={item.invoices || []}
            onInvoiceUploaded={onItemUpdated}
          />
        </div>
      </div>
    </>
  );
};

export default ItemDrawer;
