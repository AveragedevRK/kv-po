# KV Purchase Order System -- Technical Documentation

Generated from full codebase scan on 2026-03-20.

---

## 1. Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Runtime      | React 19.1, TypeScript, Vite 6          |
| Database     | Google Cloud Firestore                  |
| File Storage | Firebase Storage                        |
| Telemetry    | Supabase PostgreSQL (separate project)  |
| Icons        | Lucide React                            |

Firebase project: `purchase-orders-5c899` (config hardcoded in `lib/firebase.ts`).
Supabase project: `jnmbqnfuouuwzkfzvunh` (config hardcoded in `telemetry.ts`).

---

## 2. Firestore Schema

### 2.1 Collection: `purchaseOrders`

Top-level collection. Each document is a Purchase Order.

| Field       | Type              | Description                               |
|-------------|-------------------|-------------------------------------------|
| `name`      | `string`          | Display name (e.g. "KV Purchase Order 2") |
| `month`     | `string`          | Month label (e.g. "January")              |
| `year`      | `number`          | Calendar year (e.g. 2026)                 |
| `status`    | `string`          | Current PO status (see section 4)         |
| `createdAt` | `Timestamp`       | Firestore server timestamp                |
| `updatedAt` | `Timestamp`       | Firestore server timestamp                |

**Document ID convention:** `PO-YYYY-NNN` (e.g. `PO-2026-001`).

### 2.2 Subcollection: `purchaseOrders/{poId}/items`

Each document is a single SKU line item belonging to a PO.

| Field          | Type            | Description                                            |
|----------------|-----------------|--------------------------------------------------------|
| `sku`          | `string`        | SKU code (e.g. "CKL-472")                             |
| `asin`         | `string` (opt.) | Amazon Standard Identification Number                  |
| `accountId`    | `string`        | Account code (e.g. "AC1"); mapped to `account` in app |
| `category`     | `string`        | One of `DISCONTINUED_FBM`, `EXISTING_FBM`, `NEW_FBA` (or their full-text equivalents) |
| `turnoverDays` | `number`        | Estimated turnover in days; mapped to `turnover` in app |
| `investment`   | `number`        | Dollar amount invested                                 |
| `profit`       | `number`        | Projected profit in dollars                            |
| `units`        | `number`        | Number of units                                        |
| `status`       | `string`        | Item status (see section 5)                            |
| `invoices`     | `string[]`      | Firebase Storage download URLs                         |
| `orders`       | `map[]`         | Array of order objects (see section 2.3)               |

**Legacy fields** (read-only, used for migration; not written to by the app):

| Field      | Type            | Migrated to           |
|------------|-----------------|-----------------------|
| `orderId`  | `string` (opt.) | `orders[0].orderId`   |
| `supplier` | `string` (opt.) | `orders[0].supplier`  |
| `subtotal` | `number` (opt.) | `orders[0].subtotal`  |
| `misc`     | `number` (opt.) | `orders[0].misc`      |
| `total`    | `number` (opt.) | `orders[0].total`     |

### 2.3 Order Object (embedded array within each item)

Each element of the `orders` array:

| Field       | Type     | Description                      |
|-------------|----------|----------------------------------|
| `orderId`   | `string` | Order identifier                 |
| `supplier`  | `string` | Supplier name                    |
| `subtotal`  | `number` | Order subtotal ($)               |
| `misc`      | `number` | Miscellaneous costs ($)          |
| `total`     | `number` | Total order cost ($)             |
| `units`     | `number` | Unit count for this order        |
| `orderDate` | `string` | Date in `M/D/YYYY` format       |

### 2.4 Firebase Storage Layout

```
po-invoices/
  {poId}/
    {itemId}/
      filename.pdf
      filename.png
      ...
```

Upload: `uploadBytes()` -> `getDownloadURL()` -> URL appended to item doc via `arrayUnion()`.
Read: `listAll()` on folder path -> `getDownloadURL()` for each ref.

---

## 3. Data Relationships

```
purchaseOrders (collection)
  └── PO-2026-001 (document)
        ├── name, month, year, status, createdAt, updatedAt
        └── items (subcollection)
              └── {itemId} (document)
                    ├── sku, asin, accountId, category, turnoverDays
                    ├── investment, profit, units, status
                    ├── orders: [ {orderId, supplier, subtotal, misc, total, units, orderDate}, ... ]
                    └── invoices: [ "https://firebasestorage.googleapis.com/...", ... ]
```

| Relationship        | Cardinality | Mechanism              |
|----------------------|-------------|------------------------|
| PO -> Items          | 1 : N       | Firestore subcollection |
| Item -> Orders       | 1 : N       | Embedded array          |
| Item -> Invoices     | 1 : N       | Embedded URL array + Storage files |
| Items -> Accounts    | N : 1       | Grouped by `accountId` (computed client-side) |

---

## 4. PO Status Progression

Statuses are forward-only. Defined in `PO_STATUS_ORDER`:

```
Draft -> Awaiting Payment -> Created -> Approved -> Partially Processed -> Processed
```

**Rules:**
- `advancePOStatus(poId, currentStatus)` moves one step forward.
- Cannot skip steps. Cannot move backward.
- `Processed` is the terminal state.
- Each advance writes `status` and `updatedAt` to the PO document.

---

## 5. Item Status Logic

| Status                | Default? | Allowed Transitions                       |
|-----------------------|----------|-------------------------------------------|
| `Awaiting Payment`    | Yes      | -> `Partially Processed`, `Processed`, `Excluded` |
| `Partially Processed` | No       | None (terminal)                           |
| `Processed`           | No       | None (terminal)                           |
| `Excluded`            | No       | None (terminal)                           |

**Rules:**
- Only items with status `Awaiting Payment` can be changed.
- Once changed, the status is locked permanently.
- `updateItemStatus()` enforces: `currentStatus` must be `Awaiting Payment`, and `newStatus` must be one of the three valid targets.

---

## 6. Business Logic: Progress Classification

Items are classified for progress tracking based on their `orders` array, independently of their `status` field.

### 6.1 Per-Item Classification

| Classification | Condition                                                         |
|---------------|-------------------------------------------------------------------|
| **Processed** | `orders.length > 0` AND `sum(orders[].subtotal) >= item.investment` |
| **Partial**   | `orders.length > 0` AND `0 < sum(orders[].subtotal) < item.investment` |
| **Pending**   | `orders.length === 0` OR `sum(orders[].subtotal) === 0`           |

### 6.2 Investment Progress (aggregated)

```
processedInvestment = SUM(investment) for all items classified "Processed"
partialInvestment   = SUM(investment) for all items classified "Partial"
pendingInvestment   = SUM(investment) for all items classified "Pending"
totalInvestment     = SUM(investment) for all items

investmentProgress% = (processedInvestment / totalInvestment) * 100
```

### 6.3 SKU Progress (aggregated)

```
processedSKUs = COUNT of items classified "Processed"
partialSKUs   = COUNT of items classified "Partial"
pendingSKUs   = COUNT of items classified "Pending"
totalSKUs     = COUNT of all items

skuCompletion% = (processedSKUs / totalSKUs) * 100
```

### 6.4 Account-Level Progress

Per account (items grouped by `accountId`):

```
accountProcessed% = (processedInvestment for account / totalInvestment for account) * 100
```

Computed by `calculateAccountProgress(items, accountName)`. Returns `{ name, totalInvestment, processedInvestment, percentage }`.

---

## 7. Calculations: Overall Stats

Computed client-side by `computeOverallStats(items)`:

| Stat              | Formula                                   | Rounding     |
|-------------------|--------------------------------------------|-------------|
| `totalInvestment` | `SUM(items[].investment)`                  | 2 decimals  |
| `totalProfit`     | `SUM(items[].profit)`                      | 2 decimals  |
| `avgTurnover`     | `AVG(items[].turnover)` = sum/count        | 2 decimals  |

---

## 8. Calculations: Account Stats

Computed client-side by `computeAccountStats(items)`:

Items are grouped by `account` field (mapped from `accountId`). Per group:

| Stat         | Formula                                    | Rounding    |
|--------------|--------------------------------------------|-------------|
| `investment` | `SUM(accountItems[].investment)`           | 2 decimals  |
| `profit`     | `SUM(accountItems[].profit)`               | 2 decimals  |
| `turnover`   | `AVG(accountItems[].turnover)` = sum/count | 2 decimals  |
| `ROI`        | `(profit / investment) * 100`              | UI-computed |

Output is sorted by `investment` descending.

---

## 9. Field Mapping: Firestore -> Application

| Firestore Field           | App Field             | Transform                        |
|---------------------------|-----------------------|----------------------------------|
| `accountId`               | `account`             | Direct rename                    |
| `turnoverDays`            | `turnover`            | Direct rename                    |
| `category` (string)       | `category` (SkuCategory enum) | `mapCategory()` lookup    |
| `createdAt` (Timestamp)   | `createdAt` (Date)    | `.toDate()` conversion           |
| `updatedAt` (Timestamp)   | `updatedAt` (Date)    | `.toDate()` conversion           |

### Category Mapping Table

| Firestore Value                      | Enum Value           |
|--------------------------------------|----------------------|
| `DISCONTINUED_FBM`                   | `DISCONTINUED_FBM`   |
| `Previously Discontinued SKUs (FBM)` | `DISCONTINUED_FBM`   |
| `EXISTING_FBM`                       | `EXISTING_FBM`       |
| `Existing SKUs (FBM)`                | `EXISTING_FBM`       |
| `NEW_FBA`                            | `NEW_FBA`            |
| `New SKUs (FBA)`                     | `NEW_FBA`            |
| *(any other value)*                  | `NEW_FBA` (fallback) |

---

## 10. Legacy Order Migration

Handled at read-time in `loadPurchaseOrder()`. Not a destructive migration.

1. If `orders[]` array exists with `length > 0`: use directly; backfill any entry missing `orderDate` with the current date string.
2. Else if any legacy field (`orderId`, `supplier`, `subtotal`, `misc`, `total`) has a truthy value: construct a single-element `orders[]` array from those fields with `orderDate` set to current date.
3. Else: assign empty `orders[]` array.

Legacy fields remain in Firestore untouched. The app only ever writes `orders[]` going forward.

---

## 11. Features

### 11.1 PO Management
- Dropdown selector listing all POs (sorted newest-first by `createdAt`).
- Selected PO ID persisted in URL query parameter (`?poId=PO-2026-001`); on load, the app reads this param to restore selection.
- Forward-only status advancement via kebab menu button.

### 11.2 Dashboard Overview
- **Summary Cards:** Three cards showing Total Investment, Total Profit, Average Turnover.
- **Account Breakdown:** Card grid (one per account) showing Investment, Profit, Turnover days, ROI percentage, and a mini radial progress chart.
- Accounts sortable by Investment, Profit, Turnover, or ROI.

### 11.3 SKU Table
- Columns: SKU, ASIN, Account, Category, Turnover, Investment, Profit, Status.
- Search by SKU, Account, or ASIN (case-insensitive substring match).
- Category filter dropdown (All / Discontinued FBM / Existing FBM / New FBA).
- Column sort (ascending/descending) on SKU, Account, Category, Turnover, Investment, Profit.
- Row click opens Item Drawer.

### 11.4 Item Drawer (Side Panel)
- Displays item metadata: SKU, ASIN, Category, Status, Account, Units, Turnover, Investment, Profit.
- **Orders CRUD:**
  - List all orders for the item.
  - Add new order (creates a blank order with current date, saves to Firestore, opens in edit mode).
  - Edit any order inline (pencil icon toggles edit mode; save/cancel buttons).
  - Delete any order (immediate Firestore write).
  - Order fields: Order Date (three numeric inputs for MM/DD/YYYY with formatted word preview), Order ID, Supplier, Subtotal, Misc, Total, Units.
- **Status Controls:** Three buttons (Partial, Done, Skip) available only when status is `Awaiting Payment`.
- **Invoice Management:**
  - Upload files via click (accepted types: PDF, PNG, JPG, JPEG, DOC, DOCX).
  - Files uploaded to Firebase Storage under `po-invoices/{poId}/{itemId}/`.
  - Download URL appended to item's `invoices[]` array via `arrayUnion()`.
  - List of uploaded invoices with download button.

### 11.5 Detailed Progress Drawer
- Investment Progress: animated segmented bar (Processed blue / Partial light-blue / Pending gray) with currency breakdown.
- SKU Progress: animated segmented bar with count breakdown.
- Account Breakdown: per-account mini progress bars showing processed/total investment.
- All values animate on drawer open using staggered delays.

### 11.6 Export
- **CSV:** Downloads `.csv` file with columns: SKU, Account, Category, Turnover, Investment, Profit, Status. Filename includes current date.
- **PDF:** Triggers `window.print()` with document title set to `KV_Purchase_Order_2_Jan_2026` for auto-naming the saved file.

### 11.7 Telemetry
- Runs on Supabase (separate from Firebase).
- **Tables:** `telemetry_logs` (one-time snapshot), `telemetry_events` (ongoing events).
- **Session:** UUID generated per page load, stored in module-level constant.
- **Tracked events:**
  - `page_load` -- URL on initial load.
  - `click` -- every click with target tag, id, class, inner text (100 char limit), x/y coords.
  - `heartbeat` -- every 10 seconds with cumulative session duration in ms.
- **Snapshot payload** (once per session): IP geolocation (ipify, ipapi, ipinfo, ipdata, ipregistry), navigator properties, User-Agent data (high entropy), screen/window dimensions, timezone/locale, battery status, network info, GPU renderer info (WebGL).

---

## 12. Data Flow

```
APP MOUNT
  ├─ initializeTelemetry()
  │    ├─ collectAndSendSnapshot() ──> Supabase: telemetry_logs
  │    ├─ logPageLoad()            ──> Supabase: telemetry_events
  │    ├─ setupClickTracking()     ──> Supabase: telemetry_events (ongoing)
  │    └─ setupHeartbeat()         ──> Supabase: telemetry_events (every 10s)
  │
  └─ loadAllPurchaseOrders()
       └─ Firestore: purchaseOrders collection ──> PurchaseOrder[]
             └─ Sorted by createdAt DESC
             └─ First PO (or URL ?poId) auto-selected

PO SELECTED / CHANGED
  └─ loadPurchaseOrder(poId)
       ├─ Firestore: purchaseOrders/{poId} ──> PO metadata
       ├─ Firestore: purchaseOrders/{poId}/items ──> SkuDataWithId[]
       │    └─ Per item:
       │         ├─ Rename accountId->account, turnoverDays->turnover
       │         ├─ mapCategory(string) -> SkuCategory enum
       │         └─ Migrate legacy order fields -> orders[]
       ├─ computeOverallStats(items) ──> OverallStats
       └─ computeAccountStats(items) ──> AccountStat[]

DATA -> UI COMPONENTS
  ├─ OverallStats ──> SummaryCards
  ├─ AccountStat[] + items ──> AccountBreakdown (+ MiniRadialChart progress)
  ├─ SkuDataWithId[] ──> SkuTable (search, filter, sort, row click)
  ├─ SkuDataWithId[] ──> DetailedProgressDrawer (progress calculations)
  └─ Single item ──> ItemDrawer (on row click)

WRITE OPERATIONS (all save to Firestore, then trigger full re-fetch)
  ├─ advancePOStatus()   ──> purchaseOrders/{poId}.status + updatedAt
  ├─ updateItemStatus()  ──> items/{itemId}.status
  ├─ updateItemOrders()  ──> items/{itemId}.orders (full array overwrite)
  └─ uploadInvoice()     ──> Firebase Storage + items/{itemId}.invoices (arrayUnion)

POST-WRITE
  └─ refreshData() ──> re-calls loadPurchaseOrder(poId) ──> all state refreshed
```

---

## 13. API Functions (`lib/loadPurchaseOrder.ts`)

| Function                 | Signature                                                    | Returns                   | Description                                      |
|--------------------------|--------------------------------------------------------------|---------------------------|--------------------------------------------------|
| `loadPurchaseOrder`      | `(poId?: string)`                                            | `LoadPurchaseOrderResult` | Fetches PO doc + items subcollection + computes stats |
| `loadAllPurchaseOrders`  | `()`                                                         | `PurchaseOrder[]`         | Fetches all PO docs, sorted by createdAt desc     |
| `advancePOStatus`        | `(poId: string, currentStatus: POStatus)`                    | `POStatus \| null`        | Advances PO status one step forward               |
| `updateItemStatus`       | `(poId: string, itemId: string, current: ItemStatus, new: ItemStatus)` | `boolean`      | Changes item status (only from Awaiting Payment)  |
| `uploadInvoice`          | `(poId: string, itemId: string, file: File)`                 | `string` (download URL)   | Uploads file to Storage + appends URL to item doc |
| `getItemInvoices`        | `(poId: string, itemId: string)`                             | `string[]`                | Lists all invoice download URLs from Storage      |
| `updateItemOrders`       | `(poId: string, itemId: string, orders: OrderEntry[])`       | `boolean`                 | Overwrites item's orders array                    |

Helper functions (not exported):

| Function              | Purpose                                               |
|-----------------------|-------------------------------------------------------|
| `getCurrentDateString`| Returns current date as `MM/DD/YYYY` string           |
| `mapCategory`         | Maps Firestore category string to `SkuCategory` enum  |
| `computeOverallStats` | Aggregates investment, profit, turnover from items     |
| `computeAccountStats` | Groups items by account and computes per-account stats |

---

## 14. TypeScript Types (`types.ts`)

```typescript
type POStatus = 'Draft' | 'Awaiting Payment' | 'Created' | 'Approved'
              | 'Partially Processed' | 'Processed';

type ItemStatus = 'Awaiting Payment' | 'Partially Processed' | 'Processed' | 'Excluded';

enum SkuCategory {
  DISCONTINUED_FBM = "Previously Discontinued SKUs (FBM)",
  EXISTING_FBM     = "Existing SKUs (FBM)",
  NEW_FBA          = "New SKUs (FBA)"
}

interface PurchaseOrder {
  id: string; name: string; month: string; year: number;
  status: POStatus; createdAt: Date; updatedAt: Date;
}

interface SkuData {
  sku: string; account: string; turnover: number;
  investment: number; profit: number; status: string; category: SkuCategory;
}

interface SkuDataWithId extends SkuData {
  id: string; units: number; asin?: string;
  invoices?: string[]; orders: OrderEntry[];
}

interface OrderEntry {
  orderId: string; supplier: string; subtotal: number;
  misc: number; total: number; units: number; orderDate: string;
}

interface OverallStats { totalInvestment: number; totalProfit: number; avgTurnover: number; }
interface AccountStat { name: string; investment: number; profit: number; turnover: number; }
```

---

## 15. Static Seed Data (`data.ts`)

Contains hardcoded sample data: `OVERALL_STATS`, `ACCOUNT_STATS` (7 accounts), and `SKU_DATA` (100+ SKUs across three categories). This data is **not used at runtime**. The app exclusively reads from Firestore. It exists as reference/seed data only.

---

## 16. File Structure

```
/
├── App.tsx                          # Root component, state management, layout
├── types.ts                         # All TypeScript interfaces and enums
├── data.ts                          # Static seed/reference data (unused at runtime)
├── telemetry.ts                     # Supabase telemetry (session, events, snapshot)
├── index.tsx                        # React DOM entry point
├── vite.config.ts                   # Vite configuration
├── lib/
│   ├── firebase.ts                  # Firebase init (Firestore + Storage)
│   └── loadPurchaseOrder.ts         # All Firestore read/write operations
├── components/
│   ├── SummaryCards.tsx              # Investment, Profit, Turnover cards
│   ├── AccountBreakdown.tsx         # Account cards with progress radials
│   ├── SkuTable.tsx                 # SKU table with search/filter/sort
│   ├── POSelector.tsx               # PO dropdown + status advance menu
│   ├── StatusAdvance.tsx            # Status badge + color mapping
│   ├── ItemDrawer.tsx               # Item detail side panel + orders CRUD
│   ├── InvoiceSection.tsx           # Invoice upload/download within ItemDrawer
│   ├── DetailedProgressDrawer.tsx   # Progress analytics drawer
│   └── SkeletonLoader.tsx           # Loading skeleton components
└── BACKEND_DOCS.md                  # Previous documentation version
```

---

## 17. Known Issues / Notes

1. **AccountBreakdown references `progress.investmentProgress` and `progress.processedSKUs`/`progress.totalSKUs`**, but `calculateAccountProgress()` returns `{ name, totalInvestment, processedInvestment, percentage }`. These properties do not exist on the return type, which will cause `undefined` values in the mini radial chart and SKU count display on account cards.

2. **Order date format inconsistency:** `getCurrentDateString()` in `loadPurchaseOrder.ts` zero-pads month/day (`01/05/2026`), while the version in `ItemDrawer.tsx` does not (`1/5/2026`). Both are valid but produce different strings for the same date.

3. **No authentication or authorization.** All Firestore operations are unrestricted. Any user can read all data and write to any document.

4. **Telemetry API keys** (ipinfo, ipdata, ipregistry) are placeholder strings (`YOUR_TOKEN`, `YOUR_KEY`) and will return errors. Only ipify and ipapi calls succeed.
