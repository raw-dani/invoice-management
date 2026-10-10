<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\BillingSchedule;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\SubscriptionItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoDataService
{
    /**
     * Generate complete, realistic demo data for a company.
     */
    public function generate(Company $company, ?User $actor = null): array
    {
        return DB::transaction(function () use ($company, $actor) {
            $companyId = $company->id;
            $now = Carbon::now();

            // 1. Update Company Profile & Settings if default
            if ($company->name === 'My Company' || empty($company->phone)) {
                $company->update([
                    'name' => 'PT Solusi Digital Nusantara',
                    'address' => 'Cyber 2 Tower Lt. 18, Jl. H.R. Rasuna Said Blok X-5, Kav. 13',
                    'city' => 'Jakarta Selatan',
                    'province' => 'DKI Jakarta',
                    'country' => 'Indonesia',
                    'phone' => '+62 21 5289 1234',
                    'email' => 'billing@solusidigital.id',
                    'website' => 'https://solusidigital.id',
                    'tax_number' => '01.345.678.9-012.000',
                ]);
            }

            // Ensure company settings
            Setting::setValue($companyId, 'prefix', 'INV-');
            Setting::setValue($companyId, 'due_days', '30');
            Setting::setValue($companyId, 'currency', 'IDR');
            Setting::setValue($companyId, 'tax_rate', '11');
            Setting::setValue($companyId, 'bank_name', 'Bank Central Asia (BCA)');
            Setting::setValue($companyId, 'account_name', 'PT Solusi Digital Nusantara');
            Setting::setValue($companyId, 'account_number', '8830 1928 3746');
            Setting::setValue($companyId, 'instructions', 'Harap cantumkan nomor invoice pada berita transfer bank.');

            // 2. Demo Users (Admin, Staff, Viewer)
            $demoUsers = [
                [
                    'name' => 'Dewi Lestari (Finance Manager)',
                    'email' => 'finance@solusidigital.id',
                    'role' => 'admin',
                ],
                [
                    'name' => 'Budi Santoso (Account Executive)',
                    'email' => 'budi.sales@solusidigital.id',
                    'role' => 'staff',
                ],
                [
                    'name' => 'Ahmad Fauzi (Auditor)',
                    'email' => 'auditor@solusidigital.id',
                    'role' => 'viewer',
                ],
            ];

            foreach ($demoUsers as $u) {
                User::updateOrCreate(
                    ['company_id' => $companyId, 'email' => $u['email']],
                    [
                        'name' => $u['name'],
                        'password' => Hash::make('password'),
                        'role' => $u['role'],
                        'is_demo' => true,
                    ]
                );
            }

            // 3. Demo Products & Services
            $productsData = [
                [
                    'sku' => 'PROD-DEMO-001',
                    'name' => 'Cloud Server Hosting Enterprise (16 vCPU, 32GB RAM)',
                    'description' => 'Dedicated cloud compute node with 99.99% uptime SLA, DDoS protection & NVMe storage.',
                    'price' => 2500000,
                    'type' => 'subscription',
                    'billing_cycle' => 'monthly',
                    'tax_rate' => 11,
                ],
                [
                    'sku' => 'PROD-DEMO-002',
                    'name' => 'Dedicated Fiber Leased Line 100 Mbps 1:1',
                    'description' => 'Symmetrical high-speed business internet connection with static IP pool & 4-hour MTTR.',
                    'price' => 4500000,
                    'type' => 'subscription',
                    'billing_cycle' => 'monthly',
                    'tax_rate' => 11,
                ],
                [
                    'sku' => 'PROD-DEMO-003',
                    'name' => 'Custom ERP & CRM Web Application Development',
                    'description' => 'Full-stack enterprise application engineering milestone, including frontend, API, and DB architecture.',
                    'price' => 35000000,
                    'type' => 'one_time',
                    'billing_cycle' => null,
                    'tax_rate' => 11,
                ],
                [
                    'sku' => 'PROD-DEMO-004',
                    'name' => 'UI/UX Design System & Interactive Prototype',
                    'description' => 'Complete Figma design token system, wireframes, high-fidelity prototypes and design handover.',
                    'price' => 12000000,
                    'type' => 'one_time',
                    'billing_cycle' => null,
                    'tax_rate' => 11,
                ],
                [
                    'sku' => 'PROD-DEMO-005',
                    'name' => 'IT Infrastructure Support & SLA Retainer 24/7',
                    'description' => 'Comprehensive monthly maintenance, monitoring, patch management, and on-call engineer assistance.',
                    'price' => 3500000,
                    'type' => 'subscription',
                    'billing_cycle' => 'monthly',
                    'tax_rate' => 11,
                ],
                [
                    'sku' => 'PROD-DEMO-006',
                    'name' => 'Cybersecurity Penetration Testing & Vulnerability Assessment',
                    'description' => 'OWASP Top 10 web app penetration test, network security audit, and formal compliance report.',
                    'price' => 18000000,
                    'type' => 'one_time',
                    'billing_cycle' => null,
                    'tax_rate' => 11,
                ],
                [
                    'sku' => 'PROD-DEMO-007',
                    'name' => 'Enterprise Multi-Domain SSL & Cloudflare WAF Suite',
                    'description' => 'Annual enterprise security bundle with Wildcard SSL and Cloudflare Web Application Firewall.',
                    'price' => 1500000,
                    'type' => 'one_time',
                    'billing_cycle' => null,
                    'tax_rate' => 11,
                ],
                [
                    'sku' => 'PROD-DEMO-008',
                    'name' => 'Cloud Automated Backup & Disaster Recovery (1TB)',
                    'description' => 'Daily automated encrypted offsite backup with instant snapshot restore capabilities.',
                    'price' => 1800000,
                    'type' => 'subscription',
                    'billing_cycle' => 'monthly',
                    'tax_rate' => 11,
                ],
            ];

            $products = [];
            foreach ($productsData as $pData) {
                $products[$pData['sku']] = Product::updateOrCreate(
                    ['company_id' => $companyId, 'sku' => $pData['sku']],
                    $pData + [
                        'currency' => 'IDR',
                        'status' => 'active',
                        'is_demo' => true,
                    ]
                );
            }

            // 4. Demo Customers
            $customersData = [
                [
                    'customer_number' => 'CUST-DEMO-001',
                    'company_name' => 'PT Nusantara Logistik Express',
                    'contact_name' => 'Hendra Wijaya',
                    'email' => 'hendra@nusantaralogistik.co.id',
                    'phone' => '021-8976543',
                    'address' => 'Kawasan Industri Pulogadung Blok B No. 4',
                    'city' => 'Jakarta Timur',
                    'province' => 'DKI Jakarta',
                    'country' => 'Indonesia',
                    'tax_number' => '02.456.789.1-011.000',
                ],
                [
                    'customer_number' => 'CUST-DEMO-002',
                    'company_name' => 'PT Sejahtera Retail Abadi',
                    'contact_name' => 'Siti Nurhaliza',
                    'email' => 'siti.procurement@sejahteraretail.com',
                    'phone' => '021-7654321',
                    'address' => 'Menara Mandiri Lt. 12, Jl. Jend. Sudirman Kav. 54',
                    'city' => 'Jakarta Selatan',
                    'province' => 'DKI Jakarta',
                    'country' => 'Indonesia',
                    'tax_number' => '03.567.890.2-022.000',
                ],
                [
                    'customer_number' => 'CUST-DEMO-003',
                    'company_name' => 'CV Maju Karya Mandiri',
                    'contact_name' => 'Ir. Bambang Hartono',
                    'email' => 'bambang@majukarya.co.id',
                    'phone' => '031-5432198',
                    'address' => 'Rungkut Industri III No. 18',
                    'city' => 'Surabaya',
                    'province' => 'Jawa Timur',
                    'country' => 'Indonesia',
                    'tax_number' => '04.678.901.3-033.000',
                ],
                [
                    'customer_number' => 'CUST-DEMO-004',
                    'company_name' => 'PT Fintek Media Asia',
                    'contact_name' => 'Diana Kusuma',
                    'email' => 'finance@fintekmedia.id',
                    'phone' => '021-2987654',
                    'address' => 'AIA Central Lt. 24, Jl. Jend. Gatot Subroto Kav. 48',
                    'city' => 'Jakarta Selatan',
                    'province' => 'DKI Jakarta',
                    'country' => 'Indonesia',
                    'tax_number' => '05.789.012.4-044.000',
                ],
                [
                    'customer_number' => 'CUST-DEMO-005',
                    'company_name' => 'Klinik Pratama Sehat Harmoni',
                    'contact_name' => 'dr. Robert Pangestu',
                    'email' => 'admin@klinikharmoni.com',
                    'phone' => '022-4215678',
                    'address' => 'Jl. R.E. Martadinata No. 88',
                    'city' => 'Bandung',
                    'province' => 'Jawa Barat',
                    'country' => 'Indonesia',
                    'tax_number' => '06.890.123.5-055.000',
                ],
                [
                    'customer_number' => 'CUST-DEMO-006',
                    'company_name' => 'PT Surya Global Maritim',
                    'contact_name' => 'Capt. Joko Prasetyo',
                    'email' => 'joko@suryamaritim.com',
                    'phone' => '024-3567890',
                    'address' => 'Tanjung Emas Port Area No. 15',
                    'city' => 'Semarang',
                    'province' => 'Jawa Tengah',
                    'country' => 'Indonesia',
                    'tax_number' => '07.901.234.6-066.000',
                ],
            ];

            $customers = [];
            foreach ($customersData as $cData) {
                $customers[$cData['customer_number']] = Customer::updateOrCreate(
                    ['company_id' => $companyId, 'customer_number' => $cData['customer_number']],
                    $cData + ['status' => 'active', 'is_demo' => true]
                );
            }

            // 5. Demo Quotes
            $quotesDef = [
                [
                    'number' => 'QT-DEMO-2026-0001',
                    'customer' => 'CUST-DEMO-004', // PT Fintek
                    'status' => 'converted',
                    'date' => $now->copy()->subDays(30),
                    'valid' => $now->copy()->subDays(10),
                    'items' => [
                        ['product' => 'PROD-DEMO-003', 'desc' => 'Custom ERP & CRM Web Application Development', 'qty' => 1, 'price' => 35000000],
                    ],
                ],
                [
                    'number' => 'QT-DEMO-2026-0002',
                    'customer' => 'CUST-DEMO-002', // PT Sejahtera Retail
                    'status' => 'accepted',
                    'date' => $now->copy()->subDays(10),
                    'valid' => $now->copy()->addDays(20),
                    'items' => [
                        ['product' => 'PROD-DEMO-004', 'desc' => 'UI/UX Design System & Interactive Prototype', 'qty' => 1, 'price' => 12000000],
                    ],
                ],
                [
                    'number' => 'QT-DEMO-2026-0003',
                    'customer' => 'CUST-DEMO-003', // CV Maju Karya
                    'status' => 'sent',
                    'date' => $now->copy()->subDays(6),
                    'valid' => $now->copy()->addDays(14),
                    'items' => [
                        ['product' => 'PROD-DEMO-005', 'desc' => 'IT Infrastructure Support & SLA Retainer 24/7 (6 Months)', 'qty' => 6, 'price' => 3500000],
                    ],
                ],
                [
                    'number' => 'QT-DEMO-2026-0004',
                    'customer' => 'CUST-DEMO-006', // PT Surya Global Maritim
                    'status' => 'viewed',
                    'date' => $now->copy()->subDays(4),
                    'valid' => $now->copy()->addDays(16),
                    'items' => [
                        ['product' => 'PROD-DEMO-006', 'desc' => 'Cybersecurity Penetration Testing & Vulnerability Assessment', 'qty' => 1, 'price' => 18000000],
                    ],
                ],
                [
                    'number' => 'QT-DEMO-2026-0005',
                    'customer' => 'CUST-DEMO-005', // Klinik Sehat
                    'status' => 'draft',
                    'date' => $now->copy()->subDays(1),
                    'valid' => $now->copy()->addDays(29),
                    'items' => [
                        ['product' => 'PROD-DEMO-001', 'desc' => 'Cloud Server Hosting Enterprise (1 Month)', 'qty' => 1, 'price' => 2500000],
                        ['product' => 'PROD-DEMO-008', 'desc' => 'Cloud Automated Backup & Disaster Recovery (1TB)', 'qty' => 1, 'price' => 1800000],
                    ],
                ],
                [
                    'number' => 'QT-DEMO-2026-0006',
                    'customer' => 'CUST-DEMO-001', // PT Nusantara Logistik
                    'status' => 'rejected',
                    'date' => $now->copy()->subDays(50),
                    'valid' => $now->copy()->subDays(20),
                    'items' => [
                        ['product' => 'PROD-DEMO-003', 'desc' => 'Custom ERP Initial Proposal Phase 0', 'qty' => 1, 'price' => 25000000],
                    ],
                ],
            ];

            foreach ($quotesDef as $qDef) {
                $cust = $customers[$qDef['customer']];
                $quote = Quote::updateOrCreate(
                    ['company_id' => $companyId, 'quote_number' => $qDef['number']],
                    [
                        'customer_id' => $cust->id,
                        'quote_date' => $qDef['date']->toDateString(),
                        'valid_until' => $qDef['valid']->toDateString(),
                        'status' => $qDef['status'],
                        'discount_type' => 0,
                        'discount' => 0,
                        'tax_rate' => 11,
                        'currency' => 'IDR',
                        'notes' => 'Penawaran harga resmi berlaku sesuai periode tercantum.',
                        'terms' => 'Pembayaran DP 50% setelah penawaran disetujui.',
                        'is_demo' => true,
                    ]
                );

                QuoteItem::where('quote_id', $quote->id)->delete();
                foreach ($qDef['items'] as $item) {
                    $prod = $products[$item['product']] ?? null;
                    QuoteItem::create([
                        'quote_id' => $quote->id,
                        'product_id' => $prod?->id,
                        'description' => $item['desc'],
                        'quantity' => $item['qty'],
                        'unit_price' => $item['price'],
                        'tax_rate' => 11,
                        'discount' => 0,
                        'total' => $item['qty'] * $item['price'],
                    ]);
                }
                $quote->calculateTotals();
            }

            // 6. Demo Invoices
            $invoicesDef = [
                // 1. Paid Invoice
                [
                    'number' => 'INV-DEMO-2026-0001',
                    'customer' => 'CUST-DEMO-004',
                    'status' => 'paid',
                    'date' => $now->copy()->subDays(25),
                    'due' => $now->copy()->addDays(5),
                    'paid_amount' => 38850000,
                    'items' => [
                        ['product' => 'PROD-DEMO-003', 'desc' => 'Custom ERP & CRM Web Application Development - Milestone 1', 'qty' => 1, 'price' => 35000000],
                    ],
                    'payment' => [
                        'number' => 'PAY-DEMO-2026-0001',
                        'amount' => 38850000,
                        'date' => $now->copy()->subDays(18),
                        'method' => 'bank_transfer',
                        'ref' => 'BCA-TRX-8921820',
                    ],
                ],
                // 2. Paid Invoice
                [
                    'number' => 'INV-DEMO-2026-0002',
                    'customer' => 'CUST-DEMO-002',
                    'status' => 'paid',
                    'date' => $now->copy()->subDays(20),
                    'due' => $now->copy()->addDays(10),
                    'paid_amount' => 13320000,
                    'items' => [
                        ['product' => 'PROD-DEMO-004', 'desc' => 'UI/UX Design System Package & Prototype Handover', 'qty' => 1, 'price' => 12000000],
                    ],
                    'payment' => [
                        'number' => 'PAY-DEMO-2026-0002',
                        'amount' => 13320000,
                        'date' => $now->copy()->subDays(10),
                        'method' => 'bank_transfer',
                        'ref' => 'MANDIRI-FT-102938',
                    ],
                ],
                // 3. Partially Paid Invoice
                [
                    'number' => 'INV-DEMO-2026-0003',
                    'customer' => 'CUST-DEMO-003',
                    'status' => 'partially_paid',
                    'date' => $now->copy()->subDays(15),
                    'due' => $now->copy()->addDays(15),
                    'paid_amount' => 10000000,
                    'items' => [
                        ['product' => 'PROD-DEMO-005', 'desc' => 'IT Infrastructure Support & SLA Retainer (6 Months)', 'qty' => 6, 'price' => 3500000],
                    ],
                    'payment' => [
                        'number' => 'PAY-DEMO-2026-0003',
                        'amount' => 10000000,
                        'date' => $now->copy()->subDays(5),
                        'method' => 'credit_card',
                        'ref' => 'CC-AUTH-772910',
                    ],
                ],
                // 4. Sent (Active) Invoice
                [
                    'number' => 'INV-DEMO-2026-0004',
                    'customer' => 'CUST-DEMO-001',
                    'status' => 'sent',
                    'date' => $now->copy()->subDays(5),
                    'due' => $now->copy()->addDays(25),
                    'paid_amount' => 0,
                    'items' => [
                        ['product' => 'PROD-DEMO-002', 'desc' => 'Dedicated Fiber Leased Line 100 Mbps (Month 1)', 'qty' => 1, 'price' => 4500000],
                        ['product' => 'PROD-DEMO-008', 'desc' => 'Cloud Automated Backup & Disaster Recovery (1TB)', 'qty' => 1, 'price' => 1800000],
                    ],
                ],
                // 5. Overdue Invoice (15 days overdue)
                [
                    'number' => 'INV-DEMO-2026-0005',
                    'customer' => 'CUST-DEMO-005',
                    'status' => 'overdue',
                    'date' => $now->copy()->subDays(45),
                    'due' => $now->copy()->subDays(15),
                    'paid_amount' => 0,
                    'items' => [
                        ['product' => 'PROD-DEMO-001', 'desc' => 'Cloud Server Hosting Enterprise (Previous Month)', 'qty' => 1, 'price' => 2500000],
                        ['product' => 'PROD-DEMO-008', 'desc' => 'Cloud Automated Backup & Disaster Recovery (1TB)', 'qty' => 1, 'price' => 1800000],
                    ],
                ],
                // 6. Overdue Invoice (8 days overdue)
                [
                    'number' => 'INV-DEMO-2026-0006',
                    'customer' => 'CUST-DEMO-006',
                    'status' => 'overdue',
                    'date' => $now->copy()->subDays(38),
                    'due' => $now->copy()->subDays(8),
                    'paid_amount' => 0,
                    'items' => [
                        ['product' => 'PROD-DEMO-006', 'desc' => 'Cybersecurity Penetration Testing & Vulnerability Assessment', 'qty' => 1, 'price' => 18000000],
                    ],
                ],
                // 7. Draft Invoice
                [
                    'number' => 'INV-DEMO-2026-0007',
                    'customer' => 'CUST-DEMO-004',
                    'status' => 'draft',
                    'date' => $now->copy(),
                    'due' => $now->copy()->addDays(30),
                    'paid_amount' => 0,
                    'items' => [
                        ['product' => 'PROD-DEMO-007', 'desc' => 'Enterprise Multi-Domain SSL & Cloudflare WAF Suite', 'qty' => 2, 'price' => 1500000],
                    ],
                ],
                // 8. Cancelled Invoice
                [
                    'number' => 'INV-DEMO-2026-0008',
                    'customer' => 'CUST-DEMO-003',
                    'status' => 'cancelled',
                    'date' => $now->copy()->subDays(60),
                    'due' => $now->copy()->subDays(30),
                    'paid_amount' => 0,
                    'items' => [
                        ['product' => 'PROD-DEMO-001', 'desc' => 'Cloud Server Hosting - Cancelled Duplicate Order', 'qty' => 1, 'price' => 2500000],
                    ],
                ],
            ];

            foreach ($invoicesDef as $invDef) {
                $cust = $customers[$invDef['customer']];
                $inv = Invoice::updateOrCreate(
                    ['company_id' => $companyId, 'invoice_number' => $invDef['number']],
                    [
                        'customer_id' => $cust->id,
                        'invoice_date' => $invDef['date']->toDateString(),
                        'due_date' => $invDef['due']->toDateString(),
                        'status' => $invDef['status'],
                        'discount_type' => 0,
                        'discount' => 0,
                        'tax_rate' => 11,
                        'currency' => 'IDR',
                        'notes' => 'Terima kasih atas kerja sama Anda.',
                        'terms' => 'Pembayaran ditransfer ke rekening BCA 883019283746 a.n. PT Solusi Digital Nusantara.',
                        'is_demo' => true,
                    ]
                );

                InvoiceItem::where('invoice_id', $inv->id)->delete();
                foreach ($invDef['items'] as $item) {
                    $prod = $products[$item['product']] ?? null;
                    InvoiceItem::create([
                        'invoice_id' => $inv->id,
                        'product_id' => $prod?->id,
                        'description' => $item['desc'],
                        'quantity' => $item['qty'],
                        'unit_price' => $item['price'],
                        'tax_rate' => 11,
                        'discount' => 0,
                        'total' => $item['qty'] * $item['price'],
                    ]);
                }

                $inv->calculateTotals();

                // If payment exists, record it
                if (!empty($invDef['payment'])) {
                    Payment::where('company_id', $companyId)->where('payment_number', $invDef['payment']['number'])->delete();
                    Payment::create([
                        'company_id' => $companyId,
                        'customer_id' => $cust->id,
                        'invoice_id' => $inv->id,
                        'payment_number' => $invDef['payment']['number'],
                        'payment_date' => $invDef['payment']['date']->toDateString(),
                        'amount' => $invDef['payment']['amount'],
                        'currency' => 'IDR',
                        'payment_method' => $invDef['payment']['method'],
                        'reference' => $invDef['payment']['ref'],
                        'notes' => 'Pembayaran via ' . $invDef['payment']['method'],
                        'is_demo' => true,
                    ]);

                    $inv->paid_amount = $invDef['payment']['amount'];
                    $inv->balance = max(0, $inv->total - $invDef['payment']['amount']);
                    $inv->status = $invDef['status'];
                    $inv->save();
                }
            }

            // 7. Demo Subscriptions
            $subsDef = [
                [
                    'number' => 'SUB-DEMO-2026-0001',
                    'customer' => 'CUST-DEMO-001', // PT Nusantara Logistik
                    'cycle' => 'monthly',
                    'status' => 'active',
                    'start' => $now->copy()->subMonths(3),
                    'next' => $now->copy()->addDays(8), // upcoming billing table
                    'items' => [
                        ['product' => 'PROD-DEMO-002', 'desc' => 'Dedicated Fiber Leased Line 100 Mbps', 'qty' => 1, 'price' => 4500000],
                    ],
                ],
                [
                    'number' => 'SUB-DEMO-2026-0002',
                    'customer' => 'CUST-DEMO-004', // PT Fintek
                    'cycle' => 'monthly',
                    'status' => 'active',
                    'start' => $now->copy()->subMonths(2),
                    'next' => $now->copy()->addDays(15),
                    'items' => [
                        ['product' => 'PROD-DEMO-001', 'desc' => 'Cloud Server Hosting Enterprise (16 vCPU, 32GB RAM)', 'qty' => 1, 'price' => 2500000],
                        ['product' => 'PROD-DEMO-008', 'desc' => 'Cloud Automated Backup & Disaster Recovery (1TB)', 'qty' => 1, 'price' => 1800000],
                    ],
                ],
                [
                    'number' => 'SUB-DEMO-2026-0003',
                    'customer' => 'CUST-DEMO-002', // PT Sejahtera Retail
                    'cycle' => 'quarterly',
                    'status' => 'active',
                    'start' => $now->copy()->subMonths(4),
                    'next' => $now->copy()->addDays(22),
                    'items' => [
                        ['product' => 'PROD-DEMO-005', 'desc' => 'IT Infrastructure Support & SLA Retainer 24/7 (Quarterly)', 'qty' => 3, 'price' => 3500000],
                    ],
                ],
                [
                    'number' => 'SUB-DEMO-2026-0004',
                    'customer' => 'CUST-DEMO-003', // CV Maju Karya
                    'cycle' => 'monthly',
                    'status' => 'paused',
                    'start' => $now->copy()->subMonths(5),
                    'next' => $now->copy()->addMonths(1),
                    'items' => [
                        ['product' => 'PROD-DEMO-001', 'desc' => 'Cloud Server Hosting (Paused temporarily)', 'qty' => 1, 'price' => 2500000],
                    ],
                ],
                [
                    'number' => 'SUB-DEMO-2026-0005',
                    'customer' => 'CUST-DEMO-005', // Klinik Sehat
                    'cycle' => 'yearly',
                    'status' => 'cancelled',
                    'start' => $now->copy()->subYear(),
                    'next' => $now->copy()->addYear(),
                    'items' => [
                        ['product' => 'PROD-DEMO-007', 'desc' => 'Enterprise Multi-Domain SSL & Cloudflare WAF Suite', 'qty' => 1, 'price' => 1500000],
                    ],
                ],
            ];

            foreach ($subsDef as $sDef) {
                $cust = $customers[$sDef['customer']];
                $sub = Subscription::updateOrCreate(
                    ['company_id' => $companyId, 'subscription_number' => $sDef['number']],
                    [
                        'customer_id' => $cust->id,
                        'billing_cycle' => $sDef['cycle'],
                        'status' => $sDef['status'],
                        'start_date' => $sDef['start']->toDateString(),
                        'next_billing_date' => $sDef['next']->toDateString(),
                        'invoice_due_days' => 14,
                        'currency' => 'IDR',
                        'notes' => 'Paket langganan layanan rutin.',
                        'is_demo' => true,
                    ]
                );

                SubscriptionItem::where('subscription_id', $sub->id)->delete();
                foreach ($sDef['items'] as $it) {
                    $prod = $products[$it['product']] ?? null;
                    SubscriptionItem::create([
                        'subscription_id' => $sub->id,
                        'product_id' => $prod?->id,
                        'description' => $it['desc'],
                        'quantity' => $it['qty'],
                        'unit_price' => $it['price'],
                        'tax_rate' => 11,
                        'discount' => 0,
                    ]);
                }

                // Billing schedule
                BillingSchedule::updateOrCreate(
                    ['subscription_id' => $sub->id, 'billing_date' => $sDef['next']->toDateString()],
                    [
                        'company_id' => $companyId,
                        'status' => 'pending',
                    ]
                );
            }

            // 8. Demo Activity Logs
            ActivityLog::where('company_id', $companyId)->where('is_demo', true)->delete();
            $activities = [
                ['action' => 'created', 'desc' => 'Demo data suite initialized for client presentation.'],
                ['action' => 'paid', 'desc' => 'Payment PAY-DEMO-2026-0001 (Rp 38.850.000) recorded for INV-DEMO-2026-0001.'],
                ['action' => 'converted', 'desc' => 'Quote QT-DEMO-2026-0001 successfully converted to Invoice INV-DEMO-2026-0001.'],
                ['action' => 'renewed', 'desc' => 'Subscription SUB-DEMO-2026-0001 renewed for PT Nusantara Logistik Express.'],
            ];
            foreach ($activities as $act) {
                ActivityLog::create([
                    'company_id' => $companyId,
                    'user_id' => $actor?->id,
                    'action' => $act['action'],
                    'description' => $act['desc'],
                    'is_demo' => true,
                ]);
            }

            // 9. Demo In-App Notifications
            Notification::where('company_id', $companyId)->where('is_demo', true)->delete();
            $notifs = [
                [
                    'type' => 'invoice_overdue',
                    'title' => 'Invoice Jatuh Tempo',
                    'body' => 'Invoice INV-DEMO-2026-0005 (Klinik Pratama Sehat Harmoni) telah melewati batas jatuh tempo 15 hari.',
                    'read_at' => null,
                ],
                [
                    'type' => 'payment_received',
                    'title' => 'Pembayaran Diterima',
                    'body' => 'Pembayaran sebesar Rp 38.850.000 telah diterima untuk invoice INV-DEMO-2026-0001.',
                    'read_at' => $now->copy()->subDays(2),
                ],
                [
                    'type' => 'quote_accepted',
                    'title' => 'Penawaran Disetujui',
                    'body' => 'PT Sejahtera Retail Abadi telah menyetujui penawaran QT-DEMO-2026-0002.',
                    'read_at' => null,
                ],
            ];
            foreach ($notifs as $nf) {
                Notification::create([
                    'company_id' => $companyId,
                    'user_id' => $actor?->id,
                    'type' => $nf['type'],
                    'title' => $nf['title'],
                    'body' => $nf['body'],
                    'read_at' => $nf['read_at'],
                    'is_demo' => true,
                ]);
            }

            return $this->stats($company);
        });
    }

    /**
     * Delete only demo records (is_demo = true) for the company.
     */
    public function clear(Company $company): array
    {
        return DB::transaction(function () use ($company) {
            $companyId = $company->id;
            $deleted = [];

            // 1. Payments
            $deleted['payments'] = Payment::where('company_id', $companyId)->where('is_demo', true)->delete();

            // 2. Invoices & items
            $demoInvoices = Invoice::where('company_id', $companyId)->where('is_demo', true)->get();
            if ($demoInvoices->isNotEmpty()) {
                InvoiceItem::whereIn('invoice_id', $demoInvoices->pluck('id'))->delete();
            }
            $deleted['invoices'] = Invoice::where('company_id', $companyId)->where('is_demo', true)->delete();

            // 3. Quotes & items
            $demoQuotes = Quote::where('company_id', $companyId)->where('is_demo', true)->get();
            if ($demoQuotes->isNotEmpty()) {
                QuoteItem::whereIn('quote_id', $demoQuotes->pluck('id'))->delete();
            }
            $deleted['quotes'] = Quote::where('company_id', $companyId)->where('is_demo', true)->delete();

            // 4. Subscriptions & schedules & items
            $demoSubs = Subscription::where('company_id', $companyId)->where('is_demo', true)->get();
            if ($demoSubs->isNotEmpty()) {
                SubscriptionItem::whereIn('subscription_id', $demoSubs->pluck('id'))->delete();
                BillingSchedule::whereIn('subscription_id', $demoSubs->pluck('id'))->delete();
            }
            $deleted['subscriptions'] = Subscription::where('company_id', $companyId)->where('is_demo', true)->delete();

            // 5. Activity logs & notifications
            $deleted['activity_logs'] = ActivityLog::where('company_id', $companyId)->where('is_demo', true)->delete();
            $deleted['notifications'] = Notification::where('company_id', $companyId)->where('is_demo', true)->delete();

            // 6. Customers & Products
            $deleted['customers'] = Customer::where('company_id', $companyId)->where('is_demo', true)->delete();
            $deleted['products'] = Product::where('company_id', $companyId)->where('is_demo', true)->delete();

            // 7. Demo Users (do not delete the active user)
            $currentUserId = auth()->id() ?? 0;
            $deleted['users'] = User::where('company_id', $companyId)
                ->where('is_demo', true)
                ->where('id', '!=', $currentUserId)
                ->delete();

            return $deleted;
        });
    }

    /**
     * Get statistics on demo data for a company.
     */
    public function stats(Company $company): array
    {
        $companyId = $company->id;
        $counts = [
            'customers' => Customer::where('company_id', $companyId)->where('is_demo', true)->count(),
            'products' => Product::where('company_id', $companyId)->where('is_demo', true)->count(),
            'quotes' => Quote::where('company_id', $companyId)->where('is_demo', true)->count(),
            'invoices' => Invoice::where('company_id', $companyId)->where('is_demo', true)->count(),
            'payments' => Payment::where('company_id', $companyId)->where('is_demo', true)->count(),
            'subscriptions' => Subscription::where('company_id', $companyId)->where('is_demo', true)->count(),
            'users' => User::where('company_id', $companyId)->where('is_demo', true)->count(),
        ];

        return [
            'has_demo_data' => array_sum($counts) > 0,
            'counts' => $counts,
        ];
    }
}
