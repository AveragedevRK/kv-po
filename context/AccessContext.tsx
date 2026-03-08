import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AccessMode } from '../types';
import { validateAccessCode } from '../lib/loadPurchaseOrder';

const ACCESS_MODE_STORAGE_KEY = 'kv-po-access-mode';

// Helper to get initial access mode from localStorage
const getStoredAccessMode = (): AccessMode => {
  if (typeof window === 'undefined') return 'VIEW';
  try {
    const stored = localStorage.getItem(ACCESS_MODE_STORAGE_KEY);
    if (stored === 'ADMIN' || stored === 'EDIT' || stored === 'VIEW') {
      return stored;
    }
  } catch {
    // localStorage might not be available
  }
  return 'VIEW';
};

interface AccessContextType {
  accessMode: AccessMode;
  setAccessMode: (mode: AccessMode) => void;
  validatePin: (pin: string) => Promise<AccessMode | null>;
  resetAccess: () => void;
  canEdit: boolean;
  canEditAdminFields: boolean;
  canEditNumericFields: boolean;
  canSave: boolean;
  canViewOrderId: boolean;
  canViewSupplier: boolean;
  canViewInvoices: boolean;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export const AccessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessMode, setAccessModeState] = useState<AccessMode>(getStoredAccessMode);

  // Persist access mode to localStorage whenever it changes
  const setAccessMode = useCallback((mode: AccessMode) => {
    setAccessModeState(mode);
    try {
      localStorage.setItem(ACCESS_MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage might not be available
    }
  }, []);

  const validatePin = useCallback(async (pin: string): Promise<AccessMode | null> => {
    const result = await validateAccessCode(pin);
    if (result) {
      setAccessMode(result);
    }
    return result;
  }, [setAccessMode]);

  const resetAccess = useCallback(() => {
    setAccessMode('VIEW');
  }, [setAccessMode]);

  // Derived permissions based on access mode
  // ADMIN: Can edit and save all fields (orderId, supplier, subtotal, misc, total, units)
  // EDIT: Can see and edit subtotal, misc, total, units (UI only, no save)
  // VIEW: Can only see subtotal, misc, total, units (read-only)
  const canEditAdminFields = accessMode === 'ADMIN'; // orderId, supplier - only ADMIN
  const canEditNumericFields = accessMode === 'EDIT' || accessMode === 'ADMIN'; // subtotal, misc, total, units
  const canEdit = accessMode === 'EDIT' || accessMode === 'ADMIN';
  const canSave = accessMode === 'ADMIN'; // Only ADMIN can write to Firestore
  const canViewOrderId = accessMode === 'ADMIN'; // Only ADMIN sees orderId
  const canViewSupplier = accessMode === 'ADMIN'; // Only ADMIN sees supplier
  const canViewInvoices = accessMode === 'ADMIN'; // Only ADMIN sees invoices

  return (
    <AccessContext.Provider
      value={{
        accessMode,
        setAccessMode,
        validatePin,
        resetAccess,
        canEdit,
        canEditAdminFields,
        canEditNumericFields,
        canSave,
        canViewOrderId,
        canViewSupplier,
        canViewInvoices,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = (): AccessContextType => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};
