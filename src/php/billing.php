<?php
/**
 * PothHalaPro - Fast Billing POS & Counter Sales REST API
 *
 * Handles bookshop counter item catalog, thermal receipt creation,
 * line item transactions, daily sales summaries, and 1:1 print job logs.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

function handleBillingRequest() {
    handleCors();
    $db = DB::getInstance();
    $params = getRequestBody();

    $action = isset($params['action']) ? trim($params['action']) : '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // If POST and no action specified, default to create_receipt
    if ($method === 'POST' && empty($action)) {
        $action = 'create_receipt';
    } elseif (empty($action)) {
        $action = 'items';
    }

    switch ($action) {
        // -------------------------------------------------------------
        // 1. GET ITEM PRICING CATALOG
        // -------------------------------------------------------------
        case 'items':
        case 'catalog':
            $category = isset($params['category']) ? trim($params['category']) : null;
            $quickOnly = isset($params['quick_only']) ? (bool)$params['quick_only'] : false;

            if (!$db->isConnected()) {
                jsonError('Database unavailable.', 500);
            }

            $sql = "SELECT * FROM item_pricing WHERE is_active = 1";
            $sqlParams = [];

            if ($category) {
                $sql .= " AND category = ?";
                $sqlParams[] = $category;
            }
            if ($quickOnly) {
                $sql .= " AND is_pos_quick_item = 1";
            }
            $sql .= " ORDER BY is_pos_quick_item DESC, quick_item_order ASC, id ASC";

            $items = $db->fetchAll($sql, $sqlParams);
            if (empty($items)) {
                $db->seedDefaultItems();
                $items = $db->fetchAll($sql, $sqlParams);
            }

            jsonResponse([
                'success' => true,
                'count' => count($items),
                'currency' => 'LKR',
                'items' => $items
            ], 200);
            break;

        // -------------------------------------------------------------
        // 2. CREATE COUNTER SALES RECEIPT
        // -------------------------------------------------------------
        case 'create_receipt':
        case 'checkout':
            $items = isset($params['items']) && is_array($params['items']) ? $params['items'] : [];
            if (empty($items)) {
                jsonError('Cannot create an empty receipt. Provide at least one item.', 400);
            }

            $cashier = !empty($params['cashier_name']) ? trim($params['cashier_name']) : 'Counter Cashier';
            $terminal = !empty($params['terminal_label']) ? trim($params['terminal_label']) : 'Terminal 1';
            $paymentMethod = !empty($params['payment_method']) ? strtoupper(trim($params['payment_method'])) : 'CASH';
            $paymentRef = !empty($params['payment_reference']) ? trim($params['payment_reference']) : null;
            $notes = !empty($params['notes']) ? trim($params['notes']) : null;
            $discountPercent = isset($params['discount_percent']) ? max(0, min(100, (float)$params['discount_percent'])) : 0.0;
            $cashTendered = isset($params['cash_tendered']) ? max(0, (float)$params['cash_tendered']) : 0.0;

            // Calculate totals
            $subtotal = 0.0;
            $totalQty = 0;
            $sanitizedItems = [];

            foreach ($items as $item) {
                $name = isset($item['name']) ? trim($item['name']) : (isset($item['item_name']) ? trim($item['item_name']) : 'Service Item');
                $price = isset($item['price']) ? (float)$item['price'] : (isset($item['unit_price']) ? (float)$item['unit_price'] : 0.0);
                $qty = isset($item['qty']) ? max(1, (int)$item['qty']) : (isset($item['quantity']) ? max(1, (int)$item['quantity']) : 1);
                $lineTotal = round($price * $qty, 2);
                $pricingId = isset($item['item_pricing_id']) ? (int)$item['item_pricing_id'] : (isset($item['id']) ? (int)$item['id'] : null);
                $itemNotes = isset($item['notes']) ? trim($item['notes']) : null;

                $subtotal += $lineTotal;
                $totalQty += $qty;

                $sanitizedItems[] = [
                    'name' => $name,
                    'price' => $price,
                    'qty' => $qty,
                    'line_total' => $lineTotal,
                    'pricing_id' => $pricingId,
                    'notes' => $itemNotes
                ];
            }

            $discountAmount = round($subtotal * ($discountPercent / 100), 2);
            $grandTotal = max(0, round($subtotal - $discountAmount, 2));

            // Default cash tendered if CASH payment and not specified
            if ($paymentMethod === 'CASH' && $cashTendered < $grandTotal) {
                $cashTendered = $grandTotal;
            }
            $changeDue = max(0, round($cashTendered - $grandTotal, 2));

            // Generate receipt number e.g. RCP-202611-0008
            $prefix = 'RCP-' . date('Ym') . '-';
            $nextSeq = 1;
            if ($db->isConnected()) {
                try {
                    $last = $db->fetchOne(
                        "SELECT receipt_number FROM counter_receipts WHERE receipt_number LIKE ? ORDER BY id DESC LIMIT 1",
                        [$prefix . '%']
                    );
                    if ($last) {
                        $parts = explode('-', $last['receipt_number']);
                        if (count($parts) === 3) {
                            $nextSeq = (int)$parts[2] + 1;
                        }
                    }
                } catch (Exception $e) {
                    $nextSeq = random_int(1000, 9999);
                }
            }
            $receiptNumber = $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

            // Database Insertion
            $receiptId = null;
            if ($db->isConnected()) {
                $db->beginTransaction();
                try {
                    $receiptId = $db->insert('counter_receipts', [
                        'receipt_number' => $receiptNumber,
                        'cashier_name' => $cashier,
                        'terminal_label' => $terminal,
                        'subtotal' => $subtotal,
                        'discount_percent' => $discountPercent,
                        'discount_amount' => $discountAmount,
                        'grand_total' => $grandTotal,
                        'cash_tendered' => $cashTendered,
                        'change_due' => $changeDue,
                        'payment_method' => $paymentMethod,
                        'payment_reference' => $paymentRef,
                        'item_count' => $totalQty,
                        'notes' => $notes,
                        'receipt_date' => date('Y-m-d H:i:s')
                    ]);

                    foreach ($sanitizedItems as $sItem) {
                        $db->insert('receipt_items', [
                            'receipt_id' => $receiptId,
                            'item_pricing_id' => $sItem['pricing_id'],
                            'item_name' => $sItem['name'],
                            'unit_price' => $sItem['price'],
                            'quantity' => $sItem['qty'],
                            'line_total' => $sItem['line_total'],
                            'notes' => $sItem['notes']
                        ]);
                    }

                    $db->commit();
                } catch (Exception $e) {
                    $db->rollBack();
                    jsonError('Failed to record receipt in database: ' . $e->getMessage(), 500);
                }
            }

            // Generate Thermal ESC/POS Receipt ASCII Format
            $thermalReceipt = generateThermalReceiptText([
                'receipt_number' => $receiptNumber,
                'date' => date('Y-m-d H:i:s'),
                'cashier' => $cashier,
                'terminal' => $terminal,
                'items' => $sanitizedItems,
                'subtotal' => $subtotal,
                'discount_percent' => $discountPercent,
                'discount_amount' => $discountAmount,
                'grand_total' => $grandTotal,
                'cash_tendered' => $cashTendered,
                'change_due' => $changeDue,
                'payment_method' => $paymentMethod,
                'payment_reference' => $paymentRef
            ]);

            jsonResponse([
                'success' => true,
                'receipt_id' => $receiptId,
                'receipt_number' => $receiptNumber,
                'receipt_date' => date('Y-m-d H:i:s'),
                'cashier_name' => $cashier,
                'terminal_label' => $terminal,
                'totals' => [
                    'subtotal' => $subtotal,
                    'discount_percent' => $discountPercent,
                    'discount_amount' => $discountAmount,
                    'grand_total' => $grandTotal,
                    'cash_tendered' => $cashTendered,
                    'change_due' => $changeDue,
                    'currency' => 'LKR'
                ],
                'payment' => [
                    'method' => $paymentMethod,
                    'reference' => $paymentRef
                ],
                'item_count' => $totalQty,
                'items' => $sanitizedItems,
                'thermal_receipt_text' => $thermalReceipt
            ], 201);
            break;

        // -------------------------------------------------------------
        // 3. GET RECEIPT HISTORY
        // -------------------------------------------------------------
        case 'receipts':
        case 'list':
            $limit = isset($params['limit']) ? min(100, max(1, (int)$params['limit'])) : 20;
            $offset = isset($params['offset']) ? max(0, (int)$params['offset']) : 0;
            $date = isset($params['date']) ? trim($params['date']) : null;

            if (!$db->isConnected()) {
                jsonResponse(['receipts' => [], 'count' => 0], 200);
            }

            $sql = "SELECT * FROM counter_receipts";
            $sqlParams = [];
            if ($date) {
                $sql .= " WHERE DATE(receipt_date) = ?";
                $sqlParams[] = $date;
            }
            $sql .= " ORDER BY receipt_date DESC LIMIT ? OFFSET ?";
            $sqlParams[] = $limit;
            $sqlParams[] = $offset;

            $receipts = $db->fetchAll($sql, $sqlParams);
            jsonResponse([
                'count' => count($receipts),
                'limit' => $limit,
                'offset' => $offset,
                'receipts' => $receipts
            ], 200);
            break;

        // -------------------------------------------------------------
        // 4. GET SINGLE RECEIPT WITH LINE ITEMS
        // -------------------------------------------------------------
        case 'receipt':
        case 'get':
            $id = isset($params['id']) ? (int)$params['id'] : null;
            $number = isset($params['receipt_number']) ? trim($params['receipt_number']) : (isset($params['number']) ? trim($params['number']) : null);

            if (!$id && !$number) {
                jsonError('Receipt ID or number required.', 400);
            }

            if (!$db->isConnected()) {
                jsonError('Database unavailable.', 500);
            }

            if ($id) {
                $receipt = $db->fetchOne("SELECT * FROM counter_receipts WHERE id = ?", [$id]);
            } else {
                $receipt = $db->fetchOne("SELECT * FROM counter_receipts WHERE receipt_number = ?", [$number]);
            }

            if (!$receipt) {
                jsonError('Receipt not found.', 404);
            }

            $lineItems = $db->fetchAll(
                "SELECT * FROM receipt_items WHERE receipt_id = ? ORDER BY id ASC",
                [$receipt['id']]
            );

            $receipt['items'] = $lineItems;
            jsonResponse(['receipt' => $receipt], 200);
            break;

        // -------------------------------------------------------------
        // 5. DAILY SALES SUMMARY
        // -------------------------------------------------------------
        case 'daily_summary':
        case 'summary':
            $date = isset($params['date']) ? trim($params['date']) : date('Y-m-d');

            if (!$db->isConnected()) {
                jsonResponse([
                    'sale_date' => $date,
                    'total_receipts' => 0,
                    'total_items_sold' => 0,
                    'gross_sales_lkr' => 0.0,
                    'total_discounts_lkr' => 0.0,
                    'net_revenue_lkr' => 0.0,
                    'cash_revenue_lkr' => 0.0,
                    'qr_revenue_lkr' => 0.0,
                    'card_revenue_lkr' => 0.0
                ], 200);
            }

            $summary = $db->fetchOne("
                SELECT 
                    COUNT(id) AS total_receipts,
                    COALESCE(SUM(item_count), 0) AS total_items_sold,
                    COALESCE(SUM(subtotal), 0) AS gross_sales_lkr,
                    COALESCE(SUM(discount_amount), 0) AS total_discounts_lkr,
                    COALESCE(SUM(grand_total), 0) AS net_revenue_lkr,
                    COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN grand_total ELSE 0 END), 0) AS cash_revenue_lkr,
                    COALESCE(SUM(CASE WHEN payment_method = 'LANKA_QR' THEN grand_total ELSE 0 END), 0) AS qr_revenue_lkr,
                    COALESCE(SUM(CASE WHEN payment_method = 'CARD' THEN grand_total ELSE 0 END), 0) AS card_revenue_lkr
                FROM counter_receipts
                WHERE DATE(receipt_date) = ?
            ", [$date]);

            $summary['sale_date'] = $date;
            $summary['currency'] = 'LKR';

            jsonResponse($summary, 200);
            break;

        // -------------------------------------------------------------
        // 6. LOG 1:1 PRINT PRODUCTION JOB
        // -------------------------------------------------------------
        case 'log_print':
            $module = !empty($params['module_type']) ? strtoupper(trim($params['module_type'])) : 'NIC_CLONER';
            $preset = !empty($params['document_preset']) ? trim($params['document_preset']) : 'ISO_ID1_SMART_NIC';
            $copies = isset($params['copies']) ? max(1, (int)$params['copies']) : 1;
            $scale = !empty($params['scale_factor']) ? trim($params['scale_factor']) : '100%_TRUE_SCALE';
            $bw = !empty($params['is_bw_enhanced']) ? 1 : 0;
            $paper = !empty($params['paper_size']) ? trim($params['paper_size']) : 'A4';
            $operator = !empty($params['operator_name']) ? trim($params['operator_name']) : 'Counter Operator';
            $receiptId = !empty($params['receipt_id']) ? (int)$params['receipt_id'] : null;

            $jobId = null;
            if ($db->isConnected()) {
                $jobId = $db->insert('print_jobs', [
                    'receipt_id' => $receiptId,
                    'module_type' => $module,
                    'document_preset' => $preset,
                    'copies' => $copies,
                    'scale_factor' => $scale,
                    'is_bw_enhanced' => $bw,
                    'paper_size' => $paper,
                    'operator_name' => $operator,
                    'printed_at' => date('Y-m-d H:i:s')
                ]);
            }

            jsonResponse([
                'success' => true,
                'job_id' => $jobId,
                'module_type' => $module,
                'document_preset' => $preset,
                'copies' => $copies,
                'scale_factor' => $scale,
                'printed_at' => date('Y-m-d H:i:s')
            ], 201);
            break;

        default:
            jsonResponse([
                'module' => 'PothHalaPro Billing POS API',
                'actions' => [
                    'GET ?action=items' => 'Retrieve active POS item catalog in LKR',
                    'POST ?action=create_receipt' => 'Create counter bill receipt with items and discounts',
                    'GET ?action=receipts' => 'List recent sales receipts',
                    'GET ?action=receipt&id=...' => 'Retrieve single receipt details and line items',
                    'GET ?action=daily_summary' => 'Daily revenue, cash, LankaQR and card breakdown',
                    'POST ?action=log_print' => 'Log 1:1 millimeter physical print production job'
                ]
            ], 200);
            break;
    }
}

/**
 * Generate formatted ASCII receipt for 58mm / 80mm thermal receipt printers.
 */
function generateThermalReceiptText($data) {
    $w = 40; // Characters per line for standard 80mm thermal paper
    $sep = str_repeat('-', $w);
    $dsep = str_repeat('=', $w);

    $out = [];
    $out[] = str_pad("POTHA HALA & PRINT STUDIO", $w, " ", STR_PAD_BOTH);
    $out[] = str_pad("No. 142 High Level Rd, Nugegoda", $w, " ", STR_PAD_BOTH);
    $out[] = str_pad("Hotline: +94 11 282 5599", $w, " ", STR_PAD_BOTH);
    $out[] = $dsep;
    $out[] = sprintf("Bill No: %-16s Date: %s", $data['receipt_number'], substr($data['date'], 0, 10));
    $out[] = sprintf("Cashier: %-16s Time: %s", $data['cashier'], substr($data['date'], 11, 8));
    $out[] = sprintf("Terminal: %s", $data['terminal']);
    $out[] = $sep;
    $out[] = sprintf("%-22s %4s %11s", "ITEM", "QTY", "TOTAL (LKR)");
    $out[] = $sep;

    foreach ($data['items'] as $it) {
        $name = substr($it['name'], 0, 22);
        $out[] = sprintf("%-22s %4d %11.2f", $name, $it['qty'], $it['line_total']);
    }

    $out[] = $sep;
    $out[] = sprintf("%-26s LKR %10.2f", "Subtotal:", $data['subtotal']);
    if ($data['discount_amount'] > 0) {
        $out[] = sprintf("%-26s LKR -%9.2f", "Discount (" . $data['discount_percent'] . "%):", $data['discount_amount']);
    }
    $out[] = $dsep;
    $out[] = sprintf("%-26s LKR %10.2f", "GRAND TOTAL:", $data['grand_total']);
    $out[] = sprintf("%-26s LKR %10.2f", "Cash Tendered:", $data['cash_tendered']);
    $out[] = sprintf("%-26s LKR %10.2f", "Change Due:", $data['change_due']);
    $out[] = sprintf("%-26s %s", "Payment Method:", $data['payment_method']);
    if (!empty($data['payment_reference'])) {
        $out[] = sprintf("Ref/Txn: %s", $data['payment_reference']);
    }
    $out[] = $sep;
    $out[] = str_pad("Thank You! Come Again.", $w, " ", STR_PAD_BOTH);
    $out[] = str_pad("Powered by PothHalaPro Print Studio", $w, " ", STR_PAD_BOTH);
    $out[] = "\n\n";

    return implode("\n", $out);
}

// Execute when invoked directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    handleBillingRequest();
}
