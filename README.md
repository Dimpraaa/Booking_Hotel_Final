# StayLux - Hotel Booking Mobile App

StayLux adalah aplikasi mobile booking hotel profesional dan modern yang dibangun menggunakan **React Native (Expo)** untuk Frontend, serta **Node.js (Express)** dan **MySQL** untuk Backend. Aplikasi ini mendukung siklus pemesanan hotel lengkap mulai dari pencarian, pemilihan kamar, hingga pembayaran menggunakan *payment gateway* sesungguhnya.

## Fitur Utama

- **Authentication System:** Register, Login, Forgot Password, dan manajemen profil pengguna.
- **Advanced Search & Filter:** Pencarian hotel dengan filter canggih berdasarkan lokasi, harga, kategori, dan rating.
- **Dynamic Checkout:** Pemilihan tanggal *Check-in* & *Check-out* secara dinamis menggunakan kalender interaktif dengan kalkulasi harga otomatis.
- **Payment Gateway Integration:** Terintegrasi penuh dengan **Midtrans** (Sandbox) untuk memproses pembayaran nyata (mendukung Virtual Account, GoPay, Kartu Kredit, dll.) menggunakan *native WebView*.
- **E-Ticket Generation:** Tiket elektronik otomatis yang dilengkapi dengan QR Code setelah pembayaran berhasil.
- **Real-time Chat:** Fitur obrolan interaktif bawaan aplikasi.
- **User Dashboard:** Riwayat pesanan (*My Bookings*), manajemen profil, dan hotel favorit.

## Tech Stack

- **Frontend:** React Native, Expo Router, TypeScript, Axios
- **Backend:** Node.js, Express.js, MySQL
- **Payment Gateway:** Midtrans (Snap API)

## Persiapan & Instalasi

### 1. Database MySQL
Pastikan Anda memiliki server MySQL lokal yang berjalan (misal: XAMPP).
```sql
CREATE DATABASE booking_hotel_db;
```
*(Skema tabel otomatis di-generate saat backend dijalankan, atau bisa menggunakan `backend/database/schema.sql`)*

### 2. Backend Setup
Masuk ke folder `backend`, instal dependensi, dan atur kunci rahasia.
```bash
cd backend
npm install
```
Buat file `.env` di dalam folder `backend` dan masukkan konfigurasi Midtrans Anda:
```env
MIDTRANS_SERVER_KEY="Mid-server-xxxxxxxxxxxxxxxxx"
MIDTRANS_CLIENT_KEY="Mid-client-xxxxxxxxxxxxxxxxx"
```
Jalankan server backend:
```bash
node server.js
```
*(Server akan berjalan di `http://localhost:3000`)*

### 3. Frontend (Expo) Setup
Buka terminal baru di root folder (`Booking_Hotel`), lalu jalankan:
```bash
npm install
npx expo start
```
> **Catatan:** Pastikan HP (jika menggunakan Expo Go) dan PC Anda berada di dalam **satu jaringan WiFi yang sama**. Aplikasi sudah dikonfigurasi untuk mendeteksi IP lokal komputer Anda secara otomatis untuk koneksi API.

## Demo Login

Untuk mencoba aplikasi tanpa mendaftar, gunakan akun berikut:
- **Email:** `sarah@gmail.com`
- **Password:** `password123`

## Struktur Direktori
```text
Booking_Hotel/
├── app/                 # Layar Frontend (Expo Router: index, checkout, bookings, chat, dll)
├── assets/              # Gambar, icon, dan font statis
├── backend/             # Source code Backend (Express.js)
│   ├── server.js        # Entry point API
│   ├── .env             # Environment variables (Midtrans Keys)
│   └── database/        # Skema SQL
├── src/                 # Komponen dan Logika Frontend
│   ├── api/             # Konfigurasi Axios & Client API
│   ├── components/      # Komponen UI Reusable (HotelCard, EmptyState, dll)
│   ├── constants/       # Tema dan konfigurasi warna
│   └── store.js         # State management (Global Store)
├── package.json         # Dependensi Frontend
└── README.md            # Dokumentasi ini
```

## Lisensi
Proyek ini dibuat untuk keperluan edukasi dan tugas kuliah.
