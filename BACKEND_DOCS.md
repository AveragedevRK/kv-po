# KV Purchase Order Dashboard - Technical Documentation

## Stack Overview

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 19, TypeScript, Vite 6      |
| Database    | Firebase Firestore                |
| File Storage| Firebase Storage                  |
| Telemetry   | Supabase (PostgreSQL)             |
| Icons       | Lucide React                      |
| Charts      | Recharts (unused currently)       |

---

## Firestore Schema

### Collection: `purchaseOrders`

Each document represents a single Purchase Order.

| Field       | Type        | Description                                    |
|-------------|-------------|------------------------------------------------|
| `name`      | `string`    | Display name (e.g., "KV Purchase Order 2")     |
| `month`     | `string`    | Month label (e.g., "January")                  |
| `year`      | `number`    | Year (e.g., 2026)                              |
| `status`    | `string`    | Current PO status (see PO Status Progression)  |
| `createdAt` | `Timestamp` | Firestore server timestamp                     |
| `updatedAt` | `Timestamp` | Firestore server timestamp                     |

**Document ID format:** `PO-YYYY-NNN` (e.g., `PO-2026-001`)

---

### Subcollection: `purchaseOrders/{poId}/items`

Each document represents a single SKU line item within a PO.

| Field         | Type         | Description                                         |
|---------------|--------------|-----------------------------------------------------|
| `sku`         | `string`     | SKU identifier (e.g., "CKL-472")                    |
| `asin`        | `string?`    | Amazon ASIN identifier (optional)                   |
| `accountId`   | `string`     | Account code (e.g., "AC1"). Mapped to `account` in app |
| `category`    | `string`     | One of: `DISCONTINUED_FBM`, `EXISTING_FBM`, `NEW_FBA` |
| `turnoverDays`| `number`     | Estimated turnover in days. Mapped to `turnover` in app |
| `investment`  | `number`     | Dollar amount invested                              |
| `profit`      | `number`     | Projected profit in dollars                         |
| `units`       | `number`     | Number of units                                     |
| `status`      | `string`     | Item status (see Item Status below)                 |
| `invoices`    | `string[]`   | Array of Firebase Storage download URLs              |
| `orders`      | `OrderEntry[]`| Array of order objects (see Orders below)           |

**Legacy fields (deprecated, read for migration only):**

| Field      | Type      | Description                          |
|------------|-----------|--------------------------------------|
| `orderId`  | `string?` | Single order ID (migrated to orders) |
| `supplier` | `string?` | Single supplier (migrated to orders) |
| `subtotal` | `number?` | Single subtotal (migrated to orders) |
| `misc`     | `number?` | Single misc cost (migrated to orders)|
| `total`    | `number?` | Single total (migrated to orders)    |

---

### Orders Array Structure (embedded in each item)

Each item contains an `orders` array. Each entry:

| Field       | Type     | Description                                 |
|-------------|----------|---------------------------------------------|
| `orderId`   | `string` | Order identifier                            |
| `supplier`  | `string` | Supplier name                               |
| `subtotal`  | `number` | Order subtotal in dollars                   |
| `misc`      | `number` | Miscellaneous costs in dollars              |
| `total`     | `number` | Total order cost in dollars                 |
| `units`     | `number` | Number of units in this order               |
| `orderDate` | `string` | Date string in `MM/DD/YYYY` format          |

---

### Firebase Storage Structure

```
po-invoices/
  {poId}/
    {itemId}/
      invoice1.pdf
      invoice2.png
      ...
```

Files are uploaded via `uploadBytes()` and URLs stored in the item's `invoices` array via `arrayUnion()`.

---

## Data Relationships

```
purchaseOrders (collection)
  └── PO-2026-001 (document)
        ├── name, month, year, status, createdAt, updatedAt
        └── items (subcollection)
              ├── {itemId1} (document)
              │     ├── sku, asin, accountId, category, ...
              │     ├── orders: [{ orderId, supplier, subtotal, ... }, ...]
              │     └── invoices: ["https://...url1", "https://...url2"]
              ├── {itemId2}
              └── ...
```

- One PO has many items (1:N via subcollection)
- One item has many orders (1:N via embedded array)
- One item has many invoices (1:N via embedded URL array + Storage files)
- Items are grouped by `accountId` for account-level reporting (computed client-side)

---

## PO Status Progression

Statuses advance forward-only in this order:

```
Draft → Awaiting Payment → Created → Approved → Partially Processed → Processed
```

- `advancePOStatus()` moves to the next status in the sequence
- Cannot move backward
- Cannot advance past `Processed` (final state)
- Each advance updates `status` and `updatedAt` on the PO document

---

## Item Status Logic

| Status                | Description                                    | Transitions Allowed       |
|-----------------------|------------------------------------------------|---------------------------|
| `Awaiting Payment`    | Default status for new items                   | -> Partially Processed, Processed, Excluded |
| `Partially Processed` | Item has been partially fulfilled              | None (terminal)           |
| `Processed`           | Item fully fulfilled                           | None (terminal)           |
| `Excluded`            | Item excluded from PO                          | None (terminal)           |

- Status changes are one-way: only `Awaiting Payment` items can transition
- Once set to any other status, the item is locked

---

## Business Logic: Progress Calculations

### Item-Level Classification (for progress tracking)

Items are classified into three buckets based on their orders:

| Classification | Rule                                                                |
|---------------|---------------------------------------------------------------------|
| **Processed** | `sum(orders[].subtotal) >= item.investment`                         |
| **Partial**   | `orders.length > 0` AND `sum(orders[].subtotal) > 0` AND `sum < investment` |
| **Pending**   | `orders.length === 0` OR `sum(orders[].subtotal) === 0`            |

### Investment Progress

```
processedInvestment = sum of investment for all "Processed" items
partialInvestment   = sum of investment for all "Partial" items
pendingInvestment   = sum of investment for all "Pending" items
totalInvestment     = sum of all item investments

investmentProgress% = (processedInvestment / totalInvestment) * 100
```

### SKU Progress

```
processedSKUs = count of "Processed" items
partialSKUs   = count of "Partial" items
pendingSKUs   = count of "Pending" items
totalSKUs     = total item count

skuProgress% = (processedSKUs / totalSKUs) * 100
```

### Account-Level Progress

Per account (grouped by `accountId`):

```
accountProcessed% = (processedInvestment for account / totalInvestment for account) * 100
```

---

## Calculations: Overall Stats

Computed client-side from loaded items via `computeOverallStats()`:

| Stat              | Formula                                                 |
|-------------------|---------------------------------------------------------|
| `totalInvestment` | `sum(items[].investment)`, rounded to 2 decimals        |
| `totalProfit`     | `sum(items[].profit)`, rounded to 2 decimals            |
| `avgTurnover`     | `avg(items[].turnover)`, rounded to 2 decimals          |

---

## Calculations: Account Stats

Computed client-side from loaded items via `computeAccountStats()`:

Items are grouped by `account` (mapped from `accountId`). Per account:

| Stat         | Formula                                                  |
|--------------|----------------------------------------------------------|
| `investment` | `sum(accountItems[].investment)`, rounded to 2 decimals  |
| `profit`     | `sum(accountItems[].profit)`, rounded to 2 decimals      |
| `turnover`   | `avg(accountItems[].turnover)`, rounded to 2 decimals    |
| `ROI`        | `(profit / investment) * 100` (computed in UI)           |

Accounts are sorted by investment descending by default.

---

## Field Mapping: Firestore -> App

| Firestore Field  | App Field    | Notes                          |
|-------------------|-------------|--------------------------------|
| `accountId`       | `account`   | Renamed during load            |
| `turnoverDays`    | `turnover`  | Renamed during load            |
| `category` (string)| `category` (enum) | Mapped via `mapCategory()` |

### Category Mapping

| Firestore Value                          | Enum Value            |
|------------------------------------------|-----------------------|
| `DISCONTINUED_FBM`                       | `DISCONTINUED_FBM`    |
| `Previously Discontinued SKUs (FBM)`     | `DISCONTINUED_FBM`    |
| `EXISTING_FBM`                           | `EXISTING_FBM`        |
| `Existing SKUs (FBM)`                    | `EXISTING_FBM`        |
| `NEW_FBA`                                | `NEW_FBA`             |
| `New SKUs (FBA)`                         | `NEW_FBA`             |
| *(fallback)*                             | `NEW_FBA`             |

---

## Legacy Data Migration

When loading items, the system handles legacy single-order data:

1. If `orders[]` array exists and has entries -> use it directly, backfill missing `orderDate` with current date
2. Else if any legacy field (`orderId`, `supplier`, `subtotal`, `misc`, `total`) exists -> convert to a single-entry `orders[]` array
3. Else -> empty `orders[]` array

This is a read-time migration only; the legacy fields are not deleted from Firestore.

---

## Features Implemented

### 1. PO Management
- **PO Selector:** Dropdown to switch between Purchase Orders
- **PO Status Advancement:** Forward-only status progression via button
- **URL Persistence:** Selected PO ID stored in URL query param (`?poId=PO-2026-001`)
- **PO Listing:** All POs fetched and sorted by `createdAt` descending

### 2. Dashboard Overview
- **Summary Cards:** Total Investment, Total Profit, Average Turnover
- **Account Breakdown:** Cards per account showing investment, profit, turnover, ROI, with mini radial progress chart
- **Account Sorting:** Sort accounts by Investment, Profit, Turnover, or ROI (ascending/descending)

### 3. SKU Table
- **Full Table:** All items displayed with columns: SKU, ASIN, Account, Category, Turnover, Investment, Profit, Status
- **Search:** Filter by SKU, Account, or ASIN
- **Category Filter:** Filter by SKU category (Discontinued FBM, Existing FBM, New FBA)
- **Sorting:** Sortable by SKU, Account, Turnover, Investment, Profit columns
- **Row Click:** Opens Item Drawer for detailed view

### 4. Item Drawer (Side Panel)
- **Item Details:** SKU, ASIN, Category badge, Status badge, Account, Units, Turnover, Investment, Profit
- **Orders Management:**
  - View all orders for an item
  - Add new orders (saved to Firestore immediately)
  - Edit orders inline (pencil icon to toggle edit mode)
  - Delete orders (saved to Firestore immediately)
  - Each order has: Date, Order ID, Supplier, Subtotal, Misc, Total, Units
  - Order date displayed as both numeric (`3/9/2026`) and words (`March 9th, 2026`)
- **Status Controls:** Change item status (Awaiting Payment -> Partial/Done/Skip)
- **Invoice Upload:** Upload files to Firebase Storage, URLs saved to item's `invoices[]`
- **Invoice List:** Download/view previously uploaded invoices

### 5. Detailed Progress Drawer
- **Investment Progress:** Animated progress bar showing Processed/Partial/Pending investment breakdown
- **SKU Progress:** Animated progress bar showing Processed/Partial/Pending SKU count breakdown
- **Account Breakdown:** Per-account progress bars with investment amounts
- **Animated Numbers:** Currency and count values animate on open

### 6. Export
- **CSV Export:** Exports SKU data (SKU, Account, Category, Turnover, Investment, Profit, Status)
- **PDF Export:** Triggers browser print dialog with formatted title for auto-naming

### 7. Telemetry (Supabase)
- **Supabase Tables Used:** `telemetry_logs`, `telemetry_events`
- **Session Tracking:** UUID-based session ID generated per page load
- **Events Tracked:**
  - `page_load` - URL logged on load
  - `click` - Every click event with target tag, id, class, text, x/y coordinates
  - `heartbeat` - Every 10 seconds with session duration
- **Snapshot:** One-time payload on load containing IP geo data, navigator info, screen/window dimensions, battery, network, GPU info

---

## Data Flow

```
1. App mounts
   ├── initializeTelemetry() -> Supabase (telemetry_logs + telemetry_events)
   └── loadAllPurchaseOrders() -> Firestore: purchaseOrders collection
         └── Returns PurchaseOrder[] sorted by createdAt desc
               └── First PO (or URL-specified PO) selected

2. PO selected/changed
   └── loadPurchaseOrder(poId) -> Firestore
         ├── Reads purchaseOrders/{poId} document -> PO metadata
         ├── Reads purchaseOrders/{poId}/items subcollection -> SkuDataWithId[]
         │     └── For each item:
         │           ├── Field mapping (accountId->account, turnoverDays->turnover)
         │           ├── Category mapping (string->enum)
         │           └── Orders migration (legacy single -> array)
         ├── computeOverallStats(items) -> OverallStats
         └── computeAccountStats(items) -> AccountStat[]

3. Data flows to UI:
   ├── OverallStats -> SummaryCards
   ├── AccountStat[] + items -> AccountBreakdown (with progress radials)
   ├── SkuDataWithId[] -> SkuTable (search, filter, sort)
   ├── SkuDataWithId[] -> DetailedProgressDrawer (progress calculations)
   └── Single SkuDataWithId -> ItemDrawer (on row click)

4. Write operations (all save to Firestore immediately):
   ├── advancePOStatus() -> updates purchaseOrders/{poId}.status
   ├── updateItemStatus() -> updates items/{itemId}.status
   ├── updateItemOrders() -> updates items/{itemId}.orders array
   └── uploadInvoice() -> Firebase Storage + items/{itemId}.invoices array

5. After any write -> refreshData() re-fetches entire PO data from Firestore
```

---

## API Functions (lib/loadPurchaseOrder.ts)

| Function                 | Parameters                            | Returns                  | Description                                |
|--------------------------|---------------------------------------|--------------------------|--------------------------------------------|
| `loadPurchaseOrder`      | `poId?: string`                       | `LoadPurchaseOrderResult`| Fetches PO + items + computed stats        |
| `loadAllPurchaseOrders`  | none                                  | `PurchaseOrder[]`        | Fetches all POs for selector               |
| `advancePOStatus`        | `poId, currentStatus`                 | `POStatus \| null`       | Advances PO status forward one step        |
| `updateItemStatus`       | `poId, itemId, currentStatus, newStatus` | `boolean`             | Changes item status (one-way from Awaiting)|
| `uploadInvoice`          | `poId, itemId, file`                  | `string` (URL)           | Uploads file + adds URL to item            |
| `getItemInvoices`        | `poId, itemId`                        | `string[]`               | Lists all invoice URLs from Storage        |
| `updateItemOrders`       | `poId, itemId, orders`                | `boolean`                | Overwrites item's orders array             |

---

## Static Fallback Data (data.ts)

The file `data.ts` contains hardcoded sample data with 100+ SKUs across 7 accounts. This data is **not used at runtime** -- the app exclusively reads from Firestore. It serves as reference/seed data only.

---

## Environment & Config

| Item                 | Value / Location                            |
|----------------------|---------------------------------------------|
| Firebase Project     | `purchase-orders-5c899`                     |
| Firebase Config      | `lib/firebase.ts` (hardcoded)               |
| Supabase URL         | `https://jnmbqnfuouuwzkfzvunh.supabase.co`  |
| Supabase Anon Key    | Hardcoded in `telemetry.ts`                 |
| Dev Server Port      | 3000                                        |
| Build Tool           | Vite 6 with React plugin                    |
| Default PO ID        | `PO-2026-001`                               |
