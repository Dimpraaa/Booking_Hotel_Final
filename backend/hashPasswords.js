const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // sesuaikan
  database: "booking_hotel_db",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database. Hashing passwords...");

  db.query("SELECT id, password FROM users", async (err, results) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    for (let user of results) {
      // Check if already hashed (bcrypt hashes start with $2b$ or $2a$)
      if (!user.password.startsWith("$2b$") && !user.password.startsWith("$2a$")) {
        try {
          const hashedPassword = await bcrypt.hash(user.password, 10);
          await new Promise((resolve, reject) => {
            db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          console.log(`User ${user.id} password hashed.`);
        } catch (e) {
          console.error(`Failed to hash password for user ${user.id}:`, e);
        }
      } else {
        console.log(`User ${user.id} password already hashed.`);
      }
    }
    console.log("Migration complete.");
    process.exit(0);
  });
});
