require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const midtransClient = require("midtrans-client");
const cron = require("node-cron");

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Midtrans (Gunakan Server Key Sandbox Anda sendiri nantinya)
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "YOUR_MIDTRANS_SERVER_KEY",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "YOUR_MIDTRANS_CLIENT_KEY",
});
app.use(express.json());

// Konfigurasi koneksi MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // sesuaikan dengan password MySQL Anda
  database: "booking_hotel_db",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database: booking_hotel_db");
  initDatabase();
});

function initDatabase() {
  const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL DEFAULT '',
        password VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        gender VARCHAR(20),
        dob DATE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

  const createHotelsTable = `
      CREATE TABLE IF NOT EXISTS hotels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        rating FLOAT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        category VARCHAR(100) DEFAULT 'Hotel'
      )
    `;

  const createRoomsTable = `
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hotel_id INT NOT NULL,
        room_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        capacity INT NOT NULL,
        stock INT NOT NULL DEFAULT 5,
        image_url VARCHAR(500),
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
      )
    `;

  const createBookingsTable = `
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        hotel_id INT NOT NULL,
        room_id INT NOT NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        guest_name VARCHAR(255) NOT NULL DEFAULT '',
        guest_email VARCHAR(255) NOT NULL DEFAULT '',
        guest_phone VARCHAR(50) NOT NULL DEFAULT '',
        room_count INT NOT NULL DEFAULT 1,
        total_price DECIMAL(10,2) NOT NULL,
        status ENUM('Pending', 'Paid', 'Cancelled') DEFAULT 'Pending',
        snap_token VARCHAR(255),
        payment_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      )
    `;

  const createPaymentsTable = `
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        method VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Paid',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `;

  const createFavoritesTable = `
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        hotel_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
      )
    `;

  const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        hotel_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
      )
    `;

  const createFacilitiesTable = `
      CREATE TABLE IF NOT EXISTS facilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(100) NOT NULL
      )
    `;

  const createHotelFacilitiesTable = `
      CREATE TABLE IF NOT EXISTS hotel_facilities (
        hotel_id INT NOT NULL,
        facility_id INT NOT NULL,
        PRIMARY KEY (hotel_id, facility_id),
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
        FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
      )
    `;

  db.query(createUsersTable, (err) => {
    if (err) console.error("Error users table:", err);
    db.query(createHotelsTable, (err) => {
      if (err) console.error("Error hotels table:", err);
      db.query(createRoomsTable, (err) => {
        if (err) console.error("Error rooms table:", err);
        db.query(createBookingsTable, (err) => {
          if (err) console.error("Error bookings table:", err);
          db.query(createPaymentsTable, (err) => {
            if (err) console.error("Error payments table:", err);
            db.query(createFavoritesTable, (err) => {
              if (err) console.error("Error favorites table:", err);
              db.query(createReviewsTable, (err) => {
                if (err) console.error("Error reviews table:", err);
                db.query(createFacilitiesTable, (err) => {
                  if (err) console.error("Error facilities table:", err);
                  db.query(createHotelFacilitiesTable, (err) => {
                    if (err)
                      console.error("Error hotel_facilities table:", err);
                    migrateSchema(() => {
                      db.query(
                        "SELECT COUNT(*) AS count FROM hotels",
                        (err, rows) => {
                          if (!err && rows[0].count === 0) seedData();
                          // Run migrations for users table safely
                          db.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)", () => {});
                          db.query("ALTER TABLE users ADD COLUMN gender VARCHAR(20)", () => {});
                          db.query("ALTER TABLE users ADD COLUMN dob DATE", () => {});
                          db.query("ALTER TABLE users ADD COLUMN address TEXT", () => {});
                          
                          console.log("Database initialized successfully.");
                        },
                      );
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

/** Add columns that may be missing on older database schemas */
function migrateSchema(done) {
  const migrations = [
    "ALTER TABLE bookings ADD COLUMN guest_name VARCHAR(255) NOT NULL DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN guest_email VARCHAR(255) NOT NULL DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN guest_phone VARCHAR(50) NOT NULL DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN room_count INT NOT NULL DEFAULT 1",
    "ALTER TABLE bookings ADD COLUMN snap_token VARCHAR(255)",
    "ALTER TABLE bookings ADD COLUMN payment_url VARCHAR(500)",
  ];

  let index = 0;
  const runNext = () => {
    if (index >= migrations.length) {
      done();
      return;
    }
    db.query(migrations[index], (err) => {
      if (err && err.code !== "ER_DUP_FIELDNAME") {
        console.error("Migration warning:", err.message);
      }
      index += 1;
      runNext();
    });
  };
  runNext();
}

function seedData() {
  console.log("Seeding StayLux Database...");
  // Seed Users
  const users = [
    ["Sarah Johnson", "sarah@gmail.com", "081234567890", "password123"],
  ];
  db.query(
    "INSERT INTO users (name, email, phone, password) VALUES ?",
    [users],
    (err) => {
      if (err) console.error("Error seeding users:", err);

      // Seed Hotels
      const hotels = [
        [
          "The Ritz-Carlton, Bali",
          "Nusa Dua, Bali",
          "An ultra-luxury resort perched on pristine white sands, offering magnificent suites and villas with breathtaking views.",
          4.9,
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80",
          "Resort",
        ],
        [
          "Pullman Jakarta Central Park",
          "Jakarta Barat, Jakarta",
          "A modern 5-star hotel in Jakarta, directly connected to Central Park Mall. Perfect for business and leisure.",
          4.7,
          "https://picsum.photos/id/1040/1000/600",
          "Hotel",
        ],
        [
          "Padma Hotel Bandung",
          "Ciumbuleuit, Bandung",
          "Nestled in the green hills of Bandung, offering stunning valley views, warm hospitality, and pure relaxation.",
          4.8,
          "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80",
          "Hotel",
        ],
        [
          "Alila Villas Uluwatu",
          "Uluwatu, Bali",
          "Poised on an elevated plateau that meets with limestone cliffs sweeping down to the ocean, the view is spectacular.",
          4.9,
          "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1000&q=80",
          "Villa",
        ],
        [
          "Ascott Jakarta",
          "Jakarta Pusat, Jakarta",
          "Spacious serviced apartments in the golden triangle of Jakarta, perfect for long stays or family trips.",
          4.6,
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80",
          "Apartment",
        ],
      ];

      const insertHotel =
        "INSERT INTO hotels (name, location, description, rating, image_url, category) VALUES ?";
      db.query(insertHotel, [hotels], (err, hotelResults) => {
        if (err) {
          console.error("Error seeding hotels:", err);
          return;
        }

        // Seed Rooms (hotel_id, room_name, price, capacity, stock, image_url)
        const rooms = [
          [
            1,
            "Ocean View Suite",
            2500000.0,
            2,
            5,
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=500&q=80",
          ],
          [
            1,
            "Cliff Villa with Pool",
            5500000.0,
            4,
            2,
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80",
          ],
          [
            2,
            "Deluxe Room",
            1200000.0,
            2,
            10,
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=80",
          ],
          [
            2,
            "Executive Suite",
            2100000.0,
            2,
            4,
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=500&q=80",
          ],
          [
            3,
            "Premier Room",
            1500000.0,
            2,
            8,
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=500&q=80",
          ],
          [
            3,
            "Family Suite",
            3000000.0,
            4,
            3,
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=500&q=80",
          ],
          [
            4,
            "One-Bedroom Pool Villa",
            6000000.0,
            2,
            2,
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=500&q=80",
          ],
          [
            5,
            "Two-Bedroom Executive Apartment",
            2800000.0,
            4,
            5,
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&q=80",
          ],
        ];

        const insertRoom =
          "INSERT INTO rooms (hotel_id, room_name, price, capacity, stock, image_url) VALUES ?";
        db.query(insertRoom, [rooms], (err) => {
          if (err) console.error("Error seeding rooms:", err);

          // Seed Reviews
          const reviews = [
            [
              1,
              1,
              5,
              "Highly recommended! Breathtaking view and incredible service.",
            ],
            [
              1,
              2,
              4,
              "Very comfortable stay, directly connected to the mall. Excellent location.",
            ],
            [
              1,
              3,
              5,
              "Best hotel in Bandung. The pool heating is great and nice mountain breeze.",
            ],
          ];
          db.query(
            "INSERT INTO reviews (user_id, hotel_id, rating, comment) VALUES ?",
            [reviews],
            (err) => {
              if (err) console.error("Error seeding reviews:", err);

              // Seed Facilities
              const facilities = [
                ["WiFi", "wifi"],
                ["Swimming Pool", "pool"],
                ["Restaurant", "restaurant"],
                ["Gym", "fitness-center"],
                ["Spa", "spa"],
                ["Parking", "local-parking"],
              ];
              db.query(
                "INSERT INTO facilities (name, icon) VALUES ?",
                [facilities],
                (err) => {
                  if (err) console.error("Error seeding facilities:", err);

                  // Link Facilities to Hotels
                  const hotelFacilities = [
                    [1, 1],
                    [1, 2],
                    [1, 3],
                    [1, 4],
                    [1, 5],
                    [2, 1],
                    [2, 2],
                    [2, 3],
                    [2, 6],
                    [3, 1],
                    [3, 2],
                    [3, 3],
                    [3, 5],
                    [4, 1],
                    [4, 2],
                    [4, 5],
                    [5, 1],
                    [5, 3],
                    [5, 4],
                    [5, 6],
                  ];
                  db.query(
                    "INSERT INTO hotel_facilities (hotel_id, facility_id) VALUES ?",
                    [hotelFacilities],
                    (err) => {
                      if (err)
                        console.error("Error seeding hotel_facilities:", err);
                      console.log(
                        "StayLux database seeding successfully completed!",
                      );
                    },
                  );
                },
              );
            },
          );
        });
      });
    },
  );
}

// ----------------- AUTH ENDPOINTS -----------------
app.post("/api/register", (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const query =
    "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)";
  db.query(query, [name, email, phone, password], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "User registered successfully" });
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const query =
    "SELECT id, name, email, phone FROM users WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      res.json({ success: true, user: results[0] });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });
});

app.post("/api/reset-password", (req, res) => {
  const { email, newPassword } = req.body;
  const query = "UPDATE users SET password = ? WHERE email = ?";
  db.query(query, [newPassword, email], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Password updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Email not found" });
    }
  });
});

// ----------------- EXPLORE ENDPOINTS -----------------
app.get("/api/hotels", (req, res) => {
  const { location, name, category, min_price, max_price, rating, sort } = req.query;

  let sql = `
    SELECT h.*, COALESCE(MIN(r.price), 1000000) AS price_starts_at 
    FROM hotels h 
    LEFT JOIN rooms r ON h.id = r.hotel_id 
  `;
  const params = [];
  const conditions = [];

  if (location) {
    conditions.push("(h.location LIKE ? OR h.name LIKE ?)");
    params.push(`%${location}%`, `%${location}%`);
  }
  if (name) {
    conditions.push("h.name LIKE ?");
    params.push(`%${name}%`);
  }
  if (category && category !== "All") {
    conditions.push("h.category = ?");
    params.push(category);
  }
  if (rating) {
    conditions.push("h.rating >= ?");
    params.push(Number(rating));
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " GROUP BY h.id ";

  if (min_price || max_price) {
    const havingConditions = [];
    if (min_price) {
      havingConditions.push("price_starts_at >= ?");
      params.push(Number(min_price));
    }
    if (max_price) {
      havingConditions.push("price_starts_at <= ?");
      params.push(Number(max_price));
    }
    sql += " HAVING " + havingConditions.join(" AND ");
  }

  if (sort) {
    if (sort === "price_asc") sql += " ORDER BY price_starts_at ASC";
    else if (sort === "price_desc") sql += " ORDER BY price_starts_at DESC";
    else if (sort === "rating_desc") sql += " ORDER BY h.rating DESC";
  } else {
    sql += " ORDER BY h.id ASC"; // Default sort
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/api/hotels/:id", (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  const hotelQuery = "SELECT * FROM hotels WHERE id = ?";
  db.query(hotelQuery, [id], (err, hotelResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (hotelResults.length === 0)
      return res.status(404).json({ error: "Hotel not found" });

    const hotel = hotelResults[0];

    // Fetch rooms
    const roomsQuery = "SELECT * FROM rooms WHERE hotel_id = ?";
    db.query(roomsQuery, [id], (err, roomsResults) => {
      if (err) return res.status(500).json({ error: err.message });
      hotel.rooms = roomsResults;

      // Fetch reviews
      const reviewsQuery = `
        SELECT r.*, u.name as user_name 
        FROM reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.hotel_id = ? 
        ORDER BY r.created_at DESC
      `;
      db.query(reviewsQuery, [id], (err, reviewsResults) => {
        if (err) return res.status(500).json({ error: err.message });
        hotel.reviews = reviewsResults;

        // Fetch facilities
        const facilitiesQuery = `
          SELECT f.name, f.icon 
          FROM facilities f
          JOIN hotel_facilities hf ON f.id = hf.facility_id
          WHERE hf.hotel_id = ?
        `;
        db.query(facilitiesQuery, [id], (err, facilitiesResults) => {
          if (err) return res.status(500).json({ error: err.message });
          hotel.facilities = facilitiesResults;

          // Check if favorited by user
          if (userId) {
            const favQuery =
              "SELECT id FROM favorites WHERE user_id = ? AND hotel_id = ?";
            db.query(favQuery, [userId, id], (err, favResults) => {
              if (err) return res.status(500).json({ error: err.message });
              hotel.is_favorited = favResults.length > 0;
              res.json(hotel);
            });
          } else {
            hotel.is_favorited = false;
            res.json(hotel);
          }
        });
      });
    });
  });
});

app.post("/api/hotels/:id/reviews", (req, res) => {
  const { id } = req.params;
  const { user_id, rating, comment } = req.body;
  if (!user_id || !rating)
    return res.status(400).json({ error: "Missing required fields" });

  const insertQuery =
    "INSERT INTO reviews (user_id, hotel_id, rating, comment) VALUES (?, ?, ?, ?)";
  db.query(insertQuery, [user_id, id, rating, comment], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const updateRatingQuery = `
      UPDATE hotels 
      SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE hotel_id = ?) 
      WHERE id = ?
    `;
    db.query(updateRatingQuery, [id, id], (err) => {
      if (err) console.error("Error updating hotel rating average:", err);
      res.json({ success: true, message: "Review added successfully" });
    });
  });
});

app.post("/api/hotels/:id/favorite", (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  const checkQuery =
    "SELECT id FROM favorites WHERE user_id = ? AND hotel_id = ?";
  db.query(checkQuery, [user_id, id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      const deleteQuery =
        "DELETE FROM favorites WHERE user_id = ? AND hotel_id = ?";
      db.query(deleteQuery, [user_id, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          success: true,
          is_favorited: false,
          message: "Removed from favorites",
        });
      });
    } else {
      const insertQuery =
        "INSERT INTO favorites (user_id, hotel_id) VALUES (?, ?)";
      db.query(insertQuery, [user_id, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          success: true,
          is_favorited: true,
          message: "Added to favorites",
        });
      });
    }
  });
});

app.get("/api/users/:userId/favorites", (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT h.*, COALESCE(MIN(r.price), 1000000) AS price_starts_at 
    FROM favorites f 
    JOIN hotels h ON f.hotel_id = h.id 
    LEFT JOIN rooms r ON h.id = r.hotel_id 
    WHERE f.user_id = ? 
    GROUP BY h.id
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/api/hotels/:hotelId/rooms", (req, res) => {
  const { hotelId } = req.params;
  const { check_in, check_out } = req.query;

  if (!check_in || !check_out) {
    return res
      .status(400)
      .json({ error: "check_in and check_out dates are required" });
  }

  // Calculate remaining stock based on overlapping bookings
  const query = `
    SELECT 
      r.*,
      (r.stock - COALESCE(
        (SELECT SUM(b.room_count) 
         FROM bookings b 
         WHERE b.room_id = r.id 
         AND b.status != 'Cancelled' 
         AND (b.check_in_date < ? AND b.check_out_date > ?)
        ), 0)
      ) AS available_rooms
    FROM rooms r
    WHERE r.hotel_id = ?
    HAVING available_rooms > 0
  `;

  db.query(query, [check_out, check_in, hotelId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ----------------- BOOKING ENDPOINTS -----------------
app.post("/api/bookings", (req, res) => {
  const {
    user_id,
    hotel_id,
    room_id,
    check_in,
    check_out,
    total_price,
    guest_name,
    guest_email,
    guest_phone,
    room_count,
  } = req.body;

  if (
    !user_id ||
    !hotel_id ||
    !room_id ||
    !check_in ||
    !check_out ||
    !total_price
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const requestedRooms = room_count || 1;

  // Check if there is enough stock for the requested dates
  const checkStockQuery = `
    SELECT 
      r.stock,
      COALESCE(
        (SELECT SUM(b.room_count) 
         FROM bookings b 
         WHERE b.room_id = r.id 
         AND b.status != 'Cancelled' 
         AND (b.check_in_date < ? AND b.check_out_date > ?)
        ), 0) AS booked_rooms
    FROM rooms r
    WHERE r.id = ?
  `;

  db.query(checkStockQuery, [check_out, check_in, room_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: "Room not found." });
    }

    const { stock, booked_rooms } = results[0];
    const available_rooms = stock - booked_rooms;

    if (available_rooms < requestedRooms) {
      return res.status(409).json({
        success: false,
        error: `Not enough rooms available. Only ${available_rooms} room(s) left for selected dates.`,
      });
    }

    const insertQuery =
      'INSERT INTO bookings (user_id, hotel_id, room_id, check_in_date, check_out_date, total_price, status, guest_name, guest_email, guest_phone, room_count) VALUES (?, ?, ?, ?, ?, ?, "Pending", ?, ?, ?, ?)';
    db.query(
      insertQuery,
      [
        user_id,
        hotel_id,
        room_id,
        check_in,
        check_out,
        total_price,
        guest_name || "",
        guest_email || "",
        guest_phone || "",
        requestedRooms,
      ],
      (insertErr, result) => {
        if (insertErr)
          return res.status(500).json({ error: insertErr.message });

        const bookingId = result.insertId;

        // Generate Midtrans Snap Token
        let parameter = {
          transaction_details: {
            order_id: `BOOK-${bookingId}-${Date.now()}`,
            gross_amount: Math.round(total_price),
          },
          credit_card: {
            secure: true,
          },
          customer_details: {
            first_name: guest_name || "Guest",
            email: guest_email || "guest@example.com",
            phone: guest_phone || "",
          },
        };

        snap
          .createTransaction(parameter)
          .then((transaction) => {
            const snapToken = transaction.token;
            const redirectUrl = transaction.redirect_url;
            
            // Save token and URL to db
            db.query("UPDATE bookings SET snap_token = ?, payment_url = ? WHERE id = ?", [snapToken, redirectUrl, bookingId], () => {
              res.json({
                success: true,
                message: "Booking created successfully",
                booking_id: bookingId,
                snap_token: snapToken,
                redirect_url: redirectUrl,
              });
            });
          })
          .catch((e) => {
            console.error("Midtrans Error:", e.message);
            // Fallback if Midtrans setup is incomplete
            res.json({
              success: true,
              message: "Booking created (Midtrans simulated)",
              booking_id: bookingId,
              snap_token: "dummy-token",
            });
          });
      },
    );
  });
});

app.get("/api/users/:userId/bookings", (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT b.*, r.room_name, h.name as hotel_name, h.image_url 
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.put("/api/bookings/:id/pay", (req, res) => {
  const { id } = req.params;
  const query = 'UPDATE bookings SET status = "Paid" WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success: true,
      message: "Payment successful, booking confirmed!",
    });
  });
});

app.delete("/api/bookings/:id", (req, res) => {
  const { id } = req.params;
  const query = 'UPDATE bookings SET status = "Cancelled" WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Booking cancelled successfully" });
  });
});

// ----------------- PAYMENT & WEBHOOK -----------------
app.post("/api/payments/webhook", (req, res) => {
  const notificationJson = req.body;

  snap.transaction
    .notification(notificationJson)
    .then((statusResponse) => {
      let orderId = statusResponse.order_id;
      let transactionStatus = statusResponse.transaction_status;
      let fraudStatus = statusResponse.fraud_status;

      // Extract original booking_id from "BOOK-{id}-{timestamp}"
      const bookingId = orderId.split("-")[1];
      let newBookingStatus = "Pending";

      if (transactionStatus == "capture") {
        if (fraudStatus == "challenge") {
          newBookingStatus = "Pending";
        } else if (fraudStatus == "accept") {
          newBookingStatus = "Paid";
        }
      } else if (transactionStatus == "settlement") {
        newBookingStatus = "Paid";
      } else if (
        transactionStatus == "cancel" ||
        transactionStatus == "deny" ||
        transactionStatus == "expire"
      ) {
        newBookingStatus = "Cancelled";
      } else if (transactionStatus == "pending") {
        newBookingStatus = "Pending";
      }

      // Update Database
      db.query(
        "UPDATE bookings SET status = ? WHERE id = ?",
        [newBookingStatus, bookingId],
        (err) => {
          if (err)
            console.error("Error updating booking status via Webhook:", err);
          else {
            // Log payment if Paid
            if (newBookingStatus === "Paid") {
              const amount = statusResponse.gross_amount;
              const method = statusResponse.payment_type;
              db.query(
                "INSERT INTO payments (booking_id, method, amount, status) VALUES (?, ?, ?, 'Paid')",
                [bookingId, method, amount],
                (err) => {
                  if (err) console.error("Error logging payment:", err);
                },
              );
            }
          }
          res.status(200).json({ status: "OK" });
        },
      );
    })
    .catch((e) => {
      console.error(e);
      // Don't fail the webhook processing immediately for dummy tests without valid signature
      res.status(200).json({ status: "OK", note: "Simulated Webhook Ack" });
    });
});

app.post("/api/payments", (req, res) => {
  // Legacy simulation endpoint, kept for frontend compatibility if not fully using Midtrans
  const { booking_id, method, amount } = req.body;
  if (!booking_id || !method || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const insertQuery =
    "INSERT INTO payments (booking_id, method, amount, status) VALUES (?, ?, ?, 'Paid')";
  db.query(insertQuery, [booking_id, method, amount], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const updateBookingQuery =
      "UPDATE bookings SET status = 'Paid' WHERE id = ?";
    db.query(updateBookingQuery, [booking_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        success: true,
        message: "Payment recorded and booking confirmed!",
      });
    });
  });
});

// ----------------- PROFILE ENDPOINTS -----------------
app.get("/api/users/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT id, name, email, phone, avatar_url, gender, dob, address, created_at FROM users WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ error: "User not found" });
      res.json(results[0]);
    },
  );
});

// API Update User Profile (Full)
app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, avatar_url, gender, dob, address } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  // Handle optional fields gracefully if they are undefined
  const finalAvatar = avatar_url !== undefined ? avatar_url : null;
  const finalGender = gender !== undefined ? gender : null;
  const finalDob = dob !== undefined ? (dob === '' ? null : dob) : null;
  const finalAddress = address !== undefined ? address : null;

  db.query(
    "UPDATE users SET name = ?, email = ?, phone = ?, avatar_url = ?, gender = ?, dob = ?, address = ? WHERE id = ?",
    [name, email, phone, finalAvatar, finalGender, finalDob, finalAddress, userId],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Email already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: "Profile updated successfully" });
    },
  );
});

// ----------------- BACKGROUND JOBS -----------------
// Auto-cancel unpaid bookings after 60 minutes. Runs every 5 minutes.
cron.schedule("*/5 * * * *", () => {
  console.log("Running background job to cancel expired bookings...");
  const cancelQuery = `
    UPDATE bookings 
    SET status = 'Cancelled' 
    WHERE status = 'Pending' 
    AND created_at < NOW() - INTERVAL 1 HOUR
  `;
  db.query(cancelQuery, (err, result) => {
    if (err) console.error("Cron job error:", err);
    else if (result.affectedRows > 0) {
      console.log(`Cancelled ${result.affectedRows} expired booking(s).`);
    }
  });
});

const PORT = 3000;

// Setup HTTP Server & Socket.io
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected to chat:', socket.id);

  socket.on('send_message', (data) => {
    // data format: { userId, text, timestamp }
    console.log('Message received:', data);
    
    // Broadcast back to the user (simulate echo/bot response for now)
    // Real implementation would save to DB and wait for admin response
    setTimeout(() => {
      socket.emit('receive_message', {
        id: Date.now().toString(),
        userId: 'admin',
        text: `Terima kasih! Pesan Anda ("${data.text}") telah diterima oleh Customer Service kami. Kami akan segera membalasnya.`,
        timestamp: new Date().toISOString(),
        isAdmin: true
      });
    }, 1000);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is active.`);
});
