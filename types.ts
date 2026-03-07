export interface OverallStats {
  totalInvestment: number;
  totalProfit: number;
  avgTurnover: number;
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
