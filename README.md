# StayLux - Booking Hotel Mobile App

Aplikasi mobile booking hotel profesional dengan React Native Expo + Node.js Express + MySQL.

## Tech Stack

- **Frontend:** React Native, Expo Router, TypeScript, Axios
- **Backend:** Node.js, Express.js, MySQL

## Cara Menjalankan

### 1. Database MySQL

```sql
CREATE DATABASE booking_hotel_db;
```

### 2. Backend

```bash
cd backend
npm install
npm start
```

Server: `http://localhost:3000`

### 3. Frontend (Expo)

```bash
cd Booking_Hotel-master
npm install
npx expo start
```

> Pastikan HP/emulator dan PC dalam **satu jaringan WiFi**. API URL otomatis dari IP Metro bundler.

## Demo Login

- Email: `sarah@gmail.com`
- Password: `password123`

## Fitur

- Authentication (Register / Login)
- Home dengan kategori & recommended hotels
- Search & filter hotel
- Detail hotel + kamar + fasilitas
- Booking form + kalkulasi harga otomatis
- Simulasi pembayaran (GoPay, OVO, DANA, Bank Transfer, Credit Card)
- E-Ticket dengan QR Code
- Riwayat booking
- Profile + Edit Profile
- Favorite hotels
- Review hotel

## Struktur Folder

```
Booking_Hotel-master/
├── app/                 # Screens (Expo Router)
├── src/
│   ├── api/             # API client
│   ├── components/      # Reusable UI
│   ├── constants/       # Theme & config
│   └── store.js         # Auth state
backend/
├── server.js            # Express API
└── database/schema.sql  # MySQL schema
```
