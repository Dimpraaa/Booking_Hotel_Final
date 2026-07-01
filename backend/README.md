# StayLux Backend API

## Setup

1. Install MySQL and create database:
```sql
CREATE DATABASE booking_hotel_db;
```

2. Install dependencies:
```bash
npm install
```

3. Edit MySQL credentials in `server.js` if needed.

4. Start server:
```bash
npm start
```

Server runs at `http://localhost:3000`

## Demo Account
- Email: `sarah@gmail.com`
- Password: `password123`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register user |
| POST | `/api/login` | Login |
| GET | `/api/hotels` | List hotels (filter: location, name, category, min_price, max_price, rating) |
| GET | `/api/hotels/:id` | Hotel detail + reviews |
| GET | `/api/hotels/:id/rooms` | Available rooms |
| POST | `/api/hotels/:id/reviews` | Add review |
| POST | `/api/hotels/:id/favorite` | Toggle favorite |
| POST | `/api/bookings` | Create booking |
| GET | `/api/users/:userId/bookings` | User bookings |
| PUT | `/api/bookings/:id/pay` | Mark booking paid |
| DELETE | `/api/bookings/:id` | Cancel booking |
| POST | `/api/payments` | Record payment |
| GET | `/api/users/:id` | Get profile |
| PUT | `/api/users/:id` | Update profile |
| GET | `/api/users/:userId/favorites` | List favorites |
