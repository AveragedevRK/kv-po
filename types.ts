export interface OverallStats {
  totalInvestment: number;
  totalProfit: number;
  avgTurnover: number;
}

// PO Status types with forward-only progression
export type POStatus = 
  | 'Draft' 
  | 'Awaiting Payment' 
  | 'Created' 
  | 'Approved' 
  | 'Partially Processed' 
  | 'Processed';

export const PO_STATUS_ORDER: POStatus[] = [
  'Draft',
  'Awaiting Payment',
  'Created',
  'Approved',
  'Partially Processed',
  'Processed'
];

export interface PurchaseOrder {
  id: string;
  name: string;
  month: string;
  year: number;
  status: POStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Item status types
export type ItemStatus = 'Unprocessed' | 'Processed' | 'Excluded';

export interface SkuDataWithId extends SkuData {
  id: string;
  units: number;
  invoices?: string[];
}

export interface AccountStat {
  name: string;
  investment: number;
  profit: number;
  turnover: number;
}

export interface SkuData {
  sku: string;
  account: string;
  turnover: number;
  investment: number;
  profit: number;
  status: string;
  category: SkuCategory;
}

export enum SkuCategory {
  DISCONTINUED_FBM = "Previously Discontinued SKUs (FBM)",
  EXISTING_FBM = "Existing SKUs (FBM)",
  NEW_FBA = "New SKUs (FBA)"
}
