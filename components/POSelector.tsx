import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Loader2, MoreVertical, ArrowRight, Lock, LogOut } from 'lucide-react';
import { PurchaseOrder, PO_STATUS_ORDER } from '../types';
import StatusBadge, { getStatusColor } from './StatusAdvance';
import { useAccess } from '../context/AccessContext';

interface POSelectorProps {
  purchaseOrders: PurchaseOrder[];
  selectedPO: PurchaseOrder | null;
  onSelect: (po: PurchaseOrder) => void;
  onAdvanceStatus?: () => Promise<void>;
  onRequestAccess?: () => void;
  isLoading?: boolean;
  isAdvancing?: boolean;
}

const POSelector: React.FC<POSelectorProps> = ({ purchaseOrders, selectedPO, onSelect, onAdvanceStatus, onRequestAccess, isLoading, isAdvancing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { accessMode, resetAccess, canSave } = useAccess();

  const currentIndex = selectedPO ? PO_STATUS_ORDER.indexOf(selectedPO.status) : -1;
  const isAtFinalStatus = currentIndex >= PO_STATUS_ORDER.length - 1;
  const nextStatus = !isAtFinalStatus && currentIndex >= 0 ? PO_STATUS_ORDER[currentIndex + 1] : null;

  // Handle open/close with animation
  const handleToggle = () => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 200);
    } else {
      setIsOpen(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsAnimating(true);
          setTimeout(() => {
            setIsOpen(false);
            setIsAnimating(false);
          }, 200);
        }
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (po: PurchaseOrder) => {
    onSelect(po);
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 150);
  };

  const handleAdvance = async () => {
    if (onAdvanceStatus && !isAtFinalStatus) {
      await onAdvanceStatus();
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      {/* PO Selector Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className="group flex items-center gap-1 sm:gap-1.5 text-base sm:text-xl font-bold leading-none transition-all duration-300 ease-out dark:text-white text-gray-900 hover:text-brand-600 dark:hover:text-brand-400 focus:outline-none active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <>
              <span className="transition-all duration-200 truncate max-w-[120px] sm:max-w-none">{selectedPO?.name || 'Select PO'}</span>
              <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 ease-out ${isOpen ? 'bg-brand-100 dark:bg-brand-900/40' : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}`}>
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''}`} 
                />
              </div>
            </>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className={`absolute top-full left-0 mt-2 sm:mt-3 w-[calc(100vw-24px)] sm:w-auto sm:min-w-[280px] max-w-[320px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/80 rounded-xl sm:rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 z-50 overflow-hidden
              ${isAnimating ? 'animate-dropdown-out' : 'animate-dropdown-in'}`}
            style={{
              transformOrigin: 'top left',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Select Purchase Order</p>
            </div>

            {/* Options */}
            <div className="py-2 max-h-72 overflow-y-auto overscroll-contain">
              {purchaseOrders.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">No purchase orders found</p>
                </div>
              ) : (
                purchaseOrders.map((po, index) => {
                  const isSelected = selectedPO?.id === po.id;
                  return (
                    <button
                      key={po.id}
                      onClick={() => handleSelect(po)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-200 ease-out group/item
                        ${isSelected 
                          ? 'bg-brand-50 dark:bg-brand-900/30' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800'
                        }
                      `}
                      style={{
                        animationDelay: `${index * 30}ms`,
                      }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-semibold transition-colors duration-200 ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-gray-800 dark:text-gray-200'}`}>
                          {po.name}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {po.month} {po.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(po.status)}`}>
                          {po.status}
                        </span>
                        {isSelected && (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 dark:bg-brand-400 animate-scale-in">
                            <Check size={12} className="text-white dark:text-gray-900" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Badge */}
      {selectedPO && (
        <StatusBadge status={selectedPO.status} />
      )}

      {/* Kebab Menu for Status Advance and Access Control */}
      {selectedPO && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-1.5 rounded-lg transition-all duration-200 ease-out active:scale-95
              ${isMenuOpen 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            title="More options"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-[calc(100vw-24px)] sm:w-auto sm:min-w-[220px] max-w-[280px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 z-50 overflow-hidden animate-dropdown-in"
              style={{ transformOrigin: 'top right' }}
            >
              <div className="py-1">
                {/* Request Edit Access - Only in VIEW mode */}
                {accessMode === 'VIEW' && onRequestAccess && (
                  <button
                    onClick={() => {
                      onRequestAccess();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800 group/access"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 bg-gray-100 dark:bg-gray-800 group-hover/access:bg-amber-100 dark:group-hover/access:bg-amber-900/40">
                      <Lock size={16} className="text-gray-500 dark:text-gray-400 group-hover/access:text-amber-600 dark:group-hover/access:text-amber-400 transition-colors duration-200" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">Request Edit Access</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Enter PIN to edit</span>
                    </div>
                  </button>
                )}

                {/* Logout/Reset Access - Only when not in VIEW mode */}
                {accessMode !== 'VIEW' && (
                  <button
                    onClick={() => {
                      resetAccess();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800 group/logout"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 bg-gray-100 dark:bg-gray-800 group-hover/logout:bg-red-100 dark:group-hover/logout:bg-red-900/40">
                      <LogOut size={16} className="text-gray-500 dark:text-gray-400 group-hover/logout:text-red-600 dark:group-hover/logout:text-red-400 transition-colors duration-200" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">Exit {accessMode} Mode</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Return to view only</span>
                    </div>
                  </button>
                )}

                {/* Advance Status - Always visible when not at final status, but requires ADMIN to execute */}
                {!isAtFinalStatus && onAdvanceStatus && (
                  <>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                    <button
                      onClick={handleAdvance}
                      disabled={isAdvancing || !canSave}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:bg-gray-100 dark:active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed group/advance"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 ${isAdvancing ? 'bg-brand-100 dark:bg-brand-900/40' : 'bg-gray-100 dark:bg-gray-800 group-hover/advance:bg-brand-100 dark:group-hover/advance:bg-brand-900/40'}`}>
                        {isAdvancing ? (
                          <Loader2 size={16} className="animate-spin text-brand-600 dark:text-brand-400" />
                        ) : (
                          <ArrowRight size={16} className="text-gray-500 dark:text-gray-400 group-hover/advance:text-brand-600 dark:group-hover/advance:text-brand-400 transition-colors duration-200" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Advance Status</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {canSave ? `Move to ${nextStatus}` : 'Requires ADMIN access'}
                        </span>
                      </div>
                    </button>
                  </>
                )}

                {/* Show current access mode indicator */}
                {accessMode !== 'VIEW' && (
                  <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      accessMode === 'ADMIN' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}>
                      {accessMode} MODE
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes dropdown-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes dropdown-out {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-dropdown-in {
          animation: dropdown-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .animate-dropdown-out {
          animation: dropdown-out 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default POSelector;
