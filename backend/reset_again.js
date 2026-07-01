const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'booking_hotel_db',
  multipleStatements: true
});

db.connect((err) => {
  if (err) process.exit(1);
  const query = `
    SET FOREIGN_KEY_CHECKS = 0;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS hotel_facilities;
    DROP TABLE IF EXISTS facilities;
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS bookings;
    DROP TABLE IF EXISTS rooms;
    DROP TABLE IF EXISTS hotels;
    DROP TABLE IF EXISTS users;
    SET FOREIGN_KEY_CHECKS = 1;
  `;
  db.query(query, (err) => {
    if (err) console.error(err);
    console.log('Tables dropped for hard reset.');
    process.exit(0);
  });
});
