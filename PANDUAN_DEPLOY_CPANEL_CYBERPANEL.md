# Panduan Lengkap Deployment: cPanel & CyberPanel (Primary Domain)

Panduan ini menjelaskan langkah demi langkah cara meng-online-kan aplikasi **Invoice Management System** (Laravel 10 + React Vite) pada hosting berbasis **cPanel** dan **CyberPanel (OpenLiteSpeed)** menggunakan **Primary Domain (Domain Utama)**.

---

## Daftar Isi
1. [Persiapan Awal Sebelum Upload (Build Assets)](#1-persiapan-awal-sebelum-upload)
2. [Panduan Deployment di cPanel](#2-panduan-deployment-di-cpanel)
   - [Metode 1: Struktur Aman & Rapi (Rekomendasi)](#metode-1-struktur-aman--rapi-rekomendasi)
   - [Metode 2: Menggunakan .htaccess di public_html](#metode-2-menggunakan-htaccess-di-public_html)
   - [Konfigurasi Database MySQL di cPanel](#konfigurasi-database-mysql-di-cpanel)
   - [Konfigurasi File .env](#konfigurasi-file-env)
   - [Migrasi Database & Storage Link](#migrasi-database--storage-link)
   - [Setup Cron Job Scheduler (Otomasi Tagihan)](#setup-cron-job-scheduler-otomasi-tagihan)
3. [Panduan Deployment di CyberPanel (OpenLiteSpeed)](#3-panduan-deployment-di-cyberpanel-openlitespeed)
   - [Membuat Website & Database](#membuat-website--database-di-cyberpanel)
   - [Upload & Ekstraksi File Project](#upload--ekstraksi-file-project)
   - [Mengubah Document Root di vHost Conf](#mengubah-document-root-di-vhost-conf)
   - [Konfigurasi Rewrite Rules OpenLiteSpeed](#konfigurasi-rewrite-rules-openlitespeed)
   - [Konfigurasi Hak Akses (Permissions)](#konfigurasi-hak-akses-permissions-cyberpanel)
   - [Setup Cron Job di CyberPanel](#setup-cron-job-di-cyberpanel)
   - [Aktivasi SSL Let's Encrypt](#aktivasi-ssl-lets-encrypt)
4. [Aktivasi Lisensi & Pengaturan Awal Sistem](#4-aktivasi-lisensi--pengaturan-awal-sistem)
5. [Troubleshooting & Solusi Masalah Umum](#5-troubleshooting--solusi-masalah-umum)

---

## 1. Persiapan Awal Sebelum Upload

Karena hosting cPanel / CyberPanel sering kali tidak memiliki Node.js atau memori RAM terbatas untuk proses compile, **build aset frontend React dilakukan di komputer lokal Anda terlebih dahulu**.

### Langkah di Komputer Lokal:
1. Pastikan dependensi JavaScript dan PHP terinstal:
   ```bash
   composer install --optimize-autoloader --no-dev
   npm install
   ```
2. Jalankan build produksi:
   ```bash
   npm run build
   ```
   *Pastikan folder `public/build/` terbentuk dan berisi file CSS/JS hasil kompilasi.*

3. Buat file arsip **ZIP** dari folder project Anda:
   - **FILE/FOLDER YANG DI-ZIP**:
     - `app/`
     - `bootstrap/`
     - `config/`
     - `database/`
     - `public/` (termasuk folder `public/build/`)
     - `resources/`
     - `routes/`
     - `storage/`
     - `vendor/`
     - `.env.example`
     - `artisan`
     - `composer.json`
   - **JANGAN DI-ZIP (Kecualikan)**:
     - `node_modules/` (ukuran besar ~300MB dan tidak dibutuhkan di server PHP)
     - `.git/`
     - File `.env` lokal Anda

---

## 2. Panduan Deployment di cPanel

Pada cPanel, domain utama (*primary domain*) diarahkan secara default ke folder:
`/home/username/public_html`

### Metode 1: Struktur Aman & Rapi (Rekomendasi)
*Metode ini memisahkan file inti Laravel dari direktori publik web sehingga file `.env` dan kode backend tidak bisa diakses langsung lewat browser.*

```
/home/username/
├── invoice-app/          <-- Letakkan semua file Laravel di sini
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── storage/
│   ├── vendor/
│   ├── .env
│   └── ...
└── public_html/          <-- Letakkan HANYA isi dari folder public/ di sini
    ├── build/
    ├── .htaccess
    ├── index.php
    ├── favicon.ico
    └── robots.txt
```

#### Langkah-langkah:
1. Login ke **cPanel** -> Buka **File Manager**.
2. Di luar folder `public_html` (pada root `/home/username/`), buat folder baru bernama: `invoice-app`.
3. Masuk ke folder `invoice-app`, upload file zip project Anda, lalu klik **Extract**.
4. Buka folder `invoice-app/public/`:
   - Pilih semua file dan folder di dalamnya (`build/`, `.htaccess`, `index.php`, `robots.txt`, dll).
   - Klik menu **Move** (Pindahkan) ke arah `/public_html/`.
5. Buka file `/home/username/public_html/index.php`, klik **Edit**:
   Ubah baris autoload dan bootstrap agar mengarah ke folder `invoice-app`:
   
   *Cari:*
   ```php
   require __DIR__.'/../vendor/autoload.php';
   $app = require_once __DIR__.'/../bootstrap/app.php';
   ```
   *Ubah menjadi:*
   ```php
   require __DIR__.'/../invoice-app/vendor/autoload.php';
   $app = require_once __DIR__.'/../invoice-app/bootstrap/app.php';
   ```
6. Simpan file `index.php`.

---

### Metode 2: Menggunakan .htaccess di public_html
*Jika Anda ingin seluruh project berada di dalam `public_html`.*

1. Upload dan ekstrak seluruh file project langsung ke dalam `/home/username/public_html/`.
2. Buat file `.htaccess` di dalam root `/home/username/public_html/.htaccess` dengan isi:
   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       # Proteksi file sensitif
       RewriteRule ^(\.env|\.git|composer\.(json|lock)|package\.(json|lock)) - [F,L,NC]
       
       # Arahkan semua request ke folder public/
       RewriteRule ^(.*)$ public/$1 [L]
   </IfModule>
   ```

---

### Konfigurasi Database MySQL di cPanel

1. Di cPanel, buka **MySQL® Databases**:
   - Buat database baru (contoh: `usercp_invoice`).
   - Buat user database baru (contoh: `usercp_invuser`) beserta password yang kuat.
   - Di bagian **Add User To Database**, tambahkan user tersebut ke database dengan mencentang **ALL PRIVILEGES**.
2. Catat:
   - Nama Database: `usercp_invoice`
   - User Database: `usercp_invuser`
   - Password Database: `PasswordKuatAnda123!`

---

### Konfigurasi File .env

1. Di File Manager, masuk ke folder aplikasi (`invoice-app` atau `public_html`).
2. Pastikan opsi **Show Hidden Files (dotfiles)** aktif di Pengaturan File Manager cPanel.
3. Duplikat/rename `.env.example` menjadi `.env`, lalu klik **Edit**:
4. Sesuaikan variabel berikut:
   ```ini
   APP_NAME="EIKON Invoice"
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://domainanda.com

   LOG_CHANNEL=daily
   LOG_LEVEL=error

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=usercp_invoice
   DB_USERNAME=usercp_invuser
   DB_PASSWORD=PasswordKuatAnda123!

   SESSION_DRIVER=file
   QUEUE_CONNECTION=sync
   CACHE_STORE=file

   # Konfigurasi Email SMTP (Bisa pakai cPanel Email atau Google Workspace)
   MAIL_MAILER=smtp
   MAIL_HOST=mail.domainanda.com
   MAIL_PORT=465
   MAIL_USERNAME=billing@domainanda.com
   MAIL_PASSWORD=PasswordEmailAnda
   MAIL_ENCRYPTION=ssl
   MAIL_FROM_ADDRESS="billing@domainanda.com"
   MAIL_FROM_NAME="${APP_NAME}"
   ```
5. Simpan file `.env`.

---

### Migrasi Database & Storage Link

#### Opsi A: Menggunakan cPanel Terminal (SSH)
Jika cPanel Anda memiliki menu **Terminal**:
1. Buka menu **Terminal**.
2. Masuk ke folder project:
   ```bash
   cd ~/invoice-app
   ```
3. Generate Application Key (jika belum):
   ```bash
   php artisan key:generate
   ```
4. Jalankan migrasi tabel database:
   ```bash
   php artisan migrate --force
   ```
5. Buat symlink storage publik (untuk logo, stempel, bukti pembayaran):
   ```bash
   php artisan storage:link
   ```
   *(Jika menggunakan Metode 1, pastikan link mengarah ke `/public_html/storage` atau copy folder `storage/app/public` ke `/public_html/storage`)*.
6. Optimasi performa produksi:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

#### Opsi B: Menggunakan phpMyAdmin (Tanpa Akses SSH Terminal)
Jika hosting Anda tidak menyediakan Terminal SSH:
1. Export database dari komputer lokal Anda melalui phpMyAdmin lokal.
2. Di cPanel, buka **phpMyAdmin** -> Pilih database `usercp_invoice` -> Klik tab **Import** -> Pilih file `.sql` Anda.
3. Untuk APP_KEY, Anda bisa copy nilai `APP_KEY=base64:...` dari file `.env` lokal Anda ke file `.env` server.

---

### Setup Cron Job Scheduler (Otomasi Tagihan)

Cron Job sangat penting untuk menjalankan:
- Pembuatan otomatis invoice langganan (*subscription recurring billing*).
- Pengiriman email pengingat jatuh tempo (*payment reminder*).
- Pengecekan grace period lisensi.

1. Di cPanel, cari menu **Cron Jobs**.
2. Pilih pengaturan waktu: **Once Per Minute (* * * * *)**.
3. Masukkan perintah baris perintah berikut (sesuaikan username cPanel Anda):
   ```bash
   /usr/local/bin/php /home/username/invoice-app/artisan schedule:run >> /dev/null 2>&1
   ```
   *Atau jika menggunakan Metode 2:*
   ```bash
   /usr/local/bin/php /home/username/public_html/artisan schedule:run >> /dev/null 2>&1
   ```
4. Klik **Add New Cron Job**.

---

## 3. Panduan Deployment di CyberPanel (OpenLiteSpeed)

CyberPanel menggunakan web server **OpenLiteSpeed** yang sangat cepat untuk aplikasi Laravel.

Struktur default CyberPanel:
`/home/domainanda.com/public_html`

---

### Membuat Website & Database di CyberPanel

1. Login ke dashboard **CyberPanel** (`https://ip-server:8090`).
2. Masuk ke menu **Websites** -> **Create Website**:
   - Select Package: `Default`
   - Select Owner: `admin`
   - Domain Name: Masukkan primary domain Anda (contoh: `invoice.domainanda.com` atau `domainanda.com`)
   - Email: `admin@domainanda.com`
   - Select PHP: Pilih **PHP 8.1** atau **PHP 8.2**
   - Centang: `SSL`, `DKIM Support`, `open_basedir`
   - Klik **Create Website**.
3. Masuk ke menu **Databases** -> **Create Database**:
   - Pilih website yang baru dibuat.
   - Database Name: `invoice`
   - Username: `invuser`
   - Password: Buat password kuat.
   - Klik **Create Database**.

---

### Upload & Ekstraksi File Project

1. Buka menu **Websites** -> **List Websites** -> Klik **File Manager** pada domain Anda.
2. Masuk ke folder `/home/domainanda.com/public_html`.
3. Klik tombol **Upload**, pilih file zip project Anda.
4. Klik kanan pada file zip -> Pilih **Extract**.
5. Salin `.env.example` menjadi `.env`, lalu isi koneksi database dan kredensial aplikasi.

---

### Mengubah Document Root di vHost Conf

Ini adalah langkah paling krusial di CyberPanel agar OpenLiteSpeed membaca folder `public/` Laravel secara langsung tanpa perlu trik `.htaccess` yang rumit:

1. Di CyberPanel, masuk ke menu **Websites** -> **List Websites** -> Klik **Manage** pada domain Anda.
2. Scroll ke bawah, klik menu **vHost Conf**.
3. Cari baris:
   ```apache
   docRoot                   $VH_ROOT/public_html
   ```
4. Ubah menjadi:
   ```apache
   docRoot                   $VH_ROOT/public_html/public
   ```
5. Klik **Save**. OpenLiteSpeed akan otomatis merestart konfigurasi virtual host.

---

### Konfigurasi Rewrite Rules OpenLiteSpeed

OpenLiteSpeed membutuhkan aturan routing agar SPA React dan API Laravel tidak menghasilkan error 404 saat berpindah halaman:

1. Di halaman **Manage Website**, klik menu **Rewrite Rules**.
2. Masukkan aturan berikut:
   ```apache
   # Laravel OpenLiteSpeed Rewrite Rules
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^ index.php [L]
   ```
3. Klik **Save Rewrite Rules**.

---

### Konfigurasi Hak Akses (Permissions) CyberPanel

OpenLiteSpeed berjalan di bawah user sistem `nobody` atau user website terkait (`owner`).

1. Buka SSH Console server (Putty / Terminal):
   ```bash
   cd /home/domainanda.com/public_html
   
   # Berikan hak akses writable ke folder storage & bootstrap/cache
   chmod -R 775 storage bootstrap/cache
   chown -R $(stat -c '%U:%G' .) storage bootstrap/cache
   ```
2. Jalankan migrasi dan storage link:
   ```bash
   /usr/local/lsws/lsphp81/bin/php artisan key:generate
   /usr/local/lsws/lsphp81/bin/php artisan migrate --force
   /usr/local/lsws/lsphp81/bin/php artisan storage:link
   /usr/local/lsws/lsphp81/bin/php artisan config:cache
   /usr/local/lsws/lsphp81/bin/php artisan route:cache
   /usr/local/lsws/lsphp81/bin/php artisan view:cache
   ```

---

### Setup Cron Job di CyberPanel

1. Di menu CyberPanel, buka **Websites** -> **List Websites** -> Klik **Manage** pada domain Anda.
2. Cari dan klik menu **Cron Jobs**.
3. Tambahkan Cron Job baru:
   - Minute: `*`
   - Hour: `*`
   - Day of month: `*`
   - Month: `*`
   - Day of week: `*`
   - Command:
     ```bash
     /usr/local/lsws/lsphp81/bin/php /home/domainanda.com/public_html/artisan schedule:run >> /dev/null 2>&1
     ```
4. Klik **Add**.

---

### Aktivasi SSL Let's Encrypt

1. Masuk ke menu **SSL** -> **Manage SSL** di CyberPanel.
2. Pilih domain Anda, klik **Issue SSL**.
3. Tunggu hingga pesan sukses Let's Encrypt muncul.
4. Website Anda sekarang dapat diakses secara aman melalui `https://domainanda.com`.

---

## 4. Aktivasi Lisensi & Pengaturan Awal Sistem

Setelah aplikasi online dan dapat dibuka di browser:

1. **Akses URL Anda**:
   Buka `https://domainanda.com/login`.
2. **Login Akun Administrator**:
   Gunakan akun admin default atau akun yang dibuat saat seeder.
3. **Buka Menu Setting Lisensi**:
   - Masuk ke menu **Settings** -> Klik tab **Lisensi Aplikasi**.
   - Sistem akan secara otomatis membaca:
     - **Install ID** perangkat hosting/server Anda (berbasis hardware fingerprint dan hostname cPanel/CyberPanel).
     - **Domain Aktif**: `domainanda.com`.
   - Masukkan **Kunci Lisensi (License Key)** resmi Anda (contoh: `INVOICE-XXXX-XXXX-XXXX-XXXX`).
   - Klik **Aktivasi Lisensi Sekarang**.
   - Status akan berubah menjadi badge hijau: **Aktif & Terverifikasi**.
   - File tanda tangan terenkripsi (AES-256) akan otomatis tersimpan aman di `storage/framework/system/.sys_env_signature`.

---

## 5. Troubleshooting & Solusi Masalah Umum

### Q1: Halaman React menghasilkan error "404 Not Found" saat di-refresh pada URL sub-menu (misal `/invoices/create`)?
- **Penyebab**: Web server mencoba mencari file fisik `/invoices/create` alih-alih mengoper ke `index.php`.
- **Solusi**:
  - **cPanel**: Pastikan file `.htaccess` ada di folder publik dan berisi rewrite rule standar Laravel.
  - **CyberPanel**: Buka **Rewrite Rules** di CyberPanel, pastikan aturan `RewriteRule ^ index.php [L]` sudah disimpan, lalu restart OpenLiteSpeed (`systemctl restart lsws`).

### Q2: Error "500 Internal Server Error" atau blank putih saat pertama kali dibuka?
- **Solusi**:
  1. Periksa file log di: `storage/logs/laravel.log`.
  2. Pastikan file `.env` sudah ada dan `APP_KEY` sudah terisi (jalankan `php artisan key:generate`).
  3. Periksa permission folder: pastikan folder `storage/` dan `bootstrap/cache/` memiliki permission `775`.

### Q3: Gambar logo perusahaan atau bukti transfer tidak muncul (404 pada URL `/storage/...`)?
- **Solusi**:
  Jalankan perintah pembuatan symlink:
  ```bash
  php artisan storage:link
  ```
  Jika menggunakan cPanel shared hosting tanpa symlink: buat folder `storage` di dalam `public_html` dan arahkan secara manual atau buat symlink via PHP script kecil:
  ```php
  <?php symlink('/home/username/invoice-app/storage/app/public', '/home/username/public_html/storage'); ?>
  ```

### Q4: Ekstensi PHP apa saja yang wajib aktif?
Pastikan ekstensi berikut aktif di **Select PHP Version** (cPanel) atau modul LiteSpeed (CyberPanel):
- `bcmath`
- `ctype`
- `curl`
- `dom` / `xml`
- `fileinfo` (wajib untuk upload logo & bukti transfer)
- `gd` atau `imagick` (wajib untuk export PDF invoice & quote)
- `mbstring`
- `openssl`
- `pdo_mysql`
- `tokenizer`
- `zip`
