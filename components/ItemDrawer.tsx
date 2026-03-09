import React, { useEffect, useRef, useState } from 'react';
import { X, Package, DollarSign, TrendingUp, Clock, Layers, Tag, Loader2, FileText, Truck, Pencil, Plus, Trash2, Check, XCircle } from 'lucide-react';
import { SkuDataWithId, SkuCategory, ItemStatus, OrderEntry } from '../types';
import { updateItemStatus, updateItemOrders } from '../lib/loadPurchaseOrder';
import InvoiceSection from './InvoiceSection';

interface ItemDrawerProps {
  item: SkuDataWithId | null;
  isOpen: boolean;
  onClose: () => void;
  poId: string;
  onItemUpdated: () => void;
}

// Single Order Card Component
interface OrderCardProps {
  order: OrderEntry;
  index: number;
  isEditing: boolean;
  editingOrder: OrderEntry | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onFieldChange: (field: keyof OrderEntry, value: string | number) => void;
  isSaving: boolean;
}

// Format date string to words (e.g., "3/9/2026" -> "March 9th, 2026")
const formatDateToWords = (dateStr: string): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (isNaN(month) || isNaN(day) || isNaN(year) || month < 1 || month > 12) return '';
  
  // Add ordinal suffix to day
  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${months[month - 1]} ${getOrdinal(day)}, ${year}`;
};

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  index,
  isEditing,
  editingOrder,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onFieldChange,
  isSaving,
}) => {
  const displayOrder = isEditing && editingOrder ? editingOrder : order;

  return (
    <div className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
      isEditing 
        ? 'border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/20' 
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
    }`}>
      {/* Order Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Order #{index + 1}
        </span>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={onSaveEdit}
                disabled={isSaving}
                className="p-1 sm:p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                title="Save changes"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button
                onClick={onCancelEdit}
                className="p-1 sm:p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Cancel"
              >
                <XCircle size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onStartEdit}
                className="p-1 sm:p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                title="Edit order"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={onDelete}
                className="p-1 sm:p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Delete order"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Order Fields */}
      <div className="space-y-2">
        {/* Order Date */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Date</span>
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayOrder.orderDate?.split('/')[0] || ''}
                  onChange={(e) => {
                    const parts = (displayOrder.orderDate || '//').split('/');
                    parts[0] = e.target.value.replace(/\D/g, '').slice(0, 2);
                    onFieldChange('orderDate', parts.join('/'));
                  }}
                  placeholder="MM"
                  className="w-10 px-1.5 py-1 text-xs sm:text-sm text-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-gray-400 dark:text-gray-500 mx-0.5">/</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayOrder.orderDate?.split('/')[1] || ''}
                  onChange={(e) => {
                    const parts = (displayOrder.orderDate || '//').split('/');
                    parts[1] = e.target.value.replace(/\D/g, '').slice(0, 2);
                    onFieldChange('orderDate', parts.join('/'));
                  }}
                  placeholder="DD"
                  className="w-10 px-1.5 py-1 text-xs sm:text-sm text-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-gray-400 dark:text-gray-500 mx-0.5">/</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayOrder.orderDate?.split('/')[2] || ''}
                  onChange={(e) => {
                    const parts = (displayOrder.orderDate || '//').split('/');
                    parts[2] = e.target.value.replace(/\D/g, '').slice(0, 4);
                    onFieldChange('orderDate', parts.join('/'));
                  }}
                  placeholder="YYYY"
                  className="w-14 px-1.5 py-1 text-xs sm:text-sm text-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 italic truncate">
                {formatDateToWords(displayOrder.orderDate || '')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {displayOrder.orderDate || '-'}
              </span>
              {displayOrder.orderDate && (
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 italic">
                  {formatDateToWords(displayOrder.orderDate)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Order ID */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Order ID</span>
          {isEditing ? (
            <input
              type="text"
              value={displayOrder.orderId}
              onChange={(e) => onFieldChange('orderId', e.target.value)}
              className="flex-1 px-2 py-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          ) : (
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{displayOrder.orderId || '-'}</span>
          )}
        </div>

        {/* Supplier */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0 flex items-center gap-1">
            <Truck size={10} /> Supplier
          </span>
          {isEditing ? (
            <input
              type="text"
              value={displayOrder.supplier}
              onChange={(e) => onFieldChange('supplier', e.target.value)}
              className="flex-1 px-2 py-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          ) : (
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{displayOrder.supplier || '-'}</span>
          )}
        </div>

        {/* Numeric Fields Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Subtotal */}
          <div>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Subtotal</span>
            {isEditing ? (
              <input
                type="number"
                value={displayOrder.subtotal}
                onChange={(e) => onFieldChange('subtotal', e.target.value)}
                className="w-full px-2 py-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            ) : (
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">${displayOrder.subtotal.toLocaleString()}</span>
            )}
          </div>

          {/* Misc */}
          <div>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Misc</span>
            {isEditing ? (
              <input
                type="number"
                value={displayOrder.misc}
                onChange={(e) => onFieldChange('misc', e.target.value)}
                className="w-full px-2 py-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            ) : (
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">${displayOrder.misc.toLocaleString()}</span>
            )}
          </div>

          {/* Total */}
          <div>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Total</span>
            {isEditing ? (
              <input
                type="number"
                value={displayOrder.total}
                onChange={(e) => onFieldChange('total', e.target.value)}
                className="w-full px-2 py-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">${displayOrder.total.toLocaleString()}</span>
            )}
          </div>

          {/* Units */}
          <div>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Units</span>
            {isEditing ? (
              <input
                type="number"
                value={displayOrder.units}
                onChange={(e) => onFieldChange('units', e.target.value)}
                className="w-full px-2 py-1 text-xs sm:text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            ) : (
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{displayOrder.units.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemDrawer: React.FC<ItemDrawerProps> = ({ item, isOpen, onClose, poId, onItemUpdated }) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingOrders, setIsSavingOrders] = useState(false);
  
  // Local state for orders editing
  const [localOrders, setLocalOrders] = useState<OrderEntry[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderEntry | null>(null);
  
  // Reset local orders when item changes
  useEffect(() => {
    if (item) {
      setLocalOrders([...item.orders]);
    } else {
      setLocalOrders([]);
    }
    setEditingIndex(null);
    setEditingOrder(null);
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
        if (editingIndex !== null) {
          setEditingIndex(null);
          setEditingOrder(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, editingIndex]);

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

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingOrder({ ...localOrders[index] });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingOrder(null);
  };

  const handleFieldChange = (field: keyof OrderEntry, value: string | number) => {
    if (!editingOrder) return;
    setEditingOrder({
      ...editingOrder,
      [field]: field === 'orderId' || field === 'supplier' || field === 'orderDate' ? value : Number(value) || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null || !editingOrder || !item) return;

    const newOrders = [...localOrders];
    newOrders[editingIndex] = editingOrder;
    
    setIsSavingOrders(true);
    try {
      const success = await updateItemOrders(poId, item.id, newOrders);
      if (success) {
        setLocalOrders(newOrders);
        onItemUpdated();
      }
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSavingOrders(false);
    }
    
    setEditingIndex(null);
    setEditingOrder(null);
  };

  const handleDeleteOrder = async (index: number) => {
    if (!item) return;
    
    const newOrders = localOrders.filter((_, i) => i !== index);
    
    setIsSavingOrders(true);
    try {
      const success = await updateItemOrders(poId, item.id, newOrders);
      if (success) {
        setLocalOrders(newOrders);
        onItemUpdated();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setIsSavingOrders(false);
    }
  };

  // Helper to get current date as MM/DD/YYYY string
  const getCurrentDateString = (): string => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString();
    const day = now.getDate().toString();
    const year = now.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleAddOrder = async () => {
    if (!item) return;
    
    const newOrder: OrderEntry = {
      orderId: '',
      supplier: '',
      subtotal: 0,
      misc: 0,
      total: 0,
      units: 0,
      orderDate: getCurrentDateString(),
    };
    
    const newOrders = [...localOrders, newOrder];
    
    setIsSavingOrders(true);
    try {
      const success = await updateItemOrders(poId, item.id, newOrders);
      if (success) {
        setLocalOrders(newOrders);
        onItemUpdated();
        // Start editing the new order
        setEditingIndex(newOrders.length - 1);
        setEditingOrder(newOrder);
      }
    } catch (error) {
      console.error('Error adding order:', error);
    } finally {
      setIsSavingOrders(false);
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
        className={`fixed top-0 right-0 h-full w-full sm:w-[380px] md:w-[420px] bg-white dark:bg-gray-850 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package size={18} className="sm:w-5 sm:h-5" />
            Item Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            <X size={18} className="sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 overflow-y-auto h-[calc(100%-52px)] sm:h-[calc(100%-64px)]">
          {/* SKU Header */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 break-all">{item.sku}</h3>
            
            {/* ASIN - Always visible */}
            {item.asin && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 font-mono">
                ASIN: {item.asin}
              </p>
            )}
            
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getCategoryColor(item.category)}`}>
                {getCategoryLabel(item.category)}
              </span>
              <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2.5 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                <Tag size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium">Account</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{item.account}</p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                <Layers size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium">Units</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{item.units}</p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium">Turnover</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{item.turnover} days</p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                <DollarSign size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium">Investment</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">${item.investment.toLocaleString()}</p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800 col-span-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium">Profit</span>
              </div>
              <p className={`text-base sm:text-lg font-bold ${item.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                ${item.profit.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Orders Section */}
          <div className="mb-4 sm:mb-6 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 sm:gap-2">
                <FileText size={14} className="sm:w-4 sm:h-4" />
                Orders ({localOrders.length})
              </h4>
              <button
                onClick={handleAddOrder}
                disabled={isSavingOrders}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-lg transition-all duration-200 active:scale-95
                  bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 
                  dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-900/30
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingOrders ? <Loader2 size={10} className="sm:w-3 sm:h-3 animate-spin" /> : <Plus size={10} className="sm:w-3 sm:h-3" />}
                Add Order
              </button>
            </div>

            {localOrders.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                <FileText size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No orders yet</p>
                <p className="text-[10px] sm:text-xs mt-1">Click "Add Order" to create one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {localOrders.map((order, index) => (
                  <OrderCard
                    key={index}
                    order={order}
                    index={index}
                    isEditing={editingIndex === index}
                    editingOrder={editingIndex === index ? editingOrder : null}
                    onStartEdit={() => handleStartEdit(index)}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onDelete={() => handleDeleteOrder(index)}
                    onFieldChange={handleFieldChange}
                    isSaving={isSavingOrders}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status Controls */}
          <div className="mb-4 sm:mb-6">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Update Status</h4>
            {item.status === 'Awaiting Payment' ? (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleStatusChange('Partially Processed')}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-lg border transition-all duration-200 active:scale-95
                    bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 
                    dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/30
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? <Loader2 size={10} className="sm:w-3 sm:h-3 animate-spin" /> : 'Partial'}
                </button>
                <button
                  onClick={() => handleStatusChange('Processed')}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-lg border transition-all duration-200 active:scale-95
                    bg-green-50 border-green-200 text-green-700 hover:bg-green-100 
                    dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? <Loader2 size={10} className="sm:w-3 sm:h-3 animate-spin" /> : 'Done'}
                </button>
                <button
                  onClick={() => handleStatusChange('Excluded')}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-lg border transition-all duration-200 active:scale-95
                    bg-red-50 border-red-200 text-red-700 hover:bg-red-100 
                    dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? <Loader2 size={10} className="sm:w-3 sm:h-3 animate-spin" /> : 'Skip'}
                </button>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
                Status cannot be changed once set to {item.status}.
              </p>
            )}
          </div>

          {/* Invoice Section */}
          <InvoiceSection
            itemId={item.id}
            poId={poId}
            invoices={item.invoices || []}
            onInvoiceUploaded={onItemUpdated}
          />
        </div>
      </div>
    </>
  );
};

export default ItemDrawer;
