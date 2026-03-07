import { db, storage } from './firebase';
import { collection, doc, getDoc, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { OverallStats, AccountStat, SkuData, SkuCategory, PurchaseOrder, POStatus, PO_STATUS_ORDER, SkuDataWithId, ItemStatus, OrderEntry, AccessMode } from '../types';

// PO ID constant for now
const DEFAULT_PO_ID = 'PO-2026-001';



interface FirestoreItem {
  sku: string;
  accountId: string;
  category: string;
  turnoverDays: number;
  investment: number;
  profit: number;
  units: number;
  status: string;
  asin?: string;
  // Orders array (new structure)
  orders?: OrderEntry[];
  // Legacy single order fields (for migration)
  orderId?: string;
  supplier?: string;
  subtotal?: number;
  misc?: number;
  total?: number;
}

interface LoadPurchaseOrderResult {
  po: PurchaseOrder | null;
  items: SkuDataWithId[];
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
      id: poId,
      name: data.name,
      month: data.month,
      year: data.year,
      status: data.status as POStatus,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  }

  // Step 2: Fetch items subcollection
  const itemsCollectionRef = collection(db, 'purchaseOrders', poId, 'items');
  const itemsSnapshot = await getDocs(itemsCollectionRef);
  
  const items: SkuDataWithId[] = itemsSnapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as FirestoreItem & { invoices?: string[] };
    
    // Handle orders array - support both new structure and legacy single order
    let orders: OrderEntry[] = [];
    if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
      // New structure: use orders array directly
      orders = data.orders;
    } else if (data.orderId || data.supplier || data.subtotal || data.misc || data.total) {
      // Legacy structure: convert single order to array
      orders = [{
        orderId: data.orderId || '',
        supplier: data.supplier || '',
        subtotal: data.subtotal || 0,
        misc: data.misc || 0,
        total: data.total || 0,
        units: data.units || 0,
      }];
    }
    
    return {
      id: docSnapshot.id,
      sku: data.sku,
      account: data.accountId, // Map accountId from Firestore to account field
      category: mapCategory(data.category),
      turnover: data.turnoverDays,
      investment: data.investment,
      profit: data.profit,
      units: data.units,
      status: data.status,
      asin: data.asin,
      invoices: data.invoices || [],
      orders,
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

// Load all POs for the selector dropdown
export async function loadAllPurchaseOrders(): Promise<PurchaseOrder[]> {
  const posCollectionRef = collection(db, 'purchaseOrders');
  const posSnapshot = await getDocs(posCollectionRef);
  
  const purchaseOrders: PurchaseOrder[] = posSnapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      name: data.name,
      month: data.month,
      year: data.year,
      status: data.status as POStatus,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  });
  
  // Sort by createdAt descending (newest first)
  return purchaseOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Advance PO status to next status (forward only)
export async function advancePOStatus(poId: string, currentStatus: POStatus): Promise<POStatus | null> {
  const currentIndex = PO_STATUS_ORDER.indexOf(currentStatus);
  
  // Cannot advance if already at final status
  if (currentIndex === -1 || currentIndex >= PO_STATUS_ORDER.length - 1) {
    return null;
  }
  
  const nextStatus = PO_STATUS_ORDER[currentIndex + 1];
  
  const poDocRef = doc(db, 'purchaseOrders', poId);
  await updateDoc(poDocRef, {
    status: nextStatus,
    updatedAt: new Date(),
  });
  
  return nextStatus;
}

// Update item status (Awaiting Payment -> Partially Processed, Processed, or Excluded)
export async function updateItemStatus(
  poId: string, 
  itemId: string, 
  currentStatus: ItemStatus, 
  newStatus: ItemStatus
): Promise<boolean> {
  // Only allow transitions from 'Awaiting Payment'
  if (currentStatus !== 'Awaiting Payment') {
    return false;
  }
  
  // Only allow transitioning to valid statuses
  if (newStatus !== 'Partially Processed' && newStatus !== 'Processed' && newStatus !== 'Excluded') {
    return false;
  }
  
  const itemDocRef = doc(db, 'purchaseOrders', poId, 'items', itemId);
  await updateDoc(itemDocRef, {
    status: newStatus,
  });
  
  return true;
}

// Upload invoice file to Firebase Storage
export async function uploadInvoice(
  poId: string, 
  itemId: string, 
  file: File
): Promise<string> {
  const filePath = `po-invoices/${poId}/${itemId}/${file.name}`;
  const storageRef = ref(storage, filePath);
  
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  
  // Add URL to item's invoices array
  const itemDocRef = doc(db, 'purchaseOrders', poId, 'items', itemId);
  await updateDoc(itemDocRef, {
    invoices: arrayUnion(downloadUrl),
  });
  
  return downloadUrl;
}

// Get all invoice URLs for an item
export async function getItemInvoices(poId: string, itemId: string): Promise<string[]> {
  const folderPath = `po-invoices/${poId}/${itemId}`;
  const folderRef = ref(storage, folderPath);
  
  try {
    const result = await listAll(folderRef);
    const urls = await Promise.all(
      result.items.map((itemRef) => getDownloadURL(itemRef))
    );
    return urls;
  } catch {
    return [];
  }
}

// Fallback access codes (used when Firestore document doesn't exist)
const FALLBACK_CODES = {
  editCode: 'KV10X',
  adminCode: 'sudo KV',
};

// Validate PIN code against systemConfig/accessCodes in Firestore
export async function validateAccessCode(pin: string): Promise<AccessMode | null> {
  try {
    const configDocRef = doc(db, 'systemConfig', 'accessCodes');
    const configSnapshot = await getDoc(configDocRef);
    
    let editCode = FALLBACK_CODES.editCode;
    let adminCode = FALLBACK_CODES.adminCode;
    
    if (configSnapshot.exists()) {
      const data = configSnapshot.data();
      editCode = data.editCode || editCode;
      adminCode = data.adminCode || adminCode;
    }
    
    if (pin === adminCode) {
      return 'ADMIN';
    }
    
    if (pin === editCode) {
      return 'EDIT';
    }
    
    return null;
  } catch (error) {
    console.error('Error validating access code:', error);
    
    // Fallback to hardcoded codes if Firestore fails
    if (pin === FALLBACK_CODES.adminCode) {
      return 'ADMIN';
    }
    if (pin === FALLBACK_CODES.editCode) {
      return 'EDIT';
    }
    
    return null;
  }
}

// Update orders array for an item (ADMIN only)
export async function updateItemOrders(
  poId: string,
  itemId: string,
  orders: OrderEntry[],
  accessMode: AccessMode
): Promise<boolean> {
  // Only ADMIN can write to Firestore
  if (accessMode !== 'ADMIN') {
    return false;
  }
  
  try {
    const itemDocRef = doc(db, 'purchaseOrders', poId, 'items', itemId);
    await updateDoc(itemDocRef, {
      orders: orders,
    });
    return true;
  } catch (error) {
    console.error('Error updating orders:', error);
    return false;
  }
}
