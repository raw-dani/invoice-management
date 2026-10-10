# Invoice Management System

Aplikasi invoice management berbasis Laravel API dan React TypeScript untuk mengelola customer, product, invoice, quote, payment, subscription, billing scheduler, email template, laporan, dan audit activity.

## Stack

- Backend: Laravel 10, PHP 8.1+
- Frontend: React 18, TypeScript, Vite
- Database: MySQL 8 atau MariaDB
- UI: Tailwind CSS
- Auth: Laravel Sanctum Bearer token
- Data: TanStack Query dan Axios
- Form: React Hook Form
- PDF: `barryvdh/laravel-dompdf`
- Queue/cache: sync/file untuk local, Redis direkomendasikan untuk production

## Fitur

### Core billing

- Register, login, logout, Bearer token authentication
- Multi-company isolation berbasis `company_id`
- Role `owner`, `admin`, `staff`, dan `viewer`
- Customer CRUD dan auto-number `CUST-XXXXX`
- Product CRUD dan auto-SKU `PRD-XXXXX`
- Invoice CRUD, discount, tax, balance, status transition, duplicate, dan PDF
- Quote CRUD, lifecycle, conversion ke invoice, dan PDF
- Payment recording, partial payment, reverse payment, payment history, dan receipt
- Subscription CRUD, pause/resume/cancel, dan recurring invoice
- Billing scheduler dan queued invoice email

### Operations

- Dashboard summary, MRR, overdue, recent invoice, dan upcoming billing
- Global search invoice, quote, customer, product, dan subscription
- Email template editor dan delivery logs
- PDF template catalog dan default selection
- Activity log dan audit timeline
- Reports revenue, invoice, customer, dan subscription
- Company, invoice, quote, email, dan payment settings
- User management dan role assignment
- Notification center dengan unread badge
- Currency catalog dan tax rate catalog

## Role dan akses

| Role | Akses umum |
| --- | --- |
| Owner | Semua fitur, user management, settings, billing |
| Admin | Operasional, settings, dan user non-owner |
| Staff | Customer, product, quote, invoice, payment |
| Viewer | Akses baca sesuai resource yang diizinkan |

Endpoint settings mutation, user management, dan test email dibatasi ke `owner`/`admin`. Semua resource dibatasi ke company user yang sedang login.

## Prasyarat

- PHP 8.1+
- Composer 2
- Node.js 18+ dan npm
- MySQL 8/MariaDB
- PHP extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`
- Production: Redis, Supervisor, cron, Nginx/Apache, dan HTTPS

## Menjalankan di local

### Install dependency

```bash
composer install
npm install
```

### Environment

```bash
cp .env.example .env
php artisan key:generate
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

Contoh `.env`:

```env
APP_NAME="Invoice Management"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=invoice_management
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=sync
MAIL_MAILER=log
```

Buat database:

```sql
CREATE DATABASE invoice_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Migration dan seed

```bash
php artisan migrate
php artisan db:seed
```

Seeder menyediakan currency, tax rate, PDF template, dan email template default. Tidak ada akun demo hardcoded; gunakan halaman register atau API register.

### Jalankan aplikasi

Terminal 1:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Terminal 2:

```bash
npm run dev
```

Buka `http://localhost:5173`. Vite meneruskan `/api` ke Laravel di `http://localhost:8000`.

Build frontend production:

```bash
npm run build
php artisan serve --host=127.0.0.1 --port=8000
```

## Command penting

```bash
php artisan route:list
php artisan schedule:list
php artisan billing:process --date=2026-09-06
php artisan demo:seed       # Muat data demo lengkap untuk presentasi klien
php artisan demo:clear      # Hapus seluruh data demo (khusus data demo bertanda is_demo)
php artisan queue:work
php artisan optimize:clear
php artisan test
npm run typecheck
npm run build
```

## Scheduler dan queue

Scheduler mendaftarkan `billing:process` setiap hari pukul `00:05`. Tambahkan cron berikut di server:

```cron
* * * * * cd /var/www/invoice-management && php artisan schedule:run >> /dev/null 2>&1
```

Untuk production gunakan Redis/database queue dan worker. `QUEUE_CONNECTION=sync` hanya cocok untuk local.

## API dasar

Semua endpoint protected membutuhkan:

```http
Accept: application/json
Authorization: Bearer YOUR_TOKEN
```

Auth:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Resource utama:

```text
/api/customers
/api/products
/api/invoices
/api/quotes
/api/payments
/api/subscriptions
/api/notifications
/api/activity-logs
/api/reports/*
/api/settings/{group}
```

Health check: `GET /api/health`

## Deploy ke cPanel

1. Buat database/user melalui MySQL Database Wizard.
2. Upload repository ke `/home/USERNAME/invoice-management`.
3. Set document root domain ke:

```text
/home/USERNAME/invoice-management/public
```

4. Jalankan melalui Terminal/SSH:

```bash
cd /home/USERNAME/invoice-management
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate --force
npm install
npm run build
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan optimize
chmod -R 775 storage bootstrap/cache
```

5. Isi `.env` dengan `APP_URL`, database production, SMTP, dan queue.
6. Tambahkan Cron Job:

```bash
* * * * * cd /home/USERNAME/invoice-management && php artisan schedule:run >> /dev/null 2>&1
```

Jika cPanel tidak menyediakan Node.js, jalankan `npm install && npm run build` di local/CI lalu upload folder `public/build`.

## Deploy ke CyberPanel

1. Buat website dengan domain dan PHP 8.1+.
2. Set document root ke folder `public`, contoh:

```text
/home/DOMAIN/public_html/invoice-management/public
```

3. Upload source lalu jalankan:

```bash
cd /home/DOMAIN/public_html/invoice-management
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate --force
npm install && npm run build
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan optimize
chmod -R 775 storage bootstrap/cache
```

4. Atur `.env` dan HTTPS.
5. Tambahkan cron:

```bash
* * * * * cd /home/DOMAIN/public_html/invoice-management && php artisan schedule:run >> /dev/null 2>&1
```

Jika memakai Redis, ubah `QUEUE_CONNECTION=redis` dan jalankan worker melalui Supervisor/Process Manager CyberPanel.

## Deploy ke VPS/Linux server

### Paket Ubuntu

```bash
sudo apt update
sudo apt install -y nginx mysql-server redis-server unzip git curl
sudo apt install -y php8.2-fpm php8.2-cli php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath php8.2-gd
```

Install Composer dan Node.js LTS, lalu:

```bash
sudo mkdir -p /var/www/invoice-management
sudo chown -R $USER:$USER /var/www/invoice-management
cd /var/www/invoice-management
git clone YOUR_REPOSITORY_URL .
composer install --no-dev --optimize-autoloader
npm ci
npm run build
cp .env.example .env
php artisan key:generate --force
```

### MySQL

```bash
sudo mysql
```

```sql
CREATE DATABASE invoice_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'invoice_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON invoice_management.* TO 'invoice_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Isi `.env` production:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://invoice.example.com
DB_DATABASE=invoice_management
DB_USERNAME=invoice_user
DB_PASSWORD=CHANGE_THIS_PASSWORD
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
SESSION_DRIVER=file
```

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan optimize
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Nginx

`/etc/nginx/sites-available/invoice-management`:

```nginx
server {
    listen 80;
    server_name invoice.example.com;
    root /var/www/invoice-management/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/invoice-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d invoice.example.com
```

### Supervisor queue worker

`/etc/supervisor/conf.d/invoice-worker.conf`:

```ini
[program:invoice-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/invoice-management/artisan queue:work redis --sleep=3 --tries=3 --timeout=90
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/invoice-management/storage/logs/worker.log
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start invoice-worker:*
```

Tambahkan cron scheduler:

```cron
* * * * * cd /var/www/invoice-management && php artisan schedule:run >> /dev/null 2>&1
```

## Production checklist

- `APP_DEBUG=false`
- HTTPS aktif dan `APP_URL` benar
- `public` menjadi document root
- Migration dan seeder berhasil
- `storage` dan `bootstrap/cache` writable
- SMTP production sudah diuji
- Queue worker aktif jika memakai Redis/database queue
- Cron scheduler aktif setiap menit
- Backup database dan storage sudah dijadwalkan
- `php artisan optimize` dijalankan setelah perubahan deployment

## Troubleshooting

### Blank page atau asset tidak ditemukan

```bash
npm run build
php artisan optimize:clear
```

Pastikan document root mengarah ke `public`, bukan root project.

### Migration gagal

```bash
php artisan config:clear
php artisan migrate:status
```

Periksa `.env`, kredensial MySQL, dan extension `pdo_mysql`.

### Email tidak terkirim

Periksa `MAIL_*`, jalankan queue worker bila queue bukan `sync`, dan lihat `storage/logs/laravel.log` serta email logs.

### Scheduler tidak membuat invoice

```bash
php artisan schedule:list
php artisan billing:process --date=YYYY-MM-DD
```

Pastikan subscription aktif, `next_billing_date` sudah jatuh tempo, migration sudah dijalankan, dan worker aktif.

## Testing

```bash
php artisan test
npm run typecheck
npm run build
```

Test saat ini mencakup tax calculation, currency formatting, billing date boundary, dan notification API isolation/read flow.

## License

This application is maintained as a private invoice management project. Review your organization’s licensing requirements before distributing it.
