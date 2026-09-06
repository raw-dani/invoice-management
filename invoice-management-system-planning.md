# Invoice Management System
## System Planning & Development Roadmap

> Dokumen perencanaan lengkap untuk aplikasi management invoice yang sederhana, clean, mudah digunakan, dan siap dikembangkan menjadi SaaS.

---

## 1. Konsep Besar Aplikasi

Aplikasi berfokus pada:

- Customer Management
- Product Management
- One-Time Product
- Subscription Product
- Recurring Billing
- Quote Management
- Quote → Invoice
- Invoice Management
- Payment Management
- PDF Invoice & Quote
- Email Automation
- Payment Reminder
- Invoice Paid Notification
- Dashboard & Reports
- Template Management
- Activity Log
- Settings

Aplikasi **bukan ERP/accounting system**. Fokusnya adalah billing dan invoicing.

### Alur utama

```text
CUSTOMER
   │
   ├── Customer Lama
   │
   └── Customer Baru
          │
          └── Bisa dikonversi menjadi Customer Langganan
                    │
                    ▼
                  QUOTE
                    │
              ┌─────┴─────┐
              │           │
           Draft       Accepted
                          │
                          ▼
                    Convert Invoice
                          │
                          ▼
                       INVOICE
                          │
              ┌───────────┼───────────┐
              │           │           │
            Draft       Sent       Overdue
                                      │
                                      ▼
                                    Paid
                                      │
                                      ▼
                              Email Invoice Paid
```

### Alur Product

```text
PRODUCT
   │
   ├── One Time
   │      └── Invoice sekali
   │
   └── Subscription
          │
          ├── Monthly
          ├── Quarterly
          ├── Semi Annual
          └── Yearly
                    │
                    ▼
             Billing Schedule
                    │
                    ▼
             Auto Generate Invoice
```

---

# 2. Prinsip UX & UI

Aplikasi harus:

- Simple
- Clean
- Modern
- Cepat
- Tidak terlalu banyak form
- Mobile responsive
- Mudah dipahami user baru
- Maksimal 3–4 langkah untuk pekerjaan utama

### Menu utama

```text
Dashboard

Sales
├── Quotes
└── Invoices

Customers

Products
├── Products
└── Subscriptions

Payments

Reports

Settings
├── Company
├── Invoice
├── Quote
├── Email
├── Templates
└── Payment
```

Hindari fitur ERP yang tidak diperlukan pada MVP seperti:

- General Ledger
- Purchase
- Inventory
- Warehouse
- Payroll
- Accounting kompleks

---

# 3. Dashboard

Dashboard harus langsung menjawab:

> Berapa uang yang harus saya terima?

Contoh:

```text
Good Evening

September 2026

┌────────────────┐ ┌────────────────┐
│ Total Revenue  │ │ Outstanding    │
│ Rp 48.500.000  │ │ Rp 12.300.000  │
└────────────────┘ └────────────────┘

┌────────────────┐ ┌────────────────┐
│ Overdue        │ │ Customers      │
│ Rp 3.200.000   │ │ 128            │
└────────────────┘ └────────────────┘
```

### Recent Invoices

```text
INV-2026-001    PT ABC       Rp5.000.000   PAID
INV-2026-002    PT XYZ       Rp2.500.000   SENT
INV-2026-003    CV Maju      Rp1.200.000   OVERDUE
```

### Upcoming Billing

```text
05 Sep   PT ABC       Hosting Pro       Rp500.000
10 Sep   PT XYZ       Maintenance       Rp1.500.000
15 Sep   PT Maju      Google Workspace  Rp900.000
```

### Quick Actions

```text
+ Create Invoice
+ Create Quote
+ Add Customer
+ Add Product
```

---

# 4. Customer Management

Customer menjadi pusat data aplikasi.

## Data Customer

```text
Customer
├── ID
├── Customer Number
├── Company Name
├── Contact Person
├── Email
├── Phone
├── Address
├── City
├── Province
├── Country
├── Tax ID
├── Notes
└── Status
```

### Status

```text
Lead
Active
Inactive
```

## Customer Detail

```text
PT ABC Indonesia

abc@example.com
+62 xxx xxxx

────────────────────────

Overview

Total Invoice      Rp25.000.000
Paid               Rp20.000.000
Outstanding        Rp5.000.000

────────────────────────

Invoices

Quotes

Subscriptions

Payments

Activity
```

---

# 5. Customer Baru dari Invoice

Saat membuat invoice:

```text
Create Invoice

Customer

[ Select Customer ▼ ]

+ Add New Customer
```

Jika memilih `+ Add New Customer`:

```text
Add Customer

Company Name *
Contact Name
Email *
Phone
Address

[ Save Customer ]
```

Setelah disimpan, customer langsung digunakan pada invoice.

---

# 6. Konversi Customer Baru Menjadi Customer Langganan

Customer baru dapat dibuat menjadi subscription.

```text
PT ABC

Customer since:
04 September 2026

[ Convert to Subscription ]
```

Form:

```text
Create Subscription

Product:
Hosting Business

Price:
Rp500.000

Billing:
○ Monthly
○ Quarterly
○ Semi Annual
○ Yearly

Start Date:
04 September 2026

Next Billing:
04 October 2026

Auto Generate Invoice:
ON

[ Create Subscription ]
```

---

# 7. Product Management

Product mendukung dua tipe:

## One Time Product

Contoh:

- Website Development
- Logo Design
- Server Setup
- Domain Registration
- Hardware
- Consulting

## Subscription Product

Contoh:

- Web Hosting
- Google Workspace
- Microsoft 365
- Maintenance
- Server Rental
- Software License

## Struktur Product

```text
Product
├── Name
├── SKU
├── Description
├── Type
│    ├── One Time
│    └── Subscription
├── Price
├── Currency
├── Tax
├── Billing Cycle
├── Status
└── Notes
```

### Billing Cycle

```text
Monthly
Quarterly
Semi Annual
Yearly
Custom
```

---

# 8. Subscription Management

Subscription merupakan modul inti.

Contoh:

```text
Subscription #SUB-00021

Customer:
PT ABC Indonesia

Product:
Hosting Business

Price:
Rp500.000 / Month

Start Date:
04 Sep 2026

Next Billing:
04 Oct 2026

Status:
ACTIVE
```

### Status

```text
Draft
Active
Paused
Cancelled
Expired
```

### Action

```text
[ Edit ]
[ Pause ]
[ Cancel ]
[ Generate Invoice ]
[ View Invoices ]
```

---

# 9. Billing Scheduler

Scheduler otomatis memproses subscription.

Contoh:

```text
Subscription

Start:
04 Sep

Billing:
Monthly

Next Billing:
04 Oct
```

Pada tanggal billing:

```text
Scheduler
     │
     ▼
Check Subscription
     │
     ▼
Generate Invoice
     │
     ▼
INV-2026-010
     │
     ▼
Send Invoice Email
     │
     ▼
Update Next Billing
     │
     ▼
04 November
```

Scheduler harus berjalan melalui background worker/cron dan tidak bergantung pada user membuka dashboard.

---

# 10. Invoice Management

## Status Invoice

```text
Draft
Sent
Partially Paid
Paid
Overdue
Cancelled
Void
```

## Struktur Invoice

```text
Invoice

Invoice Number
Invoice Date
Due Date

Customer

Items
--------------------------------
Product       Qty     Price
Hosting        1      500.000
Domain         1      150.000
--------------------------------

Subtotal              650.000
Discount              50.000
Tax                   66.000
--------------------------------
TOTAL                 666.000
```

---

# 11. Invoice Numbering

Invoice number dibuat otomatis.

Contoh:

```text
INV-2026-0001
INV-2026-0002
INV-2026-0003
```

Konfigurasi:

```text
Prefix:
INV

Number:
000001

Format:
INV-{YEAR}-{NUMBER}
```

Quote:

```text
QT-{YEAR}-{NUMBER}
```

Subscription:

```text
SUB-{YEAR}-{NUMBER}
```

---

# 12. Quote Management

Quote memiliki alur:

```text
Draft
   ↓
Sent
   ↓
Viewed
   ↓
Accepted
   ↓
Converted
   ↓
Invoice
```

Status:

```text
Draft
Sent
Accepted
Rejected
Expired
Converted
```

Contoh:

```text
QUOTE

QT-2026-0012

PT ABC Indonesia

Valid Until:
30 September 2026

Items
--------------------------------
Website Development   1   15.000.000
Hosting               1    1.200.000

Subtotal                    16.200.000
Discount                       500.000
Tax                          1.570.000

TOTAL                       17.270.000
```

---

# 13. Quote → Invoice

Pada Quote tersedia:

```text
[ Edit ]
[ Send ]
[ Duplicate ]
[ Convert to Invoice ]
```

Saat `Convert to Invoice`:

```text
Quote
QT-2026-0012

        ↓

Invoice
INV-2026-0035
```

Data yang disalin:

- Customer
- Product
- Description
- Quantity
- Price
- Discount
- Tax
- Notes
- Terms

Quote kemudian diberi status:

```text
CONVERTED
```

Relasi:

```text
quote_id → invoice_id
```

---

# 14. Payment Management

Pada invoice:

```text
INV-2026-0035

TOTAL
Rp17.270.000

Status
UNPAID

[ Record Payment ]
```

Form:

```text
Record Payment

Amount:
Rp17.270.000

Payment Date:
04 Sep 2026

Payment Method:
○ Bank Transfer
○ Cash
○ Credit Card
○ E-Wallet
○ Other

Reference:
TRX-123456

Notes:

[ Save Payment ]
```

Jika pembayaran penuh:

```text
Invoice
     ↓
Payment recorded
     ↓
Balance = 0
     ↓
Status = PAID
     ↓
Trigger Event
     ↓
Send "Invoice Paid" Email
```

---

# 15. Partial Payment

Sistem harus mendukung pembayaran sebagian.

Contoh:

```text
Invoice Total:     Rp1.000.000
Payment:             Rp500.000
Balance:             Rp500.000
Status:              PARTIALLY PAID
```

Kemudian:

```text
Payment:             Rp500.000
Balance:             Rp0
Status:              PAID
```

---

# 16. Email Automation

Event yang didukung:

## Invoice Created

```text
Subject:
Invoice INV-2026-0035 from {{company.name}}
```

## Invoice Sent

Mengirim invoice kepada customer.

## Payment Received

```text
Payment Received

Thank you for your payment.
```

## Invoice Paid

```text
Invoice Paid

Invoice:
INV-2026-0035

Amount:
Rp17.270.000

Status:
PAID
```

Attachment:

```text
invoice-INV-2026-0035.pdf
```

---

# 17. Email Template Management

Email tidak boleh hardcode.

Menu:

```text
Settings
→ Email Templates
```

Template:

```text
Invoice Email
Payment Reminder
Invoice Overdue
Payment Received
Invoice Paid
Quote Email
Quote Accepted
```

Contoh:

```text
Subject:
Invoice {{invoice.number}} from {{company.name}}

Body:

Hello {{customer.name}},

Please find attached invoice
{{invoice.number}}.

Amount:
{{invoice.total}}

Due Date:
{{invoice.due_date}}

Thank you.
```

## Variables

```text
{{customer.name}}
{{customer.email}}

{{invoice.number}}
{{invoice.date}}
{{invoice.due_date}}
{{invoice.total}}
{{invoice.balance}}

{{company.name}}
{{company.email}}
{{company.phone}}
```

---

# 18. Invoice Template

Sediakan beberapa template.

## Template 1 — Modern

- Clean
- Minimal
- Banyak whitespace

## Template 2 — Professional

- Formal
- Cocok untuk corporate

## Template 3 — Classic

- Format invoice tradisional

## Template 4 — Compact

- Cocok untuk invoice dengan banyak item

UI:

```text
Invoice Templates

Modern       [Active]
Professional [Use]
Classic      [Use]
Compact      [Use]
```

---

# 19. Quote Template

Quote juga memiliki template:

```text
Quote Modern
Quote Professional
Quote Corporate
```

Invoice dan Quote menggunakan PDF rendering engine yang sama agar maintenance lebih mudah.

---

# 20. PDF Generator

Setiap invoice/quote memiliki:

```text
Preview
Download PDF
Print
Send Email
```

Isi PDF:

```text
Company Logo

Company Information

Customer Information

Document Number

Date
Due Date / Valid Until

Items

Subtotal
Discount
Tax
Total

Payment Information

Notes

Terms & Conditions

Footer
```

---

# 21. Payment Reminder

Reminder otomatis dapat dikonfigurasi.

```text
Payment Reminder

[X] 3 days before due date

[X] On due date

[X] 3 days after due date

[X] 7 days after due date
```

Alur:

```text
Invoice
   │
   ├── Due -3 days → Reminder
   │
   ├── Due date → Reminder
   │
   ├── Due +3 days → Overdue Email
   │
   └── Due +7 days → Final Reminder
```

User dapat mengaktifkan/nonaktifkan setiap reminder.

---

# 22. Payment Gateway

Untuk MVP, cukup:

```text
Manual Payment
Bank Transfer
Cash
Other
```

Payment gateway dibuat pada fase berikutnya:

```text
Midtrans
Xendit
Stripe
PayPal
DOKU
```

Alur gateway:

```text
Payment Gateway
       ↓
Webhook
       ↓
Verify Payment
       ↓
Create Payment
       ↓
Invoice = PAID
       ↓
Send Paid Email
```

---

# 23. Database Architecture

Gunakan relational database:

- PostgreSQL, atau
- MySQL/MariaDB

## Tabel inti

```text
users
companies
customers

products
product_prices

subscriptions
subscription_items

quotes
quote_items

invoices
invoice_items

payments

email_templates
email_logs

invoice_templates
quote_templates

billing_schedules

settings

activity_logs
```

## Relasi utama

```text
Customer
   │
   ├── Quotes
   │
   ├── Invoices
   │
   ├── Payments
   │
   └── Subscriptions
             │
             └── Product
```

---

# 24. Struktur Database Detail

## customers

```text
id
customer_number
company_name
contact_name
email
phone
address
city
province
country
tax_number
status
created_at
updated_at
```

## products

```text
id
sku
name
description
type
price
currency
billing_cycle
tax_rate
status
created_at
updated_at
```

## subscriptions

```text
id
subscription_number
customer_id
status
start_date
next_billing_date
billing_cycle
currency
subtotal
tax
total
auto_invoice
created_at
updated_at
```

## invoices

```text
id
invoice_number
customer_id
subscription_id
quote_id
invoice_date
due_date
status
subtotal
discount
tax
total
paid_amount
balance
currency
notes
terms
created_at
updated_at
```

## payments

```text
id
payment_number
invoice_id
customer_id
amount
payment_date
payment_method
reference
notes
created_at
```

---

# 25. Event System

Gunakan event-driven logic.

Contoh:

```text
InvoicePaid
     │
     ├── Update Invoice
     ├── Update Customer Balance
     ├── Create Activity Log
     └── Send Paid Email
```

Event:

```text
InvoiceCreated
InvoiceSent
InvoiceOverdue
InvoicePaid

QuoteCreated
QuoteSent
QuoteAccepted
QuoteConverted

SubscriptionCreated
SubscriptionRenewed
SubscriptionPaused
SubscriptionCancelled

PaymentCreated
```

Keuntungan:

- Mudah dikembangkan
- Logic lebih terpisah
- Automation lebih aman
- Mudah menambahkan WhatsApp/payment gateway di masa depan

---

# 26. Background Job

Automation dijalankan menggunakan queue.

```text
GenerateInvoiceJob
SendInvoiceEmailJob
SendReminderJob
GeneratePdfJob
SendInvoicePaidEmailJob
```

Alur:

```text
Cron
  ↓
Billing Worker
  ↓
Check subscriptions
  ↓
Generate invoices
  ↓
Send emails
  ↓
Payment reminders
  ↓
Overdue processing
```

---

# 27. Activity Log

Semua perubahan penting disimpan.

Contoh:

```text
04 Sep 2026 20:31
Invoice INV-001 created

04 Sep 2026 20:32
Invoice sent to customer

04 Sep 2026 21:05
Payment Rp5.000.000 recorded

04 Sep 2026 21:05
Invoice marked as PAID

04 Sep 2026 21:05
Paid email sent
```

---

# 28. Settings

## Company

```text
Company Name
Logo
Address
Phone
Email
Website
Tax Number
```

## Invoice

```text
Invoice Prefix
Next Number
Default Due Days
Default Currency
Default Tax
Default Template
```

## Quote

```text
Quote Prefix
Next Number
Default Valid Days
Default Template
```

## Email

```text
SMTP Host
SMTP Port
Username
Password
Encryption
From Name
From Email
```

## Payment

```text
Bank Name
Account Name
Account Number

Payment Instructions
```

---

# 29. Multi-Currency

Database sejak awal harus mendukung:

```text
IDR
USD
SGD
EUR
AUD
```

Namun MVP tidak perlu automatic currency conversion.

Invoice menyimpan currency sendiri:

```text
currency = IDR
```

atau:

```text
currency = USD
```

Nilai invoice harus tetap immutable.

---

# 30. Tax

Sistem tax sederhana:

```text
PPN 11%
PPN 12%
No Tax
Custom
```

Product dapat memiliki default tax.

Invoice menyimpan snapshot:

```text
tax_rate = 11
tax_amount = 550000
```

Dengan demikian perubahan tax product tidak mengubah invoice lama.

---

# 31. Invoice Immutable

Setelah invoice berstatus `SENT`, perubahan data penting harus dibatasi.

Jangan sembarangan mengubah:

- Customer
- Harga
- Tax
- Total

Jika ada kesalahan:

```text
Void Invoice
```

kemudian buat invoice baru.

Tujuannya menjaga integritas dan audit trail.

---

# 32. UX Create Invoice

Gunakan wizard sederhana.

## Step 1 — Customer

```text
Customer

[ PT ABC ▼ ]

+ New Customer
```

## Step 2 — Items

```text
Items

[ + Add Product ]

Hosting      1 × Rp500.000
Domain       1 × Rp150.000
```

## Step 3 — Payment

```text
Invoice Date
Due Date
Payment Terms
```

## Step 4 — Preview

```text
[ Save Draft ]
[ Save & Send ]
```

---

# 33. Global Search

Search di header.

Pencarian:

```text
INV-2026-001
PT ABC
Hosting Business
QT-2026-010
SUB-2026-003
```

Hasil dapat berasal dari:

```text
Invoice
Customer
Quote
Product
Subscription
```

---

# 34. Notification Center

Contoh:

```text
🔔

3 invoices overdue
2 subscriptions due tomorrow
1 payment received
```

Tidak perlu sistem notification kompleks untuk MVP.

---

# 35. Reporting

## Revenue

```text
Revenue This Month
Revenue This Year
```

## Invoice

```text
Paid
Unpaid
Overdue
Cancelled
```

## Customer

```text
New Customers
Active Customers
```

## Subscription

```text
Active
Cancelled
MRR
Upcoming Billing
```

---

# 36. MRR

Karena aplikasi memiliki subscription, dashboard dapat menampilkan:

```text
MRR
Rp28.500.000
```

Contoh perhitungan:

```text
Monthly
Rp10.000.000

Quarterly
Rp12.000.000 / 3
= Rp4.000.000

Yearly
Rp24.000.000 / 12
= Rp2.000.000

MRR
= Rp16.000.000
```

MRR dapat menjadi fitur premium di masa depan.

---

# 37. Security

Minimal:

```text
Authentication
Authorization
Password Hashing
CSRF Protection
XSS Protection
SQL Injection Protection
Rate Limiting
Session Security
Audit Log
```

## Role

```text
Owner
Admin
Staff
Viewer
```

## Permission

```text
customers.view
customers.create
customers.edit

quotes.view
quotes.create
quotes.edit
quotes.send

invoices.view
invoices.create
invoices.edit
invoices.send
invoices.void

payments.create

reports.view

settings.manage
```

---

# 38. Backup

Production wajib memiliki:

```text
Database Backup
File Backup
Configuration Backup
```

Rekomendasi:

```text
Daily Backup
Weekly Backup
Monthly Backup
```

Backup harus disimpan di lokasi berbeda dari server utama.

---

# 39. Recommended Tech Stack

## Backend

```text
Laravel
PHP 8.3/8.4
MySQL/MariaDB atau PostgreSQL
Redis
Queue
Scheduler
```

## Frontend

Rekomendasi:

```text
Laravel
Blade
Livewire
Alpine.js
Tailwind CSS
```

Stack ini cocok karena aplikasi invoice tidak membutuhkan SPA yang sangat kompleks.

---

# 40. Arsitektur Sistem

```text
                 ┌───────────────┐
                 │    Browser    │
                 └───────┬───────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Laravel App     │
                │                 │
                │ Auth            │
                │ Customers       │
                │ Products        │
                │ Quotes          │
                │ Invoices        │
                │ Payments        │
                │ Subscriptions   │
                └───────┬─────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      Database        Redis        Storage
          │             │             │
          │             │             └── PDF
          │             │
          │             └── Queue
          │
          ▼
      MySQL/PostgreSQL

                    ┌──────────────┐
                    │ Scheduler    │
                    └──────┬───────┘
                           │
                           ▼
                  Billing Automation
```

---

# 41. Struktur Project Laravel

```text
app/
├── Models/
│   ├── Customer.php
│   ├── Product.php
│   ├── Subscription.php
│   ├── Quote.php
│   ├── QuoteItem.php
│   ├── Invoice.php
│   ├── InvoiceItem.php
│   ├── Payment.php
│   └── EmailTemplate.php
│
├── Services/
│   ├── InvoiceService.php
│   ├── QuoteService.php
│   ├── PaymentService.php
│   ├── SubscriptionService.php
│   ├── BillingService.php
│   ├── PdfService.php
│   └── EmailService.php
│
├── Jobs/
│   ├── GenerateRecurringInvoice.php
│   ├── SendInvoiceEmail.php
│   ├── SendPaymentReminder.php
│   └── SendInvoicePaidEmail.php
│
├── Events/
│   ├── InvoicePaid.php
│   ├── InvoiceSent.php
│   └── QuoteAccepted.php
│
├── Listeners/
│   └── SendInvoicePaidNotification.php
│
└── Policies/
```

---

# 42. API

API sebaiknya disiapkan sejak awal walaupun aplikasi pertama berbasis web.

```text
/api/customers
/api/products

/api/quotes
/api/quotes/{id}/convert

/api/invoices
/api/invoices/{id}

/api/payments

/api/subscriptions
/api/subscriptions/{id}

/api/webhooks/payment
```

API akan memudahkan pengembangan:

- Mobile app
- Client portal
- WhatsApp integration
- Payment gateway
- Accounting integration

---

# 43. Client Portal — Phase 2

Customer portal tidak wajib untuk MVP.

Arsitektur harus memungkinkan:

```text
Customer Portal

Dashboard
Invoices
Quotes
Payments
Subscriptions
Profile
```

Customer dapat:

```text
View Invoice
Download PDF
Accept Quote
Pay Invoice
View Payment History
```

---

# 44. Roadmap Development

## Phase 1 — Foundation

```text
Project setup
Authentication
User
Company
Role & Permission
Database
Settings
Layout
```

Target:

> Fondasi aplikasi selesai.

## Phase 2 — Customer & Product

```text
Customer CRUD
Product CRUD
Product type
Pricing
Tax
Customer detail
Product detail
Search
```

## Phase 3 — Invoice

```text
Create Invoice
Edit Invoice
Invoice Items
Discount
Tax
Invoice Number
Invoice Status
PDF
Print
Email
```

## Phase 4 — Quote

```text
Create Quote
Quote Items
Quote PDF
Quote Email
Quote Status
Accept Quote
Convert Quote → Invoice
```

## Phase 5 — Payment

```text
Payment
Payment history
Partial payment
Invoice balance
Mark Paid
Payment receipt
Paid email
```

## Phase 6 — Subscription

```text
Subscription
Billing cycle
Next billing
Auto invoice
Scheduler
Recurring invoice
Subscription status
```

## Phase 7 — Automation

```text
Email templates
Invoice reminder
Overdue reminder
Paid notification
Queue
Scheduler
Activity log
```

## Phase 8 — Production

```text
Security audit
Performance
Database indexing
Backup
Logging
Email testing
PDF testing
Scheduler testing
Load testing
Deployment
SSL
Domain
Production environment
```

---

# 45. Testing

## Test Invoice

```text
Create customer
↓
Create product
↓
Create invoice
↓
Generate PDF
↓
Send email
```

## Test Payment

```text
Invoice Rp1.000.000
↓
Payment Rp500.000
↓
Balance Rp500.000
↓
Status PARTIALLY PAID
```

Kemudian:

```text
Payment Rp500.000
↓
Balance Rp0
↓
Status PAID
↓
Send Paid Email
```

## Test Subscription

```text
Subscription
Monthly Rp500.000

↓ scheduler

Invoice generated

↓ next billing

Invoice generated again
```

## Test Quote

```text
Quote
↓
Accepted
↓
Convert
↓
Invoice created
```

---

# 46. Production Deployment

Server yang direkomendasikan:

```text
Ubuntu
Nginx/OpenLiteSpeed
PHP 8.3/8.4
MySQL/MariaDB
Redis
Supervisor
Cron
SSL
```

Contoh directory:

```text
/home/invoice-app/current
```

Environment:

```text
APP_ENV=production
APP_DEBUG=false
QUEUE_CONNECTION=redis
CACHE_STORE=redis
SESSION_DRIVER=redis
```

Worker:

```text
Laravel Queue Worker
```

Scheduler:

```text
Laravel Scheduler
```

---

# 47. Monitoring Production

Minimal:

```text
Application Log
Queue Failed Jobs
Database Monitoring
Server Monitoring
Email Delivery Log
Scheduler Status
```

Admin health dashboard:

```text
Queue
✓ Running

Scheduler
✓ Running

Email
✓ Connected

Database
✓ Connected
```

---

# 48. MVP Scope

MVP yang direkomendasikan:

```text
1. Authentication
2. Dashboard
3. Customer
4. Product
5. Invoice
6. Quote
7. Quote → Invoice
8. Payment
9. Invoice Paid Email
10. PDF
11. Invoice Template
12. Quote Template
13. Subscription
14. Recurring Invoice
15. Email Template
16. Payment Reminder
17. Settings
18. Activity Log
19. Reports
20. Backup
```

Dengan 20 modul ini aplikasi sudah layak untuk live.

---

# 49. Phase 2 Features

Setelah MVP stabil:

```text
Customer Portal
Payment Gateway
WhatsApp Notification
Multi Company
Multi Currency
Recurring Payment
Advanced Reports
API
Mobile App
Accounting Integration
Expense
Tax Report
```

---

# 50. Alur Penggunaan Ideal

## One-Time Sale

```text
LOGIN
  ↓
DASHBOARD
  ↓
+ CREATE INVOICE
  ↓
SELECT CUSTOMER
  ↓
ADD PRODUCT
  ↓
SAVE & SEND
  ↓
CUSTOMER PAYS
  ↓
RECORD PAYMENT
  ↓
INVOICE = PAID
  ↓
AUTOMATIC PAID EMAIL
```

## Quote

```text
CREATE QUOTE
      ↓
SELECT CUSTOMER
      ↓
ADD PRODUCT
      ↓
SEND QUOTE
      ↓
CUSTOMER ACCEPTS
      ↓
CONVERT TO INVOICE
      ↓
SEND INVOICE
      ↓
CUSTOMER PAYS
      ↓
PAID EMAIL
```

## Subscription

```text
CREATE CUSTOMER
      ↓
CREATE SUBSCRIPTION
      ↓
SELECT PRODUCT
      ↓
SET BILLING CYCLE
      ↓
ACTIVE
      ↓
SCHEDULER
      ↓
AUTO GENERATE INVOICE
      ↓
SEND EMAIL
      ↓
CUSTOMER PAYS
      ↓
PAID
      ↓
UPDATE NEXT BILLING
```

---

# 51. Struktur Menu Final

```text
┌──────────────────────────────┐
│ LOGO                         │
│                              │
│ Dashboard                    │
│                              │
│ SALES                        │
│   Quotes                     │
│   Invoices                   │
│                              │
│ CUSTOMERS                    │
│                              │
│ PRODUCTS                     │
│   Products                   │
│   Subscriptions              │
│                              │
│ PAYMENTS                     │
│                              │
│ REPORTS                      │
│                              │
│ SETTINGS                     │
│   Company                    │
│   Invoice                    │
│   Quote                      │
│   Templates                  │
│   Email                      │
│   Payment                    │
│   Users                      │
└──────────────────────────────┘
```

---

# 52. Prioritas UX

## 1. Pekerjaan utama maksimal 3–4 klik

```text
Dashboard
→ Create Invoice
→ Select Customer
→ Add Product
→ Save & Send
```

## 2. Minimalkan form

Gunakan:

- Modal
- Inline editing
- Dropdown
- Quick Add

## 3. Status harus jelas

```text
PAID
SENT
OVERDUE
DRAFT
```

## 4. Search tersedia di seluruh modul utama

## 5. PDF profesional

## 6. Mobile responsive

Halaman invoice dan quote harus nyaman dibuka dari smartphone.

---

# 53. Prinsip Arsitektur Final

Aplikasi harus dibangun dengan konsep:

```text
Customer
    │
    ├──────────────┐
    │              │
    ▼              ▼
 Quote          Subscription
    │              │
    ▼              ▼
Invoice ←──── Recurring Invoice
    │
    ▼
Payment
    │
    ▼
PAID
    │
    ▼
Email Automation
```

Core engine aplikasi:

> **Customer → Product → Quote → Invoice → Payment**

dan:

> **Subscription → Scheduler → Recurring Invoice → Payment → Email Automation**

---

# 54. Rekomendasi Implementasi

Urutan implementasi yang paling aman:

```text
1. Database & Architecture
2. Authentication & User
3. Company Settings
4. Customer
5. Product
6. Invoice
7. PDF
8. Email
9. Quote
10. Quote → Invoice
11. Payment
12. Paid Automation
13. Subscription
14. Billing Scheduler
15. Reminder Automation
16. Templates
17. Reports
18. Activity Log
19. Security
20. Testing
21. Deployment
22. Monitoring
23. Go Live
```

Jangan mengembangkan payment gateway, customer portal, mobile app, dan accounting integration sebelum core billing stabil.

---

# 55. Definition of Done — Siap Live

Aplikasi dianggap siap production jika seluruh poin berikut terpenuhi:

### Core

- [ ] User dapat login
- [ ] Company dapat dikonfigurasi
- [ ] Customer dapat dibuat
- [ ] Product dapat dibuat
- [ ] One-time product berjalan
- [ ] Subscription product berjalan
- [ ] Quote dapat dibuat
- [ ] Quote dapat dikirim
- [ ] Quote dapat diterima
- [ ] Quote dapat dikonversi menjadi invoice
- [ ] Invoice dapat dibuat
- [ ] Invoice dapat dikirim
- [ ] Invoice PDF berhasil dibuat
- [ ] Payment dapat dicatat
- [ ] Partial payment berjalan
- [ ] Invoice otomatis menjadi PAID saat balance = 0
- [ ] Invoice Paid Email terkirim

### Subscription

- [ ] Subscription dapat dibuat
- [ ] Billing cycle berjalan
- [ ] Next billing dihitung
- [ ] Recurring invoice dibuat otomatis
- [ ] Next billing diperbarui
- [ ] Subscription dapat pause
- [ ] Subscription dapat cancel

### Automation

- [ ] Queue berjalan
- [ ] Scheduler berjalan
- [ ] Invoice reminder berjalan
- [ ] Overdue reminder berjalan
- [ ] Paid email berjalan
- [ ] Email log tersedia

### Template

- [ ] Invoice template tersedia
- [ ] Quote template tersedia
- [ ] Email template tersedia
- [ ] Logo company dapat digunakan
- [ ] PDF tampil profesional

### Security

- [ ] Authentication aman
- [ ] Permission berjalan
- [ ] CSRF protection
- [ ] XSS protection
- [ ] SQL injection protection
- [ ] Rate limiting
- [ ] Audit log

### Production

- [ ] SSL aktif
- [ ] Database backup
- [ ] File backup
- [ ] Queue worker aktif
- [ ] Scheduler aktif
- [ ] Error logging aktif
- [ ] Monitoring aktif
- [ ] Email production sudah diuji
- [ ] PDF production sudah diuji
- [ ] Backup restore sudah diuji

---

# 56. Kesimpulan

Aplikasi ini sebaiknya dibangun sebagai **Billing & Invoice Management System yang ringan**, bukan ERP.

Core workflow:

```text
CUSTOMER
    ↓
PRODUCT
    ↓
┌───────────────┐
│               │
▼               ▼
QUOTE       SUBSCRIPTION
│               │
▼               ▼
INVOICE ← RECURRING INVOICE
│
▼
PAYMENT
│
▼
PAID
│
▼
EMAIL AUTOMATION
```

Stack awal yang direkomendasikan:

```text
Backend      : Laravel
Frontend     : Blade + Livewire + Alpine.js
UI           : Tailwind CSS
Database     : MySQL/MariaDB atau PostgreSQL
Cache/Queue  : Redis
Scheduler    : Laravel Scheduler
Worker       : Supervisor
PDF          : PDF Rendering Engine
Email        : SMTP
Server       : Ubuntu + Nginx/OpenLiteSpeed
```

Tujuan akhir MVP:

> User dapat membuat quote/invoice dengan cepat, mengelola customer dan product, menerima pembayaran, membuat subscription, melakukan recurring billing otomatis, dan mengirim email secara otomatis tanpa membutuhkan proses manual yang rumit.
