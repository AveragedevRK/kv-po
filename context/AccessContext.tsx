import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AccessMode } from '../types';
import { validateAccessCode } from '../lib/loadPurchaseOrder';

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
  const [accessMode, setAccessMode] = useState<AccessMode>('VIEW');

  const validatePin = useCallback(async (pin: string): Promise<AccessMode | null> => {
    const result = await validateAccessCode(pin);
    if (result) {
      setAccessMode(result);
    }
    return result;
  }, []);

  const resetAccess = useCallback(() => {
    setAccessMode('VIEW');
  }, []);

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
