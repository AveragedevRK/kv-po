import { db } from './firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { OverallStats, AccountStat, SkuData, SkuCategory } from '../types';

// PO ID constant for now
const DEFAULT_PO_ID = 'PO-2026-001';

interface PurchaseOrder {
  name: string;
  month: string;
  year: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FirestoreItem {
  sku: string;
  accountId: string;
  category: string;
  turnoverDays: number;
  investment: number;
  profit: number;
  units: number;
  status: string;
}

interface LoadPurchaseOrderResult {
  po: PurchaseOrder | null;
  items: SkuData[];
  overallStats: OverallStats;
  accountStats: AccountStat[];
}

// Map Firestore category string to SkuCategory enum
function mapCategory(category: string): SkuCategory {
  const categoryMap: Record<string, SkuCategory> = {
    'DISCONTINUED_FBM': SkuCategory.DISCONTINUED_FBM,
    'EXISTING_FBM': SkuCategory.EXISTING_FBM,
    'NEW_FBA': SkuCategory.NEW_FBA,
    'Previously Discontinued SKUs (FBM)': SkuCategory.DISCONTINUED_FBM,
    'Existing SKUs (FBM)': SkuCategory.EXISTING_FBM,
    'New SKUs (FBA)': SkuCategory.NEW_FBA,
  };
  return categoryMap[category] || SkuCategory.NEW_FBA;
}

// Compute overall stats from items
function computeOverallStats(items: SkuData[]): OverallStats {
  if (items.length === 0) {
    return { totalInvestment: 0, totalProfit: 0, avgTurnover: 0 };
  }

  const totalInvestment = items.reduce((sum, item) => sum + item.investment, 0);
  const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);
  const avgTurnover = items.reduce((sum, item) => sum + item.turnover, 0) / items.length;

  return {
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    avgTurnover: Math.round(avgTurnover * 100) / 100,
  };
}

// Compute account stats by grouping items by account
function computeAccountStats(items: SkuData[]): AccountStat[] {
  const accountMap = new Map<string, { investment: number; profit: number; turnoverSum: number; count: number }>();

  items.forEach((item) => {
    const existing = accountMap.get(item.account) || { investment: 0, profit: 0, turnoverSum: 0, count: 0 };
    accountMap.set(item.account, {
      investment: existing.investment + item.investment,
      profit: existing.profit + item.profit,
      turnoverSum: existing.turnoverSum + item.turnover,
      count: existing.count + 1,
    });
  });

  const accountStats: AccountStat[] = [];
  accountMap.forEach((data, name) => {
    accountStats.push({
      name,
      investment: Math.round(data.investment * 100) / 100,
      profit: Math.round(data.profit * 100) / 100,
      turnover: Math.round((data.turnoverSum / data.count) * 100) / 100,
    });
  });

  return accountStats.sort((a, b) => b.investment - a.investment);
}

export async function loadPurchaseOrder(poId: string = DEFAULT_PO_ID): Promise<LoadPurchaseOrderResult> {
  // Step 1: Fetch PO document
  const poDocRef = doc(db, 'purchaseOrders', poId);
  const poSnapshot = await getDoc(poDocRef);
  
  let po: PurchaseOrder | null = null;
  if (poSnapshot.exists()) {
    const data = poSnapshot.data();
    po = {
      name: data.name,
      month: data.month,
      year: data.year,
      status: data.status,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  }

  // Step 2: Fetch items subcollection
  const itemsCollectionRef = collection(db, 'purchaseOrders', poId, 'items');
  const itemsSnapshot = await getDocs(itemsCollectionRef);
  
  const items: SkuData[] = itemsSnapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as FirestoreItem;
    return {
      sku: data.sku,
      account: data.accountId, // Map accountId from Firestore to account field
      category: mapCategory(data.category),
      turnover: data.turnoverDays,
      investment: data.investment,
      profit: data.profit,
      status: data.status,
    };
  });

  // Step 3: Compute overall stats
  const overallStats = computeOverallStats(items);

  // Step 4: Compute account stats
  const accountStats = computeAccountStats(items);

  return {
    po,
    items,
    overallStats,
    accountStats,
  };
}
