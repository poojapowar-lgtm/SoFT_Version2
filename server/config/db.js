const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "test@2025",
  database: "mit_admin",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("DB Connection Error:", err);
    return;
  }

  console.log("MySQL Pool Connected...");
  connection.release();
});

module.exports = db;
 