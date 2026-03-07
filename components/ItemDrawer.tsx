import React, { useEffect, useRef, useState } from 'react';
import { X, Package, DollarSign, TrendingUp, Clock, Layers, Tag, Loader2, FileText, Save, Truck } from 'lucide-react';
import { SkuDataWithId, SkuCategory, ItemStatus, OrderDetails } from '../types';
import { updateItemStatus, updateOrderDetails } from '../lib/loadPurchaseOrder';
import InvoiceSection from './InvoiceSection';
import { useAccess } from '../context/AccessContext';

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
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const { accessMode, canEdit, canSave, canViewSupplier, canViewInvoices } = useAccess();
  
  // Local state for order details editing (EDIT mode changes stay local, not saved)
  const [localOrderDetails, setLocalOrderDetails] = useState<OrderDetails | null>(null);
  
  // Reset local order details when item changes - always initialize with defaults
  useEffect(() => {
    if (item?.orderDetails) {
      setLocalOrderDetails({ ...item.orderDetails });
    } else if (item) {
      // Initialize with defaults if no order details exist
      setLocalOrderDetails({
        orderId: '',
        supplier: '',
        subtotal: 0,
        misc: 0,
        total: 0,
        units: 0,
      });
    } else {
      setLocalOrderDetails(null);
    }
  }, [item]);

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
    
    // Only ADMIN can actually update status in Firestore
    if (!canSave) return;
    
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

  const handleOrderDetailsChange = (field: keyof OrderDetails, value: string | number) => {
    if (!localOrderDetails) return;
    
    setLocalOrderDetails({
      ...localOrderDetails,
      [field]: field === 'orderId' || field === 'supplier' ? value : Number(value) || 0,
    });
  };

  const handleSaveOrderDetails = async () => {
    if (!item || !localOrderDetails || !canSave) return;
    
    setIsSavingOrder(true);
    try {
      const success = await updateOrderDetails(poId, item.id, localOrderDetails, accessMode);
      if (success) {
        onItemUpdated();
      }
    } catch (error) {
      console.error('Error saving order details:', error);
    } finally {
      setIsSavingOrder(false);
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

          {/* Order Details Section */}
          {localOrderDetails && (
            <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FileText size={16} />
                  Order Details
                </h4>
                {canSave && (
                  <button
                    onClick={handleSaveOrderDetails}
                    disabled={isSavingOrder}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 active:scale-95
                      bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 
                      dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-900/30
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingOrder ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Save
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Order ID */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Order ID</label>
                  <input
                    type="text"
                    value={localOrderDetails.orderId}
                    onChange={(e) => handleOrderDetailsChange('orderId', e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                {/* Supplier - Hidden for VIEW and EDIT modes */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Truck size={12} />
                    Supplier
                  </label>
                  {canViewSupplier ? (
                    <input
                      type="text"
                      value={localOrderDetails.supplier}
                      onChange={(e) => handleOrderDetailsChange('supplier', e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 italic">
                      Hidden
                    </div>
                  )}
                </div>

                {/* Number Fields Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subtotal</label>
                    <input
                      type="number"
                      value={localOrderDetails.subtotal}
                      onChange={(e) => handleOrderDetailsChange('subtotal', e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Misc</label>
                    <input
                      type="number"
                      value={localOrderDetails.misc}
                      onChange={(e) => handleOrderDetailsChange('misc', e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total</label>
                    <input
                      type="number"
                      value={localOrderDetails.total}
                      onChange={(e) => handleOrderDetailsChange('total', e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Units</label>
                    <input
                      type="number"
                      value={localOrderDetails.units}
                      onChange={(e) => handleOrderDetailsChange('units', e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Edit Mode Warning */}
                {canEdit && !canSave && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    Changes in EDIT mode are not saved to the database.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status Controls - Only ADMIN can change status */}
          {canSave && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Update Status</h4>
              {item.status === 'Awaiting Payment' ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleStatusChange('Partially Processed')}
                    disabled={isUpdating}
                    className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 active:scale-95
                      bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 
                      dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/30
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : 'Partial'}
                  </button>
                  <button
                    onClick={() => handleStatusChange('Processed')}
                    disabled={isUpdating}
                    className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 active:scale-95
                      bg-green-50 border-green-200 text-green-700 hover:bg-green-100 
                      dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : 'Processed'}
                  </button>
                  <button
                    onClick={() => handleStatusChange('Excluded')}
                    disabled={isUpdating}
                    className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 active:scale-95
                      bg-red-50 border-red-200 text-red-700 hover:bg-red-100 
                      dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : 'Excluded'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Status cannot be changed once set to {item.status}.
                </p>
              )}
            </div>
          )}

          {/* Invoice Section - Only visible to ADMIN */}
          {canViewInvoices && (
            <InvoiceSection 
              poId={poId} 
              itemId={item.id} 
              invoices={item.invoices || []}
              onInvoiceUploaded={onItemUpdated}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ItemDrawer;
