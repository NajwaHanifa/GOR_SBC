# GOR SBC (Gelanggang Olahraga SBC) - Sistem Pemesanan Meja Pingpong & Website Resmi

Website resmi dan sistem booking online untuk **GOR SBC (PTM SBC)** yang berlokasi di **Jl. Brigif No.55, RT.1/RW.1, Cipedak, Kec. Jagakarsa, Kota Jakarta Selatan, DKI Jakarta 12630**.

Aplikasi ini mencakup:
- **Website Publik & Media Informasi** (Editorial Olahraga dengan identitas Biru `#0080FF` & Putih).
- **Sistem Pemesanan Meja Pingpong** (Meja 1 & Meja 2 Standar Turnamen).
- **Sistem Booking Turnamen** (Flat Rp1.500.000 untuk 2 meja, 08.00–20.00 WIB setiap hari).
- **Pembayaran Transfer Bank BCA** dengan batas waktu 30 menit (Countdown Timer) dan upload bukti bayar.
- **Autentikasi Pengguna & Profil** dengan nomor telepon (+62 normalized) dan riwayat booking.
- **Dashboard Administrator Lengkap**:
  - Ringkasan Metrik & Statistik Pendapatan
  - Verifikasi Pembayaran & Bukti Transfer
  - Manajemen Booking & Pembatalan
  - Manajemen Meja & Blokir Perawatan (Maintenance)
  - Pengelolaan Galeri Foto (Upload, Reorder, Hapus, Foto Utama)
  - Pengaturan GOR (Rekening BCA, Tarif, Jam Operasional)
  - Laporan Keuangan & Ekspor CSV

---

## 1. Teknologi yang Digunakan

- **Frontend**: React JS dengan Vite & React Router v7
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";`)
- **Backend & Database**: Supabase (PostgreSQL dengan Row Level Security & Atomic Booking RPC Function)
- **Autentikasi**: Supabase Auth / Phone Auth dengan format +62
- **File Storage**: Supabase Storage (`payment-proofs`, `gallery-photos`)
- **Hosting Target**: Vercel / Cloud Run

---

## 2. Kredensial Akun Bawaan (Demo & Pengujian)

Untuk memudahkan pengujian semua skenario tanpa registrasi manual terlebih dahulu:

### Akun Administrator (Dashboard Admin):
- **URL Login Admin**: `/admin/login` (atau klik tombol *Portal Administrator* di Footer)
- **Nomor Telepon**: `081234567890` (atau `+6281234567890`)
- **Kata Sandi**: `adminSBC2026!`

### Akun Pelanggan Demo:
- **Nomor Telepon**: `081299887766`
- **Kata Sandi**: `userSBC2026!`

*(Anda juga dapat mendaftar akun baru dengan nomor telepon Indonesia Anda sendiri di `/register`).*

---

## 3. Ketentuan Jadwal Operasional & Tarif

### A. Booking Reguler (Per Jam)
- **1 Meja**: Rp50.000 / jam
- **2 Meja Sekaligus**: Rp100.000 / jam
- **Jadwal Operasional Umum**:
  - **Senin, Kamis, Jumat**: 08.00 – 16.00 WIB
  - **Selasa, Rabu**: 12.00 – 16.00 WIB
  - **Sabtu & Minggu**: 12.00 – 16.00 WIB

### B. Tournament Booking
- **Tarif Flat**: Rp1.500.000 per hari
- **Meja**: Otomatis kedua meja (Meja 1 & Meja 2)
- **Jadwal**: Tersedia setiap hari (Senin s.d. Minggu), mulai pukul 08.00 s.d. 20.00 WIB

---

## 4. Cara Menjalankan Aplikasi Secara Lokal

1. **Clone repository dan buka direktori proyek**:
   ```bash
   cd gor-sbc
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

4. **Build untuk produksi**:
   ```bash
   npm run build
   ```

---

## 5. Konfigurasi Database Supabase

File migrasi database PostgreSQL lengkap telah disediakan pada:
`/supabase/schema.sql`

### Langkah Setup di Supabase:
1. Buat proyek baru di [Supabase Console](https://supabase.com).
2. Buka menu **SQL Editor** pada sidebar kiri.
3. Tempel seluruh isi file `supabase/schema.sql`.
4. Klik **Run** untuk membuat tabel (`profiles`, `user_roles`, `tables`, `bookings`, `booking_tables`, `payments`, `gallery_photos`, `settings`), kebijakan RLS, relasi, dan fungsi atomik `create_booking_atomic(...)`.
5. Buat Storage Bucket:
   - `payment-proofs` (Private/Authenticated)
   - `gallery-photos` (Public)
6. Masukkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` ke file `.env` proyek Anda.

---

## 6. Deployment ke Vercel

1. Push kode ke GitHub / GitLab.
2. Buka [Vercel Dashboard](https://vercel.com) dan impor repository ini.
3. Framework Preset: **Vite**.
4. Masukkan Environment Variables:
   - `VITE_SUPABASE_URL`: URL Supabase Anda
   - `VITE_SUPABASE_ANON_KEY`: Anon Public Key Supabase Anda
5. Klik **Deploy**.
