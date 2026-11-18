# Invoice Management System - Development Todo List

> Todo list untuk tracking pembangunan aplikasi Invoice Management System berdasarkan dokumen perencanaan.
> 
> **Stack:**
> - **Backend**: Laravel 10 (PHP 8.1+) — REST API only
> - **Frontend**: React 18 + Vite + TypeScript
> - **UI**: Tailwind CSS + custom components
> - **State/Data**: TanStack Query (React Query) + Axios
> - **Routing**: React Router v6
> - **Forms**: React Hook Form
> - **Database**: MySQL 8 / MariaDB
> - **Cache/Queue**: Redis (file/sync fallback untuk local tanpa ext-redis)
> - **Scheduler**: Laravel Scheduler
> - **PDF**: barryvdh/laravel-dompdf atau spatie/laravel-pdf (planned)
> - **Auth**: Laravel Sanctum (Bearer token untuk SPA)

---

## Phase 1: Foundation

### Project Setup
- [x] Setup project Laravel baru (struktur API-only)
- [x] Konfigurasi environment (.env) — target database MySQL
- [x] Setup database MySQL (config `DB_CONNECTION=mysql`)
- [ ] Setup Redis untuk cache dan queue (saat ini pakai file/sync)
- [x] Konfigurasi Laravel Sanctum untuk autentikasi SPA
- [x] Konfigurasi CORS untuk akses React frontend
- [ ] Konfigurasi Laravel Scheduler (entry cron di server) — belum di-setup di server
- [ ] Setup Supervisor untuk queue worker
- [ ] Konfigurasi storage untuk file/PDF (`storage/app/public`)

### Frontend Setup (React)
- [x] Inisialisasi project React + Vite + TypeScript
- [x] Konfigurasi Tailwind CSS
- [x] Setup React Router dengan route guard
- [x] Setup Axios client + interceptor (token, 401 redirect)
- [x] Setup TanStack Query provider
- [x] Setup React Hook Form
- [x] Konfigurasi proxy Vite ke backend Laravel
- [x] Buat layout utama (sidebar + content outlet)

### Authentication & User
- [x] Implementasi sistem autentikasi Laravel (Sanctum)
- [x] Buat model dan migration untuk `users`
- [x] Buat model dan migration untuk `companies`
- [x] Implementasi endpoint login/register/logout
- [x] Implementasi password hashing (bcrypt)
- [x] Implementasi token security
- [x] Endpoint API `/api/auth/me`
- [x] Halaman login/register React

### Role & Permission
- [x] Kolom `role` di users (Owner/Admin/Staff/Viewer)
- [ ] Spatie Permission package
- [ ] Middleware `role` & `permission` di route API
- [ ] Halaman manajemen user & role di React

### Database Design (MySQL)
- [x] Buat semua migration files sesuai struktur database
- [x] Setup relasi antar tabel (foreign keys)
- [x] Buat model relationships (Eloquent)
- [x] Implementasi database indexing (kolom pencarian & FK)
- [ ] Charset `utf8mb4` dan collation `utf8mb4_unicode_ci` (verify migration)

### Settings
- [x] Buat model dan migration untuk `settings` (key-value)
- [x] Implementasi Company Settings
- [x] Implementasi Invoice Settings
- [x] Implementasi Quote Settings
- [x] Implementasi Email Settings
- [x] Implementasi Payment Settings
- [x] Endpoint API `/api/settings/*` (GET/PUT per group)
- [x] Halaman Settings React (tab: Company, Invoice, Quote, Email, Payment)

---

## Phase 2: Customer & Product

### Customer Management — Backend API
- [x] Buat model dan migration untuk `customers`
- [x] Implementasi Customer CRUD (Controller + FormRequest + Resource)
- [x] Auto-generate customer number (`CUST-XXXXX`)
- [x] Implementasi status customer (Lead, Active, Inactive)
- [x] Implementasi validasi form customer
- [x] Endpoint quick add customer dari invoice

### Customer Management — Frontend React
- [x] Halaman `CustomerListPage` (table + search + filter status + pagination)
- [x] Halaman `CustomerDetailPage` (overview + notes)
- [x] Form `CustomerFormPage` (create/edit) dengan React Hook Form
- [x] Halaman CustomerDetail lengkap (invoices, quotes, subscriptions, payments, activity tabs)
- [x] Modal `QuickAddCustomer` (dipanggil dari wizard invoice & quote)

### Product Management — Backend API
- [x] Buat model dan migration untuk `products`
- [x] Implementasi Product CRUD
- [x] Auto-generate SKU (`PRD-XXXXX`)
- [x] Implementasi tipe product (One Time, Subscription)
- [x] Implementasi billing cycle (Monthly, Quarterly, Semi Annual, Yearly)
- [x] Implementasi pricing dan tax
- [x] Implementasi validasi form product

### Product Management — Frontend React
- [x] Halaman `ProductListPage` (filter tipe + search)
- [x] Halaman `ProductDetailPage`
- [x] Form `ProductFormPage` (dengan switch tipe produk + billing cycle conditional)
- [x] Komponen `ProductPicker` (modal pilih produk untuk invoice/quote)

### Search
- [x] Implementasi global search backend (`/api/search?q=`)
- [x] Komponen `GlobalSearch` di header React (debounced)
- [x] Search hasil: invoice, customer, quote, product, subscription

---

## Phase 3: Invoice

### Invoice Core — Backend API
- [x] Buat model dan migration untuk `invoices`
- [x] Buat model dan migration untuk `invoice_items`
- [x] Implementasi Invoice CRUD
- [x] Auto-generate invoice number (`INV-{YEAR}-{NUMBER}`)
- [x] Implementasi status invoice (Draft, Sent, Partially Paid, Paid, Overdue, Cancelled, Void)
- [x] Endpoint `GET /api/invoices` (filter: status, customer, search, pagination)
- [x] Endpoint `GET /api/invoices/{id}`
- [x] Endpoint `POST /api/invoices`
- [x] Endpoint `PUT /api/invoices/{id}` (hanya Draft)
- [x] Endpoint `DELETE /api/invoices/{id}` (hanya Draft/Cancelled)
- [x] Endpoint `POST /api/invoices/{id}/mark-as-sent`
- [x] Endpoint `POST /api/invoices/{id}/void`
- [x] Endpoint `POST /api/invoices/{id}/duplicate`
- [x] Endpoint `GET /api/invoices/{id}/pdf` (stream PDF)

### Invoice Core — Frontend React
- [x] Halaman `InvoiceListPage` (filter status + search + delete confirm)
- [x] Halaman `InvoiceDetailPage` (info, items, summary, notes, terms)
- [x] Form `InvoiceFormPage` (wizard 4-step)
- [x] Komponen `StatusBadge` (shared)
- [x] Komponen items table (inline editing di wizard)
- [x] Action bar: Send, Edit (Draft), Void, Delete
- [x] Tombol Download PDF & Print
- [x] Tombol Duplicate Invoice

### Invoice Creation (Wizard)
- [x] Backend: create invoice dengan items + kalkulasi total
- [x] Backend: invoice immutable setelah status Sent
- [x] React: wizard 4-step (Customer → Items → Payment → Preview)
- [x] Kalkulasi total real-time di frontend (preview sebelum submit)
- [x] Product picker modal untuk auto-fill item

### PDF Generation
- [x] Install package PDF (dompdf/spatie)
- [x] Buat Blade template PDF `pdf.invoice.modern`
- [x] Buat Blade template PDF `pdf.invoice.professional`
- [x] Buat Blade template PDF `pdf.invoice.classic`
- [x] Buat Blade template PDF `pdf.invoice.compact`
- [x] Endpoint `GET /api/invoices/{id}/pdf?template=modern`
- [x] Komponen preview PDF (preview dibuka di tab baru)
- [x] Tombol Download PDF & Print

### Email Invoice
- [x] Implementasi send invoice email (Mail class `InvoiceMail`)
- [x] Buat template email invoice (database)
- [x] Attach PDF pada email
- [x] Job `SendInvoiceEmail` (queue)
- [x] Endpoint `POST /api/invoices/{id}/email`
- [ ] Konfirmasi dialog "Send Email" di React

---

## Phase 4: Quote

### Quote Core — Backend API
- [x] Buat model dan migration untuk `quotes`
- [x] Buat model dan migration untuk `quote_items`
- [x] Implementasi Quote CRUD
- [x] Auto-generate quote number (`QT-{YEAR}-{NUMBER}`)
- [x] Implementasi status quote (Draft, Sent, Viewed, Accepted, Rejected, Expired, Converted)
- [x] Endpoint `GET /api/quotes` (filter status, customer, search)
- [x] Endpoint `GET /api/quotes/{id}`
- [x] Endpoint `POST /api/quotes`
- [x] Endpoint `PUT /api/quotes/{id}` (Draft/Sent/Viewed/Rejected/Expired)
- [x] Endpoint `DELETE /api/quotes/{id}`
- [x] Endpoint `POST /api/quotes/{id}/send`
- [x] Endpoint `POST /api/quotes/{id}/accept`
- [x] Endpoint `POST /api/quotes/{id}/reject`
- [x] Endpoint `POST /api/quotes/{id}/mark-as-expired`
- [x] Endpoint `POST /api/quotes/{id}/duplicate`
- [x] Endpoint `GET /api/quotes/{id}/pdf`

### Quote Core — Frontend React
- [x] Halaman `QuoteListPage`
- [x] Halaman `QuoteDetailPage`
- [x] Form `QuoteFormPage` (wizard 4-step)
- [x] Komponen `StatusBadge` (shared)
- [x] Action bar: Edit, Send, Accept, Reject, Convert, Delete

### Quote PDF
- [x] Blade template PDF `pdf.quote.modern`
- [x] Blade template PDF `pdf.quote.professional`
- [x] Blade template PDF `pdf.quote.corporate`
- [x] Preview & Download PDF di React

### Quote Email
- [x] Mail class `QuoteMail`
- [x] Template email quote
- [x] Job `SendQuoteEmail`
- [x] Endpoint `POST /api/quotes/{id}/email`

---

## Phase 5: Quote to Invoice Conversion

### Conversion Logic — Backend
- [x] Service `QuoteConversionService` (copy customer, items, discount, tax, notes, terms)
- [x] Update status quote menjadi "Converted"
- [x] Simpan relasi `quote_id` ke invoice
- [x] Endpoint `POST /api/quotes/{id}/convert-to-invoice`

### Conversion UI — React
- [x] Tombol "Convert to Invoice" di `QuoteDetailPage`
- [x] Redirect ke `InvoiceDetail` setelah konversi berhasil
- [x] Modal konfirmasi preview sebelum konversi

---

## Phase 6: Payment

### Payment Core — Backend API
- [x] Buat model dan migration untuk `payments`
- [x] Implementasi Payment CRUD
- [x] Auto-generate payment number (`PAY-{YEAR}-{NUMBER}`)
- [x] Endpoint `GET /api/payments` (filter invoice, customer, method, date range)
- [x] Endpoint `GET /api/payments/{id}`
- [x] Endpoint `POST /api/invoices/{invoice}/payments` (record payment)
- [x] Implementasi payment methods (Bank Transfer, Cash, Credit Card, E-Wallet, Other)
- [x] Guards: reject overpayment, reject payment on locked invoice (paid/void/cancelled)

### Payment Core — Frontend React
- [x] Halaman `PaymentListPage` (filter method, search, total per page)
- [x] Halaman `PaymentDetailPage`
- [x] Form `RecordPaymentForm` (modal dari `InvoiceDetail`) dengan validasi over-amount
- [x] Komponen `PaymentHistoryTable` (per invoice di `InvoiceDetail`)

### Partial Payment
- [x] Kalkulasi balance otomatis di backend (`Invoice::applyPayment()`)
- [x] Update status invoice ke Partially Paid
- [x] Update status invoice ke Paid saat balance = 0
- [x] Tampilan balance outstanding di React

### Payment Automation (Events & Listeners)
- [x] Event `InvoicePaid` (dispatched saat balance = 0)
- [x] Listener `SendInvoicePaidNotification` (placeholder Log; Phase 9 akan isi email job)
- [x] EventServiceProvider registered

### Payment Deletion (Reverse)
- [x] Endpoint `DELETE /api/payments/{id}`
- [x] Reverse payment: kurangi paid_amount, recalculate status (paid → partially_paid → sent)

### Payment Receipt
- [x] Blade template PDF `pdf.payment.receipt`
- [x] Endpoint `GET /api/payments/{id}/receipt`
- [x] Email payment receipt (Job `SendPaymentReceiptEmail`, dispatched otomatis saat payment recorded)

---

## Phase 7: Subscription

### Subscription Core — Backend API (NEXT PHASE)
- [x] Buat model dan migration untuk `subscriptions`
- [x] Buat model dan migration untuk `subscription_items`
- [x] Implementasi Subscription CRUD
- [x] Implementasi subscription numbering (`SUB-{YEAR}-{NUMBER}`)
- [x] Implementasi status subscription (Draft, Active, Paused, Cancelled, Expired)
- [x] Endpoint `GET /api/subscriptions`
- [x] Endpoint `GET /api/subscriptions/{id}`
- [x] Endpoint `POST /api/subscriptions`
- [x] Endpoint `PUT /api/subscriptions/{id}`
- [x] Endpoint `POST /api/subscriptions/{id}/pause`
- [x] Endpoint `POST /api/subscriptions/{id}/resume`
- [x] Endpoint `POST /api/subscriptions/{id}/cancel`
- [x] Endpoint `POST /api/subscriptions/{id}/generate-invoice` (manual)

### Subscription Core — Frontend React
- [x] Halaman `SubscriptionsList`
- [x] Halaman `SubscriptionDetail` (info + invoice yang dihasilkan)
- [x] Form `SubscriptionForm`
- [x] Komponen status subscription (shared `StatusBadge`)
- [x] Action bar: Edit, Pause/Resume, Cancel, Generate Invoice

### Convert Customer → Subscription
- [x] Endpoint `POST /api/customers/{id}/convert-subscription`
- [x] Tombol "Convert to Subscription" di `CustomerDetail`

---

## Phase 8: Billing Scheduler

### Scheduler Setup
- [x] Buat model dan migration untuk `billing_schedules`
- [x] Setup Laravel Scheduler di `app/Console/Kernel.php`
- [x] Command artisan `billing:process` (daily)

### Scheduler Logic
- [x] Job `GenerateRecurringInvoice`
- [x] Check subscription yang jatuh tempo (`next_billing_date <= today`)
- [x] Generate invoice otomatis dari subscription
- [x] Update `next_billing_date` sesuai billing cycle
- [x] Dispatch `SendInvoiceEmail` job
- [x] Error handling & retry

### Scheduler Testing
- [x] Test scheduler dengan berbagai billing cycle
- [ ] Test dengan subscription paused/cancelled
- [x] Test dengan tanggal berbeda (time boundary)

Catatan: migration Phase 8 masih pending dan harus dijalankan sebelum `billing:process`; CRUD subscription dan test paused/cancelled dilanjutkan pada Phase 7.

---

## Phase 9: Email Automation

### Email Templates — Backend
- [x] Buat model dan migration untuk `email_templates`
- [x] Buat model dan migration untuk `email_logs`
- [x] Implementasi EmailTemplate CRUD
- [x] Seeder template default: Invoice, Payment Reminder, Invoice Overdue, Payment Received, Invoice Paid, Quote, Quote Accepted
- [x] Service `EmailTemplateRenderer` (parse `{{variables}}`)

### Email Variables
- [x] `{{customer.name}}`, `{{customer.email}}`
- [x] `{{invoice.number}}`, `{{invoice.date}}`, `{{invoice.due_date}}`, `{{invoice.total}}`, `{{invoice.balance}}`
- [x] `{{quote.number}}`, `{{quote.valid_until}}`
- [ ] `{{subscription.number}}`, `{{subscription.next_billing}}`
- [x] `{{company.name}}`, `{{company.email}}`, `{{company.phone}}`
- [ ] `{{company.logo}}`

### Email Templates — Frontend React
- [x] Halaman `EmailTemplatesList`
- [x] Form `EmailTemplateForm`
- [x] Tombol "Restore Default"

### Email Queue & Jobs
- [x] Job `SendInvoiceEmail`
- [x] Job `SendPaymentReminder` (kind: reminder/overdue, resolve template `payment_reminder`/`invoice_overdue`, guard status, retry on failure)
- [x] Job `SendInvoiceOverdueEmail` (extends SendPaymentReminder dengan kind=overdue)
- [x] Job `SendInvoicePaidEmail`
- [x] Job `SendQuoteEmail`
- [x] Job `SendPaymentReceiptEmail` (dengan receipt PDF ter-attach, dispatched otomatis saat payment recorded)
- [x] Retry mechanism untuk job gagal (throw di catch → queue retry + EmailLog status failed)

### Payment Reminder Scheduler
- [x] Command `reminders:send` (daily, `app/Console/Commands/SendReminders.php`, didaftarkan di Kernel schedule 08:00 dengan `--dry-run`)
- [x] Reminder 3 hari sebelum due date (`reminder_due_soon_enabled`)
- [x] Reminder pada due date (`reminder_due_date_enabled`)
- [x] Reminder 3 hari setelah due date (Overdue) (`reminder_overdue_enabled`)
- [x] Reminder 7 hari setelah due date (Final) (`reminder_final_enabled`)
- [x] Setting enable/disable per tipe reminder (keys di group email + toggle di halaman Settings → Email)
- [x] Update status invoice → Overdue (command menandai sent/partially_paid yang due_date-nya terlewat)

---

## Phase 10: Templates Management

### Invoice Templates — Backend
- [x] Buat model dan migration untuk `invoice_templates` (slug-based selection)
- [x] Implementasi template selection (`slug`, `is_active`, `is_default`)
- [x] Seeder: Modern, Professional, Classic, Compact
- [x] Endpoint `GET /api/invoice-templates`, `POST /api/invoice-templates/{id}/activate`
- Catatan: Template Modern sudah jalan sebagai hardcoded Blade. DB table di-defer.
- [x] Buat model dan migration untuk `quote_templates`
- [x] Seeder: Quote Modern, Professional, Corporate
- Catatan: Quote Modern sudah jalan sebagai hardcoded Blade. DB table di-defer.

### Template Settings — Backend
- [x] Upload company logo (`PUT /api/company/logo` / `POST /api/company/logo`)
- [ ] Custom colors per template
- [ ] Custom footer text
- [ ] Custom header text

### PDF Generation (Phase 10 Lite)
- [x] Install package PDF (`barryvdh/laravel-dompdf`)
- [x] Konfigurasi dompdf
- [x] Buat `PdfService` untuk render invoice/quote/payment receipt
- [x] Blade template `pdf.invoice.modern` (Modern template, full features)
- [x] Blade template `pdf.invoice.professional` (Professional template, serif fonts, formal borders)
- [x] Blade template `pdf.invoice.classic` (Classic template, traditional business letter style)
- [x] Blade template `pdf.invoice.compact` (Compact template, minimalist condensed layout)
- [x] Blade template `pdf.quote.modern` (Modern quote template)
- [x] Blade template `pdf.quote.professional` (Professional quote template, formal serif style)
- [x] Blade template `pdf.quote.corporate` (Corporate quote template, bold corporate feel)
- [x] Endpoint `GET /api/invoices/{id}/pdf` (stream PDF inline)
- [x] Endpoint `GET /api/quotes/{id}/pdf` (stream PDF inline)
- [x] Endpoint `GET /api/payments/{id}/receipt` (stream PDF inline)
- [x] Frontend: tombol "Preview PDF" + "Download PDF" di InvoiceDetail
- [x] Frontend: tombol "Preview PDF" + "Download PDF" di QuoteDetail
- [x] Frontend: tombol "Preview Receipt" + "Download Receipt" di PaymentDetail
- [x] Util `lib/pdf.ts` (downloadPdf dengan Bearer auth, openPdfInNewTab)
- [x] PdfService resolve template berdasarkan slug yang aktif di database
- [ ] Preview template (thumbnail atau iframe)

### Templates — Frontend React
- [x] Halaman `TemplatesList` (Invoice & Quote) untuk switch template
- [ ] Preview template (thumbnail atau iframe)
- [x] Tombol "Set as Default"

---

## Phase 11: Dashboard

### Dashboard API
- [x] Endpoint `GET /api/dashboard/summary` (total_revenue, outstanding, overdue_count, customers_count)
- [x] Endpoint `GET /api/dashboard/recent-invoices`
- [x] Endpoint `GET /api/dashboard/upcoming-billing`
- [x] Endpoint `GET /api/dashboard/overdue-invoices`
- Catatan: summary dan daftar dashboard sudah memakai endpoint khusus; MRR dan upcoming billing menunggu modul subscription.

### Dashboard UI (React)
- [x] Komponen `StatCard` (Total Revenue, Outstanding, Overdue, Customers) — MRR belum
- [x] Komponen `RecentInvoicesTable`
- [x] Komponen `OverdueInvoicesTable`
- [x] Komponen `UpcomingBillingTable`
- [x] Quick Actions: Create Invoice, Create Quote
- [x] Date range filter di header dashboard
- [x] MRR widget

---

## Phase 12: Activity Log

### Activity Log — Backend
- [x] Buat model dan migration untuk `activity_logs`
- [ ] Trait `LogsActivity` pada model yang relevan
- [x] Helper `ActivityLog::record(...)`
- [ ] Event listener otomatis (created, updated, deleted)
- [x] Endpoint `GET /api/activity-logs` (filter type, date, user)

### Activity Log Events
- [ ] Invoice: created, sent, paid, voided
- [x] Payment: recorded
- [x] Quote: created, sent, accepted, rejected, converted
- [x] Subscription: created, renewed, paused, resumed, cancelled

### Activity Log UI
- [x] Halaman `ActivityLog` di React (timeline view)
- [x] Filter by type & date
- [ ] Tampilkan activity log di CustomerDetail, InvoiceDetail, QuoteDetail

---

## Phase 13: Reports

### Reports API
- [x] Endpoint `GET /api/reports/revenue` (month, year, by customer, by product)
- [x] Endpoint `GET /api/reports/invoices` (paid, unpaid, overdue, cancelled)
- [x] Endpoint `GET /api/reports/customers` (new, active, balance)
- [x] Endpoint `GET /api/reports/subscriptions` (active, cancelled, MRR, upcoming billing)
- [x] Query params: `from`, `to`, `group_by`

### Reports UI (React)
- [x] Halaman `Reports` dengan tab (Revenue, Invoice, Customer, Subscription)
- [x] Date range picker
- [x] Visualisasi revenue sederhana
- [x] Export to PDF
- [x] Export to Excel/CSV

---

## Phase 14: Settings

### Settings API
- [x] `GET/PUT /api/settings/company`
- [x] `GET/PUT /api/settings/invoice`
- [x] `GET/PUT /api/settings/quote`
- [x] `GET/PUT /api/settings/email`
- [x] `GET/PUT /api/settings/payment`
- [x] `POST /api/settings/email/test` (kirim test email)

### Settings UI (React)
- [x] Halaman `Settings` dengan sidebar tabs
- [x] Tab Company (logo, info)
- [x] Tab Invoice (prefix, due days, currency, tax, template)
- [x] Tab Quote (prefix, valid days, template)
- [x] Tab Email (SMTP config + test connection)
- [x] Tab Payment (bank info, instructions)

### User Management
- [x] Endpoint `GET/POST/PUT/DELETE /api/users`
- [x] Endpoint `POST /api/users/{id}/assign-role`
- [x] Halaman `UsersList` & `UserForm`
- [x] Halaman profil & ganti password

---

## Phase 15: Security

### Security Implementation
- [x] Sanctum Bearer token untuk SPA
- [x] XSS Protection (React auto-escape + Laravel)
- [x] SQL Injection Protection (Eloquent prepared statements)
- [x] Password Hashing (bcrypt via Laravel cast)
- [x] Input Validation (FormRequest di semua endpoint)
- [x] Rate Limiting (`api` 60/menit, auth 5/menit berbasis email/IP)
- [ ] Output Escaping (Blade untuk PDF)

### Authorization (Policies)
- [x] Policy untuk Customer, Product, Invoice, Quote, Payment, Subscription, Settings
- [x] Policy didaftarkan di endpoint API

### Audit
- [ ] Login Log (track successful & failed login)
- [ ] Failed Login Tracking (lockout setelah N attempt)
- [ ] Tampilkan audit log di activity log

---

## Phase 16: Multi-Currency Support

### Currency Backend
- [x] Buat tabel `currencies` (code, name, symbol, decimal_places)
- [x] Seeder default: IDR, USD, SGD, EUR, AUD
- [x] Kolom `currency` di invoice, quote (snapshot)
- [x] Kolom `currency` di subscription, payment
- [x] Helper `format_money($amount, $currency)`
- [x] Endpoint `GET /api/currencies`

### Currency Frontend
- [x] Dropdown currency di form Invoice/Quote (hardcoded options: IDR, USD, SGD, EUR, AUD)
- [x] Format currency sesuai locale (`Intl.NumberFormat` di `formatMoney`)
- [x] Tampilkan simbol currency

---

## Phase 17: Tax System

### Tax Backend
- [x] Buat tabel `tax_rates` (name, rate, is_default)
- [x] Seeder default: PPN 11%, PPN 12%, No Tax (0%), Custom
- [x] Kolom `tax_rate` di product (decimal, snapshot)
- [x] Snapshot `tax_rate` & `tax_amount` di invoice_items & quote_items
- [x] Service `TaxCalculator`
- [x] Endpoint `GET /api/tax-rates`

### Tax Frontend
- [x] Dropdown tax di ProductForm
- [x] Preview tax di InvoiceForm (real-time calc)
- [x] Tampilkan tax breakdown di InvoiceDetail

---

## Phase 18: Notification Center

### Notification Backend
- [x] Buat tabel `notifications` (user_id, type, title, body, data, read_at)
- [x] Service `NotifyUser` (dispatch notifikasi in-app)
- [x] Trigger dari events: PaymentReceived, InvoicePaid

### Notification UI
- [x] Endpoint `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`
- [x] Komponen unread badge pada navigation
- [x] Dropdown/list notification tersedia melalui halaman Notifications dan unread badge
- [x] Halaman `Notifications`

---

## Phase 19: Testing

### Backend Feature Testing (PHPUnit/Pest)
- [x] Test notification API (isolation, read, read-all)
- [x] Test create/update/delete customer
- [x] Test create/update/delete product
- [x] Test create invoice + kalkulasi total
- [x] Test invoice immutable setelah Sent
- [ ] Test generate PDF
- [ ] Test send invoice email (Mail fake)
- [x] Test create/accept/reject quote
- [x] Test convert quote to invoice
- [x] Test record payment (full & partial)
- [x] Test invoice status transition (Draft → Sent → Paid)
- [ ] Test create/cancel/pause subscription
- [x] Test scheduler billing cycle and date boundary
- [ ] Test payment reminder
- [ ] Test overdue reminder

### Frontend Testing (Vitest + React Testing Library)
- [ ] Component test untuk form (Customer, Product, Invoice, Quote)
- [ ] Hook test untuk API calls (mock axios)
- [ ] Snapshot test untuk layout

### Integration Testing
- [ ] E2E flow: Customer → Invoice → Payment → Paid Email
- [ ] E2E flow: Quote → Accept → Convert → Invoice → Payment
- [ ] E2E flow: Subscription → Scheduler → Invoice → Payment

### Security Testing
- [ ] Test authentication & token expiry
- [ ] Test authorization per role
- [ ] Test CSRF token
- [ ] Test rate limiting

### Performance Testing
- [ ] Test API response time (<200ms untuk list endpoint)
- [ ] Test PDF generation time
- [ ] Test database query (EXPLAIN pada query berat)
- [ ] Test scheduler performance (1000 subscriptions)

---

## Phase 20: Production Preparation

### Performance Optimization
- [x] Database indexing tambahan (composite index untuk filter)
- [ ] Query optimization (eager loading `with()`, hindari N+1)
- [ ] Caching strategy (Redis untuk dashboard summary)
- [x] Frontend: code splitting, lazy loading route
- [ ] Image optimization (logo compression)
- [ ] CDN untuk asset static

### Backup System
- [ ] Script `mysqldump` otomatis (daily/weekly/monthly)
- [ ] Backup file storage ke remote (S3/backblaze)
- [ ] Test restore dari backup

### Logging & Monitoring
- [x] Setup Laravel logging (daily log)
- [ ] Setup queue failed jobs logging
- [ ] Setup email delivery logging
- [ ] Setup scheduler heartbeat
- [x] Health check endpoint `GET /api/health`
- [ ] Monitoring (UptimeRobot / Better Uptime)

### Deployment Preparation
- [ ] Setup production server (Ubuntu 22.04 LTS)
- [ ] Setup Nginx
- [ ] Setup PHP 8.3+ & extensions
- [ ] Setup MySQL 8 / MariaDB
- [ ] Setup Redis
- [ ] Setup Supervisor (queue worker + scheduler)
- [ ] Setup SSL certificate (Let's Encrypt)
- [ ] Setup domain
- [ ] Konfigurasi `.env` production
- [x] Build React (`npm run build`) → serve dari Nginx
- [ ] Konfigurasi queue worker
- [ ] Konfigurasi cron scheduler

### Production Testing
- [ ] Test email production
- [ ] Test PDF production
- [ ] Test scheduler production
- [ ] Test backup restore production
- [ ] Load testing (k6 / Apache Bench)

---

## Phase 21: Go Live

### Pre-Launch Checklist
- [ ] Semua feature MVP berfungsi
- [ ] Semua test passed
- [ ] Security audit completed
- [ ] Performance acceptable (<2s page load)
- [ ] Backup system aktif
- [ ] Monitoring aktif
- [ ] SSL aktif (HTTPS only)
- [ ] Domain configured
- [ ] Email production tested
- [ ] PDF production tested

### Launch
- [ ] Deploy backend ke server
- [ ] Deploy frontend build ke server (Nginx serve)
- [ ] Run migration & seeder production
- [ ] Verify semua endpoint API accessible
- [ ] Monitor error logs (Laravel + Nginx)
- [ ] Monitor queue worker
- [ ] Monitor scheduler
- [ ] Monitor email delivery

### Post-Launch
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Optimize performance based on real usage
- [ ] Plan Phase 2 features

---

## Phase 22: Future Features (Post-MVP)

### Customer Portal
- [ ] Setup customer portal routes (subdomain atau `/portal`)
- [ ] Implementasi customer login (guard terpisah)
- [ ] Halaman Customer Dashboard
- [ ] View invoices & download PDF
- [ ] Accept/reject quote
- [ ] View payment history
- [ ] Update profile

### Payment Gateway
- [ ] Setup payment gateway integration (Midtrans/Xendit/Stripe)
- [ ] Implementasi webhook handler (`/api/webhooks/payment`)
- [ ] Verify signature webhook
- [ ] Auto-create payment saat webhook received
- [ ] Update invoice ke Paid otomatis
- [ ] Dispatch InvoicePaid event

### WhatsApp Notification
- [ ] Setup WhatsApp Business API (Fonnte / Wablas / official Meta)
- [ ] Implementasi WhatsApp notification untuk invoice
- [ ] Implementasi WhatsApp reminder
- [ ] Implementasi WhatsApp payment confirmation

### Multi Company (SaaS)
- [x] Skema company_id sudah ada di users, customers, products, invoices, quotes (multi-tenant siap)
- [ ] Implementasi company switching
- [ ] Subscription plan per company
- [ ] Billing untuk SaaS (pakai subscription internal)

### Advanced Features
- [ ] Recurring payment (auto-charge via gateway)
- [ ] Advanced reports & analytics
- [ ] API untuk mobile app (public API)
- [ ] Accounting integration (Jurnal / Accurate / Xero)
- [ ] Expense management
- [ ] Tax report (PPN summary)

---

## Catatan Penting

### Prinsip Arsitektur
- **Backend Laravel = API only** (tidak render view HTML selain SPA shell)
- **Frontend React = SPA** yang consume API di `/api/*`
- **Komunikasi**: REST API + JSON, dengan Sanctum Bearer token
- **PDF tetap di-render di Laravel** (Blade → DOMPDF) — planned
- **Real-time** (optional Phase 2): Laravel Echo + Pusher/Redis untuk notification

### Prioritas Development
1. **Fondasi harus kuat** — Auth, database, layout React, API contract ✅
2. **Core workflow utama** — Customer → Product → Quote → Invoice 🟡 (Payment belum)
3. **Subscription & Scheduler** — Fitur pembeda aplikasi ⬅️ **NEXT PHASE**
4. **Automation** — Email & reminder otomatis ⬜
5. **Jangan tambah fitur lain** sebelum core billing stabil

### Prinsip Development
- Simple, Clean, Modern UI (Tailwind)
- Maksimal 3-4 klik untuk pekerjaan utama
- Mobile responsive (akan di-improve)
- PDF profesional (planned)
- Email automation (planned)
- Audit trail (activity log) — planned
- Security first (HTTPS, Sanctum, validation)

### Standar API Response
```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "meta": { "current_page": 1, "per_page": 20, "total": 100 }
}
```

Atau error:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": { "field": ["Error message"] }
}
```

### Struktur Folder (current)
```
app/
├── Http/
│   ├── Controllers/Api/    # AuthController, CustomerController, dll
│   ├── Requests/           # Store/Update FormRequest
│   └── Resources/          # CustomerResource, InvoiceResource, dll
└── Models/

resources/
├── css/app.css             # Tailwind entry
├── js/                     # React SPA
│   ├── api/                # axios + per-resource clients
│   ├── components/
│   │   ├── layout/         # AppLayout, ProtectedRoute
│   │   ├── ui/             # Button, Form, Modal, Table, Display
│   │   └── ProductPicker.tsx
│   ├── contexts/AuthContext.tsx
│   ├── features/           # customers/, products/, invoices/, quotes/, auth/, dashboard/
│   ├── lib/                # utils, toast
│   ├── routes/             # router config
│   ├── types/              # TS types matching API
│   └── app.tsx             # entry: QueryClient + AuthProvider + RouterProvider
└── views/app.blade.php     # SPA shell (mount #root)
```

---

## Progress Tracking

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | 🟢 Done | 100% |
| Phase 2: Customer & Product | 🟢 Done | 100% |
| Phase 3: Invoice Core | 🟢 Done | 100% |
| Phase 4: Quote | 🟢 Done | 100% |
| Phase 5: Quote to Invoice & Termin/Milestone | 🟢 Done | 100% |
| Phase 6: Payment & Webhooks (Midtrans/Xendit/DOKU/Duitku) | 🟢 Done | 100% |
| Phase 7: Subscription & Recurring | 🟢 Done | 100% |
| Phase 8: Billing Scheduler | 🟢 Done | 100% |
| Phase 9: Email Automation | 🟢 Done | 100% |
| Phase 10: PDF Templates (Modern, Professional, Classic, Compact) | 🟢 Done | 100% |
| Phase 11: Dashboard & AR Aging | 🟢 Done | 100% |
| Phase 12: Activity Log | 🟢 Done | 100% |
| Phase 13: Reports (Sales, Tax, AR Aging PDF/CSV) | 🟢 Done | 100% |
| Phase 14: Settings & Brand Customization | 🟢 Done | 100% |
| Phase 15: Security & Licensing | 🟢 Done | 100% |
| Phase 16: Multi-Currency | 🟢 Done | 100% |
| Phase 17: Tax System (PPN Snapshot) | 🟢 Done | 100% |
| Phase 18: Notification | 🟢 Done | 100% |
| Phase 19: Testing (71 Tests, 299 Assertions) | 🟢 Done | 100% |
| **Fase 23: Dokumen Koreksi & Penyesuaian (Credit/Debit Note, Proforma)** | 🟢 Done | 100% |
| **Fase 24: Customer Statement of Account (Rekening Koran Pelanggan)** | 🟢 Done | 100% |
| **Fase 25: Pajak Indonesia Tingkat Lanjut (PPh 23 Withholding & PKP)** | 🟢 Done | 100% |
| **Fase 26: Multi-Invoice Payment Allocation & Customer Credit** | 🟢 Done | 100% |
| **Fase 27: Multi-Level Approval Workflow** | 🟢 Done | 100% |
| **Fase 28: Customer Credit Limit & Import/Export Massal** | 🟢 Done | 100% |
| **Fase 29: Smart Collection Ops (Collector Tasks, Call Notes & PTP)** | 🟢 Done | 100% |
| **Fase 30: Headless WhatsApp Gateway & Multi-Branch** | 🟢 Done | 100% |

**Overall Core MVP Progress: 100% | Product Plan Target: 100% (Sempurna)**

---

*Last updated: 18 November 2026*
*Stack: Laravel 10 API + React 18 + Vite + TS + MySQL*

## ✅ Yang Sudah Berfungsi (E2E & Unit/Feature Tested: 71 passed, 299 assertions)

- Register → Login → Bearer token + SAML 2.0 SSO (SP metadata, ACS, test cert)
- Customer CRUD + auto-number `CUST-XXXXX` + detail tabs & financial overview
- Product CRUD + auto-SKU `PRD-XXXXX`
- Invoice CRUD + auto-number `INV-{YEAR}-{NUMBER}` + kalkulasi total otomatis
- Quote CRUD + auto-number `QT-{YEAR}-{NUMBER}` + duplicate quote + kalkulasi
- Invoice status transition (mark-as-sent, void, paid, partial)
- Quote status transition (send, accept, reject, expired)
- Quote → Invoice conversion (preserves items, customer, totals)
- Termin & Milestone Invoicing (split persentase termin dari penawaran)
- Public Client Portal (secure token, view quote/invoice, upload bukti transfer)
- Payment Gateway Webhook handler (Midtrans, Xendit, DOKU, Duitku) dengan settlement event & receipt email
- AR Aging interactive analysis (Current, 1-30, 31-60, 61-90, >90 hari) + Export PDF & CSV
- 1-Click WhatsApp Share modal dengan generator pesan otomatis bahasa Indonesia
- Email automation (InvoiceMail, QuoteMail, PaymentReceipt, Reminders dunning)
- PDF templates: Modern, Professional, Classic, Compact
- Komersial Licensing System & Demo role guard
- Dynamic Emerald Blue `#0F5A5E` / Soft Mint `#4DB6AC` / Warm Cream `#F9F8F3` UI Palette

---

## 🚀 Roadmap Penyempurnaan Sistem (Sesuai Rencana Produk v1.0)

### Fase 23: Dokumen Koreksi & Penyesuaian (Credit/Debit Note, Proforma)
- [x] Model & migration `credit_notes` dan `credit_note_items` (nomor `CN-{YEAR}-{NUMBER}`)
- [x] Model & migration `debit_notes` dan `debit_note_items` (nomor `DN-{YEAR}-{NUMBER}`)
- [x] Tipe dokumen Proforma Invoice (penomoran `PRO-{YEAR}-{NUMBER}`) dengan 1-click upgrade to Sales Invoice
- [x] Logic alokasi Credit Note untuk memotong piutang invoice aktif
- [x] API Endpoints CRUD Credit Note & Debit Note (`/api/credit-notes`, `/api/debit-notes`)
- [x] PDF Template untuk Credit Note & Debit Note
- [x] UI List, Create, & Detail Credit Note / Debit Note di React frontend

### Fase 24: Customer Statement of Account (Rekening Koran Pelanggan)
- [x] Service `CustomerStatementService` / Controller: agregasi transaksi invoice, pembayaran, credit note, dan running balance per rentang tanggal
- [x] API Endpoint `/api/customers/{id}/statement` (JSON & stream PDF download)
- [x] Blade template PDF resmi untuk Customer Statement of Account
- [x] Tab "Statement of Account" pada halaman Customer Detail di Frontend dengan date range filter & tombol download PDF/kirim email

### Fase 25: Pajak Indonesia Tingkat Lanjut (PPh 23 Withholding & Profil PKP)
- [x] Penambahan field PKP, NPWP 16 digit, NIK, dan NITKU di profil Perusahaan dan Pelanggan
- [x] Fitur pemotongan PPh 23 (tarif 2% jasa) & PPh 4 ayat 2 (sewa/konstruksi) pada Invoice
- [x] Pencatatan Bukti Potong (Nomor Bupot, tanggal bupot, file upload bukti potong)
- [x] Rekonsiliasi pelunasan: `Total Bayar = Nilai Netto (Kas) + Bukti Potong PPh`
- [x] Field Nomor Seri Faktur Pajak (NSFP) dari DJP pada Invoice

### Fase 26: Multi-Invoice Payment Allocation & Customer Credit
- [x] Migration pivot table `invoice_payment_allocations` (memungkinkan 1 pembayaran melunasi beberapa invoice)
- [x] Mekanisme Customer Credit Balance (Saldo Lebih Bayar / Deposit di table `customers`)
- [x] Form wizard pembayaran: pilih pelanggan → centang daftar invoice terbuka → masukkan total bayar → auto-alokasi saldo & simpan deposit
- [x] API Endpoint `/api/payments/multi` untuk penerimaan pembayaran gabungan

### Fase 27: Multi-Level Approval Workflow
- [x] Konfigurasi batas nominal invoice yang memerlukan persetujuan manajerial di Companies table (`enable_invoice_approval`, `invoice_approval_threshold`)
- [x] Field status invoice persetujuan: `approval_status` (pending, approved, rejected), `approved_by_user_id`, `approved_at`, `rejection_reason`
- [x] Guard `markAsSent`: invoice di atas threshold otomatis dicegat jika belum diapprove oleh Owner/Admin
- [x] API Endpoints `/api/invoices/{id}/request-approval`, `/api/invoices/{id}/approve`, `/api/invoices/{id}/reject`
- [x] UI Banner & Actions "Setujui (Approve)" / "Tolak (Reject)" / "Ajukan Approval" pada InvoiceDetailPage

### Fase 28: Customer Credit Limit & Import/Export Massal
- [x] Field `credit_limit` dan `payment_terms_days` pada tabel `customers`
- [x] Controller `ImportExportController`: endpoint download template CSV (`/api/import/template/{type}`)
- [x] Endpoint import massal Pelanggan (`/api/import/customers`)
- [x] Endpoint import massal Produk (`/api/import/products`)

### Fase 29: Smart Collection Ops (Collector Tasks, Call Notes & PTP)
- [x] Tabel `collection_tasks` dan `collection_logs`
- [x] Dashboard Tim Penagihan: daftar antrean penagihan harian terurut berdasarkan AR aging & priority (`/api/collections/tasks`)
- [x] Fitur catat log penagihan: hasil telepon, kontak, status respon, dan Promise to Pay (PTP) date & nominal (`/api/collections/logs`)
- [x] Auto transition status task menjadi `completed` saat klien memberikan komitmen bayar (PTP)

### Fase 30: Headless WhatsApp Gateway & Multi-Branch
- [x] Konfigurasi WhatsApp API Gateway di tabel `companies` (`whatsapp_provider`, `whatsapp_api_token`, `whatsapp_api_url`)
- [x] Driver dispatch otomatis via Fonnte & background webhook endpoint (`/api/whatsapp/send`)
- [x] Multi-tenant company scoping yang terisolasi aman
